import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TurmasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca todas as turmas do professor com isolamento de tenant (escola_id)
   *
   * CRITICAL: Sempre inclui escola_id no WHERE para evitar vazamento de dados entre tenants
   *
   * @param professorId - ID do professor autenticado
   * @returns Lista de turmas do professor
   */
  async findAllByProfessor(professorId: string) {
    // ✅ CRITICAL: Get escolaId from tenant context (TenantInterceptor)
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // ✅ CRITICAL: Always include escola_id in WHERE clause for multi-tenancy
    return this.prisma.turma.findMany({
      where: {
        escola_id: escolaId, // ✅ Tenant isolation
        professor_id: professorId, // ✅ Professor-specific data
      },
      select: {
        id: true,
        nome: true,
        disciplina: true,
        serie: true,
        ano_letivo: true,
      },
      orderBy: [{ ano_letivo: 'desc' }, { nome: 'asc' }],
    });
  }
}
