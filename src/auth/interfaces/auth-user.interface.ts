// ═══════════════════════════════════════════════════════════════════
// AuthUser — Interface do usuário AUTENTICADO
// ═══════════════════════════════════════════════════════════════════
//
// Esta interface define o formato do objeto que fica disponível
// em `request.user` DEPOIS que a JwtStrategy valida o token.
//
// Diferença entre JwtPayload e AuthUser:
//   - JwtPayload = o que está DENTRO do token (dado bruto)
//   - AuthUser   = o que fica em request.user (dado processado)
//
// Por que separar?
//   O token pode ter "sub" (número), mas o resto do código prefere
//   trabalhar com "id" (nome mais claro). O AuthUser padroniza isso.
//
// Fluxo:
//   1. Token JWT chega com payload { sub: 1, email, role }
//   2. JwtStrategy.validate() busca o usuário no banco
//   3. Retorna um AuthUser → vai para request.user
//   4. Controllers acessam via @CurrentUser()

import { Role } from '../../../generated/prisma/enums';

export interface AuthUser {
  // ID do usuário (mapeado de "sub" do JwtPayload)
  id: number;

  // Email do usuário
  email: string;

  // Role atual do usuário (buscada FRESCA do banco, não do token)
  // ⚠️ Por que do banco? Se um admin mudar o role de alguém,
  //    o próximo request já reflete a mudança, sem esperar
  //    o token expirar.
  role: Role;
}