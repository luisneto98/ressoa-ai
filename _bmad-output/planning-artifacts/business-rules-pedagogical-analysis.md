# Regras de Negócio e Lógica de Análise Pedagógica

**Projeto:** Professor Analytics
**Versão:** 1.0 (MVP)
**Data:** 2026-02-06
**Documentos-base:** Product Brief (2026-02-05), Brainstorming Session (2026-02-05)

---

## 1. Visão Geral

Este documento formaliza as regras de negócio que governam o motor de análise pedagógica do Professor Analytics. Define critérios objetivos para cálculos de métricas, classificação de gaps, thresholds de alertas, detecção de sinais de dificuldade, priorização de sugestões e validação de qualidade.

**Princípio fundamental:** "IA como LENTE, nunca como JUIZ" — todas as regras geram dados e contexto para decisão humana, nunca prescrevem ação sobre o professor.

---

## 2. Modelo de Dados de Entrada

### 2.1. Planejamento Bimestral (Input Obrigatório)

O planejamento bimestral é a **linha de base** contra a qual toda análise é feita.

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `serie` | Sim | Série/ano escolar (ex: 7º ano) |
| `disciplina` | Sim | Disciplina (ex: Matemática) |
| `bimestre` | Sim | Período (1º, 2º, 3º ou 4º bimestre) |
| `competencias_bncc` | Sim | Lista de competências da BNCC vinculadas |
| `topicos` | Sim | Lista de tópicos/conteúdos planejados para o período |
| `topicos[].nome` | Sim | Nome do tópico (ex: "Equações do 1º grau") |
| `topicos[].subtopicos` | Não | Detalhamento do tópico em subtópicos |
| `topicos[].peso` | Não | Peso relativo do tópico (default: distribuição uniforme) |
| `topicos[].aulas_previstas` | Não | Quantidade estimada de aulas para o tópico |
| `validado_por_coordenacao` | Sim | Flag indicando se a coordenação validou o planejamento |

**Regra RN-PLAN-01:** Planejamento não validado pela coordenação gera flag `PLANEJAMENTO_NAO_VALIDADO` visível para a coordenação, mas não bloqueia o uso do sistema pelo professor.

**Regra RN-PLAN-02:** Se o professor não informar pesos, o sistema distribui peso igualmente entre todos os tópicos: `peso = 1 / total_topicos`.

**Regra RN-PLAN-03:** Se o professor não informar `aulas_previstas`, o sistema estima com base no total de aulas do bimestre: `aulas_previstas = (total_aulas_bimestre × peso_topico)`.

### 2.2. Objetivo por Aula (Input Opcional — Nível 2)

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `topico_referencia` | Sim | Tópico do planejamento bimestral ao qual a aula se vincula |
| `objetivo_especifico` | Não | Descrição livre do objetivo da aula |
| `subtopicos_foco` | Não | Subtópicos específicos que serão abordados |

**Regra RN-PLAN-04:** O sistema funciona integralmente com apenas o Nível 1 (planejamento bimestral). O Nível 2 (objetivos por aula) refina a análise mas nunca é pré-requisito.

**Regra RN-PLAN-05:** Quando objetivos por aula estão presentes, a análise de cobertura compara a transcrição tanto com o planejamento bimestral (macro) quanto com o objetivo da aula (micro).

### 2.3. Transcrição da Aula (Input Principal)

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `texto_transcricao` | Sim | Texto transcrito da aula |
| `fonte` | Sim | Origem: `audio_upload`, `read_ai`, `manual`, `whisper`, `google_speech` |
| `duracao_informada_min` | Sim | Duração da aula em minutos (informada pelo professor ou extraída do áudio) |
| `duracao_transcricao_min` | Calculado | Duração estimada do conteúdo transcrito (calculada pelo sistema) |
| `data_aula` | Sim | Data da aula |
| `turma` | Sim | Turma vinculada |
| `professor` | Sim | Professor vinculado |

---

## 3. Cálculo de Progresso e Cobertura Curricular

### 3.1. Definições

- **Cobertura curricular (%):** Percentual de tópicos do planejamento bimestral que foram abordados em aulas transcritas.
- **Progresso temporal (%):** Percentual do bimestre já decorrido em dias letivos.
- **Delta de ritmo:** Diferença entre cobertura curricular e progresso temporal.

### 3.2. Algoritmo de Cobertura

Para cada tópico do planejamento bimestral, a IA classifica o **grau de cobertura** com base na análise semântica das transcrições acumuladas:

| Classificação | Código | Critério | Valor para Cálculo |
|---------------|--------|----------|---------------------|
| **Coberto** | `COVERED` | A IA identifica que o tópico foi abordado de forma substantiva — conceitos centrais explicados, exemplos dados, exercícios propostos ou discussão aprofundada presente na transcrição | 100% do peso |
| **Parcialmente coberto** | `PARTIAL` | O tópico foi mencionado ou abordado superficialmente — referência direta ao tema mas sem desenvolvimento completo dos conceitos centrais, ou apenas parte dos subtópicos foi coberta | 50% do peso |
| **Não coberto (gap)** | `GAP` | O tópico não aparece nas transcrições ou aparece apenas como menção incidental (ex: "na próxima aula vamos ver X") | 0% do peso |

**Regra RN-COV-01 (Fórmula de cobertura):**

```
cobertura_% = Σ (peso_topico × valor_classificacao) / Σ (peso_topico) × 100
```

Onde `valor_classificacao` é: COVERED = 1.0, PARTIAL = 0.5, GAP = 0.0

**Exemplo:**
- Planejamento com 4 tópicos de peso igual (0.25 cada)
- 2 cobertos, 1 parcial, 1 gap
- Cobertura = (0.25×1.0 + 0.25×1.0 + 0.25×0.5 + 0.25×0.0) / 1.0 × 100 = **62,5%**

### 3.3. Critérios de Classificação — GAP vs PARTIAL vs COVERED

A IA deve usar os seguintes critérios para classificar cada tópico:

#### COVERED (Coberto)

A transcrição demonstra **pelo menos 2 dos 4** sinais abaixo:

1. **Explicação conceitual:** O professor explica o conceito central do tópico com definições, propriedades ou fundamentos teóricos
2. **Exemplificação:** São apresentados exemplos concretos, problemas resolvidos ou demonstrações práticas
3. **Exercício/Prática:** O professor propõe exercícios, atividades ou práticas aos alunos sobre o tópico
4. **Discussão/Interação:** Há perguntas dos alunos, respostas do professor ou debate sobre o tópico indicando engajamento ativo

#### PARTIAL (Parcialmente Coberto)

A transcrição demonstra **exatamente 1 dos 4** sinais acima, OU:

- O tópico é abordado mas de forma superficial (menção sem aprofundamento)
- Apenas parte dos subtópicos previstos foi coberta (quando subtópicos estão definidos)
- O professor iniciou o tópico mas não concluiu (evidência de que continuará na próxima aula)
- A abordagem foi tangencial — o tópico apareceu como suporte para outro assunto, não como foco

#### GAP (Não Coberto)

- **Nenhum** dos 4 sinais está presente na transcrição, OU
- A única menção é prospectiva ("vamos ver isso na próxima aula", "isso fica pra semana que vem"), OU
- A única menção é retrospectiva genérica ("como vimos anteriormente") sem novo conteúdo

**Regra RN-COV-02:** A classificação é **cumulativa por tópico** ao longo do bimestre. Se um tópico foi `PARTIAL` na aula 3 e recebe mais conteúdo na aula 7 que satisfaz os critérios de `COVERED`, ele é reclassificado para `COVERED`.

**Regra RN-COV-03:** A IA deve fornecer **justificativa textual** para cada classificação, citando trechos da transcrição como evidência. Isso permite que o professor conteste ou confirme a análise.

### 3.4. Cálculo de Delta de Ritmo

```
progresso_temporal_% = (dias_letivos_decorridos / dias_letivos_totais_bimestre) × 100
delta_ritmo = cobertura_% - progresso_temporal_%
```

| Delta | Interpretação |
|-------|---------------|
| `>= 0` | No ritmo ou adiantado |
| `-1 a -10` | Levemente atrasado (zona de atenção) |
| `-11 a -20` | Atrasado (zona de risco) |
| `< -20` | Criticamente atrasado |

---

## 4. Thresholds de Alertas

### 4.1. Alertas de Cobertura Curricular

| Alerta | Condição | Severidade | Visível para | Ação Sugerida |
|--------|----------|------------|--------------|---------------|
| `COBERTURA_BAIXA` | Cobertura < 70% com progresso temporal > 50% | `WARNING` | Professor, Coordenador | "Turma {turma} em {disciplina} está com {cobertura}% de cobertura com {progresso}% do bimestre decorrido" |
| `COBERTURA_CRITICA` | Cobertura < 50% com progresso temporal > 60% | `CRITICAL` | Professor, Coordenador | "Turma {turma} em {disciplina} está com risco alto de não completar o planejamento — {cobertura}% coberto com {progresso}% do bimestre decorrido" |
| `RITMO_ATRASADO` | Delta de ritmo < -15 pontos percentuais | `WARNING` | Professor, Coordenador | "Ritmo de {turma} está {|delta|}pp abaixo do esperado para o período" |
| `TOPICO_ABANDONADO` | Tópico com status `GAP` e última menção > 3 aulas atrás | `INFO` | Professor | "Tópico '{topico}' não foi abordado nas últimas {n} aulas" |

**Regra RN-ALERT-01:** Alertas `CRITICAL` para coordenadores são consolidados semanalmente, não em tempo real, para evitar microgestão.

**Regra RN-ALERT-02:** Professor recebe alertas `INFO` e `WARNING` no relatório pós-aula. Alertas `CRITICAL` geram notificação separada.

**Regra RN-ALERT-03:** O coordenador **não recebe** transcrições brutas junto com alertas — apenas a métrica de cobertura, o delta de ritmo e a justificativa resumida da IA.

### 4.2. Alertas de Qualidade de Transcrição

| Alerta | Condição | Severidade | Visível para |
|--------|----------|------------|--------------|
| `TRANSCRICAO_CURTA` | `duracao_transcricao_min < 50%` da `duracao_informada_min` | `WARNING` | Professor |
| `TRANSCRICAO_MUITO_CURTA` | `duracao_transcricao_min < 30%` da `duracao_informada_min` | `CRITICAL` | Professor, Coordenador |
| `TRANSCRICAO_ININTELIGIVEL` | % de trechos não transcritos ou marcados como [inaudível] > 30% | `WARNING` | Professor |
| `SEM_TRANSCRICAO` | Professor não enviou transcrição nos últimos 5 dias letivos | `INFO` | Professor |
| `SEM_TRANSCRICAO_RECORRENTE` | Professor não enviou transcrição nos últimos 10 dias letivos | `WARNING` | Professor, Coordenador |

### 4.3. Alertas de Gaming (Detecção de Manipulação)

| Alerta | Condição | Severidade | Visível para |
|--------|----------|------------|--------------|
| `TRANSCRICAO_PARCIAL_SUSPEITA` | Aula de 50min com transcrição equivalente a < 20min e conteúdo não cobre eventos típicos de início/fim de aula | `FLAG` | Coordenador |
| `COBERTURA_INFLADA` | Transcrição curta mas com cobertura de tópicos excepcionalmente alta (>90%) — possível seleção de trecho | `FLAG` | Coordenador |
| `PLANEJAMENTO_DEFLACIONADO` | Planejamento com tópicos significativamente abaixo do esperado para a série/disciplina conforme BNCC | `FLAG` | Coordenador |
| `PADRAO_REPETITIVO` | Múltiplas transcrições do mesmo professor com estrutura textual muito similar (>80% de similaridade semântica entre aulas consecutivas) | `FLAG` | Coordenador |

**Regra RN-GAME-01:** Flags de gaming **nunca** geram alerta direto para o professor — são visíveis apenas para a coordenação, que decide como proceder.

**Regra RN-GAME-02:** O sistema **nunca** acusa explicitamente o professor de manipulação. A flag é apresentada como: "Transcrição com duração significativamente menor que o esperado — pode indicar problema técnico de gravação ou captura parcial."

**Regra RN-GAME-03:** Flags de gaming exigem **padrão recorrente** (mínimo 3 ocorrências em 4 semanas) para serem escaladas ao coordenador. Uma ocorrência isolada pode ser problema técnico legítimo.

---

## 5. Detecção de Sinais de Dificuldade e Desengajamento

### 5.1. Sinais que a IA Busca na Transcrição

A IA analisa a transcrição buscando padrões linguísticos e interacionais que indicam dificuldade ou desengajamento da turma. Os sinais são agrupados em categorias:

#### Categoria A: Sinais de Dificuldade de Compreensão

| Sinal | Padrão na Transcrição | Peso |
|-------|----------------------|------|
| **Perguntas repetidas** | Alunos perguntando a mesma coisa mais de uma vez, ou múltiplos alunos fazendo perguntas sobre o mesmo ponto | Alto |
| **Pedidos de re-explicação** | "Professor, pode explicar de novo?", "Não entendi", "Como assim?" | Alto |
| **Silêncio após pergunta** | Professor faz pergunta e não obtém resposta (evidenciado por pausa longa ou professor respondendo sozinho) | Médio |
| **Respostas incorretas frequentes** | Múltiplas respostas erradas dos alunos a perguntas do professor | Médio |
| **Professor reformulando** | Professor explicando o mesmo conceito de formas diferentes repetidamente | Médio |

#### Categoria B: Sinais de Desengajamento

| Sinal | Padrão na Transcrição | Peso |
|-------|----------------------|------|
| **Chamadas de atenção** | Professor pedindo silêncio, atenção ou ordem repetidamente | Alto |
| **Conversas paralelas** | Ruído de fundo ou menções a conversas paralelas ("pessoal, por favor") | Médio |
| **Baixa participação** | Aula predominantemente monológica — professor fala sem interação por longos períodos | Médio |
| **Desvio de tema recorrente** | Alunos desviando para assuntos não relacionados | Baixo |
| **Pressa para encerrar** | Alunos perguntando sobre horário, pedindo para ir embora | Baixo |

#### Categoria C: Sinais Positivos (Engajamento)

| Sinal | Padrão na Transcrição | Peso |
|-------|----------------------|------|
| **Perguntas aprofundadas** | Alunos fazendo perguntas que vão além do conteúdo apresentado | Alto |
| **Debate entre alunos** | Discussão produtiva entre alunos sobre o tema | Alto |
| **Respostas voluntárias** | Alunos respondendo sem serem chamados | Médio |
| **Conexões com cotidiano** | Alunos relacionando o conteúdo com experiências próprias | Médio |

### 5.2. Algoritmo de Score de Engajamento

```
score_engajamento = (sinais_positivos_ponderados - sinais_negativos_ponderados) / max_sinais_possíveis
```

O score é normalizado para uma escala de 0 a 100 onde:

| Faixa | Classificação | Descrição |
|-------|---------------|-----------|
| 80-100 | `ALTO` | Turma altamente engajada, participação ativa |
| 60-79 | `ADEQUADO` | Nível normal de engajamento |
| 40-59 | `ATENCAO` | Sinais moderados de desengajamento ou dificuldade |
| 0-39 | `BAIXO` | Sinais claros de dificuldade ou desengajamento |

**Regra RN-ENG-01:** O score de engajamento é **indicativo, não definitivo**. É apresentado ao professor como "Sinais de engajamento da turma" com justificativa textual, nunca como nota ou avaliação do professor.

**Regra RN-ENG-02:** Scores `BAIXO` por 3+ aulas consecutivas geram alerta `ENGAJAMENTO_PREOCUPANTE` visível para o professor com sugestões contextuais (ex: "Considere variar a metodologia no tópico X — sinais de dificuldade de compreensão detectados").

**Regra RN-ENG-03:** Scores de engajamento **não são** visíveis para a coordenação no MVP. São ferramenta exclusiva do professor para autoavaliação. Na V2, dados agregados (média por turma) podem ser compartilhados.

### 5.3. Limitações Declaradas

O sistema deve declarar explicitamente ao usuário:

- A detecção de sinais depende da qualidade da transcrição — áudio com muito ruído ou transcrição manual incompleta reduz a precisão
- Sinais de engajamento baseiam-se em padrões linguísticos e não capturam comunicação não-verbal (expressões faciais, linguagem corporal)
- O estilo do professor influencia os sinais: aulas expositivas naturalmente têm menos interação que aulas dialogadas, sem que isso signifique desengajamento
- O score é calibrado para detectar padrões relativos (comparação entre aulas do mesmo professor), não absolutos

---

## 6. Lógica de Priorização de Sugestões para Próxima Aula

### 6.1. Categorias de Sugestões

A IA gera sugestões para a próxima aula organizadas por prioridade. A priorização segue uma lógica de urgência pedagógica:

| Prioridade | Categoria | Critério de Ativação | Exemplo |
|------------|-----------|----------------------|---------|
| **P0 — Crítico** | Reforço de conteúdo com dificuldade | Sinais de dificuldade de compreensão (Categoria A) com peso Alto detectados na aula atual | "Alunos demonstraram dificuldade com equações do 1º grau — considere retomar com exemplos adicionais" |
| **P1 — Alto** | Gap de conteúdo urgente | Tópico `GAP` com prazo estimado de conclusão < 2 semanas | "Tópico 'Probabilidade' ainda não foi abordado e restam {n} aulas no bimestre" |
| **P2 — Médio** | Completar conteúdo parcial | Tópico `PARTIAL` que precisa de aprofundamento | "Tópico 'Frações' foi introduzido mas falta exercitação prática" |
| **P3 — Baixo** | Progresso normal | Próximo tópico na sequência do planejamento | "Seguindo o planejamento, próximo tópico sugerido: '{topico}'" |

### 6.2. Regras de Priorização

**Regra RN-SUG-01:** Sugestões P0 (reforço) têm prioridade sobre avanço de conteúdo novo. Não adianta avançar se a turma não absorveu o anterior.

**Regra RN-SUG-02:** Sugestões são limitadas a **máximo 3 por relatório** para não sobrecarregar o professor. Se houver mais de 3 itens elegíveis, priorizar pelos critérios P0 > P1 > P2 > P3.

**Regra RN-SUG-03:** Sugestões **nunca prescrevem metodologia**. O sistema diz "o quê" (qual conteúdo reforçar), não "como" (qual didática usar). Preserva autonomia pedagógica do professor.

**Regra RN-SUG-04:** Se o professor tiver cadastrado objetivos por aula (Nível 2), as sugestões consideram a sequência didática planejada. Caso contrário, a sequência é inferida pela ordem dos tópicos no planejamento bimestral.

**Regra RN-SUG-05:** Sugestões repetidas (mesmo conteúdo sugerido em 3+ relatórios consecutivos sem ação) são consolidadas e reduzidas em frequência para evitar fadiga do professor.

### 6.3. Formato da Sugestão

Cada sugestão segue o formato:

```
[Prioridade] Sugestão
  - Motivo: {justificativa baseada em dados}
  - Evidência: {trecho da transcrição ou métrica que embasa}
  - Contexto: {informação adicional que ajuda na decisão}
```

---

## 7. Critérios de Qualidade do Relatório Gerado

### 7.1. Definição de "Relatório Aproveitável"

Um relatório é considerado **aproveitável** quando o professor o aprova sem edição significativa. A meta do MVP é **>80% de aprovação sem edição significativa**.

### 7.2. Critérios Internos de Qualidade (Checklist da IA)

Antes de entregar o relatório ao professor, a IA deve validar internamente:

| # | Critério | Descrição | Obrigatório |
|---|----------|-----------|-------------|
| Q1 | **Especificidade** | O relatório menciona conteúdos específicos da aula, não frases genéricas. "Cobriu equações do 1º grau com 3 exemplos" > "A aula cobriu os tópicos previstos" | Sim |
| Q2 | **Fidelidade** | Toda afirmação do relatório é rastreável a trechos da transcrição | Sim |
| Q3 | **Cobertura** | O relatório aborda os principais temas da aula (mínimo 80% do conteúdo substantivo da transcrição) | Sim |
| Q4 | **Concisão** | O relatório tem entre 150-500 palavras (ajustável por configuração da escola) | Sim |
| Q5 | **Tom neutro** | Linguagem descritiva e neutra — sem julgamentos de valor sobre o professor | Sim |
| Q6 | **Estrutura** | Segue o template configurado pela escola (se houver) | Sim |
| Q7 | **Acionabilidade** | Inclui pelo menos 1 sugestão para próxima aula (quando aplicável) | Não |
| Q8 | **Exercícios** | Exercícios gerados são pertinentes ao conteúdo real da aula, não genéricos | Sim |

**Regra RN-QUAL-01:** Se a IA não conseguir satisfazer Q1, Q2 e Q3 (geralmente por transcrição de baixa qualidade), o relatório é marcado como `CONFIANÇA_BAIXA` e o professor é informado: "Relatório gerado com base em transcrição incompleta — revise com atenção."

**Regra RN-QUAL-02:** O sistema rastreia a taxa de aprovação de relatórios por professor. Se a taxa cair abaixo de 60% para um professor específico por 2 semanas consecutivas, gera alerta interno para revisão dos prompts ou da qualidade da transcrição.

### 7.3. Métricas de Qualidade Rastreadas

| Métrica | Como Medir | Meta MVP |
|---------|------------|----------|
| Taxa de aprovação sem edição | Relatórios aprovados sem mudanças / total | >50% |
| Taxa de aprovação com edição menor | Aprovados com <20% do texto alterado / total | >80% (somado com sem edição) |
| Taxa de rejeição | Relatórios descartados pelo professor / total | <10% |
| Tempo médio de revisão | Tempo entre abertura e aprovação do relatório | <5 minutos |
| Confiança média da IA | Média do score de confiança interno | >0.7 |

---

## 8. Regras de Validação de Transcrição

### 8.1. Validações de Entrada

| Validação | Regra | Ação se Falhar |
|-----------|-------|----------------|
| **Duração mínima** | Transcrição deve ter conteúdo equivalente a pelo menos 10 minutos de fala | Rejeitar com mensagem: "Transcrição muito curta para análise significativa. Verifique a gravação." |
| **Tamanho mínimo de texto** | Transcrição deve ter pelo menos 500 palavras (se fonte textual) | Rejeitar com mensagem similar |
| **Idioma** | Conteúdo predominantemente em português | Flag `IDIOMA_INESPERADO` (aceita mas sinaliza) |
| **Completude** | % de trechos [inaudível] ou equivalente < 40% | Se > 40%: aceitar mas marcar como `TRANSCRICAO_INCOMPLETA` e gerar relatório com flag `CONFIANÇA_BAIXA` |
| **Duplicação** | Transcrição não é duplicata de outra já enviada (similaridade > 95%) | Rejeitar com mensagem: "Esta transcrição parece ser duplicata de uma aula já enviada em {data}." |

### 8.2. Estimativa de Duração da Transcrição

Para detectar discrepâncias entre duração informada e conteúdo real:

**Regra RN-TRANS-01:** A duração estimada da transcrição é calculada pela fórmula:

```
duracao_estimada_min = total_palavras / 130
```

Baseada na velocidade média de fala em contexto de aula (~130 palavras/minuto, considerando pausas naturais).

**Regra RN-TRANS-02:** Se a fonte for áudio, a duração real do áudio prevalece sobre a estimativa por palavras.

### 8.3. Ratio de Cobertura Temporal

```
ratio_cobertura = duracao_transcricao_min / duracao_informada_min
```

| Ratio | Interpretação | Ação |
|-------|---------------|------|
| 0.8 - 1.2 | Normal (variação aceitável) | Nenhuma |
| 0.5 - 0.79 | Transcrição parcial | Flag `TRANSCRICAO_PARCIAL` para o professor |
| 0.3 - 0.49 | Transcrição significativamente incompleta | Flag `TRANSCRICAO_CURTA` + alerta ao professor |
| < 0.3 | Possível gaming ou problema técnico grave | Flag `TRANSCRICAO_MUITO_CURTA` + flag de gaming se padrão recorrente (ver seção 4.3) |

### 8.4. Validação de Coerência

**Regra RN-TRANS-03:** A IA verifica se a transcrição contém elementos típicos de uma aula:
- Presença de falas introdutórias/conclusivas ("vamos começar", "por hoje é isso")
- Alternância de vozes ou indicação de perguntas/respostas
- Referências a conteúdo educacional coerente com a disciplina

Se nenhum desses elementos estiver presente, a transcrição é marcada como `CONTEUDO_ATIPICO` — pode indicar gravação de reunião, intervalo ou outro evento que não é aula.

---

## 9. Motor de Análise — Pipeline de Processamento

### 9.1. Etapas do Pipeline

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. INGESTÃO │ →  │ 2. VALIDAÇÃO │ →  │  3. ANÁLISE  │ →  │ 4. GERAÇÃO   │ →  │  5. ENTREGA  │
│              │    │              │    │              │    │              │    │              │
│ Recebe       │    │ Valida       │    │ Análise      │    │ Gera         │    │ Disponibiliza│
│ transcrição  │    │ qualidade    │    │ pedagógica   │    │ outputs      │    │ para revisão │
│ + metadados  │    │ e integridade│    │ por IA       │    │ (relatório,  │    │ do professor │
│              │    │              │    │              │    │ exercícios,  │    │              │
│              │    │              │    │              │    │ sugestões)   │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 9.2. Etapa 1: Ingestão

- Recebe transcrição de qualquer fonte suportada
- Se fonte = áudio: envia para transcrição via Whisper/Google Speech
- Normaliza formato do texto
- Extrai metadados (duração, data, turma, professor)

### 9.3. Etapa 2: Validação

- Aplica todas as regras de validação da seção 8
- Calcula ratio de cobertura temporal
- Gera flags de qualidade
- **Decisão:** `APROVADA`, `APROVADA_COM_RESSALVAS`, `REJEITADA`
- Se `REJEITADA`: pipeline para, professor é notificado
- Se `APROVADA_COM_RESSALVAS`: pipeline continua com flag `CONFIANÇA_BAIXA`

### 9.4. Etapa 3: Análise Pedagógica

Execução em sub-etapas:

1. **Extração de tópicos:** IA identifica os temas abordados na transcrição
2. **Mapeamento com planejamento:** Cruza temas extraídos com tópicos do planejamento bimestral
3. **Classificação de cobertura:** Classifica cada tópico como COVERED/PARTIAL/GAP (critérios da seção 3.3)
4. **Detecção de sinais:** Busca sinais de dificuldade/engajamento (seção 5)
5. **Cálculo de métricas:** Atualiza cobertura %, delta de ritmo, score de engajamento
6. **Verificação de alertas:** Avalia thresholds de alertas (seção 4)
7. **Priorização de sugestões:** Gera e prioriza sugestões para próxima aula (seção 6)

**Regra RN-PIPE-01:** A análise é **assíncrona** (batch). Não há requisito de tempo real. O SLA de processamento é de até 30 minutos após submissão para condições normais.

**Regra RN-PIPE-02:** Se o processamento falhar (erro da API de IA, timeout, etc.), o sistema tenta **até 3 vezes** com backoff exponencial antes de notificar o professor de falha.

### 9.5. Etapa 4: Geração de Outputs

Gera em paralelo:
- **Relatório da aula:** Seguindo template da escola (ou padrão)
- **Exercícios contextuais:** 3-5 exercícios baseados no conteúdo real da aula
- **Sugestões para próxima aula:** Até 3, priorizadas conforme seção 6
- **Atualização de métricas:** Cobertura %, delta de ritmo (alimenta dashboard de gestão)

### 9.6. Etapa 5: Entrega

- Disponibiliza relatório para revisão do professor
- Professor pode: `APROVAR`, `EDITAR_E_APROVAR`, `REJEITAR`
- Métricas de cobertura são atualizadas no dashboard de gestão
- Alertas são gerados/atualizados conforme thresholds

---

## 10. Regras de Permissão e Visibilidade de Dados

### 10.1. Matriz de Permissões

| Dado | Professor | Coordenador | Dono/Diretor |
|------|-----------|-------------|--------------|
| Transcrição bruta | Própria | Não | Não |
| Relatório gerado | Próprio | Não | Não |
| Exercícios gerados | Próprio | Não | Não |
| Sugestões para próxima aula | Própria | Não | Não |
| Score de engajamento | Próprio | Não (MVP) | Não |
| % cobertura por turma | Própria turma | Todas as turmas | Agregado escola |
| Delta de ritmo | Própria turma | Todas as turmas | Agregado escola |
| Alertas de cobertura | Própria turma | Todas as turmas | Agregado escola |
| Flags de gaming | Não | Sim | Não |
| Taxa de aprovação de relatórios | Própria | Agregado por professor | Agregado escola |

**Regra RN-PERM-01:** Professor **nunca** vê dados de outros professores.

**Regra RN-PERM-02:** Coordenador vê métricas por professor mas **nunca** acessa transcrições brutas — preserva "IA como lente" sem transformar em ferramenta de vigilância direta.

**Regra RN-PERM-03:** Dono/Diretor vê **apenas dados agregados** por turma/série/escola — nunca dados individuais de professor.

---

## 11. Critérios Objetivos de Sucesso do Sistema

### 11.1. Critérios de Sucesso do MVP (Go/No-Go para Fase 2)

| # | Critério | Meta | Método de Medição | Peso |
|---|----------|------|-------------------|------|
| S1 | Adoção de professores | >70% usando semanalmente | Logs de upload de transcrição | Crítico |
| S2 | Qualidade do output | >80% relatórios aprovados sem edição significativa | Taxa de aprovação no sistema | Crítico |
| S3 | Redução de trabalho | Professores reportam economia >1h/semana | Pesquisa qualitativa | Alto |
| S4 | Satisfação | NPS >30 entre professores | Pesquisa ao final do piloto | Alto |
| S5 | Retenção | Escola renova após piloto de 30 dias | Contrato assinado | Crítico |
| S6 | Viabilidade financeira | Custo de IA <40% da receita por escola | Unit economics real | Crítico |
| S7 | Precisão de cobertura | >85% de concordância com avaliação manual do coordenador | Amostragem mensal com coordenador validando classificações | Alto |

**Regra RN-SUCC-01:** Critérios marcados como `Crítico` são **todos obrigatórios** para Go. Se qualquer um falhar, é No-Go.

**Regra RN-SUCC-02:** Critérios `Alto` são avaliados em conjunto. Pelo menos 2 de 3 devem ser atingidos.

### 11.2. Sinais Qualitativos de Validação

| Sinal | O que Indica |
|-------|--------------|
| Professor diz "Não quero voltar a fazer relatório manual" | Substituição efetiva — valor tangível |
| Coordenadora usa dados em conversa com professor | Sistema é ferramenta de gestão real |
| Dono menciona dados do sistema em reunião | Visibilidade operacional validada |
| Professor contesta classificação de cobertura | Engajamento ativo — professor lê e se importa |
| Coordenadora pede mais métricas | Demanda por V2 validada |

---

## 12. Glossário

| Termo | Definição |
|-------|-----------|
| **BNCC** | Base Nacional Comum Curricular — documento que define competências e habilidades obrigatórias por série/disciplina no Brasil |
| **Cobertura curricular** | Percentual dos tópicos do planejamento bimestral que foram abordados em aula |
| **Delta de ritmo** | Diferença entre cobertura curricular e progresso temporal do bimestre |
| **Gap** | Tópico do planejamento que não foi abordado em nenhuma aula |
| **Gaming** | Tentativa deliberada de manipular o sistema (ex: transcrição seletiva, planejamento deflacionado) |
| **Flag** | Sinalização interna do sistema que indica uma condição anormal ou que merece atenção |
| **Score de engajamento** | Métrica 0-100 que indica o nível de participação e interesse da turma em uma aula |
| **Relatório aproveitável** | Relatório aprovado pelo professor sem edição significativa |
| **Pipeline** | Sequência de etapas de processamento da transcrição até a geração de outputs |
| **Batch/Assíncrono** | Processamento que não ocorre em tempo real — transcrição é enfileirada e processada |

---

## 13. Rastreabilidade com Artefatos

Este documento impacta e deve ser referenciado pelos seguintes artefatos:

| Artefato | Seções Relevantes | Impacto |
|----------|-------------------|---------|
| **PRD** | Seções 3, 4, 5, 6, 7, 11 | Critérios de aceitação precisos para features de análise, alertas e relatórios |
| **Architecture** | Seções 2, 8, 9, 10 | Modelo de dados, pipeline de processamento, engine de regras, sistema de permissões |
| **Stories** | Seções 3-8 | Acceptance criteria detalhados para cada regra de negócio |
| **Test Plan** | Seções 3.3, 4, 5, 8 | Cenários de teste para classificação de cobertura, thresholds e validação |

---

## Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2026-02-06 | IA (com base em Product Brief e Brainstorming Session) | Versão inicial — regras de negócio do MVP |
