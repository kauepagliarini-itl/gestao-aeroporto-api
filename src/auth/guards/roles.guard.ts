// ═══════════════════════════════════════════════════════════════════
// RolesGuard — Guard de autorização por role (perfil)
// ═══════════════════════════════════════════════════════════════════
//
// Este Guard verifica se o usuário logado tem o role necessário
// para acessar a rota.
//
// Diferença crucial:
//   - JwtAuthGuard  → "Você está autenticado?" (401 se não)
//   - RolesGuard    → "Você tem PERMISSÃO?" (403 se não)
//
// Uso:
//   @UseGuards(JwtAuthGuard, RolesGuard)  ← ORDEM importa!
//   @Roles(Role.ADMIN)
//   @Post('voos')
//   criar() { ... }
//
// Fluxo:
//   1. JwtAuthGuard roda primeiro → popula request.user
//   2. RolesGuard lê a metadata @Roles(...) da rota
//   3. Compara com request.user.role
//   4. Se não bater → 403 Forbidden

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Role } from '../../../generated/prisma/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector é a ferramenta que lê metadata gravada por decorators
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lê os roles exigidos pela rota
    // getAllAndOverride: procura primeiro no MÉTODO, depois na CLASSE
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Se a rota não exige role específico, libera (não é rota "por role")
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // 3. Pega o usuário que o JwtAuthGuard colocou em request.user
    const request = context.switchToHttp().getRequest<Request>();
    const usuario = request.user as AuthUser;
    if (!usuario) throw new ForbiddenException('Usuário não autenticado');

    // 4. Verifica se o role do usuário está na lista permitida
    if (!requiredRoles.includes(usuario.role)) {
      throw new ForbiddenException(
        `Acesso negado. Necessário: ${requiredRoles.join(', ')}`,
      );
    }

    // 5. Tudo certo, libera a requisição
    return true;
  }
}