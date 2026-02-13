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
import { DISCIPLINAS } from '../../../common/constants/disciplinas';

export class FiltrosCoberturaDto {
  @IsOptional()
  @IsUUID()
  turma_id?: string;

  @IsOptional()
  @IsString()
  @IsIn([...DISCIPLINAS])
  disciplina?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  bimestre?: number;
}
