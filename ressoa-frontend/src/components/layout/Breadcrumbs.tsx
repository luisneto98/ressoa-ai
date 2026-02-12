import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment } from 'react';

const ROUTE_LABELS: Record<string, string> = {
  'minhas-aulas': 'Minhas Aulas',
  'aulas': 'Aulas',
  'upload': 'Upload',
  'analise': 'Análise',
  'edit': 'Editar',
  'planejamentos': 'Planejamentos',
  'novo': 'Novo',
  'editar': 'Editar',
  'dashboard': 'Dashboard',
  'cobertura-pessoal': 'Minha Cobertura',
  'coordenador': 'Coordenador',
  'professores': 'Professores',
  'turmas': 'Turmas',
  'detalhes': 'Detalhes',
  'diretor': 'Diretor',
  'admin': 'Admin',
  'monitoramento': 'Monitoramento',
  'stt': 'STT',
  'custos': 'Custos',
  'escolas': 'Escolas',
  'prompts': 'Prompts',
  'qualidade': 'Qualidade',
  'diffs': 'Diffs',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface BreadcrumbEntry {
  label: string;
  path: string;
}

function buildBreadcrumbs(pathname: string): BreadcrumbEntry[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: BreadcrumbEntry[] = [];
  let currentPath = '';

  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Skip UUID segments (dynamic route params)
    if (UUID_REGEX.test(segment)) continue;

    const label = ROUTE_LABELS[segment] ?? segment;
    crumbs.push({ label, path: currentPath });
  }

  return crumbs;
}

export function Breadcrumbs() {
  const { pathname } = useLocation();

  // Explicitly handle root path
  if (pathname === '/') return null;

  const crumbs = buildBreadcrumbs(pathname);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <Fragment key={crumb.path}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
