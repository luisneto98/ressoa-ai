import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DiretorService } from './diretor.service';
import { InviteCoordenadorDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleUsuario } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Authenticated user payload from JWT
 */
interface AuthenticatedUser {
  userId: string;
  email: string;
  escolaId: string;
  role: RoleUsuario;
}

@ApiTags('diretor')
@ApiBearerAuth()
@Controller('diretor')
@UseGuards(JwtAuthGuard)
@Roles(RoleUsuario.DIRETOR)
export class DiretorController {
  constructor(private readonly diretorService: DiretorService) {}

  /**
   * Invite a Coordenador via email (Story 13.4 - AC1)
   * @param user - Authenticated diretor from JWT
   * @param dto - Email and name of coordenador to invite
   * @returns Success message
   */
  @Post('invite-coordenador')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar convite por email para Coordenador' })
  @ApiResponse({ status: 201, description: 'Convite enviado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Escola inativa ou dados inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Email já cadastrado nesta escola',
  })
  async inviteCoordenador(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteCoordenadorDto,
  ) {
    return this.diretorService.inviteCoordenador(user.escolaId, dto);
  }
}
