// ═══════════════════════════════════════════════════════════════════
// CreateCompanhiaDto — DTO de criação de Companhia Aérea
// ═══════════════════════════════════════════════════════════════════
//
// Define o formato do body para POST /companhias.
// Validações aplicadas automaticamente pelo ValidationPipe global.
//
// Campos:
//   - nome:       nome da companhia (ex: "LATAM Airlines")
//   - codigoIATA: código de 2-3 letras único (ex: "LA", "G3")
//
// ⚠️ O id, ativo, criadoEm e atualizadoEm NÃO ficam no DTO,
//    são gerados automaticamente pelo Prisma.

import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanhiaDto {
  @ApiProperty({
    description: 'Nome da companhia aérea',
    example: 'LATAM Airlines',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome!: string;

  @ApiProperty({
    description: 'Código IATA (2 a 3 letras maiúsculas)',
    example: 'LA',
  })
  @IsString()
  @Length(2, 3, { message: 'Código IATA deve ter entre 2 e 3 caracteres' })
  codigoIATA!: string;
}