import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleUsuario, Prisma } from '@prisma/client';
import { ListUsuariosQueryDto, UpdateUsuarioDto } from './dto';

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

  async updateUsuario(
    callerRole: RoleUsuario,
    targetId: string,
    dto: UpdateUsuarioDto,
  ) {
    // 1. Validate at least one field provided
    if (!dto.nome && !dto.email) {
      throw new BadRequestException('Pelo menos um campo deve ser fornecido');
    }

    // 2. Build where clause with tenant isolation
    const where: Prisma.UsuarioWhereInput = { id: targetId };
    if (callerRole !== RoleUsuario.ADMIN) {
      const escolaId = this.prisma.getEscolaIdOrThrow();
      where.escola_id = escolaId;
    }

    // 3. Find target user
    const targetUser = await this.prisma.usuario.findFirst({
      where,
      select: {
        id: true,
        email: true,
        escola_id: true,
        perfil_usuario: { select: { role: true } },
      },
    });
    if (!targetUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 4. Check hierarchy permission
    const targetRole = targetUser.perfil_usuario?.role;
    this.validateHierarchyPermission(callerRole, targetRole);

    // 5. Email uniqueness check (if email is being changed)
    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      if (normalizedEmail !== targetUser.email.toLowerCase()) {
        const existing = await this.prisma.usuario.findFirst({
          where: {
            email: { equals: normalizedEmail, mode: 'insensitive' },
            escola_id: targetUser.escola_id,
            id: { not: targetId },
          },
        });
        if (existing) {
          throw new ConflictException('Email já cadastrado nesta escola');
        }
        dto.email = normalizedEmail;
      }
    }

    // 6. Update
    const updated = await this.prisma.usuario.update({
      where: { id: targetId },
      data: {
        ...(dto.nome && { nome: dto.nome.trim() }),
        ...(dto.email && { email: dto.email }),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        created_at: true,
        updated_at: true,
        perfil_usuario: { select: { role: true } },
      },
    });

    return {
      id: updated.id,
      nome: updated.nome,
      email: updated.email,
      role: updated.perfil_usuario?.role ?? null,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }

  private validateHierarchyPermission(
    callerRole: RoleUsuario,
    targetRole: RoleUsuario | undefined,
  ) {
    if (callerRole === RoleUsuario.ADMIN) return;

    if (!targetRole) {
      throw new ForbiddenException('Sem permissão para editar este usuário');
    }

    const editableRoles: Record<RoleUsuario, RoleUsuario[]> = {
      [RoleUsuario.DIRETOR]: [RoleUsuario.PROFESSOR, RoleUsuario.COORDENADOR],
      [RoleUsuario.COORDENADOR]: [RoleUsuario.PROFESSOR],
      [RoleUsuario.PROFESSOR]: [],
      [RoleUsuario.ADMIN]: [],
    };

    if (!editableRoles[callerRole]?.includes(targetRole)) {
      throw new ForbiddenException('Sem permissão para editar este usuário');
    }
  }
}
