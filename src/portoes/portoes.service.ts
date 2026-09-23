// ═══════════════════════════════════════════════════════════════════
// PortoesService — Lógica de negócio de Portões
// ═══════════════════════════════════════════════════════════════════
//
// Regras:
//   - codigo é único no sistema
//   - Não existe DELETE

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortaoDto } from './dto/create-portao.dto';
import { UpdatePortaoDto } from './dto/update-portao.dto';

@Injectable()
export class PortoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos() {
    return this.prisma.portao.findMany({
      orderBy: { codigo: 'asc' },
    });
  }

  async buscarPorId(id: number) {
    const portao = await this.prisma.portao.findUnique({ where: { id } });
    if (!portao) throw new NotFoundException('Portão não encontrado');
    return portao;
  }

  async criar(dto: CreatePortaoDto) {
    const { codigo, terminal } = dto;

    // Código deve ser único
    const codigoExistente = await this.prisma.portao.findUnique({
      where: { codigo },
    });
    if (codigoExistente) {
      throw new BadRequestException('Código do portão já cadastrado');
    }

    return this.prisma.portao.create({
      data: { codigo, terminal },
    });
  }

  async atualizar(id: number, dto: UpdatePortaoDto) {
    await this.buscarPorId(id);

    // Se estiver mudando código, verifica duplicidade
    if (dto.codigo) {
      const codigoExistente = await this.prisma.portao.findUnique({
        where: { codigo: dto.codigo },
      });
      if (codigoExistente && codigoExistente.id !== id) {
        throw new BadRequestException('Código do portão já cadastrado');
      }
    }

    return this.prisma.portao.update({
      where: { id },
      data: dto,
    });
  }
    
  // ═══════════════════════════════════════════════════════════════
  // DESATIVAR
  // ═══════════════════════════════════════════════════════════════
  //
  // Regra: não deixa desativar portão com voos ativos
  // (PROGRAMADO ou EMBARCANDO). Evita deixar voos sem portão.
  async desativar(id: number) {
    const portao = await this.buscarPorId(id);

    if (!portao.ativo) {
      throw new BadRequestException('Portão já está inativo');
    }

    const voosAtivos = await this.prisma.voo.count({
      where: {
        portaoId: id,
        status: { in: ['PROGRAMADO', 'EMBARCANDO'] },
      },
    });

    if (voosAtivos > 0) {
      throw new BadRequestException(
        `Não é possível desativar: existem ${voosAtivos} voo(s) ativo(s) usando este portão`,
      );
    }

    return this.prisma.portao.update({
      where: { id },
      data: { ativo: false },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // REATIVAR
  // ═══════════════════════════════════════════════════════════════
  async reativar(id: number) {
    const portao = await this.buscarPorId(id);

    if (portao.ativo) {
      throw new BadRequestException('Portão já está ativo');
    }

    return this.prisma.portao.update({
      where: { id },
      data: { ativo: true },
    });
  }
}