import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatusEmbarque, StatusReserva } from '../../generated/prisma/enums';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async indicadores() {
    const [
      voosPorStatus,
      ocupacao,
      portaoMaisUsado,
      embarques24h,
      companhiaTopReservas,
    ] = await Promise.all([
      this.voosPorStatus(),
      this.taxaOcupacao(),
      this.portaoMaisUsado(),
      this.embarquesUltimas24h(),
      this.companhiaTopReservas(),
    ]);

    return {
      geradoEm: new Date().toISOString(),
      voosPorStatus,
      taxaOcupacaoMedia: ocupacao,
      portaoMaisUsado,
      embarquesUltimas24h: embarques24h,
      companhiaComMaisReservas: companhiaTopReservas,
    };
  }

  // Contagem de voos agrupada por status
  private async voosPorStatus() {
    const grupos = await this.prisma.voo.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return grupos.reduce((acc, g) => {
      acc[g.status] = g._count._all;
      return acc;
    }, {} as Record<string, number>);
  }

  // Média (capacidade - vagas livres) / capacidade por aeronave
  private async taxaOcupacao() {
    const aeronaves = await this.prisma.aeronave.findMany({
      where: { ativo: true },
      include: {
        voos: {
          where: { status: { not: 'CANCELADO' } },
          include: {
            _count: {
              select: {
                reservas: { where: { status: { not: StatusReserva.CANCELADA } } },
              },
            },
          },
        },
      },
    });

    if (aeronaves.length === 0) return 0;

    const taxas = aeronaves
      .filter((a) => a.voos.length > 0)
      .map((a) => {
        const reservasTotais = a.voos.reduce(
          (soma, v) => soma + v._count.reservas,
          0,
        );
        const capacidadeTotal = a.capacidade * a.voos.length;
        return capacidadeTotal > 0 ? reservasTotais / capacidadeTotal : 0;
      });

    if (taxas.length === 0) return 0;

    const media = taxas.reduce((s, t) => s + t, 0) / taxas.length;
    return Number((media * 100).toFixed(2)); // percentual com 2 casas
  }

  // Portão que aparece em mais voos não-cancelados
  private async portaoMaisUsado() {
    const grupos = await this.prisma.voo.groupBy({
      by: ['portaoId'],
      where: { status: { not: 'CANCELADO' } },
      _count: { _all: true },
      orderBy: { _count: { portaoId: 'desc' } },
      take: 1,
    });

    if (grupos.length === 0) return null;

    const portao = await this.prisma.portao.findUnique({
      where: { id: grupos[0].portaoId },
    });

    return {
      portaoId: grupos[0].portaoId,
      codigo: portao?.codigo ?? null,
      terminal: portao?.terminal ?? null,
      totalVoos: grupos[0]._count._all,
    };
  }

  // Quantos embarques foram realizados nas últimas 24h
  private async embarquesUltimas24h() {
    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.embarque.count({
      where: {
        status: StatusEmbarque.REALIZADO,
        data: { gte: desde },
      },
    });
  }

  // Companhia com mais reservas ativas
  private async companhiaTopReservas() {
    const reservas = await this.prisma.reserva.findMany({
      where: { status: { not: StatusReserva.CANCELADA } },
      select: {
        voo: {
          select: {
            aeronave: {
              select: {
                companhia: { select: { id: true, nome: true, codigoIATA: true } },
              },
            },
          },
        },
      },
    });

    // Conta reservas por companhia (em memória — conjunto pequeno)
    const contagem = new Map<number, { companhia: any; total: number }>();
    for (const r of reservas) {
      const c = r.voo.aeronave.companhia;
      const atual = contagem.get(c.id) ?? { companhia: c, total: 0 };
      atual.total += 1;
      contagem.set(c.id, atual);
    }

    const lista = Array.from(contagem.values());
    if (lista.length === 0) return null;

    lista.sort((a, b) => b.total - a.total);
    return {
      companhia: lista[0].companhia,
      totalReservasAtivas: lista[0].total,
    };
  }
}