// ═══════════════════════════════════════════════════════════════════
// CreateAeronaveDto — DTO de criação de Aeronave
// ═══════════════════════════════════════════════════════════════════
//
// Campos:
//   - modelo:      nome/modelo da aeronave (ex: "Boeing 737-800")
//   - matricula:   identificação única (ex: "PR-GTA")
//   - capacidade:  número de assentos (> 0). REGRA CRÍTICA do enunciado.
//   - companhiaId: FK para CompanhiaAerea
//
// ⚠️ REGRA DE OURO: não deixamos capacidade = 0 ou negativa,
//    pois essa regra protege a "capacidade da aeronave" do enunciado.

import { IsString, IsNotEmpty, IsInt, Min, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAeronaveDto {
  @ApiProperty({ example: 'Boeing 737-800' })
  @IsString()
  @IsNotEmpty({ message: 'Modelo é obrigatório' })
  modelo!: string;

  @ApiProperty({ example: 'PR-GTA' })
  @IsString()
  @IsNotEmpty({ message: 'Matrícula é obrigatória' })
  matricula!: string;

  @ApiProperty({ example: 180 })
  @IsInt({ message: 'Capacidade deve ser um número inteiro' })
  @Min(1, { message: 'Capacidade deve ser no mínimo 1' })
  @IsPositive({ message: 'Capacidade deve ser positiva' })
  capacidade!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  companhiaId!: number;
}