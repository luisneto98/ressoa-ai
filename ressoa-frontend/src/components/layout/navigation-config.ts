import {
  Home,
  Upload,
  BookOpen,
  BarChart3,
  Users,
  Building2,
  Shield,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const NAVIGATION: Record<string, NavItem[]> = {
  PROFESSOR: [
    { label: 'Minhas Aulas', path: '/minhas-aulas', icon: Home },
    { label: 'Upload', path: '/aulas/upload', icon: Upload },
    { label: 'Planejamentos', path: '/planejamentos', icon: BookOpen },
    { label: 'Minha Cobertura', path: '/dashboard/cobertura-pessoal', icon: BarChart3 },
  ],
  COORDENADOR: [
    { label: 'Professores', path: '/dashboard/coordenador/professores', icon: Users },
    { label: 'Turmas', path: '/dashboard/coordenador/turmas', icon: Building2 },
  ],
  DIRETOR: [
    { label: 'Visão Geral', path: '/dashboard/diretor', icon: Building2 },
    { label: 'Professores', path: '/dashboard/coordenador/professores', icon: Users },
    { label: 'Turmas', path: '/dashboard/coordenador/turmas', icon: BarChart3 },
  ],
  ADMIN: [
    { label: 'Monitoramento STT', path: '/admin/monitoramento/stt', icon: Settings },
    { label: 'Monitoramento Análise', path: '/admin/monitoramento/analise', icon: BarChart3 },
    { label: 'Custos', path: '/admin/custos/escolas', icon: Building2 },
    { label: 'Qualidade Prompts', path: '/admin/prompts/qualidade', icon: Shield },
  ],
};

export function getNavigationForRole(role: string): NavItem[] {
  return NAVIGATION[role] ?? [];
}
