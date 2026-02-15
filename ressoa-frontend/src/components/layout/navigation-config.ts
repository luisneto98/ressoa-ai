import {
  Home,
  Upload,
  BookOpen,
  BarChart3,
  Users,
  Building2,
  Shield,
  Settings,
  GraduationCap,
  Mail,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  isCTA?: boolean; // Indica se item deve ser renderizado como CTA destacado (Focus Orange)
}

const NAVIGATION: Record<string, NavItem[]> = {
  PROFESSOR: [
    { label: 'Minhas Aulas', path: '/minhas-aulas', icon: Home },
    { label: 'Nova Aula', path: '/aulas/upload', icon: Upload, isCTA: true },
    { label: 'Planejamentos', path: '/planejamentos', icon: BookOpen },
    { label: 'Minha Cobertura', path: '/dashboard/cobertura-pessoal', icon: BarChart3 },
  ],
  COORDENADOR: [
    { label: 'Professores', path: '/dashboard/coordenador/professores', icon: Users },
    { label: 'Convidar Professor', path: '/coordenador/professores', icon: UserPlus },
    { label: 'Cadastro de Turmas', path: '/turmas', icon: GraduationCap },
    { label: 'Dashboard Turmas', path: '/dashboard/coordenador/turmas', icon: BarChart3 },
    { label: 'Convites', path: '/convites', icon: Mail },
    { label: 'Planejamentos', path: '/planejamentos', icon: BookOpen },
  ],
  DIRETOR: [
    { label: 'Visão Geral', path: '/dashboard/diretor', icon: Building2 },
    { label: 'Coordenadores', path: '/coordenadores', icon: UserPlus },
    { label: 'Professores', path: '/dashboard/coordenador/professores', icon: Users },
    { label: 'Cadastro de Turmas', path: '/turmas', icon: GraduationCap },
    { label: 'Convites', path: '/convites', icon: Mail },
    { label: 'Dashboard Turmas', path: '/dashboard/coordenador/turmas', icon: BarChart3 },
  ],
  ADMIN: [
    { label: 'Escolas', path: '/admin/escolas', icon: Building2 },
    { label: 'Usuários', path: '/admin/usuarios', icon: Users },
    { label: 'Monitoramento STT', path: '/admin/monitoramento/stt', icon: Settings },
    { label: 'Monitoramento Análise', path: '/admin/monitoramento/analise', icon: BarChart3 },
    { label: 'Custos', path: '/admin/custos/escolas', icon: BarChart3 },
    { label: 'Qualidade Prompts', path: '/admin/prompts/qualidade', icon: Shield },
    { label: 'Convites', path: '/convites', icon: Mail },
  ],
};

export function getNavigationForRole(role: string): NavItem[] {
  return NAVIGATION[role] ?? [];
}
