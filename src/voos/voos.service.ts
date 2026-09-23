// ═══════════════════════════════════════════════════════════════════
// VoosService — Lógica de negócio dos Voos
// ═══════════════════════════════════════════════════════════════════
//
// REGRA CRÍTICA: CONFLITO DE PORTÃO
//   Dois voos NÃO podem usar o mesmo portão no mesmo horário.
//
//   Como funciona a detecção:
//   - Dois voos conflitam se os intervalos [partida, chegada] se sobrepõem
//   - Sobreposição: inicio_A < fim_B AND inicio_B < fim_A
//   - Voos com status CANCELADO são ignorados (não ocupam portão)
//
// OUTRAS REGRAS:
//   - numero do voo é único
//   - dataChegada > dataPartida
//   - aeronave e portão precisam existir (validação de FK)
//   - Transições de status: PROGRAMADO → EMBARCANDO → DECOLADO
//                         qualquer um → CANCELADO (exceto DECOLADO)
//   - DECOLADO é estado final (só pode ir para si mesmo ou nada)

import {
  BadRequestException,
  ConflictException,
  GatewayTimeoutException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVooDto } from './dto/create-voo.dto';
import { UpdateVooDto } from './dto/update-voo.dto';
import { UpdateStatusVooDto } from './dto/update-status-voo.dto';
import { QueryVooDto } from './dto/query-voo.dto';
import { StatusVoo } from '../../generated/prisma/enums';

// ═══════════════════════════════════════════════════════════════
// Mapa IATA → nome amigável da cidade
// ═══════════════════════════════════════════════════════════════
//
// A API de geocoding NÃO conhece códigos IATA (GIG, GRU, BSB).
// Se mandarmos "GIG" direto, ela acha "Gīg" no Irã. 🤦
//
// Solução: traduzimos a sigla pro nome da cidade antes de buscar.
// Se a sigla não estiver no mapa, mandamos o texto puro (funciona
// quando o usuário já cadastra o voo com o nome da cidade).
const IATA_PARA_CIDADE: Record<string, string> = {
  GRU: 'São Paulo',
  CGH: 'São Paulo',
  VCP: 'Campinas',
  GIG: 'Rio de Janeiro',
  SDU: 'Rio de Janeiro',
  BSB: 'Brasília',
  SSA: 'Salvador',
  REC: 'Recife',
  FOR: 'Fortaleza',
  POA: 'Porto Alegre',
  CWB: 'Curitiba',
  BEL: 'Belém',
  MAO: 'Manaus',
  FLN: 'Florianópolis',
  NAT: 'Natal',
  MCZ: 'Maceió',
  VIX: 'Vitória',
  GYN: 'Goiânia',
};

@Injectable()
export class VoosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // HELPER: Verificar conflito de portão
  // ═══════════════════════════════════════════════════════════════
  //
  // Recebe: portaoId, dataPartida, dataChegada
  // Retorna: true se há conflito, false se está livre
  //
  // "idIgnorar": quando estamos editando o próprio voo, não podemos
  //              considerar ele mesmo como conflito
  private async existeConflitoPortao(
    portaoId: number,
    dataPartida: Date,
    dataChegada: Date,
    idIgnorar?: number,
  ): Promise<boolean> {
    const where: any = {
      portaoId,
      status: { not: StatusVoo.CANCELADO }, // Ignora cancelados
      // Sobreposição de intervalos: inicio_A < fim_B AND inicio_B < fim_A
      dataPartida: { lt: dataChegada }, // partida do existente < chegada do novo
      dataChegada: { gt: dataPartida }, // chegada do existente > partida do novo
    };

    // Se for edição, ignora o próprio voo
    if (idIgnorar) {
      where.NOT = { id: idIgnorar };
    }

    const conflito = await this.prisma.voo.findFirst({ where });
    return !!conflito;
  }

  // ═══════════════════════════════════════════════════════════════
  // LISTAR TODOS
  // ═══════════════════════════════════════════════════════════════
    async listarTodos(query: QueryVooDto) {
    const { page = 1, limit = 10, order = 'asc', orderBy = 'id', status, origem, destino } = query;

    // Monta filtros dinamicamente (só adiciona se vier na query)
    const where: any = {};
    if (status) where.status = status;
    if (origem) where.origem = { contains: origem, mode: 'insensitive' };
    if (destino) where.destino = { contains: destino, mode: 'insensitive' };

    // Ordenação: aceita só colunas conhecidas pra evitar SQL injection
    const colunasPermitidas = ['id', 'numero', 'dataPartida', 'dataChegada', 'status', 'criadoEm'];
    const coluna = colunasPermitidas.includes(orderBy) ? orderBy : 'id';

    // Roda count + findMany em paralelo (economiza tempo)
    const [total, data] = await Promise.all([
      this.prisma.voo.count({ where }),
      this.prisma.voo.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [coluna]: order },
        include: {
          aeronave: {
            include: {
              companhia: { select: { id: true, nome: true, codigoIATA: true } },
            },
          },
          portao: true,
          _count: { select: { reservas: true } },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // BUSCAR POR ID
  // ═══════════════════════════════════════════════════════════════
  async buscarPorId(id: number) {
    const voo = await this.prisma.voo.findUnique({
      where: { id },
      include: {
        aeronave: {
          include: {
            companhia: { select: { id: true, nome: true, codigoIATA: true } },
          },
        },
        portao: true,
        _count: { select: { reservas: true } },
      },
    });

    if (!voo) throw new NotFoundException('Voo não encontrado');
    return voo;
  }

  // ═══════════════════════════════════════════════════════════════
  // CRIAR
  // ═══════════════════════════════════════════════════════════════
  async criar(dto: CreateVooDto) {
    const { numero, origem, destino, dataPartida, dataChegada, aeronaveId, portaoId } = dto;

    // 1. Número deve ser único
    const numeroExistente = await this.prisma.voo.findUnique({
      where: { numero },
    });
    if (numeroExistente) {
      throw new BadRequestException('Número do voo já cadastrado');
    }

    // 2. Converter datas
    const partida = new Date(dataPartida);
    const chegada = new Date(dataChegada);

    // 3. Chegada deve ser depois da partida
    if (chegada <= partida) {
      throw new BadRequestException(
        'Data de chegada deve ser posterior à data de partida',
      );
    }
        // 3.1. Data de partida não pode ser no passado
    if (partida < new Date()) {
      throw new BadRequestException(
        'Data de partida não pode ser no passado',
      );
    }

    // 4. Aeronave precisa existir
    const aeronave = await this.prisma.aeronave.findUnique({
      where: { id: aeronaveId },
    });
    if (!aeronave) {
      throw new BadRequestException('Aeronave não encontrada');
    }
    if (!aeronave.ativo) {
      throw new BadRequestException('Aeronave está inativa');
    }

    // 5. Portão precisa existir
    const portao = await this.prisma.portao.findUnique({
      where: { id: portaoId },
    });
    if (!portao) {
      throw new BadRequestException('Portão não encontrado');
    }
    if (!portao.ativo) {
      throw new BadRequestException('Portão está inativo');
    }

    // 6. REGRA: Conflito de portão
    const temConflito = await this.existeConflitoPortao(portaoId, partida, chegada);
    if (temConflito) {
      throw new ConflictException(
        'Este portão já está ocupado por outro voo neste intervalo',
      );
    }

    // 7. Criar voo (status inicial é PROGRAMADO, definido no schema)
    return this.prisma.voo.create({
      data: {
        numero,
        origem,
        destino,
        dataPartida: partida,
        dataChegada: chegada,
        aeronaveId,
        portaoId,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ATUALIZAR (parcial)
  // ═══════════════════════════════════════════════════════════════
  async atualizar(id: number, dto: UpdateVooDto) {
    // 1. Verifica se existe
    const vooExistente = await this.buscarPorId(id);

    // 2. Se estiver mudando número, verifica duplicidade
    if (dto.numero && dto.numero !== vooExistente.numero) {
      const numeroExistente = await this.prisma.voo.findUnique({
        where: { numero: dto.numero },
      });
      if (numeroExistente) {
        throw new BadRequestException('Número do voo já cadastrado');
      }
    }

    // 3. Determina valores finais de datas (usando os atuais se não vier no dto)
    const partida = dto.dataPartida ? new Date(dto.dataPartida) : vooExistente.dataPartida;
    const chegada = dto.dataChegada ? new Date(dto.dataChegada) : vooExistente.dataChegada;

    // 4. Chegada deve ser depois da partida
    if (chegada <= partida) {
      throw new BadRequestException(
        'Data de chegada deve ser posterior à data de partida',
      );
    }

    // 5. Determina portão final
    const portaoId = dto.portaoId ?? vooExistente.portaoId;

    // 6. Se estiver mudando portão, verifica se existe
    if (dto.portaoId) {
      const portao = await this.prisma.portao.findUnique({
        where: { id: dto.portaoId },
      });
      if (!portao) {
        throw new BadRequestException('Portão não encontrado');
      }
      if (!portao.ativo) {
        throw new BadRequestException('Portão está inativo');
      }
    }

    // 7. Se estiver mudando aeronave, verifica se existe
    if (dto.aeronaveId) {
      const aeronave = await this.prisma.aeronave.findUnique({
        where: { id: dto.aeronaveId },
      });
      if (!aeronave) {
        throw new BadRequestException('Aeronave não encontrada');
      }
      if (!aeronave.ativo) {
        throw new BadRequestException('Aeronave está inativa');
      }
    }

    // 8. REGRA: Conflito de portão (ignorando o próprio voo)
    const temConflito = await this.existeConflitoPortao(
      portaoId,
      partida,
      chegada,
      id,
    );
    if (temConflito) {
      throw new ConflictException(
        'Este portão já está ocupado por outro voo neste intervalo',
      );
    }

    // 9. Atualizar
    return this.prisma.voo.update({
      where: { id },
      data: {
        ...dto,
        dataPartida: partida,
        dataChegada: chegada,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ATUALIZAR STATUS (fluxo de estados)
  // ═══════════════════════════════════════════════════════════════
  //
  // Transições válidas:
  //   PROGRAMADO → EMBARCANDO, CANCELADO
  //   EMBARCANDO → DECOLADO, CANCELADO
  //   DECOLADO   → (final, não muda mais)
  //   CANCELADO  → (final, não muda mais)
  //
  async atualizarStatus(id: number, dto: UpdateStatusVooDto) {
    const voo = await this.buscarPorId(id);

    // Tabela de transições válidas
    const transicoesValidas: Record<StatusVoo, StatusVoo[]> = {
      [StatusVoo.PROGRAMADO]: [StatusVoo.EMBARCANDO, StatusVoo.CANCELADO],
      [StatusVoo.EMBARCANDO]: [StatusVoo.DECOLADO, StatusVoo.CANCELADO],
      [StatusVoo.DECOLADO]: [],
      [StatusVoo.CANCELADO]: [],
    };

    // ⚠️ REGRA EXTRA: se for cancelar, o voo não pode ter reservas ativas.
    // Motivo: cancelar voo com passageiros confirmados deixaria os
    // clientes no prejuízo sem tratamento. O correto é o operador
    // resolver as reservas (cancelar/realocar) antes de cancelar o voo.
    if (dto.status === StatusVoo.CANCELADO) {
      const reservasAtivas = await this.prisma.reserva.count({
        where: {
          vooId: id,
          status: { in: ['CONFIRMADA', 'UTILIZADA'] },
        },
      });
      if (reservasAtivas > 0) {
        throw new ConflictException(
          `Não é possível cancelar o voo: existem ${reservasAtivas} reserva(s) ativa(s)`,
        );
      }
    }    

    // Verifica se a transição é permitida
    if (!transicoesValidas[voo.status].includes(dto.status)) {
      throw new BadRequestException(
        `Transição de ${voo.status} para ${dto.status} não é permitida`,
      );
    }

    return this.prisma.voo.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CONSULTAR CLIMA NO DESTINO (integração externa via HttpService)
  // ═══════════════════════════════════════════════════════════════
  //
  // Fluxo:
  //   1. Busca o voo pelo ID (404 se não existir)
  //   2. Traduz o código IATA do destino em nome de cidade (mapa acima)
  //   3. Chama a API de geocoding com o nome da cidade → lat/lon
  //   4. Chama a API de clima com lat/lon → temperatura + vento
  //   5. Retorna tudo mastigado
  //
  // ⚠️ Tratamento de erro:
  //    - Timeout (o HttpModule configurou WEATHER_TIMEOUT_MS) → 504
  //    - Destino não encontrado pelo geocoding → 404
  //    - Outro erro (rede, API fora) → 503
  //
  // A URL das APIs vem do .env — nada hardcoded.
  async consultarClima(vooId: number) {
    // 1. Voo precisa existir
    const voo = await this.buscarPorId(vooId);

    // 2. Traduz código IATA em nome de cidade (se conhecido)
    const destinoOriginal = voo.destino;
    const destino =
      IATA_PARA_CIDADE[destinoOriginal.toUpperCase()] ?? destinoOriginal;

    const geocodingUrl = this.configService.getOrThrow<string>(
      'WEATHER_GEOCODING_URL',
    );
    const climaUrl = this.configService.getOrThrow<string>('WEATHER_API_URL');

    try {
      // 3. Geocoding: nome da cidade → latitude/longitude
      const geoResponse = await firstValueFrom(
        this.httpService.get(geocodingUrl, {
          params: { name: destino, count: 1, language: 'pt', format: 'json' },
        }),
      );

      const resultados = geoResponse.data?.results;
      if (!resultados || resultados.length === 0) {
        throw new NotFoundException(
          `Não foi possível localizar o destino "${destino}" para consultar o clima`,
        );
      }

      const { latitude, longitude, name, country } = resultados[0];

      // 4. Clima: lat/lon → temperatura, vento, etc.
      const climaResponse = await firstValueFrom(
        this.httpService.get(climaUrl, {
          params: {
            latitude,
            longitude,
            current: 'temperature_2m,wind_speed_10m,weather_code',
            timezone: 'auto',
          },
        }),
      );

      const atual = climaResponse.data?.current;

      // 5. Retorno enxuto (só o que interessa pro domínio)
      return {
        vooId: voo.id,
        destino: {
          original: destinoOriginal,
          pesquisado: destino,
          nome: name,
          pais: country,
          latitude,
          longitude,
        },
        clima: {
          temperaturaC: atual?.temperature_2m ?? null,
          ventoKmh: atual?.wind_speed_10m ?? null,
          codigoClima: atual?.weather_code ?? null,
          observadoEm: atual?.time ?? null,
        },
      };
    } catch (error: any) {
      // Repassa exceções nossas (ex: NotFoundException acima)
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Timeout → 504 Gateway Timeout
      if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
        throw new GatewayTimeoutException(
          'A API externa de clima demorou demais para responder',
        );
      }

      // Qualquer outro erro (API fora, rede) → 503 Service Unavailable
      throw new ServiceUnavailableException(
        'Não foi possível consultar a API de clima no momento',
      );
    }
  }
}