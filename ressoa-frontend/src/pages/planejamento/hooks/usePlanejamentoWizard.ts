import { create } from 'zustand';
import type { Turma as TurmaGlobal, CurriculoTipo, ContextoPedagogicoDto } from '@/types/turma';

// Extend global Turma type with wizard-specific fields
export interface Turma extends Omit<TurmaGlobal, 'serie'> {
  serie: string; // Wizard uses string, not Serie enum
  ano_letivo: number;
  curriculo_tipo?: CurriculoTipo; // Story 11.6 - for conditional Step 2
  contexto_pedagogico?: ContextoPedagogicoDto; // Story 11.6 - for custom objectives
}

export interface Habilidade {
  id: string;
  codigo: string;
  descricao: string;
  unidade_tematica?: string;
  competencia_especifica?: string; // Story 10.5 - For Ensino Médio
  metadata?: {
    area_conhecimento?: string; // Story 10.5 - For Ensino Médio
  };
}

interface PlanejamentoWizardState {
  currentStep: 1 | 2 | 3;
  formData: {
    turma_id: string;
    turma?: Turma; // Full turma object (for disciplina/serie in Step 2)
    bimestre: number;
    ano_letivo: number;
    descricao?: string; // Epic 16 - Contexto bimestral do professor
  };
  selectedHabilidades: Habilidade[];

  // Actions
  setCurrentStep: (step: 1 | 2 | 3) => void;
  nextStep: () => void;
  prevStep: () => void;
  setFormData: (
    data: Partial<PlanejamentoWizardState['formData']>,
  ) => void;
  toggleHabilidade: (habilidade: Habilidade) => void;
  removeHabilidade: (id: string) => void;
  reset: () => void;
}

export const usePlanejamentoWizard = create<PlanejamentoWizardState>(
  (set) => ({
    currentStep: 1,
    formData: {
      turma_id: '',
      bimestre: 1,
      ano_letivo: new Date().getFullYear(),
    },
    selectedHabilidades: [],

    setCurrentStep: (step) => set({ currentStep: step }),
    nextStep: () =>
      set((state) => ({
        currentStep: Math.min(state.currentStep + 1, 3) as 1 | 2 | 3,
      })),
    prevStep: () =>
      set((state) => ({
        currentStep: Math.max(state.currentStep - 1, 1) as 1 | 2 | 3,
      })),
    setFormData: (data) =>
      set((state) => ({
        formData: { ...state.formData, ...data },
      })),
    toggleHabilidade: (habilidade) =>
      set((state) => {
        const exists = state.selectedHabilidades.find(
          (h) => h.id === habilidade.id,
        );
        return {
          selectedHabilidades: exists
            ? state.selectedHabilidades.filter((h) => h.id !== habilidade.id)
            : [...state.selectedHabilidades, habilidade],
        };
      }),
    removeHabilidade: (id) =>
      set((state) => ({
        selectedHabilidades: state.selectedHabilidades.filter(
          (h) => h.id !== id,
        ),
      })),
    reset: () =>
      set({
        currentStep: 1,
        formData: {
          turma_id: '',
          bimestre: 1,
          ano_letivo: new Date().getFullYear(),
        },
        selectedHabilidades: [],
      }),
  }),
);
