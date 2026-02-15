# Ressoa AI - Backend

Backend API para a plataforma Ressoa AI - Inteligência de Aula, Análise e Previsão de Conteúdo.

## Tech Stack

- **Framework:** NestJS (TypeScript strict mode)
- **ORM:** Prisma 7 + PostgreSQL 14+
- **Queue:** Bull (Redis-based)
- **Auth:** Passport JWT + bcrypt
- **Validation:** class-validator + class-transformer
- **Docs:** Swagger/OpenAPI
- **Rate Limiting:** @nestjs/throttler

## Pré-requisitos

- Node.js 18+ LTS
- npm (package manager)
- Docker Engine 20+ e Docker Compose v2+

> PostgreSQL, Redis e MinIO rodam via Docker Compose. Veja o [README raiz](../README.md) para setup completo.

## Setup

```bash
# 1. Iniciar serviços Docker (PostgreSQL, Redis, MinIO)
npm run docker:up

# 2. Instalar dependências
npm install

# 3. Copiar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações locais

# 4. Gerar Prisma Client
npx prisma generate

# 5. Aplicar migrations
npx prisma migrate dev

# 6. Iniciar em modo desenvolvimento
npm run start:dev
```

## Credenciais de Desenvolvimento

⚠️ **ATENÇÃO:** Estas credenciais são APENAS para desenvolvimento local. **NUNCA** use em produção!

### Admin (Acesso Global)
- **Email:** `admin@ressoaai.com`
- **Senha:** `Admin@123`
- **Role:** ADMIN
- **Acesso:** Todas as escolas (multi-tenancy bypass)

### Escola Demo ABC (CNPJ: 12.345.678/0001-90)
- **Professor:** `professor@escolademo.com` | `Demo@123`
- **Coordenador:** `coordenador@escolademo.com` | `Demo@123`
- **Diretor:** `diretor@escolademo.com` | `Demo@123`

### Como Usar
1. Execute o seed: `npx prisma db seed`
2. Faça login com qualquer credencial acima no endpoint `POST /api/v1/auth/login`
3. Use o token JWT retornado para acessar endpoints protegidos

## Scripts Disponíveis

```bash
npm run start         # Iniciar servidor
npm run start:dev     # Iniciar com hot-reload
npm run start:debug   # Iniciar com debug
npm run build         # Compilar TypeScript
npm run test          # Rodar testes unitários
npm run test:e2e      # Rodar testes e2e
npm run test:cov      # Rodar testes com cobertura
npm run lint          # Verificar código com ESLint
npm run docker:up     # Iniciar containers Docker
npm run docker:down   # Parar containers
npm run docker:logs   # Logs em tempo real
npm run docker:ps     # Status dos containers
npm run docker:reset  # Reset completo (apaga dados!)
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1` | Health check |
| GET | `/api/docs` | Swagger UI |

## Estrutura de Pastas

```
src/
├── modules/              # Feature modules (domain-driven)
│   ├── auth/             # Authentication
│   ├── usuarios/         # User management
│   ├── escolas/          # School management
│   ├── turmas/           # Class management
│   ├── planejamento/     # Quarterly planning
│   ├── aulas/            # Lesson CRUD
│   ├── upload/           # TUS upload
│   ├── transcricao/      # STT service
│   ├── analise/          # LLM analysis
│   ├── relatorios/       # Reports
│   └── dashboards/       # Dashboards
├── common/               # Shared code
│   ├── guards/           # Auth guards
│   ├── interceptors/     # Logging, Transform
│   ├── pipes/            # Custom validation
│   └── decorators/       # Custom decorators
├── config/               # Environment configuration
│   └── env.ts            # Zod validation schema
├── prisma/               # Prisma ORM service
│   ├── prisma.service.ts # Injectable Prisma client
│   └── prisma.module.ts  # Global Prisma module
├── app.module.ts         # Root module
└── main.ts               # Entry point
```

## Configuração de Providers (IA)

O arquivo `providers.config.json` na raiz do backend controla qual provider de IA é usado para cada etapa do pipeline de análise.

### Estrutura

```json
{
  "version": "1.0.0",
  "stt": {
    "primary": "GROQ_WHISPER",
    "fallback": "WHISPER"
  },
  "llm": {
    "analise_cobertura": { "primary": "GEMINI_FLASH", "fallback": "CLAUDE_SONNET" },
    "analise_qualitativa": { "primary": "GEMINI_FLASH", "fallback": "CLAUDE_SONNET" },
    "relatorio": { "primary": "GEMINI_FLASH", "fallback": "GPT4_MINI" },
    "exercicios": { "primary": "GPT4_MINI", "fallback": "GEMINI_FLASH" },
    "alertas": { "primary": "GEMINI_FLASH", "fallback": "CLAUDE_SONNET" }
  }
}
```

### Providers Disponíveis

| Tipo | Key | Serviço |
|------|-----|---------|
| STT | `WHISPER` | OpenAI Whisper |
| STT | `GOOGLE` | Google Cloud Speech |
| STT | `GROQ_WHISPER` | Groq Whisper Large v3 Turbo |
| LLM | `CLAUDE_SONNET` | Anthropic Claude Sonnet |
| LLM | `GPT4_MINI` | OpenAI GPT-4 mini |
| LLM | `GEMINI_FLASH` | Google Gemini 2.0 Flash |

### Como Funciona

- **Primary:** Provider usado por padrão para cada etapa
- **Fallback:** Provider alternativo ativado automaticamente se o primary falhar (timeout, API error)
- **Hot-reload:** Alterações no arquivo são detectadas automaticamente (sem restart)
- Se o arquivo não existir, defaults conservadores são usados (Claude + Whisper)

### Variáveis de Ambiente Necessárias

Cada provider requer suas API keys no `.env`:

```bash
# OpenAI (Whisper + GPT)
OPENAI_API_KEY=sk-...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Google (Gemini)
GOOGLE_AI_API_KEY=...

# Groq (Whisper)
GROQ_API_KEY=gsk_...
```

## Variáveis de Ambiente

Veja `.env.example` para a lista completa de variáveis necessárias.
