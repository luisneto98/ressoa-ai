# Documento de Modelo de Dados e Entidades

**Projeto:** Professor Analytics
**Data:** 2026-02-08
**Versão:** 1.0
**Documentos de referência:**
- Product Brief (2026-02-05)
- BNCC Mapeamento Curricular (2026-02-06)
- Brainstorming Session (2026-02-05)

---

## 1. Objetivo do Documento

Este documento define as entidades principais do sistema Professor Analytics, seus atributos, relacionamentos e ciclo de vida, servindo como base para o design detalhado de banco de dados e implementação da arquitetura de dados.

**Propósitos específicos:**
- Estabelecer o modelo conceual completo das entidades do domínio
- Definir relacionamentos e cardinalidades entre entidades
- Especificar estados e transições do ciclo de vida de dados críticos
- Estimar volume de dados e requisitos de storage
- Fornecer base para decisões de schema de banco de dados
- Alinhar entidades com requisitos funcionais (PRD) e histórias (Stories)

---

## 2. Visão Geral do Modelo de Dados

### 2.1 Domínios Principais

O sistema opera em 4 domínios principais:

```
┌─────────────────────────────────────────────────────────────┐
│                    PROFESSOR ANALYTICS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DOMÍNIO 1: ORGANIZACIONAL                                  │
│  Escola → Turma → Usuários (Professor, Coordenador, Diretor)│
│                                                             │
│  DOMÍNIO 2: CURRÍCULO (BNCC)                                │
│  Área → Componente → Unidade Temática → Habilidade          │
│                                                             │
│  DOMÍNIO 3: PLANEJAMENTO                                    │
│  Planejamento Bimestral → Item Planejamento → Habilidades   │
│                                                             │
│  DOMÍNIO 4: EXECUÇÃO E ANÁLISE                              │
│  Aula → Transcrição → Análise → Relatório/Exercício         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Princípios de Design

| Princípio | Descrição | Impacto |
|-----------|-----------|---------|
| **Habilidade como unidade atômica** | Todas as análises operam no nível de habilidade BNCC | ~369 habilidades no MVP (MA, LP, CI) |
| **Processamento assíncrono** | Aula → Transcrição → Análise com estados intermediários | Performance otimizada, custos controlados |
| **Planejamento em dois níveis** | Bimestral (obrigatório) + Aula (opcional) | Reduz atrito de adoção |
| **Permissões por papel** | Dados diferentes para Professor, Coordenador, Diretor | Controle granular de acesso |
| **Auditoria completa** | Timestamps e tracking de mudanças em entidades críticas | Rastreabilidade e compliance LGPD |

---

## 3. Entidades Principais

### 3.1 DOMÍNIO ORGANIZACIONAL

#### 3.1.1 Escola

Representa a instituição de ensino contratante do sistema.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| nome | String(200) | Sim | Nome oficial da escola |
| cnpj | String(14) | Sim | CNPJ da instituição (único) |
| tipo | Enum | Sim | `particular`, `publica_municipal`, `publica_estadual` |
| rede_id | UUID | Não | Referência à rede educacional (se aplicável) |
| endereco | JSON | Não | Endereço completo estruturado |
| contato_principal | String(100) | Sim | Nome do responsável principal |
| email | String(100) | Sim | Email de contato |
| telefone | String(20) | Sim | Telefone principal |
| plano | Enum | Sim | `trial`, `basico`, `completo`, `enterprise` |
| limite_horas_mes | Integer | Sim | Limite de horas processadas por mês |
| status | Enum | Sim | `ativa`, `suspensa`, `cancelada` |
| data_ativacao | DateTime | Sim | Data de ativação da conta |
| data_cancelamento | DateTime | Não | Data de cancelamento (se aplicável) |
| criado_em | DateTime | Sim | Timestamp de criação |
| atualizado_em | DateTime | Sim | Timestamp de última atualização |

**Volume estimado:** 10-20 escolas no primeiro ano (MVP)

---

#### 3.1.2 Turma

Agrupamento de alunos em uma série/ano letivo específico.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| escola_id | UUID | Sim | FK para Escola |
| nome | String(100) | Sim | Ex: "7º Ano A", "8º Ano - Manhã" |
| ano_serie | Integer | Sim | Ano/série: 6, 7, 8, 9 (MVP) |
| ano_letivo | Integer | Sim | Ano letivo (ex: 2026) |
| turno | Enum | Sim | `matutino`, `vespertino`, `integral` |
| qtd_alunos | Integer | Sim | Quantidade de alunos matriculados |
| status | Enum | Sim | `ativa`, `encerrada`, `cancelada` |
| criado_em | DateTime | Sim | Timestamp de criação |
| atualizado_em | DateTime | Sim | Timestamp de última atualização |

**Relacionamentos:**
- N:1 com Escola
- N:N com Professor (através de ProfessorTurma)
- 1:N com Planejamento

**Volume estimado:** ~10 turmas por escola (MVP: 100-200 turmas)

---

#### 3.1.3 Usuario

Usuários do sistema (superclasse para diferentes papéis).

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| escola_id | UUID | Sim | FK para Escola |
| nome_completo | String(200) | Sim | Nome completo do usuário |
| email | String(100) | Sim | Email (único por escola) |
| senha_hash | String(255) | Sim | Hash bcrypt da senha |
| tipo | Enum | Sim | `professor`, `coordenador`, `diretor`, `admin` |
| telefone | String(20) | Não | Telefone de contato |
| foto_url | String(500) | Não | URL da foto de perfil |
| status | Enum | Sim | `ativo`, `inativo`, `bloqueado` |
| ultimo_acesso | DateTime | Não | Timestamp do último login |
| criado_em | DateTime | Sim | Timestamp de criação |
| atualizado_em | DateTime | Sim | Timestamp de última atualização |

**Subtipos (implementados via tipo discriminador):**

**Professor:**
- Atributos específicos: `formacao`, `disciplina_principal`, `registro_profissional`
- Relacionamento: N:N com Turma

**Coordenador:**
- Atributos específicos: `area_coordenacao` (pedagógica, administrativa)
- Permissões: Visualiza dados agregados de professores

**Diretor:**
- Atributos específicos: `tipo_direcao` (geral, pedagógica)
- Permissões: Visualiza dados agregados da escola

**Volume estimado:** ~25 professores + 2-3 coordenadores + 1 diretor por escola = ~300 usuários MVP

---

#### 3.1.4 ProfessorTurma

Relacionamento N:N entre Professor e Turma por componente curricular.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| professor_id | UUID | Sim | FK para Usuario (tipo=professor) |
| turma_id | UUID | Sim | FK para Turma |
| componente_id | UUID | Sim | FK para ComponenteCurricular (MA, LP, CI) |
| ano_letivo | Integer | Sim | Ano letivo da atribuição |
| carga_horaria_semanal | Integer | Sim | Horas/aulas por semana |
| criado_em | DateTime | Sim | Timestamp de criação |
| atualizado_em | DateTime | Sim | Timestamp de última atualização |

**Restrições:**
- Unique constraint: (professor_id, turma_id, componente_id, ano_letivo)

**Volume estimado:** ~60 atribuições (10 turmas × 3 componentes × 2 professores em média)

---

### 3.2 DOMÍNIO CURRÍCULO (BNCC)

#### 3.2.1 CompetenciaGeral

As 10 Competências Gerais da Educação Básica (BNCC).

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| codigo | String(10) | Sim | CG01 a CG10 (único) |
| nome | String(200) | Sim | Nome da competência |
| descricao | Text | Sim | Descrição completa da competência |
| palavra_chave | String(100) | Não | Palavra-chave resumida |
| ordem | Integer | Sim | Ordem de apresentação (1-10) |

**Volume:** 10 registros fixos

**Uso no MVP:** Apenas como referência contextual em relatórios, não rastreada individualmente.

---

#### 3.2.2 AreaConhecimento

Áreas do conhecimento da BNCC (Linguagens, Matemática, Ciências da Natureza, etc).

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| codigo | String(10) | Sim | Código único (ex: MAT, LGG, CNT) |
| nome | String(100) | Sim | Nome da área |
| etapa | Enum | Sim | `ensino_fundamental_finais`, `ensino_medio` |
| ordem | Integer | Sim | Ordem de apresentação |

**Volume:** ~5 registros (MVP: 3 áreas - Matemática, Linguagens, Ciências da Natureza)

---

#### 3.2.3 ComponenteCurricular

Componentes curriculares (disciplinas).

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| codigo | String(10) | Sim | MA, LP, CI, etc (único) |
| nome | String(100) | Sim | Matemática, Língua Portuguesa, Ciências |
| area_id | UUID | Sim | FK para AreaConhecimento |
| cor_hex | String(7) | Não | Cor para UI (ex: #FF6B6B) |
| icone | String(50) | Não | Identificador de ícone |
| ordem | Integer | Sim | Ordem de apresentação |

**Volume:** 3 registros MVP (MA, LP, CI)

---

#### 3.2.4 UnidadeTematica

Agrupamentos temáticos dentro de cada componente curricular.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| componente_id | UUID | Sim | FK para ComponenteCurricular |
| nome | String(200) | Sim | Ex: "Álgebra", "Geometria" (Matemática) |
| descricao | Text | Não | Descrição da unidade temática |
| ordem | Integer | Sim | Ordem de apresentação |

**Exemplos (Matemática):** Números, Álgebra, Geometria, Grandezas e Medidas, Probabilidade e Estatística

**Volume:** ~15 registros MVP (5 unidades × 3 componentes)

---

#### 3.2.5 ObjetoConhecimento

Objetos de conhecimento dentro de cada unidade temática.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| unidade_tematica_id | UUID | Sim | FK para UnidadeTematica |
| nome | String(300) | Sim | Ex: "Equações polinomiais do 1º grau" |
| descricao | Text | Não | Descrição detalhada |
| ordem | Integer | Sim | Ordem de apresentação |

**Volume:** ~50 registros MVP

---

#### 3.2.6 Habilidade

**Unidade atômica de análise do sistema.** Representa as habilidades da BNCC.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| codigo | String(20) | Sim | Código BNCC (ex: EF07MA18) único |
| descricao | Text | Sim | Descrição completa da habilidade |
| objeto_conhecimento_id | UUID | Sim | FK para ObjetoConhecimento |
| versao_bncc | String(10) | Sim | Versão da BNCC (ex: "2018") |
| tipo | Enum | Sim | `bncc`, `estadual`, `municipal`, `customizada` |
| estado | String(2) | Não | UF se tipo=estadual (ex: "SP") |
| ativa | Boolean | Sim | Flag de vigência (default: true) |
| criado_em | DateTime | Sim | Timestamp de criação |
| atualizado_em | DateTime | Sim | Timestamp de última atualização |

**Relacionamentos especiais:**
- **Língua Portuguesa:** Relacionamento N:N com CampoAtuacao e PraticaLinguagem
- **Anos aplicáveis:** Relacionamento N:N com HabilidadeAno (necessário para blocos compartilhados de LP)

**Volume:** ~369 habilidades MVP (121 MA + 63 CI + ~185 LP)

---

#### 3.2.7 HabilidadeAno

Relacionamento N:N entre Habilidade e Anos/Séries aplicáveis.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| habilidade_id | UUID | Sim | FK para Habilidade |
| ano_serie | Integer | Sim | Ano aplicável (6, 7, 8, 9) |

**Restrições:**
- Composite PK: (habilidade_id, ano_serie)

**Necessidade:** Blocos compartilhados de LP (EF67LP aplica a 6º e 7º, EF69LP a 6º-9º, etc)

**Volume:** ~600 registros (algumas habilidades mapeiam para múltiplos anos)

---

#### 3.2.8 CampoAtuacao (específico de LP)

Campos de atuação social da linguagem (Língua Portuguesa).

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| nome | String(100) | Sim | Nome do campo |
| descricao | Text | Não | Descrição do campo de atuação |

**Exemplos:** Jornalístico-midiático, Atuação na vida pública, Práticas de estudo e pesquisa, Artístico-literário, Todos os campos

**Volume:** 5 registros

---

#### 3.2.9 PraticaLinguagem (específico de LP)

Práticas de linguagem da BNCC (Língua Portuguesa).

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| nome | String(50) | Sim | Nome da prática |
| descricao | Text | Não | Descrição da prática |

**Exemplos:** Leitura, Produção de textos, Oralidade, Análise linguística/semiótica

**Volume:** 4 registros

---

#### 3.2.10 HabilidadeCampoAtuacao e HabilidadePraticaLinguagem

Relacionamentos N:N específicos para Língua Portuguesa.

**Atributos:**

| Tabela | Atributos |
|--------|-----------|
| HabilidadeCampoAtuacao | habilidade_id (FK), campo_atuacao_id (FK) |
| HabilidadePraticaLinguagem | habilidade_id (FK), pratica_linguagem_id (FK) |

**Restrições:** Composite PK em ambas

**Volume:** ~300 registros combinados (apenas habilidades de LP)

---

### 3.3 DOMÍNIO PLANEJAMENTO

#### 3.3.1 PlanejamentoBimestral

Planejamento pedagógico do professor para um bimestre letivo.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| professor_turma_id | UUID | Sim | FK para ProfessorTurma |
| ano_letivo | Integer | Sim | Ano letivo (ex: 2026) |
| bimestre | Integer | Sim | 1, 2, 3 ou 4 |
| titulo | String(200) | Não | Título opcional do planejamento |
| observacoes | Text | Não | Observações gerais do professor |
| status | Enum | Sim | `rascunho`, `submetido`, `validado`, `em_execucao`, `encerrado` |
| validado_por | UUID | Não | FK para Usuario (coordenador que validou) |
| validado_em | DateTime | Não | Data de validação |
| criado_em | DateTime | Sim | Timestamp de criação |
| atualizado_em | DateTime | Sim | Timestamp de última atualização |

**Relacionamentos:**
- 1:N com ItemPlanejamento
- N:1 com ProfessorTurma
- 1:N com Aula

**Volume estimado:** 4 planejamentos/ano × 60 atribuições = 240 planejamentos/ano por escola

---

#### 3.3.2 ItemPlanejamento

Item individual do planejamento bimestral (conteúdo a ser trabalhado).

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| planejamento_id | UUID | Sim | FK para PlanejamentoBimestral |
| descricao_livre | Text | Sim | Descrição do conteúdo em texto livre |
| ordem | Integer | Sim | Ordem sequencial no planejamento |
| carga_horaria_prevista | Integer | Não | Horas/aulas previstas para este item |
| criado_em | DateTime | Sim | Timestamp de criação |
| atualizado_em | DateTime | Sim | Timestamp de última atualização |

**Relacionamentos:**
- N:1 com PlanejamentoBimestral
- N:N com Habilidade (através de ItemHabilidade)

**Volume estimado:** ~8 itens/planejamento × 240 planejamentos = 1.920 itens/ano por escola

---

#### 3.3.3 ItemHabilidade

Vinculação entre Item de Planejamento e Habilidades BNCC.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| item_planejamento_id | UUID | Sim | FK para ItemPlanejamento |
| habilidade_id | UUID | Sim | FK para Habilidade |
| tipo_vinculacao | Enum | Sim | Tipo de vinculação |
| confianca_ia | Decimal(3,2) | Não | Nível de confiança se sugerida por IA (0-1) |
| criado_em | DateTime | Sim | Timestamp de criação |
| criado_por | UUID | Não | FK para Usuario (quem criou a vinculação) |

**Enum tipo_vinculacao:**
- `manual`: Professor selecionou manualmente da lista BNCC
- `sugerida`: IA sugeriu, aguardando confirmação do professor
- `ia_confirmada`: Professor confirmou sugestão da IA
- `detectada_aula`: IA detectou na transcrição da aula (não planejada)

**Restrições:**
- Unique constraint: (item_planejamento_id, habilidade_id)

**Volume estimado:** ~3 habilidades/item × 1.920 itens = 5.760 vinculações/ano por escola

---

#### 3.3.4 ObjetivoAula (Opcional)

Objetivos específicos de uma aula individual (nível 2 de planejamento - opcional).

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| aula_id | UUID | Sim | FK para Aula |
| descricao | Text | Sim | Objetivo da aula em texto livre |
| criado_em | DateTime | Sim | Timestamp de criação |

**Uso:** Campo opcional que melhora a qualidade da análise mas não é obrigatório para o funcionamento do sistema.

**Volume estimado:** ~30% das aulas têm objetivos específicos cadastrados

---

### 3.4 DOMÍNIO EXECUÇÃO E ANÁLISE

#### 3.4.1 Aula

Registro de uma aula ministrada.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| planejamento_id | UUID | Sim | FK para PlanejamentoBimestral |
| data | Date | Sim | Data da aula |
| duracao_minutos | Integer | Não | Duração da aula em minutos |
| titulo | String(200) | Não | Título opcional da aula |
| observacoes_pre | Text | Não | Observações antes da aula |
| observacoes_pos | Text | Não | Observações após a aula |
| status_processamento | Enum | Sim | Estado atual do processamento |
| criado_em | DateTime | Sim | Timestamp de criação |
| atualizado_em | DateTime | Sim | Timestamp de última atualização |

**Enum status_processamento:**
- `criada`: Aula cadastrada, aguardando upload
- `aguardando_transcricao`: Arquivo enviado, processamento não iniciado
- `transcricao_em_andamento`: Transcrição em processamento
- `transcrita`: Transcrição concluída, aguardando análise
- `analise_em_andamento`: Análise pedagógica em processamento
- `analisada`: Análise concluída, aguardando revisão
- `em_revisao`: Professor revisando outputs gerados
- `aprovada`: Professor aprovou relatório/exercícios
- `rejeitada`: Professor rejeitou, necessita reprocessamento
- `erro`: Erro no processamento

**Relacionamentos:**
- N:1 com PlanejamentoBimestral
- 1:1 com Transcricao
- 1:1 com Analise
- 1:N com Relatorio
- 1:N com Exercicio
- 1:N com CoberturaAula

**Volume estimado:** 40 aulas/bimestre × 4 bimestres × 60 atribuições = 9.600 aulas/ano por escola

---

#### 3.4.2 Transcricao

Transcrição do áudio/conteúdo da aula.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| aula_id | UUID | Sim | FK para Aula (único) |
| fonte | Enum | Sim | Origem da transcrição |
| arquivo_audio_url | String(500) | Não | URL do arquivo de áudio (se aplicável) |
| formato_audio | String(10) | Não | mp3, wav, m4a, etc |
| tamanho_audio_mb | Decimal(10,2) | Não | Tamanho do arquivo em MB |
| texto_completo | Text | Sim | Texto completo da transcrição |
| confianca_media | Decimal(3,2) | Não | Confiança média da transcrição (0-1) |
| idioma | String(5) | Sim | Código do idioma (pt-BR) |
| motor_transcricao | String(50) | Não | Whisper, Google Speech, etc |
| tempo_processamento_seg | Integer | Não | Tempo de processamento em segundos |
| custo_processamento | Decimal(10,4) | Não | Custo de API em reais |
| criado_em | DateTime | Sim | Timestamp de criação |

**Enum fonte:**
- `upload_audio`: Upload de arquivo de áudio
- `upload_texto`: Upload direto de texto
- `importacao_readai`: Importação de Read.ai
- `digitacao_manual`: Professor digitou manualmente
- `integracao_externa`: Outra integração

**Relacionamentos:**
- 1:1 com Aula

**Volume estimado:** 9.600 transcrições/ano por escola

**Estimativa de storage:**
- Texto: ~5KB por transcrição média
- Áudio (se armazenado): ~25MB por aula de 50min
- Total texto: 9.600 × 5KB = 48MB/ano
- Total áudio: 9.600 × 25MB = 240GB/ano (se todos os áudios forem armazenados)

---

#### 3.4.3 Analise

Análise pedagógica gerada pela IA a partir da transcrição.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| aula_id | UUID | Sim | FK para Aula (único) |
| versao_modelo | String(50) | Sim | Modelo de IA utilizado (ex: gpt-4o-mini) |
| prompt_template_version | String(20) | Sim | Versão do template de prompt usado |
| analise_qualitativa | JSON | Sim | Análise estruturada em JSON |
| insights | JSON | Não | Insights e recomendações estruturados |
| gaps_detectados | JSON | Não | Lista de gaps de conteúdo detectados |
| sinais_dificuldade | JSON | Não | Sinais de dificuldade/desengajamento |
| percentual_progresso | Decimal(5,2) | Não | % de progresso do planejamento (0-100) |
| tempo_processamento_seg | Integer | Não | Tempo de processamento em segundos |
| custo_processamento | Decimal(10,4) | Não | Custo de API em reais |
| criado_em | DateTime | Sim | Timestamp de criação |

**Estrutura JSON de analise_qualitativa (exemplo):**
```json
{
  "cobertura_conteudo": {
    "planejado_coberto_pct": 75.0,
    "itens_cobertos": ["Equações 1º grau", "Problemas contextualizados"],
    "itens_nao_cobertos": ["Sistemas de equações"]
  },
  "qualidade_didatica": {
    "clareza": 8.5,
    "exemplos_usados": 12,
    "interacao_alunos": "alta",
    "linguagem_adequada": true
  },
  "engajamento": {
    "perguntas_alunos": 8,
    "participacao_estimada": "70%",
    "momentos_dispersao": []
  }
}
```

**Relacionamentos:**
- 1:1 com Aula
- Alimenta geração de Relatório e Exercício

**Volume estimado:** 9.600 análises/ano por escola

**Estimativa de storage:** ~15KB por análise × 9.600 = 144MB/ano

---

#### 3.4.4 CoberturaAula

Cobertura de habilidades BNCC detectada em uma aula específica.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| aula_id | UUID | Sim | FK para Aula |
| habilidade_id | UUID | Sim | FK para Habilidade |
| nivel_cobertura | Enum | Sim | Nível de cobertura detectado |
| evidencia_texto | Text | Não | Trecho da transcrição que evidencia |
| confianca_ia | Decimal(3,2) | Sim | Confiança da IA na detecção (0-1) |
| criado_em | DateTime | Sim | Timestamp de criação |

**Enum nivel_cobertura:**
- `nao_coberta` (0): Habilidade não aparece na aula
- `mencionada` (1): Conteúdo relacionado citado brevemente
- `parcial` (2): Conceitos trabalhados sem profundidade completa
- `aprofundada` (3): Habilidade trabalhada com exemplos, exercícios, discussão

**Restrições:**
- Unique constraint: (aula_id, habilidade_id)

**Relacionamentos:**
- N:1 com Aula
- N:1 com Habilidade

**Volume estimado:** ~5 habilidades detectadas/aula × 9.600 aulas = 48.000 registros/ano por escola

---

#### 3.4.5 CoberturaBimestral (Tabela Materializada/Cache)

Agregação da cobertura de habilidades ao longo do bimestre.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| planejamento_id | UUID | Sim | FK para PlanejamentoBimestral |
| habilidade_id | UUID | Sim | FK para Habilidade |
| total_aulas_cobrindo | Integer | Sim | Quantidade de aulas que cobriram |
| nivel_cobertura_maximo | Enum | Sim | Maior nível atingido |
| nivel_cobertura_agregado | Decimal(3,2) | Sim | Média ponderada dos níveis (0-3) |
| percentual_progresso | Decimal(5,2) | Sim | % de progresso estimado (0-100) |
| primeira_cobertura_em | DateTime | Não | Data da primeira cobertura |
| ultima_cobertura_em | DateTime | Não | Data da última cobertura |
| atualizado_em | DateTime | Sim | Timestamp de última recalculação |

**Restrições:**
- Unique constraint: (planejamento_id, habilidade_id)

**Propósito:** Performance - evita recalcular agregações em toda consulta de dashboard

**Volume estimado:** ~8 habilidades/planejamento × 240 planejamentos = 1.920 registros/escola

**Atualização:** Recalculada após cada nova Aula analisada

---

#### 3.4.6 Relatorio

Relatório gerado automaticamente pela IA para uma aula.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| aula_id | UUID | Sim | FK para Aula |
| tipo_formato | Enum | Sim | Formato do relatório |
| conteudo | Text | Sim | Conteúdo do relatório em formato especificado |
| conteudo_json | JSON | Não | Versão estruturada do conteúdo |
| template_usado | String(100) | Não | Identificador do template usado |
| status_revisao | Enum | Sim | Status da revisão do professor |
| versao | Integer | Sim | Número da versão (se regerar) |
| editado_por | UUID | Não | FK para Usuario (se editado) |
| aprovado_por | UUID | Não | FK para Usuario (professor que aprovou) |
| aprovado_em | DateTime | Não | Data de aprovação |
| observacoes_professor | Text | Não | Observações do professor na revisão |
| criado_em | DateTime | Sim | Timestamp de criação |
| atualizado_em | DateTime | Sim | Timestamp de última atualização |

**Enum tipo_formato:**
- `texto_livre`: Texto narrativo livre
- `markdown`: Formato Markdown
- `html`: HTML formatado
- `pdf`: PDF (armazenado como URL)
- `estruturado_json`: JSON estruturado

**Enum status_revisao:**
- `gerado`: Recém gerado, aguardando revisão
- `em_revisao`: Professor está revisando
- `aprovado_sem_edicao`: Aprovado sem mudanças
- `aprovado_com_edicao`: Aprovado após edições
- `rejeitado`: Rejeitado, precisa regerar

**Relacionamentos:**
- N:1 com Aula (pode ter múltiplas versões)

**Volume estimado:** 9.600 relatórios/ano por escola

**Estimativa de storage:** ~3KB por relatório × 9.600 = 28.8MB/ano

---

#### 3.4.7 Exercicio

Exercícios contextuais gerados pela IA a partir do conteúdo da aula.

**Atributos:**

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| aula_id | UUID | Sim | FK para Aula |
| tipo_exercicio | Enum | Sim | Tipo do exercício |
| enunciado | Text | Sim | Enunciado do exercício |
| opcoes | JSON | Não | Opções (se múltipla escolha) |
| resposta_esperada | Text | Não | Gabarito/resposta esperada |
| nivel_dificuldade | Enum | Sim | Nível de dificuldade |
| habilidade_id | UUID | Não | FK para Habilidade relacionada |
| ordem | Integer | Sim | Ordem na lista de exercícios |
| status_revisao | Enum | Sim | Status da revisão do professor |
| aprovado_por | UUID | Não | FK para Usuario (professor) |
| aprovado_em | DateTime | Não | Data de aprovação |
| criado_em | DateTime | Sim | Timestamp de criação |
| atualizado_em | DateTime | Sim | Timestamp de última atualização |

**Enum tipo_exercicio:**
- `multipla_escolha`: Questão de múltipla escolha
- `dissertativa`: Questão dissertativa
- `verdadeiro_falso`: Verdadeiro ou falso
- `associacao`: Associar colunas
- `completar`: Completar lacunas

**Enum nivel_dificuldade:**
- `facil`: Conceitos básicos
- `medio`: Aplicação
- `dificil`: Análise/síntese

**Enum status_revisao:**
- `gerado`: Recém gerado
- `aprovado`: Aprovado pelo professor
- `editado`: Editado pelo professor
- `rejeitado`: Rejeitado

**Relacionamentos:**
- N:1 com Aula
- N:1 com Habilidade (opcional)

**Volume estimado:** ~5 exercícios/aula × 9.600 aulas = 48.000 exercícios/ano por escola

**Estimativa de storage:** ~1KB por exercício × 48.000 = 48MB/ano

---

## 4. Diagrama de Relacionamentos Consolidado

### 4.1 Visão Geral dos Relacionamentos

```
┌──────────────────────────────────────────────────────────────────────┐
│                         MODELO DE DADOS                               │
│                       PROFESSOR ANALYTICS                             │
└──────────────────────────────────────────────────────────────────────┘

DOMÍNIO ORGANIZACIONAL
┌─────────┐         ┌─────────┐         ┌─────────────────┐
│ Escola  │────1:N──│  Turma  │────N:N──│ProfessorTurma   │
└─────────┘         └─────────┘         └─────────────────┘
     │                                            │
     │                                            │
     │                                            │
     └───────────1:N────────┐                     │
                           │                     │
                    ┌──────────┐                 │
                    │ Usuario  │─────────────────┘
                    │(Professor│
                    │Coordenador│
                    │Diretor)   │
                    └──────────┘

DOMÍNIO CURRÍCULO (BNCC)
┌────────────────┐    ┌───────────────────┐    ┌──────────────────┐
│CompetenciaGeral│    │ AreaConhecimento  │    │  Componente      │
│(10 competências)│    └───────────────────┘    │  Curricular      │
└────────────────┘            │                 └──────────────────┘
                              │1:N                       │1:N
                              │                          │
                    ┌─────────────────────┐              │
                    │ UnidadeTematica     │◄─────────────┘
                    └─────────────────────┘
                              │1:N
                              │
                    ┌─────────────────────┐
                    │ ObjetoConhecimento  │
                    └─────────────────────┘
                              │1:N
                              │
                    ┌─────────────────────┐
                    │   Habilidade        │◄───┐
                    │  (UNIDADE ATÔMICA)  │    │
                    └─────────────────────┘    │
                         │                     │
                         │N:N                  │
                         │                     │
                    ┌─────────────────┐        │
                    │ HabilidadeAno   │        │
                    └─────────────────┘        │
                                               │
    (Específico LP)                             │
    ┌────────────────┐  ┌─────────────────┐    │
    │ CampoAtuacao   │  │PraticaLinguagem │    │
    └────────────────┘  └─────────────────┘    │
           │N:N                 │N:N            │
           └──────────┬─────────┘               │
                      │                         │
                ┌─────────────┐                 │
                │ Habilidade  │                 │
                │    (LP)     │                 │
                └─────────────┘                 │
                                                │
DOMÍNIO PLANEJAMENTO                             │
┌─────────────────┐        ┌──────────────────┐ │
│ProfessorTurma   │───1:N──│ Planejamento     │ │
│                 │        │ Bimestral        │ │
└─────────────────┘        └──────────────────┘ │
                                  │1:N           │
                                  │              │
                         ┌────────────────────┐  │
                         │ ItemPlanejamento   │  │
                         └────────────────────┘  │
                                  │N:N            │
                                  │              │
                         ┌────────────────────┐  │
                         │ ItemHabilidade     │──┘
                         │ (vinculação)       │
                         └────────────────────┘

DOMÍNIO EXECUÇÃO E ANÁLISE
┌──────────────────┐        ┌────────────────┐
│ Planejamento     │───1:N──│     Aula       │
│ Bimestral        │        └────────────────┘
└──────────────────┘               │1:1
                                   │
                          ┌────────┴────────┐
                          │                 │
                    ┌─────────────┐   ┌──────────┐
                    │Transcricao  │   │ Analise  │
                    └─────────────┘   └──────────┘
                                            │
                          ┌─────────────────┼──────────────┐
                          │                 │              │
                    ┌──────────┐     ┌──────────────┐ ┌──────────┐
                    │Relatorio │     │CoberturaAula │ │Exercicio │
                    └──────────┘     └──────────────┘ └──────────┘
                                            │N:1
                                            │
                                     ┌─────────────┐
                                     │ Habilidade  │
                                     └─────────────┘
                                            │
                                     ┌─────────────────────┐
                                     │ CoberturaBimestral  │
                                     │  (materializada)    │
                                     └─────────────────────┘
```

### 4.2 Relacionamentos Detalhados por Fluxo

#### Fluxo 1: Professor → Turmas → Planejamentos

```
Usuario (Professor)
  │
  └──1:N──→ ProfessorTurma
              │
              ├──N:1──→ Turma
              │           └──N:1──→ Escola
              │
              ├──N:1──→ ComponenteCurricular
              │
              └──1:N──→ PlanejamentoBimestral
                          │
                          └──1:N──→ ItemPlanejamento
                                      │
                                      └──N:N──→ Habilidade
                                                (via ItemHabilidade)
```

#### Fluxo 2: Aula → Transcrição → Análise → Relatório

```
Aula
  │
  ├──1:1──→ Transcricao
  │           │
  │           └── (arquivo_audio_url, texto_completo, fonte)
  │
  ├──1:1──→ Analise
  │           │
  │           └── (analise_qualitativa, insights, gaps_detectados)
  │
  ├──1:N──→ Relatorio (pode ter múltiplas versões)
  │           │
  │           └── (conteudo, status_revisao, aprovado_em)
  │
  ├──1:N──→ Exercicio
  │           │
  │           └── (enunciado, resposta_esperada, nivel_dificuldade)
  │
  └──1:N──→ CoberturaAula
              │
              └──N:1──→ Habilidade
```

#### Fluxo 3: Planejamento → Habilidades BNCC

```
PlanejamentoBimestral
  │
  └──1:N──→ ItemPlanejamento
              │
              └──N:N──→ ItemHabilidade
                          │
                          ├── tipo_vinculacao (manual, sugerida, ia_confirmada)
                          ├── confianca_ia
                          │
                          └──N:1──→ Habilidade
                                      │
                                      ├──N:1──→ ObjetoConhecimento
                                      │           └──N:1──→ UnidadeTematica
                                      │                       └──N:1──→ ComponenteCurricular
                                      │
                                      └──N:N──→ HabilidadeAno
```

---

## 5. Estados e Ciclo de Vida

### 5.1 Ciclo de Vida de uma Aula

```
┌─────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DA AULA                         │
└─────────────────────────────────────────────────────────────────┘

[1. CRIAÇÃO]
   Professor cadastra aula no sistema
   Status: criada
   ↓

[2. UPLOAD DE CONTEÚDO]
   Professor faz upload de áudio/texto/Read.ai
   Status: aguardando_transcricao
   ↓

[3. TRANSCRIÇÃO] (se necessário)
   Sistema processa áudio → texto
   Status: transcricao_em_andamento → transcrita
   Tempo: 2-5 min para aula de 50min
   ↓

[4. ANÁLISE PEDAGÓGICA]
   IA cruza transcrição × planejamento × BNCC
   Status: analise_em_andamento → analisada
   Tempo: 30-60 seg
   Entidades criadas:
     - Analise (1)
     - CoberturaAula (N habilidades detectadas)
     - CoberturaBimestral (atualização)
   ↓

[5. GERAÇÃO DE OUTPUTS]
   IA gera relatório e exercícios
   Status: analisada (outputs disponíveis)
   Tempo: 20-40 seg
   Entidades criadas:
     - Relatorio (1)
     - Exercicio (5-10)
   ↓

[6. REVISÃO DO PROFESSOR]
   Professor revisa relatório e exercícios
   Status: em_revisao
   Tempo: ~5 min (humano)
   Ações possíveis:
     - Aprovar sem edição
     - Editar e aprovar
     - Rejeitar e solicitar nova geração
   ↓

[7. APROVAÇÃO]
   Professor aprova outputs
   Status: aprovada
   Relatorio.status_revisao = aprovado_sem_edicao | aprovado_com_edicao
   Exercicio.status_revisao = aprovado | editado
   ↓

[8. ENCERRAMENTO]
   Aula finalizada e dados consolidados
   CoberturaBimestral atualizada
   Métricas agregadas atualizadas


TRATAMENTO DE ERROS
   Status: erro
   Motivos possíveis:
     - Falha na transcrição (áudio corrompido)
     - Erro na API de IA (timeout, quota)
     - Conteúdo inadequado detectado
   Ação: Permite reprocessamento manual
```

### 5.2 Máquina de Estados - Aula.status_processamento

| Estado | Descrição | Transições Possíveis | Trigger |
|--------|-----------|---------------------|---------|
| **criada** | Aula criada, sem conteúdo | → aguardando_transcricao | Upload de arquivo |
| **aguardando_transcricao** | Arquivo enviado, fila de processamento | → transcricao_em_andamento<br>→ erro | Início do processamento<br>Falha no upload |
| **transcricao_em_andamento** | Transcrição em processamento | → transcrita<br>→ erro | Sucesso<br>Falha na API |
| **transcrita** | Transcrição concluída | → analise_em_andamento | Início da análise |
| **analise_em_andamento** | Análise pedagógica processando | → analisada<br>→ erro | Sucesso<br>Falha na API |
| **analisada** | Análise concluída, outputs gerados | → em_revisao | Professor acessa tela |
| **em_revisao** | Professor revisando | → aprovada<br>→ rejeitada | Aprovar<br>Rejeitar |
| **aprovada** | Aprovada pelo professor | (estado final) | - |
| **rejeitada** | Rejeitada, necessita ação | → analise_em_andamento | Reprocessar |
| **erro** | Erro no processamento | → aguardando_transcricao<br>→ analise_em_andamento | Tentar novamente |

### 5.3 Ciclo de Vida do Planejamento Bimestral

```
[1. CRIAÇÃO]
   Professor inicia planejamento do bimestre
   Status: rascunho
   ↓

[2. PREENCHIMENTO]
   Professor cadastra itens de planejamento
   Sistema sugere habilidades BNCC
   Status: rascunho
   ↓

[3. SUBMISSÃO]
   Professor finaliza e submete para validação
   Status: submetido
   ↓

[4. VALIDAÇÃO] (opcional, conforme política da escola)
   Coordenador revisa planejamento
   Status: validado
   validado_por = id do coordenador
   ↓

[5. EXECUÇÃO]
   Bimestre inicia, aulas começam a ser cadastradas
   Status: em_execucao
   ↓

[6. ENCERRAMENTO]
   Bimestre finaliza
   Status: encerrado
   Métricas finais de cobertura consolidadas
```

### 5.4 Estados de Revisão de Relatório

| Estado | Ação do Professor | Próximo Estado |
|--------|-------------------|----------------|
| **gerado** | Relatório recém criado pela IA | em_revisao (ao abrir) |
| **em_revisao** | Professor está revisando | aprovado_sem_edicao, aprovado_com_edicao, rejeitado |
| **aprovado_sem_edicao** | Aceito como está | (final) |
| **aprovado_com_edicao** | Editado e aprovado | (final) |
| **rejeitado** | Não aceito, precisa regerar | gerado (nova versão) |

---

## 6. Volume Estimado de Dados

### 6.1 Premissas para Cálculo

**Escola padrão (MVP):**
- 10 turmas (6º ao 9º ano)
- 3 componentes curriculares (MA, LP, CI)
- 2 professores em média por componente
- 60 atribuições professor-turma-componente
- 40 aulas por bimestre por atribuição
- 4 bimestres/ano
- 200 dias letivos/ano

**Horas/mês por escola:**
- 10 turmas × 4 horas/dia × 20 dias úteis = 800 horas/mês
- 800 horas/mês × 50 minutos = 40.000 minutos/mês
- 9.600 aulas/ano

### 6.2 Volume de Registros por Entidade

| Entidade | Fator de Cálculo | Volume/Ano (1 escola) | Volume/5 Anos |
|----------|------------------|----------------------|---------------|
| **Escola** | 1 | 1 | 1 |
| **Turma** | 10/ano | 10 | 50 |
| **Usuario** | 28/escola | 28 | 140 |
| **ProfessorTurma** | 60/ano | 60 | 300 |
| **Habilidade** | 369 (carga inicial) | 369 | 369 |
| **PlanejamentoBimestral** | 60 atrib. × 4 bim. | 240 | 1.200 |
| **ItemPlanejamento** | 8/planej. × 240 | 1.920 | 9.600 |
| **ItemHabilidade** | 3/item × 1.920 | 5.760 | 28.800 |
| **Aula** | 40/bim × 60 atrib. × 4 | 9.600 | 48.000 |
| **Transcricao** | 1/aula | 9.600 | 48.000 |
| **Analise** | 1/aula | 9.600 | 48.000 |
| **CoberturaAula** | 5 hab./aula × 9.600 | 48.000 | 240.000 |
| **CoberturaBimestral** | 8 hab./planej. × 240 | 1.920 | 9.600 |
| **Relatorio** | 1/aula | 9.600 | 48.000 |
| **Exercicio** | 5/aula × 9.600 | 48.000 | 240.000 |
| **TOTAL GERAL** | | **~135.000** | **~675.000** |

### 6.3 Estimativa de Storage por Domínio

#### Dados Estruturados (SQL)

| Domínio | Tamanho Médio/Registro | Registros/Ano | Storage/Ano | Storage/5 Anos |
|---------|------------------------|---------------|-------------|----------------|
| Organizacional | 500 bytes | 100 | 50 KB | 250 KB |
| Currículo (BNCC) | 800 bytes | 369 | 295 KB | 295 KB (fixo) |
| Planejamento | 600 bytes | 7.920 | 4.75 MB | 23.75 MB |
| Execução (metadados) | 400 bytes | 67.200 | 26.88 MB | 134.4 MB |
| **TOTAL SQL** | | | **~32 MB** | **~158 MB** |

#### Dados Não-Estruturados (JSON, Texto)

| Tipo | Tamanho Médio | Quantidade/Ano | Storage/Ano | Storage/5 Anos |
|------|---------------|----------------|-------------|----------------|
| Transcricao.texto_completo | 5 KB | 9.600 | 48 MB | 240 MB |
| Analise.analise_qualitativa (JSON) | 15 KB | 9.600 | 144 MB | 720 MB |
| Relatorio.conteudo | 3 KB | 9.600 | 28.8 MB | 144 MB |
| Exercicio (todos) | 1 KB | 48.000 | 48 MB | 240 MB |
| **TOTAL Não-Estruturados** | | | **~269 MB** | **~1.34 GB** |

#### Arquivos de Áudio (Opcional - se armazenados)

| Tipo | Tamanho Médio | Quantidade/Ano | Storage/Ano | Storage/5 Anos |
|------|---------------|----------------|-------------|----------------|
| Áudio de aula (MP3 128kbps) | 25 MB | 9.600 | 240 GB | 1.2 TB |

**Decisão de arquitetura:** Áudios podem ser descartados após transcrição ou armazenados em cold storage (S3 Glacier) para reduzir custos.

#### Total Consolidado (sem áudio)

| Categoria | Storage/Ano | Storage/5 Anos |
|-----------|-------------|----------------|
| SQL (estruturado) | 32 MB | 158 MB |
| NoSQL/Texto | 269 MB | 1.34 GB |
| **TOTAL** | **~301 MB/escola** | **~1.5 GB/escola** |

**Projeção para 100 escolas (5 anos):** ~150 GB

### 6.4 Tráfego de API de IA

#### Custo Estimado de Processamento

**Premissas de API:**
- Transcrição (Whisper API): R$ 0,10 por hora de áudio
- Análise pedagógica (GPT-4o-mini): ~R$ 0,30 por análise
- Geração de relatório: ~R$ 0,15 por relatório
- Geração de exercícios: ~R$ 0,20 por conjunto

| Operação | Custo Unitário | Quantidade/Mês | Custo/Mês | Custo/Ano |
|----------|----------------|----------------|-----------|-----------|
| Transcrição (800h) | R$ 0,10/h | 800 | R$ 80 | R$ 960 |
| Análise | R$ 0,30 | 800 | R$ 240 | R$ 2.880 |
| Relatório | R$ 0,15 | 800 | R$ 120 | R$ 1.440 |
| Exercícios | R$ 0,20 | 800 | R$ 160 | R$ 1.920 |
| **TOTAL/Escola** | | | **R$ 600/mês** | **R$ 7.200/ano** |

**Receita estimada (R$ 1.200/mês por escola):**
- Margem bruta: R$ 600/mês (50%)
- LTV (24 meses): R$ 28.800
- CAC break-even: ~5 meses

### 6.5 Requisitos de Performance

| Métrica | Requisito | Dimensionamento |
|---------|-----------|-----------------|
| **Transcrição de 50min** | < 5 minutos | Processamento assíncrono, fila |
| **Análise pedagógica** | < 60 segundos | API de IA otimizada |
| **Geração relatório+exercícios** | < 40 segundos | Paralelo, cache de templates |
| **Dashboard de cobertura** | < 2 segundos | Tabela materializada, índices |
| **Busca de habilidades BNCC** | < 500ms | Índice full-text, cache |
| **Consulta histórico de aulas** | < 1 segundo | Paginação, índices em datas |

**Índices críticos:**
- Aula: (planejamento_id, data, status_processamento)
- CoberturaAula: (aula_id, habilidade_id)
- CoberturaBimestral: (planejamento_id, habilidade_id)
- Habilidade: (codigo), full-text em (descricao)
- Usuario: (email, escola_id)

---

## 7. Decisões de Design de Banco de Dados

### 7.1 Escolha do Banco de Dados Principal

**Recomendação: PostgreSQL**

| Critério | Justificativa |
|----------|---------------|
| **Modelo relacional forte** | Domínios de Planejamento e Currículo são altamente relacionais |
| **Suporte a JSON nativo** | Analise.analise_qualitativa, insights estruturados |
| **Full-text search** | Busca em habilidades BNCC e transcrições |
| **Extensibilidade** | pg_trgm para similaridade de texto, extensões de busca |
| **ACID completo** | Crítico para integridade de dados educacionais |
| **Performance em agregações** | Dashboards com métricas agregadas |
| **Custo** | Open-source, managed services disponíveis (RDS, Supabase) |

**Alternativas consideradas:**
- **MySQL:** Menos robusto em JSON e full-text
- **MongoDB:** Excelente para JSON, mas relacionamentos complexos de BNCC seriam problemáticos
- **Híbrido (Postgres + MongoDB):** Complexidade operacional não justificada no MVP

### 7.2 Estratégia de Particionamento

**Tabelas candidatas a particionamento:**

| Tabela | Estratégia | Chave de Partição | Motivo |
|--------|------------|-------------------|--------|
| **Aula** | Range | data (ano_letivo) | Consultas filtram por período |
| **Transcricao** | Range | criado_em (ano) | Tabela grande, crescimento linear |
| **Analise** | Range | criado_em (ano) | Tabela grande, crescimento linear |
| **CoberturaAula** | Range | aula.data (FK) | Volume altíssimo (~50k/ano) |
| **Relatorio** | Range | criado_em (ano) | Arquivamento por ano |

**Política de retenção:**
- Anos letivos encerrados: migrar para cold storage após 2 anos
- Dados agregados (CoberturaBimestral): manter indefinidamente

### 7.3 Índices Estratégicos

```sql
-- Índices de performance crítica

-- Aula: consultas por planejamento e status
CREATE INDEX idx_aula_planejamento_status
ON aula (planejamento_id, status_processamento, data DESC);

-- CoberturaAula: agregações de cobertura
CREATE INDEX idx_cobertura_aula_habilidade
ON cobertura_aula (aula_id, habilidade_id, nivel_cobertura);

-- Habilidade: busca por código e componente
CREATE INDEX idx_habilidade_codigo
ON habilidade (codigo);
CREATE INDEX idx_habilidade_componente
ON habilidade (objeto_conhecimento_id, ativa);

-- Full-text search em habilidades
CREATE INDEX idx_habilidade_fts
ON habilidade USING gin(to_tsvector('portuguese', descricao));

-- ItemHabilidade: vinculações por tipo
CREATE INDEX idx_item_habilidade_tipo
ON item_habilidade (item_planejamento_id, tipo_vinculacao);

-- Usuario: login e permissões
CREATE UNIQUE INDEX idx_usuario_email_escola
ON usuario (email, escola_id);
CREATE INDEX idx_usuario_tipo
ON usuario (tipo, status);

-- ProfessorTurma: atribuições por ano letivo
CREATE INDEX idx_professor_turma_ano
ON professor_turma (professor_id, ano_letivo);
```

### 7.4 Normalização vs. Desnormalização

| Decisão | Abordagem | Justificativa |
|---------|-----------|---------------|
| **BNCC (Habilidade, Objeto, Unidade)** | Totalmente normalizada | Dados de referência, atualizados raramente, integridade crítica |
| **CoberturaBimestral** | **Desnormalizada/Materializada** | Agregação cara, consultada frequentemente (dashboards) |
| **Analise.analise_qualitativa** | JSON desnormalizado | Estrutura flexível, evolui com templates de análise |
| **Relatorio.conteudo_json** | JSON desnormalizado | Formato varia por template, não precisa buscar campos individuais |
| **Transcricao.texto_completo** | TEXT puro | Dado "blob", nunca busca por campos internos |

### 7.5 Políticas de Soft Delete vs. Hard Delete

| Entidade | Política | Motivo |
|----------|----------|--------|
| **Escola, Turma, Usuario** | Soft delete (campo `status`) | Auditoria, compliance LGPD |
| **Aula, Transcricao, Analise** | Soft delete (campo `deletado_em`) | Rastreabilidade, possível recuperação |
| **Relatorio, Exercicio** | Hard delete permitido (versões) | Múltiplas versões, limpeza de rascunhos OK |
| **Habilidade BNCC** | Soft delete (`ativa = false`) | Versionamento curricular |
| **ItemHabilidade** | Hard delete permitido | Pode desvincular e revincular livremente |

### 7.6 Auditoria e Timestamps

**Campos obrigatórios em todas as entidades:**

```sql
-- Timestamps
criado_em        TIMESTAMP NOT NULL DEFAULT NOW()
atualizado_em    TIMESTAMP NOT NULL DEFAULT NOW()

-- Trigger automático de atualização
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON <tabela>
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Entidades com auditoria estendida:**

| Entidade | Campos Adicionais | Motivo |
|----------|-------------------|--------|
| **PlanejamentoBimestral** | validado_por, validado_em | Rastreabilidade de aprovação |
| **Relatorio** | editado_por, aprovado_por, aprovado_em | Histórico de revisões |
| **ItemHabilidade** | criado_por | Saber se foi manual ou IA |
| **Exercicio** | aprovado_por, aprovado_em | Compliance pedagógico |

---

## 8. Lacunas Resolvidas

### 8.1 Base para Design de Banco de Dados

**Artefatos gerados por este documento:**
- ✅ Modelo conceual completo (entidades + relacionamentos)
- ✅ Atributos detalhados com tipos e constraints
- ✅ Cardinalidades e chaves estrangeiras especificadas
- ✅ Índices estratégicos identificados
- ✅ Decisões de normalização documentadas

**Próximo passo:** Criar script DDL (SQL) completo a partir deste modelo.

### 8.2 Clareza sobre o que Persiste e Como se Relaciona

**Questões respondidas:**
- ✅ Como planejamento se conecta com BNCC? → ItemHabilidade
- ✅ Como detectar cobertura de habilidades? → CoberturaAula + CoberturaBimestral
- ✅ Como rastrear aprovação de relatórios? → Relatorio.status_revisao + campos de auditoria
- ✅ Como lidar com blocos de anos de LP? → HabilidadeAno (N:N)
- ✅ Como versionar relatórios? → Relatorio.versao, múltiplos registros por aula

### 8.3 Estimativa de Storage e Performance

**Dados consolidados:**
- ✅ ~301 MB/ano por escola (sem áudio)
- ✅ ~150 GB para 100 escolas em 5 anos
- ✅ ~48.000 registros de CoberturaAula/ano (tabela maior)
- ✅ Índices críticos identificados para performance
- ✅ Particionamento recomendado para tabelas grandes

**Viabilidade técnica:** Modelo escalável para 100-500 escolas com infraestrutura padrão (RDS PostgreSQL, tier médio).

---

## 9. Impacto nos Artefatos do Projeto

### 9.1 Architecture Document

**Decisões que impactam a arquitetura:**

| Decisão | Impacto Arquitetural |
|---------|---------------------|
| PostgreSQL como banco principal | Stack de dados definido, managed service (RDS/Supabase) |
| Processamento assíncrono obrigatório | Necessidade de fila (SQS, RabbitMQ, Celery) |
| Tabela CoberturaBimestral materializada | Job de recalculação após cada aula processada |
| Storage de áudio opcional | Decisão de arquitetura: S3 + lifecycle policy ou descarte |
| JSON para análises | ORM precisa suportar JSON fields (SQLAlchemy, Prisma OK) |
| Full-text search em habilidades | Endpoint de busca com pg_trgm ou ElasticSearch |

**Componentes arquiteturais necessários:**
- API REST/GraphQL (backend)
- Fila de processamento (transcrição e análise)
- Worker de processamento assíncrono
- Banco de dados PostgreSQL (managed)
- Object storage (S3 ou equivalente) para áudios (opcional)
- Cache (Redis) para CoberturaBimestral e habilidades frequentes

### 9.2 PRD (Product Requirements Document)

**Requisitos funcionais derivados do modelo:**

| Requisito | Entidades Envolvidas | Prioridade |
|-----------|---------------------|------------|
| RF-001: Cadastro de planejamento bimestral | PlanejamentoBimestral, ItemPlanejamento, ItemHabilidade | P0 |
| RF-002: Upload de transcrição/áudio | Aula, Transcricao | P0 |
| RF-003: Análise pedagógica automática | Analise, CoberturaAula, CoberturaBimestral | P0 |
| RF-004: Geração de relatório automático | Relatorio | P0 |
| RF-005: Geração de exercícios contextuais | Exercicio | P0 |
| RF-006: Tela de revisão e aprovação | Relatorio.status_revisao, Exercicio.status_revisao | P0 |
| RF-007: Dashboard de cobertura curricular | CoberturaBimestral, aggregations | P0 |
| RF-008: Controle de permissões por papel | Usuario.tipo, regras de acesso | P0 |
| RF-009: Busca de habilidades BNCC | Habilidade, full-text search | P0 |
| RF-010: Sugestão de habilidades por IA | ItemHabilidade.tipo_vinculacao=sugerida | P1 |
| RF-011: Validação de planejamento por coordenador | PlanejamentoBimestral.validado_por | P1 |
| RF-012: Objetivos específicos por aula | ObjetivoAula | P2 |

### 9.3 Epics & Stories

**Estrutura de dados necessária por Epic:**

#### Epic 1: Gestão de Planejamento

**Stories:**
- US-101: Cadastrar planejamento bimestral → `PlanejamentoBimestral`, `ItemPlanejamento`
- US-102: Vincular habilidades BNCC → `ItemHabilidade`, `Habilidade`
- US-103: Sugestão automática de habilidades → `ItemHabilidade` (tipo=sugerida)
- US-104: Validação por coordenador → `PlanejamentoBimestral.validado_por`

#### Epic 2: Captura e Processamento de Aulas

**Stories:**
- US-201: Upload de áudio/transcrição → `Aula`, `Transcricao`
- US-202: Transcrição automática de áudio → `Transcricao`, job assíncrono
- US-203: Análise pedagógica por IA → `Analise`, `CoberturaAula`
- US-204: Geração de relatório → `Relatorio`
- US-205: Geração de exercícios → `Exercicio`

#### Epic 3: Revisão e Aprovação

**Stories:**
- US-301: Tela de revisão de relatório → `Relatorio.status_revisao`
- US-302: Edição de relatório → `Relatorio.versao`, `editado_por`
- US-303: Aprovação de exercícios → `Exercicio.status_revisao`
- US-304: Rejeição e reprocessamento → estados `rejeitado` → `analise_em_andamento`

#### Epic 4: Dashboard e Métricas

**Stories:**
- US-401: Dashboard de cobertura do professor → `CoberturaBimestral`, aggregations
- US-402: Dashboard de gestão (coordenador) → aggregations por professor
- US-403: Alertas de gaps de conteúdo → `CoberturaAula`, regras de negócio
- US-404: Relatório de progresso bimestral → `CoberturaBimestral`, exportação

#### Epic 5: Dados Base e Configuração

**Stories:**
- US-501: Carga de habilidades BNCC → seed de `Habilidade`, `UnidadeTematica`, etc
- US-502: Cadastro de escola e turmas → `Escola`, `Turma`
- US-503: Cadastro de usuários → `Usuario`
- US-504: Configuração de permissões → `Usuario.tipo`, policies

---

## 10. Próximos Passos Recomendados

### 10.1 Imediatos (Pré-Desenvolvimento)

1. **Validação do Modelo com Stakeholders**
   - Revisar modelo com 2-3 professores reais
   - Validar fluxos de estado com coordenador pedagógico
   - Confirmar granularidade de habilidades com especialista em BNCC

2. **Geração de Scripts DDL**
   - Converter modelo conceitual em SQL (PostgreSQL)
   - Criar migrations com versionamento (Alembic, Flyway, Prisma)
   - Seed inicial de dados BNCC (~369 habilidades MVP)

3. **Prova de Conceito de Performance**
   - Simular 10.000 registros de CoberturaAula
   - Testar query de dashboard de cobertura (< 2s)
   - Validar índices estratégicos

### 10.2 Durante o Desenvolvimento

4. **Implementação de Auditoria**
   - Triggers de atualização de timestamps
   - Logs de alterações em entidades críticas (audit table)
   - Compliance LGPD (campos de consentimento)

5. **Otimização de Queries**
   - Materializar CoberturaBimestral com trigger/job
   - Implementar cache de habilidades BNCC (Redis)
   - Paginação em listagens de aulas e relatórios

6. **Testes de Volume**
   - Simular carga de 1 ano completo (9.600 aulas)
   - Validar performance de agregações
   - Testar particionamento se necessário

### 10.3 Pós-MVP

7. **Evolução do Modelo**
   - Adicionar analytics individual por aluno (requer identificação de voz)
   - Extensibilidade para currículos estaduais/municipais
   - Suporte a Ensino Médio (novas habilidades BNCC)

8. **Otimizações Avançadas**
   - Read replicas para dashboards de gestão
   - Arquivamento automático de anos letivos antigos (cold storage)
   - ElasticSearch para busca avançada em transcrições

---

## 11. Glossário Técnico

| Termo | Definição |
|-------|-----------|
| **Entidade** | Objeto do domínio que possui identidade única e é persistido no banco de dados |
| **Relacionamento N:N** | Relação muitos-para-muitos, implementada com tabela intermediária |
| **FK (Foreign Key)** | Chave estrangeira, referência a outra tabela |
| **Soft Delete** | Exclusão lógica (flag/data de exclusão) sem remover fisicamente o registro |
| **Tabela Materializada** | Resultado de query agregada armazenado fisicamente para performance |
| **Particionamento** | Divisão de tabela grande em partições menores (por data, range, etc) |
| **Índice Full-Text** | Índice otimizado para busca de palavras em texto (PostgreSQL GIN) |
| **ACID** | Atomicidade, Consistência, Isolamento, Durabilidade (garantias de transações) |
| **Enum** | Tipo de dado com valores fixos predefinidos |
| **JSON Field** | Campo que armazena estrutura JSON nativa no banco |
| **Timestamp** | Data e hora com timezone (tipo TIMESTAMP) |
| **Unique Constraint** | Restrição que garante valores únicos (ou combinação única) |
| **Composite PK** | Chave primária composta por múltiplas colunas |

---

## 12. Referências

### Documentos do Projeto
- Product Brief - Professor Analytics (2026-02-05)
- BNCC Mapeamento Curricular (2026-02-06)
- Brainstorming Session Results (2026-02-05)

### BNCC e Currículo
- [BNCC - Documento Oficial (MEC)](https://basenacionalcomum.mec.gov.br/a-base)
- [Estrutura da BNCC (Anglo)](https://anglosolucaoeducacional.com.br/bncc/estrutura-da-bncc/)

### Design de Banco de Dados
- PostgreSQL Documentation - JSON Types
- Database Design Best Practices (Martin Fowler)
- Partitioning in PostgreSQL

---

**Documento gerado em:** 2026-02-08
**Versão:** 1.0
**Próxima revisão:** Após validação com stakeholders e início do PRD
