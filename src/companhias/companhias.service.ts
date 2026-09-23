// ═══════════════════════════════════════════════════════════════════
// CompanhiasService — Lógica de negócio de Companhias Aéreas
// ═══════════════════════════════════════════════════════════════════
//
// Concentra TODAS as regras relacionadas a companhias.
// Não tem nada de HTTP aqui (isso é do Controller).
//
// Regras de negócio:
//   - codigoIATA é único no sistema (não pode duplicar)
//   - Ao criar, ativo começa como true
//   - Não existe DELETE — companhias são inativadas (ativo: false)

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanhiaDto } from './dto/create-companhia.dto';
import { UpdateCompanhiaDto } from './dto/update-companhia.dto';

@Injectable()
export class CompanhiasService {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════
  // LISTAR TODAS
  // ═══════════════════════════════════════════════════════════════
  async listarTodas() {
    return this.prisma.companhiaAerea.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // BUSCAR POR ID
  // ═══════════════════════════════════════════════════════════════
  async buscarPorId(id: number) {
    const companhia = await this.prisma.companhiaAerea.findUnique({
      where: { id },
    });

    // Se não encontrar → 404
    if (!companhia) {
      throw new NotFoundException('Companhia aérea não encontrada');
    }

    return companhia;
  }

  // ═══════════════════════════════════════════════════════════════
  // CRIAR
  // ═══════════════════════════════════════════════════════════════
  async criar(dto: CreateCompanhiaDto) {
    const { nome, codigoIATA } = dto;

    // REGRA: codigoIATA deve ser único
    const codigoExistente = await this.prisma.companhiaAerea.findUnique({
      where: { codigoIATA },
    });

    if (codigoExistente) {
      throw new BadRequestException('Código IATA já cadastrado');
    }

    return this.prisma.companhiaAerea.create({
      data: { nome, codigoIATA },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ATUALIZAR (parcial)
  // ═══════════════════════════════════════════════════════════════
  async atualizar(id: number, dto: UpdateCompanhiaDto) {
    // Verifica se existe
    await this.buscarPorId(id);

    // Se estiver mudando o código, verifica duplicidade
    if (dto.codigoIATA) {
      const codigoExistente = await this.prisma.companhiaAerea.findUnique({
        where: { codigoIATA: dto.codigoIATA },
      });

      // Se encontrou OUTRA companhia com esse código → 400
      if (codigoExistente && codigoExistente.id !== id) {
        throw new BadRequestException('Código IATA já cadastrado');
      }
    }

    return this.prisma.companhiaAerea.update({
      where: { id },
      data: dto,
    });
  }

    // ═══════════════════════════════════════════════════════════════
  // DESATIVAR
  // ═══════════════════════════════════════════════════════════════
  //
  // Regra: não deixa desativar companhia que tenha voos ativos
  // (PROGRAMADO ou EMBARCANDO). Isso evita deixar voos "órfãos".
  async desativar(id: number) {
    const companhia = await this.buscarPorId(id);

    if (!companhia.ativo) {
      throw new BadRequestException('Companhia já está inativa');
    }

    const voosAtivos = await this.prisma.voo.count({
      where: {
        aeronave: { companhiaId: id },
        status: { in: ['PROGRAMADO', 'EMBARCANDO'] },
      },
    });

    if (voosAtivos > 0) {
      throw new BadRequestException(
        `Não é possível desativar: existem ${voosAtivos} voo(s) ativo(s) desta companhia`,
      );
    }

    return this.prisma.companhiaAerea.update({
      where: { id },
      data: { ativo: false },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // REATIVAR
  // ═══════════════════════════════════════════════════════════════
  async reativar(id: number) {
    const companhia = await this.buscarPorId(id);

    if (companhia.ativo) {
      throw new BadRequestException('Companhia já está ativa');
    }

    return this.prisma.companhiaAerea.update({
      where: { id },
      data: { ativo: true },
    });
  }


}