# Story 16.4: Análise de Aderência ao Objetivo no Relatório

Status: done

## Story

Como professor,
quero ver no relatório o quanto consegui alcançar o objetivo que declarei para a aula,
para ter feedback concreto sobre a execução do meu planejamento.

## Acceptance Criteria

1. Campo `aderencia_objetivo_json Json?` existe no model `Analise` do schema Prisma e migration aplicada
2. `prompt-relatorio-v5.1.0.json` criado: quando `descricao_aula` existe, instrução de gerar bloco `aderencia_json` é incluída no prompt; `max_tokens` aumentado para 5000
3. `prompt-relatorio-v5.0.0.json` marcado como `ativo: false`; demais prompts v5.0.0 (cobertura, qualitativa, exercicios, alertas) permanecem ativos sem alteração
4. `AnaliseService.analisarAula()` extrai o bloco aderencia_json da resposta do Prompt 3 usando regex `\`\`\`aderencia_json\n([\s\S]*?)\n\`\`\``
5. JSON extraído é validado com zod antes de persistir — se `descricao_aula` existe e JSON válido: persiste em `aderencia_objetivo_json`; se parse/validação falhar: `aderencia_objetivo_json` fica `null` (degradação graciosa, sem falha no pipeline)
6. Bloco `\`\`\`aderencia_json...\`\`\`` é removido do `relatorio_texto` antes de salvar (relatório final não contém o bloco JSON)
7. Quando `descricao_aula` é `null`: `aderencia_objetivo_json` fica `null`; prompt v5.1.0 NÃO gera o bloco aderencia_json (condicional Handlebars `{{#if descricao_aula}}`)
8. `GET /aulas/:id/analise` retorna `aderencia_objetivo_json` no response (campo retornado via `findByAulaId` — Prisma inclui todos os campos por padrão)
9. Testes unitários em `analise.service.spec.ts`: extração com bloco presente, extração com bloco ausente, validação zod com JSON inválido (fallback null), retrocompatibilidade (sem descricao_aula)
10. Seed dos prompts: `prompt-relatorio-v5.1.0.json` é idempotente via upsert `{ nome, versao }`

## Tasks / Subtasks

- [x] Task 1: Schema Prisma + Migration (AC: #1)
  - [x] Em `ressoa-backend/prisma/schema.prisma`, model `Analise`, adicionar após `alertas_json`:
    ```prisma
    // STORY 16.4: Análise de aderência ao objetivo declarado pelo professor
    // Nullable — só existe quando aula.descricao (descricao_aula) estava preenchida
    aderencia_objetivo_json Json? // { faixa_aderencia, descricao_faixa, analise_qualitativa, pontos_atingidos, pontos_nao_atingidos, recomendacao }
    ```
  - [x] Executar `cd ressoa-backend && npx prisma migrate dev --name add_aderencia_objetivo_json_to_analise`
  - [x] Verificar que migration gerada apenas adiciona coluna nullable (sem DEFAULT, sem NOT NULL) — não afeta registros existentes
  - [x] Executar `npx prisma generate` para atualizar Prisma Client

- [x] Task 2: Criar `prompt-relatorio-v5.1.0.json` (AC: #2, #7)
  - [x] Copiar conteúdo de `prompt-relatorio-v5.0.0.json` como base
  - [x] Alterar `"versao": "v5.1.0"` e manter `"ativo": true`
  - [x] Alterar `"max_tokens": 5000` (de 3500 — espaço para markdown + bloco aderencia_json)
  - [x] Na seção de variáveis, manter os mesmos campos do v5.0.0
  - [x] No `conteudo`, SUBSTITUIR o bloco existente de `{{#if descricao_aula}}` (o que diz "O relatório deve referenciar este objetivo para contextualizar as observações") por este bloco expandido:
    ```handlebars
    {{#if descricao_aula}}
    ### Objetivo Específico desta Aula (declarado pelo professor)
    O professor declarou o seguinte objetivo para esta aula:
    "{{{descricao_aula}}}"

    O relatório DEVE referenciar este objetivo e avaliar o quanto foi alcançado.
    {{/if}}
    ```
  - [x] Na seção `## Formato de Saída`, SUBSTITUIR o bloco `**Retorne APENAS o relatório em markdown** (não JSON).` pelo bloco abaixo (após `**IMPORTANTE:**`):
    ```
    ## Formato de Saída

    **Retorne o relatório em markdown** (texto principal).

    {{#if descricao_aula}}
    **ADICIONALMENTE**, após o relatório markdown, retorne o bloco JSON de aderência delimitado EXATAMENTE como abaixo (sem texto entre o relatório e o bloco):

    ```aderencia_json
    {
      "faixa_aderencia": "BAIXA" | "MEDIA" | "ALTA" | "TOTAL",
      "descricao_faixa": "string explicando o que a faixa significa para este contexto",
      "analise_qualitativa": "string com análise detalhada comparando intenção vs execução (mínimo 2 frases)",
      "pontos_atingidos": ["string[]"],
      "pontos_nao_atingidos": ["string[]"],
      "recomendacao": "string com sugestão acionável para próxima aula"
    }
    ```

    **Regras para classificação de faixa_aderencia:**
    - BAIXA: Aula desviou significativamente — menos de 30% dos elementos do objetivo foram trabalhados
    - MEDIA: Aula cobriu parcialmente — entre 30% e 70% dos elementos foram trabalhados
    - ALTA: Aula seguiu majoritariamente — entre 70% e 90% dos elementos foram trabalhados
    - TOTAL: Aula executou integralmente — acima de 90% dos elementos foram trabalhados

    **IMPORTANTE:** Percentuais são estimativas qualitativas, NÃO cálculos exatos. Use seu julgamento baseado nas evidências da transcrição.
    {{else}}
    **Retorne APENAS o relatório em markdown** (não JSON).
    {{/if}}
    ```
  - [x] Verificar que o JSON dentro do bloco aderencia_json usa aspas duplas escapadas como `\"` na string do campo `conteudo` do arquivo JSON
  - [x] Salvar em `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v5.1.0.json`

- [x] Task 3: Desativar `prompt-relatorio-v5.0.0.json` (AC: #3)
  - [x] Editar `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v5.0.0.json`: alterar `"ativo": true` para `"ativo": false`
  - [x] Confirmar que os outros 4 prompts v5.0.0 (cobertura, qualitativa, exercicios, alertas) NÃO são alterados — permanecem `"ativo": true`

- [x] Task 4: `AnaliseService` — Extração e parse do bloco aderencia_json (AC: #4, #5, #6)
  - [x] Em `analise.service.ts`, adicionar zod schema estático (antes da classe `AnaliseService`):
    ```typescript
    import { z } from 'zod';

    const AderenciaObjetivoSchema = z.object({
      faixa_aderencia: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'TOTAL']),
      descricao_faixa: z.string().min(1),
      analise_qualitativa: z.string().min(1),
      pontos_atingidos: z.array(z.string()),
      pontos_nao_atingidos: z.array(z.string()),
      recomendacao: z.string().min(1),
    });

    type AderenciaObjetivo = z.infer<typeof AderenciaObjetivoSchema>;
    ```
  - [x] Adicionar método privado `extractAderenciaJson()` na classe:
    ```typescript
    /**
     * Extrai e valida bloco aderencia_json do output do Prompt 3.
     *
     * O Prompt 3 v5.1.0 retorna markdown + bloco opcional delimitado por
     * ```aderencia_json ... ```. Este método extrai o JSON do bloco,
     * valida com zod e retorna o objeto validado (ou null se ausente/inválido).
     *
     * Degradação graciosa: nunca lança exceção — falhas retornam null.
     *
     * @param relatorioOutput Output bruto do Prompt 3 (string markdown)
     * @param descricaoAula Objetivo declarado (null = sem aderência)
     * @returns { aderenciaJson, relatorioLimpo } — bloco removido do relatório
     */
    private extractAderenciaJson(
      relatorioOutput: string,
      descricaoAula: string | null,
    ): { aderenciaJson: AderenciaObjetivo | null; relatorioLimpo: string } {
      if (!descricaoAula) {
        return { aderenciaJson: null, relatorioLimpo: relatorioOutput };
      }

      const match = relatorioOutput.match(
        /```aderencia_json\n([\s\S]*?)\n```/,
      );

      if (!match) {
        this.logger.warn({
          message: 'Bloco aderencia_json não encontrado no output do Prompt 3',
          hint: 'LLM não gerou o bloco ou formato incorreto — aderencia_objetivo_json ficará null',
        });
        return { aderenciaJson: null, relatorioLimpo: relatorioOutput };
      }

      const rawJson = match[1].trim();
      const relatorioLimpo = relatorioOutput
        .replace(/\n```aderencia_json\n[\s\S]*?\n```/, '')
        .trim();

      try {
        const parsed = this.parseMarkdownJSON(rawJson);
        const validated = AderenciaObjetivoSchema.parse(parsed);
        return { aderenciaJson: validated, relatorioLimpo };
      } catch (error) {
        this.logger.warn({
          message: 'Falha ao parsear/validar aderencia_json — degradação graciosa',
          error: error instanceof Error ? error.message : String(error),
          rawJson: rawJson.substring(0, 300),
        });
        return { aderenciaJson: null, relatorioLimpo };
      }
    }
    ```
  - [x] Em `analisarAula()`, SUBSTITUIR a linha que captura o output do Prompt 3:
    ```typescript
    // ANTES (linha ~314):
    const {
      output: relatorioOutput,
      custo: custo3,
      versao: versao3,
      provider: prov3,
    } = await this.executePrompt('prompt-relatorio', contexto, 'relatorio');
    custoTotal += custo3;
    promptVersoes.relatorio = versao3;

    // DEPOIS:
    const {
      output: relatorioOutputRaw,
      custo: custo3,
      versao: versao3,
      provider: prov3,
    } = await this.executePrompt('prompt-relatorio', contexto, 'relatorio');
    custoTotal += custo3;
    promptVersoes.relatorio = versao3;

    // STORY 16.4: Extrair e separar bloco aderencia_json do relatório markdown
    const { aderenciaJson, relatorioLimpo: relatorioOutput } =
      this.extractAderenciaJson(
        typeof relatorioOutputRaw === 'string' ? relatorioOutputRaw : String(relatorioOutputRaw),
        contexto.descricao_aula,
      );
    ```
  - [x] No `prisma.$transaction()` → `tx.analise.create({ data: { ... } })`, adicionar após `alertas_json`:
    ```typescript
    // STORY 16.4: Aderência ao objetivo (null se sem descricao_aula ou parse falhou)
    aderencia_objetivo_json: aderenciaJson,
    ```
  - [x] Garantir que `relatorio_texto` usa `relatorioOutput` (limpo, sem o bloco JSON)

- [x] Task 5: Seed de prompts — executar para ativar v5.1.0 (AC: #10)
  - [x] Confirmar que o seed script em `ressoa-backend/prisma/seed.ts` usa `upsert` baseado em `{ nome, versao }` — comportamento idempotente
  - [x] Verificar que o seed faz `update` no `prompt-relatorio-v5.0.0` (ativo → false) ao re-executar
  - [x] Instrução para o dev: executar `npx ts-node prisma/seed.ts` após a migration para ativar v5.1.0

- [x] Task 6: Testes unitários em `analise.service.spec.ts` (AC: #9)
  - [x] Adicionar `import { z } from 'zod'` se não existir (verificar se já usado nos testes)
  - [x] Adicionar suite `describe('extractAderenciaJson — Story 16.4')` com os seguintes testes:
    - [x] `'extrai e valida aderencia_json quando bloco está presente e descricao_aula existe'`
      - Input: relatorio com bloco ```aderencia_json\n{...}\n```
      - Mock: `contexto.descricao_aula = 'Trabalhar frações'`
      - Assert: `aderenciaJson.faixa_aderencia === 'ALTA'`, `relatorioLimpo` não contém o bloco
    - [x] `'retorna null quando bloco está ausente no output (degradação graciosa)'`
      - Input: relatorio SEM bloco aderencia_json, descricao_aula presente
      - Assert: `aderenciaJson === null`, `relatorioLimpo === relatorioOutput`
    - [x] `'retorna null quando JSON do bloco é inválido (campo obrigatório ausente)'`
      - Input: bloco com JSON inválido (`{ "faixa_aderencia": "ALTA" }` sem outros campos)
      - Assert: `aderenciaJson === null` (zod valida e retorna null via catch)
    - [x] `'retorna null quando descricao_aula é null (sem aderência esperada)'`
      - Input: relatorio (pode ou não ter bloco), descricao_aula = null
      - Assert: `aderenciaJson === null`, `relatorioLimpo === relatorioOutput` (sem alteração)
    - [x] `'remove bloco aderencia_json do relatorio_limpo preservando restante do markdown'`
      - Input: relatorio com texto antes e depois do bloco JSON
      - Assert: texto do relatório preservado, apenas o bloco removido
  - [x] Adicionar teste de integração do pipeline: `'analisarAula persiste aderencia_objetivo_json quando descricao_aula existe'`
    - Mock `mockAulaCompleta.descricao = 'Trabalhar frações'`
    - Mock llmRouter para Prompt 3 retornar markdown com bloco aderencia_json válido
    - Assert: `tx.analise.create` chamado com `aderencia_objetivo_json` não-null
  - [x] Adicionar teste de integração do pipeline: `'analisarAula salva aderencia_objetivo_json como null quando descricao_aula é null'`
    - Mock `mockAulaCompleta.descricao = null` (default no mock base)
    - Assert: `tx.analise.create` chamado com `aderencia_objetivo_json: null`

## Dev Notes

### Posição no Epic 16

Story 16.4 — depende de:
- **Story 16.1** (done): `descricao String? @db.Text` em `Planejamento`
- **Story 16.2** (done): `descricao String? @db.Text` em `Aula`, status `RASCUNHO`
- **Story 16.3** (done): Pipeline v5.0.0 com `descricao_planejamento` / `descricao_aula` no contexto, 5 prompts v5.0.0 ativos

Esta story **bloqueia Story 16.5** (Frontend — AderenciaObjetivoCard) e **16.6** (E2E).

### Schema Change — Localização Exata

No `ressoa-backend/prisma/schema.prisma`, model `Analise` (linha ~435):

```prisma
model Analise {
  // ... campos existentes ...
  alertas_json             Json // Prompt 5: [ { tipo, nivel, mensagem, ... } ]
  // ADICIONAR AQUI:
  aderencia_objetivo_json  Json? // STORY 16.4: Prompt 3 v5.1.0 — null se sem descricao_aula ou parse falhou

  // Status tracking (Story 6.2)
  status StatusAnalise @default(AGUARDANDO_REVISAO)
  // ...
}
```

### Decisão Técnica: Apenas prompt-relatorio muda (v5.1.0)

- Somente o **Prompt 3 (relatorio)** precisa ser versionado para v5.1.0 — é o único que gera o bloco aderencia_json
- Os outros 4 prompts permanecem em v5.0.0 ativos (sem alteração)
- Isso evita versionamento desnecessário e minimiza risco de regressão

### Estratégia de Extração do Bloco aderencia_json

O LLM retorna o relatório em markdown com o bloco JSON ao final:

```
## Resumo Executivo
...conteúdo do relatório...

### 6. Observações Finais
Excelente aula com foco claro no objetivo proposto.

```aderencia_json
{
  "faixa_aderencia": "ALTA",
  "descricao_faixa": "Entre 70% e 90% do objetivo declarado foi trabalhado",
  "analise_qualitativa": "O professor planejou trabalhar frações com material concreto...",
  "pontos_atingidos": ["Uso de exemplos visuais", "Vocabulário técnico adequado"],
  "pontos_nao_atingidos": ["Atividade em grupos não realizada"],
  "recomendacao": "Retomar a atividade em grupos na próxima aula."
}
```
```

A regex de extração: `` /```aderencia_json\n([\s\S]*?)\n```/ ``

A remoção do bloco para `relatorio_texto` limpo: `.replace(/\n```aderencia_json\n[\s\S]*?\n```/, '').trim()`

### Degradação Graciosa — Tabela de Cenários

| Cenário | Comportamento | Campo salvo |
|---------|--------------|-------------|
| `descricao_aula` é null | Sem instrução no prompt, sem extração | `null` |
| `descricao_aula` existe, bloco presente, JSON válido | Extrai + valida + salva | `{ faixa_aderencia, ... }` |
| `descricao_aula` existe, bloco presente, JSON inválido | Log warn + fallback | `null` |
| `descricao_aula` existe, bloco ausente (LLM não gerou) | Log warn + fallback | `null` |
| Exceção no pipeline após Prompt 3 | Erro normal propagado | Transaction rollback |

**CRÍTICO:** A extração de aderencia_json NUNCA lança exceção — é best-effort. O pipeline de análise não deve falhar por causa de aderência.

### Validação Zod do Schema de Aderência

```typescript
const AderenciaObjetivoSchema = z.object({
  faixa_aderencia: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'TOTAL']),
  descricao_faixa: z.string().min(1),
  analise_qualitativa: z.string().min(1),
  pontos_atingidos: z.array(z.string()),
  pontos_nao_atingidos: z.array(z.string()),
  recomendacao: z.string().min(1),
});
```

- `z` já é dependência do projeto (verificar `package.json` — se não existir, instalar com `npm install zod`)
- **Verificar antes**: executar `grep -r "from 'zod'" ressoa-backend/src` para confirmar uso existente

### API Response — `findByAulaId`

O método `findByAulaId` em `analise.service.ts` usa `prisma.analise.findFirst` **sem** `select` (usa `include` apenas para relations). Portanto, `aderencia_objetivo_json` será retornado automaticamente pelo Prisma Client após `npx prisma generate`. **Nenhuma alteração no método `findByAulaId` é necessária**.

O frontend (Story 16.5) consumirá o campo `aderencia_objetivo_json` que estará disponível no response de `GET /aulas/:id/analise`.

### prompt-relatorio-v5.1.0.json — Estrutura do Conteúdo do Prompt

O bloco de instrução de aderência deve ser inserido **dentro da seção `## Formato de Saída`**, substituindo a linha `**Retorne APENAS o relatório em markdown** (não JSON).` pela instrução condicional.

**ATENÇÃO AO ESCAPING JSON:** O arquivo seed é JSON, então o `conteudo` é uma string. As aspas duplas internas devem ser escapadas como `\"`. Barras invertidas `\n` e `\t` são literais na string JSON. Testar o arquivo com `JSON.parse()` antes de commitar.

Estrutura de exemplo do campo `conteudo` no JSON do seed:
```json
{
  "conteudo": "...texto do prompt...\n\n{{#if descricao_aula}}\n...instrução aderência...\n```aderencia_json\n{\\n  \\\"faixa_aderencia\\\": ...\n}\n```\n{{else}}\n**Retorne APENAS o relatório em markdown** (não JSON).\n{{/if}}"
}
```

**IMPORTANTE:** O delimitador do bloco no prompt é literalmente `` ```aderencia_json `` (três backticks + `aderencia_json`). Na string JSON, backticks não precisam de escape — apenas aspas duplas e barras.

### Padrão de Testes Existente

- Ver `analise.service.spec.ts` para o padrão de mock do `prisma.$transaction`
- Os mocks usam `jest.fn()` e `mockResolvedValue()`
- Para testar `extractAderenciaJson` isoladamente, pode chamar `service['extractAderenciaJson'](...)` (acesso a método privado via bracket notation em TypeScript — padrão aceito em testes Jest)

### Project Structure Notes

**Backend — arquivos a criar:**
- `ressoa-backend/prisma/migrations/YYYYMMDD_HHMMSS_add_aderencia_objetivo_json_to_analise/migration.sql` (gerado pelo `prisma migrate dev`)
- `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v5.1.0.json` (NOVO)

**Backend — arquivos a modificar:**
- `ressoa-backend/prisma/schema.prisma` — adicionar `aderencia_objetivo_json Json?` ao model `Analise`
- `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v5.0.0.json` — `ativo: false`
- `ressoa-backend/src/modules/analise/services/analise.service.ts` — método `extractAderenciaJson` + mudança em `analisarAula` + import zod
- `ressoa-backend/src/modules/analise/services/analise.service.spec.ts` — novos testes unitários

**Nenhuma mudança de frontend nesta story** — o campo será retornado pelo backend e consumido na Story 16.5.

### Referências Técnicas

- [Source: _bmad-output/implementation-artifacts/epics/epic-16-contexto-planejamento-aula-aderencia.md#US-020.4] — Requisitos completos da story
- [Source: _bmad-output/implementation-artifacts/epics/epic-16-contexto-planejamento-aula-aderencia.md#DT-5] — DT-5: Aderência como JSON com range + texto
- [Source: _bmad-output/implementation-artifacts/epics/epic-16-contexto-planejamento-aula-aderencia.md#DT-6] — DT-6: Aderência no prompt-relatorio (Prompt 3), não em prompt separado
- [Source: ressoa-backend/src/modules/analise/services/analise.service.ts#analisarAula] — Pipeline atual, linhas 133-407
- [Source: ressoa-backend/src/modules/analise/services/analise.service.ts#parseMarkdownJSON] — Método existente reutilizável para parse de JSON com markdown
- [Source: ressoa-backend/prisma/schema.prisma#Analise] — Model Analise, linha 435 — sem `aderencia_objetivo_json` ainda
- [Source: ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v5.0.0.json] — Base para v5.1.0
- [Source: _bmad-output/implementation-artifacts/16-3-passar-descricoes-contexto-prompts-v5.md#DevNotes] — Padrão de seed, Handlebars, retrocompatibilidade
- [Source: _bmad-output/planning-artifacts/architecture.md] — NestJS + Prisma + TypeScript strict

### Learnings das Stories Anteriores

- **16.3:** `parseMarkdownJSON()` já existe no service e trata output com ou sem code fences. Reutilizar para parsear o JSON extraído do bloco aderencia_json.
- **16.3:** Triple braces `{{{descricao_aula}}}` para evitar HTML encoding — manter no v5.1.0 nos blocos que referenciam o conteúdo das descrições.
- **16.2 code review:** `@IsNotEmpty()` em campos obrigatórios dos DTOs — não aplicável aqui (sem DTO novo).
- **5.4 (prompts 3-4):** O Prompt 3 é o único que retorna markdown (não JSON). A lógica em `executePrompt` faz `JSON.parse(result.texto)` e, se falhar, retorna texto puro. O bloco aderencia_json ficará embutido na string markdown — a extração deve ser feita APÓS receber o output do Prompt 3, antes de salvar.
- **Commit pattern:** `feat(story-16.4): <descrição>`
- **5.2 (orquestrador):** Padrão de `prisma.$transaction` — `aderencia_objetivo_json` deve ser adicionado dentro do `tx.analise.create({ data: { ... } })`.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

N/A — implementation straightforward, no debugging required.

### Completion Notes List

- Migration applied manually via `prisma db execute` + `prisma migrate resolve --applied` due to shadow DB divergence (pre-existing issue)
- `Prisma.DbNull` used for nullable JSON field when aderenciaJson is null (TypeScript type requirement)
- Pre-existing test `analise.controller.spec.ts` has 5 failures (DI issue unrelated to this story, pre-existing before Story 16.4)
- Updated `prompt-v5-descricoes.spec.ts` to reflect prompt-relatorio-v5.0.0 being inactive (superseded by v5.1.0)
- 96/96 analise.service.spec.ts tests passing; 136/136 total across modified test files
- **Code Review (2026-02-20):** 1 HIGH + 4 MEDIUM auto-fixed: (1) Prisma.DbNull assertion fortalecida no spec; (2) sprint-status.yaml adicionado ao File List; (3) 4 testes Handlebars de renderização v5.1.0 adicionados ao prompt-v5-descricoes.spec.ts; (4) regex de extração aderencia_json robustificada para \r\n e trailing whitespace; (5) migration.sql documentada com contexto de aplicação manual. Low issues deixados (log sem aulaId, parseMarkdownJSON no rawJson).

### File List

- `ressoa-backend/prisma/schema.prisma` — added `aderencia_objetivo_json Json?` to model Analise
- `ressoa-backend/prisma/migrations/20260220200000_add_aderencia_objetivo_json_to_analise/migration.sql` — NEW: adds nullable JSONB column
- `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v5.1.0.json` — NEW: v5.1.0 with aderencia_json instruction, max_tokens=5000
- `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v5.0.0.json` — changed ativo to false
- `ressoa-backend/src/modules/analise/services/analise.service.ts` — added AderenciaObjetivoSchema, extractAderenciaJson(), updated analisarAula()
- `ressoa-backend/src/modules/analise/services/analise.service.spec.ts` — updated v5.0.0 test, added Story 16.4 test suite (7 new tests)
- `ressoa-backend/src/modules/llm/prompts/prompt-v5-descricoes.spec.ts` — updated v5.0.0 ativo=true test to exclude prompt-relatorio
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — updated story 16-4 status to review
