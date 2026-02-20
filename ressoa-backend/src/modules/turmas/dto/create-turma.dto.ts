import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsInt,
  IsUUID,
  Min,
  Max,
  IsOptional,
  ValidateIf,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Serie, TipoEnsino, CurriculoTipo } from '@prisma/client';
import { DISCIPLINAS } from '../../../common/constants/disciplinas';
import { ContextoPedagogicoDto } from './contexto-pedagogico.dto';

export class CreateTurmaDto {
  @ApiProperty({ example: '6A', description: 'Nome da turma' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({
    example: 'MATEMATICA',
    description: 'Código da disciplina',
    enum: DISCIPLINAS,
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(DISCIPLINAS, {
    message: `disciplina deve ser um dos valores: ${DISCIPLINAS.join(', ')}`,
  })
  disciplina!: string;

  @ApiProperty({
    enum: Serie,
    example: 'SEXTO_ANO',
    description: 'Série da turma',
  })
  @IsEnum(Serie)
  @IsNotEmpty()
  serie!: Serie;

  @ApiProperty({
    enum: TipoEnsino,
    example: 'FUNDAMENTAL',
    description: 'Tipo de ensino',
  })
  @IsEnum(TipoEnsino)
  @IsNotEmpty()
  tipo_ensino!: TipoEnsino;

  @ApiProperty({
    example: 2026,
    description: 'Ano letivo (entre 2020 e 2100)',
  })
  @IsInt()
  @IsNotEmpty()
  @Min(2020, { message: 'ano_letivo deve ser maior ou igual a 2020' })
  @Max(2100, { message: 'ano_letivo deve ser menor ou igual a 2100' })
  ano_letivo!: number;

  @ApiProperty({
    enum: ['MATUTINO', 'VESPERTINO', 'INTEGRAL'],
    example: 'MATUTINO',
    description: 'Turno da turma',
  })
  @IsEnum(['MATUTINO', 'VESPERTINO', 'INTEGRAL'], {
    message: 'Turno deve ser MATUTINO, VESPERTINO ou INTEGRAL',
  })
  @IsNotEmpty()
  turno!: string;

  @ApiProperty({
    example: 'uuid-v4',
    description: 'ID do professor responsável',
  })
  @IsUUID()
  @IsNotEmpty()
  professor_id!: string;

  // Story 11.2: Suporte a currículos customizados
  @ApiProperty({
    enum: CurriculoTipo,
    example: 'BNCC',
    examples: ['BNCC', 'CUSTOM'],
    default: 'BNCC',
    description:
      'Tipo de currículo: BNCC (padrão baseado na Base Nacional Comum Curricular) ou CUSTOM (cursos livres/técnicos customizados)',
    required: false,
  })
  @IsEnum(CurriculoTipo, {
    message: 'curriculo_tipo deve ser BNCC ou CUSTOM',
  })
  @IsOptional()
  curriculo_tipo?: CurriculoTipo;

  @ApiProperty({
    type: () => ContextoPedagogicoDto,
    required: false,
    description:
      'Contexto pedagógico do curso (obrigatório se curriculo_tipo = CUSTOM)',
  })
  @ValidateIf((o) => o.curriculo_tipo === CurriculoTipo.CUSTOM)
  @IsNotEmpty({
    message: 'contexto_pedagogico é obrigatório para turmas customizadas',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => ContextoPedagogicoDto)
  contexto_pedagogico?: ContextoPedagogicoDto;

  // escola_id será injetado pelo CurrentUser decorator no controller (multi-tenancy)
}
