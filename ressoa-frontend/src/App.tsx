import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute, RoleBasedRedirect, RootRedirect } from '@/components';
import { AppLayout } from '@/components/layout';
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
import { MonitoramentoSTTPage } from '@/pages/admin/MonitoramentoSTTPage';
import { MonitoramentoAnalisePage } from '@/pages/admin/MonitoramentoAnalisePage';
import { CustosEscolasPage } from '@/pages/admin/CustosEscolasPage';
import { QualidadePromptsPage } from '@/pages/admin/QualidadePromptsPage';
import { PromptDiffsPage } from '@/pages/admin/PromptDiffsPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { AcceptInvitationPage } from '@/pages/AcceptInvitationPage';
import TurmasListPage from '@/pages/turmas/TurmasListPage';
import { CoordenadoresPage } from '@/pages/diretor/CoordenadoresPage';
import { ProfessoresPage } from '@/pages/coordenador/ProfessoresPage';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Prevent refetch on window focus to avoid rate limiting
      refetchOnMount: false, // Prevent refetch on component mount (use cached data)
      refetchOnReconnect: false, // Prevent refetch on network reconnect
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
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/aceitar-convite" element={<AcceptInvitationPage />} />

        {/* Protected routes: All use AppLayout with Sidebar + Header */}
        <Route element={<AppLayout />}>
          <Route
            path="/minhas-aulas"
            element={
              <ProtectedRoute roles={['PROFESSOR']}>
                <AulasListPage />
              </ProtectedRoute>
            }
          />
          {/* Legacy route redirect: /dashboard-coordenador → /dashboard/coordenador/professores */}
          <Route
            path="/dashboard-coordenador"
            element={<Navigate to="/dashboard/coordenador/professores" replace />}
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
          {/* Generic dashboard route - redirect to user's home based on role */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            }
          />
          {/* Legacy admin route redirect: /admin → /admin/monitoramento/stt */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/monitoramento/stt" replace />}
          />

          {/* Admin Monitoramento Routes - Story 8.1, 8.2 */}
          <Route
            path="/admin/monitoramento/stt"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <MonitoramentoSTTPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/monitoramento/analise"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <MonitoramentoAnalisePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Custos Route - Story 8.3 */}
          <Route
            path="/admin/custos/escolas"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <CustosEscolasPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Prompts Quality Routes - Story 8.4 */}
          <Route
            path="/admin/prompts/qualidade"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <QualidadePromptsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/prompts/:nome/:versao/diffs"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <PromptDiffsPage />
              </ProtectedRoute>
            }
          />

          {/* Dashboard Routes - Story 6.5 */}
          <Route
            path="/dashboard/cobertura-pessoal"
            element={
              <ProtectedRoute roles={['PROFESSOR']}>
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
              <ProtectedRoute roles={['PROFESSOR']}>
                <UploadAulaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/aulas/:aulaId/analise"
            element={
              <ProtectedRoute roles={['PROFESSOR']}>
                <AulaAnalisePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/aulas/:aulaId/analise/edit"
            element={
              <ProtectedRoute roles={['PROFESSOR']}>
                <AulaAnaliseEditPage />
              </ProtectedRoute>
            }
          />

          {/* Planejamento Routes - Story 2.3 & 2.4 */}
          <Route
            path="/planejamentos/novo"
            element={
              <ProtectedRoute roles={['PROFESSOR']}>
                <PlanejamentoWizard mode="create" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planejamentos/:id/editar"
            element={
              <ProtectedRoute roles={['PROFESSOR']}>
                <PlanejamentoWizard mode="edit" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planejamentos"
            element={
              <ProtectedRoute roles={['PROFESSOR', 'COORDENADOR', 'DIRETOR']}>
                <PlanejamentosListPage />
              </ProtectedRoute>
            }
          />

          {/* Turmas Route - Story 10.4 */}
          <Route
            path="/turmas"
            element={
              <ProtectedRoute roles={['COORDENADOR', 'DIRETOR']}>
                <TurmasListPage />
              </ProtectedRoute>
            }
          />

          {/* Coordenadores Route - Story 13.4 */}
          <Route
            path="/coordenadores"
            element={
              <ProtectedRoute roles={['DIRETOR']}>
                <CoordenadoresPage />
              </ProtectedRoute>
            }
          />

          {/* Professores Route (Coordenador) - Story 13.6 */}
          <Route
            path="/coordenador/professores"
            element={
              <ProtectedRoute roles={['COORDENADOR']}>
                <ProfessoresPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Root route: Smart redirect based on authentication */}
        <Route path="/" element={<RootRedirect />} />
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
