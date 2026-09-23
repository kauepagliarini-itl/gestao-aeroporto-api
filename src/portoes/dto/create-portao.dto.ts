// ═══════════════════════════════════════════════════════════════════
// CreatePortaoDto — DTO de criação de Portão
// ═══════════════════════════════════════════════════════════════════
//
// Campos:
//   - codigo:   identificação única do portão (ex: "A1", "B12")
//   - terminal: qual terminal pertence (ex: "Terminal 1")

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePortaoDto {
  @ApiProperty({ example: 'A1' })
  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  codigo!: string;

  @ApiProperty({ example: 'Terminal 1' })
  @IsString()
  @IsNotEmpty({ message: 'Terminal é obrigatório' })
  terminal!: string;
}