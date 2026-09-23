// ═══════════════════════════════════════════════════════════════════
// AuthController — Camada HTTP da autenticação
// ═══════════════════════════════════════════════════════════════════
//
// Este Controller define APENAS a rota de login.
// Toda a lógica fica no AuthService — aqui só recebemos e repassamos.
//
// ⚠️ PRINCÍPIO: Controllers não têm regra de negócio.
//    Só recebem requisição, validam formato (via DTO) e devolvem resposta.

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';

@ApiSecurity('X-API-KEY') // Swagger exige X-API-KEY para acessar /auth/login 
@ApiTags('Autenticação') // Agrupa no Swagger
@Controller('auth')       // Prefixo: /auth
@Throttle({ default: { limit: 5, ttl: 60000 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ═══════════════════════════════════════════════════════════════
  // POST /auth/login
  // ═══════════════════════════════════════════════════════════════
  @Post('login')
  @HttpCode(HttpStatus.OK) // Login retorna 200 (não 201, pois não cria recurso)
  @ApiOperation({
    summary: 'Autentica um usuário',
    description: 'Valida email/senha e retorna um token JWT',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIs...',
        usuario: {
          id: 1,
          nome: 'Admin',
          email: 'admin@aeroporto.com',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({ status: 403, description: 'Usuário inativo' })
  login(@Body() loginDto: LoginDto) {
    // Delega para o Service — o Controller não sabe nada de bcrypt/JWT
    return this.authService.login(loginDto);
  }
}