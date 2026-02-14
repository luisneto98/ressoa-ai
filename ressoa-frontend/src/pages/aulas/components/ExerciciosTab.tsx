import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit, Download, CheckCircle2 } from 'lucide-react';
import { QuestaoCard } from './QuestaoCard';
import { ExerciciosEditor } from './ExerciciosEditor';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { usePdfExport } from '@/hooks/usePdfExport';
import { ExerciciosPDF } from '@/lib/pdf/exercicios-pdf';
import api from '@/lib/api';

interface Questao {
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
}

interface Exercicios {
  questoes: Questao[];
}

interface ExerciciosTabProps {
  analiseId: string;
  aulaId: string;
  aula?: {
    id: string;
    titulo: string;
    data_aula: string;
    turma: {
      nome: string;
      serie: string;
      disciplina: string;
    };
  };
  exercicios: Exercicios;
  temEdicao: boolean; // Flag: exercícios foram editados?
  readOnly?: boolean; // Se true, não permite edição (análise já aprovada)
}

export function ExerciciosTab({
  analiseId,
  aulaId,
  aula,
  exercicios,
  temEdicao,
  readOnly = false
}: ExerciciosTabProps) {
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { exportPDF, isGenerating } = usePdfExport();

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (exerciciosEditados: Exercicios) =>
      api.patch(`/analises/${analiseId}/exercicios`, { exercicios: exerciciosEditados }),
    onSuccess: () => {
      toast({
        title: 'Exercícios atualizados!',
        description: 'Suas edições foram salvas com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['analise', aulaId] });
      setEditMode(false);
    },
    onError: (error: any) => {
      console.error('Erro ao salvar exercícios:', error);

      // Handle specific error cases
      let errorMessage = 'Tente novamente';

      if (error.response) {
        // HTTP error response
        if (error.response.status === 401) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
          // Optionally redirect to login after showing toast
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (error.response.status === 403) {
          errorMessage = 'Você não tem permissão para editar esta análise.';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno do servidor. Por favor, tente novamente mais tarde.';
        } else {
          errorMessage = error.response.data?.message || 'Erro ao salvar';
        }
      } else if (error.request) {
        // Network error (no response)
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }

      toast({
        title: 'Erro ao salvar',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const handleSave = (exerciciosEditados: Exercicios | null) => {
    if (exerciciosEditados === null) {
      // Cancelar edição
      setEditMode(false);
      return;
    }
    saveMutation.mutate(exerciciosEditados);
  };

  const handleExport = async () => {
    if (!aula) {
      toast({
        title: 'Erro ao exportar',
        description: 'Informações da aula não disponíveis.',
        variant: 'destructive',
      });
      return;
    }

    // Generate safe filename
    const aulaTitle = aula.titulo.replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date(aula.data_aula).toISOString().split('T')[0];
    const filename = `Exercicios_${aulaTitle}_${date}.pdf`;

    await exportPDF(
      <ExerciciosPDF aula={aula} questoes={exercicios.questoes as any} />,
      filename
    );
  };

  // Modo edição
  if (editMode) {
    return (
      <ExerciciosEditor
        exercicios={exercicios as any}
        onSave={handleSave}
        isPending={saveMutation.isPending}
      />
    );
  }

  // Modo visualização
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-montserrat font-semibold text-deep-navy">Exercícios Contextuais</h2>
          {temEdicao && (
            <p className="text-sm text-blue-600 flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-4 w-4" />
              Exercícios editados pelo professor
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!readOnly && (
            <Button variant="outline" onClick={() => setEditMode(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Exercícios
            </Button>
          )}
          <Button variant="ghost" onClick={handleExport} disabled={isGenerating}>
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? 'Gerando PDF...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      {readOnly && (
        <Alert className="mb-4">
          <AlertDescription>
            Esta análise já foi aprovada. Não é possível editar exercícios após aprovação.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de questões */}
      <div className="space-y-6">
        {exercicios?.questoes?.length > 0 ? (
          exercicios.questoes.map((questao, idx) => (
            <QuestaoCard key={idx} questao={questao} showGabarito />
          ))
        ) : (
          <Alert>
            <AlertDescription>
              Nenhum exercício foi gerado para esta análise.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Metadados */}
      {exercicios?.questoes?.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <strong>{exercicios.questoes.length}</strong> questões geradas
            </div>
            <div>
              Baseado em: {[...new Set(exercicios.questoes.map(q => q.habilidade_bncc || q.habilidade_relacionada).filter(Boolean))].join(', ')}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
