import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { TurmasService } from './turmas.service';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { UpdateTurmaDto } from './dto/update-turma.dto';

@ApiTags('turmas')
@Controller('turmas')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

  @Post()
  @Roles('COORDENADOR', 'DIRETOR')
  @ApiOperation({ summary: 'Criar nova turma (COORDENADOR + DIRETOR apenas)' })
  @ApiResponse({ status: 201, description: 'Turma criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Permissões insuficientes (PROFESSOR não permitido)' })
  @ApiResponse({ status: 409, description: 'Turma duplicada (nome + ano + turno)' })
  async create(@Body() createTurmaDto: CreateTurmaDto) {
    return this.turmasService.create(createTurmaDto);
  }

  @Get()
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @ApiOperation({
    summary: 'Listar turmas',
    description:
      'PROFESSOR: retorna apenas turmas onde é responsável. ' +
      'COORDENADOR/DIRETOR: retorna todas turmas da escola.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de turmas conforme role',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome: { type: 'string', example: '6A' },
          disciplina: { type: 'string', example: 'MATEMATICA' },
          serie: {
            type: 'string',
            enum: [
              'SEXTO_ANO',
              'SETIMO_ANO',
              'OITAVO_ANO',
              'NONO_ANO',
              'PRIMEIRO_ANO_EM',
              'SEGUNDO_ANO_EM',
              'TERCEIRO_ANO_EM',
            ],
          },
          tipo_ensino: {
            type: 'string',
            enum: ['FUNDAMENTAL', 'MEDIO'],
            example: 'FUNDAMENTAL',
          },
          ano_letivo: { type: 'number', example: 2026 },
          turno: { type: 'string', enum: ['MATUTINO', 'VESPERTINO', 'INTEGRAL'] },
          professor: {
            type: 'object',
            description: 'Apenas para Coordenador/Diretor',
            properties: {
              id: { type: 'string' },
              nome: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Permissões insuficientes' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (user.role === 'PROFESSOR') {
      return this.turmasService.findAllByProfessor(user.userId);
    }

    // Coordenador/Diretor: todas turmas da escola
    return this.turmasService.findAllByEscola();
  }

  @Get(':id')
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @ApiOperation({ summary: 'Buscar turma por ID' })
  @ApiResponse({ status: 200, description: 'Turma encontrada' })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  async findOne(@Param('id') id: string) {
    return this.turmasService.findOne(id);
  }

  @Patch(':id')
  @Roles('COORDENADOR', 'DIRETOR')
  @ApiOperation({ summary: 'Atualizar turma (COORDENADOR + DIRETOR apenas)' })
  @ApiResponse({ status: 200, description: 'Turma atualizada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Permissões insuficientes (PROFESSOR não permitido)' })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  async update(@Param('id') id: string, @Body() updateTurmaDto: UpdateTurmaDto) {
    return this.turmasService.update(id, updateTurmaDto);
  }

  @Delete(':id')
  @Roles('DIRETOR')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover turma (DIRETOR apenas)' })
  @ApiResponse({ status: 204, description: 'Turma removida (soft delete)' })
  @ApiResponse({ status: 403, description: 'Permissões insuficientes (COORDENADOR/PROFESSOR não permitidos)' })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  async remove(@Param('id') id: string) {
    await this.turmasService.remove(id);
  }
}
