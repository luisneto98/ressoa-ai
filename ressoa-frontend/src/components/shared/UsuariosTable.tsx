import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { IconSearch, IconUsers } from '@tabler/icons-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useUsuarios } from '@/hooks/useUsuarios';

type RoleOption = 'PROFESSOR' | 'COORDENADOR' | 'DIRETOR' | 'ADMIN';

interface UsuariosTableProps {
  showEscola?: boolean;
  showRole?: boolean;
  roleFilterOptions?: RoleOption[];
}

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> =
  {
    PROFESSOR: 'default',
    COORDENADOR: 'secondary',
    DIRETOR: 'outline',
    ADMIN: 'outline',
  };

const ROLE_LABELS: Record<string, string> = {
  PROFESSOR: 'Professor',
  COORDENADOR: 'Coordenador',
  DIRETOR: 'Diretor',
  ADMIN: 'Admin',
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatDate(dateStr: string): string {
  return dateFormatter.format(new Date(dateStr));
}

export function UsuariosTable({
  showEscola = false,
  showRole = true,
  roleFilterOptions = [],
}: UsuariosTableProps) {
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const debouncedSearch = useDebouncedValue(searchValue, 300);

  const { data, isLoading, isFetching } = useUsuarios({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
  });

  // Reset page when debounced search or role filter actually changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  const usuarios = data?.data ?? [];
  const pagination = data?.pagination;

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value === 'ALL' ? '' : value);
  };

  // Show skeleton only on initial load (no cached data yet)
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          {roleFilterOptions.length > 0 && <Skeleton className="h-10 w-48" />}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <IconSearch
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            aria-label="Buscar usuários por nome ou email"
          />
        </div>
        {roleFilterOptions.length > 0 && (
          <Select
            value={roleFilter || 'ALL'}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger
              className="w-full sm:w-48"
              aria-label="Filtrar por perfil"
            >
              <SelectValue placeholder="Todos os perfis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              {roleFilterOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role] ?? role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Empty state */}
      {usuarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <IconUsers size={48} aria-hidden="true" />
          <p className="mt-4 text-lg">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div
            className={`rounded-md border transition-opacity ${isFetching ? 'opacity-60' : ''}`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  {showRole && <TableHead>Perfil</TableHead>}
                  {showEscola && <TableHead>Escola</TableHead>}
                  <TableHead>Data Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow
                    key={usuario.id}
                    className="h-11 hover:bg-ghost-white/50"
                  >
                    <TableCell className="font-medium">
                      {usuario.nome}
                    </TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    {showRole && (
                      <TableCell>
                        {usuario.role && (
                          <Badge
                            variant={
                              ROLE_BADGE_VARIANT[usuario.role] ?? 'default'
                            }
                          >
                            {ROLE_LABELS[usuario.role] ?? usuario.role}
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    {showEscola && (
                      <TableCell>{usuario.escola_nome ?? '—'}</TableCell>
                    )}
                    <TableCell>{formatDate(usuario.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={page === 1}
                    className={
                      page === 1
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === pagination.pages ||
                      Math.abs(p - page) <= 1,
                  )
                  .map((p, idx, arr) => (
                    <PaginationItem key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span
                          className="px-2 text-muted-foreground"
                          role="presentation"
                          aria-hidden="true"
                        >
                          ...
                        </span>
                      )}
                      <PaginationLink
                        isActive={p === page}
                        onClick={() => setPage(p)}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setPage((p) => Math.min(pagination.pages, p + 1))
                    }
                    aria-disabled={page === pagination.pages}
                    className={
                      page === pagination.pages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
