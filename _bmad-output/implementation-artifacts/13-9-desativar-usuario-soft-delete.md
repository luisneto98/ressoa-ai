# Story 13.9: Desativar Usuário (Soft Delete)

Status: done

## Story

As a Admin, Diretor ou Coordenador do Ressoa AI,
I want desativar um usuário cadastrado na minha escola (soft delete com campo `deleted_at`),
so that o usuário perde acesso ao sistema sem perder dados históricos (LGPD compliance), podendo ser reativado futuramente (Story 13.10).

## Acceptance Criteria

1. **AC1: Endpoint PATCH /api/v1/usuarios/:id/desativar** - Endpoint que executa soft delete setando `deleted_at = new Date()` no registro do usuário. Retorna 200 com dados do usuário desativado.

2. **AC2: Campo `deleted_at` no modelo Usuario** - Migration Prisma adicionando campo `deleted_at DateTime?` ao modelo `Usuario` com `@@index([deleted_at])` para performance de queries.

3. **AC3: Multi-tenancy isolation** - Operação restrita à própria escola via `this.prisma.getEscolaIdOrThrow()`. Admin pode desativar usuários de qualquer escola.

4. **AC4: RBAC hierárquico** - Mesma hierarquia das stories anteriores:
   - Admin: pode desativar qualquer role (PROFESSOR, COORDENADOR, DIRETOR)
   - Diretor: pode desativar PROFESSOR e COORDENADOR
   - Coordenador: pode desativar apenas PROFESSOR
   - Professor: sem acesso (403)
   - Ninguém pode desativar a si mesmo (400)

5. **AC5: Validação de UUID** - `ParseUUIDPipe` no param `:id`. Retorna 400 para UUIDs inválidos.

6. **AC6: 404 para usuário inexistente** - Retorna 404 se o usuário não existe ou não pertence à escola do caller (tenant isolation).

7. **AC7: 409 para usuário já desativado** - Retorna 409 (Conflict) se `deleted_at` já estiver preenchido.

8. **AC8: Filtrar desativados na listagem** - `listUsuarios` (Story 13.7) deve adicionar `deleted_at: null` ao WHERE para excluir usuários desativados por padrão.

9. **AC9: Botão Desativar na UsuariosTable** - Botão com `IconUserOff` ao lado do botão Editar, visível apenas se `canEdit(callerRole, targetRole)` (mesma regra). Cor: `text-destructive` (vermelho).

10. **AC10: Dialog de confirmação** - `DeactivateUsuarioDialog` com mensagem "Tem certeza que deseja desativar {nome}? O usuário perderá acesso ao sistema." com botões "Cancelar" e "Desativar" (vermelho, `variant="destructive"`).

11. **AC11: Feedback visual** - Toast de sucesso "Usuário desativado com sucesso" e invalidação do cache React Query. Toast de erro para 403, 404, 409.

12. **AC12: Loading state** - Botão "Desativar" mostra spinner (`IconLoader2`) durante a requisição, desabilitando interação.

13. **AC13: E2E tests backend** - Mínimo 15 casos cobrindo: hierarquia RBAC, multi-tenancy, auto-desativação bloqueada, usuário já desativado (409), UUID inválido, 404, listagem filtrando desativados, segurança (sem `senha_hash` na resposta).

14. **AC14: Testes unitários frontend** - Mínimo 6 casos: renderização do dialog, confirmação, sucesso com toast, erros (403, 404, 409), loading state.

## Tasks / Subtasks

- [x] Task 1: Prisma migration - adicionar `deleted_at` ao Usuario (AC: #2)
  - [x] 1.1: Adicionar `deleted_at DateTime?` ao modelo `Usuario` no `schema.prisma`
  - [x] 1.2: Adicionar `@@index([deleted_at])` ao modelo `Usuario`
  - [x] 1.3: Gerar e aplicar migration: `npx prisma migrate dev --name add-usuario-deleted-at`

- [x] Task 2: Backend - endpoint desativar usuario (AC: #1, #3, #4, #5, #6, #7)
  - [x] 2.1: Criar método `deactivateUsuario(callerRole, callerId, targetId)` em `usuarios.service.ts`
  - [x] 2.2: Adicionar rota `@Patch(':id/desativar')` em `usuarios.controller.ts`
  - [x] 2.3: Reutilizar `validateHierarchyPermission()` existente para RBAC
  - [x] 2.4: Adicionar validação de auto-desativação (`callerId !== targetId`)
  - [x] 2.5: Adicionar check `deleted_at !== null` para retornar 409

- [x] Task 3: Backend - filtrar desativados na listagem (AC: #8)
  - [x] 3.1: Adicionar `deleted_at: null` ao WHERE de `listUsuarios()` em `usuarios.service.ts`

- [x] Task 4: Frontend - API e hooks (AC: #11)
  - [x] 4.1: Adicionar `deactivateUsuario(id)` em `api/usuarios.ts` (PATCH)
  - [x] 4.2: Adicionar `useDeactivateUsuario()` mutation hook em `hooks/useUsuarios.ts`

- [x] Task 5: Frontend - DeactivateUsuarioDialog (AC: #9, #10, #11, #12)
  - [x] 5.1: Criar `DeactivateUsuarioDialog.tsx` em `components/shared/`
  - [x] 5.2: Adicionar botão `IconUserOff` na `UsuariosTable.tsx` ao lado do `IconEdit`
  - [x] 5.3: Implementar dialog de confirmação com feedback visual

- [x] Task 6: E2E tests backend (AC: #13)
  - [x] 6.1: Criar `test/deactivate-usuario.e2e-spec.ts`

- [x] Task 7: Testes unitários frontend (AC: #14)
  - [x] 7.1: Criar `components/shared/__tests__/DeactivateUsuarioDialog.test.tsx`

- [x] Task 8: Atualizar sprint-status.yaml

## Dev Notes

### Padrão de Soft Delete Existente (COPIAR)

O projeto já usa soft delete em 3 modelos (Turma, Planejamento, Aula). Seguir o padrão EXATO:

**Schema (turma como referência):**
```prisma
deleted_at   DateTime? // Soft delete timestamp (LGPD compliance)
@@index([deleted_at])
```

**Service (turmas.service.ts:378-396 como referência):**
```typescript
async remove(id: string) {
  const escolaId = this.prisma.getEscolaIdOrThrow();
  const turma = await this.prisma.turma.findUnique({
    where: { id, escola_id: escolaId },
  });
  if (!turma) throw new NotFoundException('...');
  return this.prisma.turma.update({
    where: { id, escola_id: escolaId },
    data: { deleted_at: new Date() },
  });
}
```

### Diferenças deste story vs turma soft delete

1. **RBAC hierárquico:** Turma usa `@Roles('DIRETOR')` simples. Aqui usar `@Roles(ADMIN, DIRETOR, COORDENADOR)` + `validateHierarchyPermission()` no service (padrão do story 13.8).
2. **Auto-desativação bloqueada:** Verificar `callerId !== targetId` antes de processar.
3. **Endpoint PATCH (não DELETE):** Usar `@Patch(':id/desativar')` para semântica de "desativar" (não "remover"). Turma usa `@Delete`, mas aqui é soft delete explícito com reativação futura.
4. **409 Conflict:** Turma não verifica se já está deletada. Aqui adicionar check `deleted_at !== null` → 409.

### Multi-Tenancy - Regras Críticas

- **NUNCA** fazer query sem `escola_id` em modelos multi-tenant
- Usar `this.prisma.getEscolaIdOrThrow()` para roles não-Admin
- Admin tem `escolaId = null` no JWT → pular filtro de tenant
- Padrão do WHERE clause (de `usuarios.service.ts:138-142`):
```typescript
const where: Prisma.UsuarioWhereInput = { id: targetId };
if (callerRole !== RoleUsuario.ADMIN) {
  const escolaId = this.prisma.getEscolaIdOrThrow();
  where.escola_id = escolaId;
}
```

### RBAC Hierárquico - Reutilizar validateHierarchyPermission()

Método já existe em `usuarios.service.ts:207-227`. Reutilizar sem modificar:
```typescript
private validateHierarchyPermission(callerRole, targetRole) {
  if (callerRole === RoleUsuario.ADMIN) return;
  const editableRoles = {
    DIRETOR: [PROFESSOR, COORDENADOR],
    COORDENADOR: [PROFESSOR],
    PROFESSOR: [],
    ADMIN: [],
  };
  if (!editableRoles[callerRole]?.includes(targetRole))
    throw new ForbiddenException('Sem permissão para desativar este usuário');
}
```

### Implementação Backend - deactivateUsuario()

```typescript
async deactivateUsuario(callerRole: RoleUsuario, callerId: string, targetId: string) {
  // 1. Block self-deactivation
  if (callerId === targetId) {
    throw new BadRequestException('Não é possível desativar a si mesmo');
  }

  // 2. Build where with tenant isolation
  const where: Prisma.UsuarioWhereInput = { id: targetId };
  if (callerRole !== RoleUsuario.ADMIN) {
    const escolaId = this.prisma.getEscolaIdOrThrow();
    where.escola_id = escolaId;
  }

  // 3. Find target
  const targetUser = await this.prisma.usuario.findFirst({
    where,
    select: { id: true, nome: true, email: true, deleted_at: true, perfil_usuario: { select: { role: true } } },
  });
  if (!targetUser) throw new NotFoundException('Usuário não encontrado');

  // 4. Check already deactivated
  if (targetUser.deleted_at) {
    throw new ConflictException('Usuário já está desativado');
  }

  // 5. Check hierarchy
  this.validateHierarchyPermission(callerRole, targetUser.perfil_usuario?.role);

  // 6. Soft delete
  const updated = await this.prisma.usuario.update({
    where: { id: targetId },
    data: { deleted_at: new Date() },
    select: { id: true, nome: true, email: true, deleted_at: true, created_at: true, updated_at: true, perfil_usuario: { select: { role: true } } },
  });

  return {
    id: updated.id,
    nome: updated.nome,
    email: updated.email,
    role: updated.perfil_usuario?.role ?? null,
    deleted_at: updated.deleted_at,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  };
}
```

### Controller - Rota @Patch(':id/desativar')

```typescript
@Patch(':id/desativar')
@Roles(RoleUsuario.ADMIN, RoleUsuario.DIRETOR, RoleUsuario.COORDENADOR)
@ApiOperation({ summary: 'Desativar usuário (soft delete)' })
@ApiParam({ name: 'id', description: 'ID do usuário (UUID)' })
@ApiResponse({ status: 200, description: 'Usuário desativado com sucesso' })
@ApiResponse({ status: 400, description: 'Auto-desativação ou UUID inválido' })
@ApiResponse({ status: 403, description: 'Sem permissão (hierarquia)' })
@ApiResponse({ status: 404, description: 'Usuário não encontrado' })
@ApiResponse({ status: 409, description: 'Usuário já desativado' })
async deactivateUsuario(
  @CurrentUser() user: AuthenticatedUser,
  @Param('id', ParseUUIDPipe) id: string,
) {
  return this.usuariosService.deactivateUsuario(user.role, user.userId, id);
}
```

### Listagem - Filtrar deleted_at

Adicionar `deleted_at: null` ao WHERE de `listUsuarios()` em `usuarios.service.ts:24`:
```typescript
const where: Prisma.UsuarioWhereInput = {
  perfil_usuario: { isNot: null },
  deleted_at: null, // ← ADICIONAR: excluir soft-deleted
};
```

### Frontend - API e Hooks

**`api/usuarios.ts` - adicionar:**
```typescript
export async function deactivateUsuario(id: string): Promise<DeactivateUsuarioResponse> {
  const response = await apiClient.patch<DeactivateUsuarioResponse>(`/usuarios/${id}/desativar`);
  return response.data;
}
```

**`hooks/useUsuarios.ts` - adicionar:**
```typescript
export function useDeactivateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    },
  });
}
```

### Frontend - DeactivateUsuarioDialog

Seguir padrão EXATO do `EditUsuarioDialog.tsx`:
- Dialog do shadcn/ui (Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter)
- Botão Cancelar (variant="outline") + Botão Desativar (variant="destructive")
- `IconLoader2` com `animate-spin` durante loading
- Toast via `sonner`: `toast.success()` / `toast.error()`
- `isAxiosError` para tratamento de erros por status code
- `min-h-[44px]` para touch targets (WCAG)
- Cores: `text-deep-navy`, `font-montserrat` para título

### Frontend - UsuariosTable - Adicionar botão desativar

Ao lado do botão `IconEdit`, adicionar botão `IconUserOff`:
```tsx
import { IconUserOff } from '@tabler/icons-react';

// No TableCell de Ações, após o botão edit:
{canEdit(callerRole, usuario.role) && (
  <Button
    variant="ghost"
    size="icon"
    className="h-11 w-11 text-destructive hover:text-destructive"
    title="Desativar usuário"
    aria-label={`Desativar ${usuario.nome}`}
    onClick={() => setDeactivatingUsuario(usuario)}
  >
    <IconUserOff className="size-5" />
  </Button>
)}
```

Adicionar state: `const [deactivatingUsuario, setDeactivatingUsuario] = useState<UsuarioListItem | null>(null);`

### E2E Test Cases (15 mínimo)

| # | Caso | Status Esperado |
|---|------|----------------|
| 1 | Admin desativa PROFESSOR de qualquer escola | 200 |
| 2 | Admin desativa DIRETOR | 200 |
| 3 | Admin desativa COORDENADOR | 200 |
| 4 | Diretor desativa PROFESSOR da sua escola | 200 |
| 5 | Diretor desativa COORDENADOR da sua escola | 200 |
| 6 | Diretor tenta desativar DIRETOR (sem permissão) | 403 |
| 7 | Coordenador desativa PROFESSOR da sua escola | 200 |
| 8 | Coordenador tenta desativar COORDENADOR | 403 |
| 9 | Professor tenta desativar (sem acesso) | 403 |
| 10 | Auto-desativação bloqueada | 400 |
| 11 | Usuário já desativado | 409 |
| 12 | UUID inválido | 400 |
| 13 | Usuário não encontrado (404) | 404 |
| 14 | Multi-tenancy: Diretor escola A tenta desativar user escola B | 404 |
| 15 | Resposta NÃO contém senha_hash | 200 (sem campo) |
| 16 | Listagem exclui desativados | 200 (lista filtrada) |

### E2E Setup Pattern

Seguir padrão de `test/update-usuario.e2e-spec.ts`:
```typescript
beforeAll(async () => {
  // ... NestJS Test module setup ...
  app.setGlobalPrefix('api/v1');
  await app.init();
});
```

### Frontend Test Cases (6 mínimo)

| # | Caso | Verificação |
|---|------|-------------|
| 1 | Dialog renderiza com nome do usuário | Texto "Tem certeza que deseja desativar {nome}?" |
| 2 | Botão cancelar fecha dialog | `onOpenChange(false)` chamado |
| 3 | Confirmação com sucesso | Toast "Usuário desativado com sucesso" |
| 4 | Erro 403 | Toast "Sem permissão para desativar este usuário" |
| 5 | Erro 409 | Toast "Usuário já está desativado" |
| 6 | Loading state | Botão disabled + spinner visível |

### Project Structure Notes

- Todos os arquivos dentro do módulo `usuarios/` existente (NÃO criar novo módulo)
- Backend: `ressoa-backend/src/modules/usuarios/`
- Frontend: `ressoa-frontend/src/components/shared/` e `ressoa-frontend/src/api/`
- Tests E2E: `ressoa-backend/test/`
- Tests unitários: `ressoa-frontend/src/components/shared/__tests__/`

### Arquivos a Criar

| Arquivo | Tipo |
|---------|------|
| `ressoa-backend/prisma/migrations/YYYYMMDD_add_usuario_deleted_at/migration.sql` | Migration (auto-gerado) |
| `ressoa-frontend/src/components/shared/DeactivateUsuarioDialog.tsx` | Componente |
| `ressoa-frontend/src/components/shared/__tests__/DeactivateUsuarioDialog.test.tsx` | Test |
| `ressoa-backend/test/deactivate-usuario.e2e-spec.ts` | E2E Test |

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `ressoa-backend/prisma/schema.prisma` | Adicionar `deleted_at` + index ao `Usuario` |
| `ressoa-backend/src/modules/usuarios/usuarios.service.ts` | Adicionar `deactivateUsuario()` + filtro `deleted_at: null` em `listUsuarios()` |
| `ressoa-backend/src/modules/usuarios/usuarios.controller.ts` | Adicionar rota `@Patch(':id/desativar')` |
| `ressoa-frontend/src/api/usuarios.ts` | Adicionar `deactivateUsuario()` + tipos |
| `ressoa-frontend/src/hooks/useUsuarios.ts` | Adicionar `useDeactivateUsuario()` |
| `ressoa-frontend/src/components/shared/UsuariosTable.tsx` | Adicionar botão desativar + state + import |

### Impacto no Story 13.10 (Reativar Usuário)

- Story 13.10 depende do `deleted_at` implementado aqui
- Endpoint será `PATCH /api/v1/usuarios/:id/reativar` → seta `deleted_at = null`
- Mesma hierarquia RBAC
- Listagem precisará de query param `?includeDeactivated=true` para ver desativados (futuro)

### References

- [Source: project-context.md#Soft Deletes] - Padrão `deleted_at` + LGPD compliance
- [Source: project-context.md#Multi-Tenancy Security] - Rules #1-5 para escola_id
- [Source: turmas.service.ts:378-396] - Referência de soft delete implementation
- [Source: usuarios.service.ts:207-227] - validateHierarchyPermission() existente
- [Source: usuarios.service.ts:127-205] - updateUsuario() padrão de RBAC + tenant
- [Source: usuarios.controller.ts:55-77] - Padrão de endpoint com ParseUUIDPipe
- [Source: EditUsuarioDialog.tsx] - Padrão de dialog frontend
- [Source: UsuariosTable.tsx:38-47] - canEdit() + EDITABLE_ROLES
- [Source: schema.prisma:112-133] - Modelo Usuario atual (sem deleted_at)
- [Source: schema.prisma:228-265] - Modelo Turma com deleted_at (referência)
- [Source: 13-8-editar-dados-usuario.md] - Previous story learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Shadow DB issue with Prisma migrate (pre-existing P3006 error) → Created migration manually and applied via `db execute` + `migrate resolve`
- Route ordering: Placed `@Patch(':id/desativar')` BEFORE `@Patch(':id')` to avoid NestJS routing conflict where `:id` would capture "desativar"

### Completion Notes List

- Task 1: Added `deleted_at DateTime?` field and `@@index([deleted_at])` to Usuario model. Migration created manually due to pre-existing shadow DB issue.
- Task 2: Implemented `deactivateUsuario()` service method with full RBAC hierarchy, self-deactivation block, tenant isolation, and 409 conflict check. Added `@Patch(':id/desativar')` controller endpoint.
- Task 3: Added `deleted_at: null` filter to `listUsuarios()` WHERE clause to exclude soft-deleted users.
- Task 4: Added `deactivateUsuario()` API function and `useDeactivateUsuario()` React Query mutation hook with cache invalidation.
- Task 5: Created `DeactivateUsuarioDialog.tsx` following EditUsuarioDialog pattern (shadcn/ui Dialog, destructive variant, loading spinner, WCAG 44px touch targets). Added `IconUserOff` button to UsuariosTable with `text-destructive` styling.
- Task 6: Created comprehensive E2E test suite with 16 test cases covering all RBAC combinations, multi-tenancy isolation, self-deactivation block, 409 conflict, UUID validation, listing filter, and security (no senha_hash in response). All 16/16 tests passing.
- Task 7: Created 6 frontend unit tests covering dialog rendering, cancel, success, 403/409 errors, and loading state. All 6/6 tests passing.
- Task 8: Updated sprint-status.yaml to "review".

### Change Log

- 2026-02-14: Story 13.9 implementation complete. Added soft delete (deleted_at) to Usuario model with RBAC hierarchy enforcement, multi-tenancy isolation, and full frontend UI (dialog + table button). 16 E2E + 6 unit tests passing.
- 2026-02-14: **Code Review (AI)** — 4 issues found and auto-fixed: (H1) `updateUsuario()` now rejects deactivated users via `deleted_at: null` filter; (H2) `listUsuarios()` `perfil_usuario: { isNot: null }` preserved in all role filter branches; (M2) `deactivateUsuario()` ForbiddenException message corrected to "desativar" instead of "editar"; (M3) E2E tests now use `afterEach` cleanup to prevent cascading failures. Status: review → done.

### File List

**New files:**
- `ressoa-backend/prisma/migrations/20260214000000_add_usuario_deleted_at/migration.sql`
- `ressoa-frontend/src/components/shared/DeactivateUsuarioDialog.tsx`
- `ressoa-frontend/src/components/shared/__tests__/DeactivateUsuarioDialog.test.tsx`
- `ressoa-backend/test/deactivate-usuario.e2e-spec.ts`

**Modified files:**
- `ressoa-backend/prisma/schema.prisma` (added deleted_at + index to Usuario)
- `ressoa-backend/src/modules/usuarios/usuarios.service.ts` (added deactivateUsuario() + deleted_at filter in listUsuarios)
- `ressoa-backend/src/modules/usuarios/usuarios.controller.ts` (added @Patch(':id/desativar') endpoint, reordered routes)
- `ressoa-frontend/src/api/usuarios.ts` (added deactivateUsuario() + DeactivateUsuarioResponse type)
- `ressoa-frontend/src/hooks/useUsuarios.ts` (added useDeactivateUsuario() hook)
- `ressoa-frontend/src/components/shared/UsuariosTable.tsx` (added deactivate button + dialog integration)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status: in-progress → review)
- `_bmad-output/implementation-artifacts/13-9-desativar-usuario-soft-delete.md` (this file)
