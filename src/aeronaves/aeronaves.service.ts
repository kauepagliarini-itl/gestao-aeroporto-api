// ═══════════════════════════════════════════════════════════════════
// AeronavesService — Lógica de negócio de Aeronaves
// ═══════════════════════════════════════════════════════════════════
//
// Regras de negócio:
//   - matricula é única no sistema
//   - companhiaId precisa existir (validação de FK)
//   - Não existe DELETE (aeronaves são inativadas via PATCH ativo: false)

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAeronaveDto } from './dto/create-aeronave.dto';
import { UpdateAeronaveDto } from './dto/update-aeronave.dto';

@Injectable()
export class AeronavesService {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════
  // LISTAR TODAS (inclui a companhia vinculada)
  // ═══════════════════════════════════════════════════════════════
  async listarTodas() {
    return this.prisma.aeronave.findMany({
      orderBy: { modelo: 'asc' },
      // "include" traz os dados da companhia junto (JOIN do SQL)
      include: {
        companhia: {
          select: { id: true, nome: true, codigoIATA: true },
        },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // BUSCAR POR ID
  // ═══════════════════════════════════════════════════════════════
  async buscarPorId(id: number) {
    const aeronave = await this.prisma.aeronave.findUnique({
      where: { id },
      include: {
        companhia: {
          select: { id: true, nome: true, codigoIATA: true },
        },
      },
    });

    if (!aeronave) {
      throw new NotFoundException('Aeronave não encontrada');
    }

    return aeronave;
  }

  // ═══════════════════════════════════════════════════════════════
  // CRIAR
  // ═══════════════════════════════════════════════════════════════
  async criar(dto: CreateAeronaveDto) {
    const { modelo, matricula, capacidade, companhiaId } = dto;

    // 1. Matrícula deve ser única
    const matriculaExistente = await this.prisma.aeronave.findUnique({
      where: { matricula },
    });

    if (matriculaExistente) {
      throw new BadRequestException('Matrícula já cadastrada');
    }

    // 2. Companhia precisa existir (validação de FK)
    const companhia = await this.prisma.companhiaAerea.findUnique({
      where: { id: companhiaId },
    });

    if (!companhia) {
      throw new BadRequestException('Companhia aérea não encontrada');
    }

    return this.prisma.aeronave.create({
      data: { modelo, matricula, capacidade, companhiaId },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ATUALIZAR (parcial)
  // ═══════════════════════════════════════════════════════════════
  async atualizar(id: number, dto: UpdateAeronaveDto) {
    // 1. Verifica se a aeronave existe
    await this.buscarPorId(id);

    // 2. Se estiver mudando matrícula, verifica duplicidade
    if (dto.matricula) {
      const matriculaExistente = await this.prisma.aeronave.findUnique({
        where: { matricula: dto.matricula },
      });

      if (matriculaExistente && matriculaExistente.id !== id) {
        throw new BadRequestException('Matrícula já cadastrada');
      }
    }

    // 3. Se estiver mudando companhia, verifica se existe
    if (dto.companhiaId) {
      const companhia = await this.prisma.companhiaAerea.findUnique({
        where: { id: dto.companhiaId },
      });

      if (!companhia) {
        throw new BadRequestException('Companhia aérea não encontrada');
      }
    }

    return this.prisma.aeronave.update({
      where: { id },
      data: dto,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // DESATIVAR
  // ═══════════════════════════════════════════════════════════════
  //
  // Regra: não deixa desativar aeronave com voos ativos
  // (PROGRAMADO ou EMBARCANDO). Evita deixar voos órfãos.
  async desativar(id: number) {
    const aeronave = await this.buscarPorId(id);

    if (!aeronave.ativo) {
      throw new BadRequestException('Aeronave já está inativa');
    }

    const voosAtivos = await this.prisma.voo.count({
      where: {
        aeronaveId: id,
        status: { in: ['PROGRAMADO', 'EMBARCANDO'] },
      },
    });

    if (voosAtivos > 0) {
      throw new BadRequestException(
        `Não é possível desativar: existem ${voosAtivos} voo(s) ativo(s) desta aeronave`,
      );
    }

    return this.prisma.aeronave.update({
      where: { id },
      data: { ativo: false },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // REATIVAR
  // ═══════════════════════════════════════════════════════════════
  async reativar(id: number) {
    const aeronave = await this.buscarPorId(id);

    if (aeronave.ativo) {
      throw new BadRequestException('Aeronave já está ativa');
    }

    return this.prisma.aeronave.update({
      where: { id },
      data: { ativo: true },
    });
  }
}