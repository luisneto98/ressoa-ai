import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '@/stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
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

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, accessToken, logout } = useAuthStore();

  // If not authenticated or token expired, logout and redirect
  if (!user || !accessToken || isTokenExpired(accessToken)) {
    // Clear expired tokens
    if (user && accessToken && isTokenExpired(accessToken)) {
      logout();
    }
    return <Navigate to="/login" replace />;
  }

  // If authenticated and token valid, render children
  return <>{children}</>;
}
