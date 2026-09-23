// ═══════════════════════════════════════════════════════════════════
// VoosModule — Módulo de Voos
// ═══════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VoosService } from './voos.service';
import { VoosController } from './voos.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    // HttpModule configurado com timeout vindo do .env.
    // O timeout evita que uma API externa lenta trave nossa rota.
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        timeout: config.get<number>('WEATHER_TIMEOUT_MS', 5000),
      }),
    }),
  ],
  controllers: [VoosController],
  providers: [VoosService],
})
export class VoosModule {}