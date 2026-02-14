# Story 13.12: Reenviar Convite Expirado

Status: done

## Story

As an Admin/Diretor/Coordenador,
I want to resend an expired invitation,
so that the invited user gets a new chance to accept and join the platform.

## Acceptance Criteria

1. **AC1: Reenviar button visibility** — "Reenviar" button visible and enabled only for invites where `status = expirado` OR (`status = pendente` AND `expira_em < NOW()`). Button remains disabled for `aceito` and `cancelado`.

2. **AC2: Backend resend logic** — `POST /api/v1/convites/:id/reenviar` performs atomically:
   - Updates old invite: `status = cancelado`
   - Creates new `ConviteUsuario` record with: new `token = crypto.randomBytes(32).toString('hex')`, `expira_em = NOW() + 24h`, `status = pendente`, same `email`, `nome_completo`, `tipo_usuario`, `escola_id`, `criado_por`, `dados_extras`
   - Stores new token in Redis with key `invite_{tipo}:{token}` and TTL 86400s
   - Deletes old Redis token

3. **AC3: Email sent** — New invitation email sent via `EmailService` using appropriate method based on `tipo_usuario` (director/coordenador/professor). Graceful degradation: if email fails, token remains valid.

4. **AC4: Toast success** — Frontend shows toast: "Convite reenviado para [email]"

5. **AC5: Endpoint specification** — `POST /api/v1/convites/:id/reenviar` with JWT auth, roles ADMIN/DIRETOR/COORDENADOR.

6. **AC6: Business rules** — Cannot resend `aceito` invite (400). Can resend `cancelado` invite. Multi-tenancy: non-Admin scoped by `escola_id`.

7. **AC7: Confirmation dialog** — Frontend shows confirmation dialog before resending (same pattern as CancelConviteDialog).

8. **AC8: List refresh** — After successful resend, convites list auto-refreshes showing the new invite.

## Tasks / Subtasks

- [x] Task 1: Backend — Add `reenviarConvite` method to ConvitesService (AC: #2, #3, #6)
  - [x] 1.1 Add method `reenviarConvite(id: string, callerRole: string, callerEscolaId: string | null)` to `convites.service.ts`
  - [x] 1.2 Multi-tenancy check (same pattern as `cancelarConvite`)
  - [x] 1.3 Status validation: reject `aceito` (400 BadRequestException), allow `pendente`/`expirado`/`cancelado`
  - [x] 1.4 Use Prisma transaction: update old invite status → create new invite → Redis set → Redis del old
  - [x] 1.5 Send email via EmailService based on `tipo_usuario` (reuse existing `sendDirectorInvitationEmail`, `sendCoordenadorInvitationEmail`, `sendProfessorInvitationEmail`)
  - [x] 1.6 Import `EmailService` and `crypto` in ConvitesService; add EmailService to ConvitesModule providers/imports
  - [x] 1.7 Return `{ message: "Convite reenviado para {email}" }`

- [x] Task 2: Backend — Add controller endpoint (AC: #5)
  - [x] 2.1 Add `POST :id/reenviar` route to `convites.controller.ts` with `@Post(':id/reenviar')`
  - [x] 2.2 Use `ParseUUIDPipe` for id param
  - [x] 2.3 Add Swagger decorators (`@ApiOperation`, `@ApiResponse` for 200/400/401/403/404`)
  - [x] 2.4 Pass `user.role`, `user.escolaId` to service

- [x] Task 3: Backend — Fetch escola name for email (AC: #3)
  - [x] 3.1 In `reenviarConvite`, include `escola: { select: { nome: true } }` when loading the convite
  - [x] 3.2 Pass `escola.nome` to email service methods

- [x] Task 4: Frontend — Add API function and hook (AC: #4, #8)
  - [x] 4.1 Add `reenviarConvite(id: string): Promise<{ message: string }>` to `src/api/convites.ts` using `apiClient.post(`/convites/${id}/reenviar`)`
  - [x] 4.2 Add `useReenviarConvite()` mutation hook to `src/hooks/useConvites.ts` (same pattern as `useCancelConvite`)
  - [x] 4.3 Invalidate `convitesKeys.all` on success

- [x] Task 5: Frontend — Create ReenviarConviteDialog component (AC: #7)
  - [x] 5.1 Create `src/components/shared/ReenviarConviteDialog.tsx` following `CancelConviteDialog.tsx` pattern exactly
  - [x] 5.2 Confirmation text: "Tem certeza que deseja reenviar o convite para {email}? Um novo link será gerado e enviado por email."
  - [x] 5.3 Action button text: "Reenviar Convite" (variant="default", not destructive)
  - [x] 5.4 Error handling: 400 → "Não é possível reenviar convite já aceito", 403 → "Sem permissão", 404 → "Convite não encontrado"
  - [x] 5.5 Toast on success: "Convite reenviado para {email}" (via sonner)
  - [x] 5.6 WCAG AAA: min-h-[44px] buttons, font-montserrat headers, high contrast

- [x] Task 6: Frontend — Enable Reenviar button in ConvitesPendentesPage (AC: #1)
  - [x] 6.1 Replace the disabled Reenviar button placeholder with active button
  - [x] 6.2 Add state: `const [resendingConvite, setResendingConvite] = useState<ConviteListItem | null>(null)`
  - [x] 6.3 Button enabled when `convite.status === 'expirado' || convite.status === 'cancelado' || (convite.status === 'pendente' && new Date(convite.expira_em) < new Date())`
  - [x] 6.4 Button disabled for `aceito` status
  - [x] 6.5 Render `ReenviarConviteDialog` when `resendingConvite` is set

- [x] Task 7: Backend E2E tests (AC: all)
  - [x] 7.1 Create `test/reenviar-convite.e2e-spec.ts` following `cancel-convite.e2e-spec.ts` pattern
  - [x] 7.2 Test: Admin resends expired invite → 201/200
  - [x] 7.3 Test: Diretor resends own school invite → 200
  - [x] 7.4 Test: Diretor cross-tenant blocked → 404
  - [x] 7.5 Test: Coordenador resends own school → 200
  - [x] 7.6 Test: Professor blocked → 403
  - [x] 7.7 Test: Resend accepted invite → 400
  - [x] 7.8 Test: Resend creates new DB record + cancels old
  - [x] 7.9 Test: New Redis token exists, old deleted
  - [x] 7.10 Test: New invite can be accepted (full flow)
  - [x] 7.11 Test: Invalid UUID → 400
  - [x] 7.12 Test: Non-existent invite → 404

- [x] Task 8: Frontend unit tests (AC: #1, #7)
  - [x] 8.1 Create `src/components/shared/__tests__/ReenviarConviteDialog.test.tsx`
  - [x] 8.2 Test: renders dialog with email
  - [x] 8.3 Test: calls mutation on confirm
  - [x] 8.4 Test: shows loading state
  - [x] 8.5 Test: handles error states (400, 403, 404)
  - [x] 8.6 Create/update `src/pages/convites/__tests__/ConvitesPendentesPage.test.tsx`
  - [x] 8.7 Test: Reenviar button enabled for expired invites
  - [x] 8.8 Test: Reenviar button disabled for accepted invites

## Dev Notes

### Architecture Compliance

- **Dual-write pattern**: New invite MUST be written to both PostgreSQL (ConviteUsuario table) AND Redis (`invite_{tipo}:{token}` with 86400s TTL). Old Redis token MUST be deleted.
- **Multi-tenancy**: Non-Admin users MUST be scoped by `escola_id` — exact same pattern as `cancelarConvite`.
- **Graceful email degradation**: Email failures MUST NOT throw — log and continue. Token remains valid.
- **Redis key mapping**: `tipo_usuario === 'diretor'` maps to Redis key prefix `invite_director` (English). All others use Portuguese (`invite_coordenador`, `invite_professor`).

### Existing Code to Reuse (DO NOT reinvent)

| What | Where | Notes |
|------|-------|-------|
| Multi-tenancy check | `convites.service.ts:80-93` (cancelarConvite) | Copy exact pattern |
| Status validation | `convites.service.ts:101-109` | Adapt: reject only `aceito` |
| Redis key construction | `convites.service.ts:118` | `invite_${tipo === 'diretor' ? 'director' : tipo}:${token}` |
| Token generation | `admin.service.ts:204` | `crypto.randomBytes(32).toString('hex')` |
| DB invite creation | `admin.service.ts:222-233` | Same ConviteUsuario.create shape |
| Email dispatch by tipo | `admin.service.ts:244` (director), `diretor.service.ts` (coord/prof) | Match `tipo_usuario` → email method |
| CancelConviteDialog | `CancelConviteDialog.tsx` | Clone for ReenviarConviteDialog |
| useCancelConvite hook | `useConvites.ts:20-28` | Clone for useReenviarConvite |
| API cancelarConvite | `convites.ts:47-54` | Clone for reenviarConvite (POST not PATCH) |

### Critical Implementation Details

1. **Email method selection by tipo_usuario:**
   - `diretor` → `emailService.sendDirectorInvitationEmail(email, nome, escolaNome, token)`
   - `coordenador` → `emailService.sendCoordenadorInvitationEmail({ to: email, coordenadorNome: nome, escolaNome, inviteToken: token })`
   - `professor` → `emailService.sendProfessorInvitationEmail({ to: email, professorNome: nome, escolaNome, disciplina: dados_extras?.disciplina, inviteToken: token })`

2. **Professor dados_extras**: When resending a professor invite, pass `dados_extras.disciplina` to the email method. The `dados_extras` JSON field stores `{ disciplina, formacao, registro, telefone }`.

3. **Prisma transaction**: Use `this.prisma.$transaction([...])` to atomically update old + create new invite. If transaction fails, don't touch Redis.

4. **ConvitesModule needs EmailModule**: Add `EmailModule` (or `CommonModule`) to `convites.module.ts` imports so EmailService is injectable. Check how other modules import it.

5. **HTTP method**: Endpoint is `POST` (not PATCH) since we're creating a new resource (new invite), even though the trigger is the old invite.

6. **Escola name for email**: The `convite` record has `escola_id` but emails need `escolaNome`. Include `escola: { select: { nome: true } }` in the Prisma findFirst query.

### Project Structure Notes

- Backend endpoint: `ressoa-backend/src/modules/convites/convites.controller.ts`
- Backend service: `ressoa-backend/src/modules/convites/convites.service.ts`
- Backend module: `ressoa-backend/src/modules/convites/convites.module.ts`
- Backend E2E test: `ressoa-backend/test/reenviar-convite.e2e-spec.ts`
- Frontend API: `ressoa-frontend/src/api/convites.ts`
- Frontend hooks: `ressoa-frontend/src/hooks/useConvites.ts`
- Frontend dialog: `ressoa-frontend/src/components/shared/ReenviarConviteDialog.tsx`
- Frontend page: `ressoa-frontend/src/pages/convites/ConvitesPendentesPage.tsx`
- Frontend tests: `ressoa-frontend/src/components/shared/__tests__/ReenviarConviteDialog.test.tsx`

### Previous Story Intelligence (13.11)

**Key learnings from Story 13.11:**
- Dual-write was added to all invite services (admin, diretor, coordenador) for ConviteUsuario persistence
- The `ConvitesPendentesPage` already has a disabled "Reenviar" button placeholder with `title="Disponível na Story 13.12"` — replace this
- `CancelConviteDialog` pattern: uses shadcn `AlertDialog`, `useCancelConvite` hook, `isAxiosError` for error handling, `toast` from sonner
- E2E tests use `story1311` email prefix for isolation — use `story1312` prefix
- Code review found multi-tenancy bypass issues — ensure ALL queries filter by `escola_id` for non-Admin
- `UseGuards(JwtAuthGuard)` is at controller level (applies to all routes)
- `@Roles` decorator is at controller level for ADMIN/DIRETOR/COORDENADOR

**Files modified in 13.11 (for context):**
- `convites.module.ts` — imports PrismaModule, RedisModule
- `convites.service.ts` — listConvites + cancelarConvite
- `convites.controller.ts` — GET + PATCH endpoints
- `ConvitesPendentesPage.tsx` — full page with table, filters, pagination
- `useConvites.ts` — useConvites + useCancelConvite hooks
- `convites.ts` (API) — fetchConvites + cancelarConvite

### Git Intelligence

Recent commits show consistent pattern across Epic 13:
- Each story adds backend endpoint + service method + frontend component + E2E tests
- Tests follow naming: `{feature}.e2e-spec.ts`
- Frontend tests in `__tests__/` subfolders
- All stories pass code review before merge

### References

- [Source: _bmad-output/implementation-artifacts/epics/epic-001-gestao-cadastros-hierarquicos.md#US-012]
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-1.1-JWT, #AD-2.1-REST, #AD-4.4-Multi-tenancy]
- [Source: ressoa-backend/src/modules/convites/convites.service.ts] — cancelarConvite pattern
- [Source: ressoa-backend/src/modules/admin/admin.service.ts#inviteDirector] — dual-write + email pattern
- [Source: ressoa-backend/src/common/email/email.service.ts] — all send*InvitationEmail methods
- [Source: ressoa-frontend/src/components/shared/CancelConviteDialog.tsx] — dialog pattern to clone
- [Source: _bmad-output/implementation-artifacts/13-11-cancelar-convite-pendente.md] — previous story learnings

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- E2E test 10 initially failed: `acceptResponse.body.accessToken` undefined. Fixed by removing accessToken check (accept-invitation response doesn't include it in body).
- Frontend test: existing ConvitesPendentesPage test failed with "multiple elements" after adding expired convite mock data. Fixed by using `getAllByText` for duplicate badge texts.

### Completion Notes List
- Backend: `reenviarConvite` method with full dual-write (PostgreSQL + Redis), multi-tenancy, graceful email degradation, Prisma transaction
- Backend: `POST /api/v1/convites/:id/reenviar` endpoint with Swagger docs, ParseUUIDPipe
- Backend: EmailService injected via `@Global()` EmailModule (no module import needed)
- Backend: Private `sendInviteEmail` helper dispatches to correct email method based on `tipo_usuario`
- Frontend: `reenviarConvite` API function, `useReenviarConvite` mutation hook with cache invalidation
- Frontend: `ReenviarConviteDialog` component with confirmation, loading state, error handling (400/403/404)
- Frontend: Reenviar button enabled for `expirado`, `cancelado`, and expired `pendente` invites; disabled for `aceito`
- Backend E2E: 12/12 tests passing (role-based access, multi-tenancy, status validation, Redis verification, full accept flow)
- Frontend unit: 6 ReenviarConviteDialog tests + 4 ConvitesPendentesPage tests (10/10 passing)
- AC1 also allows `cancelado` status for resend (per AC6: "Can resend cancelado invite")

### File List
- `ressoa-backend/src/modules/convites/convites.service.ts` (modified)
- `ressoa-backend/src/modules/convites/convites.controller.ts` (modified)
- `ressoa-backend/src/modules/convites/convites.module.ts` (modified — review fix: added EmailModule import)
- `ressoa-backend/test/reenviar-convite.e2e-spec.ts` (new)
- `ressoa-frontend/src/api/convites.ts` (modified)
- `ressoa-frontend/src/hooks/useConvites.ts` (modified)
- `ressoa-frontend/src/components/shared/ReenviarConviteDialog.tsx` (new)
- `ressoa-frontend/src/pages/convites/ConvitesPendentesPage.tsx` (modified)
- `ressoa-frontend/src/components/shared/__tests__/ReenviarConviteDialog.test.tsx` (new)
- `ressoa-frontend/src/pages/convites/__tests__/ConvitesPendentesPage.test.tsx` (modified)

## Senior Developer Review (AI)

**Reviewer:** Code Review Workflow | **Date:** 2026-02-14

**Issues Found:** 1 High (pattern debt, not fixed), 3 Medium (all fixed), 2 Low (1 fixed)

### Fixes Applied
1. **[M1] ConvitesModule missing EmailModule import** — Added `EmailModule` to `convites.module.ts` imports for consistency with other modules (admin, diretor, coordenador, notificacoes)
2. **[M2] Swagger @ApiResponse 200 vs actual 201** — Updated `@ApiResponse({ status: 201 })` in `convites.controller.ts` to match NestJS POST default behavior
3. **[M3] Dialog stays open on non-retryable errors** — `ReenviarConviteDialog` now closes on 400/403/404 errors (non-retryable). Only transient errors keep dialog open for retry. Tests updated accordingly.

### Not Fixed (Tracked as Debt)
- **[H1] Multi-tenancy pattern uses callerEscolaId param instead of getEscolaIdOrThrow()** — Inherited from Story 13.11. Functionally correct but deviates from project-context.md recommended pattern. Applies to entire ConvitesService (listConvites, cancelarConvite, reenviarConvite). Should be addressed in a dedicated refactoring story.
- **[L1] Redundant @UseGuards(JwtAuthGuard)** — JwtAuthGuard is global via APP_GUARD. Existing inconsistency across codebase, low priority.

### Verdict: APPROVED with fixes applied

## Change Log
- 2026-02-14: Implemented Story 13.12 - Reenviar Convite Expirado. Backend endpoint POST /api/v1/convites/:id/reenviar with dual-write, multi-tenancy, graceful email. Frontend dialog, button, hooks. 12 E2E + 10 unit tests passing.
- 2026-02-14: [Code Review] Fixed 3 issues: M1 (EmailModule import), M2 (Swagger 201), M3 (dialog close on error). All 10 frontend tests passing. Story marked done.
