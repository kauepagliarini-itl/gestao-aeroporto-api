// ═══════════════════════════════════════════════════════════════════
// UpdateAeronaveDto — DTO de edição parcial de Aeronave
// ═══════════════════════════════════════════════════════════════════
//
// Todos os campos OPCIONAIS (PATCH parcial).
// Cliente envia só o que quer mudar.

import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsPositive,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAeronaveDto {
  @ApiPropertyOptional({ example: 'Airbus A320' })
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional({ example: 'PR-XYZ' })
  @IsOptional()
  @IsString()
  matricula?: string;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @IsPositive()
  capacidade?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  companhiaId?: number;
}