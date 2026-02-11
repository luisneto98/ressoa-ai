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
}
