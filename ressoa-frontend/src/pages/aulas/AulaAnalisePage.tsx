import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { AulaHeader } from './components/AulaHeader';
import { RelatorioTab } from './components/RelatorioTab';
import { ExerciciosTab } from './components/ExerciciosTab';
import { SugestoesTab } from './components/SugestoesTab';
import { AlertasSection } from './components/AlertasSection';
import api from '@/lib/api';
import { AxiosError } from 'axios';

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
    };
    status: string;
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
    niveis_bloom: any;
    metodologias: any;
    adequacao_cognitiva: any;
    sinais_engajamento: any;
  };
  relatorio: string;
  exercicios: Array<{
    enunciado: string;
    gabarito: string;
    nivel_bloom: number;
  }>;
  alertas: {
    alertas?: Array<{
      tipo: string;
      nivel: 'INFO' | 'WARNING' | 'CRITICAL';
      titulo: string;
      mensagem: string;
      acoes_sugeridas: string[];
    }>;
    sugestoes_proxima_aula?: string[];
  };
  metadata: {
    tempo_processamento_ms: number;
    custo_total_usd: number;
    prompt_versoes: any;
    created_at: string;
  };
}

export function AulaAnalisePage() {
  const { aulaId } = useParams<{ aulaId: string }>();

  const { data: analise, isLoading, error } = useQuery<AnaliseResponse>({
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header com info da aula */}
      <AulaHeader aula={analise.aula} metadata={analise.metadata} />

      {/* Tabs: Relatório | Exercícios | Sugestões */}
      <Tabs defaultValue="relatorio">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="relatorio">Relatório Pedagógico</TabsTrigger>
          <TabsTrigger value="exercicios">
            Exercícios ({analise.exercicios?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sugestoes">Sugestões</TabsTrigger>
        </TabsList>

        <TabsContent value="relatorio">
          <RelatorioTab analise={analise} />
        </TabsContent>

        <TabsContent value="exercicios">
          <ExerciciosTab exercicios={analise.exercicios || []} />
        </TabsContent>

        <TabsContent value="sugestoes">
          <SugestoesTab
            sugestoes={analise.alertas?.sugestoes_proxima_aula || []}
            planejamento={analise.aula.planejamento}
          />
        </TabsContent>
      </Tabs>

      {/* Alertas (sempre visíveis) - MEDIUM FIX: Optional chaining */}
      {analise.alertas?.alertas && analise.alertas.alertas.length > 0 && (
        <AlertasSection alertas={analise.alertas.alertas} />
      )}
    </div>
  );
}
