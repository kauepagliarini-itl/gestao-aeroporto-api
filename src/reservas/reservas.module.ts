// ═══════════════════════════════════════════════════════════════════
// ReservasModule — Módulo de Reservas
// ═══════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}