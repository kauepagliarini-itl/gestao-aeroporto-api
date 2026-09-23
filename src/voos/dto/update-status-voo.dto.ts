// ═══════════════════════════════════════════════════════════════════
// UpdateStatusVooDto — DTO de mudança de status do Voo
// ═══════════════════════════════════════════════════════════════════
//
// Usado em PATCH /voos/:id/status.
//
// ⚠️ Só aceita os 4 valores do enum StatusVoo:
//    - PROGRAMADO
//    - EMBARCANDO
//    - DECOLADO
//    - CANCELADO
//
// As transições válidas serão validadas no Service (não no DTO),
// porque dependem do status ATUAL do voo.

import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusVoo } from '../../../generated/prisma/enums';

export class UpdateStatusVooDto {
  @ApiProperty({
    description: 'Novo status do voo',
    example: 'EMBARCANDO',
    enum: StatusVoo,
  })
  @IsEnum(StatusVoo, {
    message: 'Status deve ser: PROGRAMADO, EMBARCANDO, DECOLADO ou CANCELADO',
  })
  status!: StatusVoo;
}