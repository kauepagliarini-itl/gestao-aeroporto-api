// ═══════════════════════════════════════════════════════════════════
// JwtAuthGuard — Guard de autenticação via JWT
// ═══════════════════════════════════════════════════════════════════
//
// Este Guard verifica se a requisição tem um token JWT VÁLIDO.
//
// Uso:
//   @UseGuards(JwtAuthGuard)
//   @Get('voos')
//   listar() { ... }
//
// Fluxo:
//   1. Cliente envia header: Authorization: Bearer eyJhbGc...
//   2. JwtAuthGuard estende AuthGuard('jwt') do Passport
//   3. O Passport executa automaticamente a JwtStrategy.validate()
//   4. Se válido → coloca user em request.user e libera
//   5. Se inválido → 401 Unauthorized automático
//
// ⚠️ Por que é tão simples (só 1 linha)?
//    Porque o NestJS + Passport fazem toda a mágica por baixo.
//    Só precisamos dizer "essa rota usa a estratégia 'jwt'".

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}