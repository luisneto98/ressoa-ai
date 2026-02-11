# Estratégia de Prompts e Análise de IA

**Projeto:** Professor Analytics
**Data:** 2026-02-08
**Versão:** 1.0
**Autores:** Equipe Técnica + Consultores Pedagógicos
**Documentos de referência:**
- Product Brief (2026-02-05)
- Mapeamento BNCC (2026-02-06)
- Brainstorming Session (2026-02-05)

---

## 1. Objetivo do Documento

Definir a estratégia de engenharia de prompts para análise pedagógica, estabelecendo:

1. **Fundamentos teóricos** que sustentam a análise (taxonomia de Bloom, didática, metodologias)
2. **Estrutura dos prompts** para cada funcionalidade core
3. **Critérios de qualidade** para output aproveitável (meta: 90%+ utilizável sem edição)
4. **Métricas de avaliação** e feedback loop para melhoria contínua

**Problema a resolver:**

> **Risco #67:** "Relatório genérico e inútil - frases rasas tipo 'a aula cobriu os tópicos de forma satisfatória'. Zero valor."

> **Mitigação #68:** "Engenharia de prompt pedagógica - prompts construídos com especialistas em educação. IA precisa entender taxonomia de Bloom, didática, planejamento pedagógico. Isso é o MOAT técnico."

**Meta de sucesso:** >80% dos relatórios gerados aprovados sem edição significativa pelos professores (critério de MVP).

---

## 2. Fundamentos Pedagógicos

### 2.1 Taxonomia de Bloom Revisada (Anderson & Krathwohl, 2001)

A análise de aulas deve identificar em qual nível cognitivo o conteúdo está sendo trabalhado:

| Nível | Descrição | Verbos de Ação | Sinais na Transcrição |
|-------|-----------|----------------|----------------------|
| **1. Lembrar** | Recuperar conhecimento da memória | Definir, listar, nomear, identificar | "O que é X?", "Lembre-se que...", repetição de definições |
| **2. Compreender** | Explicar ideias ou conceitos | Explicar, interpretar, resumir, exemplificar | "Por que X acontece?", "Dê um exemplo", paráfrases |
| **3. Aplicar** | Usar informação em situações novas | Resolver, usar, demonstrar, calcular | "Calcule Y usando X", "Resolva este problema", exercícios |
| **4. Analisar** | Dividir em partes, encontrar relações | Comparar, contrastar, diferenciar, organizar | "Compare X e Y", "Qual a diferença?", diagramas |
| **5. Avaliar** | Fazer julgamentos baseados em critérios | Julgar, argumentar, criticar, justificar | "Qual é melhor?", "Você concorda?", debates |
| **6. Criar** | Combinar elementos em algo novo | Criar, projetar, construir, planejar | "Crie um X", "Proponha uma solução", projetos |

**Uso no sistema:**
- Relatórios devem identificar níveis dominantes da aula
- Alertas se aula ficou apenas em níveis 1-2 (memorização) sem progressão
- Sugestão de exercícios balanceados entre níveis

### 2.2 Critérios de Qualidade Didática

#### A) Coerência Narrativa e Sequência Lógica

Uma aula de qualidade apresenta:

```
Introdução → Desenvolvimento → Consolidação → Aplicação
    ↓              ↓                ↓              ↓
Ativa          Explica          Revisa        Conecta
conhecimento   conceito novo    conceitos     com contexto
prévio         passo a passo    chave         real
```

**Sinais de coerência:**
- Conexão explícita com aula anterior
- Progressão lógica entre tópicos
- Recapitulação periódica
- Fechamento com síntese

**Sinais de problema:**
- Saltos abruptos entre tópicos não relacionados
- Conceitos apresentados sem base prévia
- Aula termina sem conclusão

#### B) Adequação Cognitiva por Faixa Etária

| Ano | Idade | Características Cognitivas | Linguagem Esperada |
|-----|-------|---------------------------|-------------------|
| 6º ano | 11-12 | Transição concreto → abstrato | Exemplos concretos, analogias do cotidiano |
| 7º ano | 12-13 | Pensamento abstrato emergente | Mix concreto-abstrato, problemas contextualizados |
| 8º ano | 13-14 | Raciocínio lógico consolidado | Abstrações permitidas, generalizações |
| 9º ano | 14-15 | Pensamento hipotético-dedutivo | Problemas complexos, múltiplas variáveis |

**Uso no sistema:**
- Análise de adequação linguística por série
- Alertas se linguagem abstrata demais para 6º-7º ano
- Alertas se aula infantilizada para 8º-9º ano

#### C) Metodologias de Ensino Reconhecidas

| Metodologia | Sinais na Transcrição | Efetividade |
|-------------|----------------------|-------------|
| **Expositiva dialogada** | Professor explica + perguntas intercaladas | Alta para conceitos novos |
| **Resolução de problemas** | Apresenta desafio → alunos tentam → discussão | Alta para aplicação |
| **Aprendizagem por descoberta** | Perguntas guiadas, professor media | Média-alta, requer tempo |
| **Trabalho em grupo** | "Formem grupos", discussão entre alunos | Alta para consolidação |
| **Aula puramente expositiva** | Monólogo do professor, sem interação | Baixa retenção |

**Uso no sistema:**
- Identificar metodologia dominante
- Alertas se 100% expositiva (sinal de desengajamento potencial)
- Sugerir variação metodológica

#### D) Sinais de Engajamento e Aprendizagem

**Indicadores positivos:**
- Perguntas dos alunos (curiosidade genuína)
- Discussões entre alunos
- Tentativas de resposta (mesmo incorretas)
- Exemplos dados pelos próprios alunos
- Pausas para dúvidas atendidas

**Indicadores negativos:**
- Silêncio prolongado após perguntas
- Professor responde as próprias perguntas
- Perguntas operacionais ("Vai cair na prova?") sem perguntas conceituais
- Professor repete explicação >3x sem reformular

### 2.3 Estrutura Curricular BNCC

**Unidade atômica:** Habilidade (código alfanumérico, ex: EF07MA18)

**Níveis de cobertura:**
| Nível | Nome | Critério |
|-------|------|----------|
| 0 | Não coberta | Habilidade não aparece |
| 1 | Mencionada | Citação breve, sem desenvolvimento |
| 2 | Parcialmente coberta | Conceitos trabalhados, exemplos, mas sem profundidade completa |
| 3 | Aprofundada | Explicação completa + exemplos + exercícios + interação |

**Componentes do MVP:**
- Matemática: 121 habilidades (6º-9º ano)
- Ciências: 63 habilidades (6º-9º ano)
- Língua Portuguesa: ~185 habilidades (6º-9º ano, com blocos compartilhados)

---

## 3. Arquitetura da Pipeline de Análise

### 3.1 Visão Geral do Fluxo

```
┌──────────────────────────────────────────────────────────────┐
│                     PIPELINE DE ANÁLISE                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUT                                                        │
│  ┌─────────────────┐      ┌──────────────────┐              │
│  │  Transcrição    │      │  Planejamento    │              │
│  │  da Aula        │      │  Bimestral       │              │
│  │  (texto)        │      │  (habilidades    │              │
│  └────────┬────────┘      │   BNCC)          │              │
│           │               └────────┬─────────┘              │
│           │                        │                         │
│           └────────┬───────────────┘                         │
│                    ▼                                         │
│  ANÁLISE MULTI-DIMENSIONAL                                   │
│  ┌──────────────────────────────────────────────┐           │
│  │ PROMPT 1: Análise de Cobertura Curricular    │           │
│  │ - Cruzamento aula × habilidades BNCC         │           │
│  │ - Nível de cobertura (0-3)                   │           │
│  │ - Evidências textuais                        │           │
│  └──────────────────┬───────────────────────────┘           │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────┐           │
│  │ PROMPT 2: Análise Pedagógica Qualitativa     │           │
│  │ - Taxonomia de Bloom                         │           │
│  │ - Coerência narrativa                        │           │
│  │ - Adequação linguística                      │           │
│  │ - Metodologia de ensino                      │           │
│  │ - Sinais de engajamento                      │           │
│  └──────────────────┬───────────────────────────┘           │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────┐           │
│  │ PROMPT 3: Geração de Relatório               │           │
│  │ - Síntese da aula                            │           │
│  │ - Metodologia usada                          │           │
│  │ - Participação dos alunos                    │           │
│  │ - Progresso curricular                       │           │
│  │ - Formato configurável por escola            │           │
│  └──────────────────┬───────────────────────────┘           │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────┐           │
│  │ PROMPT 4: Geração de Exercícios Contextuais  │           │
│  │ - 3-5 questões do conteúdo da aula           │           │
│  │ - Níveis variados de Bloom                   │           │
│  │ - Apropriadas para série/disciplina          │           │
│  └──────────────────┬───────────────────────────┘           │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────┐           │
│  │ PROMPT 5: Detecção de Alertas               │           │
│  │ - Gaps de conteúdo                           │           │
│  │ - Sinais de dificuldade                      │           │
│  │ - Sugestões para próxima aula                │           │
│  └──────────────────┬───────────────────────────┘           │
│                     │                                        │
│                     ▼                                        │
│  OUTPUT                                                      │
│  ┌─────────────────────────────────────────────┐            │
│  │ - Relatório formatado                       │            │
│  │ - Exercícios revisáveis                     │            │
│  │ - Métricas estruturadas (JSON)              │            │
│  │ - Alertas acionáveis                        │            │
│  └─────────────────────────────────────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| **Processamento** | Assíncrono (batch) | Custo reduzido, não requer tempo real |
| **Número de prompts** | 5 prompts especializados | Cada um focado, mais fácil de debugar e melhorar |
| **Sequência** | Pipeline serial com dependências | Prompt 3 (relatório) usa outputs de 1 e 2 |
| **Formato de output** | JSON estruturado + texto markdown | Dados estruturados para dashboard, texto para professor |
| **Modelo de IA** | LLM grande (GPT-4, Claude Opus) | Tarefa complexa requer raciocínio sofisticado |
| **Fallback** | Modo degradado se API falha | Relatório básico sem análise avançada |

---

## 4. Estrutura dos Prompts

### 4.1 PROMPT 1: Análise de Cobertura Curricular

**Objetivo:** Identificar quais habilidades BNCC foram cobertas na aula e em que nível.

**Input:**
- Transcrição da aula (texto completo)
- Lista de habilidades planejadas para o bimestre (código + descrição)
- Metadados: disciplina, ano, data

**Estrutura do Prompt:**

```
CONTEXTO:
Você é um especialista em análise curricular com profundo conhecimento da BNCC
(Base Nacional Comum Curricular). Sua tarefa é analisar uma transcrição de aula
e identificar quais habilidades BNCC foram trabalhadas e em que nível de profundidade.

DISCIPLINA: {disciplina}
ANO/SÉRIE: {ano}
DATA DA AULA: {data}

HABILIDADES PLANEJADAS PARA ESTE BIMESTRE:
{lista_habilidades_com_descricoes}

TRANSCRIÇÃO DA AULA:
{transcricao}

TAREFA:
Para cada habilidade planejada, determine:

1. NÍVEL DE COBERTURA (obrigatório):
   - 0 (Não coberta): Habilidade não aparece na aula
   - 1 (Mencionada): Conceito citado brevemente, sem desenvolvimento
   - 2 (Parcialmente coberta): Conceito explicado com exemplos, mas sem profundidade completa
   - 3 (Aprofundada): Explicação completa, múltiplos exemplos, exercícios, discussão

2. EVIDÊNCIAS TEXTUAIS (obrigatório se nível > 0):
   - Trecho(s) da transcrição que comprovam a cobertura
   - Máximo 3 trechos por habilidade

3. OBSERVAÇÕES PEDAGÓGICAS (opcional):
   - Como o conteúdo foi abordado
   - Adequação ao nível da série
   - Sugestões de aprofundamento

CRITÉRIOS DE AVALIAÇÃO:

Nível 1 (Mencionada):
- Professor cita o conceito sem explicar
- Exemplo: "Lembrem-se das equações de 1º grau"

Nível 2 (Parcialmente coberta):
- Professor explica o conceito
- Fornece pelo menos 1 exemplo
- NÃO houve exercícios ou discussão aprofundada
- Exemplo: Explicou equações, resolveu 1 exemplo no quadro

Nível 3 (Aprofundada):
- Explicação completa e estruturada
- Múltiplos exemplos (≥2)
- Exercícios propostos ou discussão com alunos
- Verificação de compreensão
- Exemplo: Explicou, resolveu 3 exemplos, propôs exercício, alunos tentaram resolver

OUTPUT ESPERADO (JSON):
{
  "analise_cobertura": [
    {
      "habilidade_codigo": "EF07MA18",
      "nivel_cobertura": 3,
      "evidencias": [
        "Professor: 'Vamos resolver equações do primeiro grau. Lembrem-se: ax + b = c...'",
        "Aluno: 'Professor, posso usar outro método?' Professor: 'Claro, me mostre...'",
        "Professor: 'Agora vocês vão resolver os exercícios 1 a 5 da página 42'"
      ],
      "observacoes": "Habilidade trabalhada de forma completa. Professor usou
                     metodologia dialogada, alunos participaram ativamente.
                     Adequado para 7º ano.",
      "tempo_estimado_minutos": 25
    },
    {
      "habilidade_codigo": "EF07MA16",
      "nivel_cobertura": 1,
      "evidencias": [
        "Professor: 'Lembrem-se que equação é uma igualdade com incógnita'"
      ],
      "observacoes": "Apenas mencionado como revisão, não foi o foco da aula.",
      "tempo_estimado_minutos": 2
    }
  ],
  "habilidades_nao_cobertas": ["EF07MA17", "EF07MA19"],
  "habilidades_extras": [
    {
      "habilidade_codigo": "EF06MA14",
      "observacao": "Professor retomou conceito do 6º ano para contextualizar"
    }
  ],
  "resumo_quantitativo": {
    "total_planejadas": 4,
    "cobertas_nivel_2_ou_3": 1,
    "apenas_mencionadas": 1,
    "nao_cobertas": 2,
    "percentual_cobertura": 25
  }
}

IMPORTANTE:
- Seja rigoroso na classificação dos níveis
- Use evidências textuais LITERAIS da transcrição
- Se houver dúvida entre dois níveis, escolha o menor
- Não invente informações que não estão na transcrição
```

**Configurações do modelo:**
- Temperature: 0.3 (baixa criatividade, alta consistência)
- Max tokens: 2000
- Response format: JSON

---

### 4.2 PROMPT 2: Análise Pedagógica Qualitativa

**Objetivo:** Avaliar a qualidade didática da aula em múltiplas dimensões.

**Input:**
- Transcrição da aula
- Disciplina, ano/série
- (Opcional) Output do Prompt 1

**Estrutura do Prompt:**

```
CONTEXTO:
Você é um especialista em didática e pedagogia com experiência em avaliação
de práticas de ensino. Sua tarefa é analisar a qualidade pedagógica de uma
aula a partir de sua transcrição, considerando múltiplas dimensões.

DISCIPLINA: {disciplina}
ANO/SÉRIE: {ano}

TRANSCRIÇÃO DA AULA:
{transcricao}

TAREFA:
Analise a aula nas seguintes dimensões:

1. TAXONOMIA DE BLOOM
   - Identifique os níveis cognitivos trabalhados (1-Lembrar até 6-Criar)
   - Qual nível foi dominante?
   - Houve progressão entre níveis?

2. COERÊNCIA NARRATIVA E SEQUÊNCIA LÓGICA
   - A aula tem estrutura clara (introdução → desenvolvimento → consolidação)?
   - O professor conectou com conhecimento prévio?
   - Os tópicos seguem ordem lógica?
   - Houve fechamento/síntese ao final?

3. ADEQUAÇÃO LINGUÍSTICA PARA A SÉRIE
   - A linguagem está apropriada para {ano}?
   - Nível de abstração adequado?
   - Uso de exemplos concretos/abstratos balanceado?

4. METODOLOGIA DE ENSINO
   - Qual metodologia foi predominante?
     (Expositiva dialogada / Resolução de problemas / Descoberta guiada /
      Trabalho em grupo / Expositiva pura)
   - Houve variação metodológica?

5. ENGAJAMENTO E INTERAÇÃO
   - Alunos fizeram perguntas?
   - Professor estimulou participação?
   - Houve discussão entre alunos?
   - Sinais de dificuldade/desengajamento?

6. CLAREZA E COMUNICAÇÃO
   - Professor explicou de forma clara?
   - Usou exemplos adequados?
   - Reformulou explicações quando necessário?

CRITÉRIOS DE QUALIDADE:

TAXONOMIA DE BLOOM:
- Ideal: Aula transita entre 2-3 níveis, com foco em Aplicar/Analisar
- Adequado: Compreender + Aplicar
- Problema: Apenas Lembrar, ou salto direto para Criar sem base

COERÊNCIA:
- Ideal: Clara progressão, referências ao planejamento, síntese final
- Adequado: Estrutura básica presente
- Problema: Tópicos desconexos, sem fio condutor

ADEQUAÇÃO SÉRIE:
- 6º-7º ano: Predomínio de exemplos concretos, analogias do cotidiano
- 8º-9º ano: Abstrações permitidas, problemas mais complexos
- Problema: Linguagem abstrata demais para 6º-7º, ou infantilizada para 8º-9º

METODOLOGIA:
- Ideal: Mix de métodos (expositiva dialogada + exercícios + discussão)
- Adequado: Expositiva dialogada com perguntas
- Problema: Monólogo do professor, zero interação

ENGAJAMENTO:
- Positivo: ≥3 perguntas de alunos, discussões, tentativas de resposta
- Neutro: Alunos respondem quando chamados
- Negativo: Silêncio, professor responde próprias perguntas

OUTPUT ESPERADO (JSON):
{
  "taxonomia_bloom": {
    "niveis_identificados": [2, 3],
    "nivel_dominante": 3,
    "avaliacao": "A aula focou em Aplicar (nível 3), com boa base de
                  Compreensão (nível 2). Adequado para consolidação
                  do conceito.",
    "sugestao": "Considere adicionar atividades de Análise (nível 4)
                 para aprofundar."
  },
  "coerencia_narrativa": {
    "score": 8,
    "estrutura_presente": true,
    "conexao_conhecimento_previo": true,
    "sequencia_logica": true,
    "fechamento": true,
    "observacoes": "Aula bem estruturada. Professor iniciou retomando
                   aula anterior, desenvolveu conceito novo passo a passo,
                   e finalizou com síntese. Excelente coerência."
  },
  "adequacao_linguistica": {
    "adequada_para_serie": true,
    "observacoes": "Linguagem apropriada para 7º ano. Bom equilíbrio
                   entre exemplos concretos e introdução de abstrações.",
    "exemplos_adequacao": [
      "Uso de 'balança' como analogia para igualdade (concreto)",
      "Progressão para notação algébrica (abstrato)"
    ]
  },
  "metodologia": {
    "dominante": "Expositiva dialogada",
    "metodos_identificados": ["Expositiva dialogada", "Resolução de problemas"],
    "variacao": true,
    "avaliacao": "Professor equilibrou explicação com exercícios práticos.
                 Boa variação metodológica."
  },
  "engajamento": {
    "perguntas_alunos": 5,
    "participacao_estimulada": true,
    "discussoes": true,
    "sinais_dificuldade": ["Aluna Maria pediu para repetir explicação"],
    "sinais_positivos": [
      "Alunos propuseram métodos alternativos de resolução",
      "Discussão espontânea sobre aplicação prática"
    ],
    "avaliacao": "Alto engajamento. Alunos participativos e curiosos."
  },
  "clareza_comunicacao": {
    "score": 9,
    "explicacoes_claras": true,
    "uso_exemplos": true,
    "reformulacoes": 2,
    "observacoes": "Professor muito claro. Reformulou explicação quando
                   percebeu dúvida. Usou múltiplos exemplos."
  },
  "resumo_geral": {
    "pontos_fortes": [
      "Excelente coerência narrativa",
      "Alto engajamento dos alunos",
      "Clareza na comunicação"
    ],
    "pontos_atencao": [],
    "nota_geral": 9.0
  }
}

IMPORTANTE:
- Seja analítico, não apenas descritivo
- Base suas conclusões em evidências da transcrição
- Forneça feedback construtivo, nunca punitivo
- Mantenha tom profissional e respeitoso
```

**Configurações do modelo:**
- Temperature: 0.4
- Max tokens: 2500

---

### 4.3 PROMPT 3: Geração de Relatório

**Objetivo:** Gerar relatório automático da aula pronto para uso (90%+ aproveitável).

**Input:**
- Transcrição da aula
- Output do Prompt 1 (cobertura curricular)
- Output do Prompt 2 (análise qualitativa)
- Template de relatório da escola (se houver)

**Estrutura do Prompt:**

```
CONTEXTO:
Você é um assistente pedagógico que gera relatórios de aula para professores.
O relatório deve ser profissional, objetivo e aproveitável em 90%+ sem edições.

DISCIPLINA: {disciplina}
ANO/SÉRIE: {ano}
TURMA: {turma}
DATA: {data}
PROFESSOR: {nome_professor}

DADOS DA ANÁLISE:
{output_prompt_1}
{output_prompt_2}

TEMPLATE DO RELATÓRIO (formato da escola):
{template_escola}

TAREFA:
Gerar relatório da aula seguindo RIGOROSAMENTE o template da escola. Se não
houver template, usar formato padrão abaixo.

FORMATO PADRÃO:
---
RELATÓRIO DE AULA
Disciplina: {disciplina}
Turma: {turma}
Data: {data}
Professor(a): {nome_professor}

1. CONTEÚDO TRABALHADO
   - [Listar tópicos principais da aula, baseado nas habilidades cobertas]
   - [Incluir apenas o que FOI trabalhado, não o que estava planejado]

2. METODOLOGIA
   - [Descrever como o conteúdo foi trabalhado]
   - [Ser específico: "Aula expositiva dialogada com resolução de exercícios"
      não "Aula dinâmica e interativa"]

3. PARTICIPAÇÃO DOS ALUNOS
   - [Descrever objetivamente o engajamento]
   - [Mencionar dúvidas recorrentes, se houver]
   - [Destacar participações relevantes, se houver]

4. RECURSOS UTILIZADOS
   - [Quadro, projetor, apostila, etc.]

5. AVALIAÇÃO
   - [Exercícios propostos, se houver]
   - [Verificação de compreensão realizada]

6. OBSERVAÇÕES
   - [Qualquer informação relevante]
   - [Alunos ausentes, intercorrências, etc.]

7. PRÓXIMA AULA
   - [Conteúdo planejado para continuidade]
---

DIRETRIZES DE REDAÇÃO:

1. OBJETIVIDADE:
   ✅ "Trabalhamos equações do 1º grau, com resolução de 3 exemplos no quadro"
   ❌ "Aula muito produtiva sobre equações"

2. ESPECIFICIDADE:
   ✅ "5 alunos participaram ativamente com perguntas e propostas de solução"
   ❌ "Turma participativa e engajada"

3. EVIDÊNCIAS:
   ✅ "Aluna Maria demonstrou dificuldade em isolar a variável"
   ❌ "Alguns alunos tiveram dificuldade"

4. CONTINUIDADE:
   ✅ "Conectamos com sistema de equações visto na aula anterior"
   ❌ "Demos continuidade ao conteúdo"

5. TOM PROFISSIONAL:
   - Terceira pessoa ou primeira pessoa do plural
   - Sem julgamentos de valor ("aula excelente", "turma difícil")
   - Factual e descritivo

6. COMPRIMENTO:
   - Seção "Conteúdo trabalhado": 3-5 itens
   - Seção "Metodologia": 2-3 frases
   - Seção "Participação": 2-4 frases
   - Total: 200-400 palavras

OUTPUT ESPERADO (Markdown):
[Gerar relatório formatado em markdown seguindo template]

IMPORTANTE:
- Use APENAS informações presentes nos dados da análise
- NÃO invente nomes de alunos
- NÃO faça suposições sobre o que não está explícito
- Se informação não está disponível, omita a seção ou marque como "N/A"
- Mantenha tom neutro e profissional
```

**Configurações do modelo:**
- Temperature: 0.5 (um pouco mais de criatividade para redação)
- Max tokens: 1500

---

### 4.4 PROMPT 4: Geração de Exercícios Contextuais

**Objetivo:** Criar exercícios de revisão baseados no conteúdo REAL daquela aula específica.

**Input:**
- Transcrição da aula
- Habilidades cobertas (Prompt 1)
- Disciplina, ano/série

**Estrutura do Prompt:**

```
CONTEXTO:
Você é um especialista em elaboração de atividades pedagógicas. Sua tarefa é
criar exercícios de revisão baseados no conteúdo ESPECÍFICO trabalhado na aula.

DISCIPLINA: {disciplina}
ANO/SÉRIE: {ano}

CONTEÚDO DA AULA:
{resumo_conteudo}

HABILIDADES COBERTAS:
{lista_habilidades}

TRANSCRIÇÃO DA AULA (trechos relevantes):
{trechos_transcricao}

TAREFA:
Criar 3-5 exercícios de revisão que:

1. SEJAM CONTEXTUAIS
   - Usem exemplos/contextos SIMILARES aos usados na aula
   - Não sejam genéricos de banco de questões
   - Exemplo: Se professor usou "pizza" para fração, exercícios devem usar
     contextos de alimentos

2. VARIEM EM COMPLEXIDADE (Taxonomia de Bloom)
   - Pelo menos 1 questão de Compreender (nível 2)
   - Pelo menos 1 questão de Aplicar (nível 3)
   - Opcional: 1 questão de Analisar (nível 4)

3. SEJAM ADEQUADOS À SÉRIE
   - {ano}: [inserir características cognitivas]
   - Linguagem clara e apropriada

4. INCLUAM GABARITO COMENTADO
   - Resposta correta
   - Passo a passo da resolução
   - Explicação pedagógica

FORMATO DOS EXERCÍCIOS:

Para MATEMÁTICA:
- Problemas contextualizados
- Variação de complexidade
- Incluir resolução passo a passo

Para LÍNGUA PORTUGUESA:
- Interpretação de texto (usar trecho trabalhado em aula, se houver)
- Análise linguística (gramática contextualizada)
- Produção textual (gêneros trabalhados)

Para CIÊNCIAS:
- Questões conceituais (compreensão)
- Aplicação em situações reais
- Análise de situações-problema

OUTPUT ESPERADO (JSON):
{
  "exercicios": [
    {
      "numero": 1,
      "tipo": "Aplicação",
      "nivel_bloom": 3,
      "enunciado": "Na aula de hoje, resolvemos equações usando o método da
                   balança. Resolva a equação abaixo usando o mesmo método:\n
                   3x + 5 = 20",
      "contexto_da_aula": "Professor usou analogia da balança em equilíbrio",
      "habilidade_bncc": "EF07MA18",
      "gabarito": {
        "resposta_curta": "x = 5",
        "resolucao_passo_a_passo": [
          "1. Subtrair 5 de ambos os lados: 3x + 5 - 5 = 20 - 5",
          "2. Simplificar: 3x = 15",
          "3. Dividir ambos os lados por 3: 3x ÷ 3 = 15 ÷ 3",
          "4. Resultado: x = 5"
        ],
        "explicacao": "Usamos as propriedades da igualdade (o que faz de um
                      lado, faz do outro) para isolar a variável, mantendo
                      a 'balança' equilibrada."
      }
    },
    {
      "numero": 2,
      "tipo": "Compreensão",
      "nivel_bloom": 2,
      "enunciado": "Explique com suas palavras: por que podemos subtrair o
                   mesmo número de ambos os lados de uma equação sem mudar
                   a solução?",
      "contexto_da_aula": "Conceito trabalhado na explicação da balança",
      "habilidade_bncc": "EF07MA18",
      "gabarito": {
        "resposta_esperada": "Porque uma equação representa uma igualdade.
                             Se subtraímos o mesmo valor dos dois lados,
                             mantemos a igualdade, assim como uma balança
                             continua equilibrada se tirarmos o mesmo peso
                             dos dois pratos.",
        "criterios_avaliacao": [
          "Menciona o conceito de igualdade",
          "Relaciona com a analogia da balança",
          "Explica com palavras próprias"
        ]
      }
    }
  ],
  "observacoes_para_professor": "Exercícios criados a partir do conteúdo da
                                aula de hoje. Sugestão: aplicar como atividade
                                de casa ou revisão na próxima aula.",
  "tempo_estimado": "15-20 minutos"
}

IMPORTANTE:
- Exercícios devem ser REVISÃO, não conteúdo novo
- Use vocabulário e contextos da aula
- Gabarito deve ser pedagógico (ensina, não apenas responde)
- Varie os tipos de questão
```

**Configurações do modelo:**
- Temperature: 0.6 (criatividade moderada)
- Max tokens: 2000

---

### 4.5 PROMPT 5: Detecção de Alertas e Sugestões

**Objetivo:** Gerar insights acionáveis para o professor sobre gaps e oportunidades.

**Input:**
- Todos os outputs anteriores
- Planejamento bimestral completo
- Histórico de aulas anteriores (se disponível)

**Estrutura do Prompt:**

```
CONTEXTO:
Você é um assistente pedagógico que identifica padrões e gera insights
acionáveis para professores. Seu objetivo é ajudar, nunca criticar.

DADOS DA AULA ATUAL:
{output_prompt_1}
{output_prompt_2}

PLANEJAMENTO BIMESTRAL:
{planejamento_completo}

HISTÓRICO (últimas 5 aulas):
{historico_aulas}

CONTEXTO TEMPORAL:
- Semana {semana_atual} de {total_semanas} do bimestre
- {dias_restantes} dias letivos até o fim do bimestre

TAREFA:
Identificar e gerar alertas sobre:

1. GAPS DE CONTEÚDO
   - Habilidades planejadas não cobertas
   - Conteúdo atrasado em relação ao cronograma
   - Prioridades para próximas aulas

2. SINAIS DE DIFICULDADE
   - Conceitos que geraram muitas dúvidas
   - Baixo engajamento em tópicos específicos
   - Necessidade de revisão

3. OPORTUNIDADES
   - Conceitos que podem ser aprofundados
   - Conexões com outras habilidades
   - Sugestões metodológicas

CRITÉRIOS PARA ALERTAS:

ALERTA DE GAP (prioridade ALTA):
- < 50% do bimestre coberto com > 70% do tempo passado
- Habilidade planejada não tocada em 3+ aulas consecutivas

ALERTA DE DIFICULDADE (prioridade MÉDIA):
- Professor repetiu explicação >3x sem reformular
- >30% dos alunos com dúvida no mesmo ponto
- Silêncio prolongado após pergunta conceitual

SUGESTÃO DE APROFUNDAMENTO (prioridade BAIXA):
- Conceito bem recebido, alto engajamento
- Conexão natural com habilidade avançada

OUTPUT ESPERADO (JSON):
{
  "alertas": [
    {
      "tipo": "gap_conteudo",
      "prioridade": "alta",
      "titulo": "Conteúdo de Sistemas de Equações não iniciado",
      "descricao": "Habilidade EF07MA30 estava planejada para as semanas 5-6.
                   Estamos na semana 7 e o conteúdo ainda não foi iniciado.",
      "impacto": "Risco de não cumprir planejamento do bimestre",
      "acao_sugerida": "Considere dedicar as próximas 2-3 aulas a este conteúdo,
                       priorizando sobre aprofundamento de equações simples."
    },
    {
      "tipo": "dificuldade",
      "prioridade": "média",
      "titulo": "Dificuldade recorrente em isolar variável",
      "descricao": "Em 3 das últimas 4 aulas, alunos demonstraram dificuldade
                   em aplicar propriedades da igualdade para isolar variável.",
      "impacto": "Pode comprometer aprendizagem de sistemas de equações",
      "acao_sugerida": "Sugiro atividade de reforço focada em propriedades da
                       igualdade antes de avançar. Considere usar jogos ou
                       atividades manipuláveis (balança real, por exemplo)."
    }
  ],
  "oportunidades": [
    {
      "tipo": "aprofundamento",
      "titulo": "Alto interesse em aplicações práticas",
      "descricao": "Alunos fizeram várias perguntas sobre 'onde usar isso na
                   vida real'. Engajamento alto quando contextos práticos
                   foram apresentados.",
      "sugestao": "Considere trazer problemas de contextos reais (finanças,
                  física, engenharia) nas próximas aulas. Pode aumentar
                  motivação e retenção."
    }
  ],
  "sugestoes_proxima_aula": [
    "Iniciar com revisão rápida (5min) de isolar variável",
    "Introduzir sistemas de equações com problema contextual",
    "Reservar 10min para exercícios práticos"
  ],
  "progresso_bimestre": {
    "percentual_conteudo_coberto": 45,
    "percentual_tempo_decorrido": 70,
    "ritmo": "atrasado",
    "acao_necessaria": "Acelerar cobertura ou ajustar planejamento"
  }
}

TOM E LINGUAGEM:
- Use linguagem colaborativa ("Considere...", "Sugestão:...")
- NUNCA use linguagem crítica ("Você falhou...", "Erro...")
- Foque em ações futuras, não em problemas passados
- Seja específico e acionável
- Tom: Colega pedagógico prestativo, não avaliador

IMPORTANTE:
- Priorize alertas acionáveis (o que fazer) sobre diagnósticos (o que aconteceu)
- Máximo 3 alertas por aula (não sobrecarregar)
- Toda sugestão deve ter contexto + ação concreta
```

**Configurações do modelo:**
- Temperature: 0.5
- Max tokens: 1500

---

## 5. Critérios de Qualidade do Output

### 5.1 O Que É um "Relatório 90% Aproveitável"

**Definição operacional:**

Um relatório é considerado 90% aproveitável quando o professor:
- Lê o relatório gerado
- Reconhece que é fiel à aula dada
- Faz no máximo 2-3 ajustes pequenos (adicionar nome de aluno, ajustar termo específico)
- **NÃO precisa** reescrever seções inteiras

**Critérios mensuráveis:**

| Critério | Meta | Como Medir |
|----------|------|------------|
| **Taxa de aprovação** | >80% | % de relatórios aprovados sem edição no sistema |
| **Tempo de revisão** | <5 minutos | Medido no sistema (tempo entre geração e aprovação) |
| **Número de edições** | <3 por relatório | Tracked via diff do texto |
| **NPS do professor** | >30 | Pesquisa trimestral: "Recomendaria o sistema?" |
| **Taxa de uso contínuo** | >70% após 30 dias | % professores ativos semanalmente |

### 5.2 Dimensões de Qualidade

#### A) Fidelidade à Aula

**Bom:**
> "Trabalhamos equações do 1º grau. Professor explicou o método da balança
> em equilíbrio, resolveu 3 exemplos (2x+5=11, 3x-7=8, 4x+3=19) e propôs
> exercícios da página 42."

**Ruim:**
> "A aula abordou equações de primeiro grau de forma dinâmica e interativa."

**Critério:** Relatório deve ser verificável pela transcrição. Informação específica > adjetivos genéricos.

#### B) Objetividade

**Bom:**
> "5 alunos participaram com perguntas. Maria perguntou sobre sinais negativos.
> Pedro propôs método alternativo."

**Ruim:**
> "Turma muito participativa e engajada."

**Critério:** Dados quantificáveis e exemplos concretos > impressões subjetivas.

#### C) Utilidade Profissional

**Bom:**
> "Observou-se dificuldade recorrente em aplicar propriedades da igualdade
> (3 alunos erraram na mesma etapa). Sugestão: reforçar este ponto antes de
> avançar para sistemas."

**Ruim:**
> "Alguns alunos tiveram dificuldade."

**Critério:** Informação acionável que ajuda na tomada de decisão pedagógica.

#### D) Tom Profissional

**Bom:**
> "Metodologia expositiva dialogada com resolução de exercícios. Participação
> ativa dos alunos."

**Ruim:**
> "Aula incrível! Professor foi super didático e carismático!"

**Critério:** Tom formal, descritivo, sem julgamentos de valor excessivos.

#### E) Completude

**Checklist:**
- [ ] Conteúdo trabalhado especificado
- [ ] Metodologia descrita
- [ ] Participação dos alunos mencionada
- [ ] Recursos utilizados listados
- [ ] Observações relevantes incluídas

**Critério:** Relatório cobre todas as seções esperadas sem seções vazias ou "N/A" excessivos.

### 5.3 Red Flags de Baixa Qualidade

| Red Flag | Exemplo | Por Que É Problema |
|----------|---------|-------------------|
| **Adjetivação excessiva** | "Aula excelente, muito produtiva" | Subjetivo, não informativo |
| **Vagueza** | "Trabalhamos vários tópicos" | Não especifica o que foi feito |
| **Informação falsa** | Cita nome de aluno não na transcrição | Quebra confiança |
| **Trechos genéricos** | "Aula dinâmica e interativa" | Poderia ser de qualquer aula |
| **Falta de evidências** | "Alunos entenderam bem" | Não diz como foi verificado |
| **Tom inadequado** | "Turma desinteressada" | Crítico, não construtivo |
| **Omissões críticas** | Não menciona conteúdo planejado não coberto | Professor perde informação importante |

---

## 6. Métricas de Avaliação de Qualidade

### 6.1 Métricas Imediatas (Por Aula)

| Métrica | Fórmula | Fonte de Dados | Threshold |
|---------|---------|----------------|-----------|
| **Taxa de aprovação** | Relatórios aprovados / Total gerado | Sistema | >80% |
| **Tempo de revisão** | Tempo entre geração e aprovação | Sistema | <5 min |
| **Número de edições** | Diff entre gerado e aprovado | Sistema | <3 edições |
| **Taxa de rejeição** | Relatórios descartados / Total | Sistema | <5% |

### 6.2 Métricas Agregadas (Mensal/Trimestral)

| Métrica | Fórmula | Fonte | Meta |
|---------|---------|-------|------|
| **NPS do Professor** | Promotores - Detratores | Pesquisa | >30 |
| **Taxa de uso contínuo** | Professores ativos mês N / Professores mês N-1 | Sistema | >90% |
| **Redução de tempo** | Tempo antes - Tempo depois | Pesquisa | >1h/semana |
| **Satisfação com exercícios** | % exercícios usados sem edição | Sistema | >70% |
| **Satisfação com alertas** | Alertas marcados como úteis / Total | Sistema | >60% |

### 6.3 Métricas de Qualidade da IA

| Dimensão | Métrica | Como Medir | Meta |
|----------|---------|------------|------|
| **Cobertura BNCC** | Precisão na identificação de habilidades | Validação manual (amostra) | >85% |
| **Nível de cobertura** | Concordância nível IA vs. humano | Validação manual | >80% |
| **Evidências textuais** | % evidências literais vs. parafraseadas | Review automático | >90% literais |
| **Detecção de engajamento** | Concordância com observação humana | Validação | >75% |
| **Qualidade dos exercícios** | % aprovados sem edição | Sistema | >70% |

### 6.4 Métricas de Impacto (Longo Prazo)

| KPI | Descrição | Meta MVP |
|-----|-----------|----------|
| **Adoção** | % professores usando semanalmente | >70% após 30 dias |
| **Retenção de escola** | % escolas renovando após piloto | >80% |
| **Redução de trabalho manual** | Horas economizadas/professor/semana | >1.5h |
| **ROI percebido** | % coordenadores/donos que veem valor | >75% |

---

## 7. Feedback Loop e Melhoria Contínua

### 7.1 Sistema de Coleta de Feedback

**Feedback Implícito (Automático):**

```
┌─────────────────────────────────────────────┐
│ AÇÕES DO PROFESSOR NO SISTEMA              │
├─────────────────────────────────────────────┤
│                                             │
│  ✓ Aprovar relatório sem editar            │
│    → Signal: Qualidade alta                 │
│                                             │
│  ✏ Editar e aprovar                         │
│    → Capturar: Diff do que foi mudado       │
│    → Learn: Que seções precisam melhorar    │
│                                             │
│  ✗ Rejeitar relatório                       │
│    → Trigger: Solicitar feedback explícito  │
│                                             │
│  ⏱ Tempo de revisão                         │
│    → <2min: Relatório muito bom             │
│    → >10min: Relatório problemático         │
│                                             │
└─────────────────────────────────────────────┘
```

**Feedback Explícito (Solicitado):**

1. **Após aprovação:**
   - "Este relatório estava aproveitável?" (👍 / 👎)
   - Se 👎: "O que precisou ser corrigido?" (múltipla escolha)

2. **Mensal:**
   - "Como avalia a qualidade dos relatórios este mês?" (1-5)
   - "Quanto tempo está economizando por semana?" (input)

3. **Trimestral:**
   - NPS: "Recomendaria o sistema para colegas?" (0-10)
   - "O que mais ajuda?" (texto livre)
   - "O que precisa melhorar?" (texto livre)

### 7.2 Pipeline de Análise de Feedback

```
┌──────────────────────────────────────────────────────────┐
│                 FEEDBACK ANALYSIS PIPELINE               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  COLETA                                                  │
│  ├─ Feedback implícito (logs, diffs, tempos)            │
│  └─ Feedback explícito (pesquisas)                      │
│         │                                                │
│         ▼                                                │
│  AGREGAÇÃO                                               │
│  ├─ Por professor (identificar outliers)                │
│  ├─ Por disciplina (padrões específicos)                │
│  ├─ Por escola (diferenças culturais)                   │
│  └─ Por tipo de erro (categorização)                    │
│         │                                                │
│         ▼                                                │
│  ANÁLISE                                                 │
│  ├─ Identificar padrões de falha recorrentes            │
│  ├─ Priorizar por impacto (quantos professores afetados)│
│  └─ Correlação com métricas de retenção                 │
│         │                                                │
│         ▼                                                │
│  AÇÃO                                                    │
│  ├─ Ajuste de prompts (A/B testing)                     │
│  ├─ Refinamento de regras de validação                  │
│  ├─ Atualização de exemplos few-shot                    │
│  └─ Treinamento de modelo fine-tuned (longo prazo)      │
│         │                                                │
│         ▼                                                │
│  MEDIÇÃO                                                 │
│  └─ Comparar métricas antes/depois                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 7.3 Categorização de Edições

Quando professor edita relatório, classificar automáticamente:

| Categoria | Exemplo | Prioridade Correção |
|-----------|---------|---------------------|
| **Factual** | IA disse "3 exemplos", professor corrige "2 exemplos" | Alta |
| **Tom** | IA: "Turma desinteressada" → "Turma silenciosa" | Alta |
| **Adição de detalhe** | Professor adiciona nome de aluno | Média |
| **Estilo** | Reformulação sem mudar sentido | Baixa |
| **Omissão** | Professor remove seção inteira | Alta |

### 7.4 Processo de Atualização de Prompts

**Ciclo de Melhoria Contínua:**

```
SEMANA 1-2: Coletar dados
  ├─ Mínimo 50 aulas processadas
  └─ Mínimo 30 relatórios aprovados/editados

SEMANA 3: Análise
  ├─ Identificar top 3 problemas recorrentes
  ├─ Quantificar impacto (% professores afetados)
  └─ Priorizar por impacto × facilidade de correção

SEMANA 4: Experimentação
  ├─ Criar versão alternativa do prompt
  ├─ A/B test: 50% users versão A, 50% versão B
  └─ Coletar métricas por 1-2 semanas

SEMANA 5-6: Decisão
  ├─ Comparar métricas A vs B
  ├─ Se B > A: rollout 100%
  └─ Documentar mudança + resultado

Repeat
```

**Critérios para Rollout:**

| Métrica | Threshold para Adoção |
|---------|----------------------|
| Taxa de aprovação | +5% vs. baseline |
| Tempo de revisão | -1 min vs. baseline |
| NPS | +10 pontos vs. baseline |
| Sem regressão | Nenhuma métrica piora >2% |

---

## 8. Exemplos e Templates

### 8.1 Exemplo de BOM Relatório (Matemática 7º Ano)

```markdown
# RELATÓRIO DE AULA

**Disciplina:** Matemática
**Turma:** 7º ano B
**Data:** 08/02/2026
**Professor(a):** João Silva

## 1. CONTEÚDO TRABALHADO

- Equações polinomiais do 1º grau (habilidade EF07MA18)
- Propriedades da igualdade aplicadas à resolução de equações
- Método da balança em equilíbrio como modelo visual

## 2. METODOLOGIA

Aula expositiva dialogada seguida de resolução de exercícios. Professor utilizou
analogia da balança em equilíbrio para explicar propriedades da igualdade,
resolveu 3 exemplos no quadro (2x+5=11, 3x-7=8, 4x+3=19) e propôs exercícios
1 a 5 da página 42 da apostila.

## 3. PARTICIPAÇÃO DOS ALUNOS

5 alunos participaram ativamente com perguntas. Maria questionou sobre como
proceder quando o coeficiente da variável é negativo. Pedro propôs método
alternativo de resolução testando valores. João perguntou sobre aplicação prática
de equações. Turma demonstrou interesse quando contextos do cotidiano foram
apresentados.

Observou-se dificuldade recorrente em 3 alunos ao aplicar propriedades da
igualdade para isolar a variável (confusão entre adicionar e subtrair).

## 4. RECURSOS UTILIZADOS

- Quadro branco
- Apostila (Sistema Positivo)
- Projetor (slides com imagem de balança)

## 5. AVALIAÇÃO

Exercícios 1 a 5 da página 42 propostos para resolução em sala. Alunos
iniciaram, 4 questões foram corrigidas coletivamente. Exercício 5 ficou como
atividade de casa.

Verificação de compreensão realizada através de perguntas orais durante
resolução dos exemplos.

## 6. OBSERVAÇÕES

Alunos Marcos e Felipe faltaram.

Professor percebeu que a dificuldade em isolar variável pode comprometer o
aprendizado de sistemas de equações (próximo conteúdo). Considerando dedicar
primeira parte da próxima aula para reforço deste ponto.

## 7. PRÓXIMA AULA

Revisão de propriedades da igualdade (10 min) + introdução a sistemas de
equações com 2 incógnitas.
```

**Por que este relatório é BOM:**
- ✅ Objetivo e específico (cita números, exemplos concretos)
- ✅ Fiel à aula (informações verificáveis)
- ✅ Útil pedagogicamente (identifica dificuldade + propõe ação)
- ✅ Profissional (tom neutro, sem julgamentos)
- ✅ Completo (todas as seções preenchidas)

---

### 8.2 Exemplo de RELATÓRIO RUIM (o que evitar)

```markdown
# RELATÓRIO DE AULA

**Disciplina:** Matemática
**Turma:** 7º ano B
**Data:** 08/02/2026
**Professor(a):** João Silva

## 1. CONTEÚDO TRABALHADO

- Equações

## 2. METODOLOGIA

Aula muito dinâmica e interativa com metodologia inovadora.

## 3. PARTICIPAÇÃO DOS ALUNOS

A turma esteve muito participativa e engajada. Foi uma aula excelente.

## 4. RECURSOS UTILIZADOS

Os recursos foram adequados.

## 5. AVALIAÇÃO

Alguns exercícios foram propostos.

## 6. OBSERVAÇÕES

Alguns alunos tiveram dificuldade, mas no geral foi muito bom.

## 7. PRÓXIMA AULA

Continuação do conteúdo.
```

**Por que este relatório é RUIM:**
- ❌ Vago ("Equações" - qual tipo? qual habilidade?)
- ❌ Adjetivação vazia ("dinâmica", "inovadora" sem especificar)
- ❌ Não verificável (não há dados concretos)
- ❌ Não útil (zero informação acionável)
- ❌ Genérico (poderia ser de qualquer aula)

---

### 8.3 Template de Exercícios - Matemática

```json
{
  "exercicios": [
    {
      "numero": 1,
      "tipo": "Compreensão",
      "nivel_bloom": 2,
      "enunciado": "Na aula de hoje usamos a analogia da balança para explicar \
                   equações. Explique com suas palavras: por que, ao resolver \
                   2x + 5 = 11, podemos subtrair 5 de ambos os lados?",
      "habilidade_bncc": "EF07MA18",
      "gabarito": {
        "resposta_esperada": "Porque uma equação é uma igualdade. Se subtraímos \
                             o mesmo valor dos dois lados, mantemos a igualdade, \
                             assim como uma balança continua equilibrada se \
                             tirarmos o mesmo peso dos dois pratos.",
        "criterios_avaliacao": [
          "Menciona conceito de igualdade",
          "Relaciona com balança",
          "Usa palavras próprias"
        ]
      }
    },
    {
      "numero": 2,
      "tipo": "Aplicação",
      "nivel_bloom": 3,
      "enunciado": "Resolva a equação usando o método da balança visto em aula:\n\
                   3x + 7 = 22",
      "habilidade_bncc": "EF07MA18",
      "gabarito": {
        "resposta_curta": "x = 5",
        "resolucao_passo_a_passo": [
          "1. Subtrair 7 de ambos os lados: 3x + 7 - 7 = 22 - 7",
          "2. Simplificar: 3x = 15",
          "3. Dividir ambos os lados por 3: 3x ÷ 3 = 15 ÷ 3",
          "4. Resultado: x = 5",
          "5. Verificação: 3(5) + 7 = 15 + 7 = 22 ✓"
        ]
      }
    },
    {
      "numero": 3,
      "tipo": "Aplicação Contextualizada",
      "nivel_bloom": 3,
      "enunciado": "João tem x reais. Ele ganhou 15 reais de mesada e agora tem \
                   42 reais. Escreva a equação que representa essa situação e \
                   resolva para descobrir quanto João tinha antes.",
      "habilidade_bncc": "EF07MA18",
      "gabarito": {
        "equacao": "x + 15 = 42",
        "resposta": "x = 27 reais",
        "resolucao": [
          "1. Equação: x + 15 = 42 (tinha x, ganhou 15, ficou com 42)",
          "2. Subtrair 15: x + 15 - 15 = 42 - 15",
          "3. x = 27",
          "4. João tinha 27 reais antes da mesada"
        ]
      }
    }
  ]
}
```

---

### 8.4 Template de Exercícios - Língua Portuguesa

```json
{
  "exercicios": [
    {
      "numero": 1,
      "tipo": "Interpretação de texto",
      "nivel_bloom": 2,
      "enunciado": "Leia o trecho do conto lido em sala:\n\n\
                   'O menino olhou pela janela e viu o céu escuro se aproximar. \
                   Um calafrio percorreu suas costas.'\n\n\
                   Que sentimento o autor quis transmitir neste trecho?",
      "habilidade_bncc": "EF69LP47",
      "gabarito": {
        "resposta_esperada": "Medo, apreensão ou tensão",
        "justificativa": "As expressões 'céu escuro se aproximar' e 'calafrio' \
                         indicam que algo ameaçador está por vir e que o personagem \
                         está com medo.",
        "criterios": [
          "Identifica emoção negativa (medo/apreensão)",
          "Relaciona com elementos do texto (escuro, calafrio)",
          "Justifica interpretação"
        ]
      }
    },
    {
      "numero": 2,
      "tipo": "Análise linguística",
      "nivel_bloom": 4,
      "enunciado": "No trecho 'O céu escuro se aproximar', identifique a classe \
                   gramatical de cada palavra e explique o efeito do uso do \
                   verbo 'aproximar' (em vez de 'aproximava').",
      "habilidade_bncc": "EF07LP08",
      "gabarito": {
        "classificacao": {
          "O": "artigo",
          "céu": "substantivo",
          "escuro": "adjetivo",
          "se aproximar": "verbo (infinitivo)"
        },
        "efeito_do_infinitivo": "O uso do infinitivo ('aproximar' em vez de \
                                'aproximava') dá ideia de ação contínua e \
                                inevitável, aumentando a tensão.",
        "criterios": ["Classifica corretamente", "Explica efeito de sentido"]
      }
    }
  ]
}
```

---

### 8.5 Template de Exercícios - Ciências

```json
{
  "exercicios": [
    {
      "numero": 1,
      "tipo": "Compreensão conceitual",
      "nivel_bloom": 2,
      "enunciado": "Na aula de hoje estudamos a estrutura celular. Explique a \
                   função da membrana plasmática usando a analogia da 'parede \
                   da casa' que vimos em aula.",
      "habilidade_bncc": "EF06CI05",
      "gabarito": {
        "resposta_esperada": "A membrana plasmática funciona como a parede de uma \
                             casa: delimita o espaço da célula (separa o que está \
                             dentro do que está fora) e controla a entrada e saída \
                             de substâncias (como portas e janelas controlam quem \
                             entra e sai).",
        "criterios": [
          "Menciona delimitação/separação",
          "Menciona controle de entrada/saída",
          "Usa analogia da aula"
        ]
      }
    },
    {
      "numero": 2,
      "tipo": "Análise de situação",
      "nivel_bloom": 4,
      "enunciado": "Imagine que uma célula está em um ambiente com MUITA água. \
                   O que você acha que acontece com a membrana plasmática? \
                   Ela deixa a água entrar? O que pode acontecer com a célula?",
      "habilidade_bncc": "EF06CI05",
      "gabarito": {
        "resposta": "A membrana é semipermeável, então a água pode entrar por \
                    osmose. Se entrar muita água, a célula pode inchar e até \
                    estourar (lise celular).",
        "conceitos_envolvidos": ["Osmose", "Permeabilidade seletiva", "Lise"],
        "criterios": [
          "Identifica que água entra",
          "Menciona possibilidade de célula inchar",
          "Bonus: usa termo 'osmose'"
        ]
      }
    }
  ]
}
```

---

## 9. Casos Especiais e Edge Cases

### 9.1 Aula com Baixo Áudio / Transcrição Parcial

**Problema:** Transcrição tem muitos "[inaudível]" ou está incompleta.

**Estratégia:**

```python
if transcricao.count("[inaudível]") > 10 or len(transcricao) < 500:
    # Modo de análise limitada
    prompt_modificado = """
    ATENÇÃO: Esta transcrição está PARCIAL ou com problemas de áudio.

    - Analise APENAS o que está claramente audível
    - Marque incertezas com "Possível:" ou "Provável:"
    - Na seção de observações, informe: "Transcrição parcial pode ter
      limitado a análise. Recomenda-se revisão manual."
    - NÃO faça suposições sobre trechos inaudíveis
    """
```

**Output esperado:**
```markdown
## 6. OBSERVAÇÕES

⚠ **Atenção:** Transcrição apresentou trechos inaudíveis (áudio com ruído).
Análise pode estar incompleta. Recomenda-se complementar observações manualmente.

Conteúdo identificado: equações do 1º grau (confirmado).
Metodologia: Possível uso de exercícios (mencionado, mas detalhes inaudíveis).
```

---

### 9.2 Aula Fora do Planejamento

**Problema:** Professor deu aula sobre conteúdo não planejado (revisão de emergência, atividade especial).

**Estratégia:**

```
DETECÇÃO:
if cobertura_habilidades_planejadas < 30%:
    # Possível aula off-plan

PROMPT ADICIONAL:
"ATENÇÃO: Esta aula cobriu conteúdo significativamente diferente do planejamento.
- Identifique habilidades BNCC trabalhadas (mesmo que não planejadas)
- Na seção de observações, destaque o desvio do plano
- Não critique, apenas documente objetivamente"
```

**Output esperado:**
```markdown
## 6. OBSERVAÇÕES

Esta aula diferiu do planejamento bimestral. Conteúdo planejado era "Sistemas
de equações", mas a aula focou em "Revisão de frações" (habilidade EF06MA07).

Motivo identificado: Professor mencionou "dificuldade da turma em exercícios
anteriores" e decidiu revisar.

Impacto no planejamento: Conteúdo de sistemas de equações não iniciado.
Sugestão: ajustar cronograma das próximas aulas.
```

---

### 9.3 Língua Portuguesa com Blocos Compartilhados

**Problema:** Habilidades LP de blocos EF67LP, EF69LP, EF89LP aplicam-se a múltiplos anos.

**Estratégia:**

```
No prompt de análise de cobertura, incluir:

"ATENÇÃO - LÍNGUA PORTUGUESA:
Habilidades com código EF67LP aplicam-se a 6º E 7º anos.
Habilidades com código EF69LP aplicam-se a 6º, 7º, 8º E 9º anos.
Habilidades com código EF89LP aplicam-se a 8º E 9º anos.

Ao analisar aula de {ano}, considere TODAS as habilidades aplicáveis:
- Específicas do ano (EF{ano}LP)
- Blocos compartilhados que incluem este ano

Exemplo: Aula de 7º ano deve considerar:
- EF07LP01-XX (específicas de 7º)
- EF67LP01-XX (compartilhadas 6º-7º)
- EF69LP01-XX (compartilhadas 6º-9º)
"
```

---

### 9.4 Múltiplas Habilidades na Mesma Aula

**Problema:** Aula interdisciplinar ou que trabalha múltiplas habilidades simultaneamente.

**Estratégia:**

```json
{
  "analise_cobertura": [
    {
      "habilidade_codigo": "EF07MA18",
      "nivel_cobertura": 3,
      "tempo_estimado_minutos": 20
    },
    {
      "habilidade_codigo": "EF07MA17",
      "nivel_cobertura": 2,
      "tempo_estimado_minutos": 15,
      "relacao_com_outras": "Trabalhada em conjunto com EF07MA18. Ambas
                            envolvem conceito de variável."
    }
  ],
  "observacoes_gerais": "Aula integrou duas habilidades de forma natural.
                        Abordagem interdisciplinar eficaz."
}
```

---

## 10. Impacto nos Outros Artefatos

### 10.1 Impacto no PRD (Product Requirements Document)

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **RF-IA-01** | Pipeline de 5 prompts especializados | P0 (MVP) |
| **RF-IA-02** | Análise de cobertura curricular com níveis 0-3 | P0 (MVP) |
| **RF-IA-03** | Geração de relatório formatado (template configurável) | P0 (MVP) |
| **RF-IA-04** | Geração de 3-5 exercícios contextuais por aula | P0 (MVP) |
| **RF-IA-05** | Detecção de alertas (gaps, dificuldades, sugestões) | P0 (MVP) |
| **RF-IA-06** | Sistema de feedback implícito (diffs, tempo revisão) | P0 (MVP) |
| **RF-IA-07** | Análise pedagógica qualitativa (Bloom, metodologia) | P0 (MVP) |
| **RF-IA-08** | Modo degradado para transcrições parciais | P1 (Pós-MVP) |
| **RF-IA-09** | A/B testing de prompts | P1 (Pós-MVP) |
| **RF-IA-10** | Fine-tuning de modelo custom | P2 (V2) |

**Requisitos Não-Funcionais:**

| ID | Requisito | Meta |
|----|-----------|------|
| **RNF-IA-01** | Tempo de processamento | <5 minutos para aula de 50min |
| **RNF-IA-02** | Taxa de aprovação de relatórios | >80% sem edição significativa |
| **RNF-IA-03** | Custo de IA por aula | <R$0,50 |
| **RNF-IA-04** | Disponibilidade do serviço | >99% |
| **RNF-IA-05** | Qualidade de evidências textuais | >90% literais (não parafraseadas) |

---

### 10.2 Impacto na Architecture

**Componentes Arquiteturais:**

```
┌──────────────────────────────────────────────────────┐
│                  CAMADA DE APLICAÇÃO                  │
├──────────────────────────────────────────────────────┤
│  Web API (FastAPI/Django)                            │
│  ├─ Upload de transcrição                            │
│  ├─ Gestão de planejamento                           │
│  ├─ Aprovação de relatórios                          │
│  └─ Dashboard                                        │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│               CAMADA DE PROCESSAMENTO                 │
├──────────────────────────────────────────────────────┤
│  Job Queue (Celery/RabbitMQ)                         │
│  └─ Processamento assíncrono de aulas                │
│                                                      │
│  AI Pipeline Orchestrator                            │
│  ├─ Prompt 1: Cobertura BNCC                        │
│  ├─ Prompt 2: Análise Qualitativa                   │
│  ├─ Prompt 3: Relatório                             │
│  ├─ Prompt 4: Exercícios                            │
│  └─ Prompt 5: Alertas                               │
│                                                      │
│  AI Provider Abstraction Layer                       │
│  ├─ OpenAI (GPT-4)                                  │
│  ├─ Anthropic (Claude)                              │
│  └─ Fallback: modelo secundário                     │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│                 CAMADA DE DADOS                       │
├──────────────────────────────────────────────────────┤
│  PostgreSQL                                          │
│  ├─ Habilidades BNCC                                │
│  ├─ Planejamentos                                   │
│  ├─ Aulas e transcrições                            │
│  ├─ Análises (outputs dos prompts)                  │
│  └─ Feedback (aprovações, edições, NPS)             │
│                                                      │
│  S3/Object Storage                                   │
│  ├─ Transcrições brutas                             │
│  ├─ Áudios originais                                │
│  └─ Logs de análise                                 │
└──────────────────────────────────────────────────────┘
```

**Decisões Arquiteturais:**

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| **Provider de IA** | Multi-provider com abstração | Evita vendor lock-in |
| **Processamento** | Assíncrono (queue) | Aula leva ~50min, análise pode levar 3-5min |
| **Armazenamento de prompts** | Versioned templates em DB | Permite A/B testing e rollback |
| **Cache** | Redis para outputs frequentes | Reduz custo de API |
| **Logs** | Structured logging de todos os prompts/responses | Debug e análise de qualidade |

---

### 10.3 Impacto em Epics & Stories

**Epic 1: Pipeline de Análise de IA**

| Story | Descrição | Critérios de Aceitação |
|-------|-----------|------------------------|
| **US-01** | Implementar Prompt 1 (Cobertura BNCC) | - Output JSON estruturado<br>- Níveis 0-3 identificados<br>- Evidências literais |
| **US-02** | Implementar Prompt 2 (Análise Qualitativa) | - 6 dimensões analisadas<br>- Score numérico por dimensão<br>- Observações textuais |
| **US-03** | Implementar Prompt 3 (Relatório) | - Template configurável<br>- 90% aproveitável (target)<br>- Markdown formatado |
| **US-04** | Implementar Prompt 4 (Exercícios) | - 3-5 exercícios<br>- Níveis Bloom variados<br>- Gabarito comentado |
| **US-05** | Implementar Prompt 5 (Alertas) | - Gaps identificados<br>- Sugestões acionáveis<br>- Priorização (alta/média/baixa) |
| **US-06** | Orquestrador de pipeline | - Execução serial com dependências<br>- Timeout handling<br>- Error recovery |
| **US-07** | Abstração multi-provider | - Suporta OpenAI e Anthropic<br>- Fallback automático<br>- Configuração por ambiente |

**Epic 2: Sistema de Qualidade e Feedback**

| Story | Descrição | Critérios de Aceitação |
|-------|-----------|------------------------|
| **US-08** | Captura de feedback implícito | - Log de aprovações<br>- Diff de edições<br>- Tempo de revisão |
| **US-09** | Feedback explícito pós-aprovação | - Thumbs up/down<br>- Motivo de edição (múltipla escolha)<br>- Armazenamento estruturado |
| **US-10** | Dashboard de métricas de qualidade | - Taxa de aprovação<br>- Tempo médio de revisão<br>- NPS agregado |
| **US-11** | Pipeline de análise de feedback | - Agregação por disciplina/escola<br>- Identificação de padrões<br>- Priorização de melhorias |

**Epic 3: Melhoria Contínua**

| Story | Descrição | Critérios de Aceitação |
|-------|-----------|------------------------|
| **US-12** | Versionamento de prompts | - Prompts em DB com versão<br>- Rollback possível<br>- Histórico de mudanças |
| **US-13** | A/B testing de prompts | - Split 50/50 de usuários<br>- Métricas por versão<br>- Decisão automatizada de rollout |
| **US-14** | Modo degradado (transcrição parcial) | - Detecção de qualidade<br>- Prompt alternativo<br>- Aviso no relatório |

---

## 11. Cronograma de Implementação

### Fase 1: MVP Core (Semanas 1-6)

| Semana | Atividades | Entregável |
|--------|-----------|------------|
| **1-2** | - Definir prompts finais com pedagogos<br>- Setup de pipeline básico | Prompts v1.0 documentados |
| **3** | - Implementar Prompts 1, 2, 3<br>- Testes com 10 transcrições reais | Pipeline básico funcionando |
| **4** | - Implementar Prompts 4, 5<br>- Orquestrador de pipeline | Pipeline completo |
| **5** | - Sistema de feedback implícito<br>- Métricas básicas | Feedback loop ativo |
| **6** | - Piloto com 3 professores<br>- Coleta de feedback intensiva | Relatório de qualidade |

### Fase 2: Refinamento (Semanas 7-10)

| Semana | Atividades | Entregável |
|--------|-----------|------------|
| **7-8** | - Análise de feedback do piloto<br>- Ajustes nos prompts | Prompts v1.1 |
| **9** | - Implementação de A/B testing<br>- Experimentos controlados | Framework de experimentação |
| **10** | - Expansão para 10 professores<br>- Validação de melhoria | Métricas comparativas |

### Fase 3: Escala (Semanas 11-12)

| Semana | Atividades | Entregável |
|--------|-----------|------------|
| **11** | - Otimização de custos<br>- Cache inteligente | Redução de 20% no custo |
| **12** | - Documentação final<br>- Rollout para escola inteira | Sistema production-ready |

---

## 12. Riscos e Mitigações Específicos de IA

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| **Custo de API escala mal** | Média | Alto | Processamento batch, cache, negociação de volume |
| **Viés da IA prejudica professores** | Baixa | Crítico | Validação com pedagogos, A/B testing, feedback loop |
| **Qualidade inconsistente** | Média | Alto | Prompts estruturados, validação automática, human-in-loop |
| **Vendor lock-in (OpenAI)** | Alta | Médio | Abstração multi-provider desde MVP |
| **Mudança de API/modelo** | Média | Médio | Versionamento, testes automatizados de regressão |
| **Alucinação (IA inventa dados)** | Média | Crítico | Evidências literais obrigatórias, validação de fidelidade |
| **Latência alta** | Baixa | Médio | Processamento assíncrono, expectativa de 3-5min |

---

## 13. Glossário Técnico

| Termo | Definição |
|-------|-----------|
| **Prompt** | Instrução textual enviada ao modelo de IA para gerar output |
| **Temperature** | Parâmetro de criatividade (0=determinístico, 1=criativo) |
| **Few-shot learning** | Técnica de fornecer exemplos no prompt para guiar output |
| **Taxonomia de Bloom** | Framework de 6 níveis cognitivos (Lembrar→Criar) |
| **Pipeline** | Sequência de processamentos (Prompt 1→2→3→4→5) |
| **Evidência textual** | Trecho literal da transcrição que comprova análise |
| **Token** | Unidade de texto processada pela IA (~4 chars em português) |
| **Habilidade BNCC** | Aprendizagem essencial identificada por código (ex: EF07MA18) |
| **Nível de cobertura** | Profundidade que habilidade foi trabalhada (0-3) |
| **Feedback implícito** | Dados coletados de ações (aprovação, edição) sem perguntar |
| **A/B testing** | Experimento com 2 versões para comparar performance |

---

## Referências

### Pedagógicas
- Anderson, L. W., & Krathwohl, D. R. (2001). *A Taxonomy for Learning, Teaching, and Assessing*
- BNCC - Base Nacional Comum Curricular (MEC, 2018)
- Zabala, A. (1998). *A Prática Educativa: Como Ensinar*

### Técnicas (IA)
- OpenAI. (2023). *GPT-4 Technical Report*
- Anthropic. (2024). *Constitutional AI: Harmlessness from AI Feedback*
- Wei, J. et al. (2022). *Chain-of-Thought Prompting Elicits Reasoning in Large Language Models*

### Documentos do Projeto
- Product Brief - Professor Analytics (2026-02-05)
- Mapeamento BNCC (2026-02-06)
- Brainstorming Session Results (2026-02-05)

---

**Versão:** 1.0
**Status:** Draft para Revisão
**Próximos Passos:**
1. Revisão com especialistas em educação
2. Validação técnica com equipe de dev
3. Testes com transcrições reais
4. Integração com PRD e Architecture
