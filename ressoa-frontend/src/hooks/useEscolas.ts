import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/axios';
import type { EscolaFormData } from '@/lib/validation/escola.schema';

/**
 * Interface de resposta da API para escola (Epic 13 Story 13.1)
 * Campos retornados pelo EscolaResponseDto do backend
 */
export interface Escola {
  id: string;
  nome: string;
  cnpj: string; // Sem formatação (14 dígitos)
  tipo: 'particular' | 'publica_municipal' | 'publica_estadual';
  contato_principal: string;
  email_contato: string;
  telefone: string; // Sem formatação (10-11 dígitos)
  plano: string;
  limite_horas_mes: number;
  status: string; // 'ativa', 'inativa', 'suspensa'
  data_ativacao: string; // ISO 8601 DateTime
  created_at: string; // ISO 8601 DateTime
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
}

/**
 * Hook para criar escola (POST /api/v1/admin/schools)
 * Features:
 * - Invalidates query cache ['escolas'] on success
 * - Throws error for manual handling (409 Conflict, 400 Bad Request)
 */
export function useCreateEscola() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EscolaFormData) => {
      const response = await apiClient.post<Escola>('/admin/schools', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate escolas list query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['escolas'] });
    },
  });
}

/**
 * Hook para listar escolas (GET /api/v1/admin/schools)
 * Future story: Story 13-7 (Listar usuários cadastrados)
 * Nota: Endpoint ainda não implementado no backend (será criado em story futura)
 */
export function useEscolas() {
  return useQuery({
    queryKey: ['escolas'],
    queryFn: async () => {
      const response = await apiClient.get<Escola[]>('/admin/schools');
      return response.data;
    },
    // Disable query por enquanto (endpoint não existe)
    enabled: false,
  });
}

/**
 * Hook para convidar diretor por email (POST /api/v1/admin/invite-director)
 * Story 13.2 - AC12: Submit do convite com loading state
 *
 * Features:
 * - Envia convite com token único de 24h
 * - Throws error para tratamento manual (409 Conflict, 404 Not Found, 400 Bad Request)
 * - Não invalida cache (diretor ainda não está cadastrado)
 */
export function useInviteDirector() {
  return useMutation({
    mutationFn: async (data: { escola_id: string; email: string; nome: string }) => {
      const response = await apiClient.post<{ message: string }>(
        '/admin/invite-director',
        data
      );
      return response.data;
    },
    // Não invalida queries porque diretor ainda não foi criado
    // Criação só acontece quando diretor aceita o convite (Story 13.3)
  });
}
