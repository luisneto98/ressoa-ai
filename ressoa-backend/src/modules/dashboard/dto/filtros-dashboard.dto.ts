import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DISCIPLINAS } from '../../../common/constants/disciplinas';

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
    description: 'Disciplina',
    required: false,
    enum: DISCIPLINAS,
    example: 'MATEMATICA',
  })
  @IsOptional()
  @IsString()
  @IsIn([...DISCIPLINAS], {
    message: `Disciplina deve ser um dos valores: ${DISCIPLINAS.join(', ')}`,
  })
  disciplina?: string;

  @ApiProperty({
    description: 'Tipo de Ensino (FUNDAMENTAL, MEDIO)',
    required: false,
    enum: ['FUNDAMENTAL', 'MEDIO'],
    example: 'FUNDAMENTAL',
  })
  @IsOptional()
  @IsString()
  @IsIn(['FUNDAMENTAL', 'MEDIO'], {
    message: 'Tipo de ensino deve ser FUNDAMENTAL ou MEDIO',
  })
  tipo_ensino?: 'FUNDAMENTAL' | 'MEDIO';
}
