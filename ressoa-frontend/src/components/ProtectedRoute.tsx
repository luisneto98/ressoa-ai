import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '@/stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[]; // Optional role restriction
}

interface JwtPayload {
  exp: number;
}

// Check if JWT token is expired
function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    // JWT exp is in seconds, Date.now() is in milliseconds
    return decoded.exp * 1000 < Date.now();
  } catch {
    // If decode fails, consider token invalid
    return true;
  }
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, accessToken, logout } = useAuthStore();

  // If not authenticated or token expired, logout and redirect
  if (!user || !accessToken || isTokenExpired(accessToken)) {
    // Clear expired tokens
    if (user && accessToken && isTokenExpired(accessToken)) {
      logout();
    }
    return <Navigate to="/login" replace />;
  }

  // If roles specified, check if user has required role
  if (roles && roles.length > 0) {
    const userHasRole = roles.includes(user.role);
    if (!userHasRole) {
      // User authenticated but doesn't have required role
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      );
    }
  }

  // If authenticated and token valid (and role matches if specified), render children
  return <>{children}</>;
}
