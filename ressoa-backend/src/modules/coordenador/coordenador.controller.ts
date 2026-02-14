import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CoordenadorService } from './coordenador.service';
import { InviteProfessorDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleUsuario } from '@prisma/client';

interface AuthenticatedUser {
  userId: string;
  email: string;
  escolaId: string;
  role: RoleUsuario;
}

@ApiTags('coordenador')
@ApiBearerAuth()
@Controller('api/v1/coordenador')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleUsuario.COORDENADOR)
export class CoordenadorController {
  constructor(private readonly coordenadorService: CoordenadorService) {}

  @Post('invite-professor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enviar convite por email para Professor',
    description: 'Coordenador envia convite de cadastro para Professor da sua escola',
  })
  @ApiResponse({ status: 201, description: 'Convite enviado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Escola inativa ou validação inválida',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado (apenas Coordenador)',
  })
  @ApiResponse({
    status: 409,
    description: 'Email já cadastrado nesta escola',
  })
  async inviteProfessor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteProfessorDto,
  ) {
    return this.coordenadorService.inviteProfessor(user.escolaId, dto);
  }
}
