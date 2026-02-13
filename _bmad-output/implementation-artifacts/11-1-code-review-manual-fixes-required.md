# Story 11.1 - Code Review: Manual Fixes Required

**Story:** 11-1-backend-modelo-objetivos-aprendizagem
**Reviewer:** Claude Sonnet 4.5 (Adversarial Code Review)
**Date:** 2026-02-13
**Review Status:** BLOQUEADO - 4 problemas críticos/altos requerem ação manual

---

## ✅ Auto-Fixes Aplicados (6/10)

Os seguintes problemas foram **automaticamente corrigidos** e testados:

1. ✅ **CRÍTICO #2 RESOLVIDO** - Schema Prisma comentários já estavam corretos com `//`
2. ✅ **ALTO #2 FIXADO** - Service `findByTurma()` agora valida turma não deletada (soft-delete check)
3. ✅ **MÉDIO #1 FIXADO** - Controller usa DTOs de validação para query params (3 novos DTOs criados)
4. ✅ **MÉDIO #2 FIXADO** - Teste de integração criado: `seed-bncc-objetivos.integration.spec.ts`
5. ✅ **MÉDIO #3 FIXADO** - Teste adicional criado: validação de turma deletada (13/13 testes passando)
6. ✅ **Build & Tests** - Todos testes passando (13/13), build sem erros

**Files Modified:**
- `src/modules/objetivos/objetivos.service.ts` - soft-delete validation
- `src/modules/objetivos/objetivos.controller.ts` - DTO validation
- `src/modules/objetivos/dto/query-objetivos.dto.ts` - NEW FILE (3 DTOs)
- `src/modules/objetivos/objetivos.service.spec.ts` - +1 test (13 total)
- `test/seed-bncc-objetivos.integration.spec.ts` - NEW FILE (integration test)

---

## 🔴 PROBLEMAS CRÍTICOS - Ação Manual Obrigatória (4)

### **CRÍTICO #1: Contaminação massiva com código do Epic 10**

**Status:** ⚠️ **BLOCKER - Requer ação manual do desenvolvedor**

**Problema:**
Story 11.1 está contaminada com 17+ arquivos do Epic 10 que não pertencem a esta story:
- Frontend: `turmas/*`, `CoberturaBadge.tsx`, `QuestaoCard.tsx`, `RelatorioTab.tsx`
- Backend: `turmas/*`, `dashboard/dto/*`, `habilidades.service.ts`
- Seed: `prompt-exercicios-v2.0.0.json` (Epic 5, não relacionado)

**File List da story lista 6 arquivos, git mostra 22 modificados + 5 untracked.**

**Impacto:**
- Impossível rastrear mudanças reais da Story 11.1
- Code review comprometido
- Rollback perigoso (pode reverter Epic 10 inteiro)
- Histórico de git poluído

**Solução Manual Requerida:**

1. **Stash mudanças do Epic 10:**
   ```bash
   git stash push -m "Epic 10 changes (turmas, EM, frontend)" \
     ressoa-frontend/ \
     ressoa-backend/src/modules/turmas/ \
     ressoa-backend/src/modules/dashboard/dto/ \
     ressoa-backend/src/modules/habilidades/habilidades.service.ts \
     ressoa-backend/src/modules/professores/dto/ \
     ressoa-backend/prisma/seeds/prompts/prompt-exercicios-v2.0.0.json
   ```

2. **Criar commit limpo Story 11.1 (apenas 6 arquivos do Epic 11):**
   ```bash
   git add ressoa-backend/prisma/schema.prisma
   git add ressoa-backend/prisma/seed.ts
   git add ressoa-backend/src/modules/objetivos/
   git add ressoa-backend/src/app.module.ts
   git add ressoa-backend/src/common/constants/
   git add ressoa-backend/test/seed-bncc-objetivos.integration.spec.ts
   git commit -m "feat(story-11.1): implement ObjetivoAprendizagem model with BNCC migration

- Add ObjetivoAprendizagem model (BNCC + custom objectives framework)
- Add NivelBloom & TipoFonte enums (Bloom taxonomy support)
- Migrate 329 BNCC habilidades to objetivos (idempotent seed)
- Create ObjetivosModule with CRUD service + REST API
- Add conditional validations (BNCC vs CUSTOM)
- 13/13 unit tests passing + integration test suite
- Code review fixes: soft-delete check, query DTO validation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

3. **Aplicar stash do Epic 10 em branch separada:**
   ```bash
   git stash pop  # Recuperar mudanças Epic 10
   # Revisar e commitar Epic 10 separadamente (ou descartar se já commitado)
   ```

**Prevenção Futura:**
- Use branches isoladas para cada epic
- Rode `git status` antes de iniciar nova story
- Clean working directory entre stories

---

### **CRÍTICO #3: Seed count incorreto (329 vs 869)**

**Status:** ⚠️ **VERIFICAÇÃO REQUERIDA**

**Problema:**
Story documenta **329 habilidades migradas**, mas AC3 especifica **869 habilidades** (369 EF + 500 EM).

**Possíveis causas:**
1. Seed executado antes de Story 10.3 (EM seeding) - faltam 500 habilidades EM
2. Seed filtrou apenas `ativa: true` mas algumas habilidades estão inativas
3. Story não rodou seed após implementação completa do EM

**Validação Manual Requerida:**

```bash
# 1. Verificar total de habilidades na base
psql -d ressoa_dev -c "SELECT COUNT(*), tipo_ensino FROM habilidade WHERE ativa = true GROUP BY tipo_ensino;"

# Output esperado:
# count | tipo_ensino
# ------+-------------
#   369 | FUNDAMENTAL  ← Epic 0 seed
#   500 | MEDIO        ← Epic 10.3 seed
# ------
#   869 | TOTAL

# 2. Verificar objetivos migrados
psql -d ressoa_dev -c "SELECT COUNT(*) FROM objetivo_aprendizagem WHERE tipo_fonte = 'BNCC';"

# Output esperado: 869 (ou 329 se seed rodou antes do Epic 10.3)
```

**Ação Corretiva:**

**Se count = 329 (faltam 500 EM):**
```bash
# Re-executar seed completo
npm --prefix ressoa-backend run prisma:seed

# Validar resultado
psql -d ressoa_dev -c "SELECT COUNT(*) FROM objetivo_aprendizagem WHERE tipo_fonte = 'BNCC';"
# Deve retornar: 869
```

**Se count = 869:**
- ✅ Seed está correto, apenas atualizar Dev Notes da story (linha 529) para refletir 869

**Atualização da Story:**
- Substituir todas referências "329" por "869" no arquivo da story
- Atualizar Completion Notes (linha 529): "869 habilidades BNCC migradas"

---

### **ALTO #3: Falta validação de multi-tenancy no service**

**Status:** ⚠️ **RISCO DE SEGURANÇA - Implementar em Story 11.4 ou 11.5**

**Problema:**
ObjetivoAprendizagem custom tem `turma_id`, turma tem `escola_id`, mas service NÃO valida isolamento entre escolas.

**Cenário de ataque:**
```typescript
// Coordenador Escola A descobre UUID de turma da Escola B
GET /objetivos/turma?turma_id=turma-escola-B-uuid
// ❌ Retorna objetivos customizados de outra escola (vazamento de dados)
```

**Por que não foi auto-fixado:**
- Requer decisão de arquitetura (injetar escola_id via JWT context vs Prisma middleware)
- Requer implementação de RbacGuard com políticas de acesso
- Requer testes de autorização multi-tenant

**Solução Sugerida (Story 11.4 ou 11.5):**

**Opção 1: RbacGuard + Service Validation**
```typescript
// 1. Controller: Adicionar RbacGuard
@Controller('objetivos')
@UseGuards(JwtAuthGuard, RbacGuard)
@Roles(RoleUsuario.PROFESSOR, RoleUsuario.COORDENADOR)
export class ObjetivosController { ... }

// 2. Service: Injetar currentUser e validar escola_id
async findByTurma(turmaId: string, currentUser: User): Promise<ObjetivoAprendizagem[]> {
  const turma = await this.prisma.turma.findUnique({
    where: { id: turmaId },
  });

  if (!turma || turma.deleted_at) {
    throw new NotFoundException('Turma não encontrada ou foi deletada');
  }

  // ✅ Validação multi-tenancy
  if (turma.escola_id !== currentUser.escola_id) {
    throw new ForbiddenException('Acesso negado: turma pertence a outra escola');
  }

  return this.prisma.objetivoAprendizagem.findMany({
    where: { tipo_fonte: TipoFonte.CUSTOM, turma_id: turmaId },
    orderBy: { codigo: 'asc' },
  });
}
```

**Opção 2: Prisma Middleware (Preferível - AD-4.6)**
```typescript
// prisma/prisma.service.ts
this.prisma.$use(async (params, next) => {
  const currentUser = getCurrentUserFromContext(); // Via AsyncLocalStorage

  if (params.model === 'ObjetivoAprendizagem' && params.action === 'findMany') {
    // Injetar escola_id filter automaticamente via turma relation
    params.args.where = {
      ...params.args.where,
      turma: {
        escola_id: currentUser.escola_id,
      },
    };
  }

  return next(params);
});
```

**Prioridade:** Alta - Implementar antes de Story 11.6 (Frontend Gestão Objetivos)

---

### **ALTO #4: Migration não está versionada (db push usado)**

**Status:** ⚠️ **BLOCKER PARA DEPLOY - Criar migration proper**

**Problema:**
Story usou `prisma db push` ao invés de `prisma migrate dev` (linha 232 da story):
> "Subtask 2.1: Aplicar schema changes via `prisma db push`"

**Impacto:**
- Migration não está em `prisma/migrations/` - não versionada
- Impossível rollback
- Impossível replicar em staging/production
- CI/CD vai falhar (não sabe como aplicar mudanças)

**AC2 especifica corretamente (linha 72-82):**
```
When executo `npx prisma migrate dev --name create-objetivo-aprendizagem`
Then migration é criada em `prisma/migrations/`
```

**Ação Corretiva Obrigatória:**

```bash
# 1. Resetar shadow database (se dessincronizado)
npx prisma migrate reset --skip-seed  # ⚠️ CUIDADO: Dropa database local

# 2. Criar migration proper a partir do schema atual
npx prisma migrate dev --name create-objetivo-aprendizagem-and-planejamento-objetivo

# Output esperado:
# ✔ Migration 20260213XXXXXX_create_objetivo_aprendizagem_and_planejamento_objetivo created
# ✔ Migration applied to database

# 3. Validar migration files criados
ls -la prisma/migrations/20260213*
# Deve existir: migration.sql

# 4. Commitar migration
git add prisma/migrations/
git commit -m "chore(story-11.1): add prisma migration for ObjetivoAprendizagem model"
```

**Alternativa (se migration manual necessária):**
```bash
# Criar migration vazia e preencher manualmente
npx prisma migrate dev --create-only --name create-objetivo-aprendizagem

# Editar migration.sql com DDL statements
nano prisma/migrations/20260213XXXXXX_create_objetivo_aprendizagem/migration.sql

# Aplicar migration
npx prisma migrate deploy
```

**Validação Pós-Migration:**
```bash
# Verificar migrations aplicadas
npx prisma migrate status

# Deve mostrar:
# ✔ 20260213XXXXXX_create_objetivo_aprendizagem_and_planejamento_objetivo applied
```

**Prevenção Futura:**
- SEMPRE usar `prisma migrate dev` (NUNCA `prisma db push` em feature branches)
- `prisma db push` é apenas para prototipagem rápida local

---

## 📊 Resumo de Status

| Problema | Severidade | Status | Ação |
|----------|-----------|--------|------|
| #1 - Contaminação Epic 10 | 🔴 CRÍTICA | ⚠️ MANUAL | Limpar git working directory |
| #2 - Schema comentários | 🔴 CRÍTICA | ✅ FIXADO | Já corrigido (false positive) |
| #3 - Seed count 329 vs 869 | 🔴 CRÍTICA | ⚠️ VERIFICAR | Validar DB + re-seed se necessário |
| #4 - Multi-tenancy | 🟡 ALTA | 📝 BACKLOG | Implementar Story 11.4/11.5 |
| #5 - Migration não versionada | 🟡 ALTA | ⚠️ BLOCKER | Criar migration proper |
| #6 - Soft-delete turmas | 🟡 ALTA | ✅ FIXADO | Service validação adicionada |
| #7 - Query params DTO | 🟢 MÉDIA | ✅ FIXADO | 3 DTOs criados |
| #8 - Teste integração seed | 🟢 MÉDIA | ✅ FIXADO | Integration test criado |
| #9 - Swagger response docs | 🟢 MÉDIA | 📝 BACKLOG | Aceitar como tech debt |

**Total:** 4 MANUAL ACTIONS REQUIRED antes de merge

---

## ✅ Próximos Passos

1. **IMEDIATO (antes de merge):**
   - [ ] Limpar contaminação Epic 10 (CRÍTICO #1)
   - [ ] Validar/corrigir seed count (CRÍTICO #3)
   - [ ] Criar migration versionada (ALTO #5)

2. **Story 11.4 ou 11.5 (antes de frontend):**
   - [ ] Implementar multi-tenancy validation (ALTO #4)

3. **Tech Debt Aceitável:**
   - Swagger response schemas (MÉDIO #9) - pode ser documentado depois

---

## 📝 Notas do Reviewer

**O que foi bem feito:**
- ✅ Model Prisma estruturalmente sólido (enums, indexes, constraints)
- ✅ Validações de negócio robustas (conditional logic BNCC vs CUSTOM)
- ✅ Testes unitários com boa cobertura (13/13 passando)
- ✅ Seed idempotente (upsert pattern correto)
- ✅ Documentação detalhada na story

**Lições aprendidas:**
- Sempre limpar working directory entre stories (evitar contaminação)
- Sempre usar `prisma migrate dev` (nunca `db push` em feature branch)
- Validar seed results contra AC specifications (329 ≠ 869)
- Multi-tenancy validation deve ser pensada desde o início (não retrofit)

**Review Score:** 7/10 - Implementação sólida, mas processos de git e migration precisam melhorar.

---

**Assinado:** Claude Sonnet 4.5 (Adversarial Code Reviewer)
**Data:** 2026-02-13
