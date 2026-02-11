# Ressoa AI

Inteligência de Aula, Análise e Previsão de Conteúdo.

Plataforma de análise pedagógica para escolas brasileiras, utilizando BNCC como benchmark curricular.

## Pré-requisitos

- **Node.js** 18+ LTS
- **npm** (package manager)
- **Docker Engine** 20+ e **Docker Compose** v2+

Verificar instalação:

```bash
node --version    # v18+
npm --version     # v9+
docker compose version  # v2+
```

## Estrutura do Projeto

```
professor-analytics/
├── ressoa-frontend/     # React 18 + Vite + TypeScript
├── ressoa-backend/      # NestJS + TypeScript strict
├── docker-compose.yml   # PostgreSQL, Redis, MinIO
├── .env.example         # Template de variáveis de ambiente
└── README.md
```

## Setup Inicial (Primeira Vez)

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com suas API keys e secrets
```

### 2. Iniciar serviços Docker

```bash
cd ressoa-backend
npm run docker:up
```

Isso inicia 3 containers:
- **PostgreSQL 14** (porta 5432) - Banco de dados principal
- **Redis 7** (porta 6379) - Filas e cache
- **MinIO** (porta 9000 API, 9001 Console) - Storage S3-compatible

### 3. Configurar backend

```bash
cd ressoa-backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### 4. Configurar frontend

```bash
cd ressoa-frontend
npm install
npm run dev
```

### 5. Acessar aplicação

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger Docs | http://localhost:3000/api/docs |
| MinIO Console | http://localhost:9001 |

## Desenvolvimento Diário

```bash
# Iniciar containers (se não estiverem rodando)
cd ressoa-backend
npm run docker:up

# Backend (terminal 1)
npm run start:dev

# Frontend (terminal 2)
cd ressoa-frontend
npm run dev
```

## Scripts Docker (a partir de ressoa-backend/)

| Script | Descrição |
|--------|-----------|
| `npm run docker:up` | Inicia containers em background |
| `npm run docker:down` | Para containers (mantém dados) |
| `npm run docker:logs` | Exibe logs em tempo real |
| `npm run docker:ps` | Status dos containers |
| `npm run docker:reset` | Remove volumes e reinicia (apaga dados!) |

## Serviços Docker

### PostgreSQL

```bash
# Conectar via Docker
docker exec -it ressoa-postgres psql -U ressoa -d ressoa_dev

# Credenciais
# Host: localhost:5432
# User: ressoa
# Password: dev_password
# Database: ressoa_dev
```

### Redis

```bash
# Conectar via Docker
docker exec -it ressoa-redis redis-cli

# Host: localhost:6379
# Sem autenticação em dev
```

### MinIO (S3-compatible)

```bash
# Console Web: http://localhost:9001
# Login: minioadmin / minioadmin
# API: http://localhost:9000
```

## Arquitetura de Serviços

```
┌────────────────────────────────────────────────────────┐
│                   Host (Developer)                     │
│                                                        │
│  ┌─────────────────┐         ┌──────────────────┐     │
│  │ ressoa-frontend │         │ ressoa-backend   │     │
│  │ Vite :5173      │────────>│ NestJS :3000     │     │
│  └─────────────────┘  HTTP   └──────────────────┘     │
│                                       │                │
│  ┌────────────────────────────────────┴──────────────┐ │
│  │         Docker Compose (ressoa-network)           │ │
│  │                                                    │ │
│  │  ┌─────────────┐  ┌────────────┐  ┌────────────┐ │ │
│  │  │ PostgreSQL  │  │ Redis      │  │ MinIO      │ │ │
│  │  │ :5432       │  │ :6379      │  │ :9000/9001 │ │ │
│  │  └─────────────┘  └────────────┘  └────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Portas em uso

```bash
# Encontrar processo usando a porta
ss -tlnp | grep -E '(5432|6379|9000|9001)'

# Ou verificar containers Docker existentes
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### Permissão negada no Docker

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
# Fazer logout e login novamente
```

### Reset completo do ambiente

```bash
cd ressoa-backend
npm run docker:reset
# Isso remove TODOS os dados e recria os containers
```

### PostgreSQL não inicializa

```bash
# Remover volume corrompido
docker compose down -v
docker volume rm professor-analytics_pg_data
docker compose up -d
```

## Variáveis de Ambiente

Veja `.env.example` para a lista completa. Variáveis importantes:

| Variável | Descrição | Valor Dev |
|----------|-----------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://ressoa:dev_password@localhost:5432/ressoa_dev` |
| `REDIS_HOST` | Redis host | `localhost` |
| `S3_ENDPOINT` | MinIO/S3 endpoint | `http://localhost:9000` |
| `JWT_SECRET` | JWT signing key (32+ chars) | Gerar com `openssl rand -base64 32` |
| `CORS_ORIGIN` | Frontend URL | `http://localhost:5173` |
