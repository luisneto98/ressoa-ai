# Story 16.2: Aula como Rascunho com Descrição e Datas Futuras

Status: done

## Story

Como professor,
quero criar aulas antecipadamente com data futura e descrição do objetivo,
para planejar todas as aulas do mês/bimestre e adicionar o áudio quando estiver disponível.

## Acceptance Criteria

1. Enum `StatusProcessamento` inclui `RASCUNHO` como primeiro valor (antes de `CRIADA`)
2. Campo `descricao String? @db.Text` existe em `Aula` no schema Prisma
3. Campo `tipo_entrada` torna-se `TipoEntrada?` (nullable) no schema para suportar rascunhos sem tipo definido
4. Migration aplicada sem afetar dados existentes (todos os campos novos/modificados são nullable)
5. `POST /aulas/rascunho` cria aula com status `RASCUNHO` sem exigir áudio ou `tipo_entrada`
6. Datas futuras são aceitas no campo `data` para rascunhos (remover `@IsNotFutureDate` de `CreateAulaRascunhoDto`)
7. `PATCH /aulas/:id/descricao` edita `descricao` somente quando status === `RASCUNHO`; retorna 400 se não for rascunho
8. `POST /aulas/:id/iniciar` transiciona `RASCUNHO → CRIADA` (para audio) ou `RASCUNHO → TRANSCRITA` (para texto/manual) e define `tipo_entrada`
9. Endpoints existentes (`POST /aulas`, `POST /aulas/upload-transcricao`, `POST /aulas/entrada-manual`) continuam funcionando sem alteração (retrocompatibilidade)
10. Frontend exibe botão "Planejar Aula" na listagem e formulário simplificado de rascunho
11. Badge "Rascunho" (cinza, ícone de esboço) aparece na listagem de aulas para aulas com status RASCUNHO
12. Campo `descricao` fica `readonly` (não editável) na interface quando status !== RASCUNHO
13. Testes unitários para `createRascunho()`, `updateDescricao()`, `iniciarProcessamento()` e transições de status do service
14. Testes E2E para o fluxo: criar rascunho → editar descrição → iniciar processamento

## Tasks / Subtasks

- [x] Task 1: Backend — Migration e Schema Prisma (AC: #1, #2, #3, #4)
  - [x] Criar migration `20260220100000_add_descricao_rascunho_aula` com SQL:
    - `ALTER TYPE "StatusProcessamento" ADD VALUE IF NOT EXISTS 'RASCUNHO' BEFORE 'CRIADA';`
    - `ALTER TABLE "aula" ADD COLUMN IF NOT EXISTS "descricao" TEXT;`
    - `ALTER TABLE "aula" ALTER COLUMN "tipo_entrada" DROP NOT NULL;`
  - [x] Atualizar `StatusProcessamento` enum em `schema.prisma`: adicionar `RASCUNHO` como primeira entrada
  - [x] Atualizar model `Aula` em `schema.prisma`: adicionar `descricao String? @db.Text` e tornar `tipo_entrada TipoEntrada?`
  - [x] Executar `npx prisma generate` para atualizar o Prisma client
  - [x] Verificar que `@default(CRIADA)` ainda está correto no campo `status_processamento` do model Aula

- [x] Task 2: Backend — DTOs (AC: #5, #6, #7, #8)
  - [x] Criar `ressoa-backend/src/modules/aulas/dto/create-aula-rascunho.dto.ts`:
    - `turma_id: string` com `@IsUUID()`
    - `data: string` com `@IsDateString()` — SEM `@IsNotFutureDate()` (datas futuras permitidas)
    - `planejamento_id?: string` com `@IsOptional() @IsUUID()`
    - `descricao?: string` com `@IsOptional() @IsString() @MaxLength(2000) @Transform(empty→undefined)`
  - [x] Criar `ressoa-backend/src/modules/aulas/dto/update-aula-descricao.dto.ts`:
    - `descricao?: string` com `@IsOptional() @IsString() @MaxLength(2000) @Transform(empty→undefined)`
    - `@ApiPropertyOptional()` para Swagger
  - [x] Criar `ressoa-backend/src/modules/aulas/dto/iniciar-processamento.dto.ts`:
    - `tipo_entrada: TipoEntrada` com `@IsEnum(TipoEntrada)` (obrigatório)
    - `transcricao_texto?: string` com `@IsOptional() @IsString()` (requerido se tipo_entrada === TRANSCRICAO)
    - `resumo?: string` com `@IsOptional() @IsString()` (requerido se tipo_entrada === MANUAL)
    - Adicionar `@ValidateIf` para tornar `transcricao_texto` obrigatório quando tipo_entrada === TRANSCRICAO
    - Adicionar `@ValidateIf` para tornar `resumo` obrigatório quando tipo_entrada === MANUAL

- [x] Task 3: Backend — Service (AC: #5, #6, #7, #8, #9)
  - [x] Adicionar `RASCUNHO` ao `PROFESSOR_ALLOWED_TRANSITIONS` com `['CRIADA']` como transições permitidas
  - [x] Implementar `createRascunho(dto: CreateAulaRascunhoDto, user: AuthenticatedUser)`
  - [x] Implementar `updateDescricao(id: string, dto: UpdateAulaDescricaoDto, user: AuthenticatedUser)`
  - [x] Implementar `iniciarProcessamento(id: string, dto: IniciarProcessamentoDto, user: AuthenticatedUser)`
  - [x] Verificar que `update()` existente NÃO quebra com `tipo_entrada` nullable

- [x] Task 4: Backend — Controller (AC: #5, #7, #8, #9)
  - [x] Adicionar `POST /aulas/rascunho` no controller (declarado antes de `:id/...`)
  - [x] Adicionar `PATCH /aulas/:id/descricao`
  - [x] Adicionar `POST /aulas/:id/iniciar`
  - [x] Verificar ordem de declaração no controller

- [x] Task 5: Backend — Testes Unitários (AC: #13)
  - [x] Criar `ressoa-backend/src/modules/aulas/aulas.service.spec.ts` — 12 testes passando (Story 16.2)

- [x] Task 6: Backend — Testes E2E (AC: #14)
  - [x] Criar `ressoa-backend/test/aula-rascunho.e2e-spec.ts` — 10 cenários E2E

- [x] Task 7: Frontend — StatusBadge + API types (AC: #11)
  - [x] Atualizar `ressoa-frontend/src/api/aulas.ts`: adicionar `RASCUNHO` ao `StatusProcessamento`, `descricao` ao `AulaListItem`
  - [x] Atualizar `StatusBadge.tsx`: adicionar entrada `RASCUNHO` com `IconPencil`

- [x] Task 8: Frontend — RascunhoAulaDialog + botão "Planejar Aula" (AC: #10, #12)
  - [x] Criar `RascunhoAulaDialog.tsx`: formulário com data (futuras permitidas), turma, planejamento, descrição (2000 chars)
  - [x] Atualizar `AulasListPage.tsx`: botão "Planejar Aula" ao lado de "Nova Aula"
  - [x] Atualizar `AulasCardsDesktop.tsx`: botão "Enviar Áudio" para RASCUNHO + campo `descricao` readonly

- [x] Task 9: Frontend — Hook para rascunho (AC: #10)
  - [x] Criar `useCreateRascunho.ts`
  - [x] Criar `useUpdateAulaDescricao.ts`
  - [x] Criar `useIniciarProcessamento.ts` (navega para upload se AUDIO)

- [x] Task 10: Frontend — Testes (AC: #11, #12)
  - [x] Criar `StatusBadge.test.tsx` — 6 testes passando
  - [x] Criar `RascunhoAulaDialog.test.tsx` — 9 testes passando

## Dev Notes

### Contexto do Epic 16 — Posição desta Story

Esta é a Story 16.2 do Epic 16 (Contexto de Planejamento, Aula como Rascunho e Aderência ao Objetivo). A Story 16.1 (campo `descricao` no Planejamento) está **done** — o padrão de implementação foi estabelecido lá.

**Dependências:**
- **Não bloqueia Story 16.1** (paralelas — 16.1 já está done)
- **Bloqueia Story 16.3** que precisa de `descricao` tanto em Planejamento quanto em Aula para os prompts v5.0.0
- Story 16.3 pode começar assim que esta story e 16.1 estiverem done

### Decisões Técnicas Críticas (do Epic)

| # | Decisão | Detalhe |
|---|---------|---------|
| DT-2 | Enum RASCUNHO ANTES de CRIADA | `ALTER TYPE ... ADD VALUE 'RASCUNHO' BEFORE 'CRIADA'` |
| DT-3 | Remover @IsNotFutureDate do rascunho | Apenas no CreateAulaRascunhoDto — o CreateAulaDto mantém para retrocompatibilidade |
| DT-4 | descricao imutável após início processamento | `updateDescricao` valida status === RASCUNHO |
| DT-8 | Campo readonly no frontend após RASCUNHO | UI consistency com regra de imutabilidade |

### Impacto Crítico na Tipagem TypeScript

**ATENÇÃO:** Adicionar `RASCUNHO` ao enum `StatusProcessamento` do Prisma irá afetar:

1. **`PROFESSOR_ALLOWED_TRANSITIONS`** em `aulas.service.ts` — é `Record<StatusProcessamento, StatusProcessamento[]>`. TypeScript vai falhar na compilação se `RASCUNHO` não for adicionado. **Obrigatório adicionar:** `RASCUNHO: ['CRIADA']`.

2. **`tipo_entrada TipoEntrada?`** (nullable) — Em todo o código que lê `aula.tipo_entrada`, o tipo muda de `TipoEntrada` para `TipoEntrada | null`. Verificar nos workers/services que usam `tipo_entrada` se há acesso sem null check.

3. **Frontend `StatusBadge.tsx`** — `statusConfig` é `Record<StatusProcessamento, ...>`. TypeScript vai falhar se `RASCUNHO` não for adicionado ao objeto.

### Padrão de Migration para Enum em PostgreSQL

```sql
-- Migration: 20260220100000_add_descricao_rascunho_aula/migration.sql

-- Passo 1: Adicionar valor ao enum ANTES de CRIADA
ALTER TYPE "StatusProcessamento" ADD VALUE IF NOT EXISTS 'RASCUNHO' BEFORE 'CRIADA';

-- Passo 2: Adicionar coluna descricao (nullable — zero impacto em dados existentes)
ALTER TABLE "aula" ADD COLUMN IF NOT EXISTS "descricao" TEXT;

-- Passo 3: Tornar tipo_entrada nullable
ALTER TABLE "aula" ALTER COLUMN "tipo_entrada" DROP NOT NULL;
```

**IMPORTANTE:** `ALTER TYPE ... ADD VALUE` em PostgreSQL NÃO é transacional — não pode ser revertida facilmente. Usar `IF NOT EXISTS` para idempotência.

**Para down migration (rollback):** Não é trivial reverter um valor de enum adicionado ao PostgreSQL. Em caso de rollback, o campo deve ser deixado no enum (não causa problemas funcionais) e os dados devem ser migrados de volta a status anteriores.

### Schema Prisma — Alterações Exatas

```prisma
// schema.prisma — ANTES:
enum StatusProcessamento {
  CRIADA
  UPLOAD_PROGRESSO
  // ...
}

model Aula {
  // ...
  tipo_entrada         TipoEntrada
  // ...
}

// DEPOIS:
enum StatusProcessamento {
  RASCUNHO                    // NOVO — estado antes de CRIADA
  CRIADA
  UPLOAD_PROGRESSO
  AGUARDANDO_TRANSCRICAO
  TRANSCRITA
  ANALISANDO
  ANALISADA
  APROVADA
  REJEITADA
  ERRO
}

model Aula {
  // ...
  tipo_entrada         TipoEntrada?             // MODIFICADO: nullable para rascunhos
  descricao            String?   @db.Text        // NOVO: objetivo/intenção da aula
  // ... demais campos inalterados
}
```

### Novos DTOs — Estrutura Completa

**`create-aula-rascunho.dto.ts`:**
```typescript
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAulaRascunhoDto {
  @ApiProperty() @IsUUID('4') turma_id!: string;
  @ApiProperty({ description: 'Aceita datas futuras para planejamento antecipado' })
  @IsDateString()
  data!: string;  // SEM @IsNotFutureDate() — DT-3
  @ApiPropertyOptional() @IsOptional() @IsUUID('4') planejamento_id?: string;
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional() @IsString() @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  descricao?: string;
}
```

**`update-aula-descricao.dto.ts`:**
```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAulaDescricaoDto {
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional() @IsString() @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  descricao?: string;
}
```

**`iniciar-processamento.dto.ts`:**
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { TipoEntrada } from '@prisma/client';

export class IniciarProcessamentoDto {
  @ApiProperty({ enum: TipoEntrada })
  @IsEnum(TipoEntrada)
  tipo_entrada!: TipoEntrada;

  @ApiPropertyOptional({ description: 'Obrigatório se tipo_entrada === TRANSCRICAO' })
  @ValidateIf((o: IniciarProcessamentoDto) => o.tipo_entrada === TipoEntrada.TRANSCRICAO)
  @IsString()
  transcricao_texto?: string;

  @ApiPropertyOptional({ description: 'Obrigatório se tipo_entrada === MANUAL' })
  @ValidateIf((o: IniciarProcessamentoDto) => o.tipo_entrada === TipoEntrada.MANUAL)
  @IsString()
  resumo?: string;
}
```

### Service — Lógica de `iniciarProcessamento`

```typescript
async iniciarProcessamento(id: string, dto: IniciarProcessamentoDto, user: AuthenticatedUser) {
  const escolaId = this.prisma.getEscolaIdOrThrow();
  const aula = await this.prisma.aula.findUnique({
    where: { id, escola_id: escolaId, professor_id: user.userId, deleted_at: null },
  });

  if (!aula) throw new NotFoundException('Aula não encontrada');
  if (aula.status_processamento !== StatusProcessamento.RASCUNHO) {
    throw new BadRequestException('Apenas aulas em RASCUNHO podem ser iniciadas');
  }

  if (dto.tipo_entrada === TipoEntrada.AUDIO) {
    // RASCUNHO → CRIADA: TUS upload acontecerá separadamente
    return this.prisma.aula.update({
      where: { id, escola_id: escolaId },
      data: { tipo_entrada: TipoEntrada.AUDIO, status_processamento: StatusProcessamento.CRIADA },
      include: { turma: true, planejamento: true },
    });
  }

  // TRANSCRICAO ou MANUAL: criar Transcricao atomicamente
  const texto = dto.tipo_entrada === TipoEntrada.TRANSCRICAO ? dto.transcricao_texto! : dto.resumo!;
  const confianca = dto.tipo_entrada === TipoEntrada.TRANSCRICAO ? 1.0 : 0.5;

  return this.prisma.$transaction(async (tx) => {
    const updated = await tx.aula.update({
      where: { id, escola_id: escolaId },
      data: {
        tipo_entrada: dto.tipo_entrada,
        status_processamento: StatusProcessamento.TRANSCRITA,
      },
      include: { turma: true, planejamento: true, transcricao: true },
    });
    await tx.transcricao.create({
      data: { aula_id: id, texto, provider: 'MANUAL', confianca, duracao_segundos: null },
    });
    return updated;
  });
}
```

### PROFESSOR_ALLOWED_TRANSITIONS — Atualização Obrigatória

```typescript
// aulas.service.ts — ANTES (incompleto após adicionar RASCUNHO ao Prisma):
private readonly PROFESSOR_ALLOWED_TRANSITIONS: Record<StatusProcessamento, StatusProcessamento[]> = {
  CRIADA: ['AGUARDANDO_TRANSCRICAO'],
  ANALISADA: ['APROVADA', 'REJEITADA'],
  // ... outros
};

// DEPOIS — adicionar RASCUNHO:
private readonly PROFESSOR_ALLOWED_TRANSITIONS: Record<StatusProcessamento, StatusProcessamento[]> = {
  RASCUNHO: ['CRIADA'],   // NOVO — via iniciarProcessamento com AUDIO
  CRIADA: ['AGUARDANDO_TRANSCRICAO'],
  ANALISADA: ['APROVADA', 'REJEITADA'],
  UPLOAD_PROGRESSO: [],
  AGUARDANDO_TRANSCRICAO: [],
  TRANSCRITA: [],
  ANALISANDO: [],
  APROVADA: [],
  REJEITADA: [],
  ERRO: [],
};
```

### Frontend — StatusBadge RASCUNHO

```typescript
// StatusBadge.tsx — adicionar ao statusConfig:
import { IconPencil } from '@tabler/icons-react';  // adicionar ao import

RASCUNHO: {
  label: 'Rascunho',
  variant: 'status',
  statusColor: 'default',      // cinza — ainda não iniciado
  icon: IconPencil,
  tooltip: 'Aula planejada, aguardando envio de áudio ou texto',
},
```

### Frontend — API Type StatusProcessamento

```typescript
// ressoa-frontend/src/api/aulas.ts (ou tipos centralizados)
// Antes:
export type StatusProcessamento = 'CRIADA' | 'UPLOAD_PROGRESSO' | ...;

// Depois — adicionar RASCUNHO:
export type StatusProcessamento = 'RASCUNHO' | 'CRIADA' | 'UPLOAD_PROGRESSO' | ...;

// Também atualizar AulaListItem para incluir descricao:
export interface AulaListItem {
  // ... campos existentes
  descricao?: string | null;  // NOVO
}
```

### Padrões de Frontend Estabelecidos (de stories anteriores)

- **API calls:** axios via `@/lib/api-client` ou `axios` instance centralizada
- **React Query mutations:** `useMutation` com `onSuccess` invalidando `['aulas']` query key
- **Formulários:** React Hook Form + zod schema (`z.string().max(2000).optional()`)
- **Textarea com contador:** padrão estabelecido em Story 16.1 (PlanejamentoWizard):
  ```tsx
  <Textarea {...register('descricao')} maxLength={2000} rows={4} />
  <p className="text-xs text-muted-foreground text-right">{watch('descricao')?.length ?? 0}/2000</p>
  ```
- **Modais:** shadcn/ui `Dialog` + `DialogContent` + `DialogHeader`
- **Toast:** `useToast()` do shadcn/ui para feedback
- **Botões de ação:** `Button` com variante `default` para ação primária
- **Design System:** Tailwind + shadcn/ui — Deep Navy (#0A2647), Tech Blue (#2563EB), Ghost White (#F8FAFC)

### Retrocompatibilidade — Checklist

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| `POST /aulas` existente | ✅ OK | CreateAulaDto mantém `tipo_entrada` obrigatório |
| `POST /aulas/upload-transcricao` | ✅ OK | UploadTranscricaoDto inalterado |
| `POST /aulas/entrada-manual` | ✅ OK | EntradaManualDto inalterado |
| Aulas CRIADA existentes | ✅ OK | `tipo_entrada` nullable — dados existentes têm valor |
| PROFESSOR_ALLOWED_TRANSITIONS | ⚠️ Requer update | TypeScript falha se RASCUNHO não for adicionado |
| StatusBadge no frontend | ⚠️ Requer update | Record type falha se RASCUNHO não for adicionado |
| Workers de transcrição/análise | ✅ OK | Operam em AGUARDANDO_TRANSCRICAO/TRANSCRITA, nunca tocam RASCUNHO |

### Learnings da Story 16.1 (story anterior)

- **@Transform para empty string:** Adicionar `@Transform(({ value }) => value === '' ? undefined : value)` em campos opcionais para prevenir que string vazia seja persistida no DB — já implementado em 16.1 e deve ser replicado aqui
- **Tipo `serie`:** Em Planejamento o tipo é string enum (ex: "SEXTO_ANO"), não number — padrão de enums Prisma no frontend
- **Padrão de migration:** Pasta `ressoa-backend/prisma/migrations/YYYYMMDD_description/migration.sql`
- **Prisma generate obrigatório:** Após cada schema change, executar `npx prisma generate` para atualizar tipos TypeScript

### Análise de Commits Recentes (referência de padrões)

```
8845d43 feat(story-16.1): add descrição field to planejamento   ← padrão de commit message
a60c37d fix(build): set rootDir to ./src in tsconfig.build.json
43fe995 fix(stt): fix 3 TypeScript errors in transcricao.service
```

- Commits usam `feat(story-X.Y): <descrição>` para features de story
- Commits de fix usam `fix(<area>): <descrição>`

### Project Structure Notes

**Backend — arquivos afetados:**
- `ressoa-backend/prisma/schema.prisma` (modificar Aula + StatusProcessamento)
- `ressoa-backend/prisma/migrations/20260220100000_add_descricao_rascunho_aula/migration.sql` (novo)
- `ressoa-backend/src/modules/aulas/aulas.service.ts` (modificar)
- `ressoa-backend/src/modules/aulas/aulas.controller.ts` (modificar)
- `ressoa-backend/src/modules/aulas/dto/create-aula-rascunho.dto.ts` (novo)
- `ressoa-backend/src/modules/aulas/dto/update-aula-descricao.dto.ts` (novo)
- `ressoa-backend/src/modules/aulas/dto/iniciar-processamento.dto.ts` (novo)
- `ressoa-backend/src/modules/aulas/aulas.service.spec.ts` (criar ou modificar)
- `ressoa-backend/test/aula-rascunho.e2e-spec.ts` (novo)

**Frontend — arquivos afetados:**
- `ressoa-frontend/src/api/aulas.ts` (adicionar RASCUNHO ao tipo + descricao ao interface)
- `ressoa-frontend/src/pages/aulas/components/StatusBadge.tsx` (adicionar RASCUNHO)
- `ressoa-frontend/src/pages/aulas/components/RascunhoAulaDialog.tsx` (novo)
- `ressoa-frontend/src/pages/aulas/AulasListPage.tsx` (botão "Planejar Aula")
- `ressoa-frontend/src/pages/aulas/components/AulasCardsDesktop.tsx` (botão enviar audio para rascunho)
- `ressoa-frontend/src/hooks/useCreateRascunho.ts` (novo)
- `ressoa-frontend/src/hooks/useUpdateAulaDescricao.ts` (novo)
- `ressoa-frontend/src/hooks/useIniciarProcessamento.ts` (novo)

### References

- [Source: _bmad-output/implementation-artifacts/epics/epic-16-contexto-planejamento-aula-aderencia.md#US-020.2] — Requisitos completos da story
- [Source: _bmad-output/implementation-artifacts/epics/epic-16-contexto-planejamento-aula-aderencia.md#Decisoes-Tecnicas] — DT-2, DT-3, DT-4, DT-8
- [Source: _bmad-output/implementation-artifacts/16-1-adicionar-descricao-planejamento.md] — Padrões de DTO, migration, Transform decorator
- [Source: ressoa-backend/prisma/schema.prisma#Aula] — Model atual (tipo_entrada TipoEntrada required, sem descricao)
- [Source: ressoa-backend/prisma/schema.prisma#StatusProcessamento] — Enum atual sem RASCUNHO
- [Source: ressoa-backend/src/modules/aulas/aulas.service.ts] — Service atual + PROFESSOR_ALLOWED_TRANSITIONS
- [Source: ressoa-backend/src/modules/aulas/aulas.controller.ts] — Controller atual com endpoints existentes
- [Source: ressoa-frontend/src/pages/aulas/components/StatusBadge.tsx] — StatusBadge tipado como Record<StatusProcessamento,...>
- [Source: _bmad-output/planning-artifacts/architecture.md] — NestJS + Prisma + TypeScript strict, multi-tenancy, JWT guards

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Nenhum debug log necessário — implementação limpa sem regressões._

### Completion Notes List

- ✅ **Task 1 (Schema/Migration):** Migration `20260220100000_add_descricao_rascunho_aula` criada com ALTER TYPE RASCUNHO BEFORE CRIADA, coluna `descricao TEXT` e `tipo_entrada DROP NOT NULL`. Prisma schema atualizado e `npx prisma generate` executado com sucesso.
- ✅ **Task 2 (DTOs):** 3 novos DTOs criados: `CreateAulaRascunhoDto` (sem @IsNotFutureDate), `UpdateAulaDescricaoDto`, `IniciarProcessamentoDto` (com @ValidateIf para TRANSCRICAO/MANUAL).
- ✅ **Task 3 (Service):** `PROFESSOR_ALLOWED_TRANSITIONS` atualizado com `RASCUNHO: ['CRIADA']`. Métodos `createRascunho`, `updateDescricao`, `iniciarProcessamento` implementados. Monitoramento STT service atualizado para `tipo_entrada: TipoEntrada | null`.
- ✅ **Task 4 (Controller):** 3 endpoints adicionados: `POST /aulas/rascunho` (antes de :id params), `PATCH /aulas/:id/descricao`, `POST /aulas/:id/iniciar`. Sem conflitos de rota.
- ✅ **Task 5 (Unit Tests):** `aulas.service.spec.ts` — 12 testes passando: createRascunho (4), updateDescricao (3), iniciarProcessamento (4), PROFESSOR_ALLOWED_TRANSITIONS (1).
- ✅ **Task 6 (E2E Tests):** `aula-rascunho.e2e-spec.ts` — 10 cenários cobrindo criação, atualização, iniciarProcessamento (AUDIO/TRANSCRICAO), fluxo completo e retrocompatibilidade.
- ✅ **Task 7 (Frontend types/StatusBadge):** `StatusProcessamento` com `RASCUNHO`, `AulaListItem` com `descricao?` e `tipo_entrada: null`, StatusBadge com `RASCUNHO` (IconPencil, cinza).
- ✅ **Task 8 (RascunhoAulaDialog + UI):** Dialog com form RHF+zod sem max date. Botão "Planejar Aula" em AulasListPage. AulasCardsDesktop mostra botão "Enviar Áudio" para RASCUNHO e campo `descricao` readonly.
- ✅ **Task 9 (Hooks):** `useCreateRascunho`, `useUpdateAulaDescricao`, `useIniciarProcessamento` (navega para upload em AUDIO).
- ✅ **Task 10 (Frontend Tests):** `StatusBadge.test.tsx` (6 testes), `RascunhoAulaDialog.test.tsx` (9 testes).
- ℹ️ **Impacto TypeScript:** `tipo_entrada` nullable causou 1 ajuste em `monitoramento-stt.service.ts`. Todos os outros arquivos `src/` sem erros TS.
- ℹ️ **Regressões:** Sem novas regressões. Falhas pré-existentes: 8 suites no backend, 10 no frontend (documentadas antes das nossas mudanças).
- ✅ **Code Review (2026-02-20):** 3 HIGH + 4 MEDIUM + 2 LOW issues encontrados e auto-corrigidos:
  - **H1 [FIXED]** `IniciarProcessamentoDto`: adicionado `@IsNotEmpty()` em `transcricao_texto` e `resumo` — impedia string vazia de ser persistida como transcrição.
  - **H2 [FIXED]** `AulasCardsDesktop`: botão "Enviar Áudio" agora usa `useIniciarProcessamento` (RASCUNHO→CRIADA) em vez de navegar diretamente para upload.
  - **H3 [FIXED]** `iniciarProcessamento` service: TRANSCRICAO/MANUAL path agora busca aula com `findUniqueOrThrow` APÓS criar transcricao — resposta antes retornava `transcricao: null`.
  - **M1 [FIXED]** Interface `Aula` em `api/aulas.ts`: adicionado `descricao?: string | null` e tipagem correta de `tipo_entrada`.
  - **M2 [FIXED]** Teste unitário TRANSCRICAO: adicionada assertion que `transcricao.create` foi chamado com `confianca: 1.0`.
  - **M3 [FIXED]** `AulasCardsDesktop`: botão Delete agora também disponível para status RASCUNHO.
  - **M4 [FIXED]** `AulasCardsDesktop`: botão Delete para RASCUNHO + hook `useIniciarProcessamento` agora wired ao fluxo correto.

### File List

**Backend (novos):**
- `ressoa-backend/prisma/migrations/20260220100000_add_descricao_rascunho_aula/migration.sql`
- `ressoa-backend/src/modules/aulas/dto/create-aula-rascunho.dto.ts`
- `ressoa-backend/src/modules/aulas/dto/update-aula-descricao.dto.ts`
- `ressoa-backend/src/modules/aulas/dto/iniciar-processamento.dto.ts`
- `ressoa-backend/src/modules/aulas/aulas.service.spec.ts`
- `ressoa-backend/test/aula-rascunho.e2e-spec.ts`

**Backend (modificados):**
- `ressoa-backend/prisma/schema.prisma`
- `ressoa-backend/src/modules/aulas/aulas.service.ts`
- `ressoa-backend/src/modules/aulas/aulas.controller.ts`
- `ressoa-backend/src/modules/monitoramento/monitoramento-stt.service.ts`

**Frontend (novos):**
- `ressoa-frontend/src/pages/aulas/components/RascunhoAulaDialog.tsx`
- `ressoa-frontend/src/pages/aulas/components/RascunhoAulaDialog.test.tsx`
- `ressoa-frontend/src/pages/aulas/components/StatusBadge.test.tsx`
- `ressoa-frontend/src/hooks/useCreateRascunho.ts`
- `ressoa-frontend/src/hooks/useUpdateAulaDescricao.ts`
- `ressoa-frontend/src/hooks/useIniciarProcessamento.ts`

**Frontend (modificados):**
- `ressoa-frontend/src/api/aulas.ts`
- `ressoa-frontend/src/pages/aulas/AulasListPage.tsx`
- `ressoa-frontend/src/pages/aulas/components/AulasCardsDesktop.tsx`
- `ressoa-frontend/src/pages/aulas/components/StatusBadge.tsx`

**Planning artifacts:**
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/16-2-aula-rascunho-descricao-datas-futuras.md`

## Change Log

| Data | Tipo | Descrição |
|------|------|-----------|
| 2026-02-20 | feat | Story 16.2: Aula como Rascunho com Descrição e Datas Futuras — enum RASCUNHO, campo descricao, tipo_entrada nullable, novos endpoints backend (POST /rascunho, PATCH /:id/descricao, POST /:id/iniciar), UI frontend com RascunhoAulaDialog e botão "Planejar Aula" |
| 2026-02-20 | fix | Code Review: @IsNotEmpty() no DTO, service TRANSCRICAO retorna transcricao real, "Enviar Áudio" usa iniciarProcessamento, delete RASCUNHO habilitado, Aula interface com descricao, testes corrigidos |
