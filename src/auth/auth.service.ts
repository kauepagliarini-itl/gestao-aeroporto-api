// ═══════════════════════════════════════════════════════════════════
// AuthService — Lógica de autenticação (login)
// ═══════════════════════════════════════════════════════════════════
//
// Este Service concentra TODA a lógica do login:
//   1. Busca o usuário pelo email
//   2. Verifica se está ativo
//   3. Compara a senha com o hash do banco (bcrypt)
//   4. Gera o token JWT
//   5. Retorna o token + dados do usuário (SEM a senha)
//
// ⚠️ REGRA DE OURO: NUNCA retornar a senha (nem o hash).

import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, senha } = loginDto;

    // 1. Busca o usuário pelo email único
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });

    // 2. Se não existe → 401
    // ⚠️ Mensagem GENÉRICA (não diz se foi email ou senha que errou).
    //    Isso evita que atacantes descubram quais emails existem no sistema.
    if (!usuario) throw new UnauthorizedException('Credenciais inválidas');

    // 3. Se existe mas está inativo → 403
    //    (usuário existe e credenciais podem estar certas, mas não pode logar)
    if (!usuario.ativo) throw new ForbiddenException('Usuário inativo');

    // 4. Compara a senha enviada com o hash armazenado no banco
    // bcrypt.compare(senha_pura, hash_do_banco) → true ou false
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) throw new UnauthorizedException('Credenciais inválidas');

    // 5. Gera o token JWT com o payload { sub, email, role }
    //    O JwtService assina usando JWT_SECRET do .env
    //    O expiresIn é configurado no AuthModule (JWT_EXPIRES_IN)
    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
    });

    // 6. Retorna token + dados do usuário SEM A SENHA
    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
    };
  }
}