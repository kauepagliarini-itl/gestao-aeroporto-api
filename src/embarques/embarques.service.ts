// ═══════════════════════════════════════════════════════════════════
// EmbarquesService — Lógica de negócio do Embarque
// ═══════════════════════════════════════════════════════════════════
//
// Este Service cobre DUAS regras obrigatórias do enunciado:
//
//   1) EMBARQUE ÚNICO
//      Uma reserva só pode ser embarcada UMA VEZ.
//      O @@unique no schema (reservaId) já impede no banco,
//      mas aqui a gente checa antes pra dar mensagem amigável.
//
//   2) VOO CANCELADO NÃO PERMITE EMBARQUE
//      Se o voo estiver com status CANCELADO, ninguém embarca.
//
//   3) Só permite embarcar quando o voo estiver em EMBARCANDO
//      (regra nossa, conectada ao fluxo de estados do voo:
//       PROGRAMADO → EMBARCANDO → DECOLADO)
//
// ⚠️ QUEM PODE REGISTRAR EMBARQUE?
//    Apenas OPERATOR e ADMIN. Essa restrição é feita no CONTROLLER
//    (via @Roles), não aqui no service. O service assume que quem
//    está chamando já tem permissão.

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmbarqueDto } from './dto/create-embarque.dto';
import { QueryEmbarqueDto } from './dto/query-embarque.dto';
import {
  StatusEmbarque,
  StatusReserva,
  StatusVoo,
} from '../../generated/prisma/enums';

@Injectable()
export class EmbarquesService {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════
  // CRIAR — registrar um embarque
  // ═══════════════════════════════════════════════════════════════
  //
  // Fluxo passo a passo:
  //   1. Busca a reserva (404 se não existir)
  //   2. Verifica se a reserva está CONFIRMADA
  //      → se CANCELADA ou UTILIZADA, rejeita (400)
  //   3. Verifica se o voo está CANCELADO → rejeita (409)
  //   4. Verifica se o voo está em EMBARCANDO → se não, rejeita (400)
  //   5. Verifica se a reserva já foi embarcada → rejeita (409)
  //   6. Cria o embarque com status REALIZADO
  //
  // ⚠️ Ordem importa: rejeitar o CANCELADO antes de checar o EMBARCANDO
  //    garante a mensagem específica do enunciado ("voo cancelado não
  //    permite embarque") em vez de um "voo não está embarcando".
  async criar(dto: CreateEmbarqueDto) {
    const { reservaId, observacao } = dto;

    // 1. Busca a reserva + voo (precisamos do status do voo depois)
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { voo: true },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva não encontrada');
    }

    // 2. Reserva precisa estar CONFIRMADA (não cancelada, não utilizada)
    if (reserva.status !== StatusReserva.CONFIRMADA) {
      throw new BadRequestException(
        `Não é possível embarcar reserva com status ${reserva.status}`,
      );
    }

    // 3. REGRA: Voo cancelado não permite embarque
    //    Esse é um conflito de regra de negócio → 409
    if (reserva.voo.status === StatusVoo.CANCELADO) {
      throw new ConflictException(
        'Voo cancelado não permite embarque',
      );
    }

    // 4. Só permite embarcar se o voo estiver em EMBARCANDO
    //    (operação incompatível com o estado atual → 400)
    if (reserva.voo.status !== StatusVoo.EMBARCANDO) {
      throw new BadRequestException(
        `Voo precisa estar com status EMBARCANDO para permitir embarque. ` +
          `Status atual: ${reserva.voo.status}`,
      );
    }

    // 5. REGRA: Embarque único
    //    O @@unique(reservaId) já garante no banco, mas a gente checa
    //    antes para dar mensagem específica em vez de P2002 genérico.
    const embarqueExistente = await this.prisma.embarque.findUnique({
      where: { reservaId },
    });
    if (embarqueExistente) {
      throw new ConflictException('Esta reserva já foi embarcada');
    }

    // 6. Cria o embarque
    //    Status inicial é REALIZADO — estamos registrando AGORA.
    //    (PENDENTE/BLOQUEADO ficam pra fluxos futuros, ex: pré-embarque).
    return this.prisma.embarque.create({
      data: {
        reservaId,
        observacao,
        status: StatusEmbarque.REALIZADO,
      },
      include: {
        reserva: {
          include: {
            usuario: {
              select: { id: true, nome: true, email: true },
            },
            voo: {
              include: {
                aeronave: { include: { companhia: true } },
                portao: true,
              },
            },
          },
        },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // LISTAR TODOS — histórico completo (OPERATOR/ADMIN)
  // ═══════════════════════════════════════════════════════════════
    async listarTodos(query: QueryEmbarqueDto) {
    const { page = 1, limit = 10, order = 'desc', orderBy = 'data', status, vooId } = query;

    const where: any = {};
    if (status) where.status = status;
    if (vooId) where.reserva = { vooId };

    const colunasPermitidas = ['id', 'data', 'status', 'criadoEm'];
    const coluna = colunasPermitidas.includes(orderBy) ? orderBy : 'data';

    const [total, data] = await Promise.all([
      this.prisma.embarque.count({ where }),
      this.prisma.embarque.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [coluna]: order },
        include: {
          reserva: {
            include: {
              usuario: { select: { id: true, nome: true, email: true } },
              voo: {
                select: {
                  id: true,
                  numero: true,
                  origem: true,
                  destino: true,
                  dataPartida: true,
                  status: true,
                },
              },
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
  // BUSCAR POR ID
  // ═══════════════════════════════════════════════════════════════
  async buscarPorId(id: number) {
    const embarque = await this.prisma.embarque.findUnique({
      where: { id },
      include: {
        reserva: {
          include: {
            usuario: {
              select: { id: true, nome: true, email: true },
            },
            voo: {
              include: {
                aeronave: { include: { companhia: true } },
                portao: true,
              },
            },
          },
        },
      },
    });

    if (!embarque) {
      throw new NotFoundException('Embarque não encontrado');
    }

    return embarque;
  }

  // ═══════════════════════════════════════════════════════════════
  // LISTAR POR VOO — consulta por relacionamento
  // ═══════════════════════════════════════════════════════════════
  //
  // Útil para o OPERADOR ver quem embarcou em um voo específico.
  // Aqui NÃO precisa checar se o voo existe: se não existir,
  // retornamos array vazio (a resposta natural de uma consulta).
  async listarPorVoo(vooId: number) {
    return this.prisma.embarque.findMany({
      where: {
        reserva: { vooId },
      },
      orderBy: { data: 'desc' },
      include: {
        reserva: {
          include: {
            usuario: {
              select: { id: true, nome: true, email: true },
            },
          },
        },
      },
    });
  }
}