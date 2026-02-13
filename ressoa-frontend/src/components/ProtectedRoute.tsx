import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '@/stores/auth.store';
import { getHomeRoute } from '@/utils/routing';
import { toast } from 'sonner';
import { useEffect } from 'react';

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

/**
 * Component to handle unauthorized access redirect
 * Separated to avoid React Hooks violation (useEffect in conditional)
 */
function UnauthorizedRedirect({ userRole }: { userRole: string }) {
  const homePath = getHomeRoute(userRole);

  useEffect(() => {
    toast.error('Você não tem permissão para acessar esta página');
  }, []);

  return <Navigate to={homePath} replace />;
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
      // User authenticated but doesn't have required role - redirect to home with toast
      return <UnauthorizedRedirect userRole={user.role} />;
    }
  }

  // If authenticated and token valid (and role matches if specified), render children
  return <>{children}</>;
}
