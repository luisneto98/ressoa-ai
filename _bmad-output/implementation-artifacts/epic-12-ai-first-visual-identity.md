# Epic 12: AI-First Visual Identity Transformation

**Status:** Backlog
**Created:** 2026-02-14
**Estimated Effort:** 6 stories, ~2 sprints (~34 pontos)
**Priority:** HIGH (impacto direto em conversão de vendas e percepção de valor)

---

## 🎯 Goal

Transformar a interface visual do Ressoa AI de "backoffice genérico" para **"AI-first, premium, trustworthy"** para aumentar conversão de vendas em demos com donos de escola e criar percepção de valor tecnológico desde o primeiro contato.

---

## 👥 User Outcome

- **Dono de Escola (decisor de compra)** vê interface moderna e premium em demos que reflete a sofisticação tecnológica da IA, justificando investimento
- **Professor** experimenta interface agradável e confiável durante upload/processamento de áudio
- **Coordenador** navega dashboards modernos e visualmente organizados que evidenciam profissionalismo do produto
- **Time de Vendas** apresenta produto com diferenciação visual clara vs concorrentes backoffice genéricos

---

## 📋 FRs Covered

- **Novo:** FR51: Interface deve evidenciar uso de IA através de design moderno e elementos visuais distintivos
- **Novo:** FR52: Estados de processamento de IA devem ter feedback visual claro e profissional
- **Novo:** FR53: Relatórios e dashboards devem usar data visualization rica (charts interativos, não apenas tabelas)
- **Aprimoramento de:** FR23 (relatório automático), FR6 (upload), FR29 (cobertura pessoal), FR31-33 (dashboards coordenador)

---

## 🚀 Key Deliverables

### Design System Foundation
- [ ] Estender Tailwind config com animações e keyframes customizados
- [ ] Criar componentes base reutilizáveis: `<AIBadge>`, `<GradientCard>`, `<ProcessingStatus>`, `<SkeletonLoader>`
- [ ] Configurar recharts com theme Ressoa AI (paleta Deep Navy, Tech Blue, Cyan AI)
- [ ] Documentar design tokens e usage guidelines
- [ ] Implementar fallbacks `prefers-reduced-motion` para acessibilidade

### Frontend - Tier 1 (Critical Wow)
- [ ] **Relatório de Aula Premium:** Header com gradient animado, cards de habilidades BNCC com badges Cyan AI, gráfico de cobertura interativo, export PDF branded
- [ ] **Upload de Aula Visual Confiável:** Dropzone com animação pulse, progress bar com gradient, estados visuais claros (Enviando → Transcrevendo → Analisando → Pronto), error states empáticos

### Frontend - Tier 2 (High Impact)
- [ ] **Dashboard de Aulas Moderno:** Cards com design moderno (não tabela genérica), status badges coloridos, filtros com UI limpa, skeleton loaders
- [ ] **Visualização de Planos Pedagógicos:** Timeline visual da sequência de aulas, badges de habilidades BNCC integrados

### Frontend - Tier 3 (Polish)
- [ ] **Forms de Cadastro Premium:** shadcn/ui form components customizados, validation states visuais claros, design consistente

---

## 🔧 Technical Notes

### Arquitetura: Design System Enhancement

**Conceito Central:**
- Criar layer de componentes customizados sobre shadcn/ui base
- Manter paleta e fontes existentes (Deep Navy, Tech Blue, Cyan AI, Focus Orange / Montserrat + Inter)
- Animações via CSS (não JS) para performance 60fps
- Componentes reutilizáveis para consistência

**Tailwind Config Extension:**
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
        },
      },
    },
  },
}
```

**Novos Componentes Base:**

1. **`<AIBadge variant="skill|processing|status">`**
   - Badge com Cyan AI color + micro-animação sutil
   - Variantes: habilidade BNCC, status de processamento, indicador de IA

2. **`<GradientCard>`**
   - Card com header gradient animado (Deep Navy → Tech Blue)
   - Uso: Relatórios, highlights de dashboard

3. **`<ProcessingStatus step={1|2|3|4} steps={[...]}`**
   - Stepper visual de processamento IA com estados claros
   - Estados: Enviando → Transcrevendo → Analisando → Pronto

4. **`<SkeletonLoader variant="card|table|chart">`**
   - Skeleton loaders branded com paleta Ressoa
   - Replace spinners genéricos

**Recharts Configuration:**
```typescript
// lib/chart-theme.ts
export const ressoaChartTheme = {
  colors: ['#2563EB', '#06B6D4', '#F97316', '#0A2647'],
  grid: { stroke: '#E5E7EB', strokeDasharray: '3 3' },
  tooltip: { /* branded tooltip style */ },
}
```

### Visual AI-First Patterns Implementados

1. **Movimento e Animação Intencional**
   - Gradientes animados sutis em headers de cards importantes
   - Micro-interações em hover states
   - Transitions suaves (200-300ms) entre estados

2. **Transparência de Processo**
   - ProcessingStatus mostra etapas da análise de IA
   - Progress indicators com gradients animados
   - Loading states informativos (não apenas spinner)

3. **Data Visualization Rica**
   - Gráficos interativos de cobertura (recharts)
   - Heatmaps de progresso curricular
   - Preferir visualizações sobre tabelas quando possível

4. **Glassmorphism Sutil**
   - Blur effects com `backdrop-filter` em modais/overlays
   - Fallback para navegadores sem suporte (solid background)

5. **Accent Colors Estratégicos**
   - Cyan AI (#06B6D4) exclusivo para elementos de IA
   - Tech Blue (#2563EB) para ações primárias
   - Focus Orange (#F97316) para alertas/destaques

### Páginas Críticas (Demo Flow)

Ordem de prioridade baseada em impacto em demo de vendas:

**🥇 Tier 1 - Critical Wow:**
1. **Relatório de Aula** (`/aulas/:id/analise` tab Relatório)
   - Momento "mágico" da demo - OUTPUT da IA
   - Impacto visual máximo

2. **Upload de Aula** (`/aulas/nova` ou `/aulas/:id/editar` tab Upload)
   - Primeiro contato - define expectativa
   - Confiabilidade visual crítica

**🥈 Tier 2 - High Impact:**
3. **Dashboard de Aulas** (`/aulas`)
   - Lista de aulas registradas
   - Organização visual profissional

4. **Planos de Aula** (`/planos`)
   - Visualização de planejamento pedagógico
   - Timeline e badges de habilidades

**🥉 Tier 3 - Polish:**
5. **Cadastros de Planos** (`/planos/novo` ou `/planos/:id/editar`)
   - Forms modernos e consistentes

### Performance Budget

- **Animações:** <100ms overhead total
- **Recharts bundle:** ~17kb gzipped (aceitável)
- **Custom CSS:** <5kb adicional
- **Lighthouse Performance:** Manter >90 score

### Acessibilidade

- Todos os componentes respeitam `prefers-reduced-motion`
- Contraste WCAG AAA mantido (14.8:1 mínimo)
- Radix UI (base do shadcn/ui) já garante ARIA
- Touch targets 44px mínimo (já implementado)

---

## 📊 NFRs Addressed

- **NFR-USAB-01:** Interface intuitiva sem treinamento (design moderno aumenta clareza visual)
- **NFR-USAB-02:** Feedback visual claro em <200ms (ProcessingStatus, skeleton loaders)
- **NFR-ACCESS-01:** WCAG AAA contrast ratio mantido (14.8:1)
- **NFR-ACCESS-02:** Suporte teclado e screen readers (Radix UI garantido)
- **NFR-PERF-04:** Dashboard <2s (skeleton loaders melhoram percepção de performance)
- **Novo NFR-BRAND-01:** Interface deve refletir posicionamento premium e tecnológico do produto

---

## 🔗 Dependencies

- ✅ **shadcn/ui components:** Já instalado (base para customização)
- ✅ **Tailwind CSS:** Já configurado (estender config)
- ✅ **React Query:** Já implementado (loading states para skeleton loaders)
- ⚠️ **recharts:** Confirmar se instalado (data visualization)
- ✅ **Design tokens:** Paleta e fontes já definidas em UX Design Specification

---

## ⚠️ Risk Mitigation

### Risco 1: Animações excessivas degradam performance ou causam náusea
- **Probabilidade:** Média
- **Impacto:** Alto (UX negativa)
- **Mitigação:**
  - Animações sutis (3s gradient, não <1s frenético)
  - CSS-based (60fps garantido)
  - `prefers-reduced-motion` obrigatório em TODOS os componentes animados
  - Teste com usuários reais em diferentes dispositivos
  - Performance budget: <100ms overhead

### Risco 2: Glassmorphism/blur effects não suportados em navegadores antigos
- **Probabilidade:** Baixa
- **Impacto:** Médio (visual degrada)
- **Mitigação:**
  - Feature detection: `@supports (backdrop-filter: blur(10px))`
  - Fallback para solid background com opacity reduzida
  - Teste em Safari, Firefox, Chrome (últimas 2 versões)

### Risco 3: Redesign quebra usabilidade existente
- **Probabilidade:** Baixa
- **Impacto:** Crítico
- **Mitigação:**
  - Manter estrutura de informação idêntica (apenas visual muda)
  - Testes E2E de regressão antes de release
  - Deploy gradual: feature flag por escola (A/B test)
  - Feedback loop com 3-5 escolas piloto

### Risco 4: "AI-first" vira "kitsch exagerado"
- **Probabilidade:** Média
- **Impacto:** Alto (percepção negativa de marca)
- **Mitigação:**
  - Seguir princípio "Less is More" - sofisticação, não fogos de artifício
  - Review com UX Designer (Sally) em cada story
  - Validar com donos de escola em 2-3 demos antes de rollout completo
  - Manter paleta restrita (não adicionar cores além das definidas)

### Risco 5: Aumento de bundle size impacta performance
- **Probabilidade:** Baixa
- **Impacto:** Médio
- **Mitigação:**
  - Recharts tree-shakeable (importar apenas componentes usados)
  - Custom CSS <5kb adicional
  - Code splitting por rota (já implementado no Vite)
  - Lighthouse CI no pipeline (alerta se performance <90)

---

## 📈 Success Metrics

### Quantitativas
- **Conversão em demos:** +15% de conversão (medir após 10 demos)
- **NPS primeira impressão:** >7/10 (pergunta: "Quão provável você recomendaria baseado na primeira impressão?")
- **Lighthouse Performance Score:** Manter >90
- **Time to Interactive:** Manter <3s em 3G

### Qualitativas
- **Feedback de vendas:** Redução de objeções sobre "visual genérico" em >80% das calls
- **Comparação competitiva:** Donos de escola mencionam "design moderno" como diferencial vs concorrentes
- **Percepção de valor:** Willingness to pay não reduz mesmo em escolas menores (design não intimida)

### Coleta de Dados
- Survey pós-demo (5 perguntas, <2min)
- Sales call notes análise (tag "objeção visual")
- Hotjar/analytics em páginas Tier 1 (heatmaps, session recordings)

---

## 📝 Stories

### Story 0: Design System Enhancement Setup
**Prioridade:** MUST HAVE (foundation para todas as outras stories)
**Estimativa:** 5 pontos
**Owner:** Dev + UX Designer review

**User Story:**
```
Como desenvolvedor implementando visual improvements,
Eu preciso de componentes e utilities reutilizáveis,
Para manter consistência e velocidade de implementação.
```

**Acceptance Criteria:**
- [ ] Tailwind config estendido com animations e keyframes customizados
- [ ] Componente `<AIBadge>` criado com 3 variantes (skill, processing, status)
- [ ] Componente `<GradientCard>` criado com header animado
- [ ] Componente `<ProcessingStatus>` criado com stepper de 4 etapas
- [ ] Componente `<SkeletonLoader>` criado com 3 variantes (card, table, chart)
- [ ] Recharts instalado e configurado com `ressoaChartTheme`
- [ ] Documentação criada em `/docs/design-system-enhancements.md`
- [ ] Todos os componentes respeitam `prefers-reduced-motion`
- [ ] Storybook stories criadas para cada componente (se Storybook instalado)
- [ ] Testes unitários de renderização criados

**Technical Notes:**
- Criar arquivo `/src/components/ui/ai-badge.tsx`
- Criar arquivo `/src/components/ui/gradient-card.tsx`
- Criar arquivo `/src/components/ui/processing-status.tsx`
- Criar arquivo `/src/components/ui/skeleton-loader.tsx`
- Criar arquivo `/src/lib/chart-theme.ts`
- Estender `tailwind.config.js` com animations

---

### Story 1.1: Relatório de Aula Premium
**Prioridade:** MUST HAVE (Tier 1 - Critical Wow)
**Estimativa:** 8 pontos
**Owner:** Dev + UX Designer review
**Depends on:** Story 0

**User Story:**
```
Como dono de escola visualizando relatório de análise de aula em demo,
Eu quero ver design premium e moderno que evidencie o uso de IA,
Para confiar na sofisticação tecnológica do produto e justificar investimento.
```

**Acceptance Criteria:**
- [ ] Header do relatório usa `<GradientCard>` com animação sutil (Deep Navy → Tech Blue)
- [ ] Habilidades BNCC renderizadas como `<AIBadge variant="skill">` com micro-animação
- [ ] Gráfico de cobertura implementado com recharts (bar/pie chart interativo)
- [ ] Section "Gerado por IA Ressoa" com ícone + `<AIBadge variant="processing">`
- [ ] Export PDF mantém branding premium (logo, cores, tipografia)
- [ ] Performance: <100ms overhead de animações (medir com DevTools)
- [ ] Acessibilidade: `prefers-reduced-motion` desabilita animações
- [ ] Responsive: layout funciona em tablet/mobile
- [ ] Loading state usa `<SkeletonLoader variant="card">`

**Technical Notes:**
- Refatorar `/src/pages/aulas/AulaAnalisePage.tsx` tab Relatório
- Refatorar componente `/src/pages/aulas/components/RelatorioTab.tsx`
- Adicionar recharts `<BarChart>` ou `<RadarChart>` para visualização de cobertura
- PDF export: verificar se react-pdf ou similar suporta CSS customizado

**Design References:**
- Linear.app (cards com gradient header)
- ChatGPT (ícone + badge "Generated by AI")
- Notion (data visualization limpa)

---

### Story 1.2: Upload de Aula com Visual Confiável
**Prioridade:** MUST HAVE (Tier 1 - Critical Wow)
**Estimativa:** 8 pontos
**Owner:** Dev + UX Designer review
**Depends on:** Story 0

**User Story:**
```
Como professor fazendo upload de áudio pela primeira vez,
Eu quero ver estados visuais claros e modernos durante processamento,
Para confiar que a IA está trabalhando e meu arquivo está seguro.
```

**Acceptance Criteria:**
- [ ] Dropzone tem animação `pulse-subtle` ao hover/drag
- [ ] Progress bar usa gradient animado (Tech Blue → Cyan AI) durante upload
- [ ] `<ProcessingStatus>` mostra etapas: "Enviando..." → "Transcrevendo..." → "Analisando..." → "Pronto!"
- [ ] Preview de áudio com waveform visual (se viável - usar wavesurfer.js ou similar)
- [ ] Error states usam design empático (ícone + mensagem clara + ação sugerida, não `alert()` vermelho)
- [ ] Loading states usam `<SkeletonLoader>` em vez de spinner genérico
- [ ] Performance: upload TUS mantido (resumível)
- [ ] Responsive: funciona em mobile

**Technical Notes:**
- Refatorar `/src/pages/aulas/components/UploadAudioTab.tsx`
- Integrar `<ProcessingStatus>` com estados do React Query
- Avaliar `wavesurfer.js` para waveform (bundle size: ~50kb, aceitável se lazy loaded)
- Error handling: customizar toast/notification com Tailwind

**Design References:**
- Loom (upload confiável com estados claros)
- Dropbox (dropzone animado)
- Descript (waveform visual)

---

### Story 2.1: Dashboard de Aulas Moderno
**Prioridade:** SHOULD HAVE (Tier 2 - High Impact)
**Estimativa:** 5 pontos
**Owner:** Dev
**Depends on:** Story 0

**User Story:**
```
Como coordenador explorando aulas registradas,
Eu quero ver lista moderna e visualmente organizada,
Para perceber profissionalismo e qualidade do produto.
```

**Acceptance Criteria:**
- [ ] Aulas renderizadas como cards (não tabela genérica) com `<GradientCard>` para highlights
- [ ] Status badges usam `<AIBadge variant="status">` com cores semânticas (verde=aprovado, amarelo=pendente, etc)
- [ ] Filtros têm UI limpa com shadcn/ui `<Select>` customizado
- [ ] Loading state usa `<SkeletonLoader variant="card">` (grid de 3-4 cards)
- [ ] Hover states sofisticados (scale 1.02, shadow transition)
- [ ] Empty state tem design branded (não texto genérico)
- [ ] Responsive: grid adapta 1/2/3 colunas

**Technical Notes:**
- Refatorar página `/src/pages/aulas/AulasPage.tsx` (ou similar)
- Grid: usar `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Transições: `transition-all duration-200`

---

### Story 2.2: Visualização de Planos Pedagógicos
**Prioridade:** SHOULD HAVE (Tier 2 - High Impact)
**Estimativa:** 5 pontos
**Owner:** Dev
**Depends on:** Story 0

**User Story:**
```
Como coordenador revisando planejamento pedagógico,
Eu quero ver timeline visual da sequência de aulas,
Para entender sequência didática rapidamente.
```

**Acceptance Criteria:**
- [ ] Timeline visual mostra sequência de aulas (componente custom ou shadcn/ui timeline)
- [ ] Habilidades BNCC vinculadas renderizadas como `<AIBadge variant="skill">`
- [ ] Design usa hierarquia clara (títulos Montserrat, corpo Inter)
- [ ] Loading state usa `<SkeletonLoader variant="table">`
- [ ] Responsive: timeline colapsa verticalmente em mobile

**Technical Notes:**
- Refatorar página `/src/pages/planos/PlanosPage.tsx` (ou similar)
- Timeline: criar componente custom ou usar lib leve (react-chrono?)

---

### Story 3.1: Forms de Cadastro Premium
**Prioridade:** COULD HAVE (Tier 3 - Polish)
**Estimativa:** 3 pontos
**Owner:** Dev
**Depends on:** Story 0

**User Story:**
```
Como usuário criando planos/aulas,
Eu quero forms modernos e agradáveis de usar,
Para ter experiência consistente com resto da plataforma.
```

**Acceptance Criteria:**
- [ ] Forms usam shadcn/ui components customizados (Input, Textarea, Select)
- [ ] Validation states têm feedback visual claro (ícone + cor + mensagem)
- [ ] Design consistente com Tier 1/2 (paleta, espaçamento, tipografia)
- [ ] Loading state em botões (spinner + texto "Salvando...")
- [ ] Responsive: labels acima de inputs em mobile

**Technical Notes:**
- Refatorar `/src/pages/aulas/components/AulaFormFields.tsx`
- Refatorar `/src/pages/turmas/components/TurmaFormDialog.tsx`
- Usar React Hook Form + zod (já implementado)

---

## 🎬 Implementation Order

**Sprint 1:**
1. Story 0: Design System Enhancement Setup (5 pts) → **Foundation**
2. Story 1.1: Relatório de Aula Premium (8 pts) → **Quick Win #1**
3. Story 1.2: Upload de Aula Visual Confiável (8 pts) → **Quick Win #2**
   **Total Sprint 1:** 21 pontos

**Sprint 2:**
4. Story 2.1: Dashboard de Aulas Moderno (5 pts)
5. Story 2.2: Visualização de Planos Pedagógicos (5 pts)
6. Story 3.1: Forms de Cadastro Premium (3 pts)
   **Total Sprint 2:** 13 pontos

**Total Epic:** 34 pontos (~2 sprints)

---

## 🧪 Testing Strategy

### Manual Testing
- [ ] Testar em Chrome, Firefox, Safari (últimas 2 versões)
- [ ] Testar em mobile (iOS Safari, Android Chrome)
- [ ] Validar com `prefers-reduced-motion` enabled
- [ ] Lighthouse audit (Performance >90, Accessibility 100)

### E2E Testing (Playwright/Cypress)
- [ ] Upload de áudio → estados visuais corretos
- [ ] Navegação relatório → elementos visuais renderizados
- [ ] Filtros dashboard → loading states funcionam

### User Testing
- [ ] 3-5 escolas piloto feedback (survey pós-demo)
- [ ] Session recordings (Hotjar) em páginas Tier 1

---

## 📚 Documentation

- [ ] `/docs/design-system-enhancements.md` - Usage guidelines para novos componentes
- [ ] `/docs/visual-identity-changelog.md` - Antes/depois screenshots
- [ ] Storybook stories (se aplicável)
- [ ] Atualizar UX Design Specification com componentes novos

---

## 🚀 Rollout Plan

**Phase 1: Internal Testing (1 semana)**
- Deploy em ambiente staging
- QA interno + time de vendas review
- Ajustes de polish

**Phase 2: Piloto (2 semanas)**
- Feature flag habilitado para 3-5 escolas piloto
- Coletar feedback via survey + sales calls
- Iterar se necessário

**Phase 3: Rollout Completo (1 semana)**
- Feature flag 100% habilitado
- Monitorar métricas (NPS, Lighthouse, conversão)
- Celebrar! 🎉

---

**Epic Owner:** PM (John) + UX Designer (Sally)
**Stakeholders:** Time de Vendas, Coordenadores Piloto, Dev Team
**Business Value:** Alto - impacto direto em conversão e percepção de marca
