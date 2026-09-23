# ✈️ Gestão de Aeroporto Regional — API

API REST completa para gestão de aeroporto regional, construída com NestJS + Prisma 7 + PostgreSQL.

---

## 📚 Tecnologias

- **NestJS** + TypeScript
- **PostgreSQL**
- **Prisma 7** (com driver adapter `@prisma/adapter-pg`) + migrations
- **JWT** (autenticação) + **bcrypt** (hash de senha)
- **class-validator** + **ValidationPipe** (DTOs)
- **Helmet** + **Compression**
- **Swagger** (documentação interativa)
- **Multer** (upload de arquivos)
- **HttpService** (`@nestjs/axios`) — integração externa de clima
- **@nestjs/throttler** — rate limiting
- **Joi** (validação de variáveis de ambiente)

---

## ✅ Pré-requisitos

- Node.js 20+
- PostgreSQL 14+
- npm

---

## 🚀 Instalação

```bash
git clone <URL-DO-REPOSITORIO>
cd gestao-aeroporto
npm install
```

---

## ⚙️ Configuração (.env)

Copie o arquivo de exemplo e preencha com valores reais:

```bash
cp .env.example .env
```

Variáveis obrigatórias:

| Variável | Descrição |
|---|---|
| `NODE_ENV` | `development`, `production` ou `test` |
| `PORT` | Porta do servidor (default: 3000) |
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `JWT_SECRET` | Segredo do JWT (mín. 16 caracteres) |
| `JWT_EXPIRES_IN` | Tempo de expiração do token (ex: `8h`) |
| `X_API_KEY` | Chave da API (mín. 16 caracteres) — obrigatória em todas as rotas |
| `UPLOAD_MAX_SIZE_MB` | Tamanho máximo de upload (default: 5) |
| `UPLOAD_ALLOWED_TYPES` | Mimes permitidos, separados por vírgula |
| `WEATHER_API_URL` | URL da API de clima (Open-Meteo) |
| `WEATHER_GEOCODING_URL` | URL da API de geocoding (Open-Meteo) |
| `WEATHER_TIMEOUT_MS` | Timeout das chamadas externas em ms |

---

## 🗄️ Banco de dados

Rodar migrations e gerar o client:

```bash
npx prisma migrate deploy
npx prisma generate
```

Popular com dados de demonstração (4 companhias, 8 aeronaves, 6 portões, 11 voos, ~40 reservas, ~5 embarques):

```bash
npx prisma db seed
```

Credenciais criadas pelo seed:

| Perfil | Email | Senha |
|---|---|---|
| ADMIN | `admin@aeroporto.com` | `Admin@123` |
| OPERATOR | `operador@aeroporto.com` | `Operador@123` |
| PASSENGER | `passageiro@aeroporto.com` | `Passageiro@123` |
| PASSENGER | `passageiro2@aeroporto.com` | `Passageiro2@123` |
| PASSENGER | `maria@aeroporto.com` | `Maria@123` |
| PASSENGER | `joao@aeroporto.com` | `Joao@123` |
| PASSENGER | `ana@aeroporto.com` | `Ana@123` |
| PASSENGER | `carlos@aeroporto.com` | `Carlos@123` |

---

## ▶️ Execução

**Desenvolvimento (watch mode):**
```bash
npm run start:dev
```

**Produção:**
```bash
npm run build
npm run start:prod
```

**Swagger:** http://localhost:3000/api/docs

---

## 🧪 Build

```bash
npm run build
```

---

## 🔐 Autenticação e Segurança

- **Todas** as rotas exigem o header `X-API-KEY`.
- Rotas privadas exigem também `Authorization: Bearer <token>`.
- O token é obtido via `POST /auth/login`.
- Senhas são hasheadas com **bcrypt** e nunca retornadas nas respostas.
- Identidade do usuário é sempre extraída do JWT (`@CurrentUser`), nunca do body.

### Perfis e permissões

| Perfil | Permissões |
|---|---|
| `PASSENGER` | Criar reserva, cancelar a própria, listar as próprias, anexar documento na própria reserva, consultar clima |
| `OPERATOR` | Tudo do PASSENGER + gerenciar voos e embarques, listar todas as reservas, ver indicadores |
| `ADMIN` | Acesso total, incluindo gestão de companhias, aeronaves, portões e usuários |

---

## ⏱️ Rate Limiting

Configurado globalmente via `@nestjs/throttler`:

- **Global:** 100 requisições por minuto por IP
- **Login (`/auth/login`):** 5 tentativas por minuto por IP (proteção contra brute force)

Quando estourado, retorna `429 Too Many Requests`.

---

## 📡 Endpoints

> Todas as rotas exigem header `X-API-KEY`.
> `Auth` indica o nível de acesso exigido além do X-API-KEY.
> Rotas com **paginação** retornam `{ data: [...], meta: { total, page, limit, totalPages } }`.

### Health

| Método | URL | Auth | Descrição | Respostas |
|---|---|---|---|---|
| GET | `/health` | X-API-KEY | Status da API, banco e API externa | `200` |

### Autenticação

| Método | URL | Auth | Body | Respostas |
|---|---|---|---|---|
| POST | `/auth/login` | X-API-KEY | `{ "email", "senha" }` | `200`, `400`, `401`, `403`, `429` |

### Dashboard

| Método | URL | Auth | Descrição | Respostas |
|---|---|---|---|---|
| GET | `/dashboard/indicadores` | OPERATOR/ADMIN | Indicadores agregados do aeroporto | `200`, `403` |

### Usuários (ADMIN)

| Método | URL | Auth | Body | Respostas |
|---|---|---|---|---|
| GET | `/usuarios` | ADMIN | — | `200`, `403` |
| GET | `/usuarios/:id` | ADMIN | — | `200`, `403`, `404` |
| PATCH | `/usuarios/:id/desativar` | ADMIN | — | `200`, `400`, `403`, `404` |
| PATCH | `/usuarios/:id/reativar` | ADMIN | — | `200`, `400`, `403`, `404` |

### Companhias Aéreas

| Método | URL | Auth | Body | Respostas |
|---|---|---|---|---|
| POST | `/companhias` | OPERATOR/ADMIN | `{ "nome", "codigoIATA" }` | `201`, `400` |
| GET | `/companhias` | autenticado | — | `200` |
| GET | `/companhias/:id` | autenticado | — | `200`, `404` |
| PATCH | `/companhias/:id` | OPERATOR/ADMIN | campos parciais | `200`, `400`, `404` |
| PATCH | `/companhias/:id/desativar` | ADMIN | — | `200`, `400`, `404` |
| PATCH | `/companhias/:id/reativar` | ADMIN | — | `200`, `400`, `404` |

### Aeronaves

| Método | URL | Auth | Body | Respostas |
|---|---|---|---|---|
| POST | `/aeronaves` | OPERATOR/ADMIN | `{ "modelo", "matricula", "capacidade", "companhiaId" }` | `201`, `400` |
| GET | `/aeronaves` | autenticado | — | `200` |
| GET | `/aeronaves/:id` | autenticado | — | `200`, `404` |
| PATCH | `/aeronaves/:id` | OPERATOR/ADMIN | campos parciais | `200`, `400`, `404` |
| PATCH | `/aeronaves/:id/desativar` | ADMIN | — | `200`, `400`, `404` |
| PATCH | `/aeronaves/:id/reativar` | ADMIN | — | `200`, `400`, `404` |

### Portões

| Método | URL | Auth | Body | Respostas |
|---|---|---|---|---|
| POST | `/portoes` | OPERATOR/ADMIN | `{ "codigo", "terminal" }` | `201`, `400` |
| GET | `/portoes` | autenticado | — | `200` |
| GET | `/portoes/:id` | autenticado | — | `200`, `404` |
| PATCH | `/portoes/:id` | OPERATOR/ADMIN | campos parciais | `200`, `400`, `404` |
| PATCH | `/portoes/:id/desativar` | ADMIN | — | `200`, `400`, `404` |
| PATCH | `/portoes/:id/reativar` | ADMIN | — | `200`, `400`, `404` |

### Voos

**Paginação/filtros disponíveis em `GET /voos`:** `page`, `limit`, `orderBy`, `order`, `status`, `origem`, `destino`.

| Método | URL | Auth | Body | Respostas |
|---|---|---|---|---|
| POST | `/voos` | OPERATOR/ADMIN | `{ "numero", "origem", "destino", "dataPartida", "dataChegada", "aeronaveId", "portaoId" }` | `201`, `400`, `409` |
| GET | `/voos` | autenticado | — | `200` (paginado) |
| GET | `/voos/:id` | autenticado | — | `200`, `404` |
| GET | `/voos/:id/clima` | autenticado | — | `200`, `404`, `503`, `504` |
| PATCH | `/voos/:id` | OPERATOR/ADMIN | campos parciais | `200`, `400`, `404`, `409` |
| PATCH | `/voos/:id/status` | OPERATOR/ADMIN | `{ "status" }` | `200`, `400`, `404`, `409` |

### Reservas

**Paginação/filtros disponíveis em `GET /reservas`:** `page`, `limit`, `orderBy`, `order`, `status`, `vooId`, `usuarioId`.

| Método | URL | Auth | Body | Respostas |
|---|---|---|---|---|
| POST | `/reservas` | autenticado | `{ "vooId", "assento" }` | `201`, `400`, `404`, `409` |
| GET | `/reservas/minhas` | autenticado | — | `200` |
| GET | `/reservas` | OPERATOR/ADMIN | — | `200` (paginado), `403` |
| GET | `/reservas/:id` | autenticado | — | `200`, `403`, `404` |
| PATCH | `/reservas/:id/status` | OPERATOR/ADMIN | `{ "status" }` | `200`, `400`, `404` |
| PATCH | `/reservas/:id/cancelar` | autenticado | — | `200`, `400`, `403`, `404` |
| POST | `/reservas/:id/documento` | autenticado | `multipart/form-data` com campo `arquivo` | `201`, `400`, `403`, `404` |

### Embarques

**Paginação/filtros disponíveis em `GET /embarques`:** `page`, `limit`, `orderBy`, `order`, `status`, `vooId`.

| Método | URL | Auth | Body | Respostas |
|---|---|---|---|---|
| POST | `/embarques` | OPERATOR/ADMIN | `{ "reservaId", "observacao"? }` | `201`, `400`, `403`, `404`, `409` |
| GET | `/embarques` | OPERATOR/ADMIN | — | `200` (paginado) |
| GET | `/embarques/voo/:vooId` | OPERATOR/ADMIN | — | `200` |
| GET | `/embarques/:id` | OPERATOR/ADMIN | — | `200`, `404` |

---

## 📋 Exemplos de requisição

### Login

```http
POST /auth/login
X-API-KEY: sua-chave
Content-Type: application/json

{
  "email": "admin@aeroporto.com",
  "senha": "Admin@123"
}
```

### Criar reserva

```http
POST /reservas
X-API-KEY: sua-chave
Authorization: Bearer <token>
Content-Type: application/json

{
  "vooId": 1,
  "assento": "12A"
}
```

### Anexar documento (multipart)

```http
POST /reservas/1/documento
X-API-KEY: sua-chave
Authorization: Bearer <token>
Content-Type: multipart/form-data

arquivo: <file>
```

### Consultar clima do destino

```http
GET /voos/1/clima
X-API-KEY: sua-chave
Authorization: Bearer <token>
```

### Listar voos com filtro e paginação

```http
GET /voos?page=1&limit=10&status=PROGRAMADO&origem=gru&orderBy=dataPartida&order=asc
X-API-KEY: sua-chave
Authorization: Bearer <token>
```

### Health check

```http
GET /health
X-API-KEY: sua-chave
```

---

## 🧠 Regras de negócio

| Regra | Onde é aplicada |
|---|---|
| **Capacidade da aeronave** — não permite mais reservas que a capacidade | `reservas.service.ts` (transação com isolamento `Serializable`) |
| **Assento único por voo** — não permite 2 reservas ativas no mesmo assento | `reservas.service.ts` (checagem dentro da transação) |
| **Cancelamento libera assento** — reserva cancelada permite reservar o mesmo assento de novo | `reservas.service.ts` (filtra reservas não-canceladas na checagem) |
| **Conflito de portão** — dois voos não podem usar o mesmo portão no mesmo intervalo | `voos.service.ts` (`existeConflitoPortao`) |
| **Voo não pode ter data no passado** | `voos.service.ts` (`criar`) |
| **Cancelar voo exige zero reservas ativas** | `voos.service.ts` (`atualizarStatus`) |
| **Embarque único** — reserva não pode embarcar duas vezes | `embarques.service.ts` + `@@unique(reservaId)` |
| **Voo cancelado não permite embarque** | `embarques.service.ts` |
| **Embarque só com voo em `EMBARCANDO`** | `embarques.service.ts` |
| **Transições de status** validadas para Voo, Reserva e Embarque | Services respectivos |
| **Não operar voo com aeronave/portão inativos** | `voos.service.ts` e `reservas.service.ts` |
| **Usuário não manipula recurso de terceiros** | Guards + `@CurrentUser` + checagem nos services |

### Fluxo de estados

**Voo:** `PROGRAMADO` → `EMBARCANDO` → `DECOLADO` | `PROGRAMADO`/`EMBARCANDO` → `CANCELADO`

**Reserva:** `CONFIRMADA` → `UTILIZADA` | `CONFIRMADA` → `CANCELADA`

**Embarque:** `PENDENTE` / `REALIZADO` / `BLOQUEADO`

---

## 🌐 Integração externa

Consulta do clima no destino do voo usando a **Open-Meteo** (pública, sem chave):

1. **Geocoding**: nome do destino → lat/lon (`WEATHER_GEOCODING_URL`)
2. **Clima**: lat/lon → temperatura + vento (`WEATHER_API_URL`)

Siglas IATA conhecidas (GRU, GIG, BSB, etc.) são traduzidas para o nome da cidade antes da consulta.

Erros tratados:
- Timeout → `504`
- Destino não encontrado → `404`
- API indisponível → `503`

---

## 🎯 Interceptor

`LoggingInterceptor` (global) — registra método, rota, status e tempo de execução de cada requisição. Não contém regra de negócio.

Exemplo de log:
```
[HTTP] GET /voos → 200 (12ms)
```

---

## 🩺 Health Check

`GET /health` retorna o estado atual dos serviços:

```json
{
  "status": "ok",
  "timestamp": "2026-09-22T16:20:00.000Z",
  "uptimeSegundos": 3600,
  "servicos": {
    "database": { "status": "ok" },
    "climaApi": { "status": "ok" }
  }
}
```

Se algo falhar, `status` vira `degraded` e o serviço problemático retorna `{ "status": "error", "mensagem": "..." }`.

---

## 📊 Dashboard

`GET /dashboard/indicadores` retorna métricas agregadas:

- Total de voos por status
- Taxa média de ocupação das aeronaves (percentual)
- Portão mais usado (em voos não-cancelados)
- Total de embarques nas últimas 24h
- Companhia com mais reservas ativas

---

## 🔒 Segurança

- `X-API-KEY` obrigatório em todas as rotas (guard global)
- JWT secret via env
- `.env` fora do Git
- Helmet + Compression habilitados
- Rate limiting global + específico no login
- Rotas privadas protegidas por `JwtAuthGuard`
- Autorização por `RolesGuard` + `@Roles`
- Senhas nunca retornadas nas respostas
- Upload validado por tipo e tamanho

---

## 📂 Estrutura do projeto

```
src/
├── aeronaves/        # CRUD + ativar/desativar
├── auth/             # Login, JWT, guards, decorators
├── common/
│   ├── dto/          # PaginationDto
│   ├── guards/       # ApiKeyGuard
│   └── interceptors/ # LoggingInterceptor
├── companhias/       # CRUD + ativar/desativar
├── config/           # Validação de env (Joi)
├── dashboard/        # Indicadores agregados
├── embarques/        # Embarque de reservas
├── health/           # Health check
├── portoes/          # CRUD + ativar/desativar
├── prisma/           # PrismaService + Module
├── reservas/         # Reservas + upload de documento
├── usuarios/         # Gestão de usuários
├── voos/             # Voos + integração de clima + paginação
├── app.module.ts
└── main.ts

prisma/
├── migrations/
├── schema.prisma
└── seed/
```

---

## 🧪 Status HTTP utilizados

| Código | Quando |
|---|---|
| `200` | Sucesso (GET, PATCH) |
| `201` | Criado com sucesso (POST) |
| `400` | Body/params inválidos, transição de status inválida, estado incompatível |
| `401` | Sem token ou token inválido, `X-API-KEY` ausente/inválida |
| `403` | Autenticado mas sem permissão (role errada ou recurso de terceiro) |
| `404` | Recurso inexistente |
| `409` | Conflito de regra de negócio (capacidade, portão, duplicidade, voo cancelado, data) |
| `429` | Rate limit estourado |
| `503` | API externa indisponível |
| `504` | API externa timeout |