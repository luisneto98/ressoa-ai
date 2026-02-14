# Story 13.8: Editar Dados de Usuário

Status: done

## Story

Como Admin, Diretor ou Coordenador do Ressoa AI,
Eu quero editar os dados de um usuário cadastrado na minha escola (respeitando hierarquia de roles),
Para que eu possa corrigir informações, atualizar dados de contato ou ajustar o perfil sem precisar desativar e recriar o usuário.

## Acceptance Criteria

### Backend API Requirements

**AC1: Endpoint PATCH /api/v1/usuarios/:id com campos editáveis**
- **Given** usuário autenticado com role ADMIN, DIRETOR ou COORDENADOR
- **When** envia PATCH para `/api/v1/usuarios/:id` com body parcial
- **Then** retorna 200 OK com dados atualizados do usuário
- **And** campos editáveis:
  - `nome` (string, 3-200 chars)
  - `email` (string, email válido)
- **And** campo `senha_hash` NUNCA é retornado na resposta
- **And** resposta no formato:
  ```json
  {
    "id": "uuid",
    "nome": "string",
    "email": "string",
    "role": "PROFESSOR | COORDENADOR | DIRETOR",
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
  ```

**AC2: Multi-tenancy isolation — edição restrita à própria escola**
- **Given** Diretor ou Coordenador autenticado pertence a escola A
- **When** tenta PATCH /api/v1/usuarios/:id onde :id pertence a escola B
- **Then** retorna 404 Not Found (não revela existência do usuário)
- **And** `escola_id` extraído do JWT via `this.prisma.getEscolaIdOrThrow()` (TenantInterceptor)
- **And** Admin pode editar qualquer usuário de qualquer escola (escolaId=null no JWT)

**AC3: RBAC — hierarquia de permissões para edição**
- **Given** as seguintes regras de hierarquia:
  - **Admin**: pode editar qualquer usuário (DIRETOR, COORDENADOR, PROFESSOR)
  - **Diretor**: pode editar COORDENADOR e PROFESSOR da própria escola
  - **Coordenador**: pode editar apenas PROFESSOR da própria escola
  - **Professor**: NÃO pode acessar este endpoint (403 Forbidden)
- **When** Coordenador tenta editar um Diretor
- **Then** retorna 403 Forbidden com mensagem "Sem permissão para editar este usuário"
- **And** a hierarquia é aplicada no service, não apenas no guard

**AC4: Validação de email único por escola**
- **Given** email "maria@escola.com" já cadastrado na escola A
- **When** tenta alterar email de outro usuário da escola A para "maria@escola.com"
- **Then** retorna 409 Conflict com mensagem "Email já cadastrado nesta escola"
- **And** validação é case-insensitive (toLowerCase + trim)
- **And** se o email não mudou (mesmo do usuário), permite o update sem conflito

**AC5: Validação de DTO via class-validator**
- **Given** request com body inválido
- **When** backend valida `UpdateUsuarioDto`
- **Then** retorna 400 Bad Request:
  - `nome` com 2 chars → "nome deve ter no mínimo 3 caracteres"
  - `nome` com 201 chars → "nome deve ter no máximo 200 caracteres"
  - `email` inválido → "email deve ser um email válido"
  - body vazio `{}` → 400 "Pelo menos um campo deve ser fornecido"

**AC6: Usuário não encontrado retorna 404**
- **Given** :id não existe no banco (ou não pertence à escola do caller)
- **When** envia PATCH /api/v1/usuarios/:id
- **Then** retorna 404 Not Found

### Frontend Requirements

**AC7: Botão "Editar" na UsuariosTable abre dialog de edição**
- **Given** UsuariosTable já exibe lista de usuários (Story 13.7)
- **When** usuário clica no ícone de edição (IconEdit) na linha do usuário
- **Then** abre shadcn/ui Dialog com formulário de edição
- **And** formulário pré-preenchido com dados atuais do usuário (nome, email)
- **And** botão de edição visível APENAS para usuários que o caller pode editar (hierarquia)
- **And** touch target ≥44px (`h-11 w-11`)
- **And** tooltip "Editar usuário" no botão

**AC8: Formulário de edição com validação em tempo real**
- **Given** dialog de edição aberto
- **When** usuário altera campos
- **Then** validação em tempo real (mode: 'onChange') com feedback visual
- **And** campos:
  - Nome: Input com `@MinLength(3)`, `@MaxLength(200)`
  - Email: Input com validação de email
- **And** botão "Salvar" desabilitado enquanto formulário inválido ou sem alterações
- **And** botão "Cancelar" fecha dialog sem salvar

**AC9: Feedback visual de sucesso e erro**
- **Given** formulário submetido
- **When** atualização bem-sucedida
- **Then** toast de sucesso "Usuário atualizado com sucesso"
- **And** dialog fecha automaticamente
- **And** tabela de usuários atualiza (invalidate React Query)
- **When** erro 409 (email duplicado)
- **Then** erro inline no campo email "Email já cadastrado nesta escola"
- **When** erro 403 (sem permissão)
- **Then** toast de erro "Sem permissão para editar este usuário"
- **When** erro 404 (não encontrado)
- **Then** toast de erro "Usuário não encontrado"

**AC10: Loading state durante submissão**
- **Given** formulário sendo submetido
- **When** request em andamento
- **Then** botão "Salvar" mostra spinner e texto "Salvando..."
- **And** campos do formulário desabilitados durante submit
- **And** botão "Cancelar" desabilitado durante submit

### Testing Requirements

**AC11: Testes E2E backend cobrem RBAC + multi-tenancy + validação**
- **Given** suite de testes em `update-usuario.e2e-spec.ts`
- **When** roda `npm run test:e2e`
- **Then** testes passam:
  1. PATCH /usuarios/:id com Admin → 200 + atualiza usuário de qualquer escola
  2. PATCH /usuarios/:id com Diretor → 200 + atualiza PROFESSOR da própria escola
  3. PATCH /usuarios/:id com Diretor → 200 + atualiza COORDENADOR da própria escola
  4. PATCH /usuarios/:id com Diretor → 403 ao tentar editar DIRETOR
  5. PATCH /usuarios/:id com Coordenador → 200 + atualiza PROFESSOR da própria escola
  6. PATCH /usuarios/:id com Coordenador → 403 ao tentar editar COORDENADOR
  7. PATCH /usuarios/:id com Professor → 403 Forbidden
  8. PATCH /usuarios/:id sem autenticação → 401 Unauthorized
  9. PATCH /usuarios/:id com Diretor escola A → 404 para usuário da escola B (multi-tenancy)
  10. PATCH /usuarios/:id com email duplicado na mesma escola → 409 Conflict
  11. PATCH /usuarios/:id com email do próprio usuário → 200 (sem conflito)
  12. PATCH /usuarios/:id com body inválido → 400 Bad Request
  13. PATCH /usuarios/:id com body vazio → 400 Bad Request
  14. PATCH /usuarios/:id com UUID inexistente → 404 Not Found
  15. Response NÃO contém senha_hash (security)

**AC12: Testes frontend cobrem formulário e interações**
- **Given** suite de testes em `EditUsuarioDialog.test.tsx`
- **When** roda `npm test`
- **Then** testes passam:
  1. Renderiza dialog com dados pré-preenchidos
  2. Validação inline em campo nome (mínimo 3 chars)
  3. Validação inline em campo email (formato inválido)
  4. Botão "Salvar" desabilitado sem alterações
  5. Submit com sucesso fecha dialog e mostra toast
  6. Erro 409 mostra mensagem inline no campo email

## Tasks / Subtasks

### Task 1: Criar UpdateUsuarioDto (AC5)

- [x] **1.1:** Criar `dto/update-usuario.dto.ts` em `ressoa-backend/src/modules/usuarios/dto/`
  ```typescript
  import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
  import { ApiPropertyOptional } from '@nestjs/swagger';

  export class UpdateUsuarioDto {
    @ApiPropertyOptional({ description: 'Nome do usuário', minLength: 3, maxLength: 200 })
    @IsOptional()
    @IsString({ message: 'nome deve ser uma string' })
    @MinLength(3, { message: 'nome deve ter no mínimo 3 caracteres' })
    @MaxLength(200, { message: 'nome deve ter no máximo 200 caracteres' })
    nome?: string;

    @ApiPropertyOptional({ description: 'Email do usuário' })
    @IsOptional()
    @IsEmail({}, { message: 'email deve ser um email válido' })
    email?: string;
  }
  ```
- [x] **1.2:** Adicionar export em `dto/index.ts`

### Task 2: Implementar UsuariosService.updateUsuario (AC1, AC2, AC3, AC4, AC6)

- [x] **2.1:** Adicionar método `updateUsuario` ao `usuarios.service.ts`:
  ```typescript
  async updateUsuario(
    callerRole: RoleUsuario,
    targetId: string,
    dto: UpdateUsuarioDto,
  ) {
    // 1. Validate at least one field provided
    if (!dto.nome && !dto.email) {
      throw new BadRequestException('Pelo menos um campo deve ser fornecido');
    }

    // 2. Build where clause with tenant isolation
    const where: Prisma.UsuarioWhereUniqueInput = { id: targetId };
    if (callerRole !== RoleUsuario.ADMIN) {
      const escolaId = this.prisma.getEscolaIdOrThrow();
      where.escola_id = escolaId; // Tenant isolation
    }

    // 3. Find target user
    const targetUser = await this.prisma.usuario.findUnique({
      where,
      include: { perfil_usuario: { select: { role: true } } },
    });
    if (!targetUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 4. Check hierarchy permission
    const targetRole = targetUser.perfil_usuario?.role;
    this.validateHierarchyPermission(callerRole, targetRole);

    // 5. Email uniqueness check (if email is being changed)
    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      if (normalizedEmail !== targetUser.email.toLowerCase()) {
        const existing = await this.prisma.usuario.findFirst({
          where: {
            email: normalizedEmail,
            escola_id: targetUser.escola_id,
            id: { not: targetId },
          },
        });
        if (existing) {
          throw new ConflictException('Email já cadastrado nesta escola');
        }
        dto.email = normalizedEmail;
      }
    }

    // 6. Update
    const updated = await this.prisma.usuario.update({
      where: { id: targetId },
      data: {
        ...(dto.nome && { nome: dto.nome.trim() }),
        ...(dto.email && { email: dto.email }),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        created_at: true,
        updated_at: true,
        perfil_usuario: { select: { role: true } },
      },
    });

    return {
      id: updated.id,
      nome: updated.nome,
      email: updated.email,
      role: updated.perfil_usuario?.role ?? null,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }

  private validateHierarchyPermission(
    callerRole: RoleUsuario,
    targetRole: RoleUsuario | undefined,
  ) {
    if (callerRole === RoleUsuario.ADMIN) return; // Admin can edit anyone

    if (!targetRole) {
      throw new ForbiddenException('Sem permissão para editar este usuário');
    }

    const editableRoles: Record<RoleUsuario, RoleUsuario[]> = {
      [RoleUsuario.DIRETOR]: [RoleUsuario.PROFESSOR, RoleUsuario.COORDENADOR],
      [RoleUsuario.COORDENADOR]: [RoleUsuario.PROFESSOR],
      [RoleUsuario.PROFESSOR]: [],
      [RoleUsuario.ADMIN]: [], // Admin handled above
    };

    if (!editableRoles[callerRole]?.includes(targetRole)) {
      throw new ForbiddenException('Sem permissão para editar este usuário');
    }
  }
  ```

### Task 3: Criar endpoint PATCH /usuarios/:id (AC1, AC3)

- [x] **3.1:** Adicionar endpoint ao `usuarios.controller.ts`:
  ```typescript
  @Patch(':id')
  @Roles(RoleUsuario.ADMIN, RoleUsuario.DIRETOR, RoleUsuario.COORDENADOR)
  @ApiOperation({ summary: 'Editar dados de usuário', description: 'Atualiza nome e/ou email do usuário respeitando hierarquia' })
  @ApiParam({ name: 'id', description: 'ID do usuário (UUID)' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Validação falhou' })
  @ApiResponse({ status: 403, description: 'Sem permissão para editar este usuário' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado nesta escola' })
  async updateUsuario(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.updateUsuario(
      user.userId,
      user.role,
      id,
      dto,
    );
  }
  ```
- [x] **3.2:** Importar `Patch`, `Param`, `Body`, `ParseUUIDPipe` do `@nestjs/common`
- [x] **3.3:** Importar `ApiParam` do `@nestjs/swagger`

### Task 4: Testes E2E backend (AC11)

- [x] **4.1:** Criar `ressoa-backend/test/update-usuario.e2e-spec.ts`
- [x] **4.2:** Implementar 15 test cases de AC11
- [x] **4.3:** Setup:
  - Criar 2 escolas (A e B)
  - Criar usuários em ambas escolas (Admin, Diretor, Coordenador, Professor)
  - Gerar tokens JWT para cada role
- [x] **4.4:** Verificar multi-tenancy: Diretor A NÃO pode editar usuário da escola B
- [x] **4.5:** Verificar que `senha_hash` NUNCA está no response
- [x] **4.6:** Verificar hierarquia: Coordenador NÃO edita Coordenador ou Diretor
- [x] **4.7:** Cleanup: remover dados de teste após suite
- [x] **4.8:** Usar `app.setGlobalPrefix('api/v1')` no beforeAll (padrão Epic 13)

### Task 5: Frontend — Criar EditUsuarioDialog (AC7, AC8, AC9, AC10)

- [x] **5.1:** Criar `ressoa-frontend/src/components/shared/EditUsuarioDialog.tsx`
- [x] **5.2:** Implementar dialog com shadcn/ui Dialog + Form:
  ```typescript
  interface EditUsuarioDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    usuario: { id: string; nome: string; email: string; role: string };
    onSuccess?: () => void;
  }
  ```
- [x] **5.3:** Schema zod para validação:
  ```typescript
  const editUsuarioSchema = z.object({
    nome: z.string().trim().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
    email: z.string().trim().toLowerCase().email('Email inválido'),
  });
  ```
- [x] **5.4:** React Hook Form com zodResolver, mode: 'onChange'
- [x] **5.5:** Pré-preencher defaultValues com dados atuais do usuário
- [x] **5.6:** Botão "Salvar" desabilitado quando: form inválido, sem alterações (isDirty=false), ou isPending
- [x] **5.7:** Loading state: spinner + "Salvando..." + campos disabled durante submit
- [x] **5.8:** Error handling:
  - 409 → `form.setError('email', { message: 'Email já cadastrado nesta escola' })`
  - 403 → `toast.error('Sem permissão para editar este usuário')`
  - 404 → `toast.error('Usuário não encontrado')`
  - Outros → `toast.error('Erro ao atualizar usuário. Tente novamente.')`

### Task 6: Frontend — Criar API e hook de update (AC9)

- [x] **6.1:** Adicionar `updateUsuario` em `ressoa-frontend/src/api/usuarios.ts`:
  ```typescript
  export async function updateUsuario(
    id: string,
    data: { nome?: string; email?: string },
  ): Promise<UsuarioListItem> {
    const response = await apiClient.patch<UsuarioListItem>(`/usuarios/${id}`, data);
    return response.data;
  }
  ```
- [x] **6.2:** Adicionar mutation hook em `ressoa-frontend/src/hooks/useUsuarios.ts`:
  ```typescript
  export function useUpdateUsuario() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: { nome?: string; email?: string } }) =>
        updateUsuario(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
      },
    });
  }
  ```

### Task 7: Frontend — Integrar EditUsuarioDialog na UsuariosTable (AC7)

- [x] **7.1:** Adicionar coluna "Ações" na UsuariosTable (se não existir)
- [x] **7.2:** Adicionar botão de edição com IconEdit na coluna de ações
- [x] **7.3:** Estado local para controlar dialog:
  ```typescript
  const [editingUsuario, setEditingUsuario] = useState<UsuarioListItem | null>(null);
  ```
- [x] **7.4:** Passar prop `canEdit` para controlar visibilidade do botão (hierarquia)
- [x] **7.5:** Usar `useAuthStore` ou `useAuth` para obter role do caller
- [x] **7.6:** Lógica de visibilidade do botão editar:
  - Admin: vê botão para todos
  - Diretor: vê botão para PROFESSOR e COORDENADOR
  - Coordenador: vê botão para PROFESSOR apenas

### Task 8: Testes frontend (AC12)

- [x] **8.1:** Criar `ressoa-frontend/src/components/shared/__tests__/EditUsuarioDialog.test.tsx`
- [x] **8.2:** Implementar 6 test cases de AC12
- [x] **8.3:** Mockar React Query mutation (useUpdateUsuario)
- [x] **8.4:** Testar: pré-preenchimento, validação, submit, erros

## Dev Notes

### Architectural Patterns — MUST FOLLOW

**Extend UsuariosModule (NÃO criar novo module):**
- O `UsuariosModule` já existe em `ressoa-backend/src/modules/usuarios/`
- Adicionar endpoint PATCH ao controller existente
- Adicionar método `updateUsuario` ao service existente
- Adicionar novo DTO ao diretório `dto/`

**Multi-Tenancy Security (CRITICAL):**
- **SEMPRE** usar `this.prisma.getEscolaIdOrThrow()` para Diretor/Coordenador
- **Admin** tem `escolaId = null` no JWT → skip filtro de escola_id
- **NUNCA** aceitar escola_id do body/params para non-Admin roles
- Quando Admin edita, usar `escola_id` do target user (não do JWT)

**Hierarquia RBAC no Service (NÃO no Guard):**
- Guard `@Roles(ADMIN, DIRETOR, COORDENADOR)` bloqueia PROFESSOR
- A lógica de "quem pode editar quem" é no SERVICE, pois depende do role do target user
- Diretor pode editar PROFESSOR + COORDENADOR (não pode editar outro DIRETOR)
- Coordenador pode editar apenas PROFESSOR

**Email Normalization:**
- `toLowerCase().trim()` ANTES de qualquer comparação ou persistência
- Verificar unicidade: `@@unique([email, escola_id])` no schema Prisma
- Self-update: se email === email atual do usuário → skip uniqueness check

**Controller Route Prefix:**
- Usar `@Patch(':id')` — global prefix `api/v1/` definido no `main.ts`
- NÃO usar `@Patch('api/v1/usuarios/:id')` — causa DOUBLE PREFIX bug

**Response Security:**
- NUNCA retornar `senha_hash` — usar explicit `select`
- Retornar `updated_at` na resposta para o frontend saber que atualizou

### Frontend Patterns — MUST FOLLOW

**Dialog Pattern (de InviteProfessorDialog/InviteCoordenadorDialog):**
- shadcn/ui Dialog com `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
- React Hook Form com zodResolver
- mode: 'onChange' para validação em tempo real
- `form.setError('field', { message })` para erros 409 do backend

**Mutation Pattern (de useDiretor.ts/useCoordenador.ts):**
- `useMutation` com `mutationFn` chamando api function
- `onSuccess` invalida queries: `queryClient.invalidateQueries({ queryKey: usuariosKeys.all })`
- Toast no componente (não no hook) para controle fino de UX

**Botão de Ação na Tabela (de TurmasTable.tsx):**
- Touch target ≥44px: `h-11 w-11`
- Usar `<Button variant="ghost" size="icon">`
- Tooltip com `title="Editar usuário"`
- ARIA: `aria-label="Editar {nome do usuário}"`

**Design System Colors:**
- Deep Navy: `text-deep-navy` (headers)
- Tech Blue: `text-tech-blue` (links, actions)
- Ghost White: `bg-ghost-white` (backgrounds)
- Font: `font-montserrat` (headings), `font-inter` (body)

**Ícones:**
- Usar `IconEdit` de `@tabler/icons-react` (padrão Epic 9.7)
- Import individual: `import { IconEdit } from '@tabler/icons-react'`
- Sizing: `className="size-5"` (20px)

### Previous Story Intelligence (13.7)

**Learnings from Story 13.7 Code Review:**
1. `@SkipThrottle()` foi REMOVIDO — não desabilitar rate limiting
2. `@IsUUID()` adicionado ao `escola_id` no DTO — validar UUID params
3. Dead code removido do controller/service — manter clean
4. `(u: any)` type cast removido — usar TypeScript inference
5. `perfil_usuario: { isNot: null }` filtro adicionado — excluir registros órfãos
6. `@MinLength(2)` + `@MaxLength(100)` no search — validar lengths
7. DateFormatter extraído para constante module-level — evitar recreate
8. `isFetching` + opacity usado em vez de skeleton completo em refetch
9. Page reset atrelado ao `debouncedSearch` via useEffect

**Padrão de Teste E2E (de list-usuarios.e2e-spec.ts):**
- `app.setGlobalPrefix('api/v1')` obrigatório no beforeAll
- Criar 2 escolas para testar multi-tenancy isolation
- Verificar que `senha_hash` NUNCA aparece na resposta
- Usar `ParseUUIDPipe` para validar formato do ID

### Existing Files to Modify

**Backend (modificar):**
- `ressoa-backend/src/modules/usuarios/usuarios.controller.ts` — adicionar endpoint PATCH
- `ressoa-backend/src/modules/usuarios/usuarios.service.ts` — adicionar método updateUsuario + validateHierarchyPermission
- `ressoa-backend/src/modules/usuarios/dto/index.ts` — exportar novo DTO

**Backend (criar):**
- `ressoa-backend/src/modules/usuarios/dto/update-usuario.dto.ts` — novo DTO
- `ressoa-backend/test/update-usuario.e2e-spec.ts` — testes E2E

**Frontend (modificar):**
- `ressoa-frontend/src/components/shared/UsuariosTable.tsx` — adicionar coluna ações + botão editar
- `ressoa-frontend/src/api/usuarios.ts` — adicionar função updateUsuario
- `ressoa-frontend/src/hooks/useUsuarios.ts` — adicionar useUpdateUsuario hook

**Frontend (criar):**
- `ressoa-frontend/src/components/shared/EditUsuarioDialog.tsx` — dialog de edição
- `ressoa-frontend/src/components/shared/__tests__/EditUsuarioDialog.test.tsx` — testes

### Critical Implementation Notes

**1. PerfilUsuario é tabela SEPARADA:**
- `RoleUsuario` está em `PerfilUsuario.role`, NÃO em `Usuario`
- Para verificar hierarquia, precisa fazer `include: { perfil_usuario: { select: { role: true } } }`
- NÃO alterar role nesta story — apenas nome e email

**2. Admin tem NULL escola_id:**
- Admin JWT payload tem `escolaId: null`
- `this.prisma.getEscolaIdOrThrow()` vai THROW para Admin
- Admin endpoint: NÃO chamar getEscolaIdOrThrow() — usar query sem filtro de escola
- Admin pode editar qualquer usuário

**3. ParseUUIDPipe para :id:**
- Usar `@Param('id', ParseUUIDPipe)` no controller
- Retorna 400 automaticamente se ID não é UUID válido

**4. Email self-update sem conflito:**
- Se o email novo é o MESMO do usuário atual → skip uniqueness check
- Comparar em lowercase: `newEmail.toLowerCase() !== currentEmail.toLowerCase()`
- Evita falso conflito quando usuário submete sem alterar email

**5. Body vazio deve retornar 400:**
- Mesmo com `@IsOptional()` em todos os campos, validar que ao menos 1 campo foi enviado
- Validar no service: `if (!dto.nome && !dto.email) throw BadRequestException`

**6. Trimming de dados:**
- `nome`: trim antes de persistir
- `email`: toLowerCase + trim antes de persistir
- Não retornar dados diferentes do que foi persistido

### Project Structure Notes

**Backend path:** `ressoa-backend/src/modules/usuarios/` (NÃO `apps/backend/`)
**Frontend path:** `ressoa-frontend/src/` (NÃO `apps/frontend/`)

**Guard execution order:**
1. JwtAuthGuard (authentication — popula `request.user`)
2. RolesGuard (authorization — valida `@Roles()`)
3. ThrottlerGuard (rate limiting)
4. TenantInterceptor (injeta escolaId no AsyncLocalStorage)

### References

**Previous Story Files:**
- [Source: 13-7-listar-usuarios-cadastrados.md] — UsuariosModule, service patterns, E2E patterns
- [Source: 13-6-convidar-professor-coordenador.md] — CoordenadorModule, InviteProfessorDialog
- [Source: 13-5-convidar-professor-diretor.md] — DiretorModule, invite endpoint pattern

**Architecture Patterns:**
- [Source: architecture.md#AD-2.2] — REST API: PATCH for partial updates
- [Source: architecture.md#AD-2.3] — DTO validation: class-validator + class-transformer
- [Source: architecture.md#AD-1.1] — Auth: Passport JWT
- [Source: architecture.md#AD-4.4] — Multi-tenancy: RLS + TenantInterceptor

**Project Context:**
- [Source: project-context.md#Rule-1] — ALWAYS add escola_id to WHERE clauses
- [Source: project-context.md#Rule-2] — Use getEscolaIdOrThrow() for protected endpoints
- [Source: project-context.md#RBAC] — Role hierarchy: PROFESSOR < COORDENADOR < DIRETOR < ADMIN

**Prisma Schema:**
- [Source: ressoa-backend/prisma/schema.prisma] — Usuario (lines 112-133), PerfilUsuario (lines 135-148), RoleUsuario enum
- Unique constraint: `@@unique([email, escola_id])`

**Frontend Components:**
- [Source: ressoa-frontend/src/components/shared/UsuariosTable.tsx] — Tabela existente para adicionar coluna ações
- [Source: ressoa-frontend/src/components/shared/InviteProfessorDialog.tsx] — Padrão de dialog + form
- [Source: ressoa-frontend/src/hooks/useUsuarios.ts] — Query keys para invalidação
- [Source: ressoa-frontend/src/api/usuarios.ts] — API layer para adicionar updateUsuario

**Recent Commits (Pattern Reference):**
```
cf2ccde feat(story-13.7): implement user listing with role-based filtering (backend + frontend complete)
13a60fb fix(story-13.6): apply code review fixes for professor invitation by coordenador
11a98de feat(story-13.6): implement professor invitation by coordenador (backend + frontend complete)
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- E2E tests: ThrottlerStorage override required to bypass rate limiting in test environment (ThrottlerGuard override doesn't work for APP_GUARD providers)
- Email uniqueness: Changed to case-insensitive Prisma query `{ equals: normalizedEmail, mode: 'insensitive' }` to match `@@unique([email, escola_id])` behavior

### Completion Notes List

- All 8 tasks completed
- Backend: 15/15 E2E tests pass
- Frontend: 6/6 unit tests pass, existing UsuariosTable tests (6/6) unaffected
- TypeScript compilation clean on both backend and frontend
- Multi-tenancy isolation verified (Diretor A cannot edit escola B users → 404)
- RBAC hierarchy enforced in service layer (Admin > Diretor > Coordenador > Professor)
- Email validation: case-insensitive uniqueness per school, self-update without conflict
- Design system compliance: font-montserrat, text-deep-navy, bg-tech-blue, min-h-[44px] touch targets

### Change Log

| Date       | Change                                  | Reason                        |
| ---------- | --------------------------------------- | ----------------------------- |
| 2026-02-14 | All 8 tasks implemented and tested      | Initial story implementation  |
| 2026-02-14 | Email uniqueness query → case-insensitive | Fix false negatives in check |
| 2026-02-14 | Code Review: 8 issues found, 5 auto-fixed | Senior Developer Review (AI) |

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 (Adversarial Code Review)
**Date:** 2026-02-14
**Result:** APPROVED with fixes applied

**Issues Found: 3 HIGH, 3 MEDIUM, 2 LOW**

**Fixed (5):**
1. **[H1] `useEffect` missing `form` dep** — Added `form` to dependency array (`EditUsuarioDialog.tsx`)
2. **[H2] `form.watch()` in render causing re-renders** — Replaced with `useWatch` hook for optimized subscriptions (`EditUsuarioDialog.tsx`)
3. **[H3] Story spec vs implementation mismatch** — Updated Task 2.1 spec to match actual 3-param implementation (callerId was unused)
4. **[M1] sprint-status.yaml not in File List** — Added to File List
5. **[M3] E2E test cleanup without try/finally** — Wrapped cleanup in try/finally to ensure app.close() runs even if cleanup fails
6. **[L1] Loose error type assertion** — Replaced with `isAxiosError()` from axios for proper type safety

**Accepted (2):**
- **[M2] Empty body validation at service layer** — Acceptable pattern; service catches `{}` body before DB call. E2E test 13 confirms 400 response.
- **[L2] `UsuarioListItem` missing `updated_at`** — Table doesn't display updated_at; inconsistency is cosmetic only.

### File List

**Backend (created):**
- `ressoa-backend/src/modules/usuarios/dto/update-usuario.dto.ts`
- `ressoa-backend/test/update-usuario.e2e-spec.ts`

**Backend (modified):**
- `ressoa-backend/src/modules/usuarios/dto/index.ts`
- `ressoa-backend/src/modules/usuarios/usuarios.service.ts`
- `ressoa-backend/src/modules/usuarios/usuarios.controller.ts`

**Frontend (created):**
- `ressoa-frontend/src/components/shared/EditUsuarioDialog.tsx`
- `ressoa-frontend/src/components/shared/__tests__/EditUsuarioDialog.test.tsx`

**Frontend (modified):**
- `ressoa-frontend/src/api/usuarios.ts`
- `ressoa-frontend/src/hooks/useUsuarios.ts`
- `ressoa-frontend/src/components/shared/UsuariosTable.tsx`
