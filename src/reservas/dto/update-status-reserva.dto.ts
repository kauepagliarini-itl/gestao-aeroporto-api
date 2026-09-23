// ═══════════════════════════════════════════════════════════════════
// UpdateStatusReservaDto — DTO de mudança de status da Reserva
// ═══════════════════════════════════════════════════════════════════
//
// Usado em PATCH /reservas/:id/status.
//
// ⚠️ Só aceita os 3 valores do enum StatusReserva:
//    - CONFIRMADA
//    - CANCELADA
//    - UTILIZADA
//
// As transições válidas serão validadas no Service (dependem do
// status ATUAL), mas o DTO já impede valores fora do enum.

import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusReserva } from '../../../generated/prisma/enums';

export class UpdateStatusReservaDto {
  @ApiProperty({
    description: 'Novo status da reserva',
    example: 'CANCELADA',
    enum: StatusReserva,
  })
  @IsEnum(StatusReserva, {
    message: 'Status deve ser: CONFIRMADA, CANCELADA ou UTILIZADA',
  })
  status!: StatusReserva;
}