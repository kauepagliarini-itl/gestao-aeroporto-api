// ═══════════════════════════════════════════════════════════════════
// Roles Decorator — Marca uma rota com os roles permitidos
// ═══════════════════════════════════════════════════════════════════
//
// Este decorator é usado para ANOTAR uma rota, dizendo quais
// roles podem acessá-la. O RolesGuard lê essa anotação e verifica.
//
// Uso:
//   @Roles(Role.ADMIN)
//   @Post('voos')
//   criar() { ... }
//
// Como funciona:
//   1. @Roles(Role.ADMIN) grava a metadata "roles: [ADMIN]" na rota
//   2. Quando a requisição chega, o RolesGuard lê essa metadata
//      com o Reflector e compara com o role do usuário logado
//   3. Se não bater, retorna 403 Forbidden

import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../generated/prisma/enums';

// Chave usada para gravar/ler a metadata.
// É uma constante para evitar "strings mágicas" duplicadas.
export const ROLES_KEY = 'roles';

// Decorator em si. Aceita N roles como parâmetro.
// SetMetadata é a função do NestJS que grava metadata em uma classe/método.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);