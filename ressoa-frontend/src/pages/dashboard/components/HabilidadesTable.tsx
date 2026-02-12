import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

interface Habilidade {
  habilidade_codigo: string;
  habilidade_descricao: string;
  status_cobertura: 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';
  aulas_relacionadas: number;
}

interface Props {
  habilidades: Habilidade[];
}

export function HabilidadesTable({ habilidades }: Props) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completa
          </Badge>
        );
      case 'PARTIAL':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Parcial
          </Badge>
        );
      case 'MENTIONED':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Mencionada
          </Badge>
        );
      case 'NOT_COVERED':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Não Coberta
          </Badge>
        );
      default:
        return null;
    }
  };

  // Backend já ordena (NOT_COVERED first, MENTIONED, PARTIAL, COMPLETE)
  // Não precisamos re-ordenar no frontend

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">Código BNCC</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead className="w-[150px]">Status</TableHead>
          <TableHead className="w-[100px]">Aulas</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {habilidades.map((hab) => (
          <TableRow key={hab.habilidade_codigo}>
            <TableCell className="font-mono text-sm">
              {hab.habilidade_codigo}
            </TableCell>
            <TableCell className="text-sm">{hab.habilidade_descricao}</TableCell>
            <TableCell>{getStatusBadge(hab.status_cobertura)}</TableCell>
            <TableCell className="text-center">
              {hab.aulas_relacionadas}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
