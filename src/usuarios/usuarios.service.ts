import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  // Lista todos os usuários (sem senha)
  async listarTodos() {
    return this.prisma.usuario.findMany({
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });
  }

  // Busca um usuário pelo id (sem senha)
  async buscarPorId(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }

  // Desativa um usuário
  async desativar(id: number, solicitanteId: number) {
    if (id === solicitanteId) {
      throw new BadRequestException(
        'Você não pode desativar a si mesmo',
      );
    }

    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    if (!usuario.ativo) {
      throw new BadRequestException('Usuário já está inativo');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { ativo: false },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
      },
    });
  }

  // Reativa um usuário
  async reativar(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    if (usuario.ativo) {
      throw new BadRequestException('Usuário já está ativo');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { ativo: true },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
      },
    });
  }
}