import { StyleSheet } from '@react-pdf/renderer';

/**
 * Ressoa AI Design System - PDF Styles
 *
 * Colors from UX Design Specification:
 * - Deep Navy: #0A2647 (primary brand color)
 * - Tech Blue: #2563EB (interactive elements)
 * - Cyan AI: #06B6D4 (AI-related features)
 * - Focus Orange: #F97316 (highlights/warnings)
 * - Ghost White: #F8FAFC (backgrounds)
 *
 * Typography:
 * - Headers: Helvetica-Bold (Montserrat not available in PDF)
 * - Body: Helvetica (Inter not available in PDF)
 */

export const colors = {
  deepNavy: '#0A2647',
  techBlue: '#2563EB',
  cyanAI: '#06B6D4',
  focusOrange: '#F97316',
  ghostWhite: '#F8FAFC',

  // Extended palette
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Status colors
  green50: '#F0FDF4',
  green100: '#DCFCE7',
  green500: '#22C55E',
  green600: '#16A34A',
  green700: '#15803D',
  green800: '#166534',

  yellow50: '#FEFCE8',
  yellow100: '#FEF9C3',
  yellow400: '#FACC15',
  yellow500: '#EAB308',
  yellow800: '#854D0E',

  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue500: '#3B82F6',
  blue800: '#1E40AF',
  blue900: '#1E3A8A',

  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red400: '#F87171',
  red500: '#EF4444',
  red600: '#DC2626',

  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber700: '#B45309',
  amber800: '#92400E',

  purple500: '#A855F7',
  rose500: '#F43F5E',

  white: '#FFFFFF',
  black: '#000000',
};

export const styles = StyleSheet.create({
  // Page layout
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: colors.white,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
  },

  // Cover page
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.deepNavy,
    margin: -40,
    padding: 40,
  },

  coverTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },

  coverSubtitle: {
    fontSize: 16,
    color: colors.ghostWhite,
    marginBottom: 40,
    textAlign: 'center',
  },

  coverInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },

  coverInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  coverInfoLabel: {
    fontSize: 12,
    color: colors.ghostWhite,
    fontFamily: 'Helvetica-Bold',
    width: 120,
  },

  coverInfoValue: {
    fontSize: 12,
    color: colors.white,
    flex: 1,
  },

  coverFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.ghostWhite,
    fontSize: 10,
  },

  // Headers
  h1: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: colors.deepNavy,
    marginTop: 20,
    marginBottom: 12,
  },

  h2: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.deepNavy,
    marginTop: 16,
    marginBottom: 10,
  },

  h3: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.deepNavy,
    marginTop: 12,
    marginBottom: 8,
  },

  h4: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray700,
    marginTop: 10,
    marginBottom: 6,
  },

  // Text
  body: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.gray700,
  },

  bodyLarge: {
    fontSize: 11,
    lineHeight: 1.6,
    color: colors.gray700,
  },

  small: {
    fontSize: 9,
    color: colors.gray600,
  },

  tiny: {
    fontSize: 8,
    color: colors.gray500,
  },

  bold: {
    fontFamily: 'Helvetica-Bold',
  },

  italic: {
    fontFamily: 'Helvetica-Oblique',
  },

  // Sections
  section: {
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: `2 solid ${colors.cyanAI}`,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.deepNavy,
  },

  // Cards
  card: {
    backgroundColor: colors.gray50,
    padding: 12,
    marginBottom: 10,
    borderRadius: 6,
    border: `1 solid ${colors.gray200}`,
  },

  cardHeader: {
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.deepNavy,
    marginBottom: 4,
  },

  cardContent: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.gray700,
  },

  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginRight: 6,
  },

  badgeSuccess: {
    backgroundColor: colors.green100,
    color: colors.green800,
  },

  badgeWarning: {
    backgroundColor: colors.yellow100,
    color: colors.yellow800,
  },

  badgeInfo: {
    backgroundColor: colors.blue100,
    color: colors.blue800,
  },

  badgeDanger: {
    backgroundColor: colors.red100,
    color: colors.red600,
  },

  badgeSecondary: {
    backgroundColor: colors.gray200,
    color: colors.gray700,
  },

  // Lists
  list: {
    marginTop: 6,
    marginBottom: 6,
  },

  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  listBullet: {
    width: 12,
    color: colors.gray400,
  },

  listContent: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.gray700,
  },

  // Score circle (nota geral)
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  scoreCircleHigh: {
    backgroundColor: colors.green500,
  },

  scoreCircleMedium: {
    backgroundColor: colors.yellow400,
  },

  scoreCircleLow: {
    backgroundColor: colors.red400,
  },

  scoreValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
  },

  scoreLabel: {
    fontSize: 7,
    color: colors.white,
  },

  // Grid
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  col: {
    flex: 1,
  },

  col2: {
    flex: 2,
  },

  // Cobertura (BNCC/Custom)
  coberturaCard: {
    backgroundColor: colors.white,
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
    border: `1 solid ${colors.gray200}`,
    borderLeft: `4 solid ${colors.cyanAI}`,
  },

  coberturaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },

  coberturaCodigo: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.deepNavy,
    marginRight: 8,
  },

  coberturaDescricao: {
    fontSize: 9,
    color: colors.gray600,
    marginBottom: 6,
    lineHeight: 1.4,
  },

  evidenciaBox: {
    backgroundColor: colors.gray50,
    padding: 8,
    borderRadius: 4,
    borderLeft: `3 solid ${colors.cyanAI}`,
    marginTop: 6,
  },

  evidenciaLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray600,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  evidenciaText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
    color: colors.gray700,
    lineHeight: 1.4,
    marginBottom: 3,
  },

  // Qualitativa cards
  qualitativaCard: {
    backgroundColor: colors.gray50,
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
    border: `1 solid ${colors.gray200}`,
  },

  qualitativaTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.deepNavy,
    marginBottom: 6,
  },

  qualitativaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  qualitativaLabel: {
    fontSize: 9,
    color: colors.gray600,
    width: 120,
  },

  qualitativaValue: {
    fontSize: 9,
    color: colors.gray800,
    flex: 1,
  },

  // Exercicios
  questaoCard: {
    backgroundColor: colors.white,
    padding: 12,
    marginBottom: 14,
    borderRadius: 4,
    border: `1 solid ${colors.gray200}`,
  },

  questaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },

  questaoNumero: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.deepNavy,
    marginRight: 8,
  },

  questaoEnunciado: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.gray800,
    marginBottom: 8,
  },

  alternativaRow: {
    flexDirection: 'row',
    marginBottom: 4,
    padding: 6,
    borderRadius: 3,
    backgroundColor: colors.gray50,
  },

  alternativaCorreta: {
    backgroundColor: colors.green50,
    borderLeft: `3 solid ${colors.green500}`,
  },

  alternativaLetra: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray700,
    width: 20,
  },

  alternativaTexto: {
    fontSize: 9,
    color: colors.gray700,
    flex: 1,
    lineHeight: 1.4,
  },

  gabaritoBox: {
    backgroundColor: colors.blue50,
    padding: 8,
    borderRadius: 4,
    border: `1 solid ${colors.blue200}`,
    marginTop: 8,
  },

  gabaritoLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.blue900,
    marginBottom: 4,
  },

  gabaritoText: {
    fontSize: 9,
    color: colors.blue800,
    lineHeight: 1.4,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTop: `1 solid ${colors.gray200}`,
  },

  footerText: {
    fontSize: 8,
    color: colors.gray500,
  },

  footerBrand: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.cyanAI,
  },

  // Metadata
  metadataBox: {
    backgroundColor: colors.gray50,
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
  },

  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  metadataLabel: {
    fontSize: 8,
    color: colors.gray600,
  },

  metadataValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray800,
  },

  // Utility
  spacer: {
    height: 10,
  },

  spacerLarge: {
    height: 20,
  },

  divider: {
    borderBottom: `1 solid ${colors.gray200}`,
    marginVertical: 12,
  },

  textCenter: {
    textAlign: 'center',
  },

  textRight: {
    textAlign: 'right',
  },

  flexRow: {
    flexDirection: 'row',
  },

  flexCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  flexBetween: {
    justifyContent: 'space-between',
  },

  flexWrap: {
    flexWrap: 'wrap',
  },
});

/**
 * Helper functions for dynamic styles
 */
export const getScoreColor = (nota: number) => {
  if (nota >= 8) return colors.green500;
  if (nota >= 6) return colors.yellow400;
  return colors.red400;
};

export const getCoberturaBadgeColors = (nivel: string) => {
  switch (nivel) {
    case 'COMPLETE':
      return { bg: colors.green100, text: colors.green800 };
    case 'PARTIAL':
      return { bg: colors.yellow100, text: colors.yellow800 };
    case 'MENTIONED':
      return { bg: colors.blue100, text: colors.blue800 };
    case 'NOT_COVERED':
      return { bg: colors.gray200, text: colors.gray600 };
    default:
      return { bg: colors.gray200, text: colors.gray600 };
  }
};

export const getNivelBloomColor = (nivel: number) => {
  const colorMap: Record<number, string> = {
    1: colors.blue500,
    2: colors.green500,
    3: colors.yellow500,
    4: colors.amber500,
    5: colors.focusOrange,
    6: colors.purple500,
  };
  return colorMap[nivel] || colors.gray500;
};
