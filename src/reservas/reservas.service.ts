// ═══════════════════════════════════════════════════════════════════
// ReservasService — Lógica de negócio das Reservas
// ═══════════════════════════════════════════════════════════════════
//
// Este Service contém a REGRA MAIS IMPORTANTE do enunciado:
//
//    "Capacidade da aeronave"
//    Um voo NÃO pode ter mais reservas ativas do que a capacidade
//    da aeronave vinculada.
//
// ⚠️ PROBLEMA DE CONCORRÊNCIA (TOCTOU - Time Of Check To Time Of Use):
//    Se duas requisições chegam simultaneamente e cada uma faz:
//      1. contar reservas  → vê 179 (aeronave com capacidade 180)
//      2. criar reserva    → ambas inserem → 181 reservas!
//
//    SOLUÇÃO: envolver a contagem + criação em uma TRANSAÇÃO
//             com isolamento SERIALIZABLE. Se duas transações
//             colidirem, o Postgres aborta uma com erro P2034
//             e o cliente pode tentar de novo.
//
// ⚠️ REGRAS DE UNICIDADE:
//    @@unique([usuarioId, vooId]) → usuário não pode ter 2 reservas no mesmo voo
//    (capturada como P2002 do Prisma → 409 Conflict)
//
//    ⚠️ NÃO existe @@unique em [vooId, assento] — a proteção contra
//    assento duplicado é feita dentro da transação (checando se já
//    existe reserva NÃO-CANCELADA no mesmo assento).

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateStatusReservaDto } from './dto/update-status-reserva.dto';
import { QueryReservaDto } from './dto/query-reserva.dto';
import { StatusReserva, StatusVoo } from '../../generated/prisma/enums';

@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════
  // CRIAR RESERVA (com transação blindada)
  // ═══════════════════════════════════════════════════════════════
  //
  // Fluxo:
  //   1. Verifica se o voo existe e está PROGRAMADO
  //   2. Conta reservas ativas dentro de transação SERIALIZABLE
  //   3. Compara com a capacidade da aeronave
  //   4. Se ok, cria a reserva com usuarioId do JWT
  //
  // ⚠️ usuarioId NUNCA vem do body — vem do @CurrentUser.
  async criar(dto: CreateReservaDto, usuarioId: number) {
    const { vooId, assento } = dto;

    // 1. Verifica se o voo existe
    const voo = await this.prisma.voo.findUnique({
      where: { id: vooId },
      include: { aeronave: true, portao: true },
    });

    if (!voo) {
      throw new NotFoundException('Voo não encontrado');
    }
    if (!voo.aeronave.ativo) {
      throw new BadRequestException(
        'Não é possível reservar: aeronave do voo está inativa',
      );
    }
    if (!voo.portao.ativo) {
      throw new BadRequestException(
        'Não é possível reservar: portão do voo está inativo',
      );
    }

    // 2. Voo precisa estar PROGRAMADO para aceitar novas reservas
    if (voo.status !== StatusVoo.PROGRAMADO) {
      throw new BadRequestException(
        `Não é possível reservar em voo com status ${voo.status}`,
      );
    }

    // 3. Transação SERIALIZABLE — protege contra TOCTOU
    //    Dentro da transação: contar + criar de forma atômica.
    try {
      const reserva = await this.prisma.$transaction(
        async (tx) => {
          // 3.1. Conta reservas ativas (não canceladas) neste voo
          const reservasAtivas = await tx.reserva.count({
            where: {
              vooId,
              status: { not: StatusReserva.CANCELADA },
            },
          });

          // 3.1.1. Verifica se o assento já está ocupado por reserva ativa
          //        (agora que não temos @@unique no banco, a proteção
          //         contra duplicidade de assento vive aqui)
          const assentoOcupado = await tx.reserva.findFirst({
            where: {
              vooId,
              assento,
              status: { not: StatusReserva.CANCELADA },
            },
          });
          if (assentoOcupado) {
            throw new ConflictException('Assento já ocupado neste voo');
          }

          // 3.2. Verifica capacidade
          if (reservasAtivas >= voo.aeronave.capacidade) {
            throw new ConflictException(
              'Aeronave sem assentos disponíveis para este voo',
            );
          }

          // 3.3. Cria a reserva
          return tx.reserva.create({
            data: {
              usuarioId,
              vooId,
              assento,
            },
            include: {
              voo: {
                include: {
                  aeronave: { include: { companhia: true } },
                  portao: true,
                },
              },
            },
          });
        },
        {
          // Serializable: nível mais forte de isolamento
          // Impede anomalias de leitura/escrita concorrentes
          isolationLevel: 'Serializable',
        },
      );

      return reserva;
    } catch (error: any) {
      // ⚠️ CAPTURA DOS ERROS DO PRISMA
      // P2002 → violação de unique constraint (usuário duplicado no voo)
      // P2034 → conflito de transação SERIALIZABLE (tenta de novo)
      if (error?.code === 'P2002') {
        // ═══════════════════════════════════════════════════════
        // ⚠️ IMPORTANTE (Prisma 7 + driver adapter do Postgres)
        // ═══════════════════════════════════════════════════════
        // Diferente do Prisma "clássico", o Prisma 7 com driver
        // adapter NÃO retorna error.meta.target como array.
        // Ele retorna um objeto aninhado assim:
        //
        //   meta: {
        //     driverAdapterError: {
        //       cause: {
        //         constraint: { index: "reservas_usuarioId_vooId_key" }
        //       }
        //     }
        //   }
        //
        // Então lemos o nome do índice violado de lá. O "index"
        // contém o nome real da constraint no Postgres.
        //
        // ⚠️ Também tentamos o formato antigo (meta.target) por
        //    compatibilidade.
        // ═══════════════════════════════════════════════════════

        // 1ª tentativa: formato novo (Prisma 7 + driver adapter)
        const indexNovo: string | undefined =
          error?.meta?.driverAdapterError?.cause?.constraint?.index;

        // 2ª tentativa: formato antigo (array OU string)
        const indexAntigo: string | undefined = Array.isArray(error?.meta?.target)
          ? (error.meta.target as string[]).join('_')
          : (error?.meta?.target as string | undefined);

        // Junta os dois num só valor (o primeiro que vier)
        const nomeConstraint = indexNovo ?? indexAntigo ?? '';

        // A única constraint @@unique que resta é [usuarioId, vooId].
        // A duplicidade de assento é tratada ANTES (na checagem dentro
        // da transação, acima). Aqui, só cai o caso de usuário duplicado.
        if (nomeConstraint.includes('usuarioId')) {
          throw new ConflictException('Você já possui reserva para este voo');
        }

        // Fallback defensivo (não deve acontecer)
        throw new ConflictException('Conflito ao criar reserva');
      }

      if (error?.code === 'P2034') {
        throw new ConflictException(
          'Muitas reservas simultâneas. Tente novamente.',
        );
      }

      // Se for uma exceção nossa (ConflictException já lançada), repassa
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LISTAR "MINHAS RESERVAS" — do usuário autenticado
  // ═══════════════════════════════════════════════════════════════
  //
  // ⚠️ Só retorna reservas do usuário do JWT (filtra por usuarioId).
  //    O usuário NÃO consegue ver reservas de terceiros.
  async listarMinhas(usuarioId: number) {
    return this.prisma.reserva.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
      include: {
        voo: {
          include: {
            aeronave: { include: { companhia: true } },
            portao: true,
          },
        },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // LISTAR TODAS — para OPERATOR e ADMIN
  // ═══════════════════════════════════════════════════════════════
  async listarTodas(query: QueryReservaDto) {
    const { page = 1, limit = 10, order = 'desc', orderBy = 'criadoEm', status, vooId, usuarioId } = query;

    const where: any = {};
    if (status) where.status = status;
    if (vooId) where.vooId = vooId;
    if (usuarioId) where.usuarioId = usuarioId;

    const colunasPermitidas = ['id', 'criadoEm', 'status', 'assento'];
    const coluna = colunasPermitidas.includes(orderBy) ? orderBy : 'criadoEm';

    const [total, data] = await Promise.all([
      this.prisma.reserva.count({ where }),
      this.prisma.reserva.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [coluna]: order },
        include: {
          usuario: { select: { id: true, nome: true, email: true } },
          voo: {
            include: {
              aeronave: { include: { companhia: true } },
              portao: true,
            },
          },
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
  // BUSCAR POR ID (com verificação de propriedade)
  // ═══════════════════════════════════════════════════════════════
  //
  // ⚠️ Regra do enunciado:
  //    "Usuários não podem manipular recursos de terceiros apenas
  //     alterando IDs na requisição."
  //
  // Aqui, o PASSENGER só enxerga a própria reserva. OPERATOR e ADMIN
  // enxergam qualquer uma.
  async buscarPorId(id: number, usuarioId: number, role: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        voo: {
          include: {
            aeronave: { include: { companhia: true } },
            portao: true,
          },
        },
      },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva não encontrada');
    }

    // PASSENGER só pode ver a própria reserva
    if (role === 'PASSENGER' && reserva.usuarioId !== usuarioId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar esta reserva',
      );
    }

    return reserva;
  }

  // ═══════════════════════════════════════════════════════════════
  // CANCELAR MINHA RESERVA
  // ═══════════════════════════════════════════════════════════════
  async cancelarMinha(id: number, usuarioId: number) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } });

    if (!reserva) {
      throw new NotFoundException('Reserva não encontrada');
    }

    // Só pode cancelar a própria reserva
    if (reserva.usuarioId !== usuarioId) {
      throw new ForbiddenException(
        'Você não tem permissão para cancelar esta reserva',
      );
    }

    // Só pode cancelar se estiver CONFIRMADA
    if (reserva.status !== StatusReserva.CONFIRMADA) {
      throw new BadRequestException(
        `Não é possível cancelar reserva com status ${reserva.status}`,
      );
    }

    return this.prisma.reserva.update({
      where: { id },
      data: { status: StatusReserva.CANCELADA },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // MUDAR STATUS (OPERATOR/ADMIN — usado no check-in)
  // ═══════════════════════════════════════════════════════════════
  //
  // Transições válidas:
  //   CONFIRMADA → UTILIZADA (check-in)
  //   CONFIRMADA → CANCELADA
  //   UTILIZADA  → (final)
  //   CANCELADA  → (final)
  async atualizarStatus(id: number, dto: UpdateStatusReservaDto) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } });

    if (!reserva) {
      throw new NotFoundException('Reserva não encontrada');
    }

    const transicoesValidas: Record<StatusReserva, StatusReserva[]> = {
      [StatusReserva.CONFIRMADA]: [
        StatusReserva.UTILIZADA,
        StatusReserva.CANCELADA,
      ],
      [StatusReserva.UTILIZADA]: [],
      [StatusReserva.CANCELADA]: [],
    };

    if (!transicoesValidas[reserva.status].includes(dto.status)) {
      throw new BadRequestException(
        `Transição de ${reserva.status} para ${dto.status} não é permitida`,
      );
    }

    return this.prisma.reserva.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ANEXAR DOCUMENTO — upload de arquivo da reserva
  // ═══════════════════════════════════════════════════════════════
  //
  // Fluxo:
  //   1. Busca a reserva (404 se não existir)
  //   2. Só o dono da reserva pode anexar (403 se for de terceiro)
  //   3. Se já existia um documento, apaga o antigo do disco
  //   4. Salva o novo caminho em reserva.documentoUrl
  async anexarDocumento(
    reservaId: number,
    usuarioId: number,
    arquivo: Express.Multer.File,
  ) {
    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva não encontrada');
    }

    // Só o dono da reserva pode anexar documento
    if (reserva.usuarioId !== usuarioId) {
      throw new ForbiddenException(
        'Você não tem permissão para anexar documento nesta reserva',
      );
    }

    // Se já tinha documento, apaga o antigo (evita lixo no disco)
    if (reserva.documentoUrl) {
      const caminhoAntigo = join(process.cwd(), reserva.documentoUrl);
      await unlink(caminhoAntigo).catch(() => {
        // Ignora se arquivo não existir mais
      });
    }

    // Caminho público salvo no banco (relativo, pra servir via /uploads/)
    const documentoUrl = `uploads/${arquivo.filename}`;

    return this.prisma.reserva.update({
      where: { id: reservaId },
      data: { documentoUrl },
      include: {
        voo: {
          include: {
            aeronave: { include: { companhia: true } },
            portao: true,
          },
        },
      },
    });
  }
}