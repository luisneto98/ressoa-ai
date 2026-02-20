# Story 16.3: Passar Descrições como Contexto para os Prompts v5.0.0

Status: done

## Story

Como sistema de análise,
quero receber as descrições de planejamento e aula como contexto adicional nos prompts,
para gerar análises alinhadas com a intenção pedagógica do professor.

## Acceptance Criteria

1. `analise.service.ts` busca `Planejamento.descricao` e `Aula.descricao` ao montar o contexto (na query `analisarAula`)
2. As variáveis `descricao_planejamento` e `descricao_aula` são adicionadas ao objeto `contexto` antes de executar os 5 prompts
3. Todos os 5 prompts v5.0.0 criados com seção condicional `{{#if descricao_planejamento}}` / `{{#if descricao_aula}}` inserida após o contexto da turma/currículo
4. Seed atualizado: v5.0.0 `ativo: true`, v4.0.0 `ativo: false` para todos os 5 prompts
5. Análise sem descrições funciona identicamente ao v4 (retrocompatibilidade total — campo `descricao` é `null` por padrão)
6. Análise com `descricao_aula` gera relatórios com referências ao objetivo declarado pelo professor
7. Análise com `descricao_planejamento` gera análises que consideram metodologias planejadas para o bimestre
8. Prompt de Alertas v5.0.0 gera alerta do tipo `DESVIO_OBJETIVO` quando `descricao_aula` existe e a cobertura foi baixa ou a aula desviou significativamente
9. Prompt de Exercícios v5.0.0 prioriza exercícios alinhados ao `descricao_aula` quando presente
10. Testes unitários para montagem do contexto com/sem descrições em `analise.service.spec.ts`
11. Testes de template rendering validam que seções condicionais são renderizadas quando descrições existem e omitidas quando não existem

## Tasks / Subtasks

- [x] Task 1: Backend — Expandir query `analisarAula` para buscar descrições (AC: #1, #2)
  - [x] Em `analise.service.ts`, método `analisarAula`: na query `prisma.aula.findUnique`, adicionar `descricao: true` ao select de `aula` (já está no include, verificar se campo descricao é retornado)
  - [x] Na query `planejamento`, adicionar `descricao: true` ao include (o `planejamento` é incluído via `include.planejamento`, que atualmente só inclui `habilidades` e `objetivos`)
  - [x] Após construir o objeto `contexto` (linha ~196 do service), adicionar:
    ```typescript
    // STORY 16.3: Descrições para contexto nos prompts v5.0.0
    descricao_planejamento: aula.planejamento?.descricao ?? null,
    descricao_aula: aula.descricao ?? null,
    ```
  - [x] Atualizar o JSDoc do método `analisarAula` para mencionar Story 16.3 e os novos campos de contexto
  - [x] Executar `npx prisma generate` se necessário (schema já tem os campos — não requer migration nesta story)

- [x] Task 2: Criar `prompt-cobertura-v5.0.0.json` (AC: #3, #4, #5, #6)
  - [x] Copiar conteúdo de `prompt-cobertura-v4.0.0.json` como base
  - [x] Alterar `"versao": "v5.0.0"` e `"ativo": true`
  - [x] Adicionar campos ao `variaveis`: `"descricao_planejamento": "string | null"`, `"descricao_aula": "string | null"`
  - [x] Inserir bloco condicional no `conteudo` APÓS a seção `# CONTEXTO DA TURMA` e ANTES de `# FORMATO DA TRANSCRIÇÃO`:
    ```handlebars
    {{#if descricao_planejamento}}
    ### Contexto do Planejamento Bimestral (declarado pelo professor)
    O professor descreveu o seguinte sobre seu planejamento para o bimestre:
    "{{{descricao_planejamento}}}"

    Use este contexto para entender as metodologias e ênfases planejadas ao classificar evidências.
    {{/if}}

    {{#if descricao_aula}}
    ### Objetivo Específico desta Aula (declarado pelo professor)
    O professor declarou o seguinte objetivo para esta aula:
    "{{{descricao_aula}}}"

    Ao identificar evidências, avalie também o alinhamento com este objetivo declarado.
    {{/if}}
    ```
  - [x] Salvar em `ressoa-backend/prisma/seeds/prompts/prompt-cobertura-v5.0.0.json`

- [x] Task 3: Criar `prompt-qualitativa-v5.0.0.json` (AC: #3, #4, #5, #7)
  - [x] Copiar conteúdo de `prompt-qualitativa-v4.0.0.json` como base
  - [x] Alterar `"versao": "v5.0.0"` e `"ativo": true`
  - [x] Adicionar campos ao `variaveis`: `"descricao_planejamento": "string | null"`, `"descricao_aula": "string | null"`
  - [x] Inserir bloco condicional no `conteudo` APÓS o `# CONTEXTO` inicial e ANTES de `# ANÁLISE DE COBERTURA`:
    ```handlebars
    {{#if descricao_planejamento}}
    ### Contexto do Planejamento Bimestral (declarado pelo professor)
    O professor descreveu o seguinte sobre seu planejamento para o bimestre:
    "{{{descricao_planejamento}}}"

    Use este contexto para avaliar se as metodologias planejadas foram de fato aplicadas.
    {{/if}}

    {{#if descricao_aula}}
    ### Objetivo Específico desta Aula (declarado pelo professor)
    O professor declarou o seguinte objetivo para esta aula:
    "{{{descricao_aula}}}"

    Avalie a qualidade didática também sob a ótica deste objetivo declarado.
    {{/if}}
    ```
  - [x] Salvar em `ressoa-backend/prisma/seeds/prompts/prompt-qualitativa-v5.0.0.json`

- [x] Task 4: Criar `prompt-relatorio-v5.0.0.json` (AC: #3, #4, #5, #6, #7)
  - [x] Copiar conteúdo de `prompt-relatorio-v4.0.0.json` como base
  - [x] Alterar `"versao": "v5.0.0"` e `"ativo": true`
  - [x] Adicionar campos ao `variaveis`: `"descricao_planejamento": "string | null"`, `"descricao_aula": "string | null"`
  - [x] Inserir bloco condicional no `conteudo` APÓS o `# CONTEXTO` inicial e ANTES de `# DADOS DE ANÁLISE`:
    ```handlebars
    {{#if descricao_planejamento}}
    ### Contexto do Planejamento Bimestral (declarado pelo professor)
    O professor descreveu o seguinte sobre seu planejamento para o bimestre:
    "{{{descricao_planejamento}}}"
    {{/if}}

    {{#if descricao_aula}}
    ### Objetivo Específico desta Aula (declarado pelo professor)
    O professor declarou o seguinte objetivo para esta aula:
    "{{{descricao_aula}}}"

    O relatório deve referenciar este objetivo para contextualizar as observações.
    {{/if}}
    ```
  - [x] Salvar em `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v5.0.0.json`

- [x] Task 5: Criar `prompt-exercicios-v5.0.0.json` (AC: #3, #4, #5, #9)
  - [x] Copiar conteúdo de `prompt-exercicios-v4.0.0.json` como base
  - [x] Alterar `"versao": "v5.0.0"` e `"ativo": true`
  - [x] Adicionar campos ao `variaveis`: `"descricao_planejamento": "string | null"`, `"descricao_aula": "string | null"`
  - [x] Inserir bloco condicional no `conteudo` APÓS o `# CONTEXTO` inicial e ANTES de `# DADOS DE ANÁLISE`:
    ```handlebars
    {{#if descricao_aula}}
    ### Objetivo Específico desta Aula (declarado pelo professor)
    O professor declarou o seguinte objetivo para esta aula:
    "{{{descricao_aula}}}"

    Priorize exercícios que reforcem especificamente o objetivo declarado pelo professor.
    {{/if}}
    ```
  - [x] Salvar em `ressoa-backend/prisma/seeds/prompts/prompt-exercicios-v5.0.0.json`

- [x] Task 6: Criar `prompt-alertas-v5.0.0.json` (AC: #3, #4, #5, #8)
  - [x] Copiar conteúdo de `prompt-alertas-v4.0.0.json` como base
  - [x] Alterar `"versao": "v5.0.0"` e `"ativo": true`
  - [x] Adicionar campos ao `variaveis`: `"descricao_planejamento": "string | null"`, `"descricao_aula": "string | null"`
  - [x] Inserir bloco condicional no `conteudo` APÓS o `# CONTEXTO` inicial e ANTES de `# DADOS DE ANÁLISE`:
    ```handlebars
    {{#if descricao_planejamento}}
    ### Contexto do Planejamento Bimestral
    "{{{descricao_planejamento}}}"
    {{/if}}

    {{#if descricao_aula}}
    ### Objetivo Específico desta Aula
    "{{{descricao_aula}}}"
    {{/if}}
    ```
  - [x] Adicionar novo tipo de alerta `DESVIO_OBJETIVO` na seção "Tipos de Alertas" (seção 1, alertas de cobertura):
    ```
    - **DESVIO_OBJETIVO:** (somente se descricao_aula existe) A aula desviou significativamente do objetivo declarado pelo professor — elementos centrais do objetivo não foram trabalhados na transcrição. Inclua citação do objetivo e evidências do desvio.
      - Severidade: IMPORTANTE
    ```
  - [x] Salvar em `ressoa-backend/prisma/seeds/prompts/prompt-alertas-v5.0.0.json`

- [x] Task 7: Atualizar v4.0.0 de todos os prompts para `ativo: false` (AC: #4)
  - [x] Editar `prompt-cobertura-v4.0.0.json`: alterar `"ativo": true` para `"ativo": false`
  - [x] Editar `prompt-qualitativa-v4.0.0.json`: alterar `"ativo": true` para `"ativo": false`
  - [x] Editar `prompt-relatorio-v4.0.0.json`: alterar `"ativo": true` para `"ativo": false`
  - [x] Editar `prompt-exercicios-v4.0.0.json`: alterar `"ativo": true` para `"ativo": false`
  - [x] Editar `prompt-alertas-v4.0.0.json`: alterar `"ativo": true` para `"ativo": false`
  - [x] Verificar que o seed script (`prisma/seed.ts`) usa `upsert` baseado em `nome + versao` — o processo de seed desativará v4 e ativará v5 automaticamente

- [x] Task 8: Testes unitários para contexto com/sem descrições (AC: #10)
  - [x] Em `analise.service.spec.ts`, adicionar suite `describe('Contexto com descrições v5.0.0')`:
    - [x] Teste: `contexto inclui descricao_aula quando aula.descricao existe` — mock `aula.descricao = 'Trabalhar frações...'`, verificar `contexto.descricao_aula === 'Trabalhar frações...'`
    - [x] Teste: `contexto inclui descricao_planejamento quando planejamento.descricao existe` — mock `planejamento.descricao = 'Ênfase em material concreto...'`, verificar `contexto.descricao_planejamento === 'Ênfase em material concreto...'`
    - [x] Teste: `contexto tem descricao_aula = null quando aula.descricao é null` — mock `aula.descricao = null`, verificar `contexto.descricao_aula === null`
    - [x] Teste: `contexto tem descricao_planejamento = null quando planejamento.descricao é null` — mock `planejamento.descricao = null`, verificar `contexto.descricao_planejamento === null`
    - [x] Teste: `pipeline v5 executa sem erro quando ambas descrições são null` — garantir retrocompatibilidade

- [x] Task 9: Testes de template rendering para seções condicionais (AC: #11)
  - [x] Em `src/modules/llm/prompts/prompt-cobertura.spec.ts` (ou criar arquivo de spec para prompts v5):
    - [x] Teste: `prompt-cobertura-v5.0.0 renderiza bloco descricao_aula quando variável existe`
    - [x] Teste: `prompt-cobertura-v5.0.0 omite bloco descricao_aula quando variável é null/undefined`
    - [x] Teste: `prompt-cobertura-v5.0.0 renderiza bloco descricao_planejamento quando variável existe`
  - [x] Verificar padrão de testes de prompts existente (e.g., `prompt-cobertura.spec.ts` na pasta `llm/prompts/`) para replicar o padrão correto
  - [x] Usar `PromptService.renderPrompt()` com mock de `Prompt` entity como nos testes existentes

## Dev Notes

### Posição no Epic 16

Esta é a Story 16.3 — depende de:
- **Story 16.1** (done): Campo `descricao` em `Planejamento` — `schema.prisma` já tem `descricao String? @db.Text` no model `Planejamento`
- **Story 16.2** (done): Campo `descricao` em `Aula` e status `RASCUNHO` — `schema.prisma` já tem `descricao String? @db.Text` no model `Aula`

**Esta story NÃO requer migration de banco de dados** — os campos `descricao` em `Aula` e `Planejamento` já existem no schema (Stories 16.1 e 16.2). Esta story é puramente:
1. Mudança no `analise.service.ts` para incluir os campos no contexto
2. Criação dos 5 novos arquivos de prompt v5.0.0
3. Desativação dos v4.0.0

Bloqueia Stories 16.4 (Análise de Aderência — usa o campo `aderencia_objetivo_json`) e 16.5 (Frontend).

### Decisão Técnica Crítica: NÃO Criar Novo Campo `aderencia_objetivo_json` Aqui

**ATENÇÃO:** Segundo o Epic 16, a análise de aderência ao objetivo (`aderencia_objetivo_json`) é implementada na **Story 16.4**, não nesta. Esta story (16.3) apenas:
- Passa `descricao_planejamento` e `descricao_aula` como variáveis de contexto para os 5 prompts
- Cria os 5 prompts v5.0.0 com as seções condicionais
- NÃO modifica o schema Prisma (nenhuma migration necessária)
- NÃO implementa o parse de bloco `aderencia_json` (fica para 16.4)

O Prompt 3 (relatorio) v5.0.0 **não precisa** incluir as instruções de geração do JSON de aderência — isso é responsabilidade da Story 16.4 que criará o `prompt-relatorio-v5.1.0` ou ajustará conforme necessário.

### Mudança Exata em `analise.service.ts`

**Localização:** Método `analisarAula`, na seção "1. Buscar dados necessários" (linhas ~157-181)

**Mudança 1:** Adicionar `descricao: true` no select do planejamento incluído:
```typescript
// ANTES (linha ~165):
planejamento: {
  include: {
    habilidades: { include: { habilidade: true } },
    objetivos: { include: { objetivo: true } },
  },
},

// DEPOIS:
planejamento: {
  include: {
    habilidades: { include: { habilidade: true } },
    objetivos: { include: { objetivo: true } },
  },
},
// Nota: `descricao` já está disponível via `aula.planejamento.descricao`
// pois `planejamento` é incluído completo (não select parcial)
```

**Verificação importante:** O `include.planejamento` atual usa `include` (não `select`), então `descricao` já está sendo retornado pelo Prisma — apenas não estava sendo adicionado ao `contexto`. Confirmar isso antes de fazer mudança desnecessária.

**Mudança 2:** No objeto `contexto` (após linha ~257), adicionar os dois campos:
```typescript
const contexto: any = {
  transcricao: aula.transcricao.texto,
  turma: { ... },
  // ... campos existentes ...
  ...(aula.transcricao.metadata_json && (() => { ... })()),

  // STORY 16.3: Descrições para contextualização dos prompts v5.0.0
  // DT-1: campos opcionais — null quando professor não preencheu
  descricao_planejamento: aula.planejamento?.descricao ?? null,
  descricao_aula: aula.descricao ?? null,
};
```

### Estrutura dos Arquivos de Prompt v5.0.0

Os 5 prompts v5.0.0 são criados como NOVOS arquivos JSON em:
```
ressoa-backend/prisma/seeds/prompts/
  prompt-cobertura-v5.0.0.json       ← NOVO
  prompt-qualitativa-v5.0.0.json     ← NOVO
  prompt-relatorio-v5.0.0.json       ← NOVO
  prompt-exercicios-v5.0.0.json      ← NOVO
  prompt-alertas-v5.0.0.json         ← NOVO
  prompt-cobertura-v4.0.0.json       ← MODIFICAR: ativo → false
  prompt-qualitativa-v4.0.0.json     ← MODIFICAR: ativo → false
  prompt-relatorio-v4.0.0.json       ← MODIFICAR: ativo → false
  prompt-exercicios-v4.0.0.json      ← MODIFICAR: ativo → false
  prompt-alertas-v4.0.0.json         ← MODIFICAR: ativo → false
```

**Estrutura base de cada arquivo v5.0.0:**
```json
{
  "nome": "prompt-cobertura",        // MESMO nome (único por versão)
  "versao": "v5.0.0",                // NOVO
  "modelo_sugerido": "CLAUDE_SONNET", // Mantém do v4
  "ativo": true,                     // Ativar v5
  "ab_testing": false,
  "variaveis": {
    // Todos os campos do v4 +
    "descricao_planejamento": "string | null",
    "descricao_aula": "string | null"
  },
  "conteudo": "..."  // Conteúdo v4 + blocos condicionais
}
```

### Como o Seed Funciona (para confirmar idempotência)

O `prisma/seed.ts` função `seedPrompts()` (linha ~321) faz:
1. Lê todos os arquivos `.json` da pasta `seeds/prompts/`
2. Para cada arquivo, executa `upsert` baseado em `{ nome, versao }` — par único
3. Portanto:
   - Executar seed com v5.0.0 cria os novos registros no banco
   - Executar seed novamente é idempotente (upsert não duplica)
   - A desativação dos v4.0.0 (alterando `ativo: false` nos JSONs) também será aplicada no próximo seed

**Verificação:** Confirmar que o seed script usa upsert com `where: { nome_versao: { nome, versao } }` ou similar. Verificar o campo de unique constraint no schema `Prompt`:

```prisma
// Verificar no schema.prisma:
model Prompt {
  id      String @id
  nome    String
  versao  String
  ativo   Boolean
  // ...
  @@unique([nome, versao])  // ← confirmar que este index existe
}
```

### Handlebars Template Engine — Sintaxe Correta

Os prompts usam **Handlebars** como template engine (via `PromptService.renderPrompt`). Regras para v5.0.0:

```handlebars
{{!-- Condicional simples --}}
{{#if descricao_aula}}
  ... conteúdo quando existe ...
{{/if}}

{{!-- Triple braces para evitar HTML escaping em strings de texto livre --}}
"{{{descricao_aula}}}"

{{!-- Condicional com eq helper (já usado em v4) --}}
{{#if (eq curriculo_tipo 'BNCC')}}
  ...
{{/if}}
```

**ATENÇÃO:** Usar `{{{triple braces}}}` para exibir o conteúdo das descrições — evita que HTML encoding corrompa o texto livre do professor (que pode conter aspas, apóstrofes, etc.).

### Retrocompatibilidade Garantida

| Cenário | Comportamento v5 | Expectativa |
|---------|-----------------|-------------|
| Aula sem `descricao` (null) | `descricao_aula = null` → bloco `{{#if descricao_aula}}` não renderiza | Análise idêntica ao v4 |
| Planejamento sem `descricao` (null) | `descricao_planejamento = null` → bloco não renderiza | Análise idêntica ao v4 |
| Aula sem planejamento vinculado | `aula.planejamento = null` → `descricao_planejamento = null` | Sem erro |
| Ambas descrições presentes | Ambos blocos renderizados → contexto enriquecido | Análise contextualizada |

Todos os registros existentes no banco têm `descricao = null` em `Aula` e `Planejamento` (campos nullable adicionados em 16.1 e 16.2) — retrocompatibilidade total.

### Alerta `DESVIO_OBJETIVO` — Especificação

O novo tipo de alerta a ser adicionado ao Prompt 5 v5.0.0:

```json
{
  "tipo": "DESVIO_OBJETIVO",
  "severidade": "IMPORTANTE",
  "titulo": "Desvio do Objetivo Declarado",
  "descricao": "O professor declarou o objetivo: \"[objetivo declarado]\". A análise indica que [X]% dos elementos descritos foram trabalhados, sugerindo desvio significativo da intenção original.",
  "dados_suporte": {
    "objetivo_declarado": "texto do objetivo",
    "elementos_nao_cobertos": ["elemento 1", "elemento 2"]
  },
  "recomendacao": "Considere retomar na próxima aula os elementos planejados que não foram abordados: [lista]."
}
```

**Regra de disparo:** Somente quando `descricao_aula` existe E a análise indica cobertura baixa ou desvio claro em relação ao objetivo. Se `descricao_aula` for null, o alerta `DESVIO_OBJETIVO` nunca deve ser gerado.

### Padrão de Testes de Prompts Existente

Para replicar os testes de template rendering, verificar arquivos existentes:
```
ressoa-backend/src/modules/llm/prompts/
```

O padrão típico usa `PromptService.renderPrompt()` com um mock de `Prompt` entity:
```typescript
const mockPrompt = {
  id: 'test-id',
  nome: 'prompt-cobertura',
  versao: 'v5.0.0',
  conteudo: readFileSync(join(__dirname, '../../../prisma/seeds/prompts/prompt-cobertura-v5.0.0.json'), 'utf-8')
    |> JSON.parse
    |> (p => p.conteudo),
  // ...
};
```

Verificar como os testes existentes de prompts carregam o template antes de criar os novos.

### Project Structure Notes

**Backend — arquivos a criar:**
- `ressoa-backend/prisma/seeds/prompts/prompt-cobertura-v5.0.0.json` (NOVO)
- `ressoa-backend/prisma/seeds/prompts/prompt-qualitativa-v5.0.0.json` (NOVO)
- `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v5.0.0.json` (NOVO)
- `ressoa-backend/prisma/seeds/prompts/prompt-exercicios-v5.0.0.json` (NOVO)
- `ressoa-backend/prisma/seeds/prompts/prompt-alertas-v5.0.0.json` (NOVO)

**Backend — arquivos a modificar:**
- `ressoa-backend/src/modules/analise/services/analise.service.ts` — adicionar `descricao_planejamento` e `descricao_aula` ao contexto
- `ressoa-backend/src/modules/analise/services/analise.service.spec.ts` — novos testes unitários
- `ressoa-backend/prisma/seeds/prompts/prompt-cobertura-v4.0.0.json` — `ativo: false`
- `ressoa-backend/prisma/seeds/prompts/prompt-qualitativa-v4.0.0.json` — `ativo: false`
- `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v4.0.0.json` — `ativo: false`
- `ressoa-backend/prisma/seeds/prompts/prompt-exercicios-v4.0.0.json` — `ativo: false`
- `ressoa-backend/prisma/seeds/prompts/prompt-alertas-v4.0.0.json` — `ativo: false`

**Nenhuma mudança de frontend nesta story** — o frontend já exibe o `relatorio_texto` como markdown. A renderização do novo campo `aderencia_objetivo` fica para Story 16.5.

**Nenhuma migration de banco necessária** — os campos `descricao` já existem em `Aula` (Story 16.2) e `Planejamento` (Story 16.1). O campo `aderencia_objetivo_json` em `Analise` fica para Story 16.4.

### Verificação de `planejamento.descricao` na Query Atual

**Verificação crítica antes de implementar Task 1:**

O `include.planejamento` em `analisarAula` usa `include` (não `select`), o que significa que todos os campos escalares do model `Planejamento` já são retornados automaticamente, incluindo `descricao`. **Confirmar isso lendo o código atual.**

Se a query usar `select` (subcampos explícitos), adicionar `descricao: true` explicitamente. Se usar `include` (sem select), o campo já chega — apenas precisa ser lido de `aula.planejamento?.descricao`.

### Checklist de Validação de Handlebars

Ao criar os 5 prompts v5.0.0, verificar:
1. Todos os `{{#if ...}}` têm correspondente `{{/if}}`
2. Conteúdo de descrições usa `{{{triple braces}}}` (não `{{double}}`)
3. Blocos condicionais não quebram a estrutura do JSON (o `conteudo` é uma string JSON — aspas internas devem ser escapadas com `\"`)
4. Testar localmente com `PromptService.renderPrompt()` ou script de dry-run antes de commit

### Referências Técnicas

- [Source: _bmad-output/implementation-artifacts/epics/epic-16-contexto-planejamento-aula-aderencia.md#US-020.3] — Requisitos completos da story
- [Source: _bmad-output/implementation-artifacts/epics/epic-16-contexto-planejamento-aula-aderencia.md#Decisoes-Tecnicas] — DT-6 (aderência no prompt-relatorio), DT-7 (versão v5.0.0), DT-1 (campos opcionais)
- [Source: ressoa-backend/src/modules/analise/services/analise.service.ts] — Pipeline atual (analisarAula, método executePrompt, construção do contexto)
- [Source: ressoa-backend/prisma/seeds/prompts/prompt-cobertura-v4.0.0.json] — Base para v5.0.0
- [Source: ressoa-backend/prisma/seeds/prompts/prompt-qualitativa-v4.0.0.json] — Base para v5.0.0
- [Source: ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v4.0.0.json] — Base para v5.0.0
- [Source: ressoa-backend/prisma/seeds/prompts/prompt-exercicios-v4.0.0.json] — Base para v5.0.0
- [Source: ressoa-backend/prisma/seeds/prompts/prompt-alertas-v4.0.0.json] — Base para v5.0.0
- [Source: ressoa-backend/prisma/schema.prisma#Analise] — Model Analise atual (sem aderencia_objetivo_json — vem na Story 16.4)
- [Source: ressoa-backend/prisma/schema.prisma#Aula] — Campo `descricao String? @db.Text` (Story 16.2)
- [Source: ressoa-backend/prisma/schema.prisma#Planejamento] — Campo `descricao String? @db.Text` (Story 16.1)
- [Source: ressoa-backend/prisma/seed.ts#seedPrompts] — Mecanismo de seed idempotente via upsert
- [Source: _bmad-output/implementation-artifacts/16-2-aula-rascunho-descricao-datas-futuras.md] — Learnings da story anterior (padrões de commit, DTOs, testes)
- [Source: _bmad-output/planning-artifacts/estrategia-prompts-ia-2026-02-08.md] — AI Prompt Strategy (MOAT), feedback loop, qualidade
- [Source: _bmad-output/planning-artifacts/architecture.md] — NestJS + Prisma + TypeScript strict, multi-tenancy, padrões

### Learnings das Stories Anteriores

- **16.1 e 16.2:** Sempre adicionar `@Transform(({ value }) => value === '' ? undefined : value)` em campos opcionais de DTOs. Não relevante aqui (sem DTOs novos), mas padrão a manter.
- **16.2:** `tipo_entrada` nullable causou impacto no `monitoramento-stt.service.ts`. Verificar se adicionar `descricao_aula` ao contexto causa impacto em algum worker existente (improvável — é campo de leitura).
- **15.6 (story de prompt):** Padrão de bump de versão: v3→v4 para adicionar suporte a SRT diarization. Agora v4→v5 para adicionar descrições. Manter `ab_testing: false` para versão inicial.
- **5.3 (criação original de prompts):** Arquivos de prompt JSON têm `conteudo` como string com `\n` para quebras de linha e `\"` para aspas — verificar escaping correto ao criar JSONs.
- **Commits:** Usar `feat(story-16.3): <descrição>` como padrão de commit message.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implementação completa em 9 tasks: analise.service.ts + 5 prompts v5.0.0 + 5 v4.0.0 desativados + testes
- `include.planejamento` já usa `include` (não `select`) — `descricao` disponível sem alterar a query; apenas adicionou ao objeto `contexto`
- `descricao_aula` e `descricao_planejamento` adicionados após o bloco de diarization (STORY 15.6) no contexto
- prompt-exercicios-v5.0.0 usa APENAS `{{#if descricao_aula}}` (sem bloco de planejamento) conforme AC9
- prompt-alertas-v5.0.0 inclui tipo `DESVIO_OBJETIVO` (severidade IMPORTANTE) na seção de alertas de cobertura conforme AC8
- Todos os `{{{triple braces}}}` usados para evitar HTML encoding nas strings livres do professor
- Retrocompatibilidade total: `null` → bloco Handlebars não renderiza → comportamento idêntico ao v4
- Fix aplicado em test de pipeline: `llmRouterService.generateWithFallback.mockClear()` necessário porque mock acumula chamadas de testes anteriores no mesmo describe block
- 126/126 testes passando nos arquivos da story; 7 falhas pré-existentes confirmadas via `git stash` (unrelated: analise.controller.spec.ts + 6 outros)
- Code Review (2026-02-20): 7 problemas encontrados e corrigidos — ver seção "Senior Developer Review (AI)"
- 128/128 testes passando após correções do code review (2 novos testes adicionados)

### File List

**Novos:**
- `ressoa-backend/prisma/seeds/prompts/prompt-cobertura-v5.0.0.json`
- `ressoa-backend/prisma/seeds/prompts/prompt-qualitativa-v5.0.0.json`
- `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v5.0.0.json`
- `ressoa-backend/prisma/seeds/prompts/prompt-exercicios-v5.0.0.json`
- `ressoa-backend/prisma/seeds/prompts/prompt-alertas-v5.0.0.json`
- `ressoa-backend/src/modules/llm/prompts/prompt-v5-descricoes.spec.ts`

**Modificados:**
- `ressoa-backend/src/modules/analise/services/analise.service.ts` — `descricao_planejamento` e `descricao_aula` adicionados ao contexto + JSDoc atualizado
- `ressoa-backend/src/modules/analise/services/analise.service.spec.ts` — 7 novos unit tests (Story 16.3) + assert v4.0.0 ativo=false + assert v5.0.0 ativo=true
- `ressoa-backend/prisma/seeds/prompts/prompt-cobertura-v4.0.0.json` — `ativo: false`
- `ressoa-backend/prisma/seeds/prompts/prompt-qualitativa-v4.0.0.json` — `ativo: false`
- `ressoa-backend/prisma/seeds/prompts/prompt-relatorio-v4.0.0.json` — `ativo: false`
- `ressoa-backend/prisma/seeds/prompts/prompt-exercicios-v4.0.0.json` — `ativo: false`
- `ressoa-backend/prisma/seeds/prompts/prompt-alertas-v4.0.0.json` — `ativo: false`
- `_bmad-output/implementation-artifacts/16-3-passar-descricoes-contexto-prompts-v5.md` — status review, tasks [x]
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 16-3 → review
- `ressoa-backend/src/modules/analise/services/analise.service.spec.ts` — Code Review: `descricao: null` + `objetivos: []` + `descricao: null` adicionados ao mock base
- `ressoa-backend/src/modules/llm/prompts/prompt-v5-descricoes.spec.ts` — Code Review: helpers `and`/`or` removidos + 2 testes null para qualitativa/alertas + verificação triple braces descricao_planejamento + título retrocompat corrigido

## Senior Developer Review (AI)

**Revisão realizada em:** 2026-02-20
**Revisor:** Senior Dev AI (claude-sonnet-4-6)
**Resultado:** APROVADO com correções aplicadas automaticamente

### Problemas Encontrados e Corrigidos (7 total)

#### ALTO (2 corrigidos)

**[HIGH-1] `mockAulaCompleta` sem campo `descricao` explícito**
- Arquivo: `analise.service.spec.ts`, objeto `mockAulaCompleta`
- Problema: O campo `descricao` (adicionado pela Story 16.2 ao modelo `Aula`) estava ausente do objeto mock base. Os testes de Story 16.3 que verificam `descricao: null` funcionavam por acidente — `undefined ?? null` retorna `null` em JavaScript. Mas a ausência do campo no mock tornava implícito algo que deveria ser documentado explicitamente.
- Correção: Adicionado `descricao: null` com comentário `// Story 16.2` ao `mockAulaCompleta`.

**[HIGH-2] `mockAulaCompleta.planejamento` sem campo `objetivos` explícito**
- Arquivo: `analise.service.spec.ts`, objeto `mockAulaCompleta.planejamento`
- Problema: O campo `objetivos: []` (necessário para `buildPlanejamentoContext` com currículos CUSTOM — Story 11.7) estava ausente do mock base. Para os testes BNCC da Story 16.3, `planejamento.objetivos?.length > 0` retorna `undefined > 0 = false`, então funciona, mas é comportamento não-intencional.
- Correção: Adicionado `descricao: null` (Story 16.1) e `objetivos: []` (Story 11.7) com comentários ao mock base.

#### MÉDIO (4 corrigidos)

**[MEDIUM-1] Helpers Handlebars `and`/`or` registrados mas nunca usados**
- Arquivo: `prompt-v5-descricoes.spec.ts`, linhas de registro de helpers
- Problema: Os helpers `and` e `or` foram registrados no setup do spec mas nenhum dos 5 prompts v5.0.0 utiliza esses helpers. Código morto que pode confundir futuros desenvolvedores sobre os helpers disponíveis.
- Correção: Removidos os registros de `and` e `or`; mantido apenas `eq` que é de fato utilizado.

**[MEDIUM-2] AC11 incompleto — sem teste de omissão null para `prompt-qualitativa`**
- Arquivo: `prompt-v5-descricoes.spec.ts`, describe block de qualitativa
- Problema: AC11 exige validar que seções condicionais são omitidas quando descrições não existem. O describe de `prompt-qualitativa` tinha testes de renderização positiva mas NENHUM teste verificando omissão quando ambas descrições são null.
- Correção: Adicionado teste `'deve omitir ambos os blocos quando descricao_planejamento e descricao_aula são null'`.

**[MEDIUM-3] AC11 incompleto — sem teste de omissão null para `prompt-alertas`**
- Arquivo: `prompt-v5-descricoes.spec.ts`, describe block de alertas
- Problema: O describe de `prompt-alertas` verificava que `DESVIO_OBJETIVO` é visível com null (texto estático) mas NÃO verificava explicitamente que os blocos condicionais `{{#if descricao_planejamento}}` e `{{#if descricao_aula}}` são omitidos quando null.
- Correção: Adicionado teste `'deve omitir blocos de contexto do professor quando ambas descrições são null (retrocompatibilidade)'`.

**[MEDIUM-4] Teste de triple braces verifica apenas `descricao_aula`, não `descricao_planejamento`**
- Arquivo: `prompt-v5-descricoes.spec.ts`, linha 99-107
- Problema: O teste `'deve usar triple braces {{{descricao_aula}}}'` verificava que todos os 5 prompts usam triple braces para `descricao_aula` mas não verificava `descricao_planejamento`, que também deve usar triple braces (exceto `prompt-exercicios` que não tem bloco de planejamento — AC9).
- Correção: Teste atualizado para também verificar `{{{descricao_planejamento}}}` em 4 dos 5 prompts (excluindo `prompt-exercicios` conforme AC9).

#### BAIXO (1 corrigido)

**[LOW-1] Título enganoso do teste de retrocompatibilidade**
- Arquivo: `prompt-v5-descricoes.spec.ts`, linha com `'deve renderizar identicamente ao v4'`
- Problema: O título afirmava renderização "idêntica ao v4" mas o teste só verificava ausência de novos blocos e presença de seções essenciais — não era uma comparação de output idêntico.
- Correção: Renomeado para `'deve preservar todas as seções essenciais do v4 quando ambas descrições são null (retrocompatibilidade)'`.

### Resultado Final
- 128/128 testes passando (2 novos testes adicionados pelo code review)
- Todos os 11 ACs verificados e implementados corretamente
- Código de produção (`analise.service.ts` + 5 prompts v5.0.0) estava correto — apenas melhorias em testes
