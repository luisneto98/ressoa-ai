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
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @ApiOperation({ summary: 'Criar nova turma' })
  @ApiResponse({ status: 201, description: 'Turma criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async create(@Body() createTurmaDto: CreateTurmaDto) {
    return this.turmasService.create(createTurmaDto);
  }

  @Get()
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @ApiOperation({
    summary: 'Listar turmas do professor',
    description:
      'Retorna todas as turmas do professor autenticado com isolamento de tenant (escola_id). ' +
      'NOTA: Coordenador/Diretor receberão array vazio pois service filtra por professor_id. ' +
      'Use endpoints de dashboard para visualização por roles administrativos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de turmas do professor',
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
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Permissões insuficientes' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.turmasService.findAllByProfessor(user.userId);
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
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @ApiOperation({ summary: 'Atualizar turma' })
  @ApiResponse({ status: 200, description: 'Turma atualizada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  async update(@Param('id') id: string, @Body() updateTurmaDto: UpdateTurmaDto) {
    return this.turmasService.update(id, updateTurmaDto);
  }

  @Delete(':id')
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover turma' })
  @ApiResponse({ status: 204, description: 'Turma removida' })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  async remove(@Param('id') id: string) {
    await this.turmasService.remove(id);
  }
}
