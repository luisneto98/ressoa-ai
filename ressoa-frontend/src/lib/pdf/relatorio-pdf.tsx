import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import {
  PDFFooter,
  Badge,
  CoberturaBadgePDF,
  ScoreCircle,
  SectionHeader,
  List,
  MetadataBox,
  Spacer,
  EvidenciaBox,
  RenderQualitativaData,
} from './pdf-components';
import { styles, colors } from './pdf-styles';

/**
 * RelatorioPDF - Complete Pedagogical Report PDF Document
 *
 * Generates a professional PDF with:
 * - Cover page with lesson info
 * - General summary (score, strengths, attention points)
 * - BNCC/Custom coverage with evidence
 * - Qualitative analysis (6 dimensions)
 * - Full pedagogical report (markdown text)
 * - Metadata (processing time, cost)
 */

interface Aula {
  id: string;
  titulo: string;
  data_aula: string;
  turma: {
    nome: string;
    serie: string;
    disciplina: string;
    curriculo_tipo?: 'BNCC' | 'CUSTOM';
  };
}

interface Resumo {
  nota_geral: number;
  pontos_fortes?: string[];
  pontos_atencao?: string[];
}

interface Habilidade {
  codigo: string;
  descricao: string;
  nivel_cobertura: 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';
  evidencias: Array<{ texto_literal: string }>;
  unidade_tematica?: string;
  nivel_bloom_planejado?: string;
  nivel_bloom_detectado?: string;
  tempo_estimado_minutos?: number;
  adequacao_nivel_cognitivo?: 'ADEQUADO' | 'ABAIXO' | 'ACIMA';
}

interface Cobertura {
  habilidades: Habilidade[];
}

interface Qualitativa {
  taxonomia_bloom?: any;
  metodologia?: any;
  adequacao_linguistica?: any;
  engajamento?: any;
  clareza_comunicacao?: any;
  coerencia_narrativa?: any;
  resumo_geral?: Resumo;
  comentario_sintetico?: string;
}

interface Metadata {
  tempo_processamento_ms: number;
  custo_total_usd: number;
  created_at: string;
}

interface RelatorioPDFProps {
  aula: Aula;
  cobertura: Cobertura;
  qualitativa: Qualitativa;
  relatorio: string;
  metadata: Metadata;
}

// Helper to get status label
const getStatusLabel = (curriculo_tipo: string, nivel: string) => {
  if (curriculo_tipo === 'CUSTOM') {
    const labels: Record<string, string> = {
      COMPLETE: 'Completo',
      PARTIAL: 'Parcial',
      MENTIONED: 'Mencionado',
      NOT_COVERED: 'Não Coberto',
    };
    return labels[nivel] || nivel;
  }

  const labels: Record<string, string> = {
    COMPLETE: 'Cobertura Completa',
    PARTIAL: 'Cobertura Parcial',
    MENTIONED: 'Mencionado',
    NOT_COVERED: 'Não Coberto',
  };
  return labels[nivel] || nivel;
};

// ============================================================
// COVER PAGE
// ============================================================

const CoverPage: React.FC<{ aula: Aula }> = ({ aula }) => (
  <Page size="A4" style={styles.coverPage}>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={styles.coverTitle}>Relatório Pedagógico</Text>
      <Text style={styles.coverSubtitle}>Análise de Aula com IA</Text>

      <Spacer size="large" />

      <View style={styles.coverInfo}>
        <View style={styles.coverInfoRow}>
          <Text style={styles.coverInfoLabel}>Aula:</Text>
          <Text style={styles.coverInfoValue}>{aula.titulo}</Text>
        </View>
        <View style={styles.coverInfoRow}>
          <Text style={styles.coverInfoLabel}>Data:</Text>
          <Text style={styles.coverInfoValue}>
            {new Date(aula.data_aula).toLocaleDateString('pt-BR')}
          </Text>
        </View>
        <View style={styles.coverInfoRow}>
          <Text style={styles.coverInfoLabel}>Turma:</Text>
          <Text style={styles.coverInfoValue}>{aula.turma.nome}</Text>
        </View>
        <View style={styles.coverInfoRow}>
          <Text style={styles.coverInfoLabel}>Série:</Text>
          <Text style={styles.coverInfoValue}>{aula.turma.serie}</Text>
        </View>
        <View style={styles.coverInfoRow}>
          <Text style={styles.coverInfoLabel}>Disciplina:</Text>
          <Text style={styles.coverInfoValue}>{aula.turma.disciplina}</Text>
        </View>
      </View>
    </View>

    <Text style={styles.coverFooter}>
      Gerado por Ressoa AI • {new Date().toLocaleDateString('pt-BR')}
    </Text>
  </Page>
);

// ============================================================
// RESUMO SECTION
// ============================================================

const ResumoSection: React.FC<{ resumo?: Resumo; comentario?: string }> = ({
  resumo,
  comentario,
}) => {
  if (!resumo && !comentario) return null;

  return (
    <View style={{ marginBottom: 16 }}>
      <View wrap={false}>
        <SectionHeader title="Resumo da Análise" icon="📊" />
      </View>

      {resumo && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }} wrap={false}>
          <ScoreCircle nota={resumo.nota_geral} />
          <View style={{ flex: 1, paddingLeft: 8 }}>
            <Text style={styles.h4}>Avaliação Geral da Aula</Text>
            <Text style={styles.small}>
              Baseado em múltiplos critérios pedagógicos
            </Text>
          </View>
        </View>
      )}

      {comentario && (
        <View
          style={{
            backgroundColor: colors.blue50,
            padding: 10,
            borderRadius: 4,
            marginBottom: 12,
            borderLeft: `3 solid ${colors.cyanAI}`,
          }}
        >
          <Text style={[styles.small, { fontFamily: 'Helvetica-Oblique' }]}>
            "{comentario}"
          </Text>
        </View>
      )}

      {resumo?.pontos_fortes && resumo.pontos_fortes.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: colors.green700, fontSize: 10, fontFamily: 'Helvetica-Bold' }}>
              ✓ Pontos Fortes
            </Text>
          </View>
          <List items={resumo.pontos_fortes} />
        </View>
      )}

      {resumo?.pontos_atencao && resumo.pontos_atencao.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: colors.amber700, fontSize: 10, fontFamily: 'Helvetica-Bold' }}>
              ⚠ Pontos de Atenção
            </Text>
          </View>
          <List items={resumo.pontos_atencao} />
        </View>
      )}
    </View>
  );
};

// ============================================================
// COBERTURA SECTION
// ============================================================

const CoberturaSection: React.FC<{ cobertura: Cobertura; curriculo_tipo: string }> = ({
  cobertura,
  curriculo_tipo,
}) => {
  if (!cobertura?.habilidades || cobertura.habilidades.length === 0) return null;

  const title =
    curriculo_tipo === 'CUSTOM'
      ? 'Cobertura de Objetivos de Aprendizagem'
      : 'Cobertura de Habilidades BNCC';

  return (
    <View style={{ marginBottom: 16 }}>
      <View wrap={false}>
        <SectionHeader title={title} icon="📚" />
        <Text style={[styles.small, { marginBottom: 10 }]}>
          {cobertura.habilidades.length}{' '}
          {curriculo_tipo === 'CUSTOM' ? 'objetivo' : 'habilidade'}
          {cobertura.habilidades.length > 1 ? 's' : ''} identificada
          {cobertura.habilidades.length > 1 ? 's' : ''}
        </Text>
      </View>

      {cobertura.habilidades.map((hab, idx) => (
        <View key={hab.codigo || idx} style={styles.coberturaCard}>
          {/* Header with badges */}
          <View style={styles.coberturaHeader}>
            <CoberturaBadgePDF
              nivel={hab.nivel_cobertura}
              label={getStatusLabel(curriculo_tipo, hab.nivel_cobertura)}
            />
            <Text style={styles.coberturaCodigo}>{hab.codigo}</Text>

            {curriculo_tipo === 'CUSTOM' && hab.nivel_bloom_planejado && (
              <Badge variant="info" style={{ fontSize: 7 }}>
                Bloom: {hab.nivel_bloom_planejado}
              </Badge>
            )}

            {hab.tempo_estimado_minutos && (
              <Badge variant="secondary" style={{ fontSize: 7 }}>
                {hab.tempo_estimado_minutos} min
              </Badge>
            )}
          </View>

          {/* Description */}
          <Text style={styles.coberturaDescricao}>{hab.descricao}</Text>

          {/* BNCC: Unidade Temática */}
          {curriculo_tipo === 'BNCC' && hab.unidade_tematica && (
            <Text style={[styles.tiny, { marginTop: 4 }]}>
              Unidade Temática: {hab.unidade_tematica}
            </Text>
          )}

          {/* Evidências */}
          {hab.evidencias && hab.evidencias.length > 0 && (
            <EvidenciaBox evidencias={hab.evidencias} maxItems={2} />
          )}
        </View>
      ))}
    </View>
  );
};

// ============================================================
// QUALITATIVA SECTION
// ============================================================

const QualitativaSection: React.FC<{ qualitativa: Qualitativa }> = ({ qualitativa }) => {
  const dimensoes = [
    { key: 'taxonomia_bloom', title: 'Taxonomia de Bloom', icon: '🧠' },
    { key: 'metodologia', title: 'Metodologia', icon: '📋' },
    { key: 'engajamento', title: 'Engajamento', icon: '👥' },
    { key: 'clareza_comunicacao', title: 'Clareza e Comunicação', icon: '💬' },
    { key: 'coerencia_narrativa', title: 'Coerência Narrativa', icon: '🔗' },
    { key: 'adequacao_linguistica', title: 'Adequação Linguística', icon: '🗣️' },
  ];

  return (
    <View style={{ marginBottom: 16 }}>
      <View wrap={false}>
        <SectionHeader title="Análise Qualitativa" icon="⭐" />
      </View>

      {dimensoes.map(({ key, title, icon }) => {
        const data = qualitativa[key as keyof Qualitativa];
        if (!data) return null;

        return (
          <View key={key} style={[styles.qualitativaCard, { marginBottom: 10 }]}>
            <Text style={styles.qualitativaTitle}>
              {icon} {title}
            </Text>
            <RenderQualitativaData data={data} />
          </View>
        );
      })}
    </View>
  );
};

// ============================================================
// RELATORIO TEXTUAL SECTION
// ============================================================

const RelatorioTextualSection: React.FC<{ relatorio: string }> = ({ relatorio }) => {
  if (!relatorio) return null;

  // Simple markdown-to-text conversion (remove markdown formatting)
  const plainText = relatorio
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .trim();

  return (
    <View style={{ marginBottom: 16 }}>
      <View wrap={false}>
        <SectionHeader title="Relatório Completo da Aula" icon="📝" />
      </View>
      <Text style={[styles.body, { lineHeight: 1.6, textAlign: 'justify', marginTop: 8 }]}>{plainText}</Text>
    </View>
  );
};

// ============================================================
// METADATA SECTION
// ============================================================

const MetadataSection: React.FC<{ metadata: Metadata }> = ({ metadata }) => (
  <View style={{ marginBottom: 16 }}>
    <View wrap={false}>
      <SectionHeader title="Informações do Processamento" icon="ℹ️" />
      <MetadataBox
        items={[
          {
            label: 'Tempo de Processamento',
            value: `${(metadata.tempo_processamento_ms / 1000).toFixed(2)}s`,
          },
          {
            label: 'Custo da Análise',
            value: `US$ ${metadata.custo_total_usd.toFixed(4)}`,
          },
          {
            label: 'Data da Análise',
            value: new Date(metadata.created_at).toLocaleString('pt-BR'),
          },
        ]}
      />
    </View>
  </View>
);

// ============================================================
// MAIN DOCUMENT
// ============================================================

export const RelatorioPDF: React.FC<RelatorioPDFProps> = ({
  aula,
  cobertura,
  qualitativa,
  relatorio,
  metadata,
}) => {
  const curriculo_tipo = aula.turma?.curriculo_tipo || 'BNCC';

  return (
    <Document>
      {/* Cover Page */}
      <CoverPage aula={aula} />

      {/* Content Pages */}
      <Page size="A4" style={styles.page}>
        <ResumoSection
          resumo={qualitativa.resumo_geral}
          comentario={qualitativa.comentario_sintetico}
        />

        <CoberturaSection cobertura={cobertura} curriculo_tipo={curriculo_tipo} />

        <QualitativaSection qualitativa={qualitativa} />

        <RelatorioTextualSection relatorio={relatorio} />

        <MetadataSection metadata={metadata} />

        <PDFFooter pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  );
};
