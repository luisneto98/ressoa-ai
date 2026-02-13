import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ObjetivosService } from './objetivos.service';
import { CreateObjetivoDto } from './dto/create-objetivo.dto';
import {
  FindByTipoFonteDto,
  FindByTurmaDto,
  CountByTipoFonteDto,
} from './dto/query-objetivos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controller para Objetivos de Aprendizagem
 * Story 11.1: Backend — Modelo de Dados - Objetivos de Aprendizagem
 *
 * Endpoints protegidos por autenticação JWT
 */
@ApiTags('objetivos')
@Controller('objetivos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ObjetivosController {
  constructor(private readonly objetivosService: ObjetivosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo objetivo de aprendizagem (BNCC ou custom)' })
  @ApiResponse({
    status: 201,
    description: 'Objetivo criado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Validação falhou (dados inválidos ou critérios ausentes)',
  })
  @ApiResponse({
    status: 404,
    description: 'Habilidade BNCC ou Turma não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Código já existe (conflito de unicidade)',
  })
  async create(@Body() createObjetivoDto: CreateObjetivoDto) {
    return this.objetivosService.create(createObjetivoDto);
  }

  @Get('tipo-fonte')
  @ApiOperation({ summary: 'Listar objetivos por tipo de fonte (BNCC, CUSTOM, etc)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de objetivos retornada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetro tipo_fonte inválido',
  })
  async findByTipoFonte(@Query() query: FindByTipoFonteDto) {
    return this.objetivosService.findByTipoFonte(query.tipo_fonte);
  }

  @Get('turma')
  @ApiOperation({ summary: 'Listar objetivos customizados de uma turma' })
  @ApiResponse({
    status: 200,
    description: 'Lista de objetivos customizados da turma',
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetro turma_id inválido (deve ser UUID)',
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada ou foi deletada',
  })
  async findByTurma(@Query() query: FindByTurmaDto) {
    return this.objetivosService.findByTurma(query.turma_id);
  }

  @Get('count')
  @ApiOperation({ summary: 'Contar total de objetivos por tipo de fonte' })
  @ApiResponse({
    status: 200,
    description: 'Total de objetivos retornado',
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetro tipo_fonte inválido',
  })
  async countByTipoFonte(@Query() query: CountByTipoFonteDto) {
    const count = await this.objetivosService.countByTipoFonte(query.tipo_fonte);
    return { tipo_fonte: query.tipo_fonte, total: count };
  }
}
