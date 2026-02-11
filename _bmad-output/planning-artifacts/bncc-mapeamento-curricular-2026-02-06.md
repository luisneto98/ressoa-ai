# Mapeamento da BNCC e Modelo Curricular

**Projeto:** Professor Analytics
**Data:** 2026-02-06
**Versão:** 1.0
**Documento de referência:** Product Brief (2026-02-05)

---

## 1. Objetivo do Documento

Definir a estrutura de dados e relacionamentos do currículo oficial brasileiro (BNCC) que serve como **"régua externa"** do sistema Professor Analytics. Este documento especifica como competências, habilidades e conteúdos se organizam por série/disciplina, e como essa estrutura será utilizada para:

- Vincular o planejamento do professor às competências oficiais
- Calcular o percentual de cobertura curricular por turma/série
- Gerar alertas de gaps de conteúdo
- Alimentar o dashboard de gestão com dados de aderência curricular

---

## 2. Estrutura Hierárquica da BNCC

A Base Nacional Comum Curricular (BNCC) é o documento normativo que define as aprendizagens essenciais da Educação Básica brasileira. Sua estrutura é hierárquica e organizada em níveis progressivos de granularidade.

### 2.1 Hierarquia Completa

```
BNCC
├── 10 Competências Gerais da Educação Básica
│   └── Permeiam TODOS os componentes e etapas
│
├── Etapa: Ensino Fundamental (Anos Finais: 6º ao 9º)
│   ├── Área do Conhecimento
│   │   ├── Linguagens (LP, AR, EF, LI)
│   │   ├── Matemática (MA)
│   │   ├── Ciências da Natureza (CI)
│   │   ├── Ciências Humanas (GE, HI)
│   │   └── Ensino Religioso (ER)
│   │
│   └── Componente Curricular (disciplina)
│       ├── Competências Específicas do Componente
│       ├── Unidades Temáticas
│       │   └── Objetos de Conhecimento
│       │       └── Habilidades (código alfanumérico)
│       └── Práticas de Linguagem (apenas LP)
│
└── Etapa: Ensino Médio
    ├── Área do Conhecimento
    │   ├── Linguagens e suas Tecnologias (LGG)
    │   ├── Matemática e suas Tecnologias (MAT)
    │   ├── Ciências da Natureza e suas Tecnologias (CNT)
    │   └── Ciências Humanas e Sociais Aplicadas (CHS)
    │
    └── Competências Específicas de Área
        └── Habilidades
```

### 2.2 Níveis Hierárquicos para o Sistema

| Nível | Elemento | Exemplo | Uso no Sistema |
|-------|----------|---------|----------------|
| 1 | Competência Geral | CG02 - Pensamento científico, crítico e criativo | Referência de alto nível, relatórios para gestão |
| 2 | Área do Conhecimento | Matemática | Agrupamento de dashboard |
| 3 | Componente Curricular | Matemática (MA) | Filtro principal por disciplina |
| 4 | Unidade Temática | Álgebra | Agrupamento de conteúdos |
| 5 | Objeto de Conhecimento | Equações polinomiais do 1º grau | Referência de planejamento |
| 6 | **Habilidade** | EF07MA18 | **Unidade atômica de análise** |

**Decisão de design:** A **habilidade** é a unidade atômica do sistema. Toda análise de cobertura, planejamento e cruzamento com transcrições opera no nível de habilidades individuais, com rollups para níveis superiores.

---

## 3. Sistema de Códigos Alfanuméricos da BNCC

### 3.1 Ensino Fundamental - Estrutura do Código

```
EF 07 MA 18
│  │  │   │
│  │  │   └── Posição sequencial da habilidade (18ª habilidade)
│  │  └────── Componente curricular (MA = Matemática)
│  └───────── Ano/série ou bloco de anos (07 = 7º ano)
└──────────── Etapa (EF = Ensino Fundamental)
```

### 3.2 Abreviações de Componentes Curriculares

| Código | Componente | Área do Conhecimento | MVP? |
|--------|-----------|---------------------|------|
| **MA** | **Matemática** | Matemática | **Sim** |
| **LP** | **Língua Portuguesa** | Linguagens | **Sim** |
| **CI** | **Ciências** | Ciências da Natureza | **Sim** |
| AR | Arte | Linguagens | Não |
| EF | Educação Física | Linguagens | Não |
| LI | Língua Inglesa | Linguagens | Não |
| GE | Geografia | Ciências Humanas | Não |
| HI | História | Ciências Humanas | Não |
| ER | Ensino Religioso | Ensino Religioso | Não |

### 3.3 Blocos de Anos (Particularidade de LP, AR e EF)

Alguns componentes agrupam habilidades por blocos de anos em vez de anos isolados:

| Código | Abrangência | Componente |
|--------|-------------|------------|
| EF06LP | Apenas 6º ano | Língua Portuguesa |
| EF07LP | Apenas 7º ano | Língua Portuguesa |
| EF08LP | Apenas 8º ano | Língua Portuguesa |
| EF09LP | Apenas 9º ano | Língua Portuguesa |
| EF67LP | 6º e 7º anos (compartilhada) | Língua Portuguesa |
| EF69LP | 6º ao 9º ano (compartilhada) | Língua Portuguesa |
| EF89LP | 8º e 9º anos (compartilhada) | Língua Portuguesa |

**Implicação para o sistema:** Habilidades compartilhadas (EF67LP, EF69LP, EF89LP) precisam ser mapeadas para múltiplos anos. Uma habilidade EF69LP se aplica a todas as turmas do 6º ao 9º ano.

### 3.4 Ensino Médio - Estrutura do Código

```
EM 13 MAT 301
│  │   │   │
│  │   │   └── Competência (3) + posição sequencial (01)
│  │   └────── Área do conhecimento (MAT = Matemática e Tecnologias)
│  └────────── 13 = aplicável a qualquer ano do EM
└───────────── Etapa (EM = Ensino Médio)
```

| Código | Área |
|--------|------|
| LGG | Linguagens e suas Tecnologias |
| MAT | Matemática e suas Tecnologias |
| CNT | Ciências da Natureza e suas Tecnologias |
| CHS | Ciências Humanas e Sociais Aplicadas |

---

## 4. Séries e Anos Atendidos

### 4.1 Escopo do MVP

| Etapa | Anos | Justificativa |
|-------|------|---------------|
| **Ensino Fundamental - Anos Finais** | **6º ao 9º ano** | Público-alvo primário (Professor João leciona para 6 turmas nesta faixa) |
| Ensino Médio | 1ª a 3ª série | Expansão pós-MVP |

### 4.2 Organização Temporal do Ano Letivo

| Período | Duração Típica | Relevância no Sistema |
|---------|---------------|----------------------|
| Ano letivo | ~200 dias letivos | Ciclo completo de cobertura |
| **Bimestre** | ~50 dias (~10 semanas) | **Unidade de planejamento do professor** |
| Semana | 5 dias | Unidade de acompanhamento de ritmo |
| Aula | 45-50 min | Unidade de captura (transcrição) |

**Decisão de design:** O **bimestre** é a unidade de planejamento. O professor cadastra seu plano bimestral 1x, e cada aula é cruzada contra esse plano.

---

## 5. Disciplinas Prioritárias para MVP

### 5.1 Matemática (MA)

**Justificativa:** Disciplina com habilidades mais objetivas e mensuráveis, ideal para validação do MVP.

#### Unidades Temáticas

| Unidade Temática | Descrição | Exemplo de Objeto de Conhecimento |
|-----------------|-----------|-----------------------------------|
| Números | Pensamento numérico, quantificar, interpretar | Números racionais, operações com frações |
| Álgebra | Padrões, regularidades, pensamento algébrico | Equações polinomiais do 1º grau |
| Geometria | Formas, posições, transformações | Polígonos regulares, simetria |
| Grandezas e Medidas | Medição, conversão, aplicação prática | Área, volume, ângulos |
| Probabilidade e Estatística | Coleta, organização e análise de dados | Média, moda, mediana, gráficos |

#### Volume de Habilidades por Ano

| Ano | Código | Qtd. Habilidades | Exemplos |
|-----|--------|-------------------|----------|
| 6º ano | EF06MA01 a EF06MA34 | 34 | Números naturais e racionais, frações, porcentagens |
| 7º ano | EF07MA01 a EF07MA37 | 37 | Números inteiros, proporcionalidade, equações |
| 8º ano | EF08MA01 a EF08MA27 | 27 | Potências, radiciação, expressões algébricas |
| 9º ano | EF09MA01 a EF09MA23 | 23 | Números reais, funções, teorema de Pitágoras |
| **Total** | | **121** | |

#### Exemplo de Habilidade Detalhada

```
Código:       EF07MA18
Componente:   Matemática
Ano:          7º ano
Unidade:      Álgebra
Objeto:       Equações polinomiais do 1º grau
Habilidade:   Resolver e elaborar problemas que possam ser representados
              por equações polinomiais de 1º grau, redutíveis à forma
              ax + b = c, fazendo uso das propriedades da igualdade.
```

### 5.2 Língua Portuguesa (LP)

**Justificativa:** Componente com maior volume de habilidades e estrutura mais complexa. Essencial por ser transversal a todas as áreas. Validação importante da capacidade da IA de lidar com habilidades qualitativas.

#### Organização Estrutural

LP possui uma estrutura diferenciada dos demais componentes, organizada por **campos de atuação** e **práticas de linguagem**:

**Campos de Atuação (Anos Finais):**

| Campo | Foco |
|-------|------|
| Jornalístico-midiático | Notícias, reportagens, artigos de opinião |
| Atuação na vida pública | Documentos legais, debates, propostas |
| Práticas de estudo e pesquisa | Textos acadêmicos, resumos, seminários |
| Artístico-literário | Literatura, poesia, contos, crônicas |
| Todos os campos de atuação | Habilidades transversais a todos os campos |

**Práticas de Linguagem:**

| Prática | Descrição |
|---------|-----------|
| Leitura | Compreensão e interpretação de textos |
| Produção de textos | Escrita em diferentes gêneros |
| Oralidade | Expressão oral, escuta, apresentações |
| Análise linguística/semiótica | Gramática, coesão, recursos linguísticos |

#### Volume de Habilidades por Ano/Bloco

| Código | Abrangência | Qtd. Habilidades (aprox.) |
|--------|-------------|---------------------------|
| EF06LP | 6º ano específico | ~12 |
| EF07LP | 7º ano específico | ~14 |
| EF08LP | 8º ano específico | ~16 |
| EF09LP | 9º ano específico | ~12 |
| EF67LP | 6º e 7º anos | ~38 |
| EF69LP | 6º ao 9º ano | ~56 |
| EF89LP | 8º e 9º anos | ~37 |
| **Total (estimado)** | | **~185** |

> **Nota:** LP é o componente com maior volume de habilidades. As habilidades compartilhadas (EF67LP, EF69LP, EF89LP) se aplicam a múltiplos anos, o que aumenta o volume efetivo por turma.

#### Habilidades Efetivas por Ano (com compartilhadas)

| Ano | Específicas | + EF67LP | + EF69LP | + EF89LP | Total Efetivo (aprox.) |
|-----|------------|----------|----------|----------|------------------------|
| 6º | ~12 | +38 | +56 | - | ~106 |
| 7º | ~14 | +38 | +56 | - | ~108 |
| 8º | ~16 | - | +56 | +37 | ~109 |
| 9º | ~12 | - | +56 | +37 | ~105 |

**Implicação:** O professor de LP precisa cobrir ~100+ habilidades por ano, tornando o tracking de cobertura ainda mais valioso.

### 5.3 Ciências (CI)

**Justificativa:** Componente com estrutura clara e volume gerenciável. Boa disciplina para validação com escolas que tenham professores de ciências engajados.

#### Unidades Temáticas

| Unidade Temática | Descrição | Exemplo |
|-----------------|-----------|---------|
| Matéria e Energia | Propriedades, transformações, fontes de energia | Misturas, separação, circuitos elétricos |
| Vida e Evolução | Organismos, ecossistemas, corpo humano | Célula, vacinas, reprodução |
| Terra e Universo | Camadas, clima, sistema solar, composição | Rochas, fósseis, clima, astronomia |

#### Volume de Habilidades por Ano

| Ano | Código | Qtd. Habilidades | Exemplos |
|-----|--------|-------------------|----------|
| 6º ano | EF06CI01 a EF06CI14 | 14 | Misturas, célula, camadas da Terra |
| 7º ano | EF07CI01 a EF07CI16 | 16 | Máquinas simples, calor, vacinação |
| 8º ano | EF08CI01 a EF08CI16 | 16 | Fontes de energia, circuitos, sexualidade |
| 9º ano | EF09CI01 a EF09CI17 | 17 | Estrutura da matéria, radiação, genética |
| **Total** | | **63** | |

### 5.4 Resumo Comparativo

| Componente | Habilidades (total) | Habilidades efetivas/ano (média) | Complexidade de Mapeamento |
|-----------|---------------------|----------------------------------|---------------------------|
| **Matemática** | 121 | ~30 | Baixa (1 habilidade = 1 ano) |
| **Língua Portuguesa** | ~185 | ~107 | Alta (blocos compartilhados) |
| **Ciências** | 63 | ~16 | Baixa (1 habilidade = 1 ano) |
| **Total MVP** | **~369** | | |

---

## 6. As 10 Competências Gerais da BNCC

Embora o sistema opere no nível de habilidades, as 10 Competências Gerais são o "norte" da educação brasileira e aparecem nos relatórios de alto nível:

| # | Competência | Palavra-chave |
|---|------------|---------------|
| CG01 | Conhecimento | Valorizar e utilizar conhecimentos sobre o mundo |
| CG02 | Pensamento científico, crítico e criativo | Investigar, elaborar hipóteses |
| CG03 | Repertório cultural | Valorizar manifestações artísticas e culturais |
| CG04 | Comunicação | Utilizar diferentes linguagens |
| CG05 | Cultura digital | Compreender e utilizar tecnologias digitais |
| CG06 | Trabalho e projeto de vida | Valorizar o trabalho e planejar o futuro |
| CG07 | Argumentação | Argumentar com base em fatos e dados |
| CG08 | Autoconhecimento e autocuidado | Conhecer-se, cuidar da saúde |
| CG09 | Empatia e cooperação | Exercitar empatia, diálogo, cooperação |
| CG10 | Responsabilidade e cidadania | Agir com responsabilidade, ética, cidadania |

**Uso no sistema:** As competências gerais NÃO são rastreadas individualmente no MVP. Servem como contexto nos relatórios e no posicionamento do produto. Podem ser adicionadas como dimensão de análise no V2.

---

## 7. Modelo de Dados Proposto

### 7.1 Entidades Principais

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ CompetenciaGeral │     │     Area         │     │   Componente     │
│──────────────────│     │──────────────────│     │──────────────────│
│ id               │     │ id               │     │ id               │
│ codigo (CG01..10)│     │ nome             │     │ codigo (MA,LP,CI)│
│ descricao        │     │ etapa            │     │ nome             │
│ palavra_chave    │     │                  │     │ area_id (FK)     │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                         ┌──────────────────┐             │
                         │ UnidadeTematica  │             │
                         │──────────────────│             │
                         │ id               │◄────────────┘
                         │ nome             │
                         │ componente_id(FK)│
                         └──────────────────┘
                                  │
                         ┌──────────────────┐
                         │ObjetoConhecimento│
                         │──────────────────│
                         │ id               │
                         │ nome             │
                         │ unidade_id (FK)  │
                         └──────────────────┘
                                  │
┌──────────────────┐     ┌──────────────────┐
│  AnoAplicavel    │     │   Habilidade     │
│──────────────────│     │──────────────────│
│ habilidade_id(FK)│◄────│ id               │
│ ano (6,7,8,9)    │     │ codigo (EF07MA18)│
│                  │     │ descricao        │
└──────────────────┘     │ objeto_id (FK)   │
                         └──────────────────┘
```

### 7.2 Entidades Específicas de LP

Língua Portuguesa requer entidades adicionais:

```
┌──────────────────┐     ┌──────────────────┐
│ CampoAtuacao     │     │PraticaLinguagem  │
│──────────────────│     │──────────────────│
│ id               │     │ id               │
│ nome             │     │ nome             │
│ descricao        │     │ descricao        │
└──────────────────┘     └──────────────────┘
        │                        │
        └────────┐    ┌──────────┘
                 ▼    ▼
         ┌──────────────────┐
         │   Habilidade     │
         │ (para LP)        │
         │──────────────────│
         │ campo_id (FK)    │
         │ pratica_id (FK)  │
         └──────────────────┘
```

### 7.3 Entidades de Planejamento e Vinculação

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Professor     │     │  Planejamento    │     │ ItemPlanejamento │
│──────────────────│     │  Bimestral       │     │──────────────────│
│ id               │────▶│──────────────────│────▶│ id               │
│ nome             │     │ id               │     │ planejamento_id  │
│ escola_id        │     │ professor_id(FK) │     │ descricao_livre  │
└──────────────────┘     │ componente_id(FK)│     │ ordem            │
                         │ turma_id (FK)    │     └──────────────────┘
                         │ ano_letivo       │              │
                         │ bimestre (1-4)   │              │
                         │ status           │     ┌──────────────────┐
                         └──────────────────┘     │ ItemHabilidade   │
                                                  │──────────────────│
                                                  │ item_id (FK)     │
                                                  │ habilidade_id(FK)│
                                                  │ vinculacao_tipo  │
                                                  │ (manual|sugerida │
                                                  │  |ia_confirmada) │
                                                  └──────────────────┘
```

### 7.4 Entidades de Cobertura e Tracking

```
┌──────────────────────┐     ┌──────────────────────┐
│   Aula               │     │   CoberturaAula      │
│──────────────────────│     │──────────────────────│
│ id                   │     │ id                   │
│ planejamento_id (FK) │────▶│ aula_id (FK)         │
│ data                 │     │ habilidade_id (FK)   │
│ transcricao_id (FK)  │     │ nivel_cobertura      │
│ status_processamento │     │ (mencionada|parcial  │
└──────────────────────┘     │  |aprofundada)       │
                             │ evidencia_texto      │
                             │ confianca_ia (0-1)   │
                             └──────────────────────┘

┌──────────────────────────┐
│   CoberturaBimestral     │
│──────────────────────────│
│ id                       │
│ planejamento_id (FK)     │
│ habilidade_id (FK)       │
│ total_aulas_cobrindo     │
│ nivel_cobertura_agregado │
│ percentual_progresso     │
│ atualizado_em            │
└──────────────────────────┘
```

---

## 8. Granularidade de Análise

### 8.1 Decisão: Habilidade como Unidade Atômica

| Alternativa | Prós | Contras | Decisão |
|-------------|------|---------|---------|
| Competência Geral | Simples, poucos itens (10) | Genérico demais, sem valor prático | Descartada |
| Unidade Temática | Agrupamento lógico, ~5 por componente | Ainda genérico para planejamento diário | Agregação visual |
| Objeto de Conhecimento | Boa granularidade, próximo do planejamento | Não padronizado nacionalmente | Intermediário |
| **Habilidade** | **Padronizado, código único, verificável** | **Volume alto (~369 no MVP)** | **Escolhida** |

### 8.2 Níveis de Cobertura por Habilidade

| Nível | Código | Descrição | Critério de IA |
|-------|--------|-----------|----------------|
| Não coberta | 0 | Habilidade não aparece em nenhuma aula | Sem match na transcrição |
| Mencionada | 1 | Conteúdo relacionado foi citado brevemente | Keyword match + contexto mínimo |
| Parcialmente coberta | 2 | Conceitos foram trabalhados, mas sem profundidade | Múltiplos trechos, explicação parcial |
| Aprofundada | 3 | Habilidade trabalhada com exemplos, exercícios, discussão | Trechos extensos, interação, exemplos |

### 8.3 Cálculo de % de Cobertura Curricular

```
% Cobertura = (Habilidades com nível ≥ 2) / (Total de Habilidades Planejadas) × 100
```

**Variações para diferentes stakeholders:**

| Stakeholder | Métrica | Fórmula |
|-------------|---------|---------|
| Professor | Progresso do bimestre | Habilidades cobertas / Habilidades do planejamento bimestral |
| Coordenador | Aderência curricular | Habilidades BNCC cobertas / Habilidades BNCC previstas para o ano |
| Dono/Diretor | Cobertura da escola | Média ponderada de aderência por turma/série |

**Alertas automáticos (MVP):**

| Condição | Alerta | Destinatário |
|----------|--------|-------------|
| < 50% do bimestre coberto com > 70% do tempo passado | "Turma atrasada" | Professor + Coordenador |
| Habilidade planejada não coberta em 3+ aulas consecutivas | "Gap de conteúdo detectado" | Professor |
| Cobertura da escola < 60% no bimestre | "Alerta de cobertura" | Coordenador + Diretor |

---

## 9. Relação entre Planejamento Bimestral e Habilidades BNCC

### 9.1 Fluxo de Vinculação

```
Professor cadastra               Sistema sugere              Professor confirma
planejamento bimestral    ──►    habilidades BNCC     ──►    ou ajusta vinculação
(texto livre/estruturado)        relacionadas (IA)           (revisão humana)
```

**Exemplo concreto:**

```
┌─────────────────────────────────────────────────────────────────┐
│ PLANEJAMENTO BIMESTRAL - 7º Ano Matemática - 2º Bimestre       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Conteúdo cadastrado pelo professor:                             │
│   1. "Equações do 1º grau"                                     │
│   2. "Sistemas de equações simples"                             │
│   3. "Problemas envolvendo equações"                            │
│   4. "Desigualdades e inequações"                               │
│                                                                 │
│ Habilidades BNCC sugeridas pela IA:                             │
│   ✓ EF07MA18 - Resolver problemas com equações do 1º grau      │
│   ✓ EF07MA17 - Resolver problemas com variáveis                │
│   ? EF07MA16 - Reconhecer equação como igualdade                │
│   ✓ EF07MA19 - Realizar transformações de igualdade             │
│                                                                 │
│ ✓ = confirmada pelo professor                                   │
│ ? = sugerida, aguardando confirmação                            │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Tipos de Vinculação

| Tipo | Descrição | Confiança |
|------|-----------|-----------|
| **Manual** | Professor seleciona habilidade da lista BNCC | Alta (intenção explícita) |
| **Sugerida pela IA** | Sistema detecta habilidade a partir do texto do plano | Média (aguarda confirmação) |
| **Confirmada pela IA** | Professor confirma sugestão | Alta (validada) |
| **Detectada na aula** | IA encontra habilidade na transcrição não planejada | Baixa (pode ser tangencial) |

### 9.3 Distribuição Típica por Bimestre

| Componente | Habilidades/ano | Habilidades/bimestre (média) | Aulas/bimestre (~40) |
|-----------|----------------|------------------------------|---------------------|
| Matemática | ~30 | ~8 | ~5 aulas por habilidade |
| Língua Portuguesa | ~107 | ~27 | ~1.5 aulas por habilidade |
| Ciências | ~16 | ~4 | ~10 aulas por habilidade |

**Insight:** A razão aulas/habilidade varia drasticamente entre componentes, impactando a sensibilidade da análise de cobertura.

---

## 10. Estratégia de Carga de Dados da BNCC

### 10.1 Fonte de Dados

| Fonte | Conteúdo | Formato |
|-------|----------|---------|
| [BNCC Oficial (MEC)](https://basenacionalcomum.mec.gov.br/) | Documento completo | PDF |
| [BNCC Interativa](https://basenacionalcomum.mec.gov.br/abase/) | Habilidades navegáveis | HTML |
| [CIEB - Lista de Habilidades](https://curriculo.cieb.net.br/habilidades/bncc) | Base estruturada | Web |

### 10.2 Estratégia de Carga

**Fase 1 (MVP):** Carga manual curada das 3 disciplinas prioritárias

| Etapa | Ação | Volume |
|-------|------|--------|
| 1 | Extrair habilidades de MA (6º-9º) | 121 registros |
| 2 | Extrair habilidades de CI (6º-9º) | 63 registros |
| 3 | Extrair habilidades de LP (6º-9º) | ~185 registros |
| 4 | Mapear unidades temáticas e objetos | ~50 registros |
| 5 | Validar com especialista pedagógico | - |

**Fase 2 (pós-MVP):** Carga das demais disciplinas e Ensino Médio

### 10.3 Manutenção

A BNCC é um documento federal com revisões pouco frequentes. O sistema deve:

- Versionar a base de habilidades (campo `versao_bncc`)
- Manter habilidades obsoletas com flag `ativa = false`
- Permitir adição de habilidades de currículos estaduais/municipais como extensão

---

## 11. Extensibilidade: Currículos Estaduais e Municipais

Muitos estados e municípios possuem complementos à BNCC. O modelo deve suportar:

```
┌──────────────────┐
│  HabilidadeBase  │ ← BNCC nacional
│──────────────────│
│ tipo: 'bncc'     │
│ codigo: EF07MA18 │
└──────────────────┘

┌──────────────────┐
│ HabilidadeLocal  │ ← Currículo estadual/municipal (futuro)
│──────────────────│
│ tipo: 'estadual' │
│ estado: 'SP'     │
│ codigo_local     │
│ bncc_ref (FK)    │ ← Referência à habilidade BNCC equivalente
└──────────────────┘
```

**MVP:** Apenas habilidades BNCC. Campo `tipo` pré-populado como 'bncc' para futura extensibilidade.

---

## 12. Impacto nos Artefatos do Projeto

### 12.1 PRD (Product Requirements Document)

| Requisito Funcional | Descrição | Prioridade |
|---------------------|-----------|------------|
| RF-BNCC-01 | Base de habilidades BNCC pré-carregada para MA, LP, CI (6º-9º) | P0 (MVP) |
| RF-BNCC-02 | Tela de cadastro de planejamento bimestral com vinculação a habilidades | P0 (MVP) |
| RF-BNCC-03 | Sugestão automática de habilidades BNCC a partir do texto do plano | P0 (MVP) |
| RF-BNCC-04 | Cruzamento aula × habilidades planejadas com níveis de cobertura | P0 (MVP) |
| RF-BNCC-05 | Cálculo e exibição de % cobertura curricular | P0 (MVP) |
| RF-BNCC-06 | Alertas de gaps de conteúdo e atraso de ritmo | P0 (MVP) |
| RF-BNCC-07 | Dashboard agregado de cobertura por turma (coordenação/direção) | P0 (MVP) |
| RF-BNCC-08 | Suporte a currículos estaduais/municipais como extensão | P2 (V2) |
| RF-BNCC-09 | Visualização de competências gerais nos relatórios | P2 (V2) |
| RF-BNCC-10 | Cobertura BNCC do Ensino Médio | P2 (V2) |

### 12.2 Architecture (Modelo de Dados)

| Decisão | Impacto |
|---------|---------|
| Habilidade como unidade atômica | Tabela `habilidades` com ~369 registros iniciais |
| Blocos de anos em LP | Tabela intermediária `habilidade_anos` (N:N) |
| Campos de atuação (LP) | Tabelas adicionais `campos_atuacao`, `praticas_linguagem` |
| Vinculação planejamento ↔ BNCC | Tabela `item_habilidades` com tipo de vinculação |
| Cobertura por aula | Tabela `cobertura_aula` com nível e confiança da IA |
| Cobertura agregada | Tabela `cobertura_bimestral` (materializada/cache) |
| Versionamento BNCC | Campo `versao_bncc` em todas as tabelas de referência |
| Extensibilidade local | Campo `tipo` + `estado` nas habilidades |

### 12.3 Epics/Stories

| Epic | Stories Impactadas |
|------|-------------------|
| **Cadastro de Planejamento** | Cadastro bimestral, vinculação com BNCC, sugestão por IA, revisão do professor |
| **Processamento de Aula** | Cruzamento transcrição × habilidades, detecção de cobertura, cálculo de nível |
| **Dashboard Professor** | Progresso do bimestre, gaps detectados, sugestões para próxima aula |
| **Dashboard Gestão** | % cobertura por turma, alertas de atraso, visão agregada por série |
| **Dados Base** | Carga inicial BNCC, validação de dados, seed do banco |

---

## 13. Riscos e Mitigações Específicos da BNCC

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Professores não conhecem códigos BNCC | Baixa adoção da vinculação | Vinculação por texto livre + sugestão IA (nunca exigir código) |
| Habilidades LP muito genéricas para matching | IA com baixa precisão | Usar campos de atuação + prática como contexto adicional |
| Currículo real difere da BNCC | Planejamento não "encaixa" | Permitir itens sem vinculação BNCC (campo livre) |
| Volume alto de habilidades LP sobrecarrega interface | UX ruim no planejamento | Agrupar por unidade temática, mostrar apenas relevantes |
| Revisão da BNCC pelo MEC | Dados desatualizados | Versionamento + flag de vigência |
| Escolas com currículo próprio/internacional | Sistema não atende | Campo `tipo` extensível + habilidades customizadas (V2) |

---

## 14. Decisões Pendentes

| # | Decisão | Opções | Impacto | Quando Decidir |
|---|---------|--------|---------|---------------|
| D1 | Vinculação BNCC obrigatória ou opcional no planejamento? | Obrigatória / Opcional com incentivo / Totalmente opcional | UX e completude dos dados | PRD |
| D2 | IA sugere habilidades no cadastro do plano ou só após processamento da aula? | No cadastro / Após aula / Ambos | Complexidade e custo de IA | Architecture |
| D3 | Nível de cobertura: binário (cobriu/não cobriu) ou escala (0-3)? | Binário / 3 níveis / 4 níveis | Precisão vs. simplicidade | PRD |
| D4 | Mostrar códigos BNCC ao professor ou apenas descrições? | Códigos + texto / Só texto / Configurável | UX | UX Design |
| D5 | Como tratar habilidades de LP compartilhadas entre anos? | Duplicar por ano / Referência compartilhada | Modelo de dados | Architecture |

---

## 15. Glossário

| Termo | Definição |
|-------|-----------|
| **BNCC** | Base Nacional Comum Curricular - documento normativo do MEC que define aprendizagens essenciais |
| **Competência Geral** | Uma das 10 competências que permeiam toda a Educação Básica |
| **Área do Conhecimento** | Agrupamento de componentes curriculares (ex: Linguagens, Matemática) |
| **Componente Curricular** | Disciplina escolar (ex: Matemática, Língua Portuguesa) |
| **Unidade Temática** | Agrupamento de conteúdos dentro de um componente (ex: Álgebra, Geometria) |
| **Objeto de Conhecimento** | Conteúdo específico dentro de uma unidade temática |
| **Habilidade** | Aprendizagem essencial, identificada por código alfanumérico (ex: EF07MA18) |
| **Campo de Atuação** | Contexto social de uso da linguagem (específico de LP) |
| **Prática de Linguagem** | Tipo de atividade linguística: leitura, escrita, oralidade, análise |
| **Cobertura curricular** | Percentual de habilidades BNCC trabalhadas em relação ao planejado |
| **Vinculação** | Associação entre um item do planejamento do professor e uma habilidade BNCC |

---

## Referências

- [BNCC - Documento Oficial (MEC)](https://basenacionalcomum.mec.gov.br/a-base)
- [BNCC - PDF Completo Ensino Fundamental](https://basenacionalcomum.mec.gov.br/images/BNCC_EI_EF_110518_versaofinal_site.pdf)
- [CIEB - Lista de Habilidades da BNCC](https://curriculo.cieb.net.br/habilidades/bncc)
- [Habilidades BNCC Matemática 6º-9º (Geographia)](https://geographia.com.br/habilidades-bncc-matematica-fundamental/)
- [Habilidades BNCC Ciências 6º-9º (Geographia)](https://geographia.com.br/habilidades-bncc-ciencias-fundamental/)
- [Habilidades BNCC Língua Portuguesa 6º-9º (Geographia)](https://geographia.com.br/habilidades-bncc-lingua-portuguesa/)
- [Estrutura da BNCC (Anglo)](https://anglosolucaoeducacional.com.br/bncc/estrutura-da-bncc/)
- [Códigos Alfanuméricos BNCC (Os Pedagógicos)](https://ospedagogicos.com.br/bncc-entenda-os-codigos-alfanumericos/)
- [Unidades Temáticas Matemática (Nova Escola)](https://novaescola.org.br/bncc/conteudo/34/conheca-os-principais-pontos-em-cada-unidade-tematica-de-matematica)
- Product Brief - Professor Analytics (2026-02-05)
- Brainstorming Session Results - Professor Analytics (2026-02-05)
