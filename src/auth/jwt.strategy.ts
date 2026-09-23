// ═══════════════════════════════════════════════════════════════════
// JwtStrategy — Estratégia de validação do token JWT
// ═══════════════════════════════════════════════════════════════════
//
// Esta classe é o "cérebro" da autenticação. É ela que:
//   1. Extrai o token do header Authorization
//   2. Valida a assinatura (usando JWT_SECRET do .env)
//   3. Busca o usuário no banco pelo ID do token
//   4. Verifica se está ativo
//   5. Coloca o AuthUser em request.user
//
// O Passport chama esta estratégia automaticamente sempre que
// um JwtAuthGuard precisa validar um token.

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import type { AuthUser } from './interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Extrai o token do header "Authorization: Bearer xxx"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Não ignorar tokens expirados (se expirou, falha)
      ignoreExpiration: false,

      // Chave secreta usada para verificar a assinatura do token
      // getOrThrow: se não existir, o app FALHA NA INICIALIZAÇÃO (fail-fast)
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // validate() é chamado AUTOMATICAMENTE após o token ser validado
  // O retorno vai direto para request.user
  // ═══════════════════════════════════════════════════════════════
  async validate(payload: JwtPayload): Promise<AuthUser> {
    // 1. Busca o usuário no banco usando o "sub" (ID) do token
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    });

    // 2. Se o usuário não existe mais (foi deletado), bloqueia
    if (!usuario) throw new UnauthorizedException('Usuário não encontrado');

    // 3. Se o usuário foi inativado, bloqueia
    if (!usuario.ativo) throw new UnauthorizedException('Usuário inativo');

    // 4. Retorna o AuthUser (vai para request.user)
    // ⚠️ Buscamos role ATUALIZADO no banco (não confiamos no do token),
    //    para que alterações de role tenham efeito imediato
    return {
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
    };
  }
}