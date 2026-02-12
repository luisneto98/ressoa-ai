import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Disciplina } from '@prisma/client';

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
    enum: Disciplina,
    example: 'MATEMATICA',
  })
  @IsOptional()
  @IsEnum(Disciplina, { message: 'Disciplina inválida' })
  disciplina?: Disciplina;
}
