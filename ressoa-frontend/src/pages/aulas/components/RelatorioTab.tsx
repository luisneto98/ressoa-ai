import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GradientCard } from '@/components/ui/gradient-card';
import { AIBadge } from '@/components/ui/ai-badge';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { CoberturaBadge } from './CoberturaBadge';
import { QualitativaCard } from './QualitativaCard';
import { CoberturaBNCCChart } from './CoberturaBNCCChart';
import { useToast } from '@/hooks/use-toast';
import { usePdfExport } from '@/hooks/usePdfExport';
import { RelatorioPDF } from '@/lib/pdf/relatorio-pdf';
import api from '@/lib/api';
import { getCoberturaHeaderLabel } from '@/lib/cobertura-helpers';
import {
  Star,
  ThumbsUp,
  AlertTriangle,
  BookOpen,
  Brain,
  Presentation,
  Users,
  MessageCircle,
  Link2,
  Languages,
  Pencil,
  CheckCircle2,
  Download,
  Sparkles,
} from 'lucide-react';

interface RelatorioTabProps {
  analise: {
    id: string;
    aula: {
      id: string;
      titulo: string;
      data_aula: string;
      turma: {
        nome: string;
        serie: string;
        disciplina: string;
        curriculo_tipo?: 'BNCC' | 'CUSTOM';
      };
    };
    cobertura_bncc: {
      habilidades: Array<any>;
    };
    analise_qualitativa: {
      taxonomia_bloom: any;
      metodologia: any;
      adequacao_linguistica: any;
      engajamento: any;
      clareza_comunicacao: any;
      coerencia_narrativa: any;
      resumo_geral: any;
    };
    relatorio: string;
  };
}

function NotaCircle({ nota }: { nota: number }) {
  const color = nota >= 8 ? 'from-green-500 to-emerald-600 text-white'
    : nota >= 6 ? 'from-yellow-400 to-amber-500 text-white'
    : 'from-red-400 to-rose-500 text-white';

  return (
    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
      <div className="text-center leading-tight">
        <span className="text-2xl font-bold">{nota}</span>
        <span className="text-xs opacity-80 block">/10</span>
      </div>
    </div>
  );
}

export function RelatorioTab({ analise }: RelatorioTabProps) {
  const navigate = useNavigate();
  const { aulaId } = useParams<{ aulaId: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { exportPDF, isGenerating } = usePdfExport();

  const aprovarMutation = useMutation({
    mutationFn: () => api.post(`/analises/${analise.id}/aprovar`),
    onSuccess: (res) => {
      toast({
        title: 'Relatório aprovado!',
        description: `Tempo de revisão: ${res.data.tempo_revisao}s`,
      });
      queryClient.invalidateQueries({ queryKey: ['analise', aulaId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao aprovar',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      });
    },
  });

  const resumo = analise.analise_qualitativa.resumo_geral;
  const qual = analise.analise_qualitativa;
  const curriculoTipo = analise.aula?.turma?.curriculo_tipo || 'BNCC'; // Default to BNCC for backward compat
  const comentarioSintetico = (analise.analise_qualitativa as any).comentario_sintetico;

  const handleExportPDF = async () => {
    // Generate safe filename
    const aulaTitle = analise.aula.titulo.replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date(analise.aula.data_aula).toISOString().split('T')[0];
    const filename = `Relatorio_${aulaTitle}_${date}.pdf`;

    await exportPDF(
      <RelatorioPDF
        aula={analise.aula}
        cobertura={analise.cobertura_bncc}
        qualitativa={analise.analise_qualitativa}
        relatorio={analise.relatorio}
        metadata={{
          tempo_processamento_ms: (analise as any).metadata?.tempo_processamento_ms || 0,
          custo_total_usd: (analise as any).metadata?.custo_total_usd || 0,
          created_at: (analise as any).metadata?.created_at || new Date().toISOString(),
        }}
      />,
      filename
    );
  };

  // Format date for display
  const formattedDate = new Date(analise.aula.data_aula).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* AC1: Header com GradientCard Premium */}
      <GradientCard
        title="Relatório de Análise Pedagógica"
        description={`Turma: ${analise.aula.turma.nome} | Data: ${formattedDate} | Disciplina: ${analise.aula.turma.disciplina}`}
        headerActions={
          <AIBadge variant="processing" size="md">
            Gerado por IA Ressoa
          </AIBadge>
        }
      />

      {/* Resumo Geral - Hero Card */}
      {resumo && (
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-r from-deep-navy to-deep-navy/90 p-6">
            <div className="flex items-center gap-6">
              <NotaCircle nota={resumo.nota_geral} />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-montserrat font-bold text-white mb-1">Resumo da Análise</h2>
                <p className="text-white/70 text-sm">Avaliação geral da aula com base em múltiplos critérios pedagógicos</p>
              </div>
            </div>
          </div>
          <CardContent className="pt-5 pb-5">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pontos Fortes */}
              {resumo.pontos_fortes?.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-3">
                    <ThumbsUp className="h-4 w-4" />
                    Pontos Fortes
                  </h3>
                  <ul className="space-y-2">
                    {resumo.pontos_fortes.map((ponto: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {ponto}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Pontos de Atenção */}
              {resumo.pontos_atencao?.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700 mb-3">
                    <AlertTriangle className="h-4 w-4" />
                    Pontos de Atenção
                  </h3>
                  <ul className="space-y-2">
                    {resumo.pontos_atencao.map((ponto: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="h-4 w-4 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="block h-1.5 w-1.5 rounded-full bg-amber-400" />
                        </span>
                        {ponto}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comentário Sintético (V3) */}
      {comentarioSintetico && (
        <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
          <CardContent className="pt-5 pb-5">
            <h3 className="text-sm font-semibold text-cyan-900 mb-2 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Resumo da Aula
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed italic">
              "{comentarioSintetico}"
            </p>
          </CardContent>
        </Card>
      )}

      {/* AC3: Gráfico de Cobertura com Recharts */}
      {analise.cobertura_bncc?.habilidades?.length > 0 && (
        <CoberturaBNCCChart
          habilidades={analise.cobertura_bncc.habilidades}
          curriculo_tipo={curriculoTipo}
        />
      )}

      {/* Cobertura de Objetivos (BNCC ou Custom) - AC1 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-cyan-ai" />
            {getCoberturaHeaderLabel(curriculoTipo)}
            {analise.cobertura_bncc?.habilidades?.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs font-normal">
                {analise.cobertura_bncc.habilidades.length} {curriculoTipo === 'CUSTOM' ? 'objetivo' : 'habilidade'}{analise.cobertura_bncc.habilidades.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analise.cobertura_bncc?.habilidades?.length > 0 ? (
            analise.cobertura_bncc.habilidades.map((hab, idx) => (
              <CoberturaBadge
                key={hab.codigo || idx}
                curriculo_tipo={curriculoTipo}
                codigo={hab.codigo}
                descricao={hab.descricao}
                nivel={hab.nivel_cobertura}
                evidencias={hab.evidencias}
                unidade_tematica={hab.unidade_tematica}
                nivel_bloom_planejado={hab.nivel_bloom_planejado}
                nivel_bloom_detectado={hab.nivel_bloom_detectado}
                criterios_evidencia={hab.criterios_evidencia}
                criterios_atendidos={hab.criterios_atendidos}
                tempo_estimado_minutos={hab.tempo_estimado_minutos}
                adequacao_nivel_cognitivo={hab.adequacao_nivel_cognitivo}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {curriculoTipo === 'CUSTOM' ? 'Nenhum objetivo identificado na análise.' : 'Nenhuma habilidade identificada na análise.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Análise Qualitativa - Grid 2 colunas */}
      <div>
        <h2 className="text-lg font-montserrat font-semibold text-deep-navy mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-focus-orange" />
          Análise Qualitativa
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <QualitativaCard
            title="Taxonomia de Bloom"
            icon={<Brain className="h-4 w-4 text-purple-500" />}
            data={qual.taxonomia_bloom}
          />
          <QualitativaCard
            title="Metodologia"
            icon={<Presentation className="h-4 w-4 text-tech-blue" />}
            data={qual.metodologia}
          />
          <QualitativaCard
            title="Engajamento"
            icon={<Users className="h-4 w-4 text-green-600" />}
            data={qual.engajamento}
          />
          <QualitativaCard
            title="Clareza e Comunicação"
            icon={<MessageCircle className="h-4 w-4 text-cyan-ai" />}
            data={qual.clareza_comunicacao}
          />
          <QualitativaCard
            title="Coerência Narrativa"
            icon={<Link2 className="h-4 w-4 text-amber-500" />}
            data={qual.coerencia_narrativa}
          />
          <QualitativaCard
            title="Adequação Linguística"
            icon={<Languages className="h-4 w-4 text-rose-500" />}
            data={qual.adequacao_linguistica}
          />
        </div>
      </div>

      {/* Relatório Textual */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Relatório da Aula</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <ReactMarkdown>{analise.relatorio}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* AC4: Seção "Gerado por IA Ressoa" - Responsiva */}
      <div
        className="p-4 md:p-6 bg-gray-50 border-l-4 border-cyan-ai rounded-lg"
        role="complementary"
        aria-label="Informações sobre geração automática do relatório"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <Sparkles className="w-6 h-6 text-cyan-ai shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-inter font-medium text-sm text-gray-700">
              Este relatório foi gerado automaticamente pela IA Ressoa
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Análise pedagógica baseada em 5 prompts especializados com fundamentos da Taxonomia de Bloom
            </p>
          </div>
          <AIBadge variant="processing" size="md" className="w-full md:w-auto">
            Confiança: {Math.round(((analise as any).confianca || 0.92) * 100)}%
          </AIBadge>
        </div>
      </div>

      {/* AC8: Ações - Responsivas (vertical no mobile, horizontal no desktop) */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => navigate('edit')}
          className="gap-2 w-full sm:w-auto"
        >
          <Pencil className="h-4 w-4" />
          Editar Relatório
        </Button>
        <Button
          variant="outline"
          onClick={handleExportPDF}
          disabled={isGenerating}
          className="gap-2 w-full sm:w-auto"
        >
          <Download className="h-4 w-4" />
          {isGenerating ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
        <Button
          variant="default"
          onClick={() => aprovarMutation.mutate()}
          disabled={aprovarMutation.isPending}
          className="gap-2 w-full sm:w-auto"
        >
          <CheckCircle2 className="h-4 w-4" />
          {aprovarMutation.isPending ? 'Aprovando...' : 'Aprovar Sem Editar'}
        </Button>
      </div>
    </div>
  );
}
