// ═══════════════════════════════════════════════════════════════════
// CreateEmbarqueDto — Contrato de entrada para criar um Embarque
// ═══════════════════════════════════════════════════════════════════
//
// O que é um DTO?
//   É o "formulário" que o cliente precisa preencher para chamar a rota.
//   O ValidationPipe (configurado no main.ts) rejeita com 400 se algo
//   estiver fora do esperado.
//
// Aqui, o operador/admin informa APENAS:
//   - reservaId  (qual reserva está embarcando)
//   - observacao (texto livre, opcional)
//
// ⚠️ Repare que NÃO existe campo "vooId", "usuarioId" ou "status".
//    Por quê?
//      - O voo é descoberto a partir da reserva (reserva.vooId).
//      - O usuário é descoberto a partir da reserva (reserva.usuarioId).
//      - O status inicial é sempre REALIZADO (definido no service).
//
//    Isso é proposital: o cliente NÃO decide essas coisas. O servidor
//    decide. Isso evita que alguém tente manipular IDs pra fraudar.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateEmbarqueDto {
  // ═══════════════════════════════════════════════════════════════
  // reservaId — obrigatório
  // ═══════════════════════════════════════════════════════════════
  // @IsInt()  → precisa ser número inteiro
  // @Min(1)   → precisa ser >= 1 (IDs do Postgres começam em 1)
  @ApiProperty({ example: 5, description: 'ID da reserva a embarcar' })
  @IsInt({ message: 'O reservaId deve ser um número inteiro' })
  @Min(1, { message: 'O reservaId deve ser maior ou igual a 1' })
  reservaId!: number;

  // ═══════════════════════════════════════════════════════════════
  // observacao — opcional
  // ═══════════════════════════════════════════════════════════════
  // @IsOptional()    → pode vir ou não no body
  // @IsString()      → se vier, precisa ser string
  // @MaxLength(500)  → limite pra evitar texto gigante
  @ApiPropertyOptional({
    example: 'Passageiro embarcou com prioridade',
    description: 'Observação opcional sobre o embarque',
  })
  @IsOptional()
  @IsString({ message: 'A observação deve ser um texto' })
  @MaxLength(500, { message: 'A observação pode ter no máximo 500 caracteres' })
  observacao?: string;
}