---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments:
  - '_bmad-output/analysis/brainstorming-session-2026-02-05.md'
date: 2026-02-05
author: Luisneto98
---

# Product Brief: professor-analytics

## Executive Summary

Professor Analytics é uma plataforma de analytics pedagógico que transforma o ensino escolar de caixa preta em processo transparente e orientado por dados. Ao cruzar o currículo oficial (BNCC), o planejamento do professor e a transcrição real das aulas, o sistema revela gaps de conteúdo e absorção em tempo real - permitindo correção de rota antes que lacunas se tornem problemas irreversíveis no vestibular ou na vida acadêmica do aluno.

Posicionamento central: **"IA como lente, nunca como juiz"** - o sistema revela a realidade para que humanos tomem melhores decisões, sem punir ou avaliar.

**Pitch por stakeholder:**
- **Professor:** "Nunca mais faça relatório na mão - e saiba exatamente onde sua turma precisa de reforço"
- **Dono/Diretor:** "Saiba exatamente o que acontece em cada sala de aula, em tempo real, sem depender de coordenador sobrecarregado"
- **Pais:** "Acompanhe o aprendizado do seu filho com dados reais, não apenas notas"

---

## Core Vision

### Problem Statement

O ensino escolar opera como um sistema fechado e invisível. O professor ensina, cria a prova sobre o que ensinou, e avalia se o aluno aprendeu o que ele ensinou. Ninguém verifica se o currículo completo está sendo coberto, se os alunos estão realmente absorvendo o conteúdo, ou onde estão as lacunas de conhecimento - até que seja tarde demais.

### Problem Impact

- **Para o aluno:** Gaps de conhecimento acumulados silenciosamente resultam em reprovação no vestibular, dificuldades acadêmicas futuras e menor desenvolvimento profissional
- **Para os pais:** Ausência total de visibilidade sobre o que seus filhos estão realmente aprendendo - só descobrem problemas quando as notas caem
- **Para o professor:** Sem feedback real sobre efetividade do ensino, não consegue ajustar abordagem ou identificar onde a turma está perdida
- **Para a escola:** Coordenação só consegue assistir 2-3 aulas por semestre por professor - 99% do que acontece em sala é invisível

### Why Existing Solutions Fall Short

- **Plataformas de conteúdo** (Descomplica, Stoodi): Focam em entregar conteúdo, não em analisar o que está sendo ensinado em sala
- **Sistemas de gestão escolar** (Sponte, ClassApp): Gerenciam notas, frequência e comunicação, mas não a qualidade pedagógica
- **Avaliação tradicional:** O próprio professor cria a prova, criando um ciclo fechado que valida a si mesmo sem verificar cobertura curricular completa
- **Observação presencial:** Coordenadores não têm capacidade física de assistir todas as aulas - modelo não escala
- **Hardware existente (R$1.200+):** Dispositivos de gravação existem, mas são caros e não integram análise pedagógica inteligente

### Proposed Solution

Plataforma que opera em três camadas de validação:

1. **BNCC → Planejamento:** Verifica se o planejamento do professor cobre as competências exigidas para a série/disciplina
2. **Planejamento → Execução:** Cruza transcrições de aulas com o planejamento para detectar gaps de cobertura
3. **Execução → Absorção:** Analisa interações, perguntas e participação dos alunos na transcrição para identificar sinais de dificuldade ou desengajamento

O sistema gera insights acionáveis: "Professor, você não cobriu X ainda", "Turma apresenta dificuldade em Y", "Sugestão para próxima aula: reforçar Z".

**Captura de áudio simplificada:** Dispositivo em sala de aula com botão único - professor apenas inicia a aula. O planejamento já é obrigação existente do professor, apenas passa a ser cadastrado na plataforma.

### Key Differentiators

- **Primeiro analytics de execução pedagógica no Brasil:** Nenhuma solução atual cruza currículo oficial com execução real de aula
- **Quebra o ciclo fechado:** BNCC como régua externa impede que o professor avalie apenas o que ele mesmo ensinou
- **Timing estratégico:** Primeira escola a usar se destaca; as demais serão forçadas a adotar para não ficar para trás
- **IA como lente, não juiz:** Posicionamento que gera confiança do professor (ferramenta que ajuda) em vez de resistência (sistema que pune)
- **Lock-in via hardware:** Dispositivo próprio cria barreira de saída e switching cost alto para concorrentes
- **Atrito mínimo:** Professor aperta um botão; planejamento já é obrigação existente

### Go-to-Market Strategy

**Fase 1 - Validação (Capital Mínimo):**
- Software puro, escola usa hardware existente ou celular do professor
- Provar que a análise de IA entrega valor real
- Meta: X escolas, Y meses, métricas de adoção e satisfação

**Fase 2 - Escala (Pós-Validação):**
- Dispositivo próprio com margens otimizadas
- Modelo de arrendamento: escola paga por uso, não compra equipamento
- Lock-in + receita recorrente previsível

### Unit Economics (Escola de 10 salas)

| Métrica | Valor |
|---------|-------|
| Horas/mês | 800 (10 turmas × 4h × 20 dias) |
| Receita | R$1.200/mês (R$1,50/hora) |
| Custo IA | R$400/mês (R$0,50/hora) |
| **Margem bruta** | **R$800/mês** |
| Custo dispositivos (10 salas) | ~R$3.000 |
| **Payback** | **< 4 meses** |

*Custo de IA reduz com volume. Margem tende a aumentar com escala.*

---

## Target Users

### Primary Users

#### Professor João - O Usuário do Dia-a-Dia
**Perfil:** 38 anos, professor de Matemática, 15 anos de experiência
**Contexto:** Leciona para 6 turmas (6º ao 9º ano) em escola particular de médio porte (~500 alunos)

**Situação atual:**
- Competente mas sobrecarregado - passa 2-3 horas por semana em relatórios e diários de classe manuais
- Sente que burocracia rouba tempo que deveria ser dedicado aos alunos
- Não sabe exatamente onde cada turma está em relação ao currículo completo

**Motivações e medos:**
- **Medo principal:** Ser vigiado e punido. "Mais um sistema pra me controlar."
- **Desejo real:** Algo que tire trabalho das costas, não que adicione
- **Tech:** Usa WhatsApp e planilhas, não é early adopter mas aceita se for fácil e útil

**O que sucesso significa:** "Nunca mais perco 2 horas por semana em relatório. E agora sei exatamente o que preciso reforçar na próxima aula."

---

### Secondary Users

#### Dono Ricardo - O Comprador
**Perfil:** 52 anos, dono de escola familiar (400-600 alunos), formação em administração
**Contexto:** Escola fundada pelo pai, ele assumiu há 15 anos. Compete com 3-4 escolas na região.

**Situação atual:**
- Margem apertada, precisa se diferenciar
- Depende da coordenação pra questões pedagógicas - não tem visibilidade direta
- Só descobre problemas quando pai reclama ou nota cai

**Motivações e medos:**
- **Medo principal:** Investir em tecnologia que ninguém usa (já se queimou antes)
- **Desejo real:** Controle operacional sem microgerenciar. "Quero ver, não quero fazer."
- **Tech:** Usa sistemas de gestão (Sponte, etc), mas nunca teve ferramenta pra qualidade pedagógica

**O que sucesso significa:** "Sei exatamente o que está acontecendo em cada sala de aula. Tomo decisões com dados, não com achismo."

#### Coordenadora Marcia - A Ponte
**Perfil:** 45 anos, Coordenadora Pedagógica, 20 anos em educação, 8 como coordenadora
**Contexto:** Responsável por 25 professores, consegue assistir 2-3 aulas por semestre de cada um

**Situação atual:**
- Sabe quem são os professores "problema" mas não tem dados pra provar
- Posição delicada: ponte entre dono (quer resultados) e professores (querem autonomia)
- 99% do que acontece em sala é invisível pra ela

**Motivações e medos:**
- **Medo principal:** Sistema que cria conflito com professores. "Vou virar a vilã."
- **Desejo real:** Dados objetivos pra embasar conversas difíceis, sem parecer perseguição
- **Tech:** Usa bem o que a escola oferece, mas não busca novidades por conta própria

**O que sucesso significa:** "Tenho dados concretos pra conversar com professores. Foco minha energia onde realmente precisa, não em amostragem aleatória."

#### Pais e Alunos - Beneficiários Indiretos (MVP)
**Contexto:** Não acessam a plataforma no MVP, mas são os beneficiários finais.

**Benefícios indiretos:**
- **Alunos:** Aulas mais assertivas, gaps de conhecimento identificados e corrigidos antes de virarem problemas no vestibular
- **Pais:** Filhos recebendo ensino mais completo e direcionado, mesmo sem visibilidade direta (portal de pais vem pós-MVP)

---

### User Journey

#### Jornada do Professor João

| Etapa | Experiência |
|-------|-------------|
| **Descoberta** | Coordenadora Marcia apresenta em reunião pedagógica: "Vamos testar uma ferramenta que faz relatório automático pra vocês" |
| **Onboarding** | Cadastra planejamento do bimestre (1x) - algo que já faz, só muda o lugar |
| **Uso diário** | Aperta botão no início da aula, aperta no fim. 5 segundos de esforço |
| **Pós-aula** | Recebe relatório gerado + exercícios sugeridos. Revisa em 5 min, aprova ou ajusta |
| **Momento "aha!"** | Primeira vez que vê: "Você cobriu 60% do conteúdo de equações, faltam X e Y" - insight que não teria sozinho |
| **Longo prazo** | Para de fazer relatório manual. Usa sugestões de exercícios. Começa a confiar nos insights de gaps |

#### Jornada do Dono Ricardo

| Etapa | Experiência |
|-------|-------------|
| **Descoberta** | Vendedor apresenta: "Saiba o que acontece em cada sala sem depender de coordenador sobrecarregado" |
| **Decisão** | Piloto de 30 dias com 5 professores, dados reais da escola dele |
| **Onboarding** | Coordenadora Marcia lidera implantação, ele só acompanha |
| **Uso** | Acessa dashboard semanal: visão agregada de cobertura curricular por turma/série |
| **Momento "aha!"** | Descobre que 7º ano está 3 semanas atrasado em matemática antes de qualquer pai reclamar |
| **Longo prazo** | Usa dados em reunião com coordenação. Toma decisões baseadas em evidência, não intuição |

#### Jornada da Coordenadora Marcia

| Etapa | Experiência |
|-------|-------------|
| **Descoberta** | Ricardo (dono) pede pra ela liderar o piloto |
| **Onboarding** | Treina professores, acompanha primeiras semanas, resolve atritos iniciais |
| **Uso** | Vê métricas por professor: aderência ao planejamento, ritmo de cobertura, alertas |
| **Momento "aha!"** | Consegue ter conversa objetiva com professor: "Os dados mostram que turma X está atrasada" - sem parecer perseguição |
| **Longo prazo** | Deixa de assistir aulas aleatórias, foca energia onde os dados indicam necessidade real |

---

## Success Metrics

### User Success Metrics

| Persona | Métrica | Meta |
|---------|---------|------|
| **Professor João** | Tempo gasto em relatórios manuais | Redução de 2-3h/semana → <30min/semana |
| **Professor João** | Taxa de aprovação dos relatórios gerados | >80% aprovados sem edição significativa |
| **Professor João** | Uso contínuo após 30 dias | >70% dos professores ativos |
| **Coordenadora Marcia** | Conversas pedagógicas baseadas em dados | Pelo menos 1x/mês por professor |
| **Dono Ricardo** | Visibilidade de cobertura curricular | 100% das turmas com dados semanais |

### Business Objectives

| Horizonte | Objetivo | Meta |
|-----------|----------|------|
| **3 meses** | Validar produto com piloto | 2-3 escolas, >70% adoção de professores |
| **6 meses** | Provar retenção | Taxa de renovação >80% após piloto |
| **12 meses** | Escalar modelo | 15-20 escolas ativas, break-even operacional |

### Key Performance Indicators

| Categoria | KPI | Como Medir |
|-----------|-----|------------|
| **Adoção** | % de professores ativos/mês | Professores que fizeram upload ≥1x/semana |
| **Engajamento** | Horas de aula processadas/escola/mês | Volume de transcrições analisadas |
| **Qualidade** | NPS do professor | Pesquisa trimestral |
| **Retenção** | Churn mensal de escolas | Cancelamentos / base ativa |
| **Financeiro** | MRR (Receita Recorrente Mensal) | Soma de contratos ativos |
| **Financeiro** | CAC (Custo de Aquisição) | Investimento em vendas / novas escolas |
| **Financeiro** | LTV/CAC | Lifetime value vs custo de aquisição (meta: >3x) |

---

## MVP Scope

### Core Features

**1. Gestão de Planejamento**
- Cadastro de planejamento bimestral pelo professor (conteúdos do período)
- Vinculação com competências da BNCC por série/disciplina
- Cadastro opcional de objetivos específicos por aula

**2. Captura e Processamento de Aulas**
- Upload de transcrição/áudio de múltiplas fontes (celular, Read.ai, digitação manual)
- Processamento assíncrono (batch) para otimização de custos
- Transcrição automática de áudio via Whisper/Google Speech

**3. Análise Pedagógica por IA**
- Cruzamento da aula com planejamento do bimestre
- Detecção de gaps de conteúdo ("Você não cobriu X ainda")
- Análise de % de progresso do conteúdo planejado
- Identificação de sinais de dificuldade/desengajamento via interações dos alunos

**4. Outputs para o Professor**
- Relatório automático da aula (formato configurável pela escola)
- Exercícios contextuais gerados do conteúdo real da aula
- Sugestões para próxima aula baseadas em gaps detectados
- Tela de revisão/aprovação antes de finalizar

**5. Dashboard de Gestão (Básico)**
- Uma métrica agregada visível para coordenação/direção: % de cobertura curricular por turma
- Alertas de turmas atrasadas em relação ao planejamento
- Visão por professor (para coordenador) e agregada (para dono)

**6. Controle de Permissões**
- Professor vê apenas seus próprios dados
- Coordenador vê métricas por professor (sem transcrição bruta)
- Dono/Diretor vê apenas dados agregados da escola

### Out of Scope for MVP

| Feature | Motivo do Adiamento | Versão Planejada |
|---------|---------------------|------------------|
| Dispositivo de hardware próprio | Validar software primeiro, hardware na Fase 2 | V2 |
| Dashboard com 6 dimensões completas | Uma métrica já prova valor, complexidade adicional | V2 |
| Portal de pais | Foco primeiro em professor e gestão | V3 |
| Analytics individual por aluno | Requer identificação de voz, complexidade alta | Futuro |
| Identificação de voz por aluno | Complexidade técnica e privacidade | Futuro |
| Processamento em tempo real | Assíncrono é suficiente e mais barato | Futuro |
| Coaching personalizado por estilo do professor | Requer base de dados maior | Futuro |
| Integração com sistemas de gestão (Sponte, etc) | Foco no core primeiro | V2 |

### MVP Success Criteria

**Critérios de Go/No-Go para Fase 2:**

| Critério | Meta Mínima | Como Medir |
|----------|-------------|------------|
| Adoção de professores | >70% dos professores do piloto usando semanalmente | Logs de upload |
| Qualidade do output | >80% dos relatórios aprovados sem edição significativa | Taxa de aprovação no sistema |
| Redução de trabalho manual | Professores reportam economia de >1h/semana | Pesquisa qualitativa |
| Satisfação | NPS >30 entre professores | Pesquisa ao final do piloto |
| Retenção de escola | Escola renova após piloto de 30 dias | Contrato assinado |
| Viabilidade financeira | Custo de IA <40% da receita por escola | Unit economics real |

**Sinais de Validação:**
- Professor João diz: "Não quero voltar a fazer relatório manual"
- Coordenadora Marcia usa dados em pelo menos 1 conversa com professor
- Dono Ricardo menciona dados do sistema em reunião de gestão

### Future Vision

**V2 - Dashboard Completo (6-12 meses pós-MVP)**
- 6 dimensões de métricas: desenvoltura, domínio de conteúdo, aderência ao planejamento, adequação linguagem/metodologia, sequência lógica, fugas de pensamento
- Comparativos entre turmas e professores
- Dispositivo próprio de captura de áudio
- Integração com sistemas de gestão escolar

**V3 - Ecossistema Família (12-18 meses)**
- Portal do pai com informações do filho
- Exercícios personalizados por aluno baseados em gaps detectados
- Analytics por turma (participação, engajamento)
- Mapa de calor de participação - detecção de alunos "invisíveis"

**Visão de Longo Prazo (2-3 anos)**
- Analytics individual por aluno via identificação de voz
- IA que aprende estilo individual do professor - coaching personalizado
- Rede de escolas com benchmarks comparativos
- Base de dados pedagógica para pesquisa e políticas públicas
- Expansão para redes educacionais (1 contrato = 50 escolas)
