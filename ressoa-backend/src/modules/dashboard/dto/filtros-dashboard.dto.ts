import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FiltrosDashboardDto {
  @ApiProperty({
    description: 'Bimestre (1 a 4)',
    required: false,
    minimum: 1,
    maximum: 4,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Bimestre deve ser um número inteiro' })
  @Min(1, { message: 'Bimestre mínimo: 1' })
  @Max(4, { message: 'Bimestre máximo: 4' })
  bimestre?: number;

  @ApiProperty({
    description: 'Disciplina (MATEMATICA, LINGUA_PORTUGUESA, CIENCIAS)',
    required: false,
    enum: ['MATEMATICA', 'LINGUA_PORTUGUESA', 'CIENCIAS'],
    example: 'MATEMATICA',
  })
  @IsOptional()
  @IsString()
  @IsIn(['MATEMATICA', 'LINGUA_PORTUGUESA', 'CIENCIAS'], {
    message: 'Disciplina deve ser MATEMATICA, LINGUA_PORTUGUESA ou CIENCIAS',
  })
  disciplina?: 'MATEMATICA' | 'LINGUA_PORTUGUESA' | 'CIENCIAS';
}
