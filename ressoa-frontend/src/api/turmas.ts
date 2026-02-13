import { apiClient } from '@/api/axios';
import type { Turma, CreateTurmaDto, UpdateTurmaDto } from '@/types/turma';

/**
 * API client for Turmas CRUD operations
 * Story 10.4 - Frontend Gestão de Turmas
 *
 * Multi-tenancy: escola_id is automatically injected via JWT token in axios interceptor
 * RBAC: DIRETOR and COORDENADOR can create/edit, DIRETOR can delete
 */

// GET all turmas for the authenticated user's escola
export const fetchTurmas = async (): Promise<Turma[]> => {
  const response = await apiClient.get('/turmas');
  return response.data;
};

// GET single turma by ID
export const fetchTurmaById = async (id: string): Promise<Turma> => {
  const response = await apiClient.get(`/turmas/${id}`);
  return response.data;
};

// POST create new turma
export const createTurma = async (data: CreateTurmaDto): Promise<Turma> => {
  const response = await apiClient.post('/turmas', data);
  return response.data;
};

// PATCH update existing turma
export const updateTurma = async (id: string, data: UpdateTurmaDto): Promise<Turma> => {
  const response = await apiClient.patch(`/turmas/${id}`, data);
  return response.data;
};

// DELETE turma (soft delete on backend)
export const deleteTurma = async (id: string): Promise<void> => {
  await apiClient.delete(`/turmas/${id}`);
};

// GET professores for turma form (COORDENADOR/DIRETOR only)
export const fetchProfessores = async (): Promise<{ id: string; nome: string; email: string }[]> => {
  const response = await apiClient.get('/turmas/professores');
  return response.data;
};
