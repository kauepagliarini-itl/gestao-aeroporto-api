// ═══════════════════════════════════════════════════════════════════
// CompanhiasModule — Módulo de Companhias Aéreas
// ═══════════════════════════════════════════════════════════════════
//
// Agrupa tudo relacionado a companhias aéreas.
//
// ⚠️ IMPORTANTE: precisamos importar o AuthModule porque
//    os Guards (JwtAuthGuard, RolesGuard) são usados no Controller,
//    e eles são providos/exportados pelo AuthModule.

import { Module } from '@nestjs/common';
import { CompanhiasService } from './companhias.service';
import { CompanhiasController } from './companhias.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  // Importa o AuthModule para ter acesso aos Guards
  imports: [AuthModule],

  // Controllers deste módulo
  controllers: [CompanhiasController],

  // Services deste módulo
  providers: [CompanhiasService],
})
export class CompanhiasModule {}