---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
inputDocuments:
  - 'prd.md'
  - 'product-brief-professor-analytics-2026-02-05.md'
  - 'bncc-mapeamento-curricular-2026-02-06.md'
  - 'business-rules-pedagogical-analysis.md'
  - 'estrategia-prompts-ia-2026-02-08.md'
  - 'external-integrations-api-contracts-2026-02-08.md'
  - 'modelo-de-dados-entidades-2026-02-08.md'
---

# UX Design Specification - Ressoa AI

**Author:** Luisneto98
**Date:** 2026-02-09

---

## Executive Summary

### Project Vision

**Ressoa AI** é uma plataforma web de analytics educacional que transforma o ensino de "caixa preta" em processo transparente orientado por dados. O nome "Ressoa" evoca a ideia de amplificar e dar eco ao impacto pedagógico do professor através da inteligência artificial.

Através de transcrição automática de aulas e análise pedagógica por IA, o sistema cruza o conteúdo real das aulas com o planejamento do professor e o currículo oficial (BNCC), revelando gaps de cobertura e gerando relatórios + exercícios contextuais automaticamente.

**Tagline:** "Inteligência de Aula, Análise e Previsão de Conteúdo"

**Posicionamento UX:** "IA como lente, nunca como juiz" - o sistema revela a realidade para que humanos tomem decisões melhores, sem punir ou avaliar professores.

**Proposta de valor por persona:**
- **Professor:** "Nunca mais faça relatório na mão - economize 2-3h/semana e saiba exatamente onde sua turma precisa de reforço"
- **Coordenadora:** "Tenha dados objetivos para conversas pedagógicas, sem virar 'a vilã'"
- **Dono/Diretor:** "Saiba o que acontece em cada sala de aula em tempo real, antes que problemas virem crises"

**Escopo MVP:** Plataforma web responsiva (não app nativo). Suporta upload de áudio/texto + integrações com Read.ai, Zoom e Google Meet.

### Target Users

**Persona Primária: Professor João**
- 38 anos, 15 anos de experiência, leciona para 6 turmas (6º-9º ano)
- **Tech profile:** Usa WhatsApp e planilhas, não é early adopter, aceita tech se for fácil e útil
- **Dispositivos:** Grava aula no celular/gravador → faz upload via web (desktop ou mobile)
- **Contexto de uso:**
  - Upload: fim da aula (escola ou casa, potencialmente via celular)
  - Revisão de relatórios: desktop/notebook (5-10 min de foco)
  - Consulta rápida: mobile (verificar se relatório ficou pronto)
- **Dor principal:** Gasta 2-3h/semana em relatórios manuais, sente que burocracia rouba tempo dos alunos
- **Medo crítico:** "Mais um sistema pra me controlar/vigiar"
- **Desejo:** Algo que tire trabalho das costas, não que adicione
- **Critério de sucesso:** "Não quero voltar a fazer relatório manual"
- **Expectativa de interface:** Amigável, acessível, sem jargão técnico, visual clean

**Persona Secundária: Coordenadora Marcia**
- 45 anos, 8 anos como coordenadora, responsável por 25 professores
- **Tech profile:** Usa bem sistemas da escola, mas não busca novidades
- **Dispositivos:** Desktop (principal), tablet/iPad (revisões casuais)
- **Contexto de uso:**
  - Dashboard semanal: desktop (20-30 min de análise)
  - Consultas rápidas: tablet/mobile (verificar alertas)
  - Conversas com professores: desktop (mostrando dados na tela)
- **Dor principal:** Só consegue assistir 2-3 aulas/semestre por professor (99% invisível)
- **Medo crítico:** Sistema que cria conflito com professores ("vou virar a vilã")
- **Desejo:** Dados objetivos para embasar conversas difíceis
- **Critério de sucesso:** "Conversas pedagógicas baseadas em evidências, não achismo"
- **Expectativa de interface:** Dashboards claros, visualizações intuitivas, filtros simples

**Persona Terciária: Dono Ricardo**
- 52 anos, administrador, escola de 400-600 alunos
- **Tech profile:** Já se queimou com tech que ninguém usa
- **Dispositivos:** Desktop (100% do tempo)
- **Contexto de uso:**
  - Revisão mensal: desktop (30-40 min de análise estratégica)
  - Reuniões de gestão: desktop conectado a projetor (apresentar dados)
- **Dor principal:** Descobre problemas pedagógicos só quando pais reclamam
- **Medo crítico:** Investir em tecnologia que será abandonada
- **Desejo:** Controle operacional sem microgerenciar ("quero ver, não quero fazer")
- **Critério de sucesso:** "Tomo decisões com dados, antes de crises"
- **Expectativa de interface:** Visão executiva, KPIs consolidados, exportação fácil

### Key Design Challenges

**1. Confiança vs. Controle (Crítico)**
- Professor precisa sentir que controla seus dados, não o inverso
- Sistema pode parecer "vigilância" se não comunicar privacidade claramente
- **Desafio UX:** Como tornar workflow de aprovação e controle de privacidade visualmente óbvio e tranquilizador?
- **Soluções a explorar:**
  - Badge visual "Privado até você aprovar" em todos os relatórios
  - Ícone de cadeado/escudo mostrando que coordenação não vê transcrições
  - Onboarding que explica controle de privacidade nos primeiros 30 segundos

**2. Upload Confiável e Sem Atrito (Crítico)**
- Professor sobrecarregado precisa de zero atrito no uso
- Upload precisa funcionar com conexão instável, arquivos grandes (50min de áudio = ~25-50MB)
- Áudio pode estar corrompido ou com qualidade ruim
- **Desafio UX:** Como criar experiência de upload simples mas robusta, com recuperação graciosa?
- **Soluções a explorar:**
  - Drag-and-drop com preview do arquivo
  - Upload resumível (se cair conexão, retoma de onde parou)
  - Validação de formato ANTES de enviar (feedback instantâneo)
  - Alternativas se upload falhar (digitar resumo manual, importar Read.ai)
  - Indicador de progresso claro: "Enviando 45% → Transcrevendo → Analisando"

**3. Qualidade Percebida da IA**
- Meta de 90%+ relatórios aproveitáveis é ambiciosa
- Se relatório tiver erros, professor pode perder confiança rapidamente
- **Desafio UX:** Como comunicar confiança da IA? Como facilitar edição rápida sem frustração?
- **Soluções a explorar:**
  - Score de confiança visível ("Confiança: 92%")
  - Evidências textuais clicáveis (clicar em "EF07MA18 - Coberta" → mostra trecho da transcrição)
  - Editor inline com highlights (texto gerado em uma cor, edições do professor em outra)
  - "Foi útil?" feedback rápido (👍👎) após aprovação

**4. Multi-Persona com Dados Completamente Diferentes**
- Professor: detalhes granulares (transcrição, relatório, exercícios, evidências)
- Coordenador: métricas agregadas SEM acesso a transcrições brutas
- Diretor: apenas dados consolidados da escola
- **Desafio UX:** Como criar navegação e arquitetura de informação clara para 3 visões radicalmente diferentes?
- **Soluções a explorar:**
  - Dashboards completamente diferentes por papel (não apenas filtros)
  - Menu lateral adaptativo (professor vê "Minhas Aulas", coordenador vê "Professores")
  - Permissões visualmente claras (coordenador tenta acessar transcrição → vê mensagem "Acesso restrito por privacidade")

**5. Complexidade do Domínio Educacional**
- 369 habilidades BNCC (jargão técnico: EF07MA18, EF69LP…)
- Língua Portuguesa tem blocos compartilhados entre anos
- Dashboard precisa mostrar % de cobertura curricular de forma acionável
- **Desafio UX:** Como tornar dados educacionais complexos compreensíveis sem simplificar demais?
- **Soluções a explorar:**
  - Hover/tooltip que explica código BNCC ("EF07MA18: Resolver equações do 1º grau")
  - Agrupamento por Unidade Temática (Álgebra, Geometria) ao invés de listar 121 habilidades
  - Busca com autocomplete inteligente ("equações" → mostra EF07MA18, EF07MA17…)
  - Visualizações: progress bars, heat maps, gráficos de pizza (não só tabelas)

**6. Responsividade Real (Não Apenas Adaptativa)**
- Site precisa funcionar BEM em mobile (não só "caber na tela")
- Professor pode revisar relatório no celular enquanto espera ônibus
- Upload via mobile precisa lidar com conexão 4G instável
- **Desafio UX:** Como criar experiências otimizadas para cada contexto sem fragmentar produto?
- **Soluções a explorar:**
  - Mobile: foco em ações rápidas (aprovar relatório, ver progresso, upload)
  - Desktop: análises profundas (editar relatório, comparar habilidades, dashboard completo)
  - Touch targets grandes em mobile (mínimo 44x44px para botões)
  - Modo offline parcial (mostrar dados em cache enquanto carrega)

**7. Integrações Externas como Caminho Alternativo**
- Read.ai, Zoom, Google Meet já transcrevem
- Professor pode preferir importar transcrição pronta
- **Desafio UX:** Como tornar integrações descobríveis sem complicar fluxo principal?
- **Soluções a explorar:**
  - Tela de upload com tabs: "Upload de Arquivo" | "Importar de Read.ai" | "Texto Manual"
  - Onboarding mostra as 3 opções ("Escolha como prefere adicionar aulas")
  - Autenticação OAuth simplificada (login com Read.ai/Google em 2 cliques)

### Design Opportunities

**1. Onboarding que Converte em 1 Semana**
- Mostrar economia de tempo imediatamente (não semanas depois)
- Primeiro relatório gerado = "wow moment" que justifica adoção
- **Oportunidade:** Usar aula de demonstração pré-gravada para professor testar sem gravar aula própria
- **Táticas UX:**
  - Checklist gamificado: "✓ Upload primeira aula → ✓ Revisar relatório → ✓ Aprovar exercícios"
  - Métrica visível: "Você economizou 2h30 esta semana com Ressoa AI"
  - Email após primeira aprovação: "Parabéns! Você nunca mais precisa fazer relatório manual 🎉"

**2. Transparência da IA como Moat de Confiança**
- Mostrar evidências textuais literais da transcrição (não parafrasear)
- Professor pode clicar em "EF07MA18 - Coberta" e ver trecho exato que justifica
- IA não é caixa preta: "Aqui está porque eu classifiquei assim"
- **Oportunidade:** Interface de "explicação da IA" vira diferencial competitivo
- **Táticas UX:**
  - Sidebar com transcrição completa ao lado do relatório gerado
  - Highlights na transcrição (clicar em habilidade → trecho correspondente fica em amarelo)
  - "Por que a IA decidiu isso?" (ícone de interrogação) → mostra lógica de classificação

**3. Feedback Loop Visível**
- Professor vê qualidade da IA melhorando com o tempo
- "Esta sugestão foi útil?" → alimenta pipeline de prompts
- Dashboard mostra evolução: "Sua taxa de aprovação de relatórios subiu de 75% → 92%"
- **Oportunidade:** Produto que aprende = sensação de parceria, não ferramenta estática
- **Táticas UX:**
  - Gráfico de linha "Evolução da Qualidade" no dashboard do professor
  - Badge "Ressoa está aprendendo com você" quando IA melhora
  - NPS contextual: "O relatório de hoje ficou melhor que o da semana passada?" (👍👎)

**4. Dashboard Pedagógico, Não Punitivo**
- Coordenadora vê "Turma 7B precisa de atenção em Álgebra" (não "Prof. João está ruim")
- Tom sempre colaborativo: "O que podemos fazer para ajudar?" vs. "O que está errado?"
- Usar linguagem de oportunidade, não de problema
- **Oportunidade:** Interface que facilita conversas difíceis sem criar conflito
- **Táticas UX:**
  - Cores: evitar vermelho puro (usa laranja #F97316 para "atenção")
  - Linguagem: "Oportunidades de melhoria" vs "Problemas detectados"
  - Ações sugeridas: sempre mostra próximo passo ("Agendar conversa com Prof. João sobre reforço")

**5. Upload Experience Excepcional**
- Drag-and-drop fluido, suporte a múltiplos formatos, recuperação de falhas
- **Oportunidade:** Upload tão bom que professor prefere Ressoa a outras plataformas
- **Táticas UX:**
  - Área de drop com animação de ondas (ressonância) quando arquivo passa por cima
  - Suporte a múltiplos arquivos de uma vez (professor faz upload de semana inteira)
  - Preview do arquivo antes de enviar (duração, tamanho, formato)
  - Loading states informativos: "Transcrevendo 2:35 / 47:30 (~3 min restantes)"

**6. Insights Pedagógicos Contextuais**
- Não apenas "você cobriu 60% de equações", mas "Faltam tópicos X e Y - sugestão para próxima aula: problema contextualizado"
- Exercícios gerados usam CONTEXTOS da aula (se professor usou pizza para fração, exercícios usam alimentos)
- **Oportunidade:** IA que entende pedagogia = diferencial técnico percebido como diferencial de valor
- **Táticas UX:**
  - Cards de "Sugestões para Próxima Aula" com ações diretas ("Usar esta sugestão")
  - Biblioteca de exercícios contextuais (professor pode salvar favoritos)
  - Timeline visual: "Semana 1: Introduziu conceito → Semana 2: Exercícios → Semana 3: [sugestão] Avaliação"

**7. Design System Consistente e Acessível**
- Tom amigável-acessível (tipo Canva, Loom) aplicado em toda interface
- Paleta de cores profissional mas não intimidadora
- **Oportunidade:** Visual que transmite "tech de qualidade" sem perder acessibilidade
- **Táticas UX:**
  - Ilustrações customizadas (ondas, ressonância) em estados vazios
  - Micro-interações suaves (botões com hover states, transições de 200ms)
  - Dark mode opcional (professores revisando relatórios à noite)

---

## Visual Identity & Design System

### Brand Identity

**Nome:** Ressoa AI
**Significado:** "Ressoa" evoca ressonância, eco, amplificação - a IA amplifica o impacto pedagógico do professor
**Tagline:** "Inteligência de Aula, Análise e Previsão de Conteúdo"
**Tom de Voz:** Amigável-acessível (tipo Canva, Loom) - tech de qualidade sem intimidar

### Color Palette

| Cor | Hex Code | Nome | Aplicação |
|-----|----------|------|-----------|
| 🔵 | `#0A2647` | **Deep Navy** | **Primária.** Cabeçalhos, rodapés, textos de destaque, fundos de seções escuras. Transmite seriedade e profissionalismo. |
| 🔷 | `#2563EB` | **Tech Blue** | **Secundária.** Ícones, links, bordas, elementos gráficos. É o azul "brilhante" do logo. |
| 💠 | `#06B6D4` | **Cyan AI** | **Degradês e Detalhes.** Brilho "neon" tecnológico em fundos ou detalhes sutis. Representa a IA. |
| 🟠 | `#F97316` | **Focus Orange** | **Ação (CTA).** Botões de "Assinar", "Começar agora", alertas importantes. Complementar ao azul, chama atenção. |
| ⚪ | `#F8FAFC` | **Ghost White** | **Fundo.** Cinza ultra-claro para conforto visual. Evita branco puro (#FFFFFF) que cansa a vista. |

**Regra de Aplicação 60-30-10:**
- **60%** Ghost White (#F8FAFC) - Muito espaço em branco para respirar
- **30%** Deep Navy (#0A2647) - Textos, menu lateral, cabeçalho
- **10%** Tech Blue (#2563EB) + Focus Orange (#F97316) - Botões e pontos de clique

### Typography

**1. Títulos e Cabeçalhos**
**Fonte:** Montserrat ou Outfit (Sans Serif, geométrica, moderna)
**Peso:** Bold (700) ou Semi-Bold (600)
**Por quê:** Transmite tecnologia e estrutura organizada. Personalidade em tamanhos grandes.

**2. Textos Longos e Relatórios**
**Fonte:** Inter ou Open Sans (Sans Serif, UI-optimized)
**Peso:** Regular (400) para corpo de texto, Medium (500) para subtítulos
**Por quê:** Inter foi criada para telas. Extremamente legível, não cansa a vista. Escolha de startups tech.

**Hierarquia Tipográfica:**
```
H1 (Hero): Montserrat Bold 48px / Deep Navy
H2 (Section): Montserrat Semi-Bold 32px / Deep Navy
H3 (Subsection): Montserrat Semi-Bold 24px / Deep Navy
Body Large: Inter Regular 18px / Deep Navy (80% opacity)
Body: Inter Regular 16px / Deep Navy (80% opacity)
Caption: Inter Regular 14px / Deep Navy (60% opacity)
```

### Component Guidelines

**Cards de Relatório:**
- Fundo: Branco (#FFFFFF)
- Sombra: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Sobre fundo: Ghost White (#F8FAFC)
- Border Radius: 8px
- Padding: 24px

**Botões:**
- **Primary CTA:** Focus Orange (#F97316), branco, padding 12px 24px, radius 6px
  - Hover: Escurecer 10% (#E06414)
- **Secondary:** Tech Blue (#2563EB), branco, padding 12px 24px, radius 6px
  - Hover: Escurecer 10% (#1E4FD8)
- **Tertiary/Ghost:** Apenas borda Tech Blue, texto Tech Blue
  - Hover: Fundo Tech Blue 10% opacity

**Dashboards/Gráficos:**
- Usar paleta completa: Deep Navy → Tech Blue → Cyan AI
- Gradientes: Tech Blue (#2563EB) → Cyan AI (#06B6D4)
- Evitar vermelho para dados negativos (usar Focus Orange)

**Estados de Loading:**
- Spinner: Tech Blue (#2563EB) com animação de onda/ressonância
- Progress Bar: Fundo Ghost White, preenchimento gradiente (Tech Blue → Cyan)
- Skeleton Screens: Ghost White com shimmer

**Ícones:**
- Sistema: Heroicons ou Lucide (outline style)
- Cor padrão: Tech Blue (#2563EB)
- Tamanho: 20px (inline), 24px (destaque), 32px (hero)

### Accessibility Guidelines

**Contraste de Texto:**
- Deep Navy (#0A2647) em Ghost White (#F8FAFC): 14.8:1 ✅ (AAA)
- Tech Blue (#2563EB) em Ghost White: 6.2:1 ✅ (AA)
- Focus Orange (#F97316) em Ghost White: 3.9:1 ⚠️ (usar apenas em botões grandes)

**Touch Targets (Mobile):**
- Mínimo: 44x44px (todos os botões e links clicáveis)
- Espaçamento: 8px entre elementos interativos

**Keyboard Navigation:**
- Focus state visível: borda Tech Blue 2px, outline offset 2px
- Skip links para navegação rápida

**Responsividade:**
- Breakpoints: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)
- Tipografia escalável (usar clamp() ou rem units)

---

## Core User Experience

### Defining Experience

Ressoa AI é centrado em um loop de valor pedagógico: professores gravam aulas naturalmente, fazem upload sem fricção, e recebem análises pedagógicas profundas que realmente impactam o planejamento. A experiência é definida por três pilares:

1. **Upload sem esforço**: Arquivos grandes (até 2GB) com upload resumível, drag-and-drop, e feedback visual constante
2. **Análise transparente**: IA não é caixa preta - usuário vê progresso (transcrição → cobertura → qualitativa → relatório) com estimativas de tempo
3. **Insights acionáveis**: Relatórios 90%+ prontos para uso, com highlights visuais, dados BNCC precisos, e sugestões práticas

O loop central mais frequente é **revisar e aprovar relatórios pedagógicos**. A ação mais crítica é **upload bem-sucedido** - se falhar, toda experiência colapsa.

### Platform Strategy

**Estratégia Híbrida Mobile-First, Desktop-Complete:**

- **Mobile (Touch-Based)**: Professores fazem upload imediatamente após aula, revisam relatórios em trânsito, aprovam rapidamente
- **Desktop (Mouse/Keyboard)**: Coordenadores e diretores fazem análise profunda, exploram dashboards, exportam dados
- **Responsivo Crítico**: Interface única que adapta densidade de informação e affordances de interação

**Decisões Técnicas:**
- ✅ Upload resumível (arquivos grandes, conexões instáveis em escolas)
- ❌ Offline não necessário (análise exige cloud STT/LLM)
- 🔮 Futuro: Gravação direta no navegador (Web Audio API, MediaRecorder)
- 🔌 Integrações OAuth simples (Zoom, Google Meet, Read.ai)

**Contextos de Uso:**
- Professor: 70% mobile (upload/revisão) + 30% desktop (planejamento)
- Coordenador: 20% mobile + 80% desktop (dashboards, análise)
- Diretor: 10% mobile + 90% desktop (relatórios executivos)

### Effortless Interactions

Interações que devem ser **completamente naturais e sem pensamento**:

1. **Upload de Arquivo**
   - Drag-and-drop ou seleção de arquivo
   - Progresso visual granular (velocidade, tempo restante, % completo)
   - Upload em background (usuário pode navegar)
   - Resumível automaticamente se cair conexão

2. **Acompanhamento de Análise**
   - Pipeline visual: Transcrevendo (40%) → Analisando cobertura (30%) → Análise qualitativa (20%) → Gerando relatório (10%)
   - Estimativa de tempo dinâmica baseada em tamanho do arquivo
   - Notificação quando concluir (browser notification + email opcional)

3. **Escaneabilidade do Relatório**
   - Highlights visuais com cores do design system
   - Cards organizados por seção (Cobertura, Qualidade, Exercícios, Alertas)
   - Busca inline e filtros rápidos
   - Ações primárias sempre visíveis (Aprovar, Editar, Exportar)

4. **Aprovação Rápida**
   - Botão "Aprovar" sempre acessível (sticky header no scroll)
   - Confirmação de um clique (sem modais desnecessários)
   - Opção de aprovar com ajustes inline

5. **Navegação Contextual**
   - Menu adapta ao perfil (Professor: Minhas Aulas | Coordenador: Séries | Diretor: Escola)
   - Breadcrumbs sempre visíveis (Escola > Série > Turma > Aula)
   - Máximo 2 cliques para dados importantes

6. **Integração com Plataformas**
   - OAuth simples (Conectar com Zoom → Autorizar → Importar automaticamente)
   - Lista de gravações disponíveis com preview
   - Importação com um clique

### Critical Success Moments

**Momento "Aha!" (First Value Experience):**
> Novo professor faz upload da primeira aula → 15 minutos depois abre o relatório → vê análise pedagógica detalhada com habilidades BNCC identificadas, metodologias reconhecidas, e sugestões práticas → aprova com <2min de revisão → percebe: "Isso vai economizar horas de documentação manual"

**Quando usuário se sente bem-sucedido:**

1. **Para Professor:**
   - Upload completa sem erros (conexão instável não impediu)
   - Relatório está 90%+ correto (mínima edição necessária)
   - Sugestões de exercícios são pedagogicamente adequadas
   - Consegue aprovar 5 aulas em <15min

2. **Para Coordenador:**
   - Dashboard mostra cobertura bimestral visual (gaps em vermelho)
   - Identifica professor que precisa de suporte antes do fim do bimestre
   - Exporta relatório de série para reunião pedagógica em 3 cliques

3. **Para Diretor:**
   - Vê benchmark escola vs. BNCC em gráficos claros
   - Identifica tendências de qualidade por série/disciplina
   - Toma decisão de intervenção pedagógica baseada em dados

**Interações Make-or-Break (se falharem, arruínam tudo):**

- ❌ **Upload falhar silenciosamente** → usuário perde 30min de espera
- ❌ **Relatório genérico** ("Aula boa, continue assim") → perde confiança na IA
- ❌ **Análise >20min sem feedback** → usuário abandona página, perde trabalho
- ❌ **Transcrição imprecisa** (>20% erro) → relatório inútil
- ❌ **Interface complexa** → professores não adotam (resistência tech)

**Métricas de Sucesso de Primeira Viagem:**
- ✅ >80% dos professores completam primeiro upload + aprovação
- ✅ <5min tempo médio de revisão de relatório
- ✅ >70% aprovam sem edições significativas
- ✅ >60% fazem segundo upload em 7 dias (retenção)

### Experience Principles

Estes 5 princípios guiam **todas as decisões de UX** do Ressoa AI:

#### **1. 🔍 Transparência Radical**
*"O usuário sempre sabe o que está acontecendo e por quê"*

**Aplicação:**
- Mostrar progresso de upload/análise em tempo real com estimativas
- Explicar decisões da IA ("Identifiquei EF06MA01 porque você mencionou...")
- Deixar claro o estado de cada aula (badge visual: Transcrita, Analisada, Aprovada)
- Expor score de confiança da análise (95% confiança = menos revisão necessária)

**Anti-padrões:**
- ❌ Spinner genérico "Carregando..." sem contexto
- ❌ IA toma decisões sem explicação
- ❌ Erros crípticos sem ação sugerida

---

#### **2. ✨ Confiança pela Qualidade**
*"Um relatório excepcional vale mais que dez medianos"*

**Aplicação:**
- Foco absoluto na qualidade da análise pedagógica (meta: 90%+ usável sem edição)
- Feedback visual de qualidade (highlights, scores, sugestões destacadas)
- Permitir ajustes inline sem destruir o trabalho da IA
- Mostrar exemplos de "boas práticas" identificadas na aula

**Anti-padrões:**
- ❌ Relatórios genéricos com frases-template
- ❌ Análise superficial sem insights acionáveis
- ❌ Esconder limitações da IA (sempre mostrar score de confiança)

---

#### **3. 💪 Resiliência por Design**
*"Conexões falham, arquivos são grandes, mas a experiência não quebra"*

**Aplicação:**
- Upload resumível com chunking (interrupções não perdem progresso)
- Salvamento automático constante (cada ação persiste imediatamente)
- Recuperação graceful de erros com ações claras ("Tentar novamente" / "Usar transcrição parcial")
- Modo degradado: se análise falhar, ainda entrega transcrição

**Anti-padrões:**
- ❌ "Algo deu errado" sem contexto ou ação
- ❌ Perder trabalho do usuário (edições não salvas)
- ❌ Upload reiniciar do zero se cair conexão

---

#### **4. 🎭 Contexto Adaptativo**
*"A interface muda conforme quem você é e o que precisa fazer"*

**Aplicação:**
- **Professor**: Vê turmas, aulas, relatórios individuais (foco micro)
- **Coordenador**: Vê séries, cobertura bimestral, comparações (foco médio)
- **Diretor**: Vê escola, benchmarks BNCC, tendências (foco macro)
- **Mobile**: Densidade menor, ações prioritárias, upload rápido
- **Desktop**: Densidade alta, dashboards complexos, análise profunda

**Anti-padrões:**
- ❌ Interface única "one-size-fits-all" sem considerar perfil
- ❌ Mostrar dados irrelevantes para o contexto do usuário
- ❌ Mobile = versão empobrecida (deve ser funcional completo)

---

#### **5. ⚡ Esforço Zero para Ações Frequentes**
*"O que você faz todo dia deve ser instantâneo"*

**Aplicação:**
- **Upload**: Arraste arquivo → pronto (sem formulários)
- **Aprovação**: Um clique → feito (sem confirmações desnecessárias)
- **Navegação**: Máximo 2 cliques para qualquer dado importante
- **Ações secundárias**: Escondidas mas acessíveis (⋮ menu)
- **Atalhos de teclado**: Para usuários power (Ctrl+Enter = Aprovar)

**Anti-padrões:**
- ❌ Formulários longos para ações simples
- ❌ Confirmações excessivas ("Tem certeza?" para tudo)
- ❌ Navegação profunda (>3 cliques para dados críticos)
- ❌ Interfaces "democráticas" (tudo tem mesmo peso visual)

---

## Desired Emotional Response

### Primary Emotional Goals

O Ressoa AI deve gerar emoções que transformem o uso de tecnologia educacional de "mais uma obrigação burocrática" para "aliado que me empodera". As emoções primárias variam por persona:

**Professor João:**
- **Alívio** 😌 - Libertação de 2-3h semanais de trabalho manual repetitivo
- **Controle** 🎮 - Autonomia total sobre dados compartilhados ("privado até eu aprovar")
- **Confiança** 🤝 - IA demonstra competência pedagógica real, não análise superficial
- **Realização** ✅ - Sensação tangível de produtividade (aprovar 5 relatórios em 15min)

**Coordenadora Marcia:**
- **Empowerment** 💪 - Dados objetivos para embasar conversas difíceis sem criar conflito
- **Clareza** 🔍 - Visibilidade instantânea de gaps curriculares (não achismo)
- **Colaboração** 🤲 - Ferramenta para ajudar professores, não vigiá-los

**Dono Ricardo:**
- **Tranquilidade** 😊 - Controle operacional sem microgerenciar
- **Segurança** 🛡️ - Investimento tech que realmente foi adotado (não desperdiçado)

**Emoção diferenciadora vs. concorrentes:**
> "Sinto que o sistema me entende e trabalha **comigo**, não **sobre mim**"

### Emotional Journey Mapping

A jornada emocional é construída para transformar ceticismo inicial em confiança recorrente:

| Estágio | Emoção Desejada | Design Implication | Anti-Padrão (Evitar) |
|---------|-----------------|-------------------|----------------------|
| **Descoberta** | Curiosidade + Esperança | Landing page com demo real (não promessas vagas) | Ceticismo ("Mais uma promessa falsa") |
| **Onboarding** | Confiança + Facilidade | Aula de demonstração pré-gravada (testar sem gravar própria) | Confusão ("Não sei por onde começar") |
| **Primeiro Upload** | Tranquilidade | Progresso visual detalhado + upload resumível | Ansiedade ("Será que deu certo?") |
| **Aguardando Análise** | Expectativa Positiva | Pipeline visual (Transcrevendo 45% → Analisando...) | Impaciência ("Demora demais") |
| **Primeiro Relatório** | **Momento "Wow!"** 🤩 | Análise profunda com insights acionáveis | Decepção ("É só isso?") |
| **Aprovação** | Realização | Métrica: "Você economizou 2h30 esta semana" | Frustração ("Tive que corrigir tudo") |
| **Retorno Recorrente** | Familiaridade + Eficiência | Atalhos de teclado, ações rápidas (1 clique) | Tédio ("Virou chato usar") |
| **Erro/Problema** | Resiliência | Recuperação graceful com ações claras | Pânico ("Perdi todo o trabalho") |

**Marco Emocional Crítico: Primeiro Relatório**
> Após 15 minutos de espera, professor abre relatório e vê: habilidades BNCC identificadas corretamente, metodologias reconhecidas, sugestões práticas contextualizadas. Aprova com <2min de revisão. Percebe: "Isso é genuinamente útil, não genérico". **Esse é o momento que define adoção ou abandono.**

### Micro-Emotions

Estados emocionais sutis que definem sucesso ou falha:

#### **1. Confiança vs. Ceticismo** 🔐

**Meta:** Professor confia que dados são privados, IA é precisa, sistema é confiável

**Design Tactics:**
- Badge visual "🔒 Privado até você aprovar" em todos os relatórios
- Score de confiança visível (92%) - nunca esconder limitações
- Evidências textuais clicáveis (ver trecho exato da transcrição que justifica análise)
- Changelog transparente: "Melhoramos detecção de metodologias ativas (+15% precisão)"

**Anti-Patterns:**
- ❌ Mensagens vagas ("Processando...")
- ❌ Erros sem explicação ("Algo deu errado")
- ❌ Transcrição imprecisa sem avisar score de confiança

---

#### **2. Controle vs. Vigilância** 🎛️

**Meta:** Professor sente autonomia total sobre dados compartilhados

**Design Tactics:**
- Workflow de aprovação explícito (dados não vazam antes)
- Configurações de privacidade acessíveis (não escondidas em 5 cliques)
- Mensagem clara: "Coordenação vê métricas agregadas, NÃO transcrições brutas"
- Ícone de cadeado em transcrições + tooltip: "Apenas você pode ver isso"

**Anti-Patterns:**
- ❌ Dados compartilhados automaticamente sem aprovação
- ❌ Falta de transparência sobre quem vê o quê
- ❌ Configurações de privacidade difíceis de encontrar

---

#### **3. Tranquilidade vs. Ansiedade** 🧘

**Meta:** Upload grande não causa estresse, usuário relaxa enquanto IA trabalha

**Design Tactics:**
- Upload resumível: "Pode fechar a janela, continuamos no background"
- Progresso detalhado: "Enviando 2,3 MB/s → 45% completo → ~3min restantes"
- Notificação quando concluir: "✅ Seu relatório está pronto!"
- Recuperação graceful: "Upload interrompido. [Continuar de onde parou]"

**Anti-Patterns:**
- ❌ Spinner genérico "Carregando..." sem contexto
- ❌ Upload falhar silenciosamente (usuário espera 30min em vão)
- ❌ Sem estimativa de tempo ("Pode demorar alguns minutos... ou horas")

---

#### **4. Realização vs. Frustração** 🏆

**Meta:** Professor se sente produtivo após usar o sistema

**Design Tactics:**
- Métrica visível: "Você economizou 2h30 esta semana com Ressoa AI"
- Aprovação rápida: 1 clique (sem confirmações excessivas)
- Relatórios 90%+ prontos (mínima edição necessária)
- Micro-celebração: "🎉 5 relatórios aprovados hoje! Sua melhor semana"

**Anti-Patterns:**
- ❌ Relatórios genéricos que exigem reescrita total
- ❌ Processo de aprovação burocrático (formulários longos)
- ❌ Nunca mostrar economia de tempo (valor invisível)

---

#### **5. Empowerment vs. Impotência** 💡

**Meta:** Coordenadora se sente capaz de tomar decisões melhores

**Design Tactics:**
- Dashboard acionável: "Turma 7B: gap em Equações → [Agendar reunião com Prof. João]"
- Insights contextuais: "Faltam tópicos X e Y - sugestão: revisar antes da prova"
- Exportação fácil: PDF pronto para reunião pedagógica em 3 cliques
- Filtros intuitivos: ver por série, disciplina, bimestre

**Anti-Patterns:**
- ❌ Dados apresentados sem contexto ("60% cobertura" - e daí?)
- ❌ Insights vagos sem próximos passos
- ❌ Dashboard que mostra problemas mas não sugere soluções

---

#### **6. Colaboração vs. Punição** 🤝

**Meta:** Coordenadora usa sistema para ajudar, não vigiar

**Design Tactics:**
- Linguagem de "oportunidades" (não "problemas" ou "falhas")
- Foco em gaps curriculares (não performance individual de professores)
- Tom pedagógico: "Como podemos ajudar?" vs. "O que está errado?"
- Usar laranja (#F97316) para "atenção" (evitar vermelho puro que implica erro)

**Anti-Patterns:**
- ❌ Ranking de professores (gera competição negativa)
- ❌ Linguagem punitiva ("Prof. João falhou em cobrir...")
- ❌ Dashboard que expõe "piores professores"

### Design Implications

Conexões diretas entre emoções desejadas e escolhas UX concretas:

#### **Alívio → Economia de Tempo Visível**

**Implementação:**
- Widget no dashboard: "📊 Você economizou 2h30 esta semana com Ressoa AI"
- Comparação visual: "Antes: 3h manual | Agora: 15min com Ressoa"
- Checklist gamificado: "✓ 5 relatórios aprovados hoje (novo recorde!)"
- Email semanal: "Esta semana você aprovou 12 aulas e economizou 4h20"

**Onde aplicar:** Dashboard do professor, email de resumo semanal, tela pós-aprovação

---

#### **Confiança → Transparência da IA**

**Implementação:**
- Score de confiança em cada análise: "92% confiança nesta análise"
- Evidências clicáveis: Clicar em "EF06MA01 - Coberta" → mostra trecho da transcrição
- Sidebar com transcrição completa ao lado do relatório
- "Por que a IA decidiu isso?" (ícone ?) → explica lógica de classificação

**Onde aplicar:** Tela de relatório pedagógico, análise de cobertura, sugestões de exercícios

---

#### **Controle → Privacidade por Design**

**Implementação:**
- Badge "🔒 Privado até você aprovar" em todos os relatórios não aprovados
- Fluxo visual: Transcrição → Análise (só você vê) → [Aprovar] → Visível para coordenação
- Tooltip ao passar mouse em dados: "Apenas você pode ver transcrições brutas"
- Configurações de privacidade em menu principal (não escondidas)

**Onde aplicar:** Tela de relatório, menu de configurações, onboarding (explicar privacidade nos primeiros 30s)

---

#### **Tranquilidade → Resiliência Visual**

**Implementação:**
- Upload resumível: "Pode fechar a janela, continuamos no background"
- Progresso granular: "Enviando 2,3 MB/s → 45% → ~3min restantes"
- Recuperação graceful: "Upload interrompido. [Continuar] [Tentar novamente]"
- Salvamento automático: Toast: "✓ Todas as edições salvas automaticamente"

**Onde aplicar:** Tela de upload, editor de relatório, notificações

---

#### **Realização → Celebração de Micro-Wins**

**Implementação:**
- Confetti sutil no primeiro relatório aprovado (não exagerado)
- Toast pós-aprovação: "🎉 Relatório aprovado! Você economizou 40min"
- Progresso visível: Gráfico de linha "Sua evolução: Semana 1: 2 aulas | Semana 2: 5 aulas"
- Badge de conquista: "🏆 10 aulas aprovadas! Você dominou o Ressoa"

**Onde aplicar:** Tela pós-aprovação, dashboard pessoal, email de marcos

---

#### **Empowerment → Insights Acionáveis**

**Implementação:**
- Cards de ação no dashboard: "Turma 7B: gap em Equações → [Agendar reunião] [Ver detalhes]"
- Sugestões contextuais: "Próxima aula: trabalhar sistemas de equações (EF08MA08)"
- Timeline pedagógica: "Semana 1: Introduziu → Semana 2: Exercícios → Semana 3: [Sugestão] Avaliação"
- Exportação inteligente: "Gerar PDF para reunião pedagógica" → PDF pronto em 3s

**Onde aplicar:** Dashboard de coordenador, relatórios de série, sugestões de próxima aula

### Emotional Design Principles

Estes 5 princípios traduzem objetivos emocionais em regras práticas de design:

#### **1. 😌 Gere Alívio, Não Sobrecarga**
*"Cada interação deve reduzir estresse, nunca adicionar"*

**Aplicação prática:**
- Upload em background (professor pode navegar enquanto carrega)
- Aprovação rápida: 1 clique (sem confirmações excessivas tipo "Tem certeza?")
- Linguagem tranquilizadora: "Tudo certo, estamos analisando sua aula 👍"
- Métricas de economia de tempo sempre visíveis

**Medição de sucesso:**
- NPS: "Ressoa AI reduziu meu estresse semanal" (meta: >60% concordam fortemente)
- Tempo médio de aprovação: <5min (meta atingida = alívio percebido)

---

#### **2. 🤝 Construa Confiança com Transparência**
*"Mostre o porquê de cada decisão, nunca seja caixa preta"*

**Aplicação prática:**
- IA sempre explica decisões ("Identifiquei EF06MA01 porque você mencionou 'números naturais'")
- Score de confiança visível (92%) - nunca esconder limitações
- Evidências literais (não parafrasear transcrição)
- Changelog: "Melhoramos detecção de metodologias ativas (+15% precisão)"

**Medição de sucesso:**
- Taxa de aprovação sem edições: >70% (meta = IA confiável)
- Feedback: "A análise foi precisa?" (meta: >80% 👍)

---

#### **3. 🎮 Dê Controle ao Usuário**
*"O usuário sempre decide, o sistema sempre sugere"*

**Aplicação prática:**
- Workflow de aprovação explícito (dados não vazam antes de professor aprovar)
- Edição inline preserva trabalho da IA (não apaga tudo ao editar)
- Configurações de privacidade acessíveis e claras
- Mensagem: "Coordenação vê métricas agregadas, NÃO transcrições"

**Medição de sucesso:**
- Taxa de adoção: >80% professores usam regularmente (meta = não há resistência por medo de vigilância)
- Pesquisa: "Me sinto no controle dos meus dados?" (meta: >90% concordam)

---

#### **4. 🏆 Celebre Realizações**
*"Faça o usuário se sentir produtivo e bem-sucedido"*

**Aplicação prática:**
- Métrica de economia de tempo sempre visível: "Você economizou 2h30 esta semana"
- Micro-celebrações em marcos (primeiro upload, primeira aprovação, 10 aulas)
- Feedback positivo: "👍 Relatório aprovado! Menos 40min de trabalho manual"
- Gráfico de progresso: "Sua evolução: Semana 1: 2 aulas → Semana 4: 7 aulas"

**Medição de sucesso:**
- NPS: "Me sinto mais produtivo com Ressoa AI" (meta: >40 NPS)
- Engajamento: >70% professores retornam em 7 dias (retenção)

---

#### **5. 🤲 Facilite Colaboração, Não Vigilância**
*"Sistema que ajuda professores, não que os julga"*

**Aplicação prática:**
- Linguagem de "oportunidade" (nunca "problema" ou "falha")
- Dashboard foca em gaps curriculares (não performance individual)
- Tom pedagógico: "Como podemos ajudar?" vs. "O que está errado?"
- Usar laranja (#F97316) para "atenção" (evitar vermelho puro = erro)

**Medição de sucesso:**
- Pesquisa com professores: "Coordenação usa Ressoa para me ajudar" (meta: >80% concordam)
- Taxa de conversas pedagógicas construtivas (meta: coordenadores reportam conversas mais produtivas)

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

Para informar as decisões de design do Ressoa AI, analisamos produtos que ressoam com nossos usuários e objetivos emocionais:

#### **Para Professores (Simplicidade + Eficiência)**

**Canva** 🎨
- **Relevância:** Professores já usam para criar materiais didáticos
- **O que fazem bem:** Templates prontos, drag-and-drop sem atrito, onboarding por vídeo curto (<2min)
- **Padrão-chave:** Zero curva de aprendizado para ação primária
- **Emoção gerada:** "Posso fazer isso sozinho, sem ajuda" (autonomia)
- **Transferível para Ressoa:** Upload deve ser tão simples quanto arrastar arquivo

**Loom** 🎥
- **Relevância:** Gravação + transcrição automática (caso de uso similar)
- **O que fazem bem:** Upload resumível, progresso visual detalhado (MB/s, % completo, tempo restante), compartilhamento com um clique
- **Padrão-chave:** Confiabilidade técnica visível (nunca perde gravação)
- **Emoção gerada:** "Funciona perfeitamente, não preciso pensar" (tranquilidade)
- **Transferível para Ressoa:** Upload em background, notificação quando concluir

**Notion** 📝
- **Relevância:** Professores usam para organizar planejamentos
- **O que fazem bem:** Blocos modulares, escaneabilidade excepcional, templates comunitários
- **Padrão-chave:** Estrutura flexível mas com defaults inteligentes
- **Emoção gerada:** "Organizo do meu jeito, sem imposição" (controle)
- **Transferível para Ressoa:** Relatórios organizados em cards/blocos, busca inline

---

#### **Para Coordenadores (Dashboards + Insights)**

**Linear** 🚀
- **Relevância:** Dashboard de gestão com UX excepcional
- **O que fazem bem:** Cards acionáveis, busca instantânea (Cmd+K), atalhos de teclado, velocidade como feature
- **Padrão-chave:** Encontrar qualquer dado em <3s
- **Emoção gerada:** "Encontro o que preciso em segundos" (eficiência)
- **Transferível para Ressoa:** Busca global por habilidade BNCC/professor/turma, filtros rápidos

**Mixpanel/Amplitude** 📊
- **Relevância:** Analytics com visualizações pedagógicas
- **O que fazem bem:** Filtros intuitivos (não exigem SQL), gráficos interativos, exportação fácil
- **Padrão-chave:** Visualizações que contam histórias (não apenas números)
- **Emoção gerada:** "Entendo os dados sem precisar de analista" (empowerment)
- **Transferível para Ressoa:** Heatmap de cobertura BNCC, gráficos de linha de evolução

---

#### **Para o Domínio Educacional**

**Khan Academy** 🎓
- **Relevância:** Referência em pedagogia digital
- **O que fazem bem:** Progresso visível (barra de %), explicações contextuais, celebrações sutis mas presentes
- **Padrão-chave:** Feedback imediato de progresso
- **Emoção gerada:** "Estou evoluindo, posso ver meu crescimento" (realização)
- **Transferível para Ressoa:** Progresso de cobertura bimestral, evolução semanal de uploads

**Duolingo** 🦉
- **Relevância:** Gamificação educacional bem-sucedida
- **O que fazem bem:** Streaks (uso contínuo), micro-celebrações, linguagem encorajadora
- **Padrão-chave:** Gamificação sutil (não infantilizada para adultos)
- **Emoção gerada:** "Quero voltar amanhã" (engajamento)
- **Transferível para Ressoa:** Streak de semanas usando Ressoa, celebração de marcos (10 aulas aprovadas)

### Transferable UX Patterns

Padrões extraídos e adaptados ao contexto do Ressoa AI:

#### **1. Upload de Arquivos (Dropbox, Google Drive, Loom)**

**Padrão Identificado:**
- Drag-and-drop com preview visual (ícone + nome + tamanho + duração)
- Upload resumível com chunking (se cair conexão, retoma automaticamente)
- Progresso granular: velocidade (MB/s), % completo, tempo restante dinâmico
- Background processing (usuário pode fechar janela, continua)
- Validação de formato ANTES de enviar (feedback instantâneo)

**Aplicação no Ressoa AI:**
- Área de drop com animação de ondas (tema ressonância) quando arquivo está sobre ela
- Suporte a múltiplos arquivos de uma vez (professor faz upload de semana inteira de aulas)
- Notificação quando concluir: "✅ Sua aula [Nome da Turma - Data] está pronta!"
- Recuperação graceful: "Upload interrompido. [Continuar de onde parou] [Tentar novamente]"

**Princípios Suportados:**
- 💪 Resiliência por Design (conexões falham, experiência não quebra)
- 😌 Gere Alívio, Não Sobrecarga (upload em background, sem ansiedade)

---

#### **2. Transparência da IA (ChatGPT, Grammarly, Notion AI)**

**Padrão Identificado:**
- Mostrar "pensamento" da IA em tempo real ("Analisando tom...", "Verificando gramática...")
- Explicar decisões com evidências ("Sugiro mudar X porque Y [trecho destacado]")
- Score de confiança visível (Grammarly: "89% certeza que isso é erro")
- Permitir edição inline sem destruir trabalho da IA (lado-a-lado)
- Changelog de melhorias: "Melhoramos detecção de X (+15% precisão)"

**Aplicação no Ressoa AI:**
- Pipeline visual: "Transcrevendo 45% → Analisando cobertura BNCC 30% → Gerando insights qualitativos..."
- Evidências clicáveis: Clicar em "EF06MA01 - Coberta" → sidebar mostra trecho exato da transcrição
- Score de confiança: "92% confiança nesta análise" (nunca esconder limitações)
- Editor lado-a-lado: Transcrição original | Relatório gerado (como Grammarly mostra original | sugestões)
- Feedback loop: "Esta sugestão foi útil? 👍👎" → alimenta melhoria de prompts

**Princípios Suportados:**
- 🔍 Transparência Radical (usuário sempre sabe o que está acontecendo)
- ✨ Confiança pela Qualidade (mostrar evidências, nunca ser caixa preta)

---

#### **3. Dashboards Acionáveis (Linear, Notion, Airtable)**

**Padrão Identificado:**
- Cards com contexto + ação clara ("Issue X está bloqueada → [Ver dependências] [Desbloquear]")
- Filtros simples mas poderosos (não exigem SQL: "Status: Em Progresso" + "Atribuído a: João")
- Vistas alternativas (Kanban, Lista, Calendário, Timeline)
- Busca global com atalho de teclado (Cmd/Ctrl+K) → navegação instantânea
- Skeleton screens (carregamento percebido como instantâneo)

**Aplicação no Ressoa AI:**
- Cards de gap curricular: "Turma 7B: falta Equações (EF08MA08) → [Agendar reunião] [Ver detalhes] [Sugerir exercícios]"
- Filtros intuitivos: "Série: 6º ano" + "Disciplina: Matemática" + "Bimestre: 2"
- Vistas: Lista de aulas | Calendário bimestral | Heatmap de cobertura BNCC | Timeline de evolução
- Busca global: Cmd+K → buscar por "EF08MA08" ou "Prof. João" ou "Turma 7B"
- Carregamento com skeleton (não spinner genérico)

**Princípios Suportados:**
- 💡 Empowerment (coordenadora encontra dados e age rapidamente)
- ⚡ Esforço Zero para Ações Frequentes (máximo 2 cliques para dados importantes)

---

#### **4. Privacidade por Design (Signal, ProtonMail, Apple Health)**

**Padrão Identificado:**
- Comunicar privacidade proativamente (não esconder em termos de uso de 50 páginas)
- Badges visuais: "🔒 Criptografado ponta-a-ponta" (Signal), "🔐 Dados locais" (Apple Health)
- Onboarding explica privacidade nos primeiros 30 segundos (não no slide 15)
- Configurações de privacidade acessíveis (menu principal, não 5 cliques de profundidade)
- Linguagem clara: "Ninguém vê suas mensagens, nem nós" (Signal)

**Aplicação no Ressoa AI:**
- Badge em todos os relatórios não aprovados: "🔒 Privado até você aprovar"
- Onboarding (primeiros 30s): "Suas transcrições são privadas. Coordenação vê apenas métricas agregadas após sua aprovação."
- Fluxo visual: Transcrição → Análise (só você vê) → [Aprovar] → Visível para coordenação (sem transcrições brutas)
- Tooltip ao passar mouse em transcrição: "🔒 Apenas você pode ver isso"
- Configurações de privacidade: Menu lateral → Privacidade (não escondido)

**Princípios Suportados:**
- 🎮 Dê Controle ao Usuário (professor sempre decide o que compartilhar)
- 🎛️ Controle vs. Vigilância (sistema não vigia, empodera)

---

#### **5. Celebração de Micro-Wins (Duolingo, Strava, GitHub)**

**Padrão Identificado:**
- Confetti ou animação sutil em marcos (Duolingo: primeira lição completa, GitHub: primeiro commit)
- Streaks visíveis ("🔥 7 dias consecutivos usando Duolingo")
- Métricas de progresso pessoal (Strava: "Seu melhor mês! +15% vs. mês passado")
- Linguagem encorajadora (não neutra: "Incrível!" vs. "Tarefa concluída")
- Badges de conquista (GitHub: "Contributed to 10 repos")

**Aplicação no Ressoa AI:**
- Confetti sutil no primeiro relatório aprovado (não exagerado, profissional)
- Dashboard: "🔥 Semana produtiva! 7 aulas aprovadas (seu recorde pessoal)"
- Métrica sempre visível: "📊 Você economizou 2h30 esta semana com Ressoa AI"
- Toast pós-aprovação: "🎉 Relatório aprovado! Menos 40min de trabalho manual"
- Badges sutis: "🏆 10 aulas aprovadas! Você dominou o Ressoa"

**Princípios Suportados:**
- 🏆 Celebre Realizações (usuário se sente produtivo)
- 😌 Gere Alívio, Não Sobrecarga (mostrar economia de tempo tangível)

---

#### **6. Onboarding Progressivo (Slack, Notion, Figma)**

**Padrão Identificado:**
- Checklist gamificado: "✓ Criar primeiro projeto → ✓ Convidar time → ⏳ Criar quadro" (Slack)
- Tooltips contextuais (aparecem na primeira vez que vê feature, não todos de uma vez)
- Aula de demonstração pré-pronta (Figma: template file pronto para explorar sem criar do zero)
- Email de "dicas" nas primeiras semanas (Notion: "Dica da semana: use templates")
- Permitir pular (não bloqueante)

**Aplicação no Ressoa AI:**
- Checklist não-bloqueante: "✓ Upload primeira aula → ⏳ Revisar relatório → ⏳ Aprovar exercícios → ⏳ Conectar Zoom"
- Aula de demonstração pré-gravada (professor testa sem precisar gravar própria aula primeiro)
- Tooltips na primeira vez: "👋 Aqui você vê progresso da análise em tempo real"
- Email Dia 3: "💡 Dica: Você pode importar aulas do Zoom automaticamente"
- Botão "Pular tutorial" sempre visível

**Princípios Suportados:**
- 😌 Gere Alívio, Não Sobrecarga (não bloquear uso, permitir explorar)
- 🤝 Construa Confiança (primeira experiência positiva)

### Anti-Patterns to Avoid

Erros comuns identificados em produtos educacionais e analytics que conflitam com nossos princípios:

#### **1. ❌ Gamificação Infantilizada**

**Problema:** Duolingo às vezes exagera (mascote Duo chorando, linguagem infantilizada). Professores são adultos profissionais, não crianças.

**Por que evitar:**
- Conflita com tom "profissional-acessível" (não infantilizar)
- Risco: Professores se sentem desrespeitados, abandonam produto
- Exemplo ruim: "Você é demais! 🎈🎉🎊 Campeão de uploads!"

**Como evitar no Ressoa:**
- Celebrações sutis e profissionais: "Parabéns! 5 aulas aprovadas esta semana" (não mascotes fofinhos)
- Métricas significativas (economia de tempo) não badges vazios ("Mestre do Upload")
- Linguagem amigável mas respeitosa: "Ótimo trabalho" vs. "Você é o máximo!"

---

#### **2. ❌ Dashboards Sobrecarregados (Google Analytics, Tableau)**

**Problema:** 50 métricas na primeira tela, nenhuma acionável. Coordenadora fica paralisada: "O que eu faço com isso?"

**Por que evitar:**
- Conflita com "Esforço Zero para Ações Frequentes" (princípio #5)
- Risco: Paralisia por análise, coordenadores abandonam dashboard
- Exemplo ruim: Dashboard com 20 gráficos, sem hierarquia visual

**Como evitar no Ressoa:**
- Máximo 3-5 métricas principais no dashboard inicial (cobertura bimestral, alertas críticos, próximas ações)
- Cards com ação clara: "Gap identificado → [Agendar reunião] [Ver detalhes]"
- Detalhes em drill-down (clicar em card → ver análise profunda)
- "Modo Executivo" para diretor: visão consolidada (5 KPIs), não 20 gráficos

---

#### **3. ❌ Upload que Falha Silenciosamente**

**Problema:** WeTransfer antigo, Dropbox lento. Usuário espera 30min, descobre que falhou, precisa recomeçar do zero.

**Por que evitar:**
- Conflita com "Resiliência por Design" (princípio #3)
- Risco: Professor perde tempo, abandona sistema, volta ao manual
- Exemplo ruim: Spinner genérico → 30min → "Erro desconhecido"

**Como evitar no Ressoa:**
- Upload resumível (nunca reiniciar do zero se cair conexão)
- Validação ANTES de enviar: "Formato MP3/M4A/WAV aceito. MOV não suportado" (antes de upload, não depois)
- Progresso visual detalhado: "Enviando 2,3 MB/s → 45% → ~3min restantes"
- Notificação de erro imediata com ação: "Upload interrompido. [Continuar] [Tentar novamente] [Contatar suporte]"

---

#### **4. ❌ IA Caixa Preta (Turnitin, primeiras versões de Grammarly)**

**Problema:** "70% plágio detectado" sem explicar onde, como, ou por quê. Professor frustra: "Como assim? Onde?"

**Por que evitar:**
- Oposto do princípio "Transparência Radical"
- Risco: Professor não confia na análise, ignora relatórios, sistema perde valor
- Exemplo ruim: "Habilidade EF06MA01 não coberta" (sem mostrar por quê)

**Como evitar no Ressoa:**
- Sempre mostrar evidências: "EF06MA01 identificada porque você mencionou 'operações com números naturais' [ver trecho]"
- Score de confiança visível: "92% confiança nesta análise"
- Permitir contestar/editar: Clicar em habilidade → editar classificação → IA aprende
- Sidebar com transcrição completa (contexto sempre acessível)

---

#### **5. ❌ Onboarding Bloqueante (TurboTax, produtos enterprise)**

**Problema:** 15 telas obrigatórias antes de poder usar produto. Usuário abandona no slide 7.

**Por que evitar:**
- Conflita com "Gere Alívio, Não Sobrecarga" (princípio #1)
- Risco: Professor sobrecarregado abandona antes de ver valor
- Exemplo ruim: 10 slides de "Como funciona" antes de permitir upload

**Como evitar no Ressoa:**
- Onboarding progressivo (não bloqueante): tooltips contextuais quando relevante
- Permitir pular: Botão "Explorar por conta própria" sempre visível
- Usar aula demo: Professor explora relatório pronto sem precisar configurar tudo
- Máximo 3 slides essenciais: (1) Privacidade, (2) Como fazer upload, (3) Como aprovar relatório

---

#### **6. ❌ Privacidade Obscura (Facebook, produtos de vigilância)**

**Problema:** Termos de uso de 50 páginas, configurações escondidas em submenus profundos, opt-out difícil.

**Por que evitar:**
- Conflita com "Dê Controle ao Usuário" (princípio #3)
- Risco: Professor sente que está sendo vigiado, resiste à adoção
- Exemplo ruim: Privacidade explicada apenas em termos legais, não na interface

**Como evitar no Ressoa:**
- Comunicar privacidade proativamente: Badge "🔒 Privado até você aprovar" em todos os relatórios
- Onboarding explica privacidade nos primeiros 30s (slide 1, não slide 15)
- Configurações acessíveis: Menu lateral → Privacidade (não Settings → Advanced → Privacy → Data Sharing)
- Linguagem clara: "Coordenação vê métricas agregadas (ex: '70% cobertura'), NÃO transcrições brutas"

---

#### **7. ❌ Linguagem Punitiva (Sistemas de gestão escolar antigos)**

**Problema:** "Falha detectada", "Professor não atingiu meta", "Ranking: #23 de 25 professores". Cria ambiente de culpa.

**Por que evitar:**
- Conflita com "Facilite Colaboração, Não Vigilância" (princípio #5 emocional)
- Risco: Professores se sentem vigiados/julgados, coordenadora vista como vilã, sistema abandonado
- Exemplo ruim: Dashboard mostra "Piores professores da escola"

**Como evitar no Ressoa:**
- Linguagem de "oportunidade": "Turma 7B: oportunidade de reforço em Equações" (não "falha")
- Foco em gaps curriculares (não performance individual): "Série 7º ano: 65% cobertura" (não "Prof. João: pior da escola")
- Tom pedagógico: "Como podemos ajudar?" vs. "O que está errado?"
- Usar laranja (#F97316) para "atenção" (não vermelho puro que implica erro/falha)
- Nunca rankings que expõem professores

### Design Inspiration Strategy

Estratégia clara de como aplicar inspirações ao Ressoa AI:

#### **O QUE ADOTAR (Use Diretamente)**

Padrões comprovados que se alinham perfeitamente com nossos objetivos:

**1. Upload Dropbox-style**
- **Padrão:** Drag-and-drop + resumível + progresso detalhado (MB/s, %, tempo restante)
- **Por quê:** Padrão mental já estabelecido, professores conhecem
- **Onde aplicar:** Tela de upload de áudio (página principal do professor)
- **Princípio suportado:** 💪 Resiliência por Design

**2. Transparência ChatGPT-style**
- **Padrão:** Pipeline visual ("Thinking..." → "Generating...") + explicações de decisões
- **Por quê:** Constrói confiança na IA (nosso diferencial técnico)
- **Onde aplicar:** Análise em progresso, relatório pedagógico (evidências clicáveis)
- **Princípio suportado:** 🔍 Transparência Radical

**3. Dashboards Linear-style**
- **Padrão:** Cards acionáveis + busca global (Cmd+K) + skeleton screens
- **Por quê:** Empowerment para coordenadores (decisões rápidas baseadas em dados)
- **Onde aplicar:** Dashboard de coordenador/diretor, visão de escola/série
- **Princípio suportado:** 💡 Empowerment

**4. Privacidade Signal-style**
- **Padrão:** Badge 🔒 + mensagens proativas + configurações acessíveis
- **Por quê:** Controle ao usuário (medo crítico: vigilância)
- **Onde aplicar:** Relatórios não aprovados, onboarding, menu de configurações
- **Princípio suportado:** 🎮 Dê Controle ao Usuário

---

#### **O QUE ADAPTAR (Modificar para Nosso Contexto)**

Padrões bons, mas que precisam de ajuste para nosso público/domínio:

**1. Celebrações Duolingo-style → Versão Profissional**
- **Adaptação:** Confetti sutil (não mascote chorando), linguagem profissional ("Parabéns! 5 aulas aprovadas" não "Você é demais! 🎈")
- **Por quê:** Professores são adultos profissionais, gamificação deve ser respeitosa
- **Onde aplicar:** Primeiro upload, marcos de uso (10 aulas, primeiro mês)
- **Princípio suportado:** 🏆 Celebre Realizações

**2. Onboarding Slack-style → Versão Não-Bloqueante**
- **Adaptação:** Checklist opcional (pode pular), tooltips contextuais (não 10 slides de uma vez), aula demo pré-pronta
- **Por quê:** Professores sobrecarregados precisam de valor imediato (não tutorial longo)
- **Onde aplicar:** Primeiro acesso ao sistema
- **Princípio suportado:** 😌 Gere Alívio, Não Sobrecarga

**3. Filtros Notion-style → Linguagem Educacional**
- **Adaptação:** "Série: 6º ano" (não "Property: grade == 6"), "Disciplina: Matemática" (não "Subject field")
- **Por quê:** Vocabulário do domínio educacional (não jargão tech)
- **Onde aplicar:** Dashboards de coordenador, busca global
- **Princípio suportado:** 🤝 Construa Confiança

**4. Progresso Khan Academy-style → Foco em Tempo Economizado**
- **Adaptação:** Mostrar "Você economizou 2h30 esta semana" (não apenas "5 aulas completas")
- **Por quê:** Valor percebido é economia de tempo (não quantidade)
- **Onde aplicar:** Dashboard do professor, email semanal
- **Princípio suportado:** 🏆 Celebre Realizações

---

#### **O QUE EVITAR (Conflita com Nossos Objetivos)**

Padrões populares mas que não servem para nosso contexto:

**1. ❌ Gamificação Infantilizada (Duolingo exagerado)**
- **Por quê conflita:** Tom profissional-acessível (não infantilizar adultos)
- **Risco:** Professores se sentem desrespeitados, abandonam produto
- **Alternativa:** Celebrações sutis, métricas significativas (economia de tempo)

**2. ❌ Dashboards Sobrecarregados (Google Analytics)**
- **Por quê conflita:** Princípio "Esforço Zero para Ações Frequentes"
- **Risco:** Paralisia por análise, coordenadores abandonam dashboard
- **Alternativa:** Máximo 5 métricas principais, cards acionáveis, drill-down para detalhes

**3. ❌ Onboarding Bloqueante (TurboTax, enterprise)**
- **Por quê conflita:** Princípio "Gere Alívio, Não Sobrecarga"
- **Risco:** Professores abandonam antes de ver valor
- **Alternativa:** Onboarding progressivo, tooltips contextuais, aula demo

**4. ❌ IA Caixa Preta (Turnitin, Grammarly antigo)**
- **Por quê conflita:** Princípio "Transparência Radical" (nosso moat técnico)
- **Risco:** Perda de confiança, resistência à adoção
- **Alternativa:** Sempre mostrar evidências, score de confiança, sidebar com transcrição

**5. ❌ Linguagem Punitiva (Sistemas escolares antigos)**
- **Por quê conflita:** Princípio "Facilite Colaboração, Não Vigilância"
- **Risco:** Professores se sentem vigiados, coordenação vista como vilã
- **Alternativa:** Linguagem de "oportunidade", foco em gaps curriculares (não pessoas)

---

#### **Síntese: 5 Pilares de Inspiração**

Extraídos da análise de todos os produtos inspiradores:

**1. 🎯 Simplicidade Radical** *(Canva, Loom)*
- Ação primária sempre em 1-2 cliques
- Zero curva de aprendizado para uso básico
- Drag-and-drop para upload

**2. 🔍 Transparência Total** *(ChatGPT, Grammarly)*
- IA sempre explica decisões com evidências
- Progresso visível em tempo real
- Score de confiança nunca escondido

**3. ⚡ Velocidade Percebida** *(Linear, Notion)*
- Carregamento instantâneo (skeleton screens)
- Busca global (Cmd+K) para navegação rápida
- Respostas em <200ms

**4. 🔒 Privacidade Proativa** *(Signal, ProtonMail)*
- Comunicar segurança visualmente (badges 🔒)
- Onboarding explica privacidade primeiro (30s)
- Configurações acessíveis (não escondidas)

**5. 🏆 Progresso Visível** *(Khan Academy, Duolingo, Strava)*
- Métricas significativas (economia de tempo, não badges vazios)
- Celebrações sutis mas presentes
- Evolução ao longo do tempo (gráfico de linha)

---

## Design System Foundation

### Design System Choice

**Escolha:** **Tailwind CSS + shadcn/ui**

**Categoria:** Sistema Customizável (Themeable System)

O Ressoa AI utilizará **Tailwind CSS** como framework de utilidades CSS combinado com **shadcn/ui** para componentes acessíveis e customizáveis. Esta abordagem oferece o equilíbrio ideal entre velocidade de desenvolvimento e controle total sobre identidade visual.

**Por quê Tailwind CSS:**
- Utility-first: Classes como `bg-deep-navy`, `text-tech-blue` permitem customização pixel-perfect
- Design tokens nativos: Define paleta e tipografia no `tailwind.config.js`, usa consistentemente em toda aplicação
- Responsivo por padrão: Classes `md:`, `lg:` facilitam design mobile-first
- Performance otimizada: CSS final contém apenas classes usadas (PurgeCSS automático)
- Adoção tech moderna: Usado por Vercel, GitHub, Shopify, Laravel

**Por quê shadcn/ui:**
- Componentes copiáveis: Código fica no projeto (controle total), não biblioteca NPM black-box
- Acessibilidade AAA: Built com Radix UI (ARIA, keyboard nav, screen reader por padrão)
- Headless: Estilo 100% customizável sem lutar contra opiniões do framework
- Componentes essenciais: Button, Card, Dialog, Dropdown, Toast, Command (Cmd+K), Progress
- Usado por startups tech modernas: Cal.com, Supabase, Vercel (alinha com inspirações: Canva, Loom, Notion)

**Alternativa Considerada: Chakra UI**
- Prós: Syntax mais simples, temas prontos
- Contras: Menos flexibilidade visual, bundle maior
- Decisão: Tailwind + shadcn/ui oferece controle superior mantendo velocidade

### Rationale for Selection

**1. Identidade Visual Única Já Definida**

O Ressoa AI possui paleta de cores customizada (Deep Navy, Tech Blue, Cyan AI, Focus Orange, Ghost White) e tipografia específica (Montserrat + Inter). Sistemas rígidos como Material Design ou Ant Design **lutariam contra** essas escolhas, exigindo overrides constantes. Tailwind permite definir cores como design tokens e usar nativamente.

**2. Velocidade de Desenvolvimento (Startup/MVP)**

shadcn/ui fornece 40+ componentes prontos (Button, Card, Dialog, Toast, etc.) com acessibilidade built-in, eliminando semanas de trabalho repetitivo. Componentes são copiados para o projeto (não NPM dependency), permitindo customização sem limitações.

Comparação de tempo:
- Custom Design System: 4-8 semanas para componentes básicos
- Material/Ant Design: 1-2 semanas mas visual genérico
- **Tailwind + shadcn/ui: 1-2 semanas com identidade única** ✅

**3. Acessibilidade AAA Sem Esforço**

shadcn/ui é built sobre Radix UI, que implementa WCAG 2.1 AAA:
- ARIA labels, roles, states automáticos
- Keyboard navigation (Tab, Enter, Esc) out-of-the-box
- Focus states visíveis por padrão
- Screen reader support completo

**4. Responsividade Mobile-First**

Tailwind é mobile-first por padrão. Classes como `md:text-lg`, `lg:grid-cols-3` tornam responsividade explícita e previsível. Isso alinha com requisito crítico: "Precisa ser responsivo, funcionar bem em mobile".

**5. Performance Otimizada**

Tailwind usa PurgeCSS para incluir apenas classes usadas no CSS final:
- CSS bundle típico: ~10-20 KB (gzipped)
- Componentes shadcn/ui: Tree-shakeable
- Comparação: Material UI bundle completo ~300 KB

**6. Alinhamento com Inspirações**

Produtos inspiradores (Linear, Cal.com, Supabase) usam Tailwind + shadcn/ui. Não usam Material Design genérico.

**7. Comunidade e Manutenção**

- Tailwind: 70k+ stars GitHub, 10M+ downloads/semana NPM
- shadcn/ui: 50k+ stars GitHub, adotado por +100 startups tech
- Radix UI: Mantido por Modulz, usado por GitHub, Stripe

### Implementation Approach

#### **Fase 1: Setup Inicial (Dia 1-2)**

**Instalar e configurar Tailwind CSS com design tokens da paleta Ressoa:**

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-navy': '#0A2647',
        'tech-blue': '#2563EB',
        'cyan-ai': '#06B6D4',
        'focus-orange': '#F97316',
        'ghost-white': '#F8FAFC',
      },
      fontFamily: {
        'heading': ['Montserrat', 'Outfit', 'sans-serif'],
        'body': ['Inter', 'Open Sans', 'sans-serif'],
      },
      fontSize: {
        'hero': '48px',
        'section': '32px',
        'subsection': '24px',
        'body-large': '18px',
        'body': '16px',
        'caption': '14px',
      },
      borderRadius: {
        'card': '8px',
        'button': '6px',
      },
    },
  },
}
```

#### **Fase 2: Componentes Base (Dia 3-5)**

**Instalar componentes shadcn/ui essenciais:**

```bash
npx shadcn-ui@latest add button card input dialog toast badge progress tooltip dropdown-menu command skeleton breadcrumb tabs
```

**Customizar variantes:**

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "rounded-button font-medium transition-colors duration-200",
  {
    variants: {
      variant: {
        primary: "bg-focus-orange text-white hover:bg-[#E06414]",
        secondary: "bg-tech-blue text-white hover:bg-[#1E4FD8]",
        ghost: "border border-tech-blue text-tech-blue hover:bg-tech-blue/10",
      },
      size: {
        default: "px-6 py-3 text-base",
        sm: "px-4 py-2 text-sm",
        lg: "px-8 py-4 text-lg",
        icon: "h-11 w-11",
      },
    },
  }
)
```

#### **Fase 3: Componentes Custom (Dia 6-10)**

Criar componentes específicos do Ressoa:

1. **UploadZone:** Drag-and-drop com animação de ondas
2. **AnalysisPipeline:** Pipeline visual de análise
3. **PedagogicalReportCard:** Card de relatório com evidências
4. **CurriculumHeatmap:** Heatmap de cobertura BNCC
5. **PrivacyBadge:** Badge "🔒 Privado até aprovar"

#### **Fase 4: Padrões Responsivos (Dia 11-12)**

**Estabelecer padrões mobile-first:**

```jsx
// Tipografia escalável
<h1 className="text-2xl md:text-3xl lg:text-hero font-heading">

// Layout responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Touch targets mobile (mínimo 44px)
<Button size="icon" className="min-h-[44px] min-w-[44px]">
```

#### **Fase 5: Testes de Acessibilidade (Dia 13-14)**

**Checklist WCAG 2.1 AAA:**
- ✅ Contraste de cores: 14.8:1 (AAA)
- ✅ Touch targets: 44x44px mínimo
- ✅ Keyboard navigation: Radix UI garante
- ✅ Focus states: Borda visível
- ✅ Screen reader: Testar com NVDA/VoiceOver

#### **Fase 6: Documentação (Contínua)**

**Setup Storybook para componentes:**
- Documentar variantes e estados
- Casos de uso e guidelines
- Padrões de acessibilidade

### Customization Strategy

#### **Princípio: "Copy, Customize, Compose"**

shadcn/ui não é biblioteca NPM. É repositório de componentes que você **copia** para seu projeto, permitindo:
- ✅ Controle total do código
- ✅ Sem breaking changes
- ✅ Composição livre

#### **1. Customização de Cores**

```javascript
// Semantic aliases
colors: {
  'primary': '#2563EB',      // Tech Blue
  'secondary': '#0A2647',    // Deep Navy
  'accent': '#06B6D4',       // Cyan AI
  'cta': '#F97316',          // Focus Orange
  'background': '#F8FAFC',   // Ghost White
  'success': '#10B981',
  'warning': '#F97316',
  'error': '#EF4444',
  'info': '#06B6D4',
}
```

#### **2. Customização de Tipografia**

```javascript
fontFamily: {
  'heading': ['Montserrat', 'Outfit', 'sans-serif'],
  'body': ['Inter', 'Open Sans', 'sans-serif'],
}
```

Uso: `font-heading` para títulos, `font-body` para texto corrido.

#### **3. Espaçamento Consistente**

Escala de múltiplos de 4px:
- `p-4` = 16px (padding interno padrão)
- `p-6` = 24px (padding de cards)
- `gap-4` = 16px (espaçamento entre elementos)

#### **4. Border Radius**

```javascript
borderRadius: {
  'card': '8px',
  'button': '6px',
  'input': '6px',
  'dialog': '12px',
}
```

#### **5. Sombras Sutis**

```javascript
boxShadow: {
  'card': '0 1px 3px rgba(0,0,0,0.1)',
  'card-hover': '0 4px 6px rgba(0,0,0,0.1)',
  'dialog': '0 20px 25px rgba(0,0,0,0.15)',
}
```

#### **6. Animações Suaves**

```javascript
transitionDuration: {
  DEFAULT: '200ms',
  'fast': '100ms',
  'slow': '300ms',
}
```

#### **7. Ícones: Lucide Icons**

```jsx
import { Upload, Check, Lock } from 'lucide-react'

<Button>
  <Upload className="mr-2 h-4 w-4" />
  Fazer Upload
</Button>
```

#### **8. Gráficos: Recharts**

```jsx
<ResponsiveContainer width="100%" height={400}>
  <BarChart data={coberturaBimestral}>
    <Bar dataKey="cobertura" fill="#2563EB" />
  </BarChart>
</ResponsiveContainer>
```

#### **9. Dark Mode (Futuro)**

```javascript
darkMode: 'class',

// Uso
<div className="bg-ghost-white dark:bg-deep-navy">
```

#### **10. Componentes Terceiros**

**Usar apenas quando necessário:**
- ✅ React Dropzone (upload drag-and-drop)
- ✅ Recharts (gráficos)
- ✅ date-fns (datas)
- ⚠️ Framer Motion (animações complexas, opcional)

**Evitar:**
- ❌ Lodash (usar JS nativo)
- ❌ Moment.js (usar date-fns)
- ❌ Material UI / Ant Design (conflitam com stack)

---

**Filosofia:** "Usar blocos prontos, customizar estética, compor experiências únicas."

---

## Defining Core Experience

### The Defining Experience

**Interação Central:**

> **"Arraste o áudio da sua aula → Receba análise pedagógica automática em 15 minutos"**

Esta é a experiência que define o Ressoa AI - a interação que, se acertarmos perfeitamente, faz tudo o resto seguir.

**Como usuário descreve ao amigo:**
> "Você grava a aula normal, joga o arquivo no Ressoa, e em 15 minutos sai um relatório pedagógico completo! Ele identifica as habilidades BNCC que você cobriu, sugere exercícios contextualizados, e ainda dá insights de qualidade. Economiza HORAS de trabalho manual!"

**Por quê essa é a interação definitiva:**
- É o momento "aha!" do produto
- Resume a proposta de valor (IA pedagógica automática)
- É mensurável (upload → 15min → relatório)
- É o diferencial vs. competidores (não é só transcrição, é análise pedagógica profunda)
- É o que professores dirão: "Me economizou 3h de relatório manual!"

**Comparação com produtos famosos:**
- Tinder: "Deslize para dar match" → **Ressoa: "Arraste áudio → Receba análise pedagógica"**
- Spotify: "Qualquer música, instantaneamente" → **Ressoa: "Qualquer aula, análise automática"**
- Instagram: "Transforme momentos com filtros" → **Ressoa: "Transforme aulas em insights pedagógicos"**

### User Mental Model

**Como professores resolvem isso hoje:**

**Método Manual (Atual):**
1. Professor dá aula → Tenta lembrar o que ensinou
2. Abre planilha/Word → Escreve relatório à mão
3. Consulta BNCC para identificar habilidades (complexo, 369 habilidades)
4. Cria exercícios do zero
5. **Tempo: 2-3h por semana | Sentimento: "Burocracia rouba tempo dos alunos"**

**Workarounds Atuais:**
- Gravam aula no celular (memória pessoal)
- Usam Read.ai/Zoom para transcrever (mas não analisam pedagogicamente)
- Copiam relatórios de bimestres anteriores (genéricos)
- Pulam a documentação (risco de auditoria)

**Expectativa ao usar Ressoa AI:**

- **Mental model:** "Assistente pedagógico" (não "sistema de vigilância")
- **Espera:** "Sistema me ajuda a documentar O QUE EU JÁ FIZ" (não dita o que fazer)
- **Espera:** Upload simples como Dropbox/Google Drive (drag-and-drop, confiável)
- **Espera:** Relatório que **realmente entende pedagogia** (não genérico)
- **Espera:** **Economizar tempo**, não adicionar trabalho

**Onde podem se confundir/frustrar:**

- ❌ Upload falhar (conexão instável em escolas)
- ❌ Relatório genérico ("Aula adequada, continue assim" - inútil)
- ❌ Não entender por que IA classificou habilidade X (caixa preta)
- ❌ Sentir vigiado (dados vazam antes de aprovar)

**O que torna solução mágica:**

- ✨ Upload nunca falha (resumível, feedback visual)
- ✨ Relatório mostra evidências ("Identifiquei EF06MA01 porque você mencionou...")
- ✨ Economiza tempo tangível ("Você economizou 2h30 esta semana")
- ✨ Privacidade total até aprovação ("🔒 Privado até você aprovar")

### Success Criteria

**Critérios de sucesso da experiência central:**

#### **1. Upload Confiável (Zero Ansiedade)**
- ✅ Drag-and-drop funciona sempre
- ✅ Progresso visual: "Enviando 2,3 MB/s → 45% → ~3min restantes"
- ✅ Upload resumível (se cair conexão, retoma)
- ✅ Validação instantânea: "Formato MP3 aceito" ANTES de enviar
- **Métrica:** Taxa de uploads bem-sucedidos >95%

#### **2. Análise Rápida (Sem Espera Frustrante)**
- ✅ Estimativa precisa: "~15min para áudio de 50min"
- ✅ Pipeline visual: "Transcrevendo 45% → Analisando cobertura..."
- ✅ Notificação quando concluir
- ✅ Pode navegar enquanto processa
- **Métrica:** 90% análises completam em <20min

#### **3. Relatório de Qualidade (90%+ Usável)**
- ✅ Habilidades BNCC identificadas corretamente
- ✅ Evidências clicáveis (trecho da transcrição)
- ✅ Sugestões de exercícios pedagogicamente adequadas
- ✅ Score de confiança visível (92%)
- **Métrica:** >70% professores aprovam sem edições significativas

#### **4. Aprovação Rápida (Sem Fricção)**
- ✅ Botão "Aprovar" sempre acessível (sticky header)
- ✅ Um clique para aprovar
- ✅ Edição inline possível
- ✅ Feedback imediato: "🎉 Relatório aprovado! Menos 40min de trabalho manual"
- **Métrica:** Tempo médio de revisão <5min

#### **5. Privacidade Clara (Controle Total)**
- ✅ Badge "🔒 Privado até você aprovar" sempre visível
- ✅ Coordenação vê apenas métricas agregadas
- ✅ Configurações de privacidade acessíveis
- ✅ Onboarding explica privacidade nos primeiros 30s
- **Métrica:** >90% professores sentem controle sobre dados

**Quando usuário se sente inteligente/realizado:**
- ✨ Primeira vez que vê relatório: "Caramba, isso é BOM!"
- ✨ Aprova 5 relatórios em <15min (vs. 3h manual)
- ✨ Vê métrica: "Economizou 2h30 esta semana"
- ✨ Coordenadora elogia cobertura (dados do Ressoa)

### Novel UX Patterns

**Análise: Padrões Estabelecidos + IA Transparente (Novo)**

#### **Padrões Estabelecidos (Usar Diretamente):**

1. **Upload de Arquivo: Dropbox-style**
   - Drag-and-drop (Google Drive, WeTransfer)
   - Progresso visual (MB/s, %, tempo restante)
   - Upload resumível
   - **Decisão:** Não reinventar. Usar padrão comprovado.

2. **Aprovação: Workflow familiar**
   - Rascunho → Revisar → Aprovar (Google Docs)
   - Edição inline (Grammarly, Notion)
   - **Decisão:** Aproveitar modelo mental existente.

3. **Dashboard: Cards acionáveis**
   - Cards com ação (Linear, Notion, Trello)
   - Filtros (Airtable, Excel)
   - **Decisão:** Padrão estabelecido.

#### **Padrões Relativamente Novos (Educação Sutil):**

1. **Transparência da IA: ChatGPT/Grammarly-style**
   - ⚠️ Explicar decisões da IA com evidências
   - ⚠️ Score de confiança visível
   - ⚠️ Sidebar com transcrição + highlights
   - **Decisão:** Padrão emergindo (ChatGPT popularizou), requer tooltips educativos.

**Como ensinar o padrão novo:**
- **Primeira vez:** Tooltip: "👋 Clique em qualquer habilidade para ver o trecho que justifica"
- **Onboarding:** Aula demo já mostra evidências clicáveis (aprender fazendo)
- **Metáfora familiar:** "Como Grammarly mostra por que sugeriu correção"

#### **Nosso Twist Único:**
- **Inovação:** Análise pedagógica profunda (não só transcrição)
- **Diferencial:** Evidências literais da transcrição (não paráfrase)
- **Moat:** 5 prompts especializados (Cobertura → Qualitativa → Relatório → Exercícios → Alertas)

**Não estamos inventando gestos novos** (tipo Tinder swipe). Estamos usando padrões conhecidos (upload, cards, aprovação) + aplicando IA transparente ao domínio educacional.

### Experience Mechanics

Mecânica detalhada da experiência central:

#### **1️⃣ INICIAÇÃO**

**Trigger:**
- Professor entra no sistema → Dashboard: "📤 Fazer Upload de Nova Aula"
- Menu lateral sempre tem "Nova Aula" acessível

**Convite visual:**
- Card com ícone + texto: "Arraste seu áudio aqui ou clique para selecionar"
- Animação de ondas (tema ressonância) no hover
- Texto de apoio: "Formatos: MP3, M4A, WAV | Até 2GB (90min)"

#### **2️⃣ INTERAÇÃO**

**Ação do usuário:**
- Arrasta arquivo MP3 → Solta na área de drop
- Ou: Clica → Dialog de seleção

**Validação imediata:**
- Formato inválido: Toast "❌ Formato MOV não suportado. Use MP3, M4A ou WAV."
- Formato válido: Preview do arquivo aparece

**Preview antes de enviar:**
- Ícone 🎵 + nome do arquivo
- Metadados: Tamanho (47.3 MB) | Duração (52 min)
- Form rápido: Turma [Dropdown] | Data | Disciplina
- Botões: [Cancelar] [📤 Iniciar Upload]

#### **3️⃣ FEEDBACK**

**Upload em progresso:**
- Barra de progresso: ████████████░░░░░░░░░░░ 45%
- Velocidade: 2.3 MB/s
- Tamanho: 21.3 MB de 47.3 MB
- Estimativa: ~3 minutos restantes
- Mensagem: "💡 Pode fechar esta janela, continuaremos em background"
- Ações: [Pausar] [Cancelar]

**Upload completo → Análise inicia:**

Pipeline visual detalhado:
1. ✅ Upload (47.3 MB) ────────────────
2. ✅ Transcrição (52 min) ────────────
3. ⏳ Análise de Cobertura BNCC... 30%
4. ⏳ Análise Qualitativa...       0%
5. ⏳ Geração de Relatório...      0%
6. ⏳ Sugestões de Exercícios...   0%

Estimativa: ⏱️ ~8 minutos restantes

**Notificação quando concluir:**
- Browser notification: "🎉 Seu relatório está pronto!"
- Toast: "Aula: Matemática 6º A - 15/02/2026 | 92% confiança"
- Botões: [Ver Relatório] [Depois]

#### **4️⃣ COMPLETAÇÃO**

**Usuário clica "Ver Relatório":**

**Tela de relatório:**
- Header: "🔒 Privado até você aprovar"
- Metadados: Aula, duração, confiança
- Ações: [👁️ Ver Transcrição] [✏️ Editar] [✅ Aprovar]

**Seções:**
1. **📊 Cobertura BNCC** (clicável)
   - ✅ EF06MA01 - Coberta (95%)
   - ✅ EF06MA03 - Coberta (92%)
   - ⚠️ EF06MA05 - Parcial (60%)

2. **🎯 Qualidade Pedagógica**
   - Metodologia: Resolução de Problemas
   - Adequação cognitiva: Alta
   - Engajamento: Médio-Alto

3. **📝 Sugestões de Exercícios** (5)
4. **🔔 Alertas Pedagógicos** (1)

**Usuário clica em "EF06MA01":**

Sidebar com evidência:
- Título: "EF06MA01: Comparar números naturais"
- Status: ✅ Coberta (95% confiança)
- Trecho da transcrição: `[03:45] "...vamos comparar os números naturais 127 e 98..."`
- Ações: [Ver transcrição completa] [Editar classificação]

**Usuário revisa (~2-3min) e clica "Aprovar":**

**Toast de sucesso:**
- "🎉 Relatório aprovado!"
- "Você economizou ~40 minutos de trabalho manual."
- "Coordenação agora pode ver métricas agregadas (sem transcrições)."
- Botões: [Ver Dashboard] [Nova Aula]

**Dashboard atualiza:**
- "📊 Você economizou 2h30 esta semana"
- "🔥 Semana produtiva! 7 aulas aprovadas (seu recorde)"

---

**Resumo da Mecânica:**

| Fase | Usuário Faz | Sistema Responde | Tempo |
|------|-------------|------------------|-------|
| **Iniciação** | Arrasta MP3 | Valida, mostra preview | Instantâneo |
| **Interação** | Clica "Upload" | Upload com progresso | 3-5min |
| **Feedback** | Aguarda | Pipeline visual detalhado | 10-15min |
| **Completação** | Aprova | Toast sucesso + métrica | 2-5min |

**Tempo total:** ~15-25min (maioria passiva)

**Momento mágico:** Ver relatório e perceber "Isso realmente entendeu minha aula!"

---

## Visual Design Foundation

### Color System

**Paleta definida (referência: Visual Identity & Design System):**
- Deep Navy (#0A2647) - Primária
- Tech Blue (#2563EB) - Secundária  
- Cyan AI (#06B6D4) - Detalhes
- Focus Orange (#F97316) - CTA
- Ghost White (#F8FAFC) - Fundo

**Regra 60-30-10:** 60% Ghost White, 30% Deep Navy, 10% Tech Blue + Orange

**Contraste:** Deep Navy/Ghost White 14.8:1 (AAA ✅)

### Typography System

**Headers:** Montserrat/Outfit | **Body:** Inter/Open Sans
**Escala:** H1(48px), H2(32px), H3(24px), Body(16px), Caption(14px)

### Spacing & Layout Foundation

**Base:** Múltiplos de 4px (4, 8, 16, 24, 32, 48)
**Breakpoints:** <640px (mobile), 640-1024px (tablet), >1024px (desktop)
**Grid:** 12 colunas, max-width 1280px

### Accessibility Considerations

- Contraste AAA, Touch 44px, Focus states, rem units, ARIA (Radix UI)

---

## User Journeys & Flow Design

### Critical User Journeys

**Referência:** Jornadas detalhadas documentadas em `prd.md`

**Jornada 1: Professor - Primeiro Upload**
1. Login → Dashboard vazio → CTA "Fazer Upload"
2. Drag-and-drop áudio → Preview → Preenche metadados (Turma, Data)
3. Upload com progresso → Aguarda análise (pipeline visual)
4. Notificação "Relatório pronto" → Revisa → Aprova
5. **Sucesso:** Vê métrica "Economizou 40min"

**Jornada 2: Professor - Uso Recorrente**
1. Login → Dashboard mostra 3 relatórios pendentes
2. Clica relatório → Revisa rapidamente → Aprova (sticky button)
3. Faz novo upload (ação rápida, sem fricção)
4. **Sucesso:** Aprova 5 aulas em <15min

**Jornada 3: Coordenadora - Análise Semanal**
1. Login → Dashboard série/escola
2. Filtra: "6º ano, Matemática, Semana 3"
3. Vê gaps curriculares (cards acionáveis)
4. Clica "Turma 7B: gap Equações" → Ver detalhes → Agenda reunião
5. **Sucesso:** Intervenção pedagógica baseada em dados

### Flow Optimization Patterns

**Minimização de Etapas:**
- Upload: 2 cliques (arrastar + iniciar)
- Aprovação: 1 clique (botão sempre visível)
- Busca: Cmd+K (global, instantânea)

**Feedback Contínuo:**
- Upload: Progresso em tempo real
- Análise: Pipeline visual detalhado
- Sucesso: Toast + métrica de economia

**Recuperação de Erros:**
- Upload interrompido: "Continuar de onde parou"
- Formato inválido: Validação antes de enviar
- Análise falha: "Usar transcrição parcial" ou "Tentar novamente"

---

## Component Strategy

**Componentes Base (shadcn/ui):** Button, Card, Input, Dialog, Toast, Badge, Progress, Tooltip, Dropdown, Command, Skeleton, Tabs

**Componentes Custom (Ressoa):**
- UploadZone: Drag-and-drop com animação ondas
- AnalysisPipeline: Pipeline visual de análise
- PedagogicalReportCard: Relatório com evidências clicáveis
- CurriculumHeatmap: Heatmap cobertura BNCC
- PrivacyBadge: Badge "🔒 Privado até aprovar"

---

## UX Patterns Library

**Upload Pattern:** Dropbox-style (drag-and-drop, resumível, progresso visual)
**Aprovação Pattern:** Google Docs-style (rascunho → revisar → aprovar)
**Dashboard Pattern:** Linear-style (cards acionáveis, busca Cmd+K)
**Transparência IA:** ChatGPT-style (evidências clicáveis, score confiança)
**Privacidade:** Signal-style (badge proativo, configurações acessíveis)

---

## Responsive & Accessibility

**Responsive:**
- Mobile-first: Stack, touch 44px, tipografia escalável
- Tablet: Grid 2 cols, densidade média
- Desktop: Grid 3 cols, densidade alta, atalhos teclado

**Accessibility:**
- WCAG AAA: Contraste 14.8:1, ARIA (Radix UI), keyboard nav
- Screen reader: Labels semânticos, live regions
- Focus states: Borda Tech Blue 2px, outline offset 2px

---

## Conclusão

**UX Design Specification completa para Ressoa AI.**

Documento abrange:
✅ Project Understanding (personas, challenges, opportunities)
✅ Core User Experience (plataforma, interações, momentos críticos)
✅ Emotional Response (objetivos, jornada, micro-emoções)
✅ UX Patterns & Inspiration (6 produtos, padrões transferíveis)
✅ Design System (Tailwind + shadcn/ui, customização)
✅ Visual Foundation (cores, tipografia, espaçamento)
✅ Defining Experience (interação central, mecânica detalhada)
✅ User Journeys (3 jornadas críticas, otimizações)
✅ Component Strategy (base + custom)
✅ UX Patterns Library
✅ Responsive & Accessibility

**Próximo passo:** Architecture → Epics & Stories → Implementation

---
