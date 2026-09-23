// ═══════════════════════════════════════════════════════════════════
// JwtPayload — Interface do CONTEÚDO do token JWT
// ═══════════════════════════════════════════════════════════════════
//
// Esta interface define o que fica DENTRO do token JWT.
// Ou seja: os dados do usuário que são "assinados" e enviados
// ao cliente no momento do login.
//
// ⚠️ IMPORTANTE:
// O conteúdo do token é VISÍVEL para qualquer pessoa que o decodificar
// (é apenas base64, não é criptografado). Por isso, NUNCA coloque
// dados sensíveis aqui (senha, CPF, etc.).
//
// Fluxo:
//   1. Login → AuthService gera token com { sub, email, role }
//   2. Cliente envia o token nas requisições protegidas
//   3. JwtStrategy valida o token e usa esses dados

import { Role } from '../../../generated/prisma/enums';

export interface JwtPayload {
  sub: number;
  // Email do usuário (para identificar sem precisar de query extra)
  email: string;
  // Role do usuário (PASSENGER, OPERATOR ou ADMIN)
  // Serve para o RolesGuard verificar permissões sem consultar o banco
  role: Role;
}