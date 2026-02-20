import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { AulaHeader } from './components/AulaHeader';
import { RelatorioTab } from './components/RelatorioTab';
import { ExerciciosTab } from './components/ExerciciosTab';
import { SugestoesTab } from './components/SugestoesTab';
import { AlertasSection } from './components/AlertasSection';
import { AlertasResumo } from './components/AlertasResumo';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { normalizeAnaliseV3 } from '@/lib/analise-adapter';
import type { AderenciaObjetivoJson } from '@/lib/analise-adapter';

// MEDIUM FIX: TypeScript interface for API response (type safety)
interface AnaliseResponse {
  id: string;
  aula: {
    id: string;
    titulo: string;
    data_aula: string;
    turma: {
      nome: string;
      serie: string;
      disciplina: string;
      curriculo_tipo?: 'BNCC' | 'CUSTOM'; // ✅ Story 11.9
    };
    status: string;
    descricao?: string; // ✅ Story 16.5
    planejamento?: any;
  };
  cobertura_bncc: {
    habilidades: Array<{
      codigo: string;
      descricao: string;
      nivel_cobertura: 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';
      evidencias: Array<{ texto_literal: string }>;
    }>;
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
  relatorio_original?: string; // ✅ Story 6.2
  tem_edicao_relatorio?: boolean; // ✅ Story 6.2
  exercicios: {
    questoes: Array<{
      numero: number;
      enunciado: string;
      alternativas?: Array<{
        letra: string;
        texto: string;
        correta: boolean;
      }>;
      gabarito?: {
        resposta_curta?: string;
        resolucao_passo_a_passo?: string[];
        criterios_correcao?: string[];
        dica_professor?: string;
      };
      habilidade_bncc?: string;
      habilidade_relacionada?: string;
      nivel_bloom: string | number;
      nivel_bloom_descricao?: string;
      explicacao?: string;
      dificuldade?: string;
      contexto_aula?: string;
    }>;
  };
  exercicios_original?: any; // ✅ Story 6.3
  tem_edicao_exercicios?: boolean; // ✅ Story 6.3
  status?: string; // ✅ Story 6.2: For readOnly check
  planejamento_id?: string; // ✅ Story 6.4: For navigation to planejamento
  alertas: {
    alertas?: Array<{
      tipo: string;
      nivel: 'INFO' | 'WARNING' | 'CRITICAL';
      titulo: string;
      mensagem: string;
      acoes_sugeridas: string[];
      metadata?: any;
    }>;
    sugestoes_proxima_aula?: string[];
    resumo?: {
      total_alertas: number;
      alertas_criticos: number;
      alertas_atencao: number;
      alertas_informativos: number;
      status_geral: string;
    };
    score_geral_aula?: number;
    speaker_analysis?: { // V4
      professor_fala_pct: number;
      alunos_fala_pct: number;
      trocas_dialogicas: number;
      total_intervencoes_alunos?: number;
      total_perguntas_professor?: number;
    };
  };
  metadata: {
    tempo_processamento_ms: number;
    custo_total_usd: number;
    prompt_versoes: any;
    created_at: string;
  };
  aderencia_objetivo_json?: AderenciaObjetivoJson | null; // ✅ Story 16.5
}

export function AulaAnalisePage() {
  const { aulaId } = useParams<{ aulaId: string }>();

  const { data: analise, isLoading, error } = useQuery<AnaliseResponse>({
    queryKey: ['analise', aulaId],
    queryFn: () => api.get(`/aulas/${aulaId}/analise`).then((res) => normalizeAnaliseV3(res.data)),
  });

  // AC7: Loading state com SkeletonLoader branded
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="space-y-6 animate-in fade-in duration-200">
          <SkeletonLoader variant="card" count={1} />
          <SkeletonLoader variant="table" count={3} />
          <SkeletonLoader variant="chart" count={1} />
        </div>
      </div>
    );
  }

  // MEDIUM FIX: Differentiate error messages by HTTP status
  if (error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;

    let errorTitle = 'Erro ao carregar análise';
    let errorMessage = 'Ocorreu um erro inesperado. Por favor, tente novamente.';

    if (status === 403) {
      errorTitle = 'Acesso Negado';
      errorMessage = 'Você não tem permissão para acessar esta análise.';
    } else if (status === 404) {
      errorTitle = 'Análise não encontrada';
      errorMessage = 'A análise solicitada não existe ou ainda está sendo processada.';
    } else if (status === 401) {
      errorTitle = 'Não autenticado';
      errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
    }

    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>{errorTitle}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // MEDIUM FIX: Null-safety checks for analise data
  if (!analise) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ghost-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header com info da aula */}
      <AulaHeader aula={analise.aula} metadata={analise.metadata} />

      {/* Tabs: Relatório | Exercícios | Sugestões */}
      <Tabs defaultValue="relatorio">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="relatorio">Relatório Pedagógico</TabsTrigger>
          <TabsTrigger value="exercicios">
            Exercícios ({analise.exercicios?.questoes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sugestoes">Sugestões</TabsTrigger>
        </TabsList>

        <TabsContent value="relatorio">
          <RelatorioTab analise={analise} />
        </TabsContent>

        <TabsContent value="exercicios">
          <ExerciciosTab
            analiseId={analise.id}
            aulaId={aulaId!}
            aula={analise.aula}
            exercicios={analise.exercicios}
            temEdicao={analise.tem_edicao_exercicios || false}
            readOnly={analise.status !== 'AGUARDANDO_REVISAO'}
          />
        </TabsContent>

        <TabsContent value="sugestoes">
          <SugestoesTab
            sugestoes={analise.alertas?.sugestoes_proxima_aula || []}
            alertas={analise.alertas?.alertas || []}
            planejamentoId={analise.planejamento_id}
          />
        </TabsContent>
      </Tabs>

      {/* Resumo de Alertas */}
      {analise.alertas?.resumo && (
        <AlertasResumo
          resumo={analise.alertas.resumo}
          score_geral={analise.alertas.score_geral_aula}
          speaker_analysis={analise.alertas.speaker_analysis}
        />
      )}

      {/* Alertas (sempre visíveis) - MEDIUM FIX: Optional chaining */}
      {analise.alertas?.alertas && analise.alertas.alertas.length > 0 && (
        <AlertasSection alertas={analise.alertas.alertas} />
      )}
      </div>
    </div>
  );
}
