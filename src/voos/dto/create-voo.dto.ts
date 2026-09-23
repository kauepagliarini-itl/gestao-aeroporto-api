// ═══════════════════════════════════════════════════════════════════
// CreateVooDto — DTO de criação de Voo
// ═══════════════════════════════════════════════════════════════════
//
// Campos:
//   - numero:       código único do voo (ex: "LA3456")
//   - origem:       aeroporto de origem (ex: "GRU")
//   - destino:      aeroporto de destino (ex: "GIG")
//   - dataPartida:  data/hora de partida (ISO 8601)
//   - dataChegada:  data/hora prevista de chegada (ISO 8601)
//   - aeronaveId:   FK para Aeronave (define capacidade)
//   - portaoId:     FK para Portao (define onde embarca)
//
// ⚠️ Status não está aqui! Todo voo nasce como PROGRAMADO.
//    Isso evita cliente enviar status arbitrariamente.

import { IsString, IsNotEmpty, IsDateString, IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVooDto {
  @ApiProperty({ example: 'LA3456' })
  @IsString()
  @IsNotEmpty({ message: 'Número do voo é obrigatório' })
  numero!: string;

  @ApiProperty({ example: 'GRU' })
  @IsString()
  @IsNotEmpty({ message: 'Origem é obrigatória' })
  origem!: string;

  @ApiProperty({ example: 'GIG' })
  @IsString()
  @IsNotEmpty({ message: 'Destino é obrigatório' })
  destino!: string;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  @IsDateString({}, { message: 'Data de partida deve estar em formato ISO 8601' })
  dataPartida!: string;

  @ApiProperty({ example: '2026-10-15T12:30:00.000Z' })
  @IsDateString({}, { message: 'Data de chegada deve estar em formato ISO 8601' })
  dataChegada!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  aeronaveId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  portaoId!: number;
}