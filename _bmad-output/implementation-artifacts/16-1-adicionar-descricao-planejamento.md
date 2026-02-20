# Story 16.1: Adicionar campo descricao ao Planejamento

Status: done

## Story

Como professor,
quero poder descrever as metodologias, ênfases e estratégias que pretendo aplicar no bimestre,
para que o sistema tenha contexto sobre meu planejamento ao analisar as aulas.

## Acceptance Criteria

1. Campo `descricao` existe no schema Prisma (`String? @db.Text`) e migration aplicada sem quebrar dados existentes
2. `CreatePlanejamentoDto` aceita `descricao` como campo opcional com validação `@IsOptional() @IsString() @MaxLength(2000)`
3. Planejamentos existentes continuam funcionando sem alteração (campo nullable — retrocompatibilidade garantida)
4. `planejamento.service.ts` persiste `descricao` no `create` e retorna o campo em `findOne` e `findAll`
5. Frontend exibe `<Textarea>` no formulário de criação de planejamento com placeholder e contador de 2000 caracteres
6. Descrição é exibida na página de visualização do planejamento existente
7. Endpoint `PATCH /api/v1/planejamentos/:id` aceita e persiste atualização de `descricao`
8. Testes unitários para service (create/findOne com descricao) e DTO (validação MaxLength)
9. Teste E2E para criação de planejamento com `descricao` e verificação de retorno na API

## Tasks / Subtasks

- [x] Task 1: Backend — Migration e Schema Prisma (AC: #1)
  - [x] Criar migration `20260220000000_add_descricao_planejamento` adicionando `descricao TEXT` nullable à tabela `planejamento`
  - [x] Adicionar `descricao String? @db.Text` ao model `Planejamento` em `schema.prisma`
  - [x] Executar `npx prisma migrate dev` e verificar que dados existentes não são afetados

- [x] Task 2: Backend — DTO e validações (AC: #2, #3)
  - [x] Adicionar campo `descricao` em `CreatePlanejamentoDto` com decorators `@IsOptional()`, `@IsString()`, `@MaxLength(2000)`, `@ApiPropertyOptional()`
  - [x] Verificar que `UpdatePlanejamentoDto extends PartialType(CreatePlanejamentoDto)` herda automaticamente o campo

- [x] Task 3: Backend — Service (AC: #4, #7)
  - [x] Atualizar `create()`: incluir `descricao: dto.descricao` no `prisma.planejamento.create()`
  - [x] Verificar que `findOne()` e `findAll()` já retornam todos os campos escalares (Prisma select *)
  - [x] Verificar que `update()` já suporta `descricao` via UpdatePlanejamentoDto (sem alteração extra necessária se PartialType já cobre)

- [x] Task 4: Backend — Testes unitários (AC: #8)
  - [x] Atualizar `planejamento.service.spec.ts`: adicionar caso de teste `create com descricao` verificando que campo é persistido
  - [x] Adicionar caso de teste `create sem descricao` verificando que campo fica null (retrocompatibilidade)
  - [x] Adicionar caso de teste DTO: `descricao com 2001 chars` deve falhar na validação

- [x] Task 5: Backend — Teste E2E (AC: #9)
  - [x] Criar ou atualizar arquivo E2E de planejamento com casos:
    - `POST /planejamentos` com `descricao` retorna 201 e inclui `descricao` no body
    - `GET /planejamentos/:id` retorna `descricao` corretamente
    - `PATCH /planejamentos/:id` atualiza `descricao` com sucesso
    - `POST /planejamentos` sem `descricao` continua funcionando (AC#3)

- [x] Task 6: Frontend — Textarea no PlanejamentoWizard (AC: #5)
  - [x] Adicionar campo `descricao` ao estado do formulário/schema zod do wizard
  - [x] Inserir `<Textarea>` com label "Descreva suas metodologias, ênfases e estratégias para o bimestre (opcional)"
  - [x] Placeholder: `"Ex: Pretendo usar material concreto para frações, ênfase em resolução de problemas contextualizados, avaliação formativa contínua..."`
  - [x] Contador visual de caracteres: `{descricao.length}/2000`
  - [x] Incluir `descricao` no payload do `POST /planejamentos`

- [x] Task 7: Frontend — Exibição na visualização de planejamento (AC: #6)
  - [x] Localizar onde `PlanejamentosListPage.tsx` ou componentes exibem detalhes do planejamento
  - [x] Adicionar seção "Descrição do Planejamento" que exibe o campo `descricao` quando preenchido (condicional — não exibir se null/vazio)
  - [x] Estilo: typography `text-sm text-muted-foreground` dentro de um card ou seção colapsável

- [x] Task 8: Frontend — Testes (AC: #8 parcial)
  - [x] Adicionar testes unitários para o formulário do wizard verificando rendering do textarea
  - [x] Verificar que contador de caracteres atualiza corretamente

## Dev Notes

### Contexto do Epic 16
Esta story é a primeira de 6 stories do Epic 16 (Contexto de Planejamento, Aula como Rascunho e Aderência ao Objetivo). O campo `descricao` adicionado aqui será **consumido nas stories 16-3 e 16-4** para enriquecer o pipeline de IA com contexto pedagógico. Implementar o campo corretamente e retorná-lo na API é crítico para as stories futuras.

### Dependências
- **Nenhuma dependência externa** — pode ser implementada em paralelo com Story 16-2
- **Bloqueia:** Story 16-3 (que precisa de `descricao` no Planejamento e na Aula para os prompts v5.0.0)

### Padrões de Arquitetura Backend

**NestJS + Prisma patterns estabelecidos:**
- DTOs em `src/modules/planejamento/dto/create-planejamento.dto.ts`
- Todos os campos opcionais usam `@IsOptional()` + decorators de tipo (nunca usar `@IsOptional()` sem `@IsString()` etc.)
- `UpdatePlanejamentoDto extends PartialType(CreatePlanejamentoDto)` — herança automática, não duplicar campos
- Service usa `prisma.planejamento.create({ data: { ...dto, escola_id, professor_id } })` — passar `descricao` diretamente
- Multi-tenancy obrigatório: toda operação usa `escola_id` do usuário autenticado (via `user.escola_id`)
- Guards: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.PROFESSOR)`

**Convenção de migration:**
- Pasta: `ressoa-backend/prisma/migrations/20260220000000_add_descricao_planejamento/`
- Arquivo: `migration.sql`
- Conteúdo esperado:
```sql
-- AlterTable
ALTER TABLE "planejamento" ADD COLUMN "descricao" TEXT;
```

**Schema Prisma — localização do model Planejamento:**
- Arquivo: `ressoa-backend/prisma/schema.prisma`
- Model `Planejamento` está em torno da linha 285
- Adicionar após `professor_id` e antes de `validado_coordenacao`:
```prisma
descricao     String?   @db.Text  // Contexto bimestral do professor (Epic 16)
```

**DTO atual (create-planejamento.dto.ts) — adicionar após campos existentes:**
```typescript
@ApiPropertyOptional({
  description: 'Descrição das metodologias, ênfases e estratégias do bimestre',
  maxLength: 2000,
  example: 'Pretendo usar material concreto para frações...',
})
@IsOptional()
@IsString()
@MaxLength(2000)
descricao?: string;
```

### Padrões Frontend

**Stack do frontend:**
- React 18 + Vite + TypeScript strict
- Zustand (estado global), React Query + axios (API)
- React Hook Form + zod (formulários)
- shadcn/ui components: `Textarea`, `Label`, `Card`
- Design System: Tailwind CSS, cores do projeto (Deep Navy #0A2647, Tech Blue #2563EB)

**PlanejamentoWizard.tsx** (`ressoa-frontend/src/pages/planejamento/PlanejamentoWizard.tsx`):
- Arquivo ~5,375 bytes — formulário wizard com múltiplos steps
- Padrão de formulário: `useForm` do React Hook Form + validação zod
- Adicionar `descricao` ao schema zod: `descricao: z.string().max(2000).optional()`
- Inserir `<Textarea>` no step adequado (provavelmente no step inicial de dados básicos)
- Componente `Textarea` disponível via `@/components/ui/textarea` (shadcn/ui)

**Exemplo de Textarea com contador:**
```tsx
<div className="space-y-1">
  <Label htmlFor="descricao">Descrição do Planejamento (opcional)</Label>
  <Textarea
    id="descricao"
    placeholder="Ex: Pretendo usar material concreto para frações, ênfase em resolução de problemas..."
    maxLength={2000}
    rows={4}
    {...register('descricao')}
  />
  <p className="text-xs text-muted-foreground text-right">
    {watch('descricao')?.length ?? 0}/2000
  </p>
</div>
```

**PlanejamentosListPage.tsx** (`ressoa-frontend/src/pages/planejamento/PlanejamentosListPage.tsx`):
- Arquivo ~8,380 bytes — listagem com filtros
- Identificar onde são exibidos os detalhes de cada planejamento (card/drawer/modal)
- Adicionar renderização condicional da `descricao`:
```tsx
{planejamento.descricao && (
  <div className="mt-2">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descrição</p>
    <p className="text-sm text-foreground mt-1">{planejamento.descricao}</p>
  </div>
)}
```

### Retrocompatibilidade

Campo `descricao` é `nullable` no banco e `optional` no DTO. **Planejamentos existentes não são afetados.** A API continua retornando `descricao: null` para registros antigos — o frontend deve tratar `null` como ausente e não exibir a seção.

### Migration Safety

Dados existentes não são afetados — `ALTER TABLE ADD COLUMN ... TEXT` sem `NOT NULL` e sem `DEFAULT` em PostgreSQL é uma operação segura e rápida (sem rewrite de tabela em versões recentes). Validar com:
```sql
SELECT COUNT(*) FROM planejamento WHERE descricao IS NOT NULL;
-- Deve retornar 0 após a migration
```

### Project Structure Notes

- **Schema:** `ressoa-backend/prisma/schema.prisma` (model Planejamento ~linha 285)
- **Migration:** `ressoa-backend/prisma/migrations/20260220000000_add_descricao_planejamento/migration.sql`
- **DTO:** `ressoa-backend/src/modules/planejamento/dto/create-planejamento.dto.ts`
- **Service:** `ressoa-backend/src/modules/planejamento/planejamento.service.ts`
- **Controller:** `ressoa-backend/src/modules/planejamento/planejamento.controller.ts`
- **Tests:** `ressoa-backend/src/modules/planejamento/planejamento.service.spec.ts`
- **Frontend Wizard:** `ressoa-frontend/src/pages/planejamento/PlanejamentoWizard.tsx`
- **Frontend List:** `ressoa-frontend/src/pages/planejamento/PlanejamentosListPage.tsx`

### References

- [Source: _bmad-output/implementation-artifacts/epics/epic-16-contexto-planejamento-aula-aderencia.md#US-020.1] — Requisitos completos da story
- [Source: _bmad-output/implementation-artifacts/epics/epic-16-contexto-planejamento-aula-aderencia.md#Decisoes-Tecnicas] — DT-1: `descricao String? @db.Text`, DT-4: imutabilidade pós-processamento (não se aplica a esta story — planejamento não tem ciclo de status como Aula)
- [Source: ressoa-backend/prisma/schema.prisma#Planejamento] — Model atual sem `descricao`
- [Source: ressoa-backend/src/modules/planejamento/dto/create-planejamento.dto.ts] — DTO atual sem `descricao`
- [Source: ressoa-backend/prisma/migrations/20260214400000_add_objetivo_aprendizagem/migration.sql] — Padrão de migration usado anteriormente
- [Source: _bmad-output/planning-artifacts/architecture.md] — NestJS + Prisma + TypeScript strict, class-validator DTOs, multi-tenancy com escola_id

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- ✅ Task 1: Migration SQL criada em `prisma/migrations/20260220000000_add_descricao_planejamento/migration.sql`. Schema atualizado com `descricao String? @db.Text`. Prisma client regenerado (`npx prisma generate`) — Prisma types agora incluem `descricao` no model Planejamento.
- ✅ Task 2: `CreatePlanejamentoDto` atualizado com `descricao?: string` e decorators `@IsOptional() @IsString() @MaxLength(2000) @ApiPropertyOptional()`. `UpdatePlanejamentoDto` herda automaticamente via `PartialType(CreatePlanejamentoDto)`.
- ✅ Task 3: `planejamento.service.ts` atualizado — `create()` passa `descricao: dto.descricao` ao Prisma; `update()` passa `descricao: dto.descricao`. `findOne()` e `findAll()` retornam todos os campos escalares por padrão (incluindo `descricao`) sem necessidade de alteração.
- ✅ Task 4: 3 novos testes unitários adicionados a `planejamento.service.spec.ts` no describe `Story 16.1`. Total: 19/19 testes passando.
- ✅ Task 5: 5 novos testes E2E adicionados a `test/planejamento.e2e-spec.ts` no describe `Story 16.1`. Cobrem POST com descricao, GET, PATCH, POST sem descricao, e POST com descricao > 2000 chars.
- ✅ Task 6: `usePlanejamentoWizard.ts` — `formData` agora inclui `descricao?: string`. `Step1DadosGerais.tsx` — schema Zod atualizado, Textarea adicionado com contador, payload inclui `descricao`. `Step3Revisao.tsx` — payload inclui `descricao` se preenchido.
- ✅ Task 7: `usePlanejamentos.ts` — tipo `Planejamento` agora inclui `descricao?: string | null`. `ViewPlanejamentoDialog.tsx` — exibe `descricao` condicionalmente (quando preenchido) com tipografia `text-xs font-medium text-muted-foreground uppercase tracking-wide` + `text-sm text-foreground`.
- ✅ Task 8: `Step1DadosGerais.test.tsx` criado com 6 testes cobrindo rendering do Textarea, label, contador 0/2000, atualização do contador, placeholder e atributo maxLength. 6/6 testes passando.

### File List

- `ressoa-backend/prisma/migrations/20260220000000_add_descricao_planejamento/migration.sql` (new)
- `ressoa-backend/prisma/schema.prisma` (modified)
- `ressoa-backend/src/modules/planejamento/dto/create-planejamento.dto.ts` (modified)
- `ressoa-backend/src/modules/planejamento/planejamento.service.ts` (modified)
- `ressoa-backend/src/modules/planejamento/planejamento.service.spec.ts` (modified)
- `ressoa-backend/test/planejamento.e2e-spec.ts` (modified)
- `ressoa-frontend/src/pages/planejamento/hooks/usePlanejamentoWizard.ts` (modified)
- `ressoa-frontend/src/pages/planejamento/hooks/usePlanejamentos.ts` (modified)
- `ressoa-frontend/src/pages/planejamento/components/Step1DadosGerais.tsx` (modified)
- `ressoa-frontend/src/pages/planejamento/components/Step3Revisao.tsx` (modified)
- `ressoa-frontend/src/pages/planejamento/components/ViewPlanejamentoDialog.tsx` (modified)
- `ressoa-frontend/src/pages/planejamento/components/Step1DadosGerais.test.tsx` (new)
- `ressoa-frontend/src/pages/planejamento/components/ViewPlanejamentoDialog.tsx` (modified - serieLabel map + tipo fix)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-02-20: Story 16.1 implementada — campo `descricao` adicionado ao Planejamento (schema + backend + frontend). Migration SQL + Prisma schema + DTO + Service + 3 unit tests + 5 E2E tests + Textarea no wizard + exibição no ViewDialog + 6 frontend tests.
- 2026-02-20: Code review complete — 2 HIGH + 2 MEDIUM issues auto-fixed:
  - **[HIGH]** Fake MaxLength unit test substituído por teste real com `class-validator` (validate + plainToInstance) — 2 novos testes de DTO adicionados (`planejamento.service.spec.ts`)
  - **[HIGH]** Testes unitários `findOne()` com `descricao` adicionados (preenchida e null) — AC#8 totalmente satisfeito
  - **[MEDIUM]** Tipo `serie: number` corrigido para `serie: string` em `usePlanejamentos.ts` — API retorna enum Prisma como string ("SEXTO_ANO", não número)
  - **[MEDIUM]** `@Transform(({ value }) => value === '' ? undefined : value)` adicionado ao campo `descricao` no DTO — previne string vazia sendo persistida no DB
  - **[MEDIUM]** `ViewPlanejamentoDialog.tsx` — mapa `serieLabel` adicionado para exibir "6º ano" em vez de "SEXTO_ANO"
  - **[LOW - não fixado]** Step3Revisao não exibe `descricao` no review step — gap de UX, sem requisito de AC
