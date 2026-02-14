# Story 14.1: Camada de Roteamento Configurável

**Epic:** 14 - Sistema Configurável de Provider Routing
**Status:** Backlog
**Complexity:** M (5 pontos)
**Priority:** P0 (blocker para outras stories)

---

## 📋 User Story

> **Como** desenvolvedor
> **Quero** uma camada de roteamento que leia configuração e roteia operações para providers específicos
> **Para que** o sistema decida em runtime qual provider usar sem code changes

---

## ✅ Acceptance Criteria

- [ ] **AC1:** `ProviderRouter` service criado para STT com métodos `getSTTProvider(operation)` e `getSTTFallback()`
- [ ] **AC2:** `LLMRouter` service criado para LLM com método `getLLMProvider(analysisType: 'cobertura' | 'qualitativa' | 'relatorio' | 'exercicios' | 'alertas')`
- [ ] **AC3:** Config suporta estrutura JSON com primary + fallback por tipo de operação
- [ ] **AC4:** Router tenta primary → se falhar, tenta fallback → se falhar, throw error com contexto claro
- [ ] **AC5:** Logs estruturados (Pino) registram: provider tentado, fallback usado (se aplicável), latência, custo, success/failure
- [ ] **AC6:** Suporta hot-reload de config via `ConfigService.watch()` (sem restart do servidor)
- [ ] **AC7:** Validação de schema via Zod com mensagens de erro claras
- [ ] **AC8:** Defaults seguros: se config inválida ou ausente, usa providers atuais (OpenAI Whisper + Claude)
- [ ] **AC9:** Testes unitários: mock providers, validação de roteamento, fallback behavior, config inválida
- [ ] **AC10:** Cobertura de testes ≥85%

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
- `src/modules/stt/services/stt-router.service.ts`
- `src/modules/stt/services/stt-router.service.spec.ts`
- `src/modules/llm/services/llm-router.service.ts`
- `src/modules/llm/services/llm-router.service.spec.ts`
- `src/config/providers.config.ts` (schema Zod + loader)
- `src/config/providers.config.spec.ts`

### Modificados
- Nenhum (história focada em criar infraestrutura nova)

---

## 🔧 Technical Notes

- Router usa Dependency Injection (NestJS) para obter providers
- Config loader usa `ConfigService` do NestJS
- Fallback logic com retry exponential backoff (3 tentativas, 1s → 2s → 4s)
- Validação de schema Zod com mensagens de erro claras
- Hot-reload via `ConfigService.watch()` (observar mudanças no arquivo)

---

## 🧪 Testing Strategy

### Unit Tests
- Mock providers (STT e LLM)
- Testar roteamento correto baseado em config
- Testar fallback behavior (forçar falha de primary)
- Testar config inválida (schema validation)
- Testar defaults seguros (config ausente)

### Coverage Target
- ≥85% coverage em todos os arquivos criados

---

## 📚 Dependencies

- Nenhuma dependência externa de outras stories
- Blocker para: Stories 14.2, 14.3, 14.4

---

**Created:** 2026-02-14
**Assigned to:** -
**Estimated Hours:** 12-16h
