import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleUsuario, Prisma } from '@prisma/client';
import { ListUsuariosQueryDto } from './dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsuarios(
    user: { userId: string; role: RoleUsuario },
    query: ListUsuariosQueryDto,
  ) {
    const { page = 1, limit = 20, search, role } = query;
    const skip = (page - 1) * limit;

    // Exclude users without a perfil_usuario (orphaned records)
    const where: Prisma.UsuarioWhereInput = {
      perfil_usuario: { isNot: null },
    };

    // Determine allowed roles based on caller's role hierarchy
    let allowedRoles: RoleUsuario[] | null = null; // null means all roles

    if (user.role === RoleUsuario.ADMIN) {
      // Admin sees all users, optionally filtered by escola_id
      if (query.escola_id) {
        where.escola_id = query.escola_id;
      }
    } else {
      // Diretor/Coordenador: scope to own school via tenant context
      const escolaId = this.prisma.getEscolaIdOrThrow();
      where.escola_id = escolaId;

      // AC5: Coordenador sees only PROFESSOR
      if (user.role === RoleUsuario.COORDENADOR) {
        allowedRoles = [RoleUsuario.PROFESSOR];
      }
      // AC6: Diretor sees PROFESSOR + COORDENADOR
      else if (user.role === RoleUsuario.DIRETOR) {
        allowedRoles = [RoleUsuario.PROFESSOR, RoleUsuario.COORDENADOR];
      }
    }

    // Apply role filter intersected with hierarchy
    if (role && allowedRoles) {
      // Intersect: only show if requested role is within allowed hierarchy
      if (allowedRoles.includes(role)) {
        where.perfil_usuario = { role };
      } else {
        // Requested role outside hierarchy → guaranteed empty result
        where.perfil_usuario = { role: { in: [] } };
      }
    } else if (role) {
      // Admin or unrestricted: use requested role directly
      where.perfil_usuario = { role };
    } else if (allowedRoles) {
      // No explicit role filter, but hierarchy restriction applies
      where.perfil_usuario = { role: { in: allowedRoles } };
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          nome: true,
          email: true,
          created_at: true,
          escola:
            user.role === RoleUsuario.ADMIN
              ? { select: { id: true, nome: true } }
              : false,
          perfil_usuario: { select: { role: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    // Flatten response (move perfil_usuario.role to top-level)
    const flatData = data.map((u) => {
      const base = {
        id: u.id,
        nome: u.nome,
        email: u.email,
        role: u.perfil_usuario?.role ?? null,
        created_at: u.created_at,
      };
      // escola is only selected for Admin (conditional select)
      const escola = (u as any).escola as
        | { id: string; nome: string }
        | undefined;
      if (escola) {
        return { ...base, escola_nome: escola.nome, escola_id: escola.id };
      }
      return base;
    });

    return {
      data: flatData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
