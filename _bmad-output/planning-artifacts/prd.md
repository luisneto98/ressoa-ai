---
stepsCompleted:
  - 'step-01-init'
  - 'step-02-discovery'
  - 'step-03-success'
  - 'step-04-journeys'
  - 'step-05-domain'
  - 'step-06-innovation'
  - 'step-07-project-type'
  - 'step-08-scoping'
  - 'step-09-functional'
  - 'step-10-nonfunctional'
  - 'step-11-polish'
  - 'step-12-complete'
status: 'complete'
completedAt: '2026-02-08'
inputDocuments:
  - 'product-brief-professor-analytics-2026-02-05.md'
  - 'modelo-de-dados-entidades-2026-02-08.md'
  - 'business-rules-pedagogical-analysis.md'
  - 'estrategia-prompts-ia-2026-02-08.md'
  - 'bncc-mapeamento-curricular-2026-02-06.md'
  - 'external-integrations-api-contracts-2026-02-08.md'
  - 'brainstorming-session-2026-02-05.md'
documentCounts:
  briefs: 1
  research: 0
  planning_artifacts: 5
  analysis: 1
workflowType: 'prd'
projectType: 'greenfield'
classification:
  projectType: 'saas_b2b'
  domain: 'edtech'
  complexity: 'medium'
  projectContext: 'greenfield'
---

# Product Requirements Document - Professor Analytics

**Autor:** Luisneto98
**Data:** 2026-02-08
**Versão:** 1.0

---

## Resumo Executivo

**Professor Analytics** é uma plataforma de analytics educacional para escolas brasileiras do Ensino Fundamental (6º ao 9º ano).

### Problema
Professores gastam 2-3 horas por semana fazendo relatórios manuais. Coordenadores não têm visibilidade objetiva do progresso curricular. Gestores só descobrem problemas quando pais reclamam.

### Solução
Sistema que transcreve aulas automaticamente, analisa cobertura curricular via IA, e gera relatórios + exercícios contextuais — economizando tempo do professor e dando dados para gestão.

### Diferenciais (MOAT)
1. **Pipeline de 5 Prompts Pedagógicos** — fundamentado em Taxonomia de Bloom
2. **Professor-First** — professor recebe valor antes, gestão recebe dados depois
3. **BNCC como Unidade Atômica** — medição objetiva baseada no currículo nacional
4. **Feedback Loop** — melhoria contínua da qualidade de IA

### Escopo MVP
- **Disciplinas:** Matemática, Língua Portuguesa, Ciências
- **Séries:** 6º ao 9º ano
- **Habilidades BNCC:** 369 mapeadas
- **Time:** 1 dev + 1 especialista IA + fundador
- **Prazo:** 8-12 semanas

---

## Critérios de Sucesso

### Sucesso do Usuário

| Persona | Métrica | Meta |
|---------|---------|------|
| **Professor João** | Tempo gasto em relatórios manuais | Redução de 2-3h/semana → <30min/semana |
| **Professor João** | Taxa de aprovação dos relatórios gerados | >80% aprovados sem edição significativa |
| **Professor João** | Uso contínuo após 30 dias | >70% dos professores ativos |
| **Coordenadora Marcia** | Conversas pedagógicas baseadas em dados | Pelo menos 1x/mês por professor |
| **Dono Ricardo** | Visibilidade de cobertura curricular | 100% das turmas com dados semanais |

**Sinais Qualitativos de Validação:**
- Professor diz: "Não quero voltar a fazer relatório manual"
- Coordenadora usa dados do sistema em conversa com professor
- Dono menciona dados do sistema em reunião de gestão
- Professor contesta classificação de cobertura (sinal de engajamento ativo)

### Sucesso de Negócio

| Horizonte | Objetivo | Meta |
|-----------|----------|------|
| **3 meses** | Validar produto com piloto | 2-3 escolas, >70% adoção de professores |
| **6 meses** | Provar retenção | Taxa de renovação >80% após piloto |
| **12 meses** | Escalar modelo | 15-20 escolas ativas, break-even operacional |

**KPIs Financeiros:**
- **MRR:** Receita Recorrente Mensal (soma de contratos ativos)
- **CAC:** Custo de Aquisição por escola (investimento em vendas / novas escolas)
- **LTV/CAC:** Meta > 3x
- **Churn:** Taxa de cancelamento mensal de escolas

### Sucesso Técnico

| Métrica | Requisito | Meta |
|---------|-----------|------|
| **Transcrição de 50min** | Tempo de processamento | < 5 minutos |
| **Análise pedagógica** | Tempo de processamento | < 60 segundos |
| **Geração relatório+exercícios** | Tempo de processamento | < 40 segundos |
| **Dashboard de cobertura** | Tempo de resposta | < 2 segundos |
| **Custo de IA por aula** | Viabilidade financeira | < R$0,75/aula (< 40% da receita) |
| **Precisão de cobertura BNCC** | Concordância com avaliação humana | > 85% |
| **Qualidade de evidências** | Evidências literais (não parafraseadas) | > 90% |

### Resultados Mensuráveis

**Critérios Go/No-Go para Fase 2 (MVP):**

| # | Critério | Meta Mínima | Método de Medição | Peso |
|---|----------|-------------|-------------------|------|
| S1 | Adoção de professores | >70% usando semanalmente | Logs de upload | Crítico |
| S2 | Qualidade do output | >80% relatórios aprovados sem edição | Taxa de aprovação no sistema | Crítico |
| S3 | Redução de trabalho | >1h/semana economizada | Pesquisa qualitativa | Alto |
| S4 | Satisfação | NPS >30 entre professores | Pesquisa ao final do piloto | Alto |
| S5 | Retenção | Escola renova após piloto 30 dias | Contrato assinado | Crítico |
| S6 | Viabilidade financeira | Custo IA <40% da receita | Unit economics real | Crítico |
| S7 | Precisão de cobertura | >85% concordância com coordenador | Amostragem mensal | Alto |

**Regra de Decisão:**
- Critérios `Crítico`: TODOS obrigatórios para Go
- Critérios `Alto`: Pelo menos 2 de 3 devem ser atingidos

---

## Escopo do Produto

### MVP - Minimum Viable Product

**Disciplinas:** Matemática, Língua Portuguesa, Ciências
**Séries:** 6º ao 9º ano do Ensino Fundamental

**Funcionalidades Core:**

1. **Gestão de Planejamento**
   - Cadastro de planejamento bimestral pelo professor
   - Vinculação com habilidades BNCC por série/disciplina
   - Sugestão automática de habilidades por IA

2. **Captura e Processamento de Aulas**
   - Upload de transcrição/áudio de múltiplas fontes (celular, Read.ai, digitação manual)
   - Transcrição automática via Whisper (primário) / Google Speech (fallback)
   - Processamento assíncrono (batch)

3. **Análise Pedagógica por IA**
   - Pipeline de 5 prompts especializados (Cobertura → Qualitativa → Relatório → Exercícios → Alertas)
   - Cruzamento da aula com planejamento e BNCC
   - Detecção de gaps de conteúdo e sinais de dificuldade

4. **Outputs para o Professor**
   - Relatório automático da aula (formato configurável)
   - Exercícios contextuais gerados do conteúdo real
   - Sugestões para próxima aula
   - Tela de revisão/aprovação

5. **Dashboard de Gestão (Básico)**
   - % de cobertura curricular por turma (métrica agregada)
   - Alertas de turmas atrasadas
   - Visão por professor (coordenador) e agregada (dono)

6. **Controle de Permissões**
   - Professor: vê apenas seus próprios dados
   - Coordenador: vê métricas por professor (sem transcrição bruta)
   - Dono/Diretor: vê apenas dados agregados da escola

### Funcionalidades de Crescimento (Pós-MVP)

- Dashboard completo com 6 dimensões de métricas
- Dispositivo próprio de captura de áudio (hardware)
- Comparativos entre turmas e professores
- Integração com sistemas de gestão escolar (Sponte, ClassApp)
- Diarização de voz (identificar professor vs alunos)
- Fine-tuning de modelo para análise pedagógica

### Visão de Futuro

- Portal do pai com informações personalizadas do filho
- Analytics individual por aluno via identificação de voz
- Exercícios personalizados por aluno baseados em gaps
- IA que aprende estilo individual do professor (coaching personalizado)
- Rede de escolas com benchmarks comparativos
- Expansão para Ensino Médio e outras disciplinas
- Base de dados pedagógica para pesquisa e políticas públicas

---

## Jornadas de Usuário

### Jornada 1: Professor João - Caminho de Sucesso

**Persona:** 38 anos, professor de Matemática há 15 anos. Leciona para 6 turmas (6º ao 9º ano) em escola particular de médio porte. Competente mas sobrecarregado — passa 2-3 horas por semana fazendo relatórios e diários de classe na mão.

**Medo:** "Mais um sistema pra me controlar."
**Desejo:** Algo que tire trabalho das costas, não que adicione.

**Cena de Abertura (Dor Atual):**
Sexta-feira às 18h. João está exausto após dar 5 aulas. Ainda precisa preencher os relatórios da semana. Abre a planilha, tenta lembrar o que aconteceu na segunda-feira... Perde mais 2 horas tentando reconstruir as aulas da memória.

**Descoberta:**
Coordenadora Marcia apresenta em reunião pedagógica: "Vamos testar uma ferramenta que faz relatório automático." João desconfia, mas aceita tentar.

**Primeiros Passos:**
1. Cadastra planejamento do bimestre (15 minutos, 1x)
2. Antes da aula, abre app no celular e aperta botão para gravar
3. Dá aula normalmente
4. No fim, aperta para parar (5 segundos de esforço)

**Clímax (Momento de Valor):**
Na terça de manhã, recebe notificação: "Relatório disponível." Vê resumo preciso da aula com 5 exercícios prontos. Faz pequeno ajuste, aprova em 5 minutos. Vê insight: "Você cobriu 60% do conteúdo de equações. Faltam tópicos X e Y."

**Resolução:**
Sexta às 17h30, João termina suas tarefas. Relatórios já prontos. Chega em casa às 18h. "Não quero voltar a fazer relatório na mão."

---

### Jornada 2: Coordenadora Marcia - Visibilidade com Tato

**Persona:** 45 anos, Coordenadora Pedagógica há 8 anos, responsável por 25 professores. Consegue assistir 2-3 aulas por semestre de cada um.

**Medo:** Sistema que cria conflito com professores. "Vou virar a vilã."
**Desejo:** Dados objetivos pra embasar conversas difíceis.

**Cena de Abertura:**
Marcia sabe que tem professores "problema" mas não tem dados pra provar. Quando tenta conversar, vira "achismo vs. achismo."

**Primeiros Passos:**
1. Lidera piloto do Professor Analytics
2. Treina 25 professores em 2 reuniões
3. Acompanha primeiras semanas, resolve atritos iniciais

**Clímax (Momento de Valor):**
Após 3 semanas, abre dashboard. Vê que 7º ano B está 3 semanas atrasado em matemática. Conversa com João: "Os dados mostram que turma 7B está atrasada. O que está acontecendo?" João não se sente atacado — são dados, não opinião.

**Resolução:**
Marcia deixa de assistir aulas aleatórias. Foca energia onde os dados indicam necessidade. Conversas difíceis ficam mais fáceis porque são baseadas em evidências.

---

### Jornada 3: Dono Ricardo - Controle sem Microgerenciar

**Persona:** 52 anos, dono de escola familiar (400-600 alunos), formação em administração. Compete com 3-4 escolas na região.

**Medo:** Investir em tecnologia que ninguém usa.
**Desejo:** Controle operacional sem microgerenciar. "Quero ver, não quero fazer."

**Cena de Abertura:**
Ricardo depende da coordenação pra questões pedagógicas. Só descobre problemas quando pai reclama ou nota cai.

**Primeiros Passos:**
1. Aceita piloto de 30 dias
2. Deixa Marcia liderar implantação
3. Acompanha de longe

**Clímax (Momento de Valor):**
Após 4 semanas, acessa dashboard. Visão agregada: 85% de cobertura curricular geral, mas 7º ano Matemática em 62%. Descobre ANTES de qualquer pai reclamar.

**Resolução:**
Na reunião de captação de alunos: "Na nossa escola, sabemos exatamente quanto do currículo está sendo coberto. Temos dados reais." Renova contrato.

---

### Jornada 4: Professor João - Recuperação de Erro

**Cenário:** Professor esquece de gravar uma aula.

**Situação:**
João dá aula normalmente mas esquece de apertar gravar. Só percebe no dia seguinte.

**Recuperação:**
Sistema oferece opções:
1. Digitar resumo manual
2. Marcar como "sem registro"
3. Upload posterior de áudio

João digita resumo rápido de 3 parágrafos. Sistema processa e gera relatório básico (com flag de "resumo manual, precisão menor").

**Resultado:**
Sistema NÃO pune João. Apenas registra input manual. Marcia vê que "1 de 20 aulas teve input manual" — padrão normal.

---

### Jornada 5: Administrador do Sistema (Equipe Interna)

**Persona:** Funcionário da empresa Professor Analytics que monitora operações.

**Jornada:**
1. Acessa dashboard operacional interno
2. Monitora: taxa de erro STT, tempo de processamento, fila de análises
3. Detecta escola com 15 transcrições com erro (áudio corrompido)
4. Notifica escola proativamente antes de reclamação
5. Monitora custos de API por escola
6. Identifica prompts com baixa taxa de aprovação — agenda revisão

---

### Resumo de Capacidades por Jornada

| Jornada | Capacidades Reveladas |
|---------|----------------------|
| **Professor - Sucesso** | App de gravação mobile, processamento assíncrono, relatório editável, exercícios gerados, tela de aprovação, visualização de progresso curricular |
| **Coordenadora** | Dashboard por professor, métricas de cobertura agregada, alertas de atraso, permissões SEM acesso a transcrições |
| **Dono** | Dashboard agregado da escola, dados para tomada de decisão, relatórios exportáveis |
| **Professor - Erro** | Input manual alternativo, flags de confiança, recuperação graciosa sem punição |
| **Admin Interno** | Dashboard operacional, métricas de saúde do sistema, alertas de custo, monitoramento de filas e erros |

---

## Requisitos de Domínio

### Compliance & Regulatório

| Regulação | Descrição | Implementação |
|-----------|-----------|---------------|
| **LGPD** | Lei Geral de Proteção de Dados | Gestão de consentimento, minimização de dados, direito à exclusão |
| **Marco Civil da Internet** | Marco regulatório da internet brasileira | Armazenamento no Brasil, neutralidade de rede, direitos do usuário |
| **ECA** | Estatuto da Criança e do Adolescente | Dados de alunos apenas agregados, sem identificação individual |
| **BNCC** | Base Nacional Comum Curricular | Habilidades como unidade atômica, 369 mapeadas para MVP |

### Restrições Técnicas

| Restrição | Requisito | Justificativa |
|-----------|-----------|---------------|
| **Privacidade de Áudio** | Não armazenar áudio permanentemente | Voz de professor/aluno é PII sensível |
| **Isolamento de Dados** | Professor vê apenas suas turmas | Prevenir vazamento entre professores |
| **Transcrição Temporária** | Deletar após análise completa | Minimizar retenção de dados |
| **Gestão vê Agregado** | Diretores veem apenas métricas agregadas | Prevenir identificação individual |
| **Isolamento Multi-tenant** | Separação completa entre escolas | Cada escola = tenant independente |

### Diretrizes de Conteúdo

| Diretriz | Implementação |
|----------|---------------|
| **Precisão Pedagógica** | >85% concordância com avaliação humana |
| **Exercícios Adequados à Idade** | Taxonomia de Bloom por série |
| **Controle Editorial do Professor** | Workflow de aprovação antes de visibilidade para gestão |
| **Sem Identificação de Alunos** | Sem diarização no MVP, sem tracking individual |

---

## Inovação & Padrões Novos

### Áreas de Inovação Detectadas

#### 1. Pipeline de 5 Prompts Especializados (MOAT Técnico)

**O que torna único:**
- Não são prompts genéricos de "resuma este texto" — fundamentados pedagogicamente com Taxonomia de Bloom
- Pipeline serial com outputs especializados: Cobertura → Qualitativa → Relatório → Exercícios → Alertas
- Cada prompt tem propósito pedagógico específico e critérios de qualidade
- Meta: >90% dos relatórios utilizáveis sem edição significativa

**Abordagem de validação:** Testes A/B de variações de prompts, medindo taxa de aprovação e tempo de revisão

#### 2. Proposta de Valor Professor-First

**Premissa desafiada:**
- EdTech tradicional = ferramenta de vigilância para gestão → professores resistem
- Professor Analytics: Professor recebe valor PRIMEIRO (economiza 2h/semana), gestão recebe dados DEPOIS

**O que torna único:**
- Professor tem controle editorial via workflow de aprovação
- Relatório só fica visível para coordenação APÓS aprovação do professor
- Sem identificação direta de alunos (sem diarização no MVP)

**Abordagem de validação:** >70% uso contínuo após 30 dias, NPS professor >30

#### 3. BNCC como Unidade Atômica de Medição

**O que torna único:**
- Uso das habilidades do currículo nacional brasileiro (369 para MVP) como unidade objetiva de medição
- Permite conversas pedagógicas baseadas em dados ao invés de "achismo vs. achismo"
- Cria framework de comparação padronizado entre professores/turmas

**Abordagem de validação:** >85% concordância com avaliação humana do coordenador

#### 4. Feedback Loop para Qualidade de IA

**O que torna único:**
- Sinais implícitos: diff entre texto gerado e aprovado, tempo de aprovação
- Sinais explícitos: NPS in-context, pesquisas periódicas
- Melhoria contínua: testes A/B para otimização de prompts
- Métricas: >80% taxa de aprovação, <5min tempo de revisão

**Abordagem de validação:** Acompanhar métricas de melhoria mês-a-mês

### Resumo de Inovação

| Área de Inovação | Tipo | Método de Validação |
|------------------|------|---------------------|
| Pipeline 5 Prompts | MOAT Técnico | Testes A/B, taxa de aprovação |
| Valor Professor-First | Modelo de Negócio | Retenção de uso, NPS |
| BNCC como Unidade | Inovação de Domínio | Concordância com coordenador |
| Feedback Loop | Inovação de Processo | Métricas de melhoria MoM |

---

## Requisitos Específicos SaaS B2B

### Modelo de Multi-Tenancy

| Aspecto | Abordagem |
|---------|-----------|
| **Isolamento** | Cada escola = 1 tenant independente |
| **Dados** | Separação completa entre escolas (schema por tenant ou row-level security) |
| **Customização** | Configurações por escola (formato relatório, logo) |
| **Onboarding** | Self-service limitado; onboarding assistido para piloto |

### Matriz de Permissões (RBAC)

| Role | Planejamento | Aulas Próprias | Relatórios | Dashboard | Transcrição |
|------|--------------|----------------|------------|-----------|-------------|
| **Professor** | CRUD próprio | CRUD | Aprovação próprios | Próprias turmas | Própria (opcional) |
| **Coordenador** | Visualiza todos | Visualiza métricas | Visualiza aprovados | Por professor | ❌ Sem acesso |
| **Dono/Diretor** | ❌ | ❌ | ❌ | Agregado escola | ❌ Sem acesso |
| **Admin Sistema** | ❌ | Métricas operacionais | ❌ | Operacional | ❌ Sem acesso |

### Modelo de Assinatura

| Aspecto | Definição |
|---------|-----------|
| **Unidade de Cobrança** | Por hora de aula processada |
| **Preço Base** | A definir baseado em unit economics |
| **Custo IA estimado** | ~R$0,60-0,75/hora (STT + LLM) |
| **Modelo Piloto** | Horas gratuitas ou desconto para 2-3 escolas |
| **Margem Operacional** | >50% por hora processada |

**Vantagens do modelo por hora:**
- Alinha receita com custo real de IA
- Escolas menores pagam menos (mais justo)
- Incentiva uso real (não "licenças paradas")
- Previsibilidade de margem por transação

### Lista de Integrações

| Integração | Prioridade | Status | Propósito |
|------------|------------|--------|-----------|
| **Whisper API** | MVP | Planejado | STT primário |
| **Google Speech-to-Text** | MVP | Planejado | STT fallback |
| **Claude API** | MVP | Planejado | Análise pedagógica |
| **GPT-4 mini** | MVP | Planejado | Geração exercícios |
| **Gemini** | MVP | Planejado | LLM fallback |
| **Sponte** | Post-MVP | Futuro | Gestão escolar |
| **ClassApp** | Post-MVP | Futuro | Comunicação escolar |

### Requisitos de Compliance

| Regulação | Requisito | Implementação |
|-----------|-----------|---------------|
| **LGPD** | Consentimento, minimização, exclusão | Termos de uso, política de privacidade, workflow de exclusão |
| **Marco Civil** | Armazenamento Brasil, neutralidade | Infraestrutura BR, logs de acesso |
| **ECA** | Proteção dados menores | Apenas dados agregados de alunos |
| **BNCC** | Alinhamento curricular | 369 habilidades mapeadas |

---

## Escopo do Projeto & Desenvolvimento em Fases

### Estratégia e Filosofia do MVP

**Abordagem MVP:** Problem-Solving MVP
- Foco em resolver a dor principal: tempo gasto em relatórios manuais
- Validar que professores adotam o sistema antes de adicionar features de gestão
- Professor recebe valor primeiro → gestão recebe dados depois

**Time Mínimo Necessário:**
- 1 Full-stack Developer (backend + frontend)
- 1 Especialista em IA/Prompts (pode ser part-time)
- 1 Product Owner (fundador)
- Duração estimada MVP: 8-12 semanas

### Funcionalidades MVP (Fase 1)

**Jornadas Essenciais Suportadas:**
1. ✅ Professor João - Caminho de Sucesso (core)
2. ✅ Professor João - Recuperação de Erro (essencial para adoção)
3. ⚠️ Coordenadora Marcia - Dashboard básico (mínimo viável)
4. ⚠️ Dono Ricardo - Visão agregada (mínimo viável)

**Capacidades Must-Have:**

| # | Funcionalidade | Justificativa |
|---|----------------|---------------|
| M1 | Upload de áudio/transcrição | Sem isso, não há produto |
| M2 | Transcrição automática (Whisper) | Core value proposition |
| M3 | Pipeline 5 prompts pedagógicos | MOAT técnico |
| M4 | Relatório editável + aprovação | Controle do professor |
| M5 | Exercícios contextuais | Valor tangível para professor |
| M6 | Dashboard cobertura básico | Mínimo para coordenador/dono |
| M7 | RBAC 3 níveis | Privacidade e confiança |

**Capacidades Nice-to-Have (cortadas do MVP):**
- Sugestão automática de habilidades BNCC (manual no MVP)
- Múltiplos formatos de relatório (1 formato no MVP)
- Alertas proativos de turmas atrasadas (consulta manual)
- Exportação de dados (visualização apenas)

### Funcionalidades Pós-MVP

**Fase 2 - Growth (3-6 meses após MVP):**
- Dashboard completo com 6 dimensões de métricas
- Comparativos entre turmas e professores
- Alertas proativos automáticos
- Integração Sponte/ClassApp
- Múltiplos formatos de relatório

**Fase 3 - Expansion (6-12 meses):**
- Dispositivo próprio de captura de áudio
- Diarização de voz (professor vs alunos)
- Fine-tuning de modelo para análise pedagógica
- Portal do pai (preview)
- Expansão para Ensino Médio

**Fase 4 - Vision (12+ meses):**
- Analytics individual por aluno
- Exercícios personalizados por aluno
- IA coaching personalizado
- Rede de escolas com benchmarks
- Base de dados para pesquisa/políticas públicas

### Estratégia de Mitigação de Riscos

**Riscos Técnicos:**

| Risco | Mitigação |
|-------|-----------|
| Qualidade da transcrição | Multi-provider (Whisper + Google fallback) |
| Relatórios genéricos | Pipeline 5 prompts especializados + feedback loop |
| Custo de IA alto | Batch processing, caching, modelo menor para exercícios |

**Riscos de Mercado:**

| Risco | Mitigação |
|-------|-----------|
| Professor não adota | Valor professor-first, piloto com onboarding assistido |
| Percepção de vigilância | Workflow de aprovação, professor controla dados |
| Escola não renova | Métricas claras de valor no dashboard do dono |

**Riscos de Recursos:**

| Risco | Mitigação |
|-------|-----------|
| Menos recursos que planejado | MVP mínimo pode rodar com 1 dev + fundador |
| Atraso no desenvolvimento | Priorização rígida: cortar nice-to-have |
| Custo maior que receita | Piloto com 2-3 escolas para validar unit economics |

---

## Requisitos Funcionais

### Gestão de Planejamento

- FR1: Professor pode cadastrar planejamento bimestral para suas turmas
- FR2: Professor pode vincular habilidades BNCC ao planejamento
- FR3: Professor pode visualizar lista de habilidades BNCC filtradas por série e disciplina
- FR4: Professor pode editar ou excluir planejamentos existentes
- FR5: Sistema sugere habilidades BNCC baseado no conteúdo digitado (post-MVP)

### Captura de Aulas

- FR6: Professor pode fazer upload de arquivo de áudio da aula
- FR7: Professor pode fazer upload de transcrição pronta (texto)
- FR8: Professor pode digitar resumo manual da aula
- FR9: Professor pode associar upload a uma turma e data específica
- FR10: Sistema aceita múltiplos formatos de áudio (mp3, wav, m4a, webm)
- FR11: Professor pode visualizar status de processamento de suas aulas

### Processamento de Transcrição

- FR12: Sistema transcreve áudio automaticamente via STT
- FR13: Sistema usa provider alternativo quando primário falha
- FR14: Sistema processa transcrições em batch (assíncrono)
- FR15: Sistema notifica professor quando transcrição está pronta
- FR16: Sistema armazena transcrição temporariamente até análise completa

### Análise Pedagógica

- FR17: Sistema analisa cobertura de habilidades BNCC na transcrição
- FR18: Sistema gera análise qualitativa do conteúdo da aula
- FR19: Sistema identifica evidências literais do conteúdo (não parafraseia)
- FR20: Sistema cruza conteúdo da aula com planejamento bimestral
- FR21: Sistema detecta gaps entre planejamento e execução
- FR22: Sistema gera alertas de turmas atrasadas (post-MVP)

### Outputs para Professor

- FR23: Sistema gera relatório automático da aula
- FR24: Professor pode editar relatório gerado antes de aprovar
- FR25: Professor pode aprovar ou rejeitar relatório
- FR26: Sistema gera exercícios contextuais baseados no conteúdo real
- FR27: Professor pode editar exercícios gerados
- FR28: Sistema gera sugestões para próxima aula
- FR29: Professor pode visualizar % de cobertura curricular própria
- FR30: Professor pode exportar relatórios aprovados (post-MVP)

### Dashboard e Métricas

- FR31: Coordenador pode visualizar métricas de cobertura por professor
- FR32: Coordenador pode visualizar métricas de cobertura por turma
- FR33: Coordenador pode identificar turmas com atraso curricular
- FR34: Dono pode visualizar métricas agregadas da escola
- FR35: Dono pode visualizar % de cobertura curricular geral
- FR36: Sistema calcula cobertura bimestral como métrica materializada
- FR37: Coordenador NÃO pode acessar transcrições brutas

### Gestão de Usuários e Permissões

- FR38: Administrador pode cadastrar escolas (tenants)
- FR39: Administrador pode cadastrar usuários por escola
- FR40: Sistema isola dados completamente entre escolas
- FR41: Professor vê apenas seus próprios dados
- FR42: Coordenador vê métricas (sem transcrições) de todos professores
- FR43: Dono vê apenas dados agregados da escola
- FR44: Usuário pode fazer login com email/senha
- FR45: Usuário pode recuperar senha

### Administração do Sistema (Interno)

- FR46: Admin interno pode monitorar taxa de erro de STT
- FR47: Admin interno pode monitorar tempo de processamento
- FR48: Admin interno pode monitorar fila de análises pendentes
- FR49: Admin interno pode monitorar custos de API por escola
- FR50: Admin interno pode identificar prompts com baixa taxa de aprovação

---

## Requisitos Não-Funcionais

### Performance

| Operação | Requisito | Justificativa |
|----------|-----------|---------------|
| Transcrição de aula (50min) | < 5 minutos | Professor não quer esperar muito |
| Análise pedagógica | < 60 segundos | Processamento batch é aceitável |
| Geração relatório + exercícios | < 40 segundos | Parte do batch processing |
| Dashboard de cobertura | < 2 segundos | Consulta em tempo real |
| Upload de áudio (100MB) | < 30 segundos | Limitado pela conexão do usuário |

### Segurança

| Requisito | Especificação |
|-----------|---------------|
| Criptografia em trânsito | TLS 1.2+ para todas as conexões |
| Criptografia em repouso | AES-256 para dados sensíveis |
| Isolamento multi-tenant | Row-level security ou schema separation |
| Retenção de transcrição | Deletar após análise completa (máx 7 dias) |
| Retenção de áudio | Não armazenar permanentemente |
| Autenticação | Senhas com hash bcrypt, sessões com JWT |
| Logs de acesso | Auditoria de acessos a dados sensíveis |
| Compliance LGPD | Consentimento, portabilidade, exclusão |

### Escalabilidade

| Cenário | Requisito |
|---------|-----------|
| Piloto (3 meses) | 2-3 escolas, ~100 professores |
| Growth (12 meses) | 15-20 escolas, ~600 professores |
| Pico de uso | Segunda-feira manhã (uploads do fim de semana) |
| Processamento batch | Fila distribuída, sem limite de tamanho |
| Custo por aula | < R$0,75 mesmo em escala |

### Acessibilidade

| Requisito | Especificação |
|-----------|---------------|
| Contraste | WCAG 2.1 AA mínimo |
| Navegação por teclado | Todas as ações principais acessíveis |
| Tamanho de fonte | Mínimo 16px, ajustável pelo usuário |
| Responsividade | Mobile-friendly para upload de áudio |
| Mensagens de erro | Claras e acionáveis |

### Integração

| Requisito | Especificação |
|-----------|---------------|
| Multi-provider STT | Failover automático Whisper → Google |
| Multi-provider LLM | Abstração para Claude/GPT/Gemini |
| Timeout de APIs externas | 30 segundos com retry automático |
| Rate limiting | Respeitar limites de cada provider |
| Fallback gracioso | Notificar usuário se todos providers falharem |

### Confiabilidade

| Requisito | Especificação |
|-----------|---------------|
| Uptime | 99% durante horário comercial (seg-sex 7h-19h) |
| Backup | Diário, retenção 30 dias |
| Recovery | RTO < 4 horas, RPO < 24 horas |
| Fila de processamento | Persistente, sobrevive a restart |
| Notificações de erro | Alertar admin se > 5% de falhas em 1 hora |
