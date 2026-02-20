# EPIC 015: Contexto de Planejamento, Aula como Rascunho e Aderência ao Objetivo

**Projeto:** Ressoa AI (Professor Analytics)
**Data de Criacao:** 2026-02-20
**Versao:** 1.0
**Status:** Planejado
**Prioridade:** **P1 - ALTO VALOR**

---

## Visao Geral

**ID:** EPIC-015
**Titulo:** Descricao de Planejamento e Aula, Rascunho Antecipado e Analise de Aderencia ao Objetivo
**Responsavel:** Dev Team
**Estimativa:** 10-14 dias de desenvolvimento

### Problema a Resolver

Hoje o sistema coleta **o que** o professor planeja (habilidades/objetivos BNCC ou custom), mas nao captura **como** ele pretende trabalhar aquilo. O `Planejamento` lista habilidades sem espaco para o professor descrever metodologias, enfases ou estrategias. A `Aula` e criada apenas no momento do upload de audio, impedindo que o professor prepare suas aulas antecipadamente.

Consequencias diretas:

- **Relatorios genericos** — A IA analisa a aula sem saber o que o professor pretendia fazer, gerando feedbacks desconectados da intencao pedagogica
- **Impossibilidade de planejamento antecipado** — O professor nao consegue registrar todas as aulas do bimestre antes delas acontecerem
- **Sem metrica de aderencia** — O sistema nao avalia se o professor conseguiu executar o que planejou para aquela aula especifica
- **Perda de contexto valioso** — Metodologias planejadas, enfases desejadas e objetivos especificos nao alimentam o pipeline de IA

### Solucao Proposta

Tres capacidades interligadas:

1. **Campo `descricao` em Planejamento e Aula** — Texto livre para o professor contextualizar suas intencoes pedagogicas em ambos os niveis (bimestral e por aula)
2. **Aula como Rascunho** — Novo status `RASCUNHO` que permite criar aulas com datas futuras, adicionar descricao, e so depois incluir o audio para processamento
3. **Analise de Aderencia ao Objetivo** — Novo campo na analise que avalia qualitativamente e com ranges (faixas) o quanto o professor conseguiu alcancar o objetivo declarado

### Valor de Negocio

- **Relatorios mais assertivos** — Prompts recebem contexto sobre a intencao do professor, gerando analises personalizadas e actionable
- **Fluxo de trabalho real** — Professores planejam aulas no inicio do mes/bimestre, preenchem descricoes, e processam audios quando disponiveis
- **Metrica nova e valiosa** — Aderencia ao objetivo e um dado que nenhum concorrente oferece, reforça o MOAT
- **Reducao de rejeicao** — Relatorios alinhados com a intencao do professor aumentam taxa de aprovacao (meta >80%)
- **Suporte ao planejamento** — O sistema deixa de ser apenas "analisador de aula gravada" e passa a ser "parceiro de planejamento"

---

## Arquitetura e Decisoes Tecnicas

### Fluxo Atualizado

```
ANTES:
  Professor → Upload Audio → Cria Aula (CRIADA) → Transcreve → Analisa → Aprova

DEPOIS:
  Professor → Cria Aula RASCUNHO (data futura + descricao)
           → [...dias/semanas depois...]
           → Upload Audio → AGUARDANDO_TRANSCRICAO → Transcreve → Analisa → Aprova

  Diferença no Pipeline de Análise:
  ┌─────────────────────────────────────────────────────────┐
  │  Contexto Adicional para Prompts                        │
  │  ┌──────────────────────┐  ┌─────────────────────────┐  │
  │  │ descricao_planejamento│  │ descricao_aula          │  │
  │  │ (visao bimestral)    │  │ (intencao especifica)   │  │
  │  └──────────┬───────────┘  └──────────┬──────────────┘  │
  │             └──────────┬──────────────┘                  │
  │                        ▼                                 │
  │  5 Prompts Existentes (com contexto enriquecido)         │
  │                        +                                 │
  │  Novo campo: aderencia_objetivo (no prompt de relatorio) │
  └─────────────────────────────────────────────────────────┘
```

### Decisoes Tecnicas

| # | Decisao | Justificativa |
|---|---------|---------------|
| DT-1 | Campo `descricao` como `String? @db.Text` | Texto livre sem limite rigido, opcional para nao quebrar fluxo existente |
| DT-2 | Novo status `RASCUNHO` no enum `StatusProcessamento` | Estado antes de `CRIADA`, permite aula sem audio/transcricao |
| DT-3 | Remover validacao `@IsNotFutureDate()` do DTO | Permitir datas futuras para planejamento antecipado |
| DT-4 | `descricao` imutavel apos inicio do processamento | Garantir integridade — descricao nao muda depois que audio e enviado |
| DT-5 | Aderencia como JSON com range + texto | `aderencia_objetivo_json` na Analise: faixa (BAIXA/MEDIA/ALTA/TOTAL) + explicacao qualitativa |
| DT-6 | Aderencia gerada dentro do prompt de relatorio (Prompt 3) | Nao criar sexto prompt — e um contexto adicional, nao uma analise separada |
| DT-7 | Versao dos prompts: v5.0.0 | Bump major por mudanca de contrato (novo campo de saida + novo contexto de entrada) |
| DT-8 | Frontend: campo nao editavel apos status != RASCUNHO | Consistencia visual com a regra de imutabilidade |

### Impacto no Banco de Dados

```prisma
// Alteracoes no schema

model Planejamento {
  // ... campos existentes
  descricao     String?   @db.Text  // NOVO: contexto bimestral
}

model Aula {
  // ... campos existentes
  descricao     String?   @db.Text  // NOVO: objetivo/intencao da aula
}

enum StatusProcessamento {
  RASCUNHO                    // NOVO: aula planejada sem audio
  CRIADA
  UPLOAD_PROGRESSO
  AGUARDANDO_TRANSCRICAO
  TRANSCRITA
  ANALISANDO
  ANALISADA
  APROVADA
  REJEITADA
  ERRO
}

model Analise {
  // ... campos existentes
  aderencia_objetivo_json  Json?   // NOVO: resultado da analise de aderencia
}
```

### Estrutura do `aderencia_objetivo_json`

```json
{
  "faixa_aderencia": "ALTA",
  "descricao_faixa": "Entre 70% e 90% do objetivo declarado foi trabalhado",
  "analise_qualitativa": "O professor planejou trabalhar fracoes equivalentes com material concreto e exemplos visuais. A aula efetivamente utilizou exemplos visuais (pizza, barras de chocolate) e material concreto (reguas fracionarias). A parte pratica em grupos, mencionada no planejamento, foi substituida por exercicios individuais no quadro, o que reduziu levemente a aderencia.",
  "pontos_atingidos": [
    "Uso de exemplos visuais conforme planejado",
    "Vocabulario tecnico adequado ao ano",
    "Sequencia didatica coerente com o objetivo"
  ],
  "pontos_nao_atingidos": [
    "Atividade em grupos nao foi realizada",
    "Tempo para pratica individual menor que o previsto"
  ],
  "recomendacao": "Considere retomar a atividade em grupos na proxima aula para reforcar a aprendizagem colaborativa planejada."
}
```

**Faixas de aderencia:**

| Faixa | Significado | Criterio |
|-------|-------------|----------|
| `BAIXA` | Aula desviou significativamente do planejado | <30% dos elementos descritos foram trabalhados |
| `MEDIA` | Aula cobriu parcialmente o planejado | 30-70% dos elementos descritos foram trabalhados |
| `ALTA` | Aula seguiu majoritariamente o planejado | 70-90% dos elementos descritos foram trabalhados |
| `TOTAL` | Aula executou integralmente o planejado | >90% dos elementos descritos foram trabalhados |

> **Nota:** Ranges sao estimativas qualitativas da IA, nao percentuais exatos. A faixa e derivada da analise textual, nao de calculo numerico.

---

## User Stories

### US-020.1: Adicionar campo descricao ao Planejamento

**Como** professor,
**Quero** poder descrever as metodologias, enfases e estrategias que pretendo aplicar no bimestre,
**Para** que o sistema tenha contexto sobre meu planejamento ao analisar as aulas.

#### Implementacao Tecnica

**Backend:**
- Migration: adicionar `descricao String? @db.Text` em `Planejamento`
- `CreatePlanejamentoDto`: adicionar campo `descricao` (`@IsOptional() @IsString() @MaxLength(2000)`)
- `planejamento.service.ts`: persistir `descricao` no create e retornar no findOne/findAll
- Endpoint PATCH para atualizar descricao de planejamento existente

**Frontend:**
- Formulario de criacao de planejamento: adicionar `<Textarea>` com label "Descreva suas metodologias, enfases e estrategias para o bimestre (opcional)"
- Placeholder: "Ex: Pretendo usar material concreto para fracoes, enfase em resolucao de problemas contextualizados, avaliacao formativa continua..."
- Max 2000 caracteres com contador visual
- Exibir descricao na visualizacao do planejamento

#### Criterios de Aceitacao

- [ ] Campo `descricao` existe no schema Prisma e migration aplicada
- [ ] DTO aceita `descricao` como campo opcional (max 2000 chars)
- [ ] Planejamentos existentes continuam funcionando (campo nullable)
- [ ] Frontend exibe textarea no formulario de criacao
- [ ] Descricao e exibida na pagina de visualizacao do planejamento
- [ ] PATCH `/planejamentos/:id` permite atualizar descricao
- [ ] Testes unitarios para service e DTO
- [ ] Teste e2e para criacao de planejamento com descricao

#### Dependencias
- Nenhuma — pode ser implementada em paralelo com US-020.2

---

### US-020.2: Aula como Rascunho com descricao e datas futuras

**Como** professor,
**Quero** criar aulas antecipadamente com data futura e descricao do objetivo,
**Para** planejar todas as aulas do mes/bimestre e adicionar o audio quando estiver disponivel.

#### Implementacao Tecnica

**Backend — Schema:**
- Adicionar `RASCUNHO` ao enum `StatusProcessamento` (como primeiro valor)
- Adicionar `descricao String? @db.Text` em `Aula`
- Migration com dados existentes inalterados

**Backend — DTOs e Service:**
- `CreateAulaDto`: remover `@IsNotFutureDate()` de `data`, tornar `tipo_entrada` opcional (default: nulo para rascunhos)
- Novo DTO `CreateAulaRascunhoDto`: apenas `turma_id`, `data`, `planejamento_id?`, `descricao?`
- `aulas.service.ts`:
  - Novo metodo `createRascunho()`: cria aula com status `RASCUNHO`, sem exigir audio/tipo_entrada
  - Novo metodo `iniciarProcessamento(aulaId, tipo_entrada)`: transiciona `RASCUNHO → CRIADA` e inicia fluxo normal
  - Validacao: `descricao` so pode ser editada enquanto status === `RASCUNHO`
  - Permitir datas futuras no create (remover `@IsNotFutureDate`)

**Backend — Endpoints:**
- `POST /aulas/rascunho` — cria aula em rascunho
- `PATCH /aulas/:id/descricao` — edita descricao (somente se RASCUNHO)
- `POST /aulas/:id/iniciar` — transiciona de RASCUNHO para fluxo de processamento (recebe tipo_entrada + arquivo)
- Manter endpoints existentes inalterados para retrocompatibilidade

**Backend — Status Transitions:**
- Adicionar transicao `RASCUNHO → CRIADA` (via iniciarProcessamento)
- Adicionar transicao `RASCUNHO → AGUARDANDO_TRANSCRICAO` (upload direto)
- Adicionar transicao `RASCUNHO → TRANSCRITA` (texto direto)
- Professor pode deletar aula em `RASCUNHO` (soft delete)

**Frontend:**
- Novo botao "Planejar Aula" na listagem de aulas (alem do "Enviar Audio" existente)
- Formulario simplificado: data + turma + planejamento (opcional) + descricao (textarea)
- Listagem de aulas: badge "Rascunho" (cinza) para aulas sem audio
- Na aula rascunho: botao "Enviar Audio" que chama `iniciarProcessamento`
- Campo descricao editavel somente quando status === RASCUNHO (readonly apos)

#### Criterios de Aceitacao

- [ ] Enum `StatusProcessamento` inclui `RASCUNHO` como primeiro valor
- [ ] Campo `descricao` existe em `Aula` no schema Prisma
- [ ] Migration aplicada sem afetar dados existentes
- [ ] `POST /aulas/rascunho` cria aula sem exigir audio
- [ ] Datas futuras sao aceitas no campo `data`
- [ ] `PATCH /aulas/:id/descricao` funciona apenas para status RASCUNHO
- [ ] `POST /aulas/:id/iniciar` transiciona corretamente para o fluxo de processamento
- [ ] Endpoints existentes continuam funcionando (retrocompatibilidade)
- [ ] Frontend exibe botao "Planejar Aula" e formulario de rascunho
- [ ] Badge "Rascunho" aparece na listagem
- [ ] Campo descricao fica readonly apos saida de RASCUNHO
- [ ] Testes unitarios para novas transicoes de status
- [ ] Testes e2e para fluxo completo: rascunho → upload → transcricao → analise

#### Dependencias
- Nenhuma — pode ser implementada em paralelo com US-020.1

---

### US-020.3: Passar descricoes como contexto para o pipeline de prompts

**Como** sistema de analise,
**Quero** receber as descricoes de planejamento e aula como contexto adicional nos prompts,
**Para** gerar analises alinhadas com a intencao pedagogica do professor.

#### Implementacao Tecnica

**Backend — AnaliseService (analisarAula):**
- Ao montar o contexto para os prompts, incluir:
  - `descricao_planejamento`: texto do `Planejamento.descricao` (se existir)
  - `descricao_aula`: texto do `Aula.descricao` (se existir)
- Passar ambos como variaveis de template para todos os 5 prompts

**Prompts — v5.0.0 (todos os 5):**
- Adicionar secao condicional nos templates:

```
{{#if descricao_planejamento}}
### Contexto do Planejamento Bimestral (declarado pelo professor)
O professor descreveu o seguinte sobre seu planejamento para o bimestre:
"{{{descricao_planejamento}}}"

Use este contexto para entender as metodologias e enfases planejadas.
{{/if}}

{{#if descricao_aula}}
### Objetivo Especifico desta Aula (declarado pelo professor)
O professor declarou o seguinte objetivo para esta aula:
"{{{descricao_aula}}}"

Avalie a aula tambem sob a otica deste objetivo declarado.
{{/if}}
```

**Prompt de Cobertura (Prompt 1) — v5.0.0:**
- Se `descricao_aula` existe, considerar elementos mencionados ao classificar nivel de cobertura
- Evidencias podem referenciar alinhamento ou desvio do objetivo declarado

**Prompt Qualitativa (Prompt 2) — v5.0.0:**
- Se `descricao_planejamento` menciona metodologias, avaliar se foram aplicadas

**Prompt de Relatorio (Prompt 3) — v5.0.0:**
- Nova secao no relatorio: "Aderencia ao Objetivo Declarado" (ver US-020.4)

**Prompt de Exercicios (Prompt 4) — v5.0.0:**
- Se `descricao_aula` existe, priorizar exercicios alinhados com o objetivo declarado

**Prompt de Alertas (Prompt 5) — v5.0.0:**
- Se objetivo declarado nao foi atingido, gerar alerta tipo `DESVIO_OBJETIVO`

**Seed de Prompts:**
- Criar novos arquivos: `prompt-cobertura-v5.0.0.json`, `prompt-qualitativa-v5.0.0.json`, `prompt-relatorio-v5.0.0.json`, `prompt-exercicios-v5.0.0.json`, `prompt-alertas-v5.0.0.json`
- Marcar v4.0.0 como `ativo: false` no seed

#### Criterios de Aceitacao

- [ ] `analise.service.ts` carrega descricao de Planejamento e Aula ao montar contexto
- [ ] Todos os 5 prompts v5.0.0 criados com secoes condicionais de descricao
- [ ] Seed atualizado: v5.0.0 ativo, v4.0.0 inativo
- [ ] Analise sem descricoes funciona identicamente ao v4 (retrocompatibilidade)
- [ ] Analise com descricoes gera relatorios visivelmente mais contextualizados
- [ ] Testes unitarios para montagem de contexto com/sem descricoes
- [ ] Testes de prompt com mock de descricao validam template rendering

#### Dependencias
- **Depende de:** US-020.1 (descricao no Planejamento) e US-020.2 (descricao na Aula)

---

### US-020.4: Analise de aderencia ao objetivo no relatorio

**Como** professor,
**Quero** ver no relatorio o quanto consegui alcancar o objetivo que declarei para a aula,
**Para** ter feedback concreto sobre a execucao do meu planejamento.

#### Implementacao Tecnica

**Backend — Schema:**
- Adicionar `aderencia_objetivo_json Json?` em `Analise`
- Migration compativel (campo nullable)

**Backend — Prompt de Relatorio (Prompt 3 — v5.0.0):**
- Quando `descricao_aula` existe, adicionar instrucao ao prompt:

```
### Analise de Aderencia ao Objetivo

O professor declarou o seguinte objetivo para esta aula:
"{{{descricao_aula}}}"

{{#if descricao_planejamento}}
Contexto bimestral: "{{{descricao_planejamento}}}"
{{/if}}

Alem do relatorio em markdown, voce DEVE retornar um bloco JSON separado
delimitado por ```aderencia_json e ``` com a seguinte estrutura:

{
  "faixa_aderencia": "BAIXA" | "MEDIA" | "ALTA" | "TOTAL",
  "descricao_faixa": "string explicando o que a faixa significa",
  "analise_qualitativa": "string com analise detalhada comparando intencao vs execucao",
  "pontos_atingidos": ["string[]"],
  "pontos_nao_atingidos": ["string[]"],
  "recomendacao": "string com sugestao actionable"
}

Regras para classificacao:
- BAIXA: Aula desviou significativamente — menos de 30% dos elementos descritos foram trabalhados
- MEDIA: Aula cobriu parcialmente — entre 30% e 70% dos elementos foram trabalhados
- ALTA: Aula seguiu majoritariamente — entre 70% e 90% dos elementos foram trabalhados
- TOTAL: Aula executou integralmente — acima de 90% dos elementos foram trabalhados

IMPORTANTE: Estes percentuais sao estimativas qualitativas, NAO calculos exatos.
Use seu julgamento baseado nas evidencias da transcricao.
Se descricao_aula nao existir, NAO gere o bloco aderencia_json.
```

**Backend — AnaliseService:**
- Apos receber resposta do Prompt 3, fazer parse do bloco `aderencia_json`
- Salvar em `Analise.aderencia_objetivo_json`
- Se descricao_aula nao existe, campo fica `null` (analise sem aderencia)
- Validar schema do JSON antes de persistir (zod runtime validation)

**Backend — API Response:**
- Endpoint `GET /aulas/:id/analise` retorna `aderencia_objetivo` no response (quando existir)

#### Criterios de Aceitacao

- [ ] Campo `aderencia_objetivo_json` existe em `Analise` no schema Prisma
- [ ] Prompt 3 v5.0.0 gera bloco `aderencia_json` quando `descricao_aula` existe
- [ ] AnaliseService faz parse e persiste o JSON de aderencia
- [ ] Validacao zod do schema de aderencia antes de persistir
- [ ] API retorna `aderencia_objetivo` no response de analise
- [ ] Quando `descricao_aula` nao existe, campo fica `null` sem erro
- [ ] Testes unitarios para parse do bloco aderencia_json
- [ ] Teste e2e: aula com descricao gera aderencia, aula sem descricao nao gera

#### Dependencias
- **Depende de:** US-020.3 (prompts v5.0.0 com contexto de descricao)

---

### US-020.5: Frontend — Exibicao da aderencia ao objetivo

**Como** professor,
**Quero** ver a analise de aderencia ao objetivo de forma clara e visual na pagina de analise,
**Para** entender rapidamente se executei o que planejei.

#### Implementacao Tecnica

**Frontend — analise-adapter.ts:**
- Adicionar normalizacao para `aderencia_objetivo`:
  - Mapear `faixa_aderencia` para cores: BAIXA (vermelho), MEDIA (laranja), ALTA (azul), TOTAL (verde)
  - Extrair campos para exibicao

**Frontend — Novo componente `AderenciaObjetivoCard.tsx`:**
- Card visual com:
  - Badge da faixa (BAIXA/MEDIA/ALTA/TOTAL) com cor correspondente
  - Barra de progresso visual representando a faixa (nao percentual exato)
  - `analise_qualitativa` como texto principal
  - Lista de `pontos_atingidos` (check verde) e `pontos_nao_atingidos` (x vermelho)
  - `recomendacao` destacada em box
- Condicional: so renderiza se `aderencia_objetivo` existe no response

**Frontend — RelatorioTab.tsx:**
- Inserir `AderenciaObjetivoCard` apos o bloco de cobertura BNCC e antes da analise qualitativa
- Exibir a `descricao_aula` original como "O que voce planejou" (contexto para o professor)

**Frontend — AulaAnalisePage.tsx:**
- Atualizar `AnaliseResponse` interface para incluir `aderencia_objetivo`
- Passar dados para `RelatorioTab`

#### Criterios de Aceitacao

- [ ] Componente `AderenciaObjetivoCard` criado com design coerente ao Design System
- [ ] Badge de faixa com cores corretas (BAIXA=vermelho, MEDIA=laranja, ALTA=azul, TOTAL=verde)
- [ ] Barra visual representando a faixa de aderencia
- [ ] Lista de pontos atingidos e nao atingidos com icones
- [ ] Recomendacao exibida em destaque
- [ ] Descricao original do professor exibida como contexto
- [ ] Card so aparece quando aderencia_objetivo existe (feature flag por dados)
- [ ] Adapter normaliza dados corretamente
- [ ] Aulas sem descricao nao exibem o card (sem erros)
- [ ] Responsivo (mobile e desktop)
- [ ] Testes unitarios do componente e do adapter

#### Dependencias
- **Depende de:** US-020.4 (API retornando aderencia_objetivo)

---

### US-020.6: Validacao end-to-end e retrocompatibilidade

**Como** equipe de desenvolvimento,
**Quero** garantir que todas as mudancas sao retrocompativeis e o fluxo existente nao quebra,
**Para** fazer deploy seguro sem afetar usuarios existentes.

#### Implementacao Tecnica

**Testes E2E:**
1. **Fluxo legado intacto:** Criar aula sem descricao → upload audio → transcrever → analisar → verificar que analise v5 funciona identicamente a v4 quando nao ha descricao
2. **Fluxo rascunho completo:** Criar rascunho → adicionar descricao → upload audio → transcrever → analisar → verificar aderencia gerada
3. **Planejamento com descricao:** Criar planejamento com descricao → criar aula vinculada → analisar → verificar que descricao do planejamento aparece no contexto
4. **Imutabilidade:** Tentar editar descricao apos upload → deve retornar 400
5. **Datas futuras:** Criar aula com data futura → verificar aceita sem erro
6. **Sem regressao nos prompts:** Comparar output v5 sem descricao com baseline v4

**Migration safety:**
- Testar migration em banco com dados existentes
- Verificar que aulas/planejamentos existentes tem `descricao = null`
- Verificar que analises existentes tem `aderencia_objetivo_json = null`
- Enum `RASCUNHO` adicionado sem afetar registros existentes

**Frontend adapter:**
- Testar adapter com responses v4 (sem aderencia) — deve funcionar sem erros
- Testar adapter com responses v5 (com aderencia) — deve normalizar corretamente

#### Criterios de Aceitacao

- [ ] Todos os testes e2e existentes passam sem modificacao
- [ ] 6+ novos testes e2e cobrindo cenarios acima
- [ ] Migration e reversivel (down migration funciona)
- [ ] Adapter lida com ambas as versoes (v4 e v5) sem erros
- [ ] Zero breaking changes na API existente
- [ ] Documentacao Swagger atualizada com novos campos e endpoints
- [ ] Seed de prompts v5.0.0 e idempotente

#### Dependencias
- **Depende de:** Todas as stories anteriores (US-020.1 a US-020.5)

---

## Riscos e Mitigacoes

| # | Risco | Probabilidade | Impacto | Mitigacao |
|---|-------|:---:|:---:|---------|
| R1 | Prompts v5 geram aderencia inconsistente | Media | Alto | Testes A/B com 20+ aulas reais antes de ativar; faixas amplas (nao percentuais exatos) |
| R2 | Professores escrevem descricoes muito vagas | Alta | Medio | Placeholder com exemplos ricos; max 2000 chars; guia de preenchimento |
| R3 | Migration quebra dados existentes | Baixa | Critico | Todos campos novos sao nullable; testes de migration em staging |
| R4 | Fluxo de rascunho confunde o professor | Media | Medio | UX clara com badges de status; botao "Enviar Audio" proeminente no rascunho |
| R5 | Parse do bloco aderencia_json falha | Media | Alto | Validacao zod + fallback: se parse falhar, analise e salva sem aderencia (degradacao graciosa) |

---

## Metricas de Sucesso

| Metrica | Baseline (sem descricao) | Target (com descricao) |
|---------|:---:|:---:|
| Taxa de aprovacao de relatorios | ~75% | >85% |
| Tempo de revisao do relatorio | ~8min | <5min |
| % de aulas com descricao preenchida | 0% | >40% (apos 30 dias) |
| % de planejamentos com descricao | 0% | >50% (apos 30 dias) |
| Aderencia faixa ALTA ou TOTAL | N/A | >60% das aulas com descricao |
| Rejeicao por "relatorio generico" | ~15% | <5% |

---

## Ordem de Implementacao

```
US-020.1 (Planejamento descricao)  ──┐
                                     ├──► US-020.3 (Prompts v5) ──► US-020.4 (Aderencia) ──► US-020.5 (Frontend aderencia) ──► US-020.6 (E2E)
US-020.2 (Aula rascunho + descricao) ┘
```

- **Sprint 1 (5-7 dias):** US-020.1 + US-020.2 (paralelo) + US-020.3
- **Sprint 2 (5-7 dias):** US-020.4 + US-020.5 + US-020.6

---

## Arquivos Impactados (Estimativa)

### Backend
| Arquivo | Tipo de Mudanca |
|---------|----------------|
| `prisma/schema.prisma` | Adicionar campos + enum value |
| `prisma/migrations/YYYYMMDD_add_descricao_rascunho/` | Nova migration |
| `src/modules/planejamento/dto/create-planejamento.dto.ts` | Adicionar `descricao` |
| `src/modules/planejamento/planejamento.service.ts` | Persistir/retornar descricao |
| `src/modules/aulas/aulas.service.ts` | Novo createRascunho, iniciarProcessamento, validacoes |
| `src/modules/aulas/dto/create-aula.dto.ts` | Remover IsNotFutureDate, novo DTO rascunho |
| `src/modules/analise/services/analise.service.ts` | Montar contexto com descricoes, parse aderencia |
| `src/workers/analysis-processor.worker.ts` | Nenhum (contexto e montado no AnaliseService) |
| `prisma/seeds/prompts/prompt-*-v5.0.0.json` | 5 novos arquivos de prompt |
| `src/modules/llm/prompts/prompt-*.spec.ts` | Atualizar testes de template rendering |

### Frontend
| Arquivo | Tipo de Mudanca |
|---------|----------------|
| `src/lib/analise-adapter.ts` | Normalizar aderencia_objetivo |
| `src/lib/analise-adapter.test.ts` | Testes para normalizacao |
| `src/pages/aulas/AulaAnalisePage.tsx` | Atualizar interface + passar dados |
| `src/pages/aulas/components/RelatorioTab.tsx` | Inserir AderenciaObjetivoCard |
| `src/pages/aulas/components/AderenciaObjetivoCard.tsx` | **NOVO** componente |
| Formularios de planejamento e aula | Adicionar textarea descricao |
| Listagem de aulas | Badge rascunho + botao enviar audio |

### Testes
| Arquivo | Tipo de Mudanca |
|---------|----------------|
| `test/planejamento-descricao.e2e-spec.ts` | **NOVO** |
| `test/aula-rascunho.e2e-spec.ts` | **NOVO** |
| `test/aderencia-objetivo.e2e-spec.ts` | **NOVO** |
| `test/analise-pipeline.e2e-spec.ts` | Atualizar para v5 |
| `test/analise-prompts-*.e2e-spec.ts` | Atualizar para v5 |
