import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  // Planejamentos timeline expansion state
  expandedBimestres: Record<string, boolean>; // key: `turma-{id}-bimestre-{N}`
  toggleBimestre: (key: string) => void;

  // View mode for planejamentos page
  planejamentosViewMode: 'table' | 'timeline';
  setPlanejamentosViewMode: (mode: 'table' | 'timeline') => void;
}

/**
 * UI Store - Gerencia estado de interface persistente
 *
 * Usa Zustand com persist middleware para salvar em localStorage.
 *
 * Features:
 * - Estado de expansão de timeline de planejamentos (por turma/bimestre)
 * - Modo de visualização preferido (table vs timeline)
 *
 * @example
 * const viewMode = useUIStore(state => state.planejamentosViewMode);
 * const setViewMode = useUIStore(state => state.setPlanejamentosViewMode);
 */
export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Timeline expansion
      expandedBimestres: {},
      toggleBimestre: (key) =>
        set((state) => ({
          expandedBimestres: {
            ...state.expandedBimestres,
            [key]: !state.expandedBimestres[key],
          },
        })),

      // View mode preference
      planejamentosViewMode: 'table', // Default: table (backward compatible)
      setPlanejamentosViewMode: (mode) =>
        set({ planejamentosViewMode: mode }),
    }),
    {
      name: 'ressoa-ui-storage', // localStorage key
    }
  )
);
