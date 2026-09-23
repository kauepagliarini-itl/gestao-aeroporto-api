// ═══════════════════════════════════════════════════════════════════
// AuthModule — Módulo de autenticação
// ═══════════════════════════════════════════════════════════════════
//
// Um Module agrupa tudo relacionado a um domínio (aqui: auth).
// Ele:
//   - Importa módulos externos necessários (Passport, JwtModule)
//   - Registra Controllers (rotas HTTP)
//   - Registra Providers (Services, Strategies, Guards)
//   - Exporta o que outros módulos vão precisar
//
// ⚠️ IMPORTANTE: JwtModule.registerAsync() é configurado aqui
//    porque ele precisa ler JWT_SECRET do .env. Usamos registerAsync
//    para poder injetar o ConfigService e ler o .env.

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    // PassportModule: habilita o uso de estratégias (JwtStrategy)
    PassportModule,

    // JwtModule: configurado async para ler do .env
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Chave secreta usada para ASSINAR o token
        // getOrThrow: falha na inicialização se não existir
        secret: configService.getOrThrow<string>('JWT_SECRET'),

        // Tempo de expiração do token
        // ⚠️ O "as any" é necessário por limitação de tipagem da lib
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ??
            '8h') as any,
        },
      }),
    }),
  ],

  // Controllers deste módulo (rotas HTTP)
  controllers: [AuthController],

  // Providers: serviços/classes que este módulo fornece
  providers: [
    AuthService,    // Lógica de login
    JwtStrategy,    // Estratégia de validação do token
    JwtAuthGuard,   // Guard de autenticação
    RolesGuard,     // Guard de autorização
  ],

  // Exporta o que outros módulos vão usar
  // (por exemplo, EventsModule vai usar JwtAuthGuard nas suas rotas)
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}