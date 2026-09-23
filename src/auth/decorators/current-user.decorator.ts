// ═══════════════════════════════════════════════════════════════════
// CurrentUser Decorator — Extrai o usuário autenticado da requisição
// ═══════════════════════════════════════════════════════════════════
//
// Este decorator é usado para pegar o usuário logado dentro de um
// controller, de forma limpa:
//
//   @Get('minhas-reservas')
//   minhasReservas(@CurrentUser() user: AuthUser) {
//     return this.service.buscarPorUsuario(user.id);
//   }
//
// Como funciona:
//   1. JwtAuthGuard valida o token
//   2. JwtStrategy coloca o AuthUser em request.user
//   3. @CurrentUser() extrai request.user e injeta no parâmetro
//
// Dois usos possíveis:
//   @CurrentUser()            → retorna o AuthUser completo
//   @CurrentUser('id')        → retorna só o id (number)
//   @CurrentUser('email')     → retorna só o email (string)

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../interfaces/auth-user.interface';

export const CurrentUser = createParamDecorator(
  // "data" é o campo opcional passado: @CurrentUser('id') → data = 'id'
  // "context" dá acesso à requisição HTTP
  (data: keyof AuthUser | undefined, context: ExecutionContext): AuthUser | any => {
    // Pega o objeto Request do Express
    const request = context.switchToHttp().getRequest();

    // request.user foi populado pelo JwtStrategy.validate()
    const user = request.user as AuthUser;

    // Se foi passado um campo específico, retorna só ele
    // Ex.: @CurrentUser('id') → retorna user.id
    if (data) return user?.[data];

    // Senão, retorna o AuthUser completo
    return user;
  },
);