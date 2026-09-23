// ═══════════════════════════════════════════════════════════════════
// UpdatePortaoDto — DTO de edição parcial de Portão
// ═══════════════════════════════════════════════════════════════════

import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePortaoDto {
  @ApiPropertyOptional({ example: 'A2' })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional({ example: 'Terminal 2' })
  @IsOptional()
  @IsString()
  terminal?: string;
}