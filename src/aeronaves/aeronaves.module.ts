// ═══════════════════════════════════════════════════════════════════
// AeronavesModule — Módulo de Aeronaves
// ═══════════════════════════════════════════════════════════════════
//
// Importa AuthModule para ter acesso aos Guards (JwtAuthGuard, RolesGuard).

import { Module } from '@nestjs/common';
import { AeronavesService } from './aeronaves.service';
import { AeronavesController } from './aeronaves.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AeronavesController],
  providers: [AeronavesService],
})
export class AeronavesModule {}