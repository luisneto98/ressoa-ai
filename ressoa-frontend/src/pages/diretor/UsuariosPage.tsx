import { UsuariosTable } from '@/components/shared/UsuariosTable';

export function DiretorUsuariosPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="font-montserrat text-2xl font-bold text-deep-navy">
        Usuários
      </h1>
      <UsuariosTable
        showRole
        roleFilterOptions={['PROFESSOR', 'COORDENADOR']}
      />
    </div>
  );
}
