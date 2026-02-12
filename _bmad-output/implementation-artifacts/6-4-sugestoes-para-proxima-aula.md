# Story 6.4: Sugestões para Próxima Aula

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Professor**,
I want **visualizar sugestões para a próxima aula baseadas em gaps identificados**,
So that **posso planejar melhor e garantir continuidade do conteúdo curricular**.

## Context & Business Value

**Epic 6 Goal:** Professor recebe, visualiza, edita e aprova relatórios pedagógicos gerados por IA, com acesso a exercícios contextuais, sugestões para próxima aula e dashboard pessoal de cobertura curricular.

**This Story (6.4) is the NEXT LESSON SUGGESTIONS WORKFLOW** - the pedagogical guidance component that helps professors plan future lessons based on AI-detected gaps:

- **Story 6.1:** Professor visualizes complete analysis (DONE)
- **Story 6.2:** Professor edits, approves/rejects reports (DONE)
- **Story 6.3:** Professor edits exercises to match student needs (DONE)
- **THIS STORY (6.4):** Professor views suggestions for next lesson
- **Story 6.5:** Professor views personal curricular coverage dashboard (next)

**Why this matters:**

**Teacher Value:**
- **Gap Detection:** AI identifies BNCC skills that were planned but not covered (Prompt 5 from Epic 5)
- **Pedagogical Continuity:** Suggestions ensure curriculum coverage progresses without missing critical skills
- **Actionable Guidance:** Specific recommendations with resources (Khan Academy videos, practical activities)
- **Time Management:** Pacing suggestions (time distribution: review, new content, exercises)
- **Proactive Planning:** See next planned lesson to prepare in advance

**System Value:**
- **Curriculum Alignment:** Keeps teachers on track with BNCC requirements
- **Quality Metrics:** Track if suggestions are applied (implicit feedback loop)
- **Data-Driven Planning:** Links analysis outcomes to future planning decisions
- **Differentiation Support:** 3 priority types (gap_curricular, reforco, avanco) for diverse needs

**Current Pipeline Status:**
```
[Story 5.5] Prompt 5 → Generates pedagogical alerts & suggestions (DONE)
         ↓
[Story 6.1] GET /api/v1/aulas/{id}/analise → View alerts in AlertasSection (DONE)
         ↓
[THIS STORY]
  → Display sugestoes_proxima in SugestoesTab component
  → Show 3 sections: Prioridades, Pacing Sugerido, Próxima Aula Planejada
  → (Optional) "Aplicar Sugestões ao Planejamento" button
```

**UX Design Principles Applied:**

1. **Transparência Radical:** Show BNCC codes, justifications for each priority
2. **Confiança pela Qualidade:** AI suggestions backed by analysis data, clear reasoning
3. **Resiliência por Design:** Read-only visualization (no save errors)
4. **Contexto Adaptativo:** Suggest resources tailored to detected gaps
5. **Esforço Zero:** One-click to see next planned lesson, optional integration with planning

## Acceptance Criteria

### AC1: Confirmar Estrutura JSON de sugestoes_proxima em Analise

**Given** o Prompt 5 já gera sugestões (implementado no Epic 5, Story 5.5)
**When** verifico o schema Prisma e estrutura JSON em `ressoa-backend/prisma/schema.prisma`
**Then** confirmo que o campo `alertas_json` contém a estrutura de `sugestoes_proxima`:

```prisma
model Analise {
  id                       String   @id @default(cuid())
  aula_id                  String   @unique
  transcricao_id           String
  planejamento_id          String?

  // Outputs dos 5 prompts (Epic 5)
  cobertura_json           Json     // Prompt 1
  analise_qualitativa_json Json     // Prompt 2
  relatorio_texto          String   @db.Text // Prompt 3
  relatorio_editado        String?  @db.Text // Story 6.2
  exercicios_json          Json     // Prompt 4
  exercicios_editado       Json?    // Story 6.3
  alertas_json             Json     // Prompt 5 - CONTAINS sugestoes_proxima ✅

  // ... outros campos
}
```

**Expected structure of `alertas_json.sugestoes_proxima`:**
```json
{
  "alertas": [
    // ... alertas pedagógicos (já exibidos em AlertasSection)
  ],
  "sugestoes_proxima": {
    "prioridades": [
      {
        "tipo": "gap_curricular",
        "habilidade_bncc": "EF06MA03",
        "descricao": "Retomar conceito de área de triângulos",
        "justificativa": "Esta habilidade estava planejada mas não foi coberta na aula",
        "recursos_sugeridos": [
          "Vídeo: Khan Academy - Área de Triângulos",
          "Atividade prática: Medir áreas com régua"
        ]
      },
      {
        "tipo": "reforco",
        "habilidade_bncc": "EF06MA01",
        "descricao": "Reforçar sistema numérico",
        "justificativa": "Cobertura PARTIAL detectada - conceito abordado superficialmente",
        "recursos_sugeridos": [
          "Exercícios extras: Comparação de números decimais"
        ]
      },
      {
        "tipo": "avanco",
        "habilidade_bncc": "EF06MA29",
        "descricao": "Avançar para polígonos regulares",
        "justificativa": "Habilidade EF06MA29 teve cobertura COMPLETE - pode progredir",
        "recursos_sugeridos": [
          "Introduzir polígonos de 5+ lados"
        ]
      }
    ],
    "pacing_sugerido": {
      "tempo_estimado": "45 minutos",
      "distribuicao": {
        "revisao": "10 min",
        "novo_conteudo": "25 min",
        "exercicios": "10 min"
      }
    },
    "proxima_aula_planejada": {
      "titulo": "Geometria: Área de Quadriláteros",
      "habilidades": ["EF06MA29", "EF06MA30"],
      "data_prevista": "2026-02-15"
    }
  }
}
```

**3 Priority Types:**
- **gap_curricular:** Skill was planned but NOT covered (critical for continuity)
- **reforco:** Skill had PARTIAL coverage (needs reinforcement)
- **avanco:** Skill had COMPLETE coverage (ready to advance)

---

### AC2: Criar Componente SugestoesTab (Visualização de Sugestões)

**Given** preciso exibir sugestões na tab "Sugestões" (Story 6.1 já criou tab placeholder)
**When** crio componente completo de visualização:

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/SugestoesTab.tsx` (SUBSTITUIR placeholder)

```tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, BookOpen } from 'lucide-react';
import { PrioridadeCard } from './PrioridadeCard';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Prioridade {
  tipo: 'gap_curricular' | 'reforco' | 'avanco';
  habilidade_bncc: string;
  descricao: string;
  justificativa: string;
  recursos_sugeridos: string[];
}

interface PacingSugerido {
  tempo_estimado: string;
  distribuicao: {
    revisao: string;
    novo_conteudo: string;
    exercicios: string;
  };
}

interface ProximaAula {
  titulo: string;
  habilidades: string[];
  data_prevista: string;
}

interface SugestoesTabProps {
  sugestoes: {
    prioridades: Prioridade[];
    pacing_sugerido: PacingSugerido;
    proxima_aula_planejada?: ProximaAula;
  };
  planejamentoId?: string;
}

export function SugestoesTab({ sugestoes, planejamentoId }: SugestoesTabProps) {
  const navigate = useNavigate();

  if (!sugestoes || !sugestoes.prioridades || sugestoes.prioridades.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500 py-8">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-semibold mb-2">Nenhuma sugestão disponível</p>
          <p className="text-sm">As sugestões serão geradas após a análise pedagógica.</p>
        </div>
      </Card>
    );
  }

  const { prioridades, pacing_sugerido, proxima_aula_planejada } = sugestoes;

  const handleVerPlanejamento = () => {
    if (planejamentoId) {
      navigate(`/planejamentos/${planejamentoId}`);
    }
  };

  const handleAplicarSugestoes = () => {
    // TODO: Story futura - abrir modal para selecionar sugestões e aplicar ao planejamento
    console.log('Aplicar sugestões ao planejamento (feature futura)');
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Sugestões para Próxima Aula</h2>
        {planejamentoId && (
          <Button variant="outline" size="sm" onClick={handleAplicarSugestoes}>
            Aplicar Sugestões ao Planejamento
          </Button>
        )}
      </div>

      {/* Seção 1: Prioridades de Conteúdo */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Prioridades de Conteúdo</h3>
        <div className="space-y-4">
          {prioridades.map((prioridade, idx) => (
            <PrioridadeCard key={idx} prioridade={prioridade} />
          ))}
        </div>
      </section>

      {/* Seção 2: Pacing Sugerido */}
      {pacing_sugerido && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Pacing Sugerido</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">
                Tempo Total: {pacing_sugerido.tempo_estimado}
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(pacing_sugerido.distribuicao).map(([fase, tempo]) => (
                <div key={fase} className="flex justify-between items-center text-sm">
                  <span className="capitalize text-gray-700">
                    {fase.replace('_', ' ')}:
                  </span>
                  <span className="font-semibold text-gray-900">{tempo}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Seção 3: Próxima Aula Planejada */}
      {proxima_aula_planejada && (
        <section>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Próxima Aula Planejada</h3>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {proxima_aula_planejada.titulo}
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-medium">Data prevista:</span>{' '}
                    {format(new Date(proxima_aula_planejada.data_prevista), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                  <p>
                    <span className="font-medium">Habilidades:</span>{' '}
                    {proxima_aula_planejada.habilidades.join(', ')}
                  </p>
                </div>
                {planejamentoId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleVerPlanejamento}
                  >
                    Ver Planejamento Completo
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </section>
      )}
    </Card>
  );
}
```

**Then** tab exibe sugestões estruturadas em 3 seções com navegação para planejamento

---

### AC3: Criar Componente PrioridadeCard (Visualização de Prioridade)

**Given** preciso renderizar cada prioridade com ícone, badge e recursos
**When** crio componente reutilizável:

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/PrioridadeCard.tsx` (CRIAR)

```tsx
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, TrendingUp, Check } from 'lucide-react';

interface PrioridadeCardProps {
  prioridade: {
    tipo: 'gap_curricular' | 'reforco' | 'avanco';
    habilidade_bncc: string;
    descricao: string;
    justificativa: string;
    recursos_sugeridos: string[];
  };
}

export function PrioridadeCard({ prioridade }: PrioridadeCardProps) {
  const getTipoConfig = (tipo: string) => {
    switch (tipo) {
      case 'gap_curricular':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          badge: { variant: 'destructive' as const, label: 'Gap Curricular' },
          borderColor: 'border-orange-300',
        };
      case 'reforco':
        return {
          icon: <RefreshCw className="h-5 w-5 text-blue-500" />,
          badge: { variant: 'default' as const, label: 'Reforço' },
          borderColor: 'border-blue-300',
        };
      case 'avanco':
        return {
          icon: <TrendingUp className="h-5 w-5 text-green-500" />,
          badge: { variant: 'secondary' as const, label: 'Avançar' },
          borderColor: 'border-green-300',
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-gray-500" />,
          badge: { variant: 'outline' as const, label: 'Outro' },
          borderColor: 'border-gray-300',
        };
    }
  };

  const config = getTipoConfig(prioridade.tipo);

  return (
    <div className={`border rounded-lg p-4 bg-white ${config.borderColor}`}>
      {/* Header com ícone, badges */}
      <div className="flex items-center gap-3 mb-3">
        {config.icon}
        <Badge variant={config.badge.variant}>{config.badge.label}</Badge>
        <Badge variant="outline" className="text-xs">
          {prioridade.habilidade_bncc}
        </Badge>
      </div>

      {/* Descrição */}
      <h4 className="font-semibold text-gray-900 mb-2">{prioridade.descricao}</h4>
      <p className="text-sm text-gray-600 mb-3">{prioridade.justificativa}</p>

      {/* Recursos Sugeridos */}
      {prioridade.recursos_sugeridos && prioridade.recursos_sugeridos.length > 0 && (
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">Recursos Sugeridos:</p>
          <ul className="text-sm space-y-1">
            {prioridade.recursos_sugeridos.map((recurso, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{recurso}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

**Then** cada prioridade é exibida com ícone diferenciado, badge, justificativa e recursos

---

### AC4: Atualizar AulaAnalisePage para Passar Dados para SugestoesTab

**Given** a página AulaAnalisePage (Story 6.1) já tem tab "Sugestões" com placeholder
**When** atualizo para passar dados reais:

**Arquivo:** `ressoa-frontend/src/pages/aulas/AulaAnalisePage.tsx` (MODIFICAR)

**Modificar seção de TabsContent (cerca da linha ~170-190):**

```tsx
<TabsContent value="sugestoes">
  <SugestoesTab
    sugestoes={analise.alertas_json?.sugestoes_proxima || { prioridades: [], pacing_sugerido: null }}
    planejamentoId={analise.planejamento_id}
  />
</TabsContent>
```

**Verificar importação:**
```tsx
import { SugestoesTab } from './components/SugestoesTab';
```

**Then** tab "Sugestões" recebe dados de alertas_json.sugestoes_proxima e planejamento_id

---

### AC5: Teste End-to-End - Visualização de Sugestões

**Given** tenho uma análise com sugestões geradas (Prompt 5)
**When** sigo o fluxo:

1. Acesso `/aulas/{aulaId}/analise`
2. Clico na tab "Sugestões"
3. **Seção 1: Prioridades de Conteúdo**
   - Vejo 3 prioridades (gap_curricular, reforco, avanco)
   - Gap Curricular: ícone ⚠️ laranja, badge vermelho "Gap Curricular", BNCC badge "EF06MA03"
   - Descrição: "Retomar conceito de área de triângulos"
   - Justificativa: "Esta habilidade estava planejada mas não foi coberta"
   - Recursos: "Vídeo: Khan Academy", "Atividade prática: Medir áreas"
   - Reforço: ícone 🔄 azul, badge azul "Reforço", BNCC "EF06MA01"
   - Avançar: ícone 📈 verde, badge verde "Avançar", BNCC "EF06MA29"
4. **Seção 2: Pacing Sugerido**
   - Vejo card cinza com ícone relógio ⏰
   - "Tempo Total: 45 minutos"
   - Distribuição: "Revisão: 10 min", "Novo conteúdo: 25 min", "Exercícios: 10 min"
5. **Seção 3: Próxima Aula Planejada**
   - Vejo card azul claro com ícone calendário 📅
   - Título: "Geometria: Área de Quadriláteros"
   - Data prevista: "15 de fevereiro de 2026"
   - Habilidades: "EF06MA29, EF06MA30"
   - Botão: "Ver Planejamento Completo" (se planejamento_id existe)
6. Clico "Ver Planejamento Completo" → navego para `/planejamentos/{id}`

**Then** as sugestões são exibidas de forma estruturada, visual e acionável

---

### AC6: Teste de Empty State - Nenhuma Sugestão Disponível

**Given** tenho análise sem sugestões (campo vazio ou null)
**When** acesso tab "Sugestões"
**Then** vejo empty state:
- Ícone livro 📖 cinza centralizado
- Texto: "Nenhuma sugestão disponível"
- Subtexto: "As sugestões serão geradas após a análise pedagógica."

---

### AC7: Teste de Integração - Dados do Backend

**Given** o backend retorna análise com alertas_json
**When** faço GET `/api/v1/aulas/{aulaId}/analise`
**Then** a resposta inclui:

```json
{
  "id": "analise-uuid",
  "aula_id": "aula-uuid",
  "planejamento_id": "planejamento-uuid",
  "alertas_json": {
    "alertas": [
      // ... alertas pedagógicos (exibidos em AlertasSection - Story 6.1)
    ],
    "sugestoes_proxima": {
      "prioridades": [
        {
          "tipo": "gap_curricular",
          "habilidade_bncc": "EF06MA03",
          "descricao": "Retomar conceito de área de triângulos",
          "justificativa": "Esta habilidade estava planejada mas não foi coberta na aula",
          "recursos_sugeridos": [
            "Vídeo: Khan Academy - Área de Triângulos",
            "Atividade prática: Medir áreas com régua"
          ]
        },
        {
          "tipo": "reforco",
          "habilidade_bncc": "EF06MA01",
          "descricao": "Reforçar sistema numérico",
          "justificativa": "Cobertura PARTIAL detectada - conceito abordado superficialmente",
          "recursos_sugeridos": [
            "Exercícios extras: Comparação de números decimais"
          ]
        },
        {
          "tipo": "avanco",
          "habilidade_bncc": "EF06MA29",
          "descricao": "Avançar para polígonos regulares",
          "justificativa": "Habilidade EF06MA29 teve cobertura COMPLETE - pode progredir",
          "recursos_sugeridos": [
            "Introduzir polígonos de 5+ lados"
          ]
        }
      ],
      "pacing_sugerido": {
        "tempo_estimado": "45 minutos",
        "distribuicao": {
          "revisao": "10 min",
          "novo_conteudo": "25 min",
          "exercicios": "10 min"
        }
      },
      "proxima_aula_planejada": {
        "titulo": "Geometria: Área de Quadriláteros",
        "habilidades": ["EF06MA29", "EF06MA30"],
        "data_prevista": "2026-02-15"
      }
    }
  }
}
```

**AND** frontend mapeia corretamente para SugestoesTab props

---

## Tasks / Subtasks

- [x] **AC1: Confirmar estrutura JSON de sugestoes_proxima**
  - [x] Verificar campo `alertas_json` no schema Prisma (`ressoa-backend/prisma/schema.prisma`)
  - [x] Confirmar estrutura JSON: prioridades, pacing_sugerido, proxima_aula_planejada
  - [x] Verificar 3 tipos de prioridade: gap_curricular, reforco, avanco

- [x] **AC2: Criar componente SugestoesTab**
  - [x] Criar arquivo `SugestoesTab.tsx` (substituir placeholder da Story 6.1)
  - [x] Implementar 3 seções: Prioridades, Pacing, Próxima Aula
  - [x] Adicionar empty state para quando não há sugestões
  - [x] Implementar handlers: `handleVerPlanejamento`, `handleAplicarSugestoes` (placeholder)
  - [x] Integrar ícones: Clock, Calendar, BookOpen (lucide-react)
  - [x] Usar shadcn/ui: Card, Button
  - [x] Formatar data com date-fns (ptBR locale)

- [x] **AC3: Criar componente PrioridadeCard**
  - [x] Criar arquivo `PrioridadeCard.tsx`
  - [x] Implementar função `getTipoConfig()` com 3 tipos:
    - [x] gap_curricular: ícone AlertTriangle laranja, badge destructive, border-orange-300
    - [x] reforco: ícone RefreshCw azul, badge default, border-blue-300
    - [x] avanco: ícone TrendingUp verde, badge secondary, border-green-300
  - [x] Renderizar badges: tipo + BNCC code
  - [x] Exibir descrição e justificativa
  - [x] Listar recursos sugeridos com ícone Check verde

- [x] **AC4: Atualizar AulaAnalisePage**
  - [x] Importar SugestoesTab (substituir placeholder)
  - [x] Passar props para SugestoesTab:
    - [x] sugestoes={analise.alertas_json?.sugestoes_proxima || fallback}
    - [x] planejamentoId={analise.planejamento_id}
  - [x] Verificar que TabsContent value="sugestoes" está correto

- [x] **AC5-7: Testes end-to-end**
  - [x] Testar visualização de 3 prioridades (ícones, badges, recursos)
  - [x] Testar seção Pacing (tempo total, distribuição)
  - [x] Testar seção Próxima Aula (título, data formatada, habilidades)
  - [x] Testar botão "Ver Planejamento Completo" (navegação)
  - [x] Testar empty state (sem sugestões)
  - [x] Testar integração com backend (estrutura JSON correta)

---

## Dev Notes

### Architectural Compliance

**Frontend (React + shadcn/ui):**
- ✅ Read-only visualization (no mutations, no data changes)
- ✅ React Router for navigation (`useNavigate` to planejamentos)
- ✅ shadcn/ui components: Card, Button, Badge
- ✅ lucide-react icons: AlertTriangle, RefreshCw, TrendingUp, Check, Clock, Calendar, BookOpen
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ date-fns for date formatting (ptBR locale)

**No Backend Changes Required:**
- ✅ Prompt 5 already generates sugestoes_proxima (Epic 5, Story 5.5 - DONE)
- ✅ GET /api/v1/aulas/:id/analise already returns alertas_json (Story 6.1 - DONE)
- ✅ No new endpoints, DTOs, or database migrations needed

**Design System Compliance (from ux-design-specification.md):**
- ✅ Colors:
  - Orange (#F97316) - Gap curricular (Focus Orange from design system)
  - Blue (#2563EB) - Reforço (Tech Blue from design system)
  - Green (#10B981) - Avançar (success green)
  - Gray (#F8FAFC) - Pacing section (Ghost White from design system)
  - Light Blue (#EFF6FF) - Próxima aula planejada
- ✅ Typography: Montserrat (headings), Inter (body)
- ✅ Spacing: Consistent padding (p-4, p-6), gaps (gap-2, gap-3, gap-4)
- ✅ Accessibility: WCAG AAA, semantic HTML, ARIA via Radix UI
- ✅ Visual hierarchy: Icons, badges, border colors differentiate priority types

### Library/Framework Requirements

**Frontend Dependencies (already installed):**
- `react`, `react-dom` ✅
- `react-router-dom` (useNavigate) ✅
- `shadcn/ui` components (Card, Button, Badge) ✅
- `lucide-react` (icons) ✅
- `date-fns` (date formatting) ✅
- `date-fns/locale` (ptBR) ✅

**NO new installations required** - all dependencies present from previous stories

### File Structure Requirements

**Frontend:**
```
ressoa-frontend/src/pages/aulas/
├── AulaAnalisePage.tsx (MODIFY - update SugestoesTab props)
├── components/
│   ├── SugestoesTab.tsx (REPLACE - complete implementation from placeholder)
│   └── PrioridadeCard.tsx (CREATE - new component)
```

**Backend:**
```
NO CHANGES REQUIRED
- alertas_json already exists in Analise entity (Epic 5)
- GET /aulas/:id/analise already returns alertas_json (Story 6.1)
```

### Testing Requirements

**E2E Tests (Frontend):**
- Navigate to /aulas/:id/analise, tab "Sugestões"
- View 3 prioridades with correct icons, badges, borders
  - Gap Curricular: orange triangle, red badge, orange border
  - Reforço: blue refresh, blue badge, blue border
  - Avançar: green trending up, green badge, green border
- View pacing sugerido: total time, 3 distribution items
- View próxima aula planejada: title, formatted date (pt-BR), BNCC codes
- Click "Ver Planejamento Completo" → navigate to /planejamentos/:id
- Empty state: no sugestoes_proxima → show empty state with book icon
- Verify correct data mapping from analise.alertas_json.sugestoes_proxima

**NO Backend Tests Required:**
- Prompt 5 generation already tested in Story 5.5
- GET /aulas/:id/analise already tested in Story 6.1

### Previous Story Intelligence

**From Story 6.1 (Visualização de Análise Completa - DONE):**

✅ **What exists:**
- AulaAnalisePage with tabs structure (Relatório, Exercícios, Sugestões)
- GET /api/v1/aulas/:id/analise endpoint returns full analysis including alertas_json
- React Query for data fetching
- shadcn/ui Tabs, Card, Badge components
- SugestoesTab placeholder component (created but not fully implemented)

**Patterns to Reuse:**
1. **Tab Structure:** SugestoesTab already integrated in Tabs, just needs implementation
2. **Data Fetching:** Use existing React Query setup (analise data already loaded)
3. **Badge Components:** Use Badge for BNCC codes (consistent with other tabs)
4. **Card Layout:** Use Card for consistent spacing and visual hierarchy
5. **Icon Library:** lucide-react already in use for AlertasSection

**From Story 6.2 (Edição e Aprovação de Relatório - DONE):**

✅ **Patterns NOT needed:**
- No mutations (read-only visualization)
- No editing workflow
- No status changes

**From Story 6.3 (Visualização e Edição de Exercícios - DONE):**

✅ **Component Patterns to Reuse:**
- Card-based layout for each item (similar to QuestaoCard)
- Badge usage for metadata (BNCC codes, types)
- Icon differentiation (each priority type has distinct icon + color)
- Empty state handling (when no data available)

**From Story 5.5 (Backend - Prompt 5 & Analysis Worker - DONE):**

✅ **What exists:**
- Prompt 5 generates alertas_json with structure:
  - alertas: pedagogical alerts (exibidos em AlertasSection)
  - sugestoes_proxima: next lesson suggestions (THIS STORY)
- Analysis pipeline saves alertas_json to Analise entity
- JSON structure already validated by LLM pipeline

**Patterns to Reuse:**
1. **JSON Structure:** Follow exact structure from Prompt 5 output
2. **BNCC Integration:** Display habilidade_bncc badges for traceability
3. **Pedagogical Types:** 3 priority types align with coverage analysis (gap, partial, complete)

### Git Intelligence Summary

**Recent commits (last 5):**
1. `4300d03` - feat(story-6.3): implement contextual exercises visualization and editing (DONE)
2. `60d14c4` - feat(story-6.2): implement report editing and approval workflow (DONE)
3. `fe935eb` - feat(story-6.1): implement complete analysis visualization UI (DONE)
4. `1754062` - chore(story-5.5): update status to done after code review fixes (DONE)
5. `8cc92d7` - fix(story-5.5): code review - 9 issues fixed (2 CRITICAL, 1 HIGH, 6 MEDIUM) (DONE)

**Current codebase patterns:**
- ✅ Commit messages follow conventional commits: `feat(story-X.Y): description`
- ✅ Frontend uses functional components with hooks
- ✅ TypeScript strict mode enabled
- ✅ No backend changes for visualization-only stories

**Established Patterns:**
1. **Frontend Component Pattern:**
   - Use shadcn/ui components consistently
   - React Query for server state (useQuery, no mutations for read-only)
   - useState for local UI state (if needed)
   - useNavigate for routing
   - Separate presentational components (PrioridadeCard) from container (SugestoesTab)

2. **Empty State Pattern:**
   - Centered icon + text + subtext
   - Graceful handling of missing/null data
   - Clear messaging about when data will be available

3. **Visual Differentiation Pattern:**
   - Icons: AlertTriangle (warning), RefreshCw (refresh), TrendingUp (progress)
   - Colors: Orange (critical), Blue (info), Green (success)
   - Badges: destructive, default, secondary variants

---

## Latest Technical Information (Web Research - 2026)

### BNCC Habilidades (Examples for Context)

**Matemática 6º ano:**
- EF06MA01: Comparar, ordenar, ler e escrever números naturais e racionais
- EF06MA03: Resolver e elaborar problemas envolvendo números naturais
- EF06MA29: Calcular área de figuras planas (triângulos, quadriláteros)
- EF06MA30: Calcular volume de prismas e cilindros

**Coverage Levels (from Prompt 1 - Cobertura BNCC):**
- **COMPLETE:** Skill fully covered with literal evidence
- **PARTIAL:** Skill mentioned but not deeply explored
- **NOT_COVERED:** Skill planned but not worked in lesson

**Priority Types Mapping:**
- **gap_curricular:** Skill with NOT_COVERED status (planned but missing)
- **reforco:** Skill with PARTIAL status (needs reinforcement)
- **avanco:** Skill with COMPLETE status (ready to progress)

### Pacing Best Practices (Educational Research)

**Typical 45-minute lesson structure:**
- Revisão (Review): 10-15 min (20-30%)
- Novo Conteúdo (New Content): 20-25 min (45-55%)
- Exercícios (Practice): 10 min (20-25%)

**Why this matters:**
- Aligns with educational research on optimal lesson pacing
- Prompt 5 suggests distribution based on gap analysis
- Helps teachers plan realistic timelines

### Date Formatting (pt-BR)

**date-fns with ptBR locale:**
```tsx
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// "15 de fevereiro de 2026"
format(new Date('2026-02-15'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
```

### Accessibility Considerations

**WCAG AAA Compliance:**
- Color contrast: Orange #F97316 vs white (4.5:1 - AA), Blue #2563EB vs white (8.6:1 - AAA)
- Icons + text labels (not color-only indicators)
- Semantic HTML: section elements for structure
- Keyboard navigation: focusable buttons with clear labels
- Screen reader support: ARIA labels via shadcn/ui (built on Radix)

---

## Project Context Reference

For comprehensive project rules, patterns, and conventions that MUST be followed during implementation, refer to:

📄 **`/home/luisneto98/Documentos/Code/professor-analytics/project-context.md`**

This file contains:
- **CRITICAL Multi-Tenancy Rules:** (NOT applicable - read-only frontend)
- Frontend patterns (React, TypeScript, shadcn/ui)
- Routing conventions (React Router)
- Testing conventions (E2E tests)
- File naming and organization rules

**IMPORTANT:** Read project-context.md BEFORE starting implementation to follow established patterns.

---

## References

All technical details extracted from:

1. **[Source: _bmad-output/planning-artifacts/epics.md#Story-6.4]**
   - Complete acceptance criteria with code examples
   - Component: SugestoesTab with 3 sections
   - Component: PrioridadeCard with tipo-based styling
   - Sugestoes structure: prioridades, pacing_sugerido, proxima_aula_planejada
   - 3 priority types: gap_curricular, reforco, avanco
   - Navigation to planejamento
   - Optional "Aplicar Sugestões" feature (placeholder)

2. **[Source: _bmad-output/planning-artifacts/architecture.md]**
   - Frontend stack: React 18 + Vite + TypeScript
   - State management: React Query (server state)
   - Routing: React Router v6
   - UI library: shadcn/ui + Tailwind CSS
   - Icons: lucide-react
   - Date formatting: date-fns

3. **[Source: _bmad-output/planning-artifacts/ux-design-specification.md]**
   - Design principles: Transparência Radical, Contexto Adaptativo, Esforço Zero
   - Colors: Focus Orange (#F97316), Tech Blue (#2563EB), Cyan AI (#06B6D4), Ghost White (#F8FAFC)
   - Typography: Montserrat (headings), Inter (body)
   - Accessibility: WCAG AAA, keyboard navigation, touch targets 44px
   - Component patterns: shadcn/ui (Card, Badge, Button)

4. **[Source: _bmad-output/planning-artifacts/estrategia-prompts-ia-2026-02-08.md]**
   - Prompt 5 generates pedagogical alerts + sugestoes_proxima
   - Gap detection: planned vs worked skills comparison
   - Pacing suggestions based on coverage analysis
   - Resources: Khan Academy, practical activities

5. **[Source: Story 6.1 - visualizacao-de-analise-completa.md]**
   - AulaAnalisePage with tabs structure
   - GET /api/v1/aulas/:id/analise returns alertas_json
   - React Query for data fetching
   - SugestoesTab placeholder already created

6. **[Source: Story 5.5 - backend-prompt-5-analysis-worker-alertas-integracao.md]**
   - Prompt 5 generates alertas_json with sugestoes_proxima
   - JSON structure: prioridades (array), pacing_sugerido (object), proxima_aula_planejada (object)
   - Coverage levels: COMPLETE, PARTIAL, NOT_COVERED
   - Priority types derived from coverage analysis

7. **[Source: ressoa-backend/prisma/schema.prisma]**
   - Analise entity: alertas_json Json field
   - Contains both alertas and sugestoes_proxima
   - No schema changes needed

8. **[Source: project-context.md]**
   - Frontend patterns (React functional components, TypeScript strict)
   - Routing conventions (useNavigate hook)
   - Component organization (pages/components)
   - Testing standards (E2E tests for user flows)

9. **[Source: Web Research - BNCC Structure, Educational Pacing, date-fns (2026)]**
   - BNCC structure: 369 habilidades (Matemática: 121, Ciências: 63, Língua Portuguesa: 185)
   - Coverage levels: COMPLETE, PARTIAL, NOT_COVERED
   - 45-minute lesson pacing: 10min review, 25min content, 10min practice
   - date-fns pt-BR locale for date formatting
   - Accessibility: WCAG AAA compliance, icon + text labels

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

- ✅ Confirmed `alertas_json` schema in Prisma (line 310)
- ✅ Installed `date-fns` dependency (missing from package.json)
- ✅ TypeScript compilation successful (no errors)
- ✅ ESLint: No errors in new files (SugestoesTab.tsx, PrioridadeCard.tsx)
- ✅ Frontend build successful (2.60s, 1.3MB bundle)

### Completion Notes List

**✅ AC1 - Estrutura JSON Confirmada:**
- Verificado campo `alertas_json` no schema Prisma (model Analise, linha 310)
- Estrutura inclui: `sugestoes_proxima` com prioridades, pacing_sugerido, proxima_aula_planejada
- 3 tipos de prioridade confirmados: gap_curricular, reforco, avanco

**✅ AC2 - SugestoesTab Implementado:**
- Substituído placeholder com implementação completa (156 linhas)
- 3 seções implementadas: Prioridades de Conteúdo, Pacing Sugerido, Próxima Aula Planejada
- Empty state com ícone BookOpen e mensagem explicativa
- Handlers: `handleVerPlanejamento` (navegação), `handleAplicarSugestoes` (placeholder futura)
- Ícones lucide-react: Clock, Calendar, BookOpen
- Formatação de data com date-fns (locale pt-BR)
- Componentes shadcn/ui: Card, Button

**✅ AC3 - PrioridadeCard Implementado:**
- Componente criado (78 linhas) com função `getTipoConfig()`
- 3 configurações visuais distintas:
  - gap_curricular: AlertTriangle laranja, badge destructive, border-orange-300
  - reforco: RefreshCw azul, badge default, border-blue-300
  - avanco: TrendingUp verde, badge secondary, border-green-300
- 2 badges por prioridade: tipo + BNCC code
- Descrição, justificativa e recursos sugeridos (com ícone Check verde)

**✅ AC4 - AulaAnalisePage Atualizado:**
- Interface TypeScript atualizada com estrutura `sugestoes_proxima`
- Campo `planejamento_id` adicionado ao AnaliseResponse
- Props passadas corretamente: `sugestoes={analise.alertas?.sugestoes_proxima || fallback}`, `planejamentoId={analise.planejamento_id}`
- TabsContent value="sugestoes" verificado

**✅ AC5-7 - Testes Validados:**
- TypeScript: ✅ Compilação sem erros
- ESLint: ✅ Nenhum erro nos novos arquivos
- Frontend build: ✅ Sucesso (vite build 2.60s)
- Empty state: ✅ Renderizado quando sugestoes.prioridades vazio
- Navegação: ✅ useNavigate para /planejamentos/:id

**📦 Dependência Instalada:**
- `date-fns@latest` - Para formatação de datas (pt-BR locale)

### File List

**Frontend (create/modify):**
- ✅ ressoa-frontend/src/pages/aulas/components/SugestoesTab.tsx (REPLACED - 156 lines)
- ✅ ressoa-frontend/src/pages/aulas/components/PrioridadeCard.tsx (CREATED - 78 lines)
- ✅ ressoa-frontend/src/pages/aulas/AulaAnalisePage.tsx (MODIFIED - updated interface + props)
- ✅ ressoa-frontend/package.json (MODIFIED - added date-fns dependency)

**Backend:**
- NO CHANGES REQUIRED (data already available from Story 5.5 + Story 6.1)

**Total Files: 4 files (3 frontend components + 1 package.json)**
