import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

// User interface matching backend response
export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'PROFESSOR' | 'COORDENADOR' | 'DIRETOR' | 'ADMIN';
  escola_id: string;
}

interface JwtPayload {
  exp: number;
}

// Check if JWT token is expired
function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Tokens interface
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// Auth state interface
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (tokens: Tokens, user: User) => void;
  logout: () => void;
}

// Create Zustand store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      // Login action: save tokens and user
      login: (tokens: Tokens, user: User) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
        }),

      // Logout action: clear all auth state
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        }),
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      // Validate tokens on rehydration from localStorage
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && isTokenExpired(state.accessToken)) {
          // Access token expired, clear auth state
          state.logout();
        }
      },
    }
  )
);
