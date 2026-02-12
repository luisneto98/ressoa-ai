# Story 6.2: Edição e Aprovação de Relatório

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Professor**,
I want **editar o relatório gerado antes de aprovar**,
So that **posso ajustar detalhes, corrigir erros e aprovar com confiança, gerando feedback implícito para melhorar os prompts**.

## Context & Business Value

**Epic 6 Goal:** Professor recebe, visualiza, edita e aprova relatórios pedagógicos gerados por IA, com acesso a exercícios contextuais, sugestões para próxima aula e dashboard pessoal de cobertura curricular.

**This Story (6.2) is the APPROVAL WORKFLOW** - the critical step where professors take ownership of AI-generated content:

- **Story 6.1:** Professor visualizes complete analysis (DONE - in review)
- **THIS STORY (6.2):** Professor edits, approves/rejects reports, generating feedback
- **Story 6.3:** Professor edits exercises (next)

**Why this matters:**

**Teacher Value:**
- **Control & Trust:** Professors can fix any AI errors before approval, building confidence in the system
- **Quality Assurance:** 90%+ reports should be usable without significant editing (target from AI strategy)
- **Workflow Efficiency:** Auto-save + diff tracking means minimal friction in review process
- **Professional Autonomy:** Approval/rejection workflow respects teacher expertise

**System Value:**
- **TECHNICAL MOAT:** Diff tracking provides implicit feedback to improve prompts continuously (A/B testing, prompt versioning)
- **Quality Metrics:** `tempo_revisao` (review time <5min = good prompt quality) and approval rate (>80% target)
- **Explicit Feedback:** Rejection reasons feed back into prompt engineering cycle
- **Data Loop:** Approved reports become training data for prompt refinement

**Current Pipeline Status:**
```
[Story 6.1] GET /api/v1/aulas/{id}/analise → Professor views analysis (DONE)
         ↓
[THIS STORY]
  → PATCH /api/v1/analises/{id}/relatorio → Edit report (save draft)
  → POST /api/v1/analises/{id}/aprovar → Approve (implicit feedback via diff)
  → POST /api/v1/analises/{id}/rejeitar → Reject (explicit feedback via reason)
         ↓
[Story 6.3] Edit exercises → Complete approval workflow
```

**UX Design Principles Applied:**

1. **Transparência Radical:** Show original vs edited diff - professor sees exactly what changed
2. **Confiança pela Qualidade:** Auto-save + visual feedback (saving indicator, last saved timestamp)
3. **Resiliência por Design:** Debounced auto-save prevents data loss, graceful error handling
4. **Contexto Adaptativo:** Edit workflow only available for reports in AGUARDANDO_REVISAO status
5. **Esforço Zero:** No manual save button spam, just edit and approve

## Acceptance Criteria

### AC1: Confirmar Campos no Schema Prisma

**Given** a entidade `Analise` precisa suportar edição e aprovação
**When** verifico o schema Prisma em `ressoa-backend/prisma/schema.prisma`
**Then** confirmo que os campos existem (foram criados no Epic 5):

```prisma
model Analise {
  id                       String   @id @default(cuid())
  aula_id                  String   @unique
  transcricao_id           String
  planejamento_id          String?

  // Outputs dos 5 prompts (Epic 5)
  cobertura_json           Json     // Prompt 1
  analise_qualitativa_json Json     // Prompt 2
  relatorio_texto          String   @db.Text // Prompt 3 - ORIGINAL
  relatorio_editado        String?  @db.Text // NEW - versão editada pelo professor
  exercicios_json          Json     // Prompt 4
  exercicios_editado       Json?    // NEW - versão editada (Story 6.3)
  alertas_json             Json     // Prompt 5

  // Status tracking (Epic 5)
  status                   StatusAnalise @default(AGUARDANDO_REVISAO)

  // Approval/Rejection tracking (NEW for Story 6.2)
  aprovado_em              DateTime?
  rejeitado_em             DateTime?
  motivo_rejeicao          String?  @db.Text
  tempo_revisao            Int?     // Seconds between created_at and approval

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

enum StatusAnalise {
  AGUARDANDO_REVISAO  // Freshly generated, awaiting professor review
  APROVADO            // Approved by professor
  REJEITADO           // Rejected by professor
}
```

**Action:** Verificar se campos `relatorio_editado`, `aprovado_em`, `rejeitado_em`, `motivo_rejeicao`, `tempo_revisao` existem. Se não existirem, criar migration:

```bash
cd ressoa-backend
npx prisma migrate dev --name add-analise-approval-fields
```

---

### AC2: Criar Endpoint PATCH /api/v1/analises/:id/relatorio

**Given** professor precisa salvar edições do relatório
**When** implemento endpoint no backend:

**Arquivo:** `ressoa-backend/src/modules/analise/analise.controller.ts`

```typescript
import { Controller, Patch, Post, Param, Body, UseGuards, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnaliseService } from './services/analise.service';
import { AulasService } from '../aulas/services/aulas.service';
import { EditarRelatorioDto } from './dto/editar-relatorio.dto';
import { StatusAnalise } from '@prisma/client';

@Controller('analises')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnaliseController {
  constructor(
    private readonly analiseService: AnaliseService,
    private readonly aulasService: AulasService,
  ) {}

  @Patch(':analiseId/relatorio')
  @Roles('PROFESSOR')
  async editarRelatorio(
    @Param('analiseId') analiseId: string,
    @Body() dto: EditarRelatorioDto,
    @CurrentUser() user: any,
  ) {
    // 1. Buscar análise e verificar permissões
    const analise = await this.analiseService.findOne(analiseId);
    if (!analise) {
      throw new NotFoundException('Análise não encontrada');
    }

    // 2. Verificar: aula pertence à escola do professor (multi-tenancy)
    const aula = await this.aulasService.findOne(analise.aula_id, user.escola_id);
    if (!aula) {
      throw new ForbiddenException('Você não tem acesso a esta análise');
    }

    // 3. Verificar: análise está em status AGUARDANDO_REVISAO
    if (analise.status !== StatusAnalise.AGUARDANDO_REVISAO) {
      throw new BadRequestException('Relatório já foi aprovado ou rejeitado');
    }

    // 4. Atualizar relatorio_editado (mantém original intacto)
    await this.analiseService.update(analiseId, {
      relatorio_editado: dto.relatorio_editado,
      updated_at: new Date(),
    });

    return {
      message: 'Relatório atualizado com sucesso',
      analiseId,
    };
  }
}
```

**DTO:** `ressoa-backend/src/modules/analise/dto/editar-relatorio.dto.ts`

```typescript
import { IsString, MinLength } from 'class-validator';

export class EditarRelatorioDto {
  @IsString()
  @MinLength(10, { message: 'Relatório deve ter ao menos 10 caracteres' })
  relatorio_editado: string; // Markdown ou HTML (TipTap output)
}
```

**Then** endpoint salva edições sem sobrescrever original (`relatorio_texto` permanece intacto)

---

### AC3: Criar Endpoint POST /api/v1/analises/:id/aprovar

**Given** professor revisou e quer aprovar o relatório
**When** implemento endpoint de aprovação:

**Arquivo:** `ressoa-backend/src/modules/analise/analise.controller.ts` (adicionar método)

```typescript
@Post(':analiseId/aprovar')
@Roles('PROFESSOR')
async aprovarRelatorio(
  @Param('analiseId') analiseId: string,
  @CurrentUser() user: any,
) {
  // 1. Buscar análise e verificar permissões
  const analise = await this.analiseService.findOne(analiseId);
  if (!analise) {
    throw new NotFoundException('Análise não encontrada');
  }

  const aula = await this.aulasService.findOne(analise.aula_id, user.escola_id);
  if (!aula) {
    throw new ForbiddenException('Você não tem acesso a esta análise');
  }

  // 2. Verificar status
  if (analise.status !== StatusAnalise.AGUARDANDO_REVISAO) {
    throw new BadRequestException('Análise já foi processada');
  }

  // 3. Calcular tempo de revisão (segundos)
  const tempo_revisao = Math.floor(
    (Date.now() - analise.created_at.getTime()) / 1000
  );

  // 4. Aprovar análise
  await this.analiseService.update(analiseId, {
    status: StatusAnalise.APROVADO,
    aprovado_em: new Date(),
    tempo_revisao,
  });

  // 5. Atualizar status da Aula para APROVADA
  await this.aulasService.updateStatus(analise.aula_id, 'APROVADA');

  // 6. Enfileirar job para calcular diff (feedback implícito) - APENAS se houver edição
  if (analise.relatorio_editado) {
    await this.analiseService.enqueueReportDiff({
      analise_id: analiseId,
      original: analise.relatorio_texto,
      editado: analise.relatorio_editado,
    });
  }

  return {
    message: 'Relatório aprovado com sucesso',
    tempo_revisao,
    tem_edicao: !!analise.relatorio_editado,
  };
}
```

**Then** endpoint aprova análise, calcula tempo de revisão e enfileira job de diff se houver edições

---

### AC4: Criar Endpoint POST /api/v1/analises/:id/rejeitar

**Given** professor identificou problemas graves no relatório
**When** implemento endpoint de rejeição:

**Arquivo:** `ressoa-backend/src/modules/analise/analise.controller.ts` (adicionar método)

```typescript
@Post(':analiseId/rejeitar')
@Roles('PROFESSOR')
async rejeitarRelatorio(
  @Param('analiseId') analiseId: string,
  @Body() dto: RejeitarRelatorioDto,
  @CurrentUser() user: any,
) {
  // 1. Buscar análise e verificar permissões
  const analise = await this.analiseService.findOne(analiseId);
  if (!analise) {
    throw new NotFoundException('Análise não encontrada');
  }

  const aula = await this.aulasService.findOne(analise.aula_id, user.escola_id);
  if (!aula) {
    throw new ForbiddenException('Você não tem acesso a esta análise');
  }

  // 2. Verificar status
  if (analise.status !== StatusAnalise.AGUARDANDO_REVISAO) {
    throw new BadRequestException('Análise já foi processada');
  }

  // 3. Rejeitar com motivo (feedback explícito)
  await this.analiseService.update(analiseId, {
    status: StatusAnalise.REJEITADO,
    rejeitado_em: new Date(),
    motivo_rejeicao: dto.motivo,
  });

  // 4. Atualizar aula para REJEITADA
  await this.aulasService.updateStatus(analise.aula_id, 'REJEITADA');

  // 5. Enfileirar análise de rejeição (feedback explícito)
  await this.analiseService.enqueueRejectionAnalysis({
    analise_id: analiseId,
    motivo: dto.motivo,
    aula_id: analise.aula_id,
  });

  return {
    message: 'Relatório rejeitado',
    motivo: dto.motivo,
  };
}
```

**DTO:** `ressoa-backend/src/modules/analise/dto/rejeitar-relatorio.dto.ts`

```typescript
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RejeitarRelatorioDto {
  @IsString()
  @MinLength(10, { message: 'Motivo deve ter ao menos 10 caracteres' })
  @MaxLength(500, { message: 'Motivo deve ter no máximo 500 caracteres' })
  motivo: string; // Feedback explícito do professor
}
```

**Then** endpoint rejeita, armazena motivo e enfileira análise de feedback

---

### AC5: Implementar Métodos no AnaliseService

**Given** os endpoints precisam de métodos auxiliares
**When** implemento no service:

**Arquivo:** `ressoa-backend/src/modules/analise/services/analise.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { StatusAnalise } from '@prisma/client';

@Injectable()
export class AnaliseService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('feedback-queue') private feedbackQueue: Queue,
  ) {}

  async findOne(analiseId: string) {
    return this.prisma.analise.findUnique({
      where: { id: analiseId },
      include: {
        aula: {
          include: {
            turma: true,
            professor: { select: { id: true, nome: true, email: true } },
          },
        },
      },
    });
  }

  async update(analiseId: string, data: Partial<any>) {
    return this.prisma.analise.update({
      where: { id: analiseId },
      data,
    });
  }

  async enqueueReportDiff(data: { analise_id: string; original: string; editado: string }) {
    return this.feedbackQueue.add('calculate-report-diff', data, {
      priority: 2, // Regular priority
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async enqueueRejectionAnalysis(data: { analise_id: string; motivo: string; aula_id: string }) {
    return this.feedbackQueue.add('analyze-rejection', data, {
      priority: 1, // High priority (feedback is critical)
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}
```

**Then** service suporta buscar, atualizar e enfileirar jobs de feedback

---

### AC6: Configurar Bull Queue para Feedback

**Given** precisamos processar feedback de forma assíncrona
**When** configuro módulo Bull:

**Arquivo:** `ressoa-backend/src/modules/analise/analise.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AnaliseController } from './analise.controller';
import { AnaliseService } from './services/analise.service';
import { FeedbackProcessor } from './processors/feedback.processor';
import { AulasModule } from '../aulas/aulas.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'feedback-queue',
    }),
    AulasModule,
    PrismaModule,
  ],
  controllers: [AnaliseController],
  providers: [AnaliseService, FeedbackProcessor],
  exports: [AnaliseService],
})
export class AnaliseModule {}
```

**Processor (Stub):** `ressoa-backend/src/modules/analise/processors/feedback.processor.ts`

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

@Processor('feedback-queue')
export class FeedbackProcessor {
  private readonly logger = new Logger(FeedbackProcessor.name);

  @Process('calculate-report-diff')
  async handleReportDiff(job: Job) {
    const { analise_id, original, editado } = job.data;

    this.logger.log(`Calculando diff para análise ${analise_id}`);

    // TODO Story 6.2+: Implementar cálculo real de diff usando @sanity/diff-match-patch
    // TODO: Armazenar diff em tabela FeedbackImplicito
    // TODO: Usar diff para treinar/refinar prompts via A/B testing

    // STUB: Log para demonstração
    this.logger.log(`Diff calculado (stub) - ${editado.length - original.length} caracteres de diferença`);

    return { success: true, analise_id };
  }

  @Process('analyze-rejection')
  async handleRejection(job: Job) {
    const { analise_id, motivo, aula_id } = job.data;

    this.logger.log(`Analisando rejeição para análise ${analise_id}`);

    // TODO Story 6.2+: Implementar análise de motivo de rejeição
    // TODO: Armazenar em tabela FeedbackExplicito
    // TODO: Usar motivo para identificar padrões de falha nos prompts

    // STUB: Log para demonstração
    this.logger.log(`Feedback explícito registrado (stub): "${motivo}"`);

    return { success: true, analise_id, motivo };
  }
}
```

**Then** Bull queue processa jobs de diff e rejeição em background

---

### AC7: Criar Página Frontend /aulas/:id/analise/edit

**Given** professor precisa editar relatório em rich-text editor
**When** crio página de edição:

**Arquivo:** `ressoa-frontend/src/pages/aulas/AulaAnaliseEditPage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from './components/RichTextEditor';
import { DiffViewer } from './components/DiffViewer';
import { RejectReportDialog } from './components/RejectReportDialog';
import api from '@/lib/api';

export function AulaAnaliseEditPage() {
  const { aulaId } = useParams<{ aulaId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [conteudo, setConteudo] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch analysis
  const { data: analise, isLoading, error } = useQuery({
    queryKey: ['analise', aulaId],
    queryFn: () => api.get(`/aulas/${aulaId}/analise`).then((res) => res.data),
  });

  // Initialize content
  useEffect(() => {
    if (analise) {
      // Use edited version if exists, otherwise original
      setConteudo(analise.relatorio_editado || analise.relatorio);
    }
  }, [analise]);

  // Save draft mutation (auto-save)
  const saveMutation = useMutation({
    mutationFn: (content: string) =>
      api.patch(`/analises/${analise.id}/relatorio`, {
        relatorio_editado: content
      }),
    onSuccess: () => {
      setLastSaved(new Date());
      setIsSaving(false);
    },
    onError: (error: any) => {
      setIsSaving(false);
      toast({
        title: 'Erro ao salvar',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      });
    },
  });

  // Approve mutation
  const aprovarMutation = useMutation({
    mutationFn: () => api.post(`/analises/${analise.id}/aprovar`),
    onSuccess: (res) => {
      toast({
        title: 'Relatório aprovado!',
        description: `Tempo de revisão: ${res.data.tempo_revisao}s`,
      });
      queryClient.invalidateQueries(['analise', aulaId]);
      navigate(`/aulas/${aulaId}/analise`);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao aprovar',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      });
    },
  });

  // Reject mutation
  const rejeitarMutation = useMutation({
    mutationFn: (motivo: string) =>
      api.post(`/analises/${analise.id}/rejeitar`, { motivo }),
    onSuccess: () => {
      toast({
        title: 'Relatório rejeitado',
        description: 'Feedback registrado com sucesso',
      });
      queryClient.invalidateQueries(['analise', aulaId]);
      navigate(`/aulas/${aulaId}/analise`);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao rejeitar',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      });
    },
  });

  // Auto-save handler
  const handleEditorChange = (content: string) => {
    setConteudo(content);
    setIsSaving(true);
    saveMutation.mutate(content);
  };

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

  const original = analise.relatorio;
  const hasChanges = conteudo !== original;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Relatório</h1>
          <p className="text-sm text-gray-600 mt-1">
            {analise.aula.titulo} - {analise.aula.turma.nome}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-gray-500">Salvando...</span>
          )}
          {lastSaved && !isSaving && (
            <span className="text-xs text-gray-500">
              Salvo às {lastSaved.toLocaleTimeString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório Pedagógico</CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={conteudo}
            onChange={handleEditorChange}
          />
        </CardContent>
      </Card>

      {/* Diff Viewer (toggle) */}
      {hasChanges && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiff(!showDiff)}
          >
            {showDiff ? 'Ocultar' : 'Mostrar'} Alterações
          </Button>
          {showDiff && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparação: Original vs Editado</CardTitle>
              </CardHeader>
              <CardContent>
                <DiffViewer original={original} modified={conteudo} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/aulas/${aulaId}/analise`)}
        >
          Cancelar
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowRejectDialog(true)}
        >
          Rejeitar Relatório
        </Button>
        <Button
          variant="default"
          onClick={() => aprovarMutation.mutate()}
          disabled={aprovarMutation.isPending}
        >
          {aprovarMutation.isPending ? 'Aprovando...' : 'Aprovar Relatório'}
        </Button>
      </div>

      {/* Reject Dialog */}
      <RejectReportDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={(motivo) => rejeitarMutation.mutate(motivo)}
        isPending={rejeitarMutation.isPending}
      />
    </div>
  );
}
```

**Then** página permite edição, visualização de diff, aprovação e rejeição

---

### AC8: Criar Componente RichTextEditor (TipTap)

**Given** preciso de editor rich-text para markdown/HTML
**When** crio componente com TipTap:

**Instalação:**
```bash
cd ressoa-frontend
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit use-debounce
```

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/RichTextEditor.tsx`

```tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, Heading2 } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  // Debounced onChange to prevent excessive API calls
  const debouncedOnChange = useDebouncedCallback(
    (newContent: string) => {
      onChange(newContent);
    },
    1000, // 1 second delay
    { maxWait: 3000 } // Save at most every 3 seconds
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedOnChange(html);
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg">
      {/* Toolbar */}
      <div className="flex gap-2 p-2 border-b bg-gray-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-gray-200' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-gray-200' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[400px] focus:outline-none"
      />
    </div>
  );
}
```

**Then** editor TipTap com auto-save debounced (1s delay, 3s max wait)

---

### AC9: Criar Componente DiffViewer

**Given** preciso mostrar diferenças entre original e editado
**When** crio componente de diff:

**Instalação:**
```bash
cd ressoa-frontend
npm install diff
```

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/DiffViewer.tsx`

```tsx
import { diffLines } from 'diff';
import { cn } from '@/lib/utils';

interface DiffViewerProps {
  original: string;
  modified: string;
}

export function DiffViewer({ original, modified }: DiffViewerProps) {
  const diff = diffLines(original, modified);

  return (
    <div className="font-mono text-sm border rounded-lg overflow-hidden">
      {diff.map((part, idx) => (
        <div
          key={idx}
          className={cn(
            'px-4 py-2 border-b last:border-b-0',
            part.added && 'bg-green-50 text-green-900 border-l-4 border-l-green-500',
            part.removed && 'bg-red-50 text-red-900 line-through border-l-4 border-l-red-500',
            !part.added && !part.removed && 'bg-white text-gray-700'
          )}
        >
          <pre className="whitespace-pre-wrap">{part.value}</pre>
        </div>
      ))}
    </div>
  );
}
```

**Then** diff viewer mostra linhas adicionadas (verde), removidas (vermelho) e inalteradas

---

### AC10: Criar Componente RejectReportDialog

**Given** preciso de modal para capturar motivo de rejeição
**When** crio dialog com React Hook Form:

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/RejectReportDialog.tsx`

```tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RejectReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => void;
  isPending: boolean;
}

export function RejectReportDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: RejectReportDialogProps) {
  const [motivo, setMotivo] = useState('');
  const isValid = motivo.length >= 10;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(motivo);
      setMotivo(''); // Reset
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeitar Relatório</DialogTitle>
          <DialogDescription>
            Por favor, descreva o motivo da rejeição para nos ajudar a melhorar a qualidade dos relatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="motivo">Motivo da Rejeição</Label>
          <Textarea
            id="motivo"
            placeholder="Ex: Relatório muito genérico, faltou detalhar habilidades BNCC trabalhadas..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            Mínimo 10 caracteres ({motivo.length}/10)
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isPending}
          >
            {isPending ? 'Rejeitando...' : 'Confirmar Rejeição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Then** dialog valida mínimo 10 caracteres e captura feedback explícito

---

### AC11: Adicionar Botão "Editar Relatório" na Story 6.1

**Given** a página de visualização (Story 6.1) precisa link para edição
**When** modifico componente RelatorioTab:

**Arquivo:** `ressoa-frontend/src/pages/aulas/components/RelatorioTab.tsx` (MODIFICAR)

Atualizar seção de ações (linha ~505-513):

```tsx
{/* Ações: Editar | Aprovar */}
<div className="flex gap-4">
  <Button
    variant="outline"
    onClick={() => navigate('edit')} // Navega para /aulas/{aulaId}/analise/edit
  >
    Editar Relatório
  </Button>
  <Button
    variant="default"
    onClick={() => {
      // TODO Story 6.2: Aprovar direto (sem editar)
      navigate('edit'); // Por enquanto, redireciona para edit
    }}
  >
    Aprovar Sem Editar
  </Button>
</div>
```

**Then** botões navegam para página de edição

---

### AC12: Adicionar Rota no React Router

**Given** preciso de rota `/aulas/:aulaId/analise/edit`
**When** adiciono rota:

**Arquivo:** `ressoa-frontend/src/App.tsx` (ou onde rotas estão definidas)

```tsx
import { AulaAnaliseEditPage } from './pages/aulas/AulaAnaliseEditPage';

// ... dentro das rotas protegidas
<Route path="/aulas/:aulaId/analise" element={<AulaAnalisePage />} />
<Route path="/aulas/:aulaId/analise/edit" element={<AulaAnaliseEditPage />} />
```

**Then** rota de edição está acessível

---

### AC13: Teste End-to-End - Workflow Completo de Edição e Aprovação

**Given** tenho uma análise em AGUARDANDO_REVISAO
**When** sigo o fluxo completo:

1. Acesso `/aulas/{aulaId}/analise` → vejo relatório original (Story 6.1)
2. Clico "Editar Relatório" → redirecionado para `/aulas/{aulaId}/analise/edit`
3. Modifico texto no editor TipTap → auto-save após 1-3s (debounced)
4. Vejo "Salvando..." → "Salvo às 14:35:22"
5. Clico "Mostrar Alterações" → vejo diff (verde=adicionado, vermelho=removido)
6. Clico "Aprovar Relatório" → POST `/analises/{analiseId}/aprovar`
7. Backend:
   - Atualiza `status = APROVADO`
   - Calcula `tempo_revisao` (ex: 180s = 3 minutos)
   - Enfileira job `calculate-report-diff` (feedback implícito)
   - Atualiza `Aula.status = APROVADA`
8. Recebo toast: "Relatório aprovado! Tempo de revisão: 180s"
9. Redirecionado para `/aulas/{aulaId}/analise` (visualização)

**Then** workflow de edição e aprovação funciona end-to-end

---

### AC14: Teste End-to-End - Workflow de Rejeição

**Given** tenho uma análise em AGUARDANDO_REVISAO
**When** sigo fluxo de rejeição:

1. Acesso `/aulas/{aulaId}/analise/edit`
2. Clico "Rejeitar Relatório" → abre modal
3. Insiro motivo: "Relatório muito genérico, faltou detalhar habilidades BNCC trabalhadas" (>10 chars)
4. Clico "Confirmar Rejeição" → POST `/analises/{analiseId}/rejeitar`
5. Backend:
   - Atualiza `status = REJEITADO`
   - Salva `motivo_rejeicao`
   - Enfileira job `analyze-rejection` (feedback explícito)
   - Atualiza `Aula.status = REJEITADA`
6. Recebo toast: "Relatório rejeitado. Feedback registrado com sucesso"
7. Redirecionado para `/aulas/{aulaId}/analise`

**Then** workflow de rejeição funciona end-to-end com feedback explícito capturado

---

### AC15: Teste de Permissões - Apenas Professor Owner Pode Editar

**Given** tenho análise do Professor A
**When** Professor B tenta acessar `/aulas/{aulaId}/analise/edit`
**Then** recebo `403 Forbidden` com mensagem "Você não tem acesso a esta análise"

---

### AC16: Teste de Validação - Status Validation

**Given** tenho análise já aprovada (`status = APROVADO`)
**When** tento PATCH `/analises/{analiseId}/relatorio`
**Then** recebo `400 Bad Request` com mensagem "Relatório já foi aprovado ou rejeitado"

**Given** tenho análise já rejeitada (`status = REJEITADO`)
**When** tento POST `/analises/{analiseId}/aprovar`
**Then** recebo `400 Bad Request` com mensagem "Análise já foi processada"

---

## Tasks / Subtasks

- [x] **AC1: Confirmar campos no schema Prisma**
  - [x] Verificar se `relatorio_editado`, `aprovado_em`, `rejeitado_em`, `motivo_rejeicao`, `tempo_revisao` existem
  - [x] Se não existirem, criar migration `npx prisma migrate dev --name add-analise-approval-fields`

- [x] **AC2: Criar endpoint PATCH /api/v1/analises/:id/relatorio**
  - [x] Implementar método `editarRelatorio` no AnaliseApprovalController
  - [x] Criar DTO `EditarRelatorioDto` com validação (min 10 chars)
  - [x] Validar permissões: multi-tenancy (escola_id) + status (AGUARDANDO_REVISAO)
  - [x] Retornar resposta JSON estruturada

- [x] **AC3: Criar endpoint POST /api/v1/analises/:id/aprovar**
  - [x] Implementar método `aprovarRelatorio` no AnaliseApprovalController
  - [x] Calcular `tempo_revisao` (Date.now() - created_at) em segundos
  - [x] Atualizar status da Análise para APROVADO
  - [x] Atualizar status da Aula para APROVADA
  - [x] Enfileirar job `calculate-report-diff` se houver edição

- [x] **AC4: Criar endpoint POST /api/v1/analises/:id/rejeitar**
  - [x] Implementar método `rejeitarRelatorio` no AnaliseApprovalController
  - [x] Criar DTO `RejeitarRelatorioDto` com validação (min 10 chars, max 500 chars)
  - [x] Atualizar status da Análise para REJEITADO
  - [x] Atualizar status da Aula para REJEITADA
  - [x] Enfileirar job `analyze-rejection` com motivo

- [x] **AC5: Implementar métodos no AnaliseService**
  - [x] Criar método `findOne(analiseId)` com includes (aula, turma, professor)
  - [x] Criar método `update(analiseId, data)` para atualização parcial
  - [x] Criar método `enqueueReportDiff(data)` para enfileirar job Bull
  - [x] Criar método `enqueueRejectionAnalysis(data)` para enfileirar job Bull

- [x] **AC6: Configurar Bull Queue para feedback**
  - [x] Registrar `feedback-queue` no AnaliseModule
  - [x] Criar `FeedbackProcessor` com handlers @Process
  - [x] Implementar handler `calculate-report-diff` (stub com log)
  - [x] Implementar handler `analyze-rejection` (stub com log)
  - [x] Configurar retry 3x com exponential backoff

- [ ] **AC7: Criar página frontend /aulas/:id/analise/edit**
  - [ ] Criar `AulaAnaliseEditPage.tsx` com estrutura completa
  - [ ] Integrar React Query para fetch e mutations
  - [ ] Implementar auto-save com indicador visual (Salvando... / Salvo às...)
  - [ ] Adicionar botões: Cancelar, Rejeitar, Aprovar

- [ ] **AC8: Criar componente RichTextEditor (TipTap)**
  - [ ] Instalar dependências: `@tiptap/react @tiptap/starter-kit use-debounce`
  - [ ] Criar componente `RichTextEditor.tsx` com StarterKit
  - [ ] Implementar toolbar: Bold, Italic, Heading2, BulletList
  - [ ] Configurar debounced onChange (1s delay, 3s max wait)
  - [ ] Estilizar com Tailwind prose classes

- [ ] **AC9: Criar componente DiffViewer**
  - [ ] Instalar dependência: `diff`
  - [ ] Criar componente `DiffViewer.tsx` usando `diffLines`
  - [ ] Estilizar: verde (adicionado), vermelho (removido), branco (inalterado)
  - [ ] Adicionar border-l-4 para destaque de mudanças

- [ ] **AC10: Criar componente RejectReportDialog**
  - [ ] Criar `RejectReportDialog.tsx` com shadcn/ui Dialog
  - [ ] Implementar Textarea com validação (min 10 chars)
  - [ ] Adicionar contador de caracteres
  - [ ] Implementar botões: Cancelar, Confirmar Rejeição

- [ ] **AC11: Modificar RelatorioTab (Story 6.1)**
  - [ ] Atualizar botões de ação: "Editar Relatório", "Aprovar Sem Editar"
  - [ ] Configurar navegação para `/aulas/{aulaId}/analise/edit`

- [ ] **AC12: Adicionar rota no React Router**
  - [ ] Adicionar `<Route path="/aulas/:aulaId/analise/edit" element={<AulaAnaliseEditPage />} />`

- [ ] **AC13-16: Testes end-to-end**
  - [ ] Testar workflow completo de edição + aprovação
  - [ ] Testar workflow de rejeição com motivo
  - [ ] Testar permissões (403 para outro professor)
  - [ ] Testar validação de status (400 para análise já aprovada/rejeitada)

---

## Dev Notes

### Architectural Compliance

**Backend (NestJS):**
- ✅ REST API pattern: PATCH `/analises/:id/relatorio`, POST `/analises/:id/aprovar`, POST `/analises/:id/rejeitar`
- ✅ Authentication: JwtAuthGuard + RolesGuard('PROFESSOR')
- ✅ Authorization: Verify escola_id via AulasService (multi-tenancy)
- ✅ DTOs with class-validator: `@IsString()`, `@MinLength(10)`, `@MaxLength(500)`
- ✅ Prisma ORM: Update operations, status transitions
- ✅ Bull Queue (Redis): Background jobs for feedback processing
- ✅ Error handling: HTTP status codes (400, 403, 404)

**Frontend (React + shadcn/ui):**
- ✅ React Query for data fetching and mutations
- ✅ React Router v6 for navigation
- ✅ shadcn/ui components: Card, Button, Dialog, Textarea, Alert
- ✅ TipTap editor for rich-text editing (StarterKit extensions)
- ✅ Auto-save with debouncing (use-debounce library)
- ✅ Diff visualization with `diff` library (line-by-line comparison)
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling

**Design System Compliance (from ux-design-specification.md):**
- ✅ Colors: Green (#10B981 - added), Red (#EF4444 - removed), Tech Blue (#2563EB - buttons)
- ✅ Typography: Montserrat (headings), Inter (body), monospace (diff viewer)
- ✅ Spacing: Consistent padding (p-4, p-6), gaps (gap-3, gap-4)
- ✅ Accessibility: Dialog with keyboard navigation, focus management, touch targets 44px

### Library/Framework Requirements

**Backend Dependencies (already installed):**
- `@nestjs/common`, `@nestjs/core` ✅
- `@nestjs/bull` (Bull queue integration) ✅
- `@prisma/client` ✅
- `class-validator`, `class-transformer` ✅

**Frontend Dependencies:**

**Already installed:**
- `react`, `react-dom` ✅
- `react-router-dom` ✅
- `@tanstack/react-query` ✅
- `axios` ✅
- `shadcn/ui` components ✅
- `lucide-react` (icons) ✅

**NEW installations required:**
```bash
cd ressoa-frontend
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit use-debounce diff
```

**Package versions (researched):**
- `@tiptap/react`: 3.19.0 (latest stable, Feb 2026)
- `@tiptap/starter-kit`: 3.19.0
- `use-debounce`: 10.x (latest)
- `diff`: 7.x (latest)

### File Structure Requirements

**Backend:**
```
ressoa-backend/src/modules/analise/
├── analise.controller.ts (ADD 3 endpoints: PATCH relatorio, POST aprovar, POST rejeitar)
├── analise.module.ts (ADD BullModule.registerQueue)
├── services/
│   └── analise.service.ts (ADD findOne, update, enqueueReportDiff, enqueueRejectionAnalysis)
├── processors/
│   └── feedback.processor.ts (NEW - Bull job handlers)
├── dto/
│   ├── editar-relatorio.dto.ts (NEW)
│   └── rejeitar-relatorio.dto.ts (NEW)
└── __tests__/
    └── analise.controller.spec.ts (ADD tests for new endpoints)
```

**Frontend:**
```
ressoa-frontend/src/pages/aulas/
├── AulaAnaliseEditPage.tsx (NEW - main edit page)
├── components/
│   ├── RichTextEditor.tsx (NEW - TipTap integration)
│   ├── DiffViewer.tsx (NEW - diff visualization)
│   ├── RejectReportDialog.tsx (NEW - rejection modal)
│   └── RelatorioTab.tsx (MODIFY - add edit button)
```

### Testing Requirements

**Unit Tests (Backend):**
- AnaliseController.editarRelatorio()
  - ✅ Saves draft for professor owner
  - ✅ Throws 403 for non-owner professor
  - ✅ Throws 400 if status != AGUARDANDO_REVISAO
  - ✅ Throws 404 for non-existent analise
- AnaliseController.aprovarRelatorio()
  - ✅ Approves analysis and updates aula status
  - ✅ Calculates tempo_revisao correctly
  - ✅ Enqueues diff job if relatorio_editado exists
  - ✅ Throws 400 if already approved/rejected
- AnaliseController.rejeitarRelatorio()
  - ✅ Rejects analysis and stores motivo
  - ✅ Enqueues rejection analysis job
  - ✅ Throws 400 if already processed
- FeedbackProcessor
  - ✅ Handles calculate-report-diff job (stub)
  - ✅ Handles analyze-rejection job (stub)
  - ✅ Retries 3x on failure (Bull config)

**E2E Tests (Frontend):**
- Navigate to /aulas/:id/analise/edit
- Edit report in TipTap editor
- Verify auto-save triggers (debounced)
- Verify "Salvando..." / "Salvo às..." indicator
- Verify diff viewer shows changes (green/red)
- Approve report → verify redirect + toast
- Reject report → verify modal + toast + redirect
- Verify 403 error for non-owner professor
- Verify 400 error for already approved/rejected analysis

### Previous Story Intelligence

**From Story 6.1 (Visualização de Análise Completa - in review):**

✅ **What works:**
- AnaliseController with GET endpoint exists
- AnaliseService.findByAulaId() with full relations (aula, turma, professor, transcricao)
- Multi-tenancy validation via AulasService.findOne(aulaId, escola_id)
- Frontend page AulaAnalisePage with tabs (Relatório, Exercícios, Sugestões)
- shadcn/ui components (Card, Tabs, Badge, Alert) integrated
- React Query for data fetching
- Markdown rendering with react-markdown

**Key Learnings to Apply:**
1. **Permission Pattern:** Always verify `escola_id` via AulasService, then check professor ownership
2. **Error Handling:** Use NestJS exceptions (NotFoundException, ForbiddenException, BadRequestException)
3. **React Query Pattern:** Use `queryKey: ['analise', aulaId]` for consistency, invalidate after mutations
4. **Toast Notifications:** Use shadcn/ui toast for success/error feedback
5. **Component Structure:** Keep components small, single responsibility (RichTextEditor, DiffViewer, Dialog)

**From Story 5.5 (Backend - Prompt 5 + Analysis Worker - DONE):**

✅ **What exists:**
- Bull queue infrastructure with Redis
- AnalysisProcessor with @Process decorators
- Retry 3x with exponential backoff pattern
- Job lifecycle: created → active → completed/failed
- Prisma ORM patterns for updating Analise entity

**Patterns to Reuse:**
1. **Bull Queue Pattern:**
   ```typescript
   await this.queue.add('job-name', data, {
     priority: 2,
     attempts: 3,
     backoff: { type: 'exponential', delay: 2000 }
   });
   ```

2. **Processor Pattern:**
   ```typescript
   @Processor('queue-name')
   export class MyProcessor {
     @Process('job-name')
     async handleJob(job: Job) {
       const { data } = job;
       // Process logic
       return { success: true };
     }
   }
   ```

**From Story 2.3 (Frontend - Cadastro de Planejamento - DONE):**

✅ **What works:**
- React Hook Form + zod validation
- Multi-step form wizard with useState
- Auto-save pattern (though not debounced - we'll improve)
- shadcn/ui Dialog, Select, Badge components

**Patterns to Reuse:**
1. **Dialog Pattern:**
   ```tsx
   <Dialog open={open} onOpenChange={setOpen}>
     <DialogContent>
       <DialogHeader>
         <DialogTitle>Title</DialogTitle>
       </DialogHeader>
       {/* Content */}
       <DialogFooter>
         <Button>Action</Button>
       </DialogFooter>
     </DialogContent>
   </Dialog>
   ```

2. **Form Validation Pattern:**
   ```typescript
   const schema = z.object({
     field: z.string().min(10, 'Message'),
   });
   ```

### Git Intelligence Summary

**Recent commits (last 5):**
1. `fe935eb` - feat(story-6.1): implement complete analysis visualization UI (DONE - in review)
2. `1754062` - chore(story-5.5): update status to done after code review fixes (DONE)
3. `8cc92d7` - fix(story-5.5): code review - 9 issues fixed (DONE)
4. `e89885a` - feat(story-5.5): implement Prompt 5 and AnalysisProcessor (DONE)
5. `822bf18` - feat(story-5.4): implement pedagogical report and exercise generation (DONE)

**Current codebase patterns:**
- ✅ Commit messages follow conventional commits: `feat(story-X.Y): description`
- ✅ Backend modules follow NestJS standard structure (controller → service → DTO → processor)
- ✅ Frontend uses functional components with hooks
- ✅ TypeScript strict mode enabled
- ✅ ESLint + Prettier configured
- ✅ Tests co-located with implementation files

**Established Patterns:**
1. **Controller Pattern:**
   - Guards: `@UseGuards(JwtAuthGuard, RolesGuard)`
   - Decorators: `@CurrentUser()`, `@Roles('PROFESSOR')`
   - Error handling: Throw NestJS exceptions with clear messages

2. **Service Pattern:**
   - Inject PrismaService via constructor
   - Use Prisma relations with `include`
   - Return type-safe Prisma entities

3. **Frontend Component Pattern:**
   - Use shadcn/ui components consistently
   - React Query for server state
   - useState for local UI state
   - useMutation for API mutations with onSuccess/onError

---

## Latest Technical Information (Web Research - 2026)

### TipTap Editor (Latest Version: 3.19.0)

**Installation:**
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
```

**Best Practices:**
- Use `useEditor` hook with dependencies array for content updates
- Export content via `editor.getHTML()` or `editor.getJSON()`
- StarterKit includes: Bold, Italic, Heading, BulletList, OrderedList, Code, Strike
- For markdown support, add `@tiptap/extension-markdown`
- Debounce `onUpdate` callback to prevent excessive re-renders

**Example Integration:**
```typescript
const editor = useEditor({
  extensions: [StarterKit],
  content: initialContent,
  onUpdate: ({ editor }) => {
    debouncedSave(editor.getHTML());
  },
});
```

### Diff Library (@sanity/diff-match-patch - Latest: 3.2.0)

**Why @sanity/diff-match-patch over google-diff-match-patch:**
- More actively maintained (9 months old vs 7 years old)
- TypeScript support
- Modern JavaScript API
- Bug fixes included

**Installation:**
```bash
npm install diff  # OR @sanity/diff-match-patch
```

**Recommended:** Use `diff` library (npm package) for simplicity:
```typescript
import { diffLines } from 'diff';

const diff = diffLines(original, modified);
// Returns: [{ value: string, added?: boolean, removed?: boolean }]
```

### Auto-Save Pattern (use-debounce - Latest: 10.x)

**Installation:**
```bash
npm install use-debounce
```

**Best Practice - useDebouncedCallback:**
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSave = useDebouncedCallback(
  async (content) => {
    await api.patch(`/analises/${id}/relatorio`, { content });
  },
  1000,  // wait: 1000ms
  { maxWait: 3000 }  // maxWait: save at most every 3 seconds
);
```

**Timing Recommendations:**
- **Search input:** 300ms delay, 1000ms maxWait
- **Form fields:** 500ms delay, 2000ms maxWait
- **Rich text editor (reports):** 1000ms delay, 3000ms maxWait ✅
- **Collaborative editing:** 2000ms delay, 5000ms maxWait

**Why these timings:**
- 1000ms delay: Balance between UX (responsive feel) and API load
- 3000ms maxWait: Ensures save every 3 seconds max, even with continuous typing
- Prevents data loss while minimizing API calls

---

## Project Context Reference

For comprehensive project rules, patterns, and conventions that MUST be followed during implementation, refer to:

📄 **`/home/luisneto98/Documentos/Code/professor-analytics/project-context.md`**

This file contains:
- Critical coding standards and patterns
- Multi-tenancy enforcement rules (escola_id validation)
- Security requirements (JWT, RBAC, RLS)
- Error handling patterns (NestJS exceptions)
- Testing conventions (unit + E2E)
- File naming and organization rules

**IMPORTANT:** Read project-context.md BEFORE starting implementation to avoid rework.

---

## References

All technical details extracted from:

1. **[Source: _bmad-output/planning-artifacts/epics.md#Story-6.2]**
   - Complete acceptance criteria with code examples
   - API endpoints: PATCH relatorio, POST aprovar, POST rejeitar
   - DTOs: EditarRelatorioDto, RejeitarRelatorioDto
   - Frontend components: Editor, DiffViewer, RejectDialog

2. **[Source: _bmad-output/planning-artifacts/architecture.md]**
   - Rich-text editor: TipTap (AD-X.X)
   - Diff library: Google Diff Match Patch (AD-X.X)
   - State management: Zustand (UI) + React Query (server)
   - Queue: Bull + Redis for background jobs
   - API pattern: REST /api/v1/ with DTOs + class-validator
   - Auth: JWT + Passport guards

3. **[Source: _bmad-output/planning-artifacts/ux-design-specification.md]**
   - Design principles: Transparência Radical, Resiliência por Design
   - Auto-save UX: Visual indicator (Salvando... / Salvo às...)
   - Diff visualization: Green (added), Red (removed)
   - Modal patterns: shadcn/ui Dialog
   - Accessibility: WCAG AAA, touch targets 44px

4. **[Source: _bmad-output/planning-artifacts/estrategia-prompts-ia-2026-02-08.md]**
   - Quality target: 90%+ reports usable without significant editing
   - Metrics: tempo_revisao <5min, approval rate >80%
   - Feedback loop: Implicit (diffs) + Explicit (rejection reasons)
   - A/B testing: Use diffs to refine prompts continuously

5. **[Source: ressoa-backend/prisma/schema.prisma]**
   - Analise entity: relatorio_texto, relatorio_editado, status, aprovado_em, rejeitado_em, motivo_rejeicao
   - StatusAnalise enum: AGUARDANDO_REVISAO, APROVADO, REJEITADO
   - Relations: aula, transcricao, planejamento

6. **[Source: Story 6.1 - visualizacao-de-analise-completa.md]**
   - AnaliseController with GET /aulas/:id/analise
   - AnaliseService.findByAulaId() with full relations
   - Multi-tenancy validation pattern
   - React Query integration

7. **[Source: Story 5.5 - backend-prompt-5-analysis-worker.md]**
   - Bull queue infrastructure
   - Processor pattern with @Process decorators
   - Retry 3x with exponential backoff
   - Job lifecycle management

8. **[Source: Web Research - TipTap, diff, use-debounce (2026)]**
   - @tiptap/react@3.19.0 latest version
   - diff library (npm) for line-by-line comparison
   - use-debounce for auto-save (1000ms delay, 3000ms maxWait)
   - Best practices for React integration

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Backend (to be created/modified):**
- ressoa-backend/src/modules/analise/analise.controller.ts (ADD 3 endpoints)
- ressoa-backend/src/modules/analise/analise.module.ts (ADD BullModule)
- ressoa-backend/src/modules/analise/services/analise.service.ts (ADD methods)
- ressoa-backend/src/modules/analise/processors/feedback.processor.ts (NEW)
- ressoa-backend/src/modules/analise/dto/editar-relatorio.dto.ts (NEW)
- ressoa-backend/src/modules/analise/dto/rejeitar-relatorio.dto.ts (NEW)
- ressoa-backend/src/modules/analise/__tests__/analise.controller.spec.ts (ADD tests)
- ressoa-backend/prisma/schema.prisma (VERIFY fields, maybe migration)

**Frontend (to be created/modified):**
- ressoa-frontend/src/pages/aulas/AulaAnaliseEditPage.tsx (NEW)
- ressoa-frontend/src/pages/aulas/components/RichTextEditor.tsx (NEW)
- ressoa-frontend/src/pages/aulas/components/DiffViewer.tsx (NEW)
- ressoa-frontend/src/pages/aulas/components/RejectReportDialog.tsx (NEW)
- ressoa-frontend/src/pages/aulas/components/RelatorioTab.tsx (MODIFY - add edit button)
- ressoa-frontend/src/App.tsx (MODIFY - add route)
- ressoa-frontend/package.json (MODIFY - add dependencies)
