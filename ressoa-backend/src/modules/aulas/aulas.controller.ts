import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AulasService } from './aulas.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { QueryAulasDto } from './dto/query-aulas.dto';
import { UploadTranscricaoDto } from './dto/upload-transcricao.dto';
import { EntradaManualDto } from './dto/entrada-manual.dto';
import { CreateAulaRascunhoDto } from './dto/create-aula-rascunho.dto';
import { UpdateAulaDescricaoDto } from './dto/update-aula-descricao.dto';
import { IniciarProcessamentoDto } from './dto/iniciar-processamento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('aulas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AulasController {
  constructor(private readonly aulasService: AulasService) {}

  @Post()
  @Roles('PROFESSOR')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createAulaDto: CreateAulaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aulasService.create(createAulaDto, user);
  }

  @Post('upload-transcricao')
  @Roles('PROFESSOR')
  @HttpCode(HttpStatus.CREATED)
  uploadTranscricao(
    @Body() dto: UploadTranscricaoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aulasService.uploadTranscricao(dto, user);
  }

  @Post('entrada-manual')
  @Roles('PROFESSOR')
  @HttpCode(HttpStatus.CREATED)
  entradaManual(
    @Body() dto: EntradaManualDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aulasService.entradaManual(dto, user);
  }

  /**
   * Story 16.2: Criar rascunho de aula para planejamento antecipado
   * ATENÇÃO: declarado ANTES de endpoints :id para evitar conflito de rota
   */
  @Post('rascunho')
  @Roles('PROFESSOR')
  @HttpCode(HttpStatus.CREATED)
  createRascunho(
    @Body() dto: CreateAulaRascunhoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aulasService.createRascunho(dto, user);
  }

  @Get()
  @Roles('PROFESSOR')
  findAll(
    @Query() query: QueryAulasDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aulasService.findAll(query, user);
  }

  @Get(':id')
  @Roles('PROFESSOR')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.aulasService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('PROFESSOR')
  update(
    @Param('id') id: string,
    @Body() updateAulaDto: UpdateAulaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aulasService.update(id, updateAulaDto, user);
  }

  /**
   * Story 16.2: Atualizar descrição de um rascunho de aula
   */
  @Patch(':id/descricao')
  @Roles('PROFESSOR')
  updateDescricao(
    @Param('id') id: string,
    @Body() dto: UpdateAulaDescricaoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aulasService.updateDescricao(id, dto, user);
  }

  /**
   * Story 16.2: Iniciar processamento de um rascunho
   */
  @Post(':id/iniciar')
  @Roles('PROFESSOR')
  @HttpCode(HttpStatus.OK)
  iniciarProcessamento(
    @Param('id') id: string,
    @Body() dto: IniciarProcessamentoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aulasService.iniciarProcessamento(id, dto, user);
  }

  /**
   * Reprocessar aula com erro (Story 4.3 - AC4)
   *
   * @description Re-enqueue failed transcription jobs for retry.
   *              Only allows reprocessing of aulas with status ERRO.
   *              Validates ownership (professor must own the aula).
   *
   * @param id - UUID of the Aula to reprocess
   * @param user - Authenticated professor
   * @returns Success message
   * @throws NotFoundException - If aula not found
   * @throws ForbiddenException - If aula doesn't belong to professor
   * @throws BadRequestException - If aula status is not ERRO
   */
  @Post(':id/reprocessar')
  @Roles('PROFESSOR')
  @HttpCode(HttpStatus.OK)
  async reprocessarAula(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aulasService.reprocessarAula(id, user);
  }
}
