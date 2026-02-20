import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/axios';

interface Turma {
  id: string;
  nome: string;
  disciplina: string;
  serie: string; // Prisma enum value: "SEXTO_ANO" | "SETIMO_ANO" | "OITAVO_ANO" | "NONO_ANO" etc.
}

interface Habilidade {
  id: string;
  habilidade_id: string;
  habilidade: {
    codigo: string;
    descricao: string;
  };
  peso?: number;
  aulas_previstas?: number;
}

export interface Planejamento {
  id: string;
  turma_id: string;
  turma: Turma;
  bimestre: number;
  ano_letivo: number;
  validado_coordenacao: boolean;
  descricao?: string | null; // Epic 16 - Contexto bimestral do professor
  habilidades: Habilidade[];
  created_at: string;
  updated_at: string;
}

interface UsePlanejamentosParams {
  turma_id?: string;
  bimestre?: number;
  ano_letivo?: number;
}

export const usePlanejamentos = (params: UsePlanejamentosParams) => {
  return useQuery({
    queryKey: ['planejamentos', params],
    queryFn: async () => {
      // Remove undefined params
      const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const { data } = await apiClient.get<Planejamento[]>('/planejamentos', {
        params: cleanParams
      });

      // TODO: Move sorting to backend for better performance and proper DB index usage
      // Backend should accept query params: ?sort=ano_letivo:desc,bimestre:desc,turma.nome:asc
      // For now, sorting on client side (acceptable for MVP scale)

      // Sort: ano_letivo DESC, bimestre DESC, turma.nome ASC
      return data.sort((a: Planejamento, b: Planejamento) => {
        if (a.ano_letivo !== b.ano_letivo) {
          return b.ano_letivo - a.ano_letivo; // DESC
        }
        if (a.bimestre !== b.bimestre) {
          return b.bimestre - a.bimestre; // DESC
        }
        return a.turma.nome.localeCompare(b.turma.nome); // ASC
      });
    },
  });
};
