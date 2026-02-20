import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ConvitesService } from './convites.service';
import { ListConvitesQueryDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleUsuario } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedUser {
  userId: string;
  email: string;
  escolaId: string;
  role: RoleUsuario;
}

@ApiTags('convites')
@ApiBearerAuth()
@Controller('convites')
@UseGuards(JwtAuthGuard)
@Roles(RoleUsuario.ADMIN, RoleUsuario.DIRETOR, RoleUsuario.COORDENADOR)
export class ConvitesController {
  constructor(private readonly convitesService: ConvitesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar convites (paginado, com filtro por status)',
  })
  @ApiResponse({ status: 200, description: 'Lista de convites retornada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado (apenas ADMIN, DIRETOR, COORDENADOR)',
  })
  async listConvites(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListConvitesQueryDto,
  ) {
    return this.convitesService.listConvites(user.role, user.escolaId, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      status: query.status,
    });
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar convite pendente' })
  @ApiParam({ name: 'id', description: 'UUID do convite' })
  @ApiResponse({ status: 200, description: 'Convite cancelado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Convite já aceito (não cancelável)',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Convite não encontrado' })
  @ApiResponse({ status: 409, description: 'Convite já foi cancelado' })
  async cancelarConvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.convitesService.cancelarConvite(id, user.role, user.escolaId);
  }

  @Post(':id/reenviar')
  @ApiOperation({ summary: 'Reenviar convite expirado/pendente' })
  @ApiParam({ name: 'id', description: 'UUID do convite' })
  @ApiResponse({ status: 201, description: 'Convite reenviado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Convite já aceito (não reenviável)',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Convite não encontrado' })
  async reenviarConvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.convitesService.reenviarConvite(id, user.role, user.escolaId);
  }
}
