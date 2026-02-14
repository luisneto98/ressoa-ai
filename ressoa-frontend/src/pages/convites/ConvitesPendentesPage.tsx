import { useState } from 'react';
import { IconClock, IconMailForward } from '@tabler/icons-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useConvites } from '@/hooks/useConvites';
import { CancelConviteDialog } from '@/components/shared/CancelConviteDialog';
import type { ConviteListItem } from '@/api/convites';

function getExpirationDisplay(expiraEm: string): {
  text: string;
  variant: 'default' | 'destructive' | 'secondary';
} {
  const diff = new Date(expiraEm).getTime() - Date.now();
  if (diff <= 0) return { text: 'Expirado', variant: 'secondary' };
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  if (days > 1) return { text: `${days} dias restantes`, variant: 'default' };
  return { text: `${hours}h restantes`, variant: 'destructive' };
}

const STATUS_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  aceito: { label: 'Aceito', className: 'bg-green-100 text-green-800 border-green-200' },
  expirado: { label: 'Expirado', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-200' },
};

const TIPO_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  diretor: { label: 'Diretor', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  coordenador: { label: 'Coordenador', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  professor: { label: 'Professor', className: 'bg-green-100 text-green-800 border-green-200' },
};

export function ConvitesPendentesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelingConvite, setCancelingConvite] = useState<ConviteListItem | null>(null);

  const { data, isLoading } = useConvites({
    page,
    limit: 20,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-montserrat text-2xl font-bold text-deep-navy">
            Convites Pendentes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie convites enviados para novos usuários
          </p>
        </div>
      </div>

      {/* Filtro de status */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-deep-navy">Status:</label>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]" aria-label="Filtrar por status">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="expirado">Expirado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
            <SelectItem value="aceito">Aceito</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data Envio</TableHead>
              <TableHead>Expira Em</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <IconMailForward className="mx-auto mb-2 size-10 text-muted-foreground/50" />
                  <p>Nenhum convite encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((convite) => {
                const statusBadge = STATUS_BADGES[convite.status] ?? STATUS_BADGES.pendente;
                const tipoBadge = TIPO_BADGES[convite.tipo_usuario] ?? TIPO_BADGES.professor;
                const expiration = getExpirationDisplay(convite.expira_em);
                const canCancel = convite.status === 'pendente' || convite.status === 'expirado';

                return (
                  <TableRow key={convite.id}>
                    <TableCell className="font-medium">{convite.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tipoBadge.className}>
                        {tipoBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(convite.criado_em).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={expiration.variant} className="gap-1">
                        <IconClock className="size-3" />
                        {expiration.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadge.className}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setCancelingConvite(convite)}
                          disabled={!canCancel}
                          className="min-h-[44px]"
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="min-h-[44px]"
                          title="Disponível na Story 13.12"
                        >
                          Reenviar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {data.pagination.page} de {data.pagination.pages} ({data.pagination.total} convites)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="min-h-[44px]"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="min-h-[44px]"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Cancel dialog */}
      {cancelingConvite && (
        <CancelConviteDialog
          open={!!cancelingConvite}
          onOpenChange={(open) => {
            if (!open) setCancelingConvite(null);
          }}
          convite={cancelingConvite}
        />
      )}
    </div>
  );
}
