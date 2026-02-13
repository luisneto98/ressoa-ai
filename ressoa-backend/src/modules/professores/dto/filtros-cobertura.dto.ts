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

  /**
   * Filtro por tipo de currículo da turma
   * - BNCC: Turmas baseadas em habilidades BNCC
   * - CUSTOM: Turmas com objetivos de aprendizagem customizados
   * - TODOS (default): Retorna ambos os tipos
   */
  @IsOptional()
  @IsString()
  @IsIn(['BNCC', 'CUSTOM'])
  curriculo_tipo?: 'BNCC' | 'CUSTOM';
}
