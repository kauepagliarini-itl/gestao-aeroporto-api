// ═══════════════════════════════════════════════════════════════════
// LoginDto — Data Transfer Object do login
// ═══════════════════════════════════════════════════════════════════
//
// Um DTO (Data Transfer Object) define o FORMATO dos dados que
// chegam na requisição. É como um "contrato" do body.
//
// Quando o cliente faz POST /auth/login, o body é validado
// automaticamente pelo ValidationPipe global (configurado no main.ts).
//
// Se algum campo estiver errado → 400 Bad Request com a mensagem.
//
// Aqui usamos 3 decorators principais:
//   - @IsEmail()     → valida formato de email
//   - @IsString()    → valida tipo string
//   - @MinLength(6)  → valida tamanho mínimo
//
// E o @ApiProperty() que documenta o campo no Swagger.

import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'E-mail do usuário cadastrado',
    example: 'admin@aeroporto.com',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: 'Admin@123',
  })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha!: string;
}