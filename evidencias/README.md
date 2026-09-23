# Evidências dos Testes Obrigatórios

Prints das requisições e respostas correspondentes aos 10 cenários obrigatórios do enunciado (AV-05-AEROPORTO).

## Sumário

| # | Cenário | Arquivos |
|---|---|---|
| 1 | Fluxo principal com sucesso | `01-fluxo-principal.png` |
| 2 | Body inválido → 400 | `02-body-invalido.png` |
| 3 | Ausência/token inválido → 401 | `03a`, `03b`, `03c` |
| 4 | Sem permissão → 403 | `04a`, `04b`, `04c` |
| 5 | Recurso inexistente → 404 | `05a`, `05b` |
| 6 | Conflito de regra → 409 | `06a`, `06b` |
| 7 | Acesso a recurso de terceiro | `07a`, `07b` |
| 8 | Upload válido e inválido | `08a`, `08b` |
| 9 | Integração externa OK e falhando | `09a`, `09b`, `09c` |
| 10 | Fluxo completo de mudança de estado | `10a`, `10b`, `10c` |

## Ferramentas usadas

- Postman (requisições)
- Servidor rodando localmente em `http://localhost:3000`