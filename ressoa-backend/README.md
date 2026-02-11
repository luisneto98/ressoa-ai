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

## Variáveis de Ambiente

Veja `.env.example` para a lista completa de variáveis necessárias.
