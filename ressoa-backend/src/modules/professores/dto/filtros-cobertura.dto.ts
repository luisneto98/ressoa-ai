import {
  IsOptional,
  IsUUID,
  IsString,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrosCoberturaDto {
  @IsOptional()
  @IsUUID()
  turma_id?: string;

  @IsOptional()
  @IsString()
  @IsIn(['MATEMATICA', 'LINGUA_PORTUGUESA', 'CIENCIAS'])
  disciplina?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  bimestre?: number;
}
