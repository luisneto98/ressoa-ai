import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, Award, TrendingUp } from 'lucide-react';

interface SpeakerAnalysis {
  professor_fala_pct: number;
  alunos_fala_pct: number;
  trocas_dialogicas: number;
  total_intervencoes_alunos?: number;
  total_perguntas_professor?: number;
}

interface AlertasResumoProps {
  resumo: {
    total_alertas: number;
    alertas_criticos: number;
    alertas_atencao: number;
    alertas_informativos: number;
    status_geral: string;
  };
  score_geral?: number;
  speaker_analysis?: SpeakerAnalysis; // V4
}

export function AlertasResumo({ resumo, score_geral, speaker_analysis }: AlertasResumoProps) {
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'EXCELENTE':
        return 'from-green-500 to-emerald-600';
      case 'BOM':
        return 'from-blue-500 to-cyan-600';
      case 'ATENCAO':
        return 'from-amber-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'EXCELENTE':
        return <Award className="h-6 w-6" />;
      case 'BOM':
        return <TrendingUp className="h-6 w-6" />;
      case 'ATENCAO':
        return <AlertTriangle className="h-6 w-6" />;
      default:
        return <Info className="h-6 w-6" />;
    }
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-montserrat font-semibold text-deep-navy">
          Resumo de Alertas
        </h3>
        {score_geral !== undefined && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            Score: {score_geral}/100
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Status Geral */}
        <div
          className={`col-span-2 md:col-span-1 bg-gradient-to-br ${getStatusColor(
            resumo.status_geral
          )} text-white rounded-lg p-3 flex flex-col items-center justify-center`}
        >
          <div className="mb-1">{getStatusIcon(resumo.status_geral)}</div>
          <div className="text-lg font-bold">{resumo.status_geral}</div>
          <div className="text-[10px] opacity-80">Status Geral</div>
        </div>

        {/* Alertas Críticos */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex flex-col items-center justify-center">
          <AlertCircle className="h-4 w-4 text-red-600 mb-1" />
          <div className="text-2xl font-bold text-red-700">
            {resumo.alertas_criticos}
          </div>
          <div className="text-[10px] text-red-600 font-medium text-center">
            Críticos
          </div>
        </div>

        {/* Alertas de Atenção */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col items-center justify-center">
          <AlertTriangle className="h-4 w-4 text-amber-600 mb-1" />
          <div className="text-2xl font-bold text-amber-700">
            {resumo.alertas_atencao}
          </div>
          <div className="text-[10px] text-amber-600 font-medium text-center">
            Atenção
          </div>
        </div>

        {/* Alertas Informativos */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-col items-center justify-center">
          <Info className="h-4 w-4 text-blue-600 mb-1" />
          <div className="text-2xl font-bold text-blue-700">
            {resumo.alertas_informativos}
          </div>
          <div className="text-[10px] text-blue-600 font-medium text-center">
            Informativos
          </div>
        </div>

        {/* Total */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center">
          <div className="h-4 w-4 mb-1 flex items-center justify-center">
            <span className="text-gray-600 font-bold text-base">#</span>
          </div>
          <div className="text-2xl font-bold text-gray-700">
            {resumo.total_alertas}
          </div>
          <div className="text-[10px] text-gray-600 font-medium text-center">
            Total
          </div>
        </div>
      </div>

      {/* V4: Speaker analysis - distribuição de fala */}
      {speaker_analysis && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">Distribuição de Fala</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-20 shrink-0">Professor</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-tech-blue"
                  style={{ width: `${speaker_analysis.professor_fala_pct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                {speaker_analysis.professor_fala_pct}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-20 shrink-0">Alunos</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${speaker_analysis.alunos_fala_pct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                {speaker_analysis.alunos_fala_pct}%
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {speaker_analysis.trocas_dialogicas} trocas dialógicas
            {speaker_analysis.total_intervencoes_alunos !== undefined && (
              <> · {speaker_analysis.total_intervencoes_alunos} intervenções dos alunos</>
            )}
          </p>
        </div>
      )}
    </Card>
  );
}
