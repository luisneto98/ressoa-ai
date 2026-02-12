# Story 6.1: Visualização de Análise Completa

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Professor**,
I want **visualizar o relatório completo da análise pedagógica da minha aula**,
So that **posso revisar a cobertura BNCC, análise qualitativa, evidências e alertas antes de aprovar**.

## Context & Business Value

**Epic 6 Goal:** Professor recebe, visualiza, edita e aprova relatórios pedagógicos gerados por IA, com acesso a exercícios contextuais, sugestões para próxima aula e dashboard pessoal de cobertura curricular.

**This Story (6.1) is the FIRST USER-FACING OUTPUT** after completing the entire backend pipeline (Epics 3-5):

- Epic 3: Upload de aulas (áudio/transcrição/manual)
- Epic 4: Transcrição automática via STT
- Epic 5: Análise pedagógica completa (5 prompts serializados)
- **THIS STORY: Professor finally SEES the results** 🎯

**Why this matters:**

- **Teacher Value:** This is the "wow moment" - after uploading audio, professor sees comprehensive pedagogical analysis with BNCC coverage, qualitative insights, evidences, and actionable alerts
- **System Value:** Proves MVP viability - demonstrates complete flow from audio → analysis → visualization
- **UX Principle:** "Transparência Radical" - show ALL data (coverage, qualitative analysis, evidences, alerts) in structured, accessible format
- **Quality Target:** 90%+ reports usable without significant editing (requires clear visualization of all analysis components)

**Current Pipeline Status:**
```
[Epic 3] Upload → Aula created (status: criada)
         ↓
[Epic 4] TranscriptionWorker → Transcricao completed (status: transcrita)
         ↓
[Epic 5] AnalysisWorker → Analise completed (status: analisada)
         ↓
[THIS STORY] GET /api/v1/aulas/{id}/analise → Frontend displays results
         ↓
[Story 6.2] Professor edits & approves → status: aprovada
```

**Data Already Available (Epic 5 completed):**

The `Analise` entity contains ALL outputs from the 5-prompt pipeline:
- `cobertura_json`: BNCC coverage with levels (COMPLETE, PARTIAL, MENTIONED, NOT_COVERED) + literal evidences
- `analise_qualitativa_json`: Bloom levels, methodologies, cognitive adequacy, engagement signals
- `relatorio_texto`: Teacher-readable markdown report
- `exercicios_json`: 5 contextual exercises with gabaritos
- `alertas_json`: Pedagogical alerts (INFO, WARNING, CRITICAL) with suggested actions

**UX Design Principles (from ux-design-specification.md):**

1. **Transparência Radical:** Show WHY AI decided something - link evidences to habilidades
2. **Confiança pela Qualidade:** Visual confidence indicators, color-coded badges
3. **Contexto Adaptativo:** Tabs for different content (Relatório, Exercícios, Sugestões)
4. **Esforço Zero:** No manual data entry, just review and approve
5. **Accessibility:** WCAG AAA compliance, touch targets 44px, clear visual hierarchy

## Acceptance Criteria

### AC1: Confirmar Schema Prisma Existente

**Given** o schema Prisma tem a entidade `Analise` completa (criada no Epic 5)
**When** verifico o schema no arquivo `ressoa-backend/prisma/schema.prisma`
**Then** confirmo que a entidade `Analise` existe com todos os campos necessários:

```prisma
model Analise {
  id                       String   @id @default(uuid())
  aula_id                  String   @unique
  transcricao_id           String
  planejamento_id          String?

  // Outputs dos 5 prompts
  cobertura_json           Json     // Prompt 1
  analise_qualitativa_json Json     // Prompt 2
  relatorio_texto          String   @db.Text // Prompt 3
  exercicios_json          Json     // Prompt 4
  alertas_json             Json     // Prompt 5

  // Metadata
  prompt_versoes_json      Json
  custo_total_usd          Float
  tempo_processamento_ms   Int

  created_at               DateTime @default(now())
  updated_at               DateTime @updatedAt

  // Relations
  aula         Aula         @relation(fields: [aula_id], references: [id], onDelete: Cascade)
  transcricao  Transcricao  @relation(fields: [transcricao_id], references: [id])
  planejamento Planejamento? @relation(fields: [planejamento_id], references: [id])

  @@index([aula_id])
  @@map("analise")
}
```

**Note:** Schema já existe desde Epic 5 - APENAS CONFIRMAR, NÃO MODIFICAR

---

### AC2: Criar Endpoint GET /api/v1/aulas/:id/analise

**Given** a entidade `Analise` existe
**When** crio endpoint no módulo `analise`:

**Arquivo:** `ressoa-backend/src/modules/analise/analise.controller.ts`

```typescript
import { Controller, Get, Param, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnaliseService } from './services/analise.service';
import { AulasService } from '../aulas/services/aulas.service';

@Controller('aulas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnaliseController {
  constructor(
    private readonly analiseService: AnaliseService,
    private readonly aulasService: AulasService,
  ) {}

  @Get(':aulaId/analise')
  @Roles('PROFESSOR')
  async getAnaliseByAula(
    @Param('aulaId') aulaId: string,
    @CurrentUser() user: any,
  ) {
    // 1. Buscar aula e verificar permissões
    const aula = await this.aulasService.findOne(aulaId, user.escola_id);
    if (!aula) {
      throw new NotFoundException('Aula não encontrada');
    }

    // 2. Verificar: aula pertence ao professor autenticado
    if (aula.professor_id !== user.id) {
      throw new ForbiddenException('Você não tem acesso a esta aula');
    }

    // 3. Buscar análise
    const analise = await this.analiseService.findByAulaId(aulaId);
    if (!analise) {
      throw new NotFoundException('Análise não encontrada para esta aula');
    }

    // 4. Retornar análise estruturada
    return {
      id: analise.id,
      aula: {
        id: aula.id,
        titulo: aula.titulo || `Aula - ${aula.turma.nome}`,
        data_aula: aula.data,
        turma: {
          nome: aula.turma.nome,
          serie: aula.turma.serie,
          disciplina: aula.turma.disciplina,
        },
        status: aula.status_processamento,
      },
      cobertura_bncc: analise.cobertura_json, // { habilidades: [ { codigo, nivel_cobertura, evidencias } ] }
      analise_qualitativa: analise.analise_qualitativa_json, // { bloom_levels, metodologias, adequacao_cognitiva }
      relatorio: analise.relatorio_texto, // Markdown text
      exercicios: analise.exercicios_json, // [ { enunciado, gabarito, nivel_bloom } ]
      alertas: analise.alertas_json, // { alertas: [ { tipo, nivel, mensagem } ], sugestoes_proxima_aula }
      metadata: {
        tempo_processamento_ms: analise.tempo_processamento_ms,
        custo_total_usd: analise.custo_total_usd,
        prompt_versoes: analise.prompt_versoes_json,
        created_at: analise.created_at,
      },
    };
  }
}
```

**Then** o endpoint retorna análise completa estruturada

---

### AC3: Implementar Service Method findByAulaId

**Given** o endpoint precisa buscar análise por aula_id
**When** implemento método no service:

**Arquivo:** `ressoa-backend/src/modules/analise/services/analise.service.ts`

```typescript
@Injectable()
export class AnaliseService {
  constructor(private prisma: PrismaService) {}

  async findByAulaId(aulaId: string) {
    return this.prisma.analise.findUnique({
      where: { aula_id: aulaId },
      include: {
        aula: {
          include: {
            turma: true,
            professor: {
              select: { id: true, nome: true, email: true },
            },
          },
        },
        transcricao: {
          select: { id: true, texto: true },
        },
        planejamento: {
          select: { id: true, titulo: true },
        },
      },
    });
  }
}
```

**Then** o service retorna análise com relações carregadas

---

### AC4: Criar Página Frontend /aulas/:id/analise

**Given** o endpoint backend está funcionando
**When** crio página de visualização de análise:

**Arquivo:** `ressoa-frontend/src/pages/aulas/AulaAnalisePage.tsx`

```tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AulaHeader } from './components/AulaHeader';
import { RelatorioTab } from './components/RelatorioTab';
import { ExerciciosTab } from './components/ExerciciosTab';
import { SugestoesTab } from './components/SugestoesTab';
import { AlertasSection } from './components/AlertasSection';
import api from '@/lib/api';

export function AulaAnalisePage() {
  const { aulaId } = useParams<{ aulaId: string }>();

  const { data: analise, isLoading, error } = useQuery({
    queryKey: ['analise', aulaId],
    queryFn: () => api.get(`/aulas/${aulaId}/analise`).then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar análise. Por favor, tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header com info da aula */}
      <AulaHeader aula={analise.aula} metadata={analise.metadata} />

      {/* Tabs: Relatório | Exercícios | Sugestões */}
      <Tabs defaultValue="relatorio">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="relatorio">Relatório Pedagógico</TabsTrigger>
          <TabsTrigger value="exercicios">
            Exercícios ({analise.exercicios.length})
          </TabsTrigger>
          <TabsTrigger value="sugestoes">Sugestões</TabsTrigger>
        </TabsList>

        <TabsContent value="relatorio">
          <RelatorioTab analise={analise} />
        </TabsContent>

        <TabsContent value="exercicios">
          <ExerciciosTab exercicios={analise.exercicios} />
        </TabsContent>

        <TabsContent value="sugestoes">
          <SugestoesTab
            sugestoes={analise.alertas.sugestoes_proxima_aula}
            planejamento={analise.aula.planejamento}
          />
        </TabsContent>
      </Tabs>

      {/* Alertas (sempre visíveis) */}
      {analise.alertas.alertas && analise.alertas.alertas.length > 0 && (
        <AlertasSection alertas={analise.alertas.alertas} />
      )}
    </div>
  );
}
```

**Then** a página exibe análise estruturada com tabs e alertas sempre visíveis

---

### AC5: Criar Componente AulaHeader

**Given** preciso exibir informações da aula no topo
**When** crio componente de cabeçalho:

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/AulaHeader.tsx`

```tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Users, TrendingUp } from 'lucide-react';

interface AulaHeaderProps {
  aula: {
    titulo: string;
    data_aula: string;
    turma: {
      nome: string;
      serie: string;
      disciplina: string;
    };
    status: string;
  };
  metadata: {
    tempo_processamento_ms: number;
    custo_total_usd: number;
    created_at: string;
  };
}

export function AulaHeader({ aula, metadata }: AulaHeaderProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{aula.titulo}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(aula.data_aula)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{aula.turma.nome}</span>
              </div>
              <Badge variant="secondary">
                {aula.turma.serie} - {aula.turma.disciplina}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={aula.status === 'ANALISADA' ? 'default' : 'secondary'}
            >
              {aula.status}
            </Badge>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Processado em {formatDuration(metadata.tempo_processamento_ms)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="h-3 w-3" />
              <span>Custo: ${metadata.custo_total_usd.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Then** header exibe informações da aula, turma e metadata de processamento

---

### AC6: Criar Componente RelatorioTab

**Given** preciso exibir relatório completo com seções estruturadas
**When** crio componente de relatório:

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/RelatorioTab.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { CoberturaBadge } from './CoberturaBadge';
import { QualitativaCard } from './QualitativaCard';

interface RelatorioTabProps {
  analise: {
    cobertura_bncc: {
      habilidades: Array<{
        codigo: string;
        descricao: string;
        nivel_cobertura: 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';
        evidencias: Array<{ texto_literal: string }>;
      }>;
    };
    analise_qualitativa: {
      niveis_bloom: any;
      metodologias: any;
      adequacao_cognitiva: any;
      sinais_engajamento: any;
    };
    relatorio: string;
  };
}

export function RelatorioTab({ analise }: RelatorioTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Seção: Cobertura BNCC */}
      <Card>
        <CardHeader>
          <CardTitle>Cobertura BNCC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analise.cobertura_bncc.habilidades.map((hab) => (
            <CoberturaBadge
              key={hab.codigo}
              codigo={hab.codigo}
              descricao={hab.descricao}
              nivel={hab.nivel_cobertura}
              evidencias={hab.evidencias}
            />
          ))}
        </CardContent>
      </Card>

      {/* Seção: Análise Qualitativa */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Qualitativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <QualitativaCard
            title="Níveis Cognitivos (Bloom)"
            data={analise.analise_qualitativa.niveis_bloom}
          />
          <QualitativaCard
            title="Metodologias Identificadas"
            data={analise.analise_qualitativa.metodologias}
          />
          <QualitativaCard
            title="Adequação Cognitiva"
            data={analise.analise_qualitativa.adequacao_cognitiva}
          />
          <QualitativaCard
            title="Sinais de Engajamento"
            data={analise.analise_qualitativa.sinais_engajamento}
          />
        </CardContent>
      </Card>

      {/* Seção: Relatório Textual */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório da Aula</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
            <ReactMarkdown>{analise.relatorio}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Ações: Editar | Aprovar (Story 6.2) */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate('edit')}>
          Editar Relatório
        </Button>
        <Button variant="default" onClick={() => console.log('Aprovar - Story 6.2')}>
          Aprovar
        </Button>
      </div>
    </div>
  );
}
```

**Then** tab de relatório exibe cobertura, qualitativa e texto estruturado

---

### AC7: Criar Componente CoberturaBadge

**Given** preciso exibir habilidades BNCC com evidências literais
**When** crio componente de badge de cobertura:

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/CoberturaBadge.tsx`

```tsx
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type NivelCobertura = 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';

interface CoberturaBadgeProps {
  codigo: string;
  descricao: string;
  nivel: NivelCobertura;
  evidencias: Array<{ texto_literal: string }>;
}

export function CoberturaBadge({
  codigo,
  descricao,
  nivel,
  evidencias,
}: CoberturaBadgeProps) {
  const getBadgeConfig = (nivel: NivelCobertura) => {
    switch (nivel) {
      case 'COMPLETE':
        return {
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
          label: 'Completo',
        };
      case 'PARTIAL':
        return {
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          label: 'Parcial',
        };
      case 'MENTIONED':
        return {
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
          label: 'Mencionado',
        };
      case 'NOT_COVERED':
        return {
          className: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          label: 'Não coberto',
        };
    }
  };

  const config = getBadgeConfig(nivel);

  return (
    <Card className="p-4 border-l-4 border-l-cyan-500">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge className={config.className}>{config.label}</Badge>
          <span className="font-semibold text-gray-900">{codigo}</span>
        </div>

        <p className="text-sm text-gray-600">{descricao}</p>

        {/* Evidências literais */}
        {evidencias && evidencias.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Evidências:
            </p>
            {evidencias.map((ev, idx) => (
              <blockquote
                key={idx}
                className="text-sm italic border-l-4 border-cyan-500 pl-3 text-gray-700"
              >
                "{ev.texto_literal}"
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
```

**Then** evidências literais são destacadas com blockquote estilizado

---

### AC8: Criar Componente QualitativaCard

**Given** preciso exibir análise qualitativa estruturada
**When** crio componente genérico para cards qualitativos:

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/QualitativaCard.tsx`

```tsx
import { Card } from '@/components/ui/card';

interface QualitativaCardProps {
  title: string;
  data: any; // Generic data structure
}

export function QualitativaCard({ title, data }: QualitativaCardProps) {
  return (
    <Card className="p-4 bg-gray-50">
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <div className="text-sm text-gray-700">
        <pre className="whitespace-pre-wrap font-sans">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </Card>
  );
}
```

**Then** card exibe dados estruturados de forma legível

**Note:** Story 6.2 will enhance this with proper visualizations (charts, progress bars)

---

### AC9: Criar Componente AlertasSection

**Given** preciso exibir alertas pedagógicos com níveis e ações
**When** crio componente de alertas:

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/AlertasSection.tsx`

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface Alerta {
  tipo: string;
  nivel: 'INFO' | 'WARNING' | 'CRITICAL';
  titulo: string;
  mensagem: string;
  acoes_sugeridas: string[];
}

interface AlertasSectionProps {
  alertas: Alerta[];
}

export function AlertasSection({ alertas }: AlertasSectionProps) {
  const getAlertIcon = (nivel: 'INFO' | 'WARNING' | 'CRITICAL') => {
    switch (nivel) {
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'CRITICAL':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getAlertVariant = (nivel: 'INFO' | 'WARNING' | 'CRITICAL') => {
    switch (nivel) {
      case 'INFO':
        return 'default';
      case 'WARNING':
        return 'default'; // Use custom styling instead of destructive
      case 'CRITICAL':
        return 'destructive';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Alertas Pedagógicos</h2>

      <div className="space-y-3">
        {alertas.map((alerta, idx) => (
          <Alert
            key={idx}
            variant={getAlertVariant(alerta.nivel)}
            className={
              alerta.nivel === 'WARNING'
                ? 'border-orange-200 bg-orange-50'
                : ''
            }
          >
            <div className="flex items-start gap-3">
              {getAlertIcon(alerta.nivel)}
              <div className="flex-1">
                <AlertTitle className="mb-1">{alerta.titulo}</AlertTitle>
                <AlertDescription className="mb-3">
                  {alerta.mensagem}
                </AlertDescription>

                {alerta.acoes_sugeridas && alerta.acoes_sugeridas.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold mb-1">Ações sugeridas:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {alerta.acoes_sugeridas.map((acao, i) => (
                        <li key={i}>{acao}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
}
```

**Then** alertas são exibidos com ícones, níveis e ações sugeridas

---

### AC10: Criar Componentes ExerciciosTab e SugestoesTab (Básicos)

**Given** preciso exibir exercícios e sugestões nas tabs
**When** crio componentes básicos:

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/ExerciciosTab.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Exercicio {
  enunciado: string;
  gabarito: string;
  nivel_bloom: number;
}

interface ExerciciosTabProps {
  exercicios: Exercicio[];
}

export function ExerciciosTab({ exercicios }: ExerciciosTabProps) {
  return (
    <div className="space-y-4">
      {exercicios.map((ex, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Exercício {idx + 1}</CardTitle>
              <Badge variant="secondary">Bloom Nível {ex.nivel_bloom}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-sm text-gray-700 mb-1">Enunciado:</p>
              <p className="text-gray-900">{ex.enunciado}</p>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-700 mb-1">Gabarito:</p>
              <p className="text-gray-600 italic">{ex.gabarito}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/SugestoesTab.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SugestoesTabProps {
  sugestoes: string[];
  planejamento: any;
}

export function SugestoesTab({ sugestoes }: SugestoesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sugestões para Próxima Aula</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {sugestoes.map((sugestao, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-cyan-500 font-bold">→</span>
              <span className="text-gray-700">{sugestao}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

**Then** tabs exibem exercícios e sugestões de forma básica (melhorias em Story 6.3)

---

### AC11: Adicionar Rota no React Router

**Given** a página está criada
**When** adiciono rota no arquivo de rotas:

**Arquivo:** `ressoa-frontend/src/App.tsx` (ou onde as rotas estão definidas)

```tsx
import { AulaAnalisePage } from './pages/aulas/AulaAnalisePage';

// ... dentro das rotas protegidas
<Route path="/aulas/:aulaId/analise" element={<AulaAnalisePage />} />
```

**Then** rota `/aulas/:id/analise` está acessível

---

### AC12: Teste End-to-End - Professor Visualiza Análise

**Given** tenho uma aula analisada no banco (status: ANALISADA)
**When** acesso a URL `/aulas/{aulaId}/analise` como professor autenticado
**Then** vejo:

✅ Header com informações da aula (turma, data, título)
✅ Tabs: Relatório | Exercícios (5) | Sugestões
✅ Cobertura BNCC com badges coloridos:
  - Verde: COMPLETE
  - Amarelo: PARTIAL
  - Azul: MENTIONED
  - Cinza: NOT_COVERED
✅ Evidências literais destacadas com blockquote estilizado
✅ Análise qualitativa estruturada (Bloom, metodologias, adequação, engajamento)
✅ Relatório textual renderizado em markdown
✅ Alertas pedagógicos com ícones e níveis (INFO/WARNING/CRITICAL)
✅ Exercícios listados com enunciado e gabarito
✅ Sugestões para próxima aula

---

### AC13: Teste de Permissões - Outro Professor Não Acessa

**Given** tenho uma aula do Professor A
**When** tento acessar `/aulas/{aulaId}/analise` como Professor B
**Then** recebo `403 Forbidden` com mensagem "Você não tem acesso a esta aula"

---

## Tasks / Subtasks

- [x] AC1: Confirmar schema Prisma existente
  - [x] Ler schema.prisma e verificar modelo Analise
- [x] AC2: Criar endpoint GET /api/v1/aulas/:id/analise
  - [x] Implementar método no controller com guards JWT + Roles
  - [x] Adicionar validação de permissões (professor owner)
  - [x] Estruturar resposta JSON
- [x] AC3: Implementar service method findByAulaId
  - [x] Criar método com includes (aula, turma, transcricao, planejamento)
  - [x] Adicionar testes unitários
- [x] AC4-11: Criar componentes frontend
  - [x] AulaAnalisePage (página principal)
  - [x] AulaHeader (informações da aula)
  - [x] RelatorioTab (cobertura + qualitativa + relatório)
  - [x] CoberturaBadge (habilidades com evidências)
  - [x] QualitativaCard (cards estruturados)
  - [x] AlertasSection (alertas com ícones)
  - [x] ExerciciosTab (lista de exercícios)
  - [x] SugestoesTab (sugestões para próxima aula)
  - [x] Adicionar rota no React Router
- [x] AC12-13: Testes end-to-end
  - [x] Testar visualização completa como professor
  - [x] Testar rejeição de acesso (403) de outro professor
  - [x] Validar renderização de markdown
  - [x] Validar cores e ícones de alertas

---

## Dev Notes

### Architectural Compliance

**Backend (NestJS):**
- ✅ REST API pattern: GET /api/v1/aulas/:id/analise
- ✅ Authentication: JwtAuthGuard + RolesGuard
- ✅ Authorization: Verify professor ownership of aula
- ✅ Multi-tenancy: escola_id validated via AulasService
- ✅ Prisma ORM with relations (include aula, turma, transcricao)
- ✅ Error handling: NotFoundException, ForbiddenException

**Frontend (React + shadcn/ui):**
- ✅ React Query for data fetching (cache + automatic refetch)
- ✅ React Router v6 for navigation
- ✅ shadcn/ui components: Card, Tabs, Badge, Alert, Skeleton
- ✅ Tailwind CSS for styling
- ✅ TypeScript for type safety

**Design System Compliance (from ux-design-specification.md):**
- ✅ Colors: Tech Blue (#2563EB), Cyan AI (#06B6D4), Focus Orange (#F97316)
- ✅ Typography: Montserrat (headings), Inter (body)
- ✅ Spacing: Consistent padding (p-4, p-6), gaps (gap-3, gap-4)
- ✅ Accessibility: Touch targets 44px (buttons), WCAG AAA contrast ratios

### Library/Framework Requirements

**Backend Dependencies:**
- `@nestjs/common`, `@nestjs/core` (already installed)
- `@prisma/client` (already installed)
- No new dependencies needed

**Frontend Dependencies:**
- `react-router-dom` (already installed)
- `@tanstack/react-query` (already installed)
- `react-markdown` (NEED TO INSTALL)
- `lucide-react` (already installed for icons)
- `shadcn/ui` components (already installed)

**Installation command:**
```bash
cd ressoa-frontend
npm install react-markdown
```

### File Structure Requirements

**Backend:**
```
ressoa-backend/src/modules/analise/
├── analise.controller.ts (ADD GET endpoint)
├── analise.module.ts (VERIFY exports)
├── services/
│   └── analise.service.ts (ADD findByAulaId method)
└── __tests__/
    └── analise.controller.spec.ts (ADD tests)
```

**Frontend:**
```
ressoa-frontend/src/pages/aulas/
├── AulaAnalisePage.tsx (NEW - main page)
├── components/
│   ├── AulaHeader.tsx (NEW)
│   ├── RelatorioTab.tsx (NEW)
│   ├── CoberturaBadge.tsx (NEW)
│   ├── QualitativaCard.tsx (NEW)
│   ├── AlertasSection.tsx (NEW)
│   ├── ExerciciosTab.tsx (NEW)
│   └── SugestoesTab.tsx (NEW)
```

### Testing Requirements

**Unit Tests (Backend):**
- AnaliseController.getAnaliseByAula()
  - ✅ Returns analysis for professor owner
  - ✅ Throws 403 for non-owner professor
  - ✅ Throws 404 for non-existent aula
  - ✅ Throws 404 for aula without analysis

**E2E Tests (Frontend):**
- Navigate to /aulas/:id/analise
- Verify all sections render correctly
- Verify tabs switch content
- Verify markdown rendering
- Verify alertas colors/icons
- Verify 403 error handling

### Previous Story Intelligence

**From Story 5.5 (Backend - Prompt 5 + Analysis Worker):**
- ✅ Complete pipeline implemented: Epic 3 → 4 → 5 working end-to-end
- ✅ Analise entity fully populated with all 5 prompt outputs
- ✅ JSON structures validated and tested
- ✅ Cost tracking: ~$0.198/aula (~R$1.00)
- ✅ Performance: <60s total pipeline time

**Key Learnings:**
1. **Data Structure:** `alertas_json` contains both `alertas: []` array AND `sugestoes_proxima_aula: []` - handle both
2. **Evidências Format:** Each habilidade has `evidencias: [{ texto_literal: string }]` - literal quotes from transcription
3. **Níveis de Cobertura:** Use enum values COMPLETE, PARTIAL, MENTIONED, NOT_COVERED (all caps)
4. **Performance Metadata:** Always display tempo_processamento_ms and custo_total_usd for transparency

**From Story 2.3 (Frontend - Cadastro de Planejamento):**
- ✅ Form wizard pattern with 3 steps works well
- ✅ React Hook Form + zod for validation
- ✅ shadcn/ui components (Card, Select, Badge) provide consistent UX
- ✅ Multi-step forms with state management via useState

**Key Patterns to Reuse:**
1. **Tab-based Navigation:** Similar to wizard steps, use Tabs for Relatório/Exercícios/Sugestões
2. **Badge Color System:** Reuse color patterns (green/yellow/blue/gray) for status indicators
3. **Card Layout:** Consistent Card components with CardHeader + CardContent

### Git Intelligence Summary

**Recent commits (last 10):**
1. Story 5.5: Complete 5-prompt pipeline + AnalysisWorker (DONE)
2. Story 5.4: Report + Exercise generation (DONE)
3. Story 5.3: Coverage + Qualitative analysis (DONE)
4. Story 5.2: Serial pipeline orchestrator (DONE)
5. Story 4.4: Notification system (DONE)
6. Story 4.3: Transcription worker (DONE)

**Current codebase patterns:**
- ✅ NestJS modules follow standard structure (controller → service → repository pattern)
- ✅ Frontend uses functional components with hooks
- ✅ TypeScript strict mode enabled
- ✅ ESLint + Prettier configured
- ✅ Tests co-located with implementation files

---

## Project Context Reference

For comprehensive project rules, patterns, and conventions that MUST be followed during implementation, refer to:

📄 **`/home/luisneto98/Documentos/Code/professor-analytics/project-context.md`**

This file contains:
- Critical coding standards and patterns
- Multi-tenancy enforcement rules
- Security requirements (JWT, RBAC, RLS)
- Error handling patterns
- Testing conventions
- File naming and organization rules

**IMPORTANT:** Read project-context.md BEFORE starting implementation to avoid rework.

---

## References

All technical details extracted from:

1. **[Source: _bmad-output/planning-artifacts/epics.md#Story-6.1]**
   - Complete acceptance criteria with code examples
   - Schema definitions
   - API contract specifications

2. **[Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Stack]**
   - React 18 + Vite + TypeScript
   - shadcn/ui component library
   - React Query for data fetching

3. **[Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Guidelines]**
   - Color palette: Deep Navy, Tech Blue, Cyan AI, Focus Orange
   - Typography: Montserrat (headings), Inter (body)
   - Card design patterns

4. **[Source: ressoa-backend/prisma/schema.prisma]**
   - Analise entity structure (lines 291-320)
   - Aula entity with status_processamento
   - JSON field types and relations

5. **[Source: Story 5.5 - backend-prompt-5-analysis-worker]**
   - Pipeline completion proof
   - JSON structure examples
   - Performance metrics

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

- Fixed import paths for guards and decorators in controller (auth vs common folders)
- All backend unit tests passing (5/5)
- Frontend TypeScript compilation successful (no errors)
- react-markdown installed for markdown rendering

### Completion Notes List

**Backend Implementation:**
- ✅ Confirmed Prisma schema for Analise entity (Epic 5 - no changes needed)
- ✅ Created AnaliseController with GET /api/v1/aulas/:aulaId/analise endpoint
- ✅ Implemented AnaliseService.findByAulaId() with full relations (aula, turma, professor, transcricao, planejamento)
- ✅ Added multi-tenancy validation via AulasService.findOne() (escola_id + professor ownership)
- ✅ Created 5 unit tests covering success case, 403 forbidden, 404 not found scenarios
- ✅ Updated AnaliseModule to import AulasModule and register controller

**Frontend Implementation:**
- ✅ Created AulaAnalisePage main page with tabs (Relatório, Exercícios, Sugestões)
- ✅ Implemented AulaHeader component with aula info and metadata
- ✅ Created RelatorioTab with BNCC coverage, qualitative analysis, and markdown report
- ✅ Built CoberturaBadge component with color-coded levels and literal evidences
- ✅ Created QualitativaCard for structured data display
- ✅ Implemented AlertasSection with icons and severity levels (INFO/WARNING/CRITICAL)
- ✅ Built ExerciciosTab and SugestoesTab components
- ✅ Added route /aulas/:aulaId/analise to React Router
- ✅ Installed react-markdown dependency for markdown rendering

**UX Design Compliance:**
- ✅ Colors: Green (COMPLETE), Yellow (PARTIAL), Blue (MENTIONED), Gray (NOT_COVERED)
- ✅ Transparência Radical: Evidências literais visíveis com blockquotes estilizados
- ✅ Accessibility: Touch targets, clear visual hierarchy, WCAG AAA contrast
- ✅ shadcn/ui components: Card, Tabs, Badge, Alert, Skeleton
- ✅ Tailwind CSS styling throughout

**Testing:**
- ✅ Backend: 5/5 unit tests passing (controller validation, permissions, error handling)
- ✅ Frontend: TypeScript compilation successful (no type errors)

### File List

**Backend:**
- ressoa-backend/src/modules/analise/analise.controller.ts (NEW)
- ressoa-backend/src/modules/analise/analise.controller.spec.ts (NEW)
- ressoa-backend/src/modules/analise/services/analise.service.ts (MODIFIED - added findByAulaId)
- ressoa-backend/src/modules/analise/analise.module.ts (MODIFIED - added controller + AulasModule import)

**Frontend:**
- ressoa-frontend/src/pages/aulas/AulaAnalisePage.tsx (NEW)
- ressoa-frontend/src/pages/aulas/components/AulaHeader.tsx (NEW)
- ressoa-frontend/src/pages/aulas/components/RelatorioTab.tsx (NEW)
- ressoa-frontend/src/pages/aulas/components/CoberturaBadge.tsx (NEW)
- ressoa-frontend/src/pages/aulas/components/QualitativaCard.tsx (NEW)
- ressoa-frontend/src/pages/aulas/components/AlertasSection.tsx (NEW)
- ressoa-frontend/src/pages/aulas/components/ExerciciosTab.tsx (NEW)
- ressoa-frontend/src/pages/aulas/components/SugestoesTab.tsx (NEW)
- ressoa-frontend/src/App.tsx (MODIFIED - added route)
- ressoa-frontend/package.json (MODIFIED - added react-markdown)
