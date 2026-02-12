# TusController Security Note

## Context (Story 7.5 Code Review)

**Date:** 2026-02-12
**Reviewer:** Claude Code Review Agent (Adversarial Mode)
**Severity:** MEDIUM

## Issue

`TusController.handleTus()` tem guard `@Roles('PROFESSOR')` que valida role, mas não há **ownership validation** no controller layer.

**Cenário de risco:**
- Professor A cria aula com `aula_id = 123` (sua aula)
- Professor B (malicioso) tenta fazer upload TUS com metadata `aula_id = 123` (aula do Professor A)
- Controller permite (ambos são PROFESSOR)
- **Depende de TusService validar ownership**

## Status Atual

**MITIGADO (mas não ideal):**
- `TusService` recebe metadata do upload TUS
- Service layer DEVE validar que `metadata.aula_id` pertence ao professor autenticado
- Implementação real em `TusService` não auditada neste review (fora do escopo da Story 7.5)

## Recomendação de Correção Futura

### Option 1: Validação no Controller (Preferível)

```typescript
@All('*')
@Roles('PROFESSOR')
async handleTus(@Req() req: Request, @Res() res: Response, @CurrentUser() user: AuthenticatedUser) {
  // Extract aula_id from TUS metadata header
  const metadata = req.headers['upload-metadata'];
  if (metadata) {
    const aulaId = parseTusMetadata(metadata, 'aula_id');
    if (aulaId) {
      // Validate ownership BEFORE delegating to TUS server
      await this.tusService.validateAulaOwnership(aulaId, user.userId, user.escolaId);
    }
  }

  const server = this.tusService.getServer();
  return server.handle(req, res);
}
```

### Option 2: Garantir Validação no Service

Adicionar testes E2E que validem:
```typescript
it('NÃO DEVE permitir upload para aula de outro professor', async () => {
  // Professor B tenta fazer upload para aula do Professor A
  const uploadUrl = await startTusUpload(professorBToken, {
    aula_id: professorAAulaId, // ❌ Cross-ownership
  });

  expect(uploadUrl).toBeNull(); // Service deve rejeitar
});
```

## Action Items

- [ ] Auditar `TusService` para confirmar validação de ownership
- [ ] Adicionar testes E2E de segurança para TUS uploads cross-ownership
- [ ] Considerar mover validação para controller layer (fail-fast)

## References

- **Story:** 7-5-rbac-guards-privacy-enforcement.md
- **Pattern:** [project-context.md#Rule #1: ALWAYS Add escola_id to WHERE Clauses](../../project-context.md)
- **Similar Implementation:** `AnaliseController.getAnaliseByAula()` (ownership check no controller)
