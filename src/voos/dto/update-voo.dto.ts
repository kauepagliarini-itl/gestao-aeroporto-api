// ═══════════════════════════════════════════════════════════════════
// UpdateVooDto — DTO de edição parcial de Voo
// ═══════════════════════════════════════════════════════════════════
//
// Todos os campos opcionais.
//
// ⚠️ ATENÇÃO: o status NÃO está aqui.
//    Mudança de status tem DTO próprio (UpdateStatusVooDto)
//    porque as transições seguem regras específicas.

import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsPositive,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVooDto {
  @ApiPropertyOptional({ example: 'LA3457' })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiPropertyOptional({ example: 'GRU' })
  @IsOptional()
  @IsString()
  origem?: string;

  @ApiPropertyOptional({ example: 'GIG' })
  @IsOptional()
  @IsString()
  destino?: string;

  @ApiPropertyOptional({ example: '2026-10-15T11:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dataPartida?: string;

  @ApiPropertyOptional({ example: '2026-10-15T13:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  dataChegada?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  aeronaveId?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  portaoId?: number;
}