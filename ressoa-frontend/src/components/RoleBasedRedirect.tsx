import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { getHomeRoute } from '@/utils/routing';

/**
 * Redireciona usuário autenticado para sua home route baseada no role
 * Usado em rotas placeholder que devem redirecionar dinamicamente
 *
 * @example
 * <Route path="/dashboard" element={<RoleBasedRedirect />} />
 */
export function RoleBasedRedirect() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    // Se não autenticado, redirecionar para login (não deveria acontecer em ProtectedRoute)
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getHomeRoute(user.role)} replace />;
}
