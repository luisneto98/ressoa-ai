import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RoleUsuario } from '@prisma/client';
import { UsuariosService } from './usuarios.service';
import { ListUsuariosQueryDto } from './dto';
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
}
