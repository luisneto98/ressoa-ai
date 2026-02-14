import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import {
  PDFFooter,
  Badge,
  SectionHeader,
  Spacer,
  MetadataBox,
} from './pdf-components';
import { styles, colors } from './pdf-styles';

/**
 * ExerciciosPDF - Contextual Exercises PDF Document
 *
 * Generates a professional PDF with:
 * - Cover page with lesson info
 * - List of questions (múltipla-escolha and dissertativas)
 * - Answer keys and explanations
 * - BNCC skills related to each question
 * - Bloom levels and difficulty
 * - Metadata
 */

interface Aula {
  id: string;
  titulo: string;
  data_aula: string;
  turma: {
    nome: string;
    serie: string;
    disciplina: string;
  };
}

interface Alternativa {
  letra: string;
  texto: string;
  correta: boolean;
}

interface Gabarito {
  resposta_curta?: string;
  resolucao_passo_a_passo?: string[];
  criterios_correcao?: string[];
  dica_professor?: string;
}

interface Questao {
  numero: number;
  enunciado: string;
  alternativas?: (Alternativa | string)[];
  gabarito?: Gabarito;
  resposta_esperada?: string;
  justificativa_pedagogica?: string;
  habilidade_bncc?: string;
  habilidade_relacionada?: string;
  nivel_bloom: string | number;
  nivel_bloom_descricao?: string;
  explicacao?: string;
  dificuldade?: string;
  contexto_aula?: string;
  tipo?: string;
}

interface ExerciciosPDFProps {
  aula: Aula;
  questoes: Questao[];
}

// ============================================================
// COVER PAGE
// ============================================================

const CoverPage: React.FC<{ aula: Aula; totalQuestoes: number }> = ({ aula, totalQuestoes }) => (
  <Page size="A4" style={styles.coverPage}>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={styles.coverTitle}>Exercícios Contextuais</Text>
      <Text style={styles.coverSubtitle}>Gerados com IA Pedagógica</Text>

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
        <View style={styles.coverInfoRow}>
          <Text style={styles.coverInfoLabel}>Total de Questões:</Text>
          <Text style={styles.coverInfoValue}>{totalQuestoes}</Text>
        </View>
      </View>
    </View>

    <Text style={styles.coverFooter}>
      Gerado por Ressoa AI • {new Date().toLocaleDateString('pt-BR')}
    </Text>
  </Page>
);

// ============================================================
// QUESTAO COMPONENT
// ============================================================

const QuestaoComponent: React.FC<{ questao: Questao; showGabarito: boolean }> = ({
  questao,
  showGabarito,
}) => {
  const habilidade = questao.habilidade_bncc || questao.habilidade_relacionada || '';
  const nivelBloom = questao.nivel_bloom_descricao || `${questao.nivel_bloom}`;

  // Normalize alternativas (handle both string[] and Alternativa[])
  const alternativasNormalizadas: Alternativa[] = (questao.alternativas || []).map((alt) => {
    if (typeof alt === 'string') {
      // Parse "a) 1888" → { letra: "a", texto: "1888", correta: false }
      const match = alt.match(/^([a-z])\)\s*(.+)$/i);
      return {
        letra: match ? match[1] : '?',
        texto: match ? match[2] : alt,
        correta: false, // Will be determined by resposta_esperada if available
      };
    }
    return alt;
  });

  return (
    <View style={[styles.questaoCard, { marginBottom: 12 }]}>
      {/* Header with metadata badges */}
      <View style={styles.questaoHeader}>
        {habilidade && (
          <Badge variant="info" style={{ fontSize: 7, marginBottom: 4 }}>
            {habilidade}
          </Badge>
        )}
        <Badge variant="secondary" style={{ fontSize: 7, marginBottom: 4 }}>
          Bloom: {nivelBloom}
        </Badge>
        {questao.tipo && (
          <Badge variant="secondary" style={{ fontSize: 7, marginBottom: 4 }}>
            {questao.tipo.replace(/_/g, ' ')}
          </Badge>
        )}
        {questao.dificuldade && (
          <Badge variant="secondary" style={{ fontSize: 7, marginBottom: 4 }}>
            {questao.dificuldade}
          </Badge>
        )}
      </View>

      {/* Enunciado */}
      <Text style={styles.questaoEnunciado}>
        <Text style={styles.questaoNumero}>{questao.numero}.</Text> {questao.enunciado}
      </Text>

      {/* Múltipla-escolha: Alternativas */}
      {alternativasNormalizadas.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {alternativasNormalizadas.map((alt) => (
            <View
              key={alt.letra}
              style={
                showGabarito && alt.correta
                  ? [styles.alternativaRow, styles.alternativaCorreta]
                  : styles.alternativaRow
              }
            >
              <Text style={styles.alternativaLetra}>{alt.letra})</Text>
              <Text style={styles.alternativaTexto}>{alt.texto}</Text>
              {showGabarito && alt.correta && (
                <Text style={{ color: colors.green600, fontSize: 9 }}> ✓</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Gabarito: formato novo (gabarito object) */}
      {showGabarito && questao.gabarito && (
        <View style={styles.gabaritoBox}>
          {questao.gabarito.resposta_curta && (
            <View style={{ marginBottom: 6 }}>
              <Text style={styles.gabaritoLabel}>Resposta:</Text>
              <Text style={styles.gabaritoText}>{questao.gabarito.resposta_curta}</Text>
            </View>
          )}
          {questao.gabarito.resolucao_passo_a_passo &&
            questao.gabarito.resolucao_passo_a_passo.length > 0 && (
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.gabaritoLabel}>Resolução:</Text>
                {questao.gabarito.resolucao_passo_a_passo.map((passo, i) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                    <Text style={[styles.gabaritoText, { width: 20 }]}>{i + 1}.</Text>
                    <Text style={[styles.gabaritoText, { flex: 1 }]}>{passo}</Text>
                  </View>
                ))}
              </View>
            )}
          {questao.gabarito.dica_professor && (
            <View style={{ marginBottom: 6 }}>
              <Text style={styles.gabaritoLabel}>Dica para o professor:</Text>
              <Text style={styles.gabaritoText}>{questao.gabarito.dica_professor}</Text>
            </View>
          )}
        </View>
      )}

      {/* Gabarito: formato v2 (resposta_esperada + justificativa) */}
      {showGabarito && questao.resposta_esperada && !questao.gabarito && (
        <View style={styles.gabaritoBox}>
          <View style={{ marginBottom: 6 }}>
            <Text style={styles.gabaritoLabel}>Resposta esperada:</Text>
            <Text style={styles.gabaritoText}>{questao.resposta_esperada}</Text>
          </View>
          {questao.justificativa_pedagogica && (
            <View>
              <Text style={styles.gabaritoLabel}>Justificativa pedagógica:</Text>
              <Text style={styles.gabaritoText}>{questao.justificativa_pedagogica}</Text>
            </View>
          )}
        </View>
      )}

      {/* Explicação (formato legado) */}
      {showGabarito &&
        questao.explicacao &&
        !questao.gabarito &&
        !questao.resposta_esperada && (
          <View style={styles.gabaritoBox}>
            <Text style={styles.gabaritoLabel}>Explicação:</Text>
            <Text style={styles.gabaritoText}>{questao.explicacao}</Text>
          </View>
        )}
    </View>
  );
};

// ============================================================
// SUMMARY SECTION
// ============================================================

const SummarySection: React.FC<{ questoes: Questao[] }> = ({ questoes }) => {
  // Extract unique habilidades
  const habilidades = [
    ...new Set(
      questoes
        .map((q) => q.habilidade_bncc || q.habilidade_relacionada)
        .filter(Boolean)
    ),
  ];

  // Count by difficulty
  const difficulties = questoes.reduce((acc, q) => {
    const diff = q.dificuldade || 'Não especificada';
    acc[diff] = (acc[diff] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <View style={{ marginBottom: 16 }}>
      <View wrap={false}>
        <SectionHeader title="Resumo dos Exercícios" icon="📋" />

        <MetadataBox
          items={[
            { label: 'Total de Questões', value: questoes.length.toString() },
            {
              label: 'Habilidades Abordadas',
              value: habilidades.length > 0 ? habilidades.join(', ') : 'N/A',
            },
            {
              label: 'Distribuição de Dificuldade',
              value: Object.entries(difficulties)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', '),
            },
          ]}
        />
      </View>
    </View>
  );
};

// ============================================================
// MAIN DOCUMENT
// ============================================================

export const ExerciciosPDF: React.FC<ExerciciosPDFProps> = ({ aula, questoes }) => {
  return (
    <Document>
      {/* Cover Page */}
      <CoverPage aula={aula} totalQuestoes={questoes.length} />

      {/* Content Pages */}
      <Page size="A4" style={styles.page}>
        <SummarySection questoes={questoes} />

        <View style={{ marginBottom: 16 }}>
          <View wrap={false}>
            <SectionHeader title="Questões" icon="❓" />
          </View>
          <View style={{ marginTop: 10 }}>
            {questoes.map((questao) => (
              <QuestaoComponent key={questao.numero} questao={questao} showGabarito={true} />
            ))}
          </View>
        </View>

        <PDFFooter pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  );
};
