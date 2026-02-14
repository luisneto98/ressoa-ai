import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles, getCoberturaBadgeColors } from './pdf-styles';

/**
 * Reusable PDF Components for Ressoa AI
 */

// ============================================================
// HEADER & FOOTER
// ============================================================

interface PDFFooterProps {
  pageNumber: number;
  totalPages: number;
}

export const PDFFooter: React.FC<PDFFooterProps> = ({ pageNumber, totalPages }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerBrand}>Ressoa AI</Text>
    <Text style={styles.footerText}>
      Página {pageNumber} de {totalPages}
    </Text>
    <Text style={styles.footerText}>
      {new Date().toLocaleDateString('pt-BR')}
    </Text>
  </View>
);

// ============================================================
// BADGES
// ============================================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'secondary';
  style?: any;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'secondary', style }) => {
  const variantStyles = {
    success: styles.badgeSuccess,
    warning: styles.badgeWarning,
    info: styles.badgeInfo,
    danger: styles.badgeDanger,
    secondary: styles.badgeSecondary,
  };

  return (
    <View style={[styles.badge, variantStyles[variant], style]}>
      <Text>{children}</Text>
    </View>
  );
};

interface CoberturaBadgeProps {
  nivel: 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';
  label: string;
}

export const CoberturaBadgePDF: React.FC<CoberturaBadgeProps> = ({ nivel, label }) => {
  const { bg, text } = getCoberturaBadgeColors(nivel);

  return (
    <View style={[styles.badge, { backgroundColor: bg, color: text }]}>
      <Text>{label}</Text>
    </View>
  );
};

// ============================================================
// SCORE CIRCLE
// ============================================================

interface ScoreCircleProps {
  nota: number;
}

export const ScoreCircle: React.FC<ScoreCircleProps> = ({ nota }) => {
  const getScoreStyle = () => {
    if (nota >= 8) return styles.scoreCircleHigh;
    if (nota >= 6) return styles.scoreCircleMedium;
    return styles.scoreCircleLow;
  };

  return (
    <View style={[styles.scoreCircle, getScoreStyle()]}>
      <Text style={styles.scoreValue}>{nota}</Text>
      <Text style={styles.scoreLabel}>/10</Text>
    </View>
  );
};

// ============================================================
// SECTION HEADER
// ============================================================

interface SectionHeaderProps {
  title: string;
  icon?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    {icon && <Text style={{ marginRight: 8, fontSize: 14 }}>{icon}</Text>}
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// ============================================================
// LIST
// ============================================================

interface ListProps {
  items: string[];
  bullet?: string;
}

export const List: React.FC<ListProps> = ({ items, bullet = '•' }) => (
  <View style={styles.list}>
    {items.map((item, idx) => (
      <View key={idx} style={styles.listItem}>
        <Text style={styles.listBullet}>{bullet}</Text>
        <Text style={styles.listContent}>{item}</Text>
      </View>
    ))}
  </View>
);

// ============================================================
// METADATA BOX
// ============================================================

interface MetadataBoxProps {
  items: Array<{ label: string; value: string }>;
}

export const MetadataBox: React.FC<MetadataBoxProps> = ({ items }) => (
  <View style={styles.metadataBox}>
    {items.map((item, idx) => (
      <View key={idx} style={styles.metadataRow}>
        <Text style={styles.metadataLabel}>{item.label}:</Text>
        <Text style={styles.metadataValue}>{item.value}</Text>
      </View>
    ))}
  </View>
);

// ============================================================
// CARD
// ============================================================

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: any;
}

export const Card: React.FC<CardProps> = ({ title, children, style }) => (
  <View style={[styles.card, style]}>
    {title && (
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
    )}
    <View style={styles.cardContent}>{children}</View>
  </View>
);

// ============================================================
// QUALITATIVA FIELD ROW
// ============================================================

interface QualitativaRowProps {
  label: string;
  value: string | number | boolean;
}

export const QualitativaRow: React.FC<QualitativaRowProps> = ({ label, value }) => {
  // Format value based on type
  let formattedValue = String(value);

  if (typeof value === 'boolean') {
    formattedValue = value ? 'Sim ✓' : 'Não ✗';
  } else if (typeof value === 'number') {
    formattedValue = value.toString();
  }

  return (
    <View style={styles.qualitativaRow}>
      <Text style={styles.qualitativaLabel}>{label}:</Text>
      <Text style={styles.qualitativaValue}>{formattedValue}</Text>
    </View>
  );
};

// ============================================================
// SPACERS & DIVIDERS
// ============================================================

export const Spacer: React.FC<{ size?: 'normal' | 'large' }> = ({ size = 'normal' }) => (
  <View style={size === 'large' ? styles.spacerLarge : styles.spacer} />
);

export const Divider: React.FC = () => <View style={styles.divider} />;

// ============================================================
// EVIDENCIA (Quote Box)
// ============================================================

interface EvidenciaBoxProps {
  evidencias: Array<{ texto_literal: string }>;
  maxItems?: number;
}

export const EvidenciaBox: React.FC<EvidenciaBoxProps> = ({ evidencias, maxItems = 3 }) => {
  if (!evidencias || evidencias.length === 0) return null;

  return (
    <View style={styles.evidenciaBox}>
      <Text style={styles.evidenciaLabel}>Evidências:</Text>
      {evidencias.slice(0, maxItems).map((ev, idx) => (
        <Text key={idx} style={styles.evidenciaText}>
          "{ev.texto_literal}"
        </Text>
      ))}
    </View>
  );
};

// ============================================================
// HELPER: Render nested object data
// ============================================================

const LABELS: Record<string, string> = {
  nota_geral: 'Nota Geral',
  pontos_fortes: 'Pontos Fortes',
  pontos_atencao: 'Pontos de Atenção',
  niveis_identificados: 'Níveis Identificados',
  nivel_dominante: 'Nível Dominante',
  avaliacao: 'Avaliação',
  sugestao: 'Sugestão',
  dominante: 'Metodologia Dominante',
  metodos_identificados: 'Métodos Identificados',
  percentual_estimado: 'Distribuição Estimada',
  variacao: 'Variação Metodológica',
  nivel: 'Nível',
  perguntas_alunos: 'Perguntas dos Alunos',
  participacao_estimulada: 'Participação Estimulada',
  discussoes: 'Discussões Observadas',
  sinais_positivos: 'Sinais Positivos',
  sinais_dificuldade: 'Sinais de Dificuldade',
  score: 'Score',
  explicacoes_claras: 'Explicações Claras',
  uso_exemplos: 'Uso de Exemplos',
  reformulacoes: 'Reformulações',
  observacoes: 'Observações',
  estrutura_presente: 'Estrutura Presente',
  conexao_conhecimento_previo: 'Conexão com Conhecimento Prévio',
  sequencia_logica: 'Sequência Lógica',
  fechamento: 'Fechamento',
  adequada_para_serie: 'Adequada para a Série',
  exemplos_adequacao: 'Exemplos de Adequação',
  expositiva: 'Expositiva',
  investigativa: 'Investigativa',
  colaborativa: 'Colaborativa',
  pratica: 'Prática',
};

function getLabel(key: string): string {
  return LABELS[key] || key.replaceAll('_', ' ').replace(/^\w/, (c) => c.toUpperCase());
}

interface RenderQualitativaDataProps {
  data: any;
}

export const RenderQualitativaData: React.FC<RenderQualitativaDataProps> = ({ data }) => {
  if (!data || typeof data !== 'object') return null;

  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        // Skip some fields
        if (key === 'nota_geral' || key === 'pontos_fortes' || key === 'pontos_atencao') {
          return null;
        }

        // Handle arrays
        if (Array.isArray(value)) {
          if (value.length === 0) return null;
          if (typeof value[0] === 'string') {
            return (
              <View key={key} style={{ marginBottom: 6 }}>
                <Text style={[styles.qualitativaLabel, { marginBottom: 3 }]}>
                  {getLabel(key)}:
                </Text>
                <List items={value} />
              </View>
            );
          }
          // Array of numbers (Bloom levels)
          if (typeof value[0] === 'number') {
            return (
              <QualitativaRow key={key} label={getLabel(key)} value={value.join(', ')} />
            );
          }
        }

        // Handle nested objects (percentual_estimado)
        if (typeof value === 'object' && value !== null) {
          return (
            <View key={key} style={{ marginBottom: 6 }}>
              <Text style={[styles.qualitativaLabel, { marginBottom: 3 }]}>
                {getLabel(key)}:
              </Text>
              {Object.entries(value).map(([subKey, subValue]) => (
                <View key={subKey} style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={[styles.qualitativaValue, { fontSize: 8, width: 80 }]}>
                    {getLabel(subKey)}:
                  </Text>
                  <Text style={[styles.qualitativaValue, { fontSize: 8 }]}>
                    {typeof subValue === 'number' ? `${subValue}%` : String(subValue)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        // Handle primitives
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return <QualitativaRow key={key} label={getLabel(key)} value={value} />;
        }

        return null;
      })}
    </>
  );
};
