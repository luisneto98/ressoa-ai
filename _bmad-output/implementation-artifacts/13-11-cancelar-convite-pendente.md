# Story 13.11: Cancelar Convite Pendente

Status: done

## Story

As a Admin/Diretor/Coordenador,
I want to cancelar um convite pendente,
so that posso corrigir erros (email errado, pessoa errada) antes que o convite seja aceito.

## Acceptance Criteria (AC)

1. **AC1: Endpoint listar convites** — `GET /api/v1/convites` retorna lista paginada de convites com filtro por status (`pendente`, `expirado`, `cancelado`, `aceito`). Non-Admin: scoped by `escola_id` via `getEscolaIdOrThrow()`.
2. **AC2: Endpoint cancelar convite** — `PATCH /api/v1/convites/:id/cancelar` atualiza `ConviteUsuario.status = 'cancelado'` e deleta token do Redis. Retorna 200 com mensagem de sucesso.
3. **AC3: Validação de status** — Só permite cancelar convites com status `pendente` ou `expirado`. Status `aceito` retorna 400 `"Não é possível cancelar convite já aceito"`. Status `cancelado` retorna 409 `"Convite já foi cancelado"`.
4. **AC4: RLS multi-tenancy** — Diretor/Coordenador vê e cancela apenas convites da sua escola (`escola_id`). Admin sem restrição.
5. **AC5: RBAC** — Apenas ADMIN, DIRETOR, COORDENADOR podem acessar. PROFESSOR retorna 403.
6. **AC6: Token invalidado** — Após cancelamento, link do email antigo não funciona mais. `acceptInvitation` valida `status = 'pendente'` no DB antes de aceitar.
7. **AC7: Tela "Convites Pendentes"** — Página `/convites` acessível via sidebar com tabela mostrando: email, tipo (badge), data envio, expiração (countdown), status (badge), ações.
8. **AC8: Filtros** — Dropdown de filtro por status: Pendente, Expirado, Cancelado, Aceito.
9. **AC9: Modal de confirmação** — Botão "Cancelar" abre Dialog de confirmação antes de executar cancelamento.
10. **AC10: Toast feedback** — Sucesso: `"Convite para [email] foi cancelado"`. Erros: 400/403/404/409 mapeados para mensagens específicas.
11. **AC11: ConviteUsuario table** — Nova tabela Prisma `convite_usuario` criada com migration. Campos: id, email, nome_completo, tipo_usuario (enum), escola_id (FK), criado_por (FK), token (unique), expira_em, aceito_em, status (enum), dados_extras (Json), timestamps.
12. **AC12: Dual-write** — Serviços de convite existentes (admin, diretor, coordenador) modificados para gravar TANTO no Redis (para aceitação rápida) QUANTO no banco `convite_usuario` (para listagem/gestão).
13. **AC13: Accept-invitation atualização** — `acceptInvitation` atualiza `convite_usuario.status = 'aceito'` e `aceito_em = now()` além de deletar token Redis.
14. **AC14: E2E tests** — Mínimo 16 test cases cobrindo RBAC, multi-tenancy, status transitions, listagem com filtros.
15. **AC15: Frontend unit tests** — Mínimo 8 unit tests para CancelConviteDialog e ConvitesTable.

## Tasks / Subtasks

- [x] Task 1: Backend — Prisma migration: criar tabela `convite_usuario` (AC: #11)
  - [x] 1.1 Criar enum `StatusConvite` (pendente, aceito, expirado, cancelado) e enum `TipoConvite` (professor, coordenador, diretor)
  - [x] 1.2 Criar model `ConviteUsuario` com campos: id (uuid), email, nome_completo, tipo_usuario (TipoConvite), escola_id (FK → Escola), criado_por (FK → Usuario), token (unique), expira_em (DateTime), aceito_em (DateTime?), status (StatusConvite default pendente), dados_extras (Json?), criado_em, atualizado_em
  - [x] 1.3 Criar indexes: @@index([token]), @@index([email, escola_id]), @@index([status, expira_em]), @@index([escola_id, status])
  - [x] 1.4 Rodar `npx prisma migrate dev --name add-convite-usuario`

- [x] Task 2: Backend — Modificar serviços de convite para dual-write (AC: #12)
  - [x] 2.1 Em `admin.service.ts` → `inviteDirector()`: após `redisService.setex()`, criar registro `ConviteUsuario` com tipo_usuario=diretor, status=pendente, expira_em=now()+24h, criado_por=adminUserId
  - [x] 2.2 Em `diretor.service.ts` → `inviteCoordenador()`: após `redisService.setex()`, criar registro `ConviteUsuario` com tipo_usuario=coordenador
  - [x] 2.3 Em `diretor.service.ts` → `inviteProfessor()`: após `redisService.setex()`, criar registro `ConviteUsuario` com tipo_usuario=professor, dados_extras={disciplina, formacao?, registro?, telefone?}
  - [x] 2.4 Em `coordenador.service.ts` → `inviteProfessor()`: mesma lógica que 2.3
  - [x] 2.5 Cada serviço deve receber `userId` (caller) para popular campo `criado_por`

- [x] Task 3: Backend — Modificar `acceptInvitation` para atualizar DB (AC: #6, #13)
  - [x] 3.1 Em `auth.service.ts` → `acceptInvitation()`: após encontrar token no Redis, buscar `ConviteUsuario` pelo token
  - [x] 3.2 Validar `convite.status === 'pendente'` — se cancelado, retornar 410 `"Este convite foi cancelado"`
  - [x] 3.3 Após criar usuário com sucesso, atualizar `ConviteUsuario`: status='aceito', aceito_em=new Date()
  - [x] 3.4 Manter deleção do Redis key (comportamento existente preservado)

- [x] Task 4: Backend — Criar ConvitesModule com CRUD (AC: #1, #2, #3, #4, #5)
  - [x] 4.1 Criar `ressoa-backend/src/modules/convites/convites.module.ts` — importar PrismaModule, RedisModule
  - [x] 4.2 Criar `convites.service.ts` com métodos: `listConvites(escolaId?, filters)`, `cancelarConvite(id, callerRole, callerEscolaId)`
  - [x] 4.3 `listConvites`: query paginada com filtro status, scoped por escola_id (non-Admin). Include escola (nome). Ordenar por criado_em DESC
  - [x] 4.4 `cancelarConvite`: encontrar convite por id (+escola_id se non-Admin), validar status (só pendente/expirado), atualizar status='cancelado', deletar Redis key `invite_{tipo}:{token}`
  - [x] 4.5 Criar DTOs: `ListConvitesQueryDto` (page, limit, status?), `ConviteResponseDto`
  - [x] 4.6 Criar `convites.controller.ts` com: `@Get()` listConvites, `@Patch(':id/cancelar')` cancelarConvite
  - [x] 4.7 Guards: JwtAuthGuard, RolesGuard; Roles: ADMIN, DIRETOR, COORDENADOR
  - [x] 4.8 Swagger: ApiOperation, ApiParam, ApiResponse para todos endpoints
  - [x] 4.9 Registrar ConvitesModule no AppModule

- [x] Task 5: Frontend — API client + hooks (AC: #7, #10)
  - [x] 5.1 Criar `ressoa-frontend/src/api/convites.ts` com: `fetchConvites(params)`, `cancelarConvite(id)`
  - [x] 5.2 Criar `ressoa-frontend/src/hooks/useConvites.ts` com: `useConvites(params)`, `useCancelConvite()`
  - [x] 5.3 Query keys: `convitesKeys = { all: ['convites'], list: (params) => ['convites', 'list', params] }`

- [x] Task 6: Frontend — CancelConviteDialog component (AC: #9, #10)
  - [x] 6.1 Criar `ressoa-frontend/src/components/shared/CancelConviteDialog.tsx` (mirror DeactivateUsuarioDialog)
  - [x] 6.2 Title: `"Cancelar Convite"`, description: `"Tem certeza que deseja cancelar o convite para {email}? O link enviado por email deixará de funcionar."`
  - [x] 6.3 Confirm button: `variant="destructive"`, text: `"Cancelar Convite"` / loading: `"Cancelando..."`
  - [x] 6.4 Error handling: 400 → `"Não é possível cancelar convite já aceito"`, 403 → `"Sem permissão"`, 404 → `"Convite não encontrado"`, 409 → `"Convite já foi cancelado"`
  - [x] 6.5 Toast via `sonner`, min-h-[44px] buttons (WCAG), font-montserrat title, deep-navy color

- [x] Task 7: Frontend — ConvitesPendentesPage (AC: #7, #8)
  - [x] 7.1 Criar `ressoa-frontend/src/pages/convites/ConvitesPendentesPage.tsx`
  - [x] 7.2 Tabela shadcn/ui com colunas: Email, Tipo (Badge colorido), Data Envio, Expira Em (countdown visual "⏰ X dias"), Status (Badge), Ações
  - [x] 7.3 Countdown: calcular `expira_em - now()` e mostrar "X dias restantes" ou "Expirado" se negativo
  - [x] 7.4 Status badges: Pendente (amarelo), Aceito (verde), Expirado (cinza), Cancelado (vermelho)
  - [x] 7.5 Tipo badges: Diretor (roxo), Coordenador (azul), Professor (verde)
  - [x] 7.6 Filtro dropdown de status (Select component)
  - [x] 7.7 Ações: botão "Cancelar" (habilitado apenas para pendente/expirado), botão "Reenviar" (placeholder desabilitado — Story 13.12)
  - [x] 7.8 Pagination (20 items per page, mesma pattern de UsuariosTable)
  - [x] 7.9 Empty state quando não há convites
  - [x] 7.10 Loading skeleton enquanto carrega

- [x] Task 8: Frontend — Routing + Navigation (AC: #7)
  - [x] 8.1 Adicionar rota `/convites` no App.tsx (protegida: ADMIN, DIRETOR, COORDENADOR)
  - [x] 8.2 Adicionar item "Convites" no sidebar (navigation-config) com ícone `IconMail` ou `IconMailForward`
  - [x] 8.3 Breadcrumb: "Convites Pendentes"

- [x] Task 9: E2E tests — `cancel-convite.e2e-spec.ts` (AC: #14)
  - [x] 9.1 Setup: 2 escolas, criar convites pendentes via service direto (Redis + DB), `EMAIL_PREFIX = 'story1311'`
  - [x] 9.2 Test 1: Admin lista convites de todas escolas → 200, retorna convites
  - [x] 9.3 Test 2: Diretor lista apenas convites da sua escola → 200, filtrado
  - [x] 9.4 Test 3: Coordenador lista apenas convites da sua escola → 200, filtrado
  - [x] 9.5 Test 4: Professor tenta listar → 403
  - [x] 9.6 Test 5: Admin cancela convite pendente → 200, status=cancelado
  - [x] 9.7 Test 6: Diretor cancela convite da sua escola → 200
  - [x] 9.8 Test 7: Diretor tenta cancelar convite de outra escola → 404
  - [x] 9.9 Test 8: Coordenador cancela convite da sua escola → 200
  - [x] 9.10 Test 9: Professor tenta cancelar → 403
  - [x] 9.11 Test 10: Cancelar convite já aceito → 400
  - [x] 9.12 Test 11: Cancelar convite já cancelado → 409
  - [x] 9.13 Test 12: Cancelar convite com UUID inválido → 400
  - [x] 9.14 Test 13: Cancelar convite inexistente → 404
  - [x] 9.15 Test 14: Filtro por status funciona → 200, lista filtrada
  - [x] 9.16 Test 15: Convite cancelado não pode ser aceito → 410 (via acceptInvitation)
  - [x] 9.17 Test 16: Paginação funciona (page, limit) → 200

- [x] Task 10: Frontend unit tests (AC: #15)
  - [x] 10.1 `CancelConviteDialog.test.tsx` — Test 1: Dialog renderiza com email
  - [x] 10.2 Test 2: Cancel fecha dialog
  - [x] 10.3 Test 3: Success → fecha dialog, chama API
  - [x] 10.4 Test 4: Error 400 handling
  - [x] 10.5 Test 5: Error 409 handling
  - [x] 10.6 Test 6: Loading state ("Cancelando...", buttons disabled)
  - [x] 10.7 `ConvitesPendentesPage.test.tsx` — Test 7: Tabela renderiza convites
  - [x] 10.8 Test 8: Filtro de status funciona

- [x] Task 11: Update sprint-status.yaml → `done`

## Dev Notes

### Architecture & Patterns (MUST FOLLOW)

- **CRITICAL DISCOVERY: Invitations are currently Redis-only** — Não existe tabela `ConviteUsuario` no banco. O epic planejou, mas a implementação (stories 13.2-13.6) usou apenas Redis com TTL 24h. Esta story CRIA a tabela e implementa dual-write.
- **Dual-write pattern** — Gravar convite no Redis (para aceitação rápida via token) E no PostgreSQL (para listagem/gestão/auditoria). Redis é source-of-truth para token validation. DB é source-of-truth para listing/status.
- **Multi-tenancy** — Non-Admin: `const escolaId = this.prisma.getEscolaIdOrThrow(); where.escola_id = escolaId;`. Admin: sem filtro escola_id. [Source: project-context.md#Rule1]
- **RBAC** — Roles ADMIN, DIRETOR, COORDENADOR via `@Roles()` + `RolesGuard`. Professor NÃO acessa.
- **Redis key patterns existentes** — `invite_professor:{token}`, `invite_coordenador:{token}`, `invite_director:{token}` (24h TTL). Cancelar = deletar key.
- **Token format** — `crypto.randomBytes(32).toString('hex')` = 64 chars hex
- **Response sanitization** — Nunca expor token completo na listagem (truncar ou omitir).

### Existing Code to Reuse (DO NOT reinvent)

| What | File | Line/Note |
|------|------|-----------|
| `inviteProfessor()` (add DB write) | `ressoa-backend/src/modules/coordenador/coordenador.service.ts` | 30-102 |
| `inviteCoordenador()` (add DB write) | `ressoa-backend/src/modules/diretor/diretor.service.ts` | 32-100 |
| `inviteProfessor()` diretor (add DB write) | `ressoa-backend/src/modules/diretor/diretor.service.ts` | 108-181 |
| `inviteDirector()` (add DB write) | `ressoa-backend/src/modules/admin/admin.service.ts` | — |
| `acceptInvitation()` (add DB update) | `ressoa-backend/src/modules/auth/auth.service.ts` | 121+ |
| Redis `keys()`, `get()`, `del()`, `ttl()` | `ressoa-backend/src/redis/redis.service.ts` | 22-44 |
| DeactivateUsuarioDialog (mirror for cancel) | `ressoa-frontend/src/components/shared/DeactivateUsuarioDialog.tsx` | — |
| UsuariosTable (mirror table pattern) | `ressoa-frontend/src/components/shared/UsuariosTable.tsx` | — |
| useDeactivateUsuario hook (mirror) | `ressoa-frontend/src/hooks/useUsuarios.ts` | — |
| E2E test setup pattern | `ressoa-backend/test/reactivate-usuario.e2e-spec.ts` | — |
| Frontend unit test pattern | `ressoa-frontend/src/components/shared/__tests__/DeactivateUsuarioDialog.test.tsx` | — |
| Navigation config (add sidebar item) | `ressoa-frontend/src/components/layout/navigation-config.ts` | — |
| App.tsx routes (add /convites) | `ressoa-frontend/src/App.tsx` | — |

### Key Implementation Details

#### Prisma Migration — ConviteUsuario

```prisma
enum StatusConvite {
  pendente
  aceito
  expirado
  cancelado
}

enum TipoConvite {
  professor
  coordenador
  diretor
}

model ConviteUsuario {
  id            String        @id @default(uuid())
  email         String        @db.VarChar(255)
  nome_completo String        @db.VarChar(200)
  tipo_usuario  TipoConvite
  escola_id     String
  escola        Escola        @relation(fields: [escola_id], references: [id], onDelete: Cascade)
  criado_por    String
  criador       Usuario       @relation("ConvitesEnviados", fields: [criado_por], references: [id])
  token         String        @unique
  expira_em     DateTime
  aceito_em     DateTime?
  status        StatusConvite @default(pendente)
  dados_extras  Json?

  criado_em     DateTime      @default(now())
  atualizado_em DateTime      @updatedAt

  @@index([token])
  @@index([email, escola_id])
  @@index([status, expira_em])
  @@index([escola_id, status])

  @@map("convite_usuario")
}
```

**NOTA:** Adicionar `convites ConviteUsuario[] @relation("ConvitesEnviados")` no model `Usuario` e `convites ConviteUsuario[]` no model `Escola`.

#### Dual-Write Pattern (Serviços Existentes)

Após cada `redisService.setex()` existente, adicionar:

```typescript
// Dual-write: persist to DB for listing/management
await this.prisma.conviteUsuario.create({
  data: {
    email: emailNormalized,
    nome_completo: dto.nome,
    tipo_usuario: 'professor', // ou 'coordenador'/'diretor'
    escola_id: escolaId,
    criado_por: userId, // caller's user ID
    token: inviteToken,
    expira_em: new Date(Date.now() + 86400 * 1000), // 24h
    status: 'pendente',
    dados_extras: tokenPayload.disciplina ? { disciplina: tokenPayload.disciplina, ...optional } : undefined,
  },
});
```

#### Cancel Service Logic

```typescript
async cancelarConvite(id: string, callerRole: string, callerEscolaId?: string) {
  const where: any = { id };
  if (callerRole !== 'ADMIN' && callerEscolaId) {
    where.escola_id = callerEscolaId;
  }

  const convite = await this.prisma.conviteUsuario.findFirst({ where });
  if (!convite) throw new NotFoundException('Convite não encontrado');
  if (convite.status === 'aceito') throw new BadRequestException('Não é possível cancelar convite já aceito');
  if (convite.status === 'cancelado') throw new ConflictException('Convite já foi cancelado');

  // Update DB
  await this.prisma.conviteUsuario.update({
    where: { id: convite.id },
    data: { status: 'cancelado' },
  });

  // Delete Redis token (invalidate email link)
  const redisKey = `invite_${convite.tipo_usuario}:${convite.token}`;
  await this.redisService.del(redisKey);

  return { message: `Convite para ${convite.email} foi cancelado` };
}
```

#### Accept Invitation Update (auth.service.ts)

Adicionar ANTES de criar usuário:

```typescript
// Validate convite not cancelled in DB
const conviteDb = await this.prisma.conviteUsuario.findFirst({
  where: { token: dto.token },
});
if (conviteDb && conviteDb.status === 'cancelado') {
  throw new GoneException('Este convite foi cancelado');
}

// ... criar usuário ...

// After user creation, update convite status
if (conviteDb) {
  await this.prisma.conviteUsuario.update({
    where: { id: conviteDb.id },
    data: { status: 'aceito', aceito_em: new Date() },
  });
}
```

**NOTA:** Usar `GoneException` (410) do NestJS para convites cancelados — indica que o recurso "não existe mais".

#### Frontend Countdown Calculation

```typescript
function getExpirationDisplay(expiraEm: string): { text: string; variant: 'default' | 'destructive' | 'secondary' } {
  const diff = new Date(expiraEm).getTime() - Date.now();
  if (diff <= 0) return { text: 'Expirado', variant: 'secondary' };
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  if (days > 1) return { text: `${days} dias restantes`, variant: 'default' };
  return { text: `${hours}h restantes`, variant: 'destructive' };
}
```

### Backward Compatibility

- **Existing invitations in Redis-only** — Convites criados antes desta story NÃO terão registro no DB. A listagem mostrará apenas convites novos. Considerar: ao listar, se não encontrar registros, avisar "Convites anteriores a [data] não estão disponíveis para gestão".
- **acceptInvitation** — Se `conviteDb` for null (convite antigo, Redis-only), aceitar normalmente (comportamento existente preservado). Apenas bloquear se `conviteDb.status === 'cancelado'`.
- **Serviços de convite** — O dual-write é adicionado APÓS o Redis write para não quebrar fluxo existente se DB write falhar. Wrapping em try-catch com log de erro (não throw).

### Testing Pattern Notes

- **E2E**: Criar convites via chamada direta ao service (não endpoint) para setup rápido. Verificar tanto DB state quanto Redis state.
- **Unique email prefix**: `story1311` para evitar colisão com outros testes.
- **Throttler override**: Mesmo pattern das stories 13.9/13.10 — override ThrottlerStorage com mock.
- **Login helper**: `loginUser(email)` → POST /api/v1/auth/login → return accessToken.
- **ConviteUsuario cleanup**: afterAll delete registros com email prefix `story1311`.

### Project Structure Notes

- **Novo módulo backend**: `ressoa-backend/src/modules/convites/` (controller, service, DTOs, module)
- **Nova migration Prisma**: `add-convite-usuario`
- **Arquivos backend modificados**: admin.service.ts, diretor.service.ts, coordenador.service.ts, auth.service.ts (dual-write + status check)
- **Schema Prisma modificado**: adicionar model ConviteUsuario, enums, relations
- **Novos arquivos frontend**: api/convites.ts, hooks/useConvites.ts, components/shared/CancelConviteDialog.tsx, pages/convites/ConvitesPendentesPage.tsx
- **Arquivos frontend modificados**: App.tsx (rota), navigation-config.ts (sidebar)

### References

- [Source: _bmad-output/implementation-artifacts/epics/epic-001-gestao-cadastros-hierarquicos.md#US-011]
- [Source: _bmad-output/implementation-artifacts/13-10-reativar-usuario.md]
- [Source: project-context.md#Multi-Tenancy Security]
- [Source: ressoa-backend/src/modules/coordenador/coordenador.service.ts#inviteProfessor]
- [Source: ressoa-backend/src/modules/diretor/diretor.service.ts#inviteCoordenador+inviteProfessor]
- [Source: ressoa-backend/src/modules/auth/auth.service.ts#acceptInvitation]
- [Source: ressoa-backend/src/redis/redis.service.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Prisma migrate dev failed with P3006 (shadow database issue). Fixed with `prisma db push` + manual migration file + `prisma migrate resolve --applied`.

### Completion Notes List

- All 15 ACs implemented and tested
- 16/16 E2E tests passing (RBAC, multi-tenancy, status transitions, pagination, cancelled invite acceptance)
- 8/8 frontend unit tests passing (6 CancelConviteDialog + 2 ConvitesPendentesPage)
- Dual-write uses try-catch for graceful degradation (DB failure doesn't break Redis flow)
- Redis key naming: `invite_director` (not `invite_diretor`) - handled with ternary in convites.service.ts
- Backward compatibility: acceptInvitation handles null conviteDb (old Redis-only invites) gracefully

### File List

**New files:**
- `ressoa-backend/prisma/migrations/20260214100000_add_convite_usuario/migration.sql`
- `ressoa-backend/src/modules/convites/convites.module.ts`
- `ressoa-backend/src/modules/convites/convites.service.ts`
- `ressoa-backend/src/modules/convites/convites.controller.ts`
- `ressoa-backend/src/modules/convites/dto/list-convites-query.dto.ts`
- `ressoa-backend/src/modules/convites/dto/index.ts`
- `ressoa-backend/test/cancel-convite.e2e-spec.ts`
- `ressoa-frontend/src/api/convites.ts`
- `ressoa-frontend/src/hooks/useConvites.ts`
- `ressoa-frontend/src/components/shared/CancelConviteDialog.tsx`
- `ressoa-frontend/src/pages/convites/ConvitesPendentesPage.tsx`
- `ressoa-frontend/src/components/shared/__tests__/CancelConviteDialog.test.tsx`
- `ressoa-frontend/src/pages/convites/__tests__/ConvitesPendentesPage.test.tsx`

**Modified files:**
- `ressoa-backend/prisma/schema.prisma` (added StatusConvite, TipoConvite enums; ConviteUsuario model; relations on Escola, Usuario)
- `ressoa-backend/src/app.module.ts` (registered ConvitesModule)
- `ressoa-backend/src/modules/admin/admin.service.ts` (dual-write in inviteDirector)
- `ressoa-backend/src/modules/admin/admin.controller.ts` (pass userId to inviteDirector)
- `ressoa-backend/src/modules/diretor/diretor.service.ts` (dual-write in inviteCoordenador, inviteProfessor)
- `ressoa-backend/src/modules/diretor/diretor.controller.ts` (pass userId)
- `ressoa-backend/src/modules/coordenador/coordenador.service.ts` (dual-write in inviteProfessor)
- `ressoa-backend/src/modules/coordenador/coordenador.controller.ts` (pass userId)
- `ressoa-backend/src/modules/auth/auth.service.ts` (check cancelled status, update accepted status)
- `ressoa-frontend/src/App.tsx` (added /convites route)
- `ressoa-frontend/src/components/layout/navigation-config.ts` (added Convites nav item for COORDENADOR, DIRETOR, ADMIN)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status updated to done)

### Senior Developer Review (AI)

**Reviewer:** Luisneto98 | **Date:** 2026-02-14 | **Model:** Claude Opus 4.6

**Issues Found:** 3 HIGH, 3 MEDIUM, 2 LOW — **ALL 8 auto-fixed**

| # | Severity | Issue | File | Fix |
|---|----------|-------|------|-----|
| 1 | HIGH | Task 11 marked [x] but sprint-status.yaml still shows `review` | sprint-status.yaml | Updated to `done` |
| 2 | HIGH | Multi-tenancy bypass: null `callerEscolaId` silently skips escola_id filter in `listConvites` | convites.service.ts:32 | Added ForbiddenException when non-Admin has null escolaId |
| 3 | HIGH | Same bypass in `cancelarConvite` | convites.service.ts:84 | Same fix applied |
| 4 | MEDIUM | Missing explicit `@UseGuards(JwtAuthGuard)` (inconsistent with project pattern) | convites.controller.ts | Added `@UseGuards(JwtAuthGuard)` |
| 5 | MEDIUM | `onDelete: RESTRICT` on `criado_por` FK blocks user deactivation | schema.prisma, migration.sql | Changed to `onDelete: SetNull`, made `criado_por` nullable |
| 6 | MEDIUM | sprint-status.yaml modified but not in story File List | story file | Added to Modified files |
| 7 | LOW | Redundant `@@index([token])` (already has `@unique`) | schema.prisma, migration.sql | Removed redundant index |
| 8 | LOW | Expiration badge variant not applied (`getExpirationDisplay` result unused) | ConvitesPendentesPage.tsx:147 | Applied `expiration.variant` to Badge |

### Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-14 | Story implemented (Tasks 1-11) | Full implementation of cancel convite pendente feature |
| 2026-02-14 | Code review: 8 issues auto-fixed (3 HIGH, 3 MEDIUM, 2 LOW) | Multi-tenancy hardening, FK constraint fix, UI polish, consistency |
