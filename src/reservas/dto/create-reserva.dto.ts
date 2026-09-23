// ═══════════════════════════════════════════════════════════════════
// CreateReservaDto — DTO de criação de Reserva
// ═══════════════════════════════════════════════════════════════════
//
// ⚠️ ATENÇÃO: NÃO tem "usuarioId" no DTO!
//    O usuário vem do JWT via @CurrentUser (regra do enunciado:
//    "operações pessoais usam a identidade autenticada").
//
// Campos:
//   - vooId:   FK para Voo (qual voo o passageiro vai)
//   - assento: string com o número do assento (ex: "12A")
//
// ⚠️ Status NÃO está aqui — toda reserva nasce como CONFIRMADA.

import { IsInt, IsPositive, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  vooId!: number;

  @ApiProperty({ example: '12A' })
  @IsString()
  @IsNotEmpty({ message: 'Assento é obrigatório' })
  assento!: string;
}