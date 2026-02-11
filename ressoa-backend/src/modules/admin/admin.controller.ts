import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleUsuario } from '@prisma/client';
import { AdminService } from './admin.service';
import {
  CreateEscolaDto,
  CreateUsuarioDto,
  EscolaResponseDto,
  UsuarioResponseDto,
} from './dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('api/v1/admin')
@Roles(RoleUsuario.ADMIN) // Protege TODOS endpoints deste controller
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('schools')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova escola (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Escola criada com sucesso',
    type: EscolaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos (validação falhou)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token ausente ou inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Usuário não é ADMIN',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - CNPJ já cadastrado',
  })
  async createSchool(@Body() dto: CreateEscolaDto): Promise<EscolaResponseDto> {
    return this.adminService.createEscola(dto);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo usuário (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: UsuarioResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou tentativa de criar ADMIN',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token ausente ou inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Usuário não é ADMIN',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Escola não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email já cadastrado nesta escola',
  })
  async createUser(@Body() dto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    return this.adminService.createUsuario(dto);
  }
}
