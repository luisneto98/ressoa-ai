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
        <Button variant="outline" disabled
          title="Funcionalidade será implementada na Story 6.2"
        >
          Editar Relatório
        </Button>
        <Button
          variant="default"
          disabled
          title="Funcionalidade será implementada na Story 6.2"('edit')}>
          Editar Relatório
        </Button>
          Aprovar
        </Button>
      </div>
    </div>
  );
}
