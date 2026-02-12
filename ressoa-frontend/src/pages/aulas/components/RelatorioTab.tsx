import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { CoberturaBadge } from './CoberturaBadge';
import { QualitativaCard } from './QualitativaCard';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface RelatorioTabProps {
  analise: {
    // ✅ HIGH FIX #3: Add id field to interface
    id: string;
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
  const { aulaId } = useParams<{ aulaId: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ✅ HIGH FIX #2: Add approve mutation for direct approval
  const aprovarMutation = useMutation({
    mutationFn: () => api.post(`/analises/${analise.id}/aprovar`),
    onSuccess: (res) => {
      toast({
        title: 'Relatório aprovado!',
        description: `Tempo de revisão: ${res.data.tempo_revisao}s`,
      });
      queryClient.invalidateQueries({ queryKey: ['analise', aulaId] });
      // Stay on same page - analysis tab will show approved status
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao aprovar',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      });
    },
  });

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
        <Button
          variant="outline"
          onClick={() => navigate('edit')}
        >
          Editar Relatório
        </Button>
        {/* ✅ HIGH FIX #2: Implement direct approval (não navega para edit) */}
        <Button
          variant="default"
          onClick={() => aprovarMutation.mutate()}
          disabled={aprovarMutation.isPending}
        >
          {aprovarMutation.isPending ? 'Aprovando...' : 'Aprovar Sem Editar'}
        </Button>
      </div>
    </div>
  );
}
