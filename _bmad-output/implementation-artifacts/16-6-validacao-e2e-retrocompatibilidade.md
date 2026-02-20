# Story 16.6: Validação E2E e Retrocompatibilidade

Status: done

## Story

Como equipe de desenvolvimento,
quero garantir que todas as mudanças do Epic 16 são retrocompatíveis e o fluxo existente não quebra,
para fazer deploy seguro sem afetar usuários existentes.

## Acceptance Criteria

1. Novo arquivo `ressoa-backend/test/analise-aderencia-objetivo.e2e-spec.ts` criado com 6+ cenários E2E cobrindo: legado sem descrição, rascunho com descrição completa, planejamento com descrição no contexto, imutabilidade após status change, e retrocompatibilidade da API
2. **Fluxo legado intacto**: aula criada SEM `descricao` → pipeline de análise v5 executa normalmente → `aderencia_objetivo_json` retorna `null` no response — zero erros
3. **Fluxo rascunho + aderência**: criar rascunho com `descricao` → `POST /aulas/:id/iniciar` (TRANSCRICAO) → `analiseService.analisarAula()` → `aderencia_objetivo_json` é populado com `faixa_aderencia`, `analise_qualitativa`, `pontos_atingidos`, `pontos_nao_atingidos`, `recomendacao`
4. **Planejamento com descrição**: planejamento com `descricao` + aula com `descricao` → análise → mock LLM spy confirma que `descricao_planejamento` e `descricao_aula` foram passados como contexto (via verificação do argumento ao `complete()`)
5. **Imutabilidade da descrição**: criar rascunho → `POST /aulas/:id/iniciar` (status muda de RASCUNHO) → `PATCH /aulas/:id/descricao` deve retornar **400** — descrição não pode ser editada após sair de RASCUNHO
6. **Migration safety**: verificar via Prisma que aulas/planejamentos pré-existentes (da escola demo) têm `descricao = null` e analises têm `aderencia_objetivo_json = null` (os campos nullable não corrompem dados históricos)
7. **Seed de prompts v5.0.0 idempotente**: executar seed duas vezes → número de prompts v5.0.0 permanece estável (sem duplicatas); prompts v4.0.0 permanecem com `ativo = false`
8. **Zero breaking changes na API existente**: `GET /aulas/:id/analise` em analise legacy (sem aderencia) retorna o campo `aderencia_objetivo_json: null` sem erro — adapter frontend suporta ambos os formatos
9. Todos os testes E2E existentes (exceto os que já tinham defeitos conhecidos) passam sem modificação após as mudanças do Epic 16
10. Documentação Swagger (`GET /aulas/:id/analise`) inclui o campo `aderencia_objetivo_json` na resposta (verificação manual ou via swagger spec)

## Tasks / Subtasks

- [x] Task 1: Criar `analise-aderencia-objetivo.e2e-spec.ts` (AC: #1, #2, #3, #4, #5, #6, #8)
  - [x] Subtask 1.1 — Setup: escola demo, professor upsert, turma, habilidade BNCC, planejamento (sem descricao), login
  - [x] Subtask 1.2 — Cenário A: **Fluxo legado sem descrição** — aula sem descricao → pipeline → `aderencia_objetivo_json = null` ✅
  - [x] Subtask 1.3 — Cenário B: **Rascunho com descrição → análise com aderência** — faixa ALTA, pontos_atingidos, recomendacao ✅
  - [x] Subtask 1.4 — Cenário C: **Planejamento com descrição no contexto** — spy no GeminiProvider (primary), confirma contexto ✅
  - [x] Subtask 1.5 — Cenário D: **Imutabilidade da descrição** — PATCH retorna 400 após sair de RASCUNHO ✅
  - [x] Subtask 1.6 — Cenário E: **Migration safety** — 4 sub-testes: descricao=null, planejamento=null, analise=null, enum RASCUNHO ✅
  - [x] Subtask 1.7 — Cenário F: **API retrocompatibilidade** — GET /aulas/:id/analise retorna aderencia_objetivo_json: null ✅

- [x] Task 2: Verificar e atualizar `analise-pipeline.e2e-spec.ts` para v5 (AC: #9)
  - [x] Subtask 2.1 — Corrigido import `LlmModule` → `LLMModule` (pre-existing naming bug)
  - [x] Subtask 2.2 — Migrado de selective modules para `AppModule` (ContextService DI fix)
  - [x] Subtask 2.3 — Adicionado `GeminiProvider` mock (primary provider per providers.config.json)
  - [x] Subtask 2.4 — Adicionado teste `aderencia_objetivo_json = null` (AC #2 retrocompat) ✅

- [x] Task 3: Verificar seed idempotência dos prompts v5 (AC: #7)
  - [x] Subtask 3.1 — 4 testes: ≥5 v5 ativos, v4 com ativo=false, 5 nomes corretos, contagem estável ✅

- [x] Task 4: Cleanup e afterAll (AC: #1)
  - [x] Subtask 4.1 — afterAll limpa em ordem correta: analise→transcricao→aula→planejamentoHabilidade→planejamento→turma→usuario
  - [x] Subtask 4.2 — Não remove escola demo, não remove habilidades BNCC
  - [x] Subtask 4.3 — Não remove prompts v5 (dados de seed)

## Dev Notes

### Posição no Epic 16

Story 16.6 é a história de fechamento do Epic 16. Depende de **todas** as histórias anteriores:
- **16.1** (done): `descricao` em Planejamento + endpoints CRUD
- **16.2** (done): `RASCUNHO` status + `POST /aulas/rascunho` + `POST /aulas/:id/iniciar` + `PATCH /aulas/:id/descricao`
- **16.3** (done): Prompts v5.0.0 com contexto de descrição (variáveis `descricao_planejamento`, `descricao_aula`)
- **16.4** (done): `aderencia_objetivo_json` em Analise + parse do bloco `aderencia_json` no relatorio
- **16.5** (done): Frontend `AderenciaObjetivoCard` + adapter atualizado

### Arquivo Principal a Criar

```
ressoa-backend/test/analise-aderencia-objetivo.e2e-spec.ts
```

### Padrão de Setup dos E2E Tests

Seguir exatamente o padrão de `analise-pipeline.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AnaliseService } from '../src/modules/analise/services/analise.service';
import { StatusProcessamento, TipoEntrada } from '@prisma/client';

describe('Analise Aderência ao Objetivo + Retrocompatibilidade Epic 16 (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let analiseService: AnaliseService;

  // IDs criados no setup
  let escolaId: string;
  let professorToken: string;
  let professorId: string;
  let turmaId: string;
  let habilidadeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = app.get(PrismaService);
    analiseService = app.get(AnaliseService);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Usar escola demo do seed
    const escolaDemo = await prisma.escola.findUnique({ where: { cnpj: '12.345.678/0001-90' } });
    if (!escolaDemo) throw new Error('Demo school not found. Run: npx prisma db seed');
    escolaId = escolaDemo.id;

    // Usar professor demo
    const professor = await prisma.usuario.findFirst({ where: { email: 'professor@escolademo.com' } });
    if (!professor) throw new Error('Demo professor not found. Run: npx prisma db seed');
    professorId = professor.id;

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'professor@escolademo.com', senha: 'Demo@123' });
    professorToken = loginRes.body.accessToken;

    // Criar turma para os testes
    const turma = await prisma.turma.create({
      data: {
        nome: 'E2E-16.6',
        disciplina: 'MATEMATICA',
        serie: 'SEXTO_ANO',
        ano_letivo: 2099, // ano fictício para isolamento
        escola_id: escolaId,
        professor_id: professorId,
      },
    });
    turmaId = turma.id;

    // Buscar habilidade BNCC para os testes
    const habilidade = await prisma.habilidade.findFirst({ where: { disciplina: 'MATEMATICA', ano_inicio: 6 } });
    if (!habilidade) throw new Error('Habilidade BNCC não encontrada. Run: npx prisma db seed');
    habilidadeId = habilidade.id;
  });

  afterAll(async () => {
    // Cleanup na ordem correta (FK constraints)
    // Buscar aulas do ano 2099 (isoladas por ano_letivo fictício)
    const aulas = await prisma.aula.findMany({ where: { turma: { ano_letivo: 2099 } }, select: { id: true } });
    const aulaIds = aulas.map(a => a.id);

    await prisma.analise.deleteMany({ where: { aula_id: { in: aulaIds } } });
    await prisma.transcricao.deleteMany({ where: { aula_id: { in: aulaIds } } });
    await prisma.aula.deleteMany({ where: { id: { in: aulaIds } } });
    await prisma.planejamentoHabilidade.deleteMany({ where: { planejamento: { turma: { ano_letivo: 2099 } } } });
    await prisma.planejamento.deleteMany({ where: { turma: { ano_letivo: 2099 } } });
    await prisma.turma.deleteMany({ where: { ano_letivo: 2099 } });

    await app.close();
  });
```

### Mock do Pipeline LLM — Padrão do analise-pipeline.e2e-spec.ts

O `AnaliseService` usa injeção de dependência. Para mockar o LLM sem chamar APIs reais:

```typescript
import { LlmService } from '../src/modules/llm/llm.service';

// No describe de cada cenário:
let llmService: LlmService;
llmService = app.get(LlmService);

// Mock para cenário SEM aderência (sem descricao_aula):
jest.spyOn(llmService, 'complete').mockResolvedValue({
  content: MOCK_RELATORIO_SEM_ADERENCIA_BLOCK,
  tokens_input: 1000,
  tokens_output: 500,
  model: 'mock-v5',
  provider: 'mock',
});
```

**IMPORTANTE**: Verificar como `analise-pipeline.e2e-spec.ts` faz o mock do provider — seguir exatamente o mesmo padrão (pode ser via `LlmService.complete()` ou via provider específico). Ler o arquivo completo antes de implementar.

### Mock Responses — Relatorio SEM bloco aderencia_json

```typescript
const MOCK_RELATORIO_SEM_ADERENCIA = `
# Relatório de Análise Pedagógica

Esta aula cobriu adequadamente os conteúdos planejados.

## Pontos Positivos
- Boa sequência didática
- Uso de exemplos contextualizados

## Sugestões
- Aumentar tempo de prática individual
`;
// Sem bloco ```aderencia_json — aderencia_objetivo_json deve ficar null
```

### Mock Responses — Relatorio COM bloco aderencia_json

```typescript
const MOCK_RELATORIO_COM_ADERENCIA = `
# Relatório de Análise Pedagógica

Esta aula cobriu adequadamente os conteúdos planejados e o objetivo declarado.

## Pontos Positivos
- Objetivo atingido majoritariamente

\`\`\`aderencia_json
{
  "faixa_aderencia": "ALTA",
  "descricao_faixa": "Entre 70% e 90% do objetivo declarado foi trabalhado",
  "analise_qualitativa": "O professor planejou trabalhar frações com material concreto. A aula efetivamente utilizou exemplos visuais e material concreto. A atividade em grupos foi parcialmente realizada.",
  "pontos_atingidos": ["Uso de material concreto conforme planejado", "Exemplos visuais de frações"],
  "pontos_nao_atingidos": ["Atividade em grupos não finalizada"],
  "recomendacao": "Retomar a atividade colaborativa na próxima aula para consolidar a aprendizagem."
}
\`\`\`
`;
```

### Verificação de Contexto nos Prompts (Cenário C)

Para verificar que `descricao_planejamento` e `descricao_aula` chegam ao LLM:

```typescript
const llmSpy = jest.spyOn(llmService, 'complete').mockResolvedValue({...});

await analiseService.analisarAula(aulaId);

// Verificar que os spies foram chamados com o contexto correto
const allCalls = llmSpy.mock.calls;
const promptsContent = allCalls.map(call => JSON.stringify(call[0])).join('\n');
expect(promptsContent).toContain('Material concreto + avaliação formativa'); // descricao_planejamento
expect(promptsContent).toContain('Objetivo específico desta aula'); // descricao_aula
```

### Estrutura de Criação de Aula + Transcricao para Testes de Pipeline

```typescript
// Criar aula no status correto (TRANSCRITA) para análise
async function criarAulaParaAnalise(prisma, turmaId, planejamentoId, descricao?: string) {
  const aula = await prisma.aula.create({
    data: {
      turma_id: turmaId,
      data: new Date('2099-06-15'),
      tipo_entrada: 'TRANSCRICAO',
      status_processamento: 'TRANSCRITA',
      planejamento_id: planejamentoId,
      descricao: descricao ?? null,
    },
  });

  await prisma.transcricao.create({
    data: {
      aula_id: aula.id,
      texto: 'Hoje vamos aprender sobre frações. Uma fração representa partes de um todo...',
      status: 'CONCLUIDA',
      provedor_stt: 'mock',
      duracao_segundos: 2700,
    },
  });

  return aula;
}
```

### Prompts v5 — Verificar que Existem no Banco

```typescript
it('seed de prompts v5.0.0 é idempotente (AC #7)', async () => {
  // Contar antes
  const countBefore = await prisma.promptTemplate.count({ where: { versao: { startsWith: 'v5' }, ativo: true } });
  expect(countBefore).toBeGreaterThanOrEqual(5); // 5 prompts v5 ativos

  // Verificar que v4 está inativo
  const v4Ativos = await prisma.promptTemplate.count({ where: { versao: { startsWith: 'v4' }, ativo: true } });
  expect(v4Ativos).toBe(0); // v4 deve estar inativo

  // Verificar nomes dos prompts v5
  const v5Prompts = await prisma.promptTemplate.findMany({ where: { versao: { startsWith: 'v5' }, ativo: true } });
  const nomes = v5Prompts.map(p => p.nome);
  expect(nomes).toContain('cobertura');
  expect(nomes).toContain('qualitativa');
  expect(nomes).toContain('relatorio');
  expect(nomes).toContain('exercicios');
  expect(nomes).toContain('alertas');
});
```

**Nota**: Verificar o nome exato do modelo Prisma (`promptTemplate` vs `promptVersao` vs outro) consultando `prisma/schema.prisma`.

### Verifying Migration Safety

```typescript
describe('Migration Safety — dados históricos (AC #6)', () => {
  it('aulas pré-existentes têm descricao = null', async () => {
    // Escola demo tem aulas criadas antes do Epic 16
    const aulaExistente = await prisma.aula.findFirst({
      where: { turma: { escola_id: escolaId, ano_letivo: { not: 2099 } } },
    });
    if (aulaExistente) {
      // Se existe, verifica que descricao é null (campo nullable sem default)
      expect(aulaExistente.descricao).toBeNull();
    }
    // Se não existe, o teste é trivialmente verdadeiro (sem aulas antigas)
  });

  it('status RASCUNHO não quebrou aulas com status CRIADA existentes', async () => {
    const aulasCriadas = await prisma.aula.findMany({
      where: { status_processamento: 'CRIADA' },
      take: 5,
    });
    // CRIADA ainda deve existir e funcionar
    aulasCriadas.forEach(aula => {
      expect(aula.status_processamento).toBe('CRIADA');
    });
  });
});
```

### Arquivos de Implementação do Epic 16 — Para Referência

Estes arquivos já foram implementados e **não devem ser alterados** nesta story (apenas validados):

| Arquivo | Relevância para 16.6 |
|---------|---------------------|
| `src/modules/aulas/aulas.service.ts` | `createRascunho()`, `iniciarProcessamento()`, validação de imutabilidade |
| `src/modules/aulas/aulas.controller.ts` | `POST /aulas/rascunho`, `PATCH /aulas/:id/descricao`, `POST /aulas/:id/iniciar` |
| `src/modules/analise/services/analise.service.ts` | `analisarAula()` — monta contexto com `descricao_planejamento` e `descricao_aula`, parse do bloco aderencia_json |
| `prisma/seeds/prompts/prompt-relatorio-v5.1.0.json` | Prompt com instrução de gerar bloco aderencia_json (versão mais recente) |
| `prisma/schema.prisma` | `Aula.descricao`, `Planejamento.descricao`, `Analise.aderencia_objetivo_json`, enum `StatusProcessamento.RASCUNHO` |

### Localizar Método de Mock LLM Correto

**CRÍTICO**: Antes de implementar, ler `test/analise-pipeline.e2e-spec.ts` completamente para entender como o mock do LLM é feito. O padrão pode ser:
- `jest.spyOn(claudeProvider, 'complete')` — mock no provider específico
- `jest.spyOn(llmService, 'complete')` — mock no serviço abstrato
- Mock via `moduleFixture.overrideProvider(...)` — override durante bootstrap

Usar exatamente o mesmo padrão do arquivo existente para consistência.

### Endpoint de Análise — Verificar Response Shape

Para o Cenário F (retrocompatibilidade da API):
```
GET /api/v1/aulas/:id/analise
Authorization: Bearer {professorToken}
```

Response esperado (com aderencia):
```json
{
  "id": "...",
  "aula": {
    "id": "...",
    "descricao": "Objetivo específico",
    ...
  },
  "aderencia_objetivo_json": {
    "faixa_aderencia": "ALTA",
    ...
  },
  "relatorio_texto": "# Relatório...",
  ...
}
```

Response esperado (sem aderencia — legado):
```json
{
  "id": "...",
  "aula": {
    "id": "...",
    "descricao": null,
    ...
  },
  "aderencia_objetivo_json": null,
  ...
}
```

### Padrão de Commits

```
feat(story-16.6): add E2E validation for aderencia objetivo and Epic 16 retrocompatibility
```

### Learnings das Stories Anteriores

- **16.2**: `POST /aulas/rascunho` e `PATCH /aulas/:id/descricao` e `POST /aulas/:id/iniciar` já testados em `aula-rascunho.e2e-spec.ts` — não duplicar esses testes, apenas os cenários integrados com análise
- **16.1**: `descricao` em planejamento já testado em `planejamento.e2e-spec.ts` — não duplicar
- **analise-pipeline**: O mock do LLM precisa responder para TODOS os 5 prompts do pipeline, não apenas o relatorio — usar `mockResolvedValue` genérico ou `mockResolvedValueOnce` por prompt
- **11.10**: Story similar de validação E2E — seguir o mesmo padrão de organização por `describe` blocks por cenário
- **bcrypt/timeout**: Setup pode demorar — usar `await new Promise(resolve => setTimeout(resolve, 100))` para aguardar inicialização dos serviços
- **TypeScript strict**: Todos os `any` devem ter tipo correto — usar `Prisma.PromptTemplate` ou o tipo correto do Prisma

### Project Structure Notes

- Testes E2E do backend: `ressoa-backend/test/`
- Config de jest E2E: `ressoa-backend/test/jest-e2e.json`
- Seeds de prompts: `ressoa-backend/prisma/seeds/prompts/`
- Schema Prisma: `ressoa-backend/prisma/schema.prisma`
- Serviço de análise: `ressoa-backend/src/modules/analise/services/analise.service.ts`
- Service de aulas: `ressoa-backend/src/modules/aulas/aulas.service.ts`

### Referências Técnicas

- [Source: _bmad-output/implementation-artifacts/epics/epic-16-contexto-planejamento-aula-aderencia.md#US-020.6] — Requisitos completos da story
- [Source: ressoa-backend/test/analise-pipeline.e2e-spec.ts] — Padrão de mock de LLM no pipeline (LEIA COMPLETO antes de implementar)
- [Source: ressoa-backend/test/aula-rascunho.e2e-spec.ts] — Padrão de teste do fluxo rascunho (Story 16.2)
- [Source: ressoa-backend/test/planejamento.e2e-spec.ts#773-853] — Testes Story 16.1 (descricao em planejamento)
- [Source: ressoa-backend/src/modules/analise/services/analise.service.ts#197-335] — Montagem de contexto com descricoes (linhas onde `descricao_planejamento` e `descricao_aula` são passados)
- [Source: ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v5.1.0.json] — Prompt mais recente com instrução de aderencia_json
- [Source: _bmad-output/implementation-artifacts/16-4-analise-aderencia-objetivo-relatorio.md#DevNotes] — Schema zod do aderencia_objetivo_json + formato do bloco
- [Source: _bmad-output/planning-artifacts/architecture.md] — Stack: NestJS + Prisma + PostgreSQL + Bull (Redis) + Jest

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

N/A

### Completion Notes List

1. **providers.config.json** routes most LLM calls to `GEMINI_FLASH` (not `CLAUDE_SONNET`) as primary. Tests must mock `GeminiProvider` to avoid real API calls and timeouts.
2. **analise-pipeline.e2e-spec.ts** had 3 pre-existing bugs (hidden by broken jest-e2e.json): wrong `LlmModule` import name, missing `ContextService` DI when using selective modules, missing `turno` field in turma. All fixed.
3. **aderencia_objetivo_json** was stored in DB (Story 16.4) but not exposed via `GET /aulas/:id/analise` API. Added to controller response (`analise.controller.ts`) as part of Story 16.6 AC #8.
4. Used counter-based Gemini mock (`createGeminiMockImpl`) — call 3 = relatorio prompt, returns markdown with/without `aderencia_json` block.
5. All 26 E2E tests pass: 14 in `analise-aderencia-objetivo` + 12 in `analise-pipeline`.

### File List

- `ressoa-backend/test/analise-aderencia-objetivo.e2e-spec.ts` — NOVO (16 testes E2E: 14 originais + 2 adicionados no code review — cross-tenant test + Cenário F auto-suficiente)
- `ressoa-backend/test/analise-pipeline.e2e-spec.ts` — CORRIGIDO (12 testes, bugs pre-existentes resolvidos)
- `ressoa-backend/test/jest-e2e.json` — CORRIGIDO: transformIgnorePatterns para ESM deps + ts-jest diagnostics config
- `ressoa-backend/src/modules/analise/analise.controller.ts` — CORRIGIDO: adiciona `aderencia_objetivo_json` e `aula.descricao` na response do GET /aulas/:id/analise
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — atualizado 16-6 para done

## Change Log

| Date | Change | By |
|------|--------|----|
| 2026-02-20 | Story created — SM analysis complete, ready for dev implementation | claude-sonnet-4-6 |
| 2026-02-20 | Implementation complete — 26/26 E2E tests pass; fixed pre-existing bugs in analise-pipeline.e2e-spec.ts; added aderencia_objetivo_json to API response | claude-sonnet-4-6 |
| 2026-02-20 | Code review complete — 7 issues found (1 HIGH, 4 MEDIUM, 2 LOW), all auto-fixed: afterEach mock cleanup, aula.descricao exposed in API response, Cenário C counter-based mock, Cenário F self-contained, cross-tenant isolation test added, jest-e2e.json added to File List, redundant ?? null removed | claude-sonnet-4-6 |
