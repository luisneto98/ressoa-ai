import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HabilidadePlanejamentoDto {
  @IsUUID()
  habilidade_id!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  peso?: number; // Opcional - RN-PLAN-02

  @IsOptional()
  @IsInt()
  @Min(1)
  aulas_previstas?: number; // Opcional - RN-PLAN-03
}

export class CreatePlanejamentoDto {
  @IsUUID()
  turma_id!: string;

  @IsInt()
  @Min(1)
  @Max(4)
  bimestre!: number;

  @IsInt()
  @Min(2024)
  ano_letivo!: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Selecione ao menos uma habilidade' })
  @ValidateNested({ each: true })
  @Type(() => HabilidadePlanejamentoDto)
  habilidades!: HabilidadePlanejamentoDto[];
}
