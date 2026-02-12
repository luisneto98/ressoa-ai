import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { getHomeRoute } from '@/utils/routing';

/**
 * Redireciona rota raiz `/` para:
 * - Home do usuário se autenticado (baseado em role)
 * - Login se NÃO autenticado
 *
 * @example
 * <Route path="/" element={<RootRedirect />} />
 */
export function RootRedirect() {
  const user = useAuthStore((s) => s.user);

  if (user) {
    // Autenticado → ir para home do role
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  // Não autenticado → ir para login
  return <Navigate to="/login" replace />;
}
