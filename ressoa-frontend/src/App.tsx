import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PlanejamentoWizard } from '@/pages/planejamento/PlanejamentoWizard';
import { PlanejamentosListPage } from '@/pages/planejamento/PlanejamentosListPage';
import UploadAulaPage from '@/pages/aulas/UploadAulaPage';
import AulasListPage from '@/pages/aulas/AulasListPage';
import { AulaAnalisePage } from '@/pages/aulas/AulaAnalisePage';
import { AulaAnaliseEditPage } from '@/pages/aulas/AulaAnaliseEditPage';
import { CoberturaPessoalPage } from '@/pages/dashboard/CoberturaPessoalPage';
import { DashboardCoordenadorProfessoresPage } from '@/pages/dashboard/DashboardCoordenadorProfessoresPage';
import { DashboardCoordenadorProfessorTurmasPage } from '@/pages/dashboard/DashboardCoordenadorProfessorTurmasPage';
import { DashboardCoordenadorTurmasPage } from '@/pages/dashboard/DashboardCoordenadorTurmasPage';
import { DashboardCoordenadorTurmaDetalhesPage } from '@/pages/dashboard/DashboardCoordenadorTurmaDetalhesPage';
import { DashboardDiretorPage } from '@/pages/dashboard/DashboardDiretorPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Component to handle auth logout event
function AuthEventListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = () => {
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthEventListener />
          <Routes>
        {/* Public route: Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes: Authenticated pages */}
        <Route
          path="/minhas-aulas"
          element={
            <ProtectedRoute>
              <AulasListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-coordenador"
          element={
            <ProtectedRoute>
              <div className="min-h-screen flex items-center justify-center bg-ghost-white">
                <div className="text-center">
                  <h1 className="text-3xl font-montserrat font-bold text-deep-navy mb-4">
                    Dashboard Coordenador
                  </h1>
                  <p className="text-muted-foreground">(Página em desenvolvimento - Epic 7)</p>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        {/* Dashboard Diretor Route - Story 7.4 */}
        <Route
          path="/dashboard/diretor"
          element={
            <ProtectedRoute roles={['DIRETOR']}>
              <DashboardDiretorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div className="min-h-screen flex items-center justify-center bg-ghost-white">
                <div className="text-center">
                  <h1 className="text-3xl font-montserrat font-bold text-deep-navy mb-4">
                    Dashboard
                  </h1>
                  <p className="text-muted-foreground">(Página em desenvolvimento)</p>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <div className="min-h-screen flex items-center justify-center bg-ghost-white">
                <div className="text-center">
                  <h1 className="text-3xl font-montserrat font-bold text-deep-navy mb-4">
                    Admin Dashboard
                  </h1>
                  <p className="text-muted-foreground">(Página em desenvolvimento - Story 1.6)</p>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Dashboard Routes - Story 6.5 */}
        <Route
          path="/dashboard/cobertura-pessoal"
          element={
            <ProtectedRoute>
              <CoberturaPessoalPage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard Coordenador Routes - Story 7.2 */}
        <Route
          path="/dashboard/coordenador/professores"
          element={
            <ProtectedRoute roles={['COORDENADOR', 'DIRETOR']}>
              <DashboardCoordenadorProfessoresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordenador/professores/:professorId/turmas"
          element={
            <ProtectedRoute roles={['COORDENADOR', 'DIRETOR']}>
              <DashboardCoordenadorProfessorTurmasPage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard Coordenador Routes - Story 7.3 */}
        <Route
          path="/dashboard/coordenador/turmas"
          element={
            <ProtectedRoute roles={['COORDENADOR', 'DIRETOR']}>
              <DashboardCoordenadorTurmasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordenador/turmas/:turmaId/detalhes"
          element={
            <ProtectedRoute roles={['COORDENADOR', 'DIRETOR']}>
              <DashboardCoordenadorTurmaDetalhesPage />
            </ProtectedRoute>
          }
        />

        {/* Aula Routes - Story 3.4, 6.1 */}
        <Route
          path="/aulas/upload"
          element={
            <ProtectedRoute>
              <UploadAulaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aulas/:aulaId/analise"
          element={
            <ProtectedRoute>
              <AulaAnalisePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aulas/:aulaId/analise/edit"
          element={
            <ProtectedRoute>
              <AulaAnaliseEditPage />
            </ProtectedRoute>
          }
        />

        {/* Planejamento Routes - Story 2.3 & 2.4 */}
        <Route
          path="/planejamentos/novo"
          element={
            <ProtectedRoute>
              <PlanejamentoWizard mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planejamentos/:id/editar"
          element={
            <ProtectedRoute>
              <PlanejamentoWizard mode="edit" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planejamentos"
          element={
            <ProtectedRoute>
              <PlanejamentosListPage />
            </ProtectedRoute>
          }
        />

        {/* Default route: Redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* 404 catch-all: Redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
