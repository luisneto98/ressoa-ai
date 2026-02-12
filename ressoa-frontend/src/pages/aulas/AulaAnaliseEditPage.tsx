import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';
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
    mutationFn: (content: string) => {
      // ✅ CRITICAL FIX #2: Null check for analise.id
      if (!analise?.id) {
        throw new Error('Análise não carregada');
      }
      return api.patch(`/analises/${analise.id}/relatorio`, {
        relatorio_editado: content
      });
    },
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
    // ✅ MEDIUM FIX #2: Add retry for resilience
    retry: 2,
    retryDelay: 1000,
  });

  // Approve mutation
  const aprovarMutation = useMutation({
    mutationFn: () => {
      // ✅ CRITICAL FIX #2: Null check for analise.id
      if (!analise?.id) {
        throw new Error('Análise não carregada');
      }
      return api.post(`/analises/${analise.id}/aprovar`);
    },
    onSuccess: (res) => {
      toast({
        title: 'Relatório aprovado!',
        description: `Tempo de revisão: ${res.data.tempo_revisao}s`,
      });
      queryClient.invalidateQueries({ queryKey: ['analise', aulaId] });
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
    mutationFn: (motivo: string) => {
      // ✅ CRITICAL FIX #2: Null check for analise.id
      if (!analise?.id) {
        throw new Error('Análise não carregada');
      }
      return api.post(`/analises/${analise.id}/rejeitar`, { motivo });
    },
    onSuccess: () => {
      toast({
        title: 'Relatório rejeitado',
        description: 'Feedback registrado com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['analise', aulaId] });
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

  // ✅ CRITICAL FIX #1: Implement debouncing in parent handler
  const debouncedSave = useDebouncedCallback(
    (content: string) => {
      setIsSaving(true);
      saveMutation.mutate(content);
    },
    1000, // 1 second delay
    { maxWait: 3000 } // Save at most every 3 seconds
  );

  // Auto-save handler with debouncing
  const handleEditorChange = (content: string) => {
    setConteudo(content); // Update local state immediately
    debouncedSave(content); // Debounced API call
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

  // ✅ MEDIUM FIX #1: Use relatorio_texto (AI original) as baseline for diff
  const original = analise.relatorio_texto || analise.relatorio;
  const hasChanges = conteudo !== original;

  return (
    <div className="min-h-screen bg-ghost-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-deep-navy">Editar Relatório</h1>
          <p className="text-sm text-deep-navy/80 mt-1">
            {/* ✅ HIGH FIX #1: Remove titulo field (doesn't exist in schema) */}
            {analise.aula.turma.nome} - {new Date(analise.aula.data).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-deep-navy/60">Salvando...</span>
          )}
          {lastSaved && !isSaving && (
            <span className="text-xs text-deep-navy/60">
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
          onClick={() => aprovarMutation.mutate()}
          disabled={aprovarMutation.isPending}
          className="bg-tech-blue hover:bg-tech-blue/90 text-white"
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
    </div>
  );
}
