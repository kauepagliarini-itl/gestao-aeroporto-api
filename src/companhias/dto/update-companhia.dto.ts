// ═══════════════════════════════════════════════════════════════════
// UpdateCompanhiaDto — DTO de edição parcial de Companhia Aérea
// ═══════════════════════════════════════════════════════════════════
//
// Usado em PATCH /companhias/:id.
// Todos os campos são OPCIONAIS porque PATCH permite edição parcial:
// o cliente envia só o que quer mudar.
//
// Exemplo:
//   { "nome": "LATAM" }        → muda só o nome
//   { "codigoIATA": "JJ" }     → muda só o código
//
// ⚠️ Importante: usamos @IsOptional() em TODOS os campos para
//    que o ValidationPipe não exija o campo.

import { IsString, IsOptional, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanhiaDto {
  @ApiPropertyOptional({
    description: 'Nome da companhia aérea',
    example: 'LATAM Airlines Brasil',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: 'Código IATA',
    example: 'JJ',
  })
  @IsOptional()
  @IsString()
  @Length(2, 3, { message: 'Código IATA deve ter entre 2 e 3 caracteres' })
  codigoIATA?: string;
}