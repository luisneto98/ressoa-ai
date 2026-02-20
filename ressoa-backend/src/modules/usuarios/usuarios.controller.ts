import {
  Controller,
  Get,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { RoleUsuario } from '@prisma/client';
import { UsuariosService } from './usuarios.service';
import { ListUsuariosQueryDto, UpdateUsuarioDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('usuarios')
@ApiTags('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Roles(RoleUsuario.ADMIN, RoleUsuario.DIRETOR, RoleUsuario.COORDENADOR)
  @ApiOperation({
    summary: 'Listar usuários cadastrados',
    description:
      'Lista paginada com filtros por role, busca e escola. Respeita hierarquia de roles.',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de usuários' })
  @ApiResponse({
    status: 400,
    description: 'Validação de query params falhou',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado (apenas Admin, Diretor, Coordenador)',
  })
  async listUsuarios(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListUsuariosQueryDto,
  ) {
    return this.usuariosService.listUsuarios(
      {
        userId: user.userId,
        role: user.role,
      },
      query,
    );
  }

  @Patch(':id/reativar')
  @Roles(RoleUsuario.ADMIN, RoleUsuario.DIRETOR, RoleUsuario.COORDENADOR)
  @ApiOperation({
    summary: 'Reativar usuário desativado',
    description:
      'Restaura acesso de usuário desativado respeitando hierarquia de roles.',
  })
  @ApiParam({ name: 'id', description: 'ID do usuário (UUID)' })
  @ApiResponse({ status: 200, description: 'Usuário reativado com sucesso' })
  @ApiResponse({ status: 400, description: 'UUID inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão (hierarquia)' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Usuário já está ativo' })
  async reactivateUsuario(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usuariosService.reactivateUsuario(user.role, id);
  }

  @Patch(':id/desativar')
  @Roles(RoleUsuario.ADMIN, RoleUsuario.DIRETOR, RoleUsuario.COORDENADOR)
  @ApiOperation({
    summary: 'Desativar usuário (soft delete)',
    description:
      'Marca usuário como inativo respeitando hierarquia de roles. LGPD compliance.',
  })
  @ApiParam({ name: 'id', description: 'ID do usuário (UUID)' })
  @ApiResponse({ status: 200, description: 'Usuário desativado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Auto-desativação ou UUID inválido',
  })
  @ApiResponse({ status: 403, description: 'Sem permissão (hierarquia)' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Usuário já desativado' })
  async deactivateUsuario(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usuariosService.deactivateUsuario(user.role, user.userId, id);
  }

  @Patch(':id')
  @Roles(RoleUsuario.ADMIN, RoleUsuario.DIRETOR, RoleUsuario.COORDENADOR)
  @ApiOperation({
    summary: 'Editar dados de usuário',
    description: 'Atualiza nome e/ou email do usuário respeitando hierarquia',
  })
  @ApiParam({ name: 'id', description: 'ID do usuário (UUID)' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Validação falhou' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar este usuário',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado nesta escola' })
  async updateUsuario(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.updateUsuario(user.role, id, dto);
  }
}
