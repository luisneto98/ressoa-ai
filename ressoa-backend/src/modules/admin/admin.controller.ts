import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleUsuario } from '@prisma/client';

interface AuthenticatedUser {
  userId: string;
  email: string;
  escolaId: string;
  role: RoleUsuario;
}
import { AdminService } from './admin.service';
import { CoberturaService } from '../../cobertura/cobertura.service';
import {
  MonitoramentoSTTService,
  MonitoramentoSTTResponse,
} from '../monitoramento/monitoramento-stt.service';
import {
  MonitoramentoAnaliseService,
  MonitoramentoAnaliseResponse,
} from '../monitoramento/monitoramento-analise.service';
import {
  MonitoramentoCustosService,
  MonitoramentoCustosResponse,
} from '../monitoramento/monitoramento-custos.service';
import {
  MonitoramentoPromptsService,
  QualidadePromptsResponse,
  DiffsResponse,
} from '../monitoramento/monitoramento-prompts.service';
import { FiltrosMonitoramentoDto } from '../monitoramento/dto/filtros-monitoramento.dto';
import { FiltrosCustosDto } from '../monitoramento/dto/filtros-custos.dto';
import { FiltrosPromptsQualidadeDto } from '../monitoramento/dto/filtros-prompts-qualidade.dto';
import {
  CreateEscolaDto,
  CreateUsuarioDto,
  EscolaResponseDto,
  UsuarioResponseDto,
  InviteDirectorDto,
} from './dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@Roles(RoleUsuario.ADMIN) // Protege TODOS endpoints deste controller
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly coberturaService: CoberturaService,
    private readonly monitoramentoSTTService: MonitoramentoSTTService,
    private readonly monitoramentoAnaliseService: MonitoramentoAnaliseService,
    private readonly monitoramentoCustosService: MonitoramentoCustosService,
    private readonly monitoramentoPromptsService: MonitoramentoPromptsService,
  ) {}

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
    description: 'Conflict - CNPJ ou email já cadastrado',
  })
  async createEscola(@Body() dto: CreateEscolaDto): Promise<EscolaResponseDto> {
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

  @Post('invite-director')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar convite por email para Diretor (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Convite enviado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Convite enviado com sucesso',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou escola inativa',
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
  async inviteDirector(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteDirectorDto,
  ): Promise<{ message: string }> {
    return this.adminService.inviteDirector(dto, user.userId);
  }

  @Post('refresh-cobertura')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Trigger manual refresh da materialized view cobertura_bimestral (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Refresh enfileirado com sucesso',
    schema: {
      example: { message: 'Refresh enfileirado com sucesso' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token ausente ou inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Usuário não é ADMIN',
  })
  async triggerRefreshCobertura(): Promise<{ message: string }> {
    return this.coberturaService.triggerRefresh();
  }

  @Get('monitoramento/stt')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutos em ms
  @ApiOperation({ summary: 'Métricas de monitoramento STT (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Métricas STT retornadas',
    schema: {
      example: {
        kpis: {
          total_transcricoes: 100,
          erros_stt: 3,
          taxa_sucesso: 97.09,
          taxa_erro: 2.91,
          fallback_count: 5,
          tempo_medio_ms: 15000,
          confianca_media: 0.92,
          custo_total_usd: 1.5,
        },
        por_provider: [
          {
            provider: 'WHISPER',
            count: 80,
            avg_tempo_ms: 14000,
            avg_confianca: 0.93,
            avg_custo_usd: 0.012,
          },
        ],
        erros_timeline: [
          {
            hora: '2026-02-12T10:00:00.000Z',
            erros_stt: 1,
            transcricoes_ok: 25,
          },
        ],
        erros_recentes: [
          {
            aula_id: 'uuid',
            escola_id: 'uuid',
            data: '2026-02-12',
            updated_at: '2026-02-12T10:30:00Z',
            arquivo_tamanho: 5242880,
            tipo_entrada: 'AUDIO',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Usuário não é ADMIN' })
  async getMonitoramentoSTT(
    @Query() filtros: FiltrosMonitoramentoDto,
  ): Promise<MonitoramentoSTTResponse> {
    return this.monitoramentoSTTService.getMetricas(filtros.periodo ?? '24h');
  }

  @Get('monitoramento/analise')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutos em ms
  @ApiOperation({
    summary: 'Métricas de monitoramento de análise pedagógica (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de análise retornadas',
    schema: {
      example: {
        kpis: {
          total: 50,
          tempo_medio_s: 45.2,
          custo_medio_usd: 0.12,
          tempo_revisao_medio_s: 180,
        },
        por_status: [
          { status: 'AGUARDANDO_REVISAO', count: 20 },
          { status: 'APROVADO', count: 25 },
          { status: 'REJEITADO', count: 5 },
        ],
        queue_stats: {
          waiting: 3,
          active: 1,
          completed: 100,
          failed: 2,
          delayed: 0,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Usuário não é ADMIN' })
  async getMonitoramentoAnalise(
    @Query() filtros: FiltrosMonitoramentoDto,
  ): Promise<MonitoramentoAnaliseResponse> {
    return this.monitoramentoAnaliseService.getMetricas(
      filtros.periodo ?? '24h',
    );
  }

  @Get('custos/escolas')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600000) // 1 hora em ms
  @ApiOperation({ summary: 'Custos de API por escola (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Custos por escola retornados',
    schema: {
      example: {
        escolas: [
          {
            escola_id: 'uuid',
            escola_nome: 'Escola Municipal ABC',
            custo_stt: 12.5,
            custo_llm: 35.0,
            custo_total: 47.5,
            total_aulas: 120,
            professores_ativos: 8,
            custo_por_aula: 0.3958,
          },
        ],
        totais: {
          custo_total: 150.0,
          total_aulas: 500,
          total_escolas: 5,
          projecao_mensal: 280.0,
        },
        mes: '2026-02',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Usuário não é ADMIN' })
  async getCustosEscolas(
    @Query() filtros: FiltrosCustosDto,
  ): Promise<MonitoramentoCustosResponse> {
    return this.monitoramentoCustosService.getMetricas(filtros.mes);
  }

  @Get('prompts/qualidade')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600000) // 1 hora em ms
  @ApiOperation({
    summary: 'Métricas de qualidade de prompts por versão (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de qualidade de prompts retornadas',
    schema: {
      example: {
        metricas: [
          {
            nome: 'prompt-cobertura',
            versao: 'v1.0.0',
            ab_testing: false,
            total_analises: 100,
            aprovadas: 92,
            rejeitadas: 8,
            taxa_aprovacao: 92.0,
            tempo_medio_revisao: 120,
            status: 'Excelente',
          },
        ],
        resumo: {
          total_versoes: 5,
          low_performers: 1,
          taxa_aprovacao_geral: 85.5,
        },
        periodo: '30d',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Usuário não é ADMIN' })
  async getPromptsQualidade(
    @Query() filtros: FiltrosPromptsQualidadeDto,
  ): Promise<QualidadePromptsResponse> {
    return this.monitoramentoPromptsService.getQualidadePrompts(
      filtros.periodo ?? '30d',
    );
  }

  @Get('prompts/:nome/:versao/diffs')
  @ApiOperation({
    summary: 'Top 20 análises mais editadas por versão de prompt (admin only)',
  })
  @ApiParam({
    name: 'nome',
    description: 'Nome do prompt',
    example: 'prompt-relatorio',
  })
  @ApiParam({
    name: 'versao',
    description: 'Versão do prompt',
    example: 'v1.0.0',
  })
  @ApiResponse({
    status: 200,
    description: 'Diffs por versão de prompt retornados',
    schema: {
      example: {
        nome: 'prompt-relatorio',
        versao: 'v1.0.0',
        diffs: [
          {
            analise_id: 'uuid',
            aula_titulo: 'Aula de Frações',
            data_aula: '2026-02-10T00:00:00.000Z',
            change_count: 500,
            original_length: 2000,
            edited_length: 2500,
            original: 'texto original...',
            editado: 'texto editado...',
          },
        ],
        total: 1,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Usuário não é ADMIN' })
  async getPromptDiffs(
    @Param('nome') nome: string,
    @Param('versao') versao: string,
  ): Promise<DiffsResponse> {
    return this.monitoramentoPromptsService.getDiffsPorVersao(nome, versao);
  }
}
