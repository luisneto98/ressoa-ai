import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsInt,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Serie, TipoEnsino } from '@prisma/client';

export class CreateTurmaDto {
  @ApiProperty({ example: '6A', description: 'Nome da turma' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({
    example: 'MATEMATICA',
    description: 'Código da disciplina',
    enum: ['MATEMATICA', 'LINGUA_PORTUGUESA', 'CIENCIAS'],
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['MATEMATICA', 'LINGUA_PORTUGUESA', 'CIENCIAS'], {
    message: 'disciplina deve ser MATEMATICA, LINGUA_PORTUGUESA ou CIENCIAS',
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

  // escola_id será injetado pelo CurrentUser decorator no controller (multi-tenancy)
}
