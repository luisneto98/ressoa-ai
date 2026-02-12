import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { apiClient } from '@/api/axios';
import { DiffViewer } from '@/pages/aulas/components/DiffViewer';

interface DiffItem {
  analise_id: string;
  aula_titulo: string;
  data_aula: string;
  change_count: number;
  original_length: number;
  edited_length: number;
  original: string;
  editado: string;
}

interface DiffsResponse {
  nome: string;
  versao: string;
  diffs: DiffItem[];
  total: number;
}

const PROMPT_NOMES_DISPLAY: Record<string, string> = {
  'prompt-cobertura': 'Cobertura BNCC',
  'prompt-qualitativa': 'Análise Qualitativa',
  'prompt-relatorio': 'Relatório',
  'prompt-exercicios': 'Exercícios',
  'prompt-alertas': 'Alertas',
};

export function PromptDiffsPage() {
  const { nome, versao } = useParams<{ nome: string; versao: string }>();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery<DiffsResponse>({
    queryKey: ['admin-prompts-diffs', nome, versao],
    queryFn: () =>
      apiClient
        .get(`/admin/prompts/${encodeURIComponent(nome!)}/${encodeURIComponent(versao!)}/diffs`)
        .then((res) => res.data),
    enabled: !!nome && !!versao,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-800">
            <XCircle className="h-5 w-5" />
            <p className="font-semibold">
              Erro ao carregar diffs:{' '}
              {(error as Error)?.message || 'Erro desconhecido'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const displayNome = nome ? (PROMPT_NOMES_DISPLAY[nome] || nome) : '';

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate('/admin/prompts/qualidade')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para Dashboard
      </Button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Diffs: {displayNome}
      </h1>
      <p className="text-gray-600 mb-6">
        Top 20 análises mais editadas para <span className="font-mono">{versao}</span>
      </p>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Análises Mais Editadas ({data?.total || 0})
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Aula</TableHead>
              <TableHead className="text-right">Data</TableHead>
              <TableHead className="text-right">Mudanças (chars)</TableHead>
              <TableHead className="text-right">Original</TableHead>
              <TableHead className="text-right">Editado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!data || data.diffs.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Nenhuma análise editada encontrada para esta versão
                </TableCell>
              </TableRow>
            ) : (
              data.diffs.map((diff) => (
                <React.Fragment key={diff.analise_id}>
                  <TableRow className="group">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedId(
                            expandedId === diff.analise_id ? null : diff.analise_id,
                          )
                        }
                      >
                        {expandedId === diff.analise_id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{diff.aula_titulo}</TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {new Date(diff.data_aula).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {diff.change_count}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {diff.original_length} chars
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {diff.edited_length} chars
                    </TableCell>
                  </TableRow>
                  {expandedId === diff.analise_id && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <div className="p-4 bg-gray-50 border-t">
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">
                            Diff: {diff.aula_titulo}
                          </h3>
                          <DiffViewer original={diff.original} modified={diff.editado} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
