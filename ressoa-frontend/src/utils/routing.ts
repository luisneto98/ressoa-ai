/**
 * Routing utilities for role-based navigation
 * @module utils/routing
 */

/**
 * Valid user roles in the Ressoa AI system
 *
 * - PROFESSOR: Teacher who creates lesson plans and uploads classes
 * - COORDENADOR: Coordinator who monitors teachers and classes
 * - DIRETOR: School director with access to all coordinator dashboards
 * - ADMIN: System administrator with monitoring and cost dashboards
 *
 * Note: ALUNO role is intentionally excluded from MVP scope
 */
export type UserRole = 'PROFESSOR' | 'COORDENADOR' | 'DIRETOR' | 'ADMIN';

/**
 * Retorna a rota inicial (home) baseada no role do usuário
 *
 * @param role - Role do usuário autenticado
 * @returns Caminho da rota home para o role
 *
 * @example
 * getHomeRoute('PROFESSOR') // '/minhas-aulas'
 * getHomeRoute('DIRETOR') // '/dashboard/diretor'
 * getHomeRoute('UNKNOWN') // '/minhas-aulas' (fallback)
 */
export function getHomeRoute(role: string): string {
  const HOME_ROUTES: Record<UserRole, string> = {
    PROFESSOR: '/minhas-aulas',
    COORDENADOR: '/dashboard/coordenador/professores',
    DIRETOR: '/dashboard/diretor',
    ADMIN: '/admin/monitoramento/stt',
  };

  return HOME_ROUTES[role as UserRole] ?? '/minhas-aulas'; // Fallback seguro
}
