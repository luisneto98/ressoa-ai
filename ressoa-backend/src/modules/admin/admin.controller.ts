import {
  Controller,
  Post,
  Get,
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
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleUsuario } from '@prisma/client';
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
import { FiltrosMonitoramentoDto } from '../monitoramento/dto/filtros-monitoramento.dto';
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
  constructor(
    private readonly adminService: AdminService,
    private readonly coberturaService: CoberturaService,
    private readonly monitoramentoSTTService: MonitoramentoSTTService,
    private readonly monitoramentoAnaliseService: MonitoramentoAnaliseService,
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

  @Post('refresh-cobertura')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger manual refresh da materialized view cobertura_bimestral (admin only)',
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
        kpis: { total_transcricoes: 100, erros_stt: 3, taxa_sucesso: 97.09, taxa_erro: 2.91, fallback_count: 5, tempo_medio_ms: 15000, confianca_media: 0.92, custo_total_usd: 1.5 },
        por_provider: [{ provider: 'WHISPER', count: 80, avg_tempo_ms: 14000, avg_confianca: 0.93, avg_custo_usd: 0.012 }],
        erros_timeline: [{ hora: '2026-02-12T10:00:00.000Z', erros_stt: 1, transcricoes_ok: 25 }],
        erros_recentes: [{ aula_id: 'uuid', escola_id: 'uuid', data: '2026-02-12', updated_at: '2026-02-12T10:30:00Z', arquivo_tamanho: 5242880, tipo_entrada: 'AUDIO' }],
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
  @ApiOperation({ summary: 'Métricas de monitoramento de análise pedagógica (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Métricas de análise retornadas',
    schema: {
      example: {
        kpis: { total: 50, tempo_medio_s: 45.2, custo_medio_usd: 0.12, tempo_revisao_medio_s: 180 },
        por_status: [{ status: 'AGUARDANDO_REVISAO', count: 20 }, { status: 'APROVADO', count: 25 }, { status: 'REJEITADO', count: 5 }],
        queue_stats: { waiting: 3, active: 1, completed: 100, failed: 2, delayed: 0 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Usuário não é ADMIN' })
  async getMonitoramentoAnalise(
    @Query() filtros: FiltrosMonitoramentoDto,
  ): Promise<MonitoramentoAnaliseResponse> {
    return this.monitoramentoAnaliseService.getMetricas(filtros.periodo ?? '24h');
  }
}
