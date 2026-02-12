import { Controller, Get, UseGuards } from '@nestjs/common';
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

@ApiTags('turmas')
@Controller('turmas')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

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
            enum: ['SEXTO_ANO', 'SETIMO_ANO', 'OITAVO_ANO', 'NONO_ANO'],
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
}
