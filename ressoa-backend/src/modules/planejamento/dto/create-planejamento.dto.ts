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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HabilidadePlanejamentoDto {
  @ApiProperty({
    description: 'ID da habilidade BNCC',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  habilidade_id!: string;

  @ApiPropertyOptional({
    description: 'Peso da habilidade no planejamento (opcional - default automático)',
    example: 1.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  peso?: number; // Opcional - RN-PLAN-02

  @ApiPropertyOptional({
    description: 'Número de aulas previstas (opcional - estimado automaticamente)',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  aulas_previstas?: number; // Opcional - RN-PLAN-03
}

/**
 * DTO para objetivo de aprendizagem no planejamento (Story 11.3)
 * Suporta tanto objetivos BNCC (migrados) quanto customizados
 */
export class PlanejamentoObjetivoInputDto {
  @ApiProperty({
    description: 'ID do objetivo de aprendizagem (BNCC ou customizado)',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  objetivo_id!: string;

  @ApiPropertyOptional({
    description: 'Peso do objetivo no planejamento (opcional - default 1.0)',
    example: 1.0,
    minimum: 0.1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  peso?: number;

  @ApiPropertyOptional({
    description: 'Número de aulas previstas para este objetivo',
    example: 8,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  aulas_previstas?: number;
}

export class CreatePlanejamentoDto {
  @ApiProperty({
    description: 'ID da turma',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  turma_id!: string;

  @ApiProperty({
    description: 'Bimestre (1-4)',
    example: 1,
    minimum: 1,
    maximum: 4,
  })
  @IsInt()
  @Min(1)
  @Max(4)
  bimestre!: number;

  @ApiProperty({
    description: 'Ano letivo',
    example: 2026,
    minimum: 2024,
  })
  @IsInt()
  @Min(2024)
  ano_letivo!: number;

  @ApiPropertyOptional({
    description:
      'Habilidades BNCC (DEPRECATED - usar objetivos[] para novos planejamentos)',
    type: [HabilidadePlanejamentoDto],
    example: [
      {
        habilidade_id: '550e8400-e29b-41d4-a716-446655440000',
        peso: 1.0,
        aulas_previstas: 10,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Selecione ao menos uma habilidade' })
  @ValidateNested({ each: true })
  @Type(() => HabilidadePlanejamentoDto)
  habilidades?: HabilidadePlanejamentoDto[];

  @ApiPropertyOptional({
    description:
      'Objetivos de aprendizagem (BNCC ou customizados) - Story 11.3. Mínimo 3 objetivos.',
    type: [PlanejamentoObjetivoInputDto],
    example: [
      {
        objetivo_id: '660e8400-e29b-41d4-a716-446655440000',
        peso: 1.0,
        aulas_previstas: 8,
      },
      {
        objetivo_id: '770e8400-e29b-41d4-a716-446655440001',
        peso: 1.5,
        aulas_previstas: 12,
      },
      {
        objetivo_id: '880e8400-e29b-41d4-a716-446655440002',
        peso: 1.0,
        aulas_previstas: 6,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(3, {
    message: 'Planejamento deve ter no mínimo 3 objetivos de aprendizagem',
  })
  @ValidateNested({ each: true })
  @Type(() => PlanejamentoObjetivoInputDto)
  objetivos?: PlanejamentoObjetivoInputDto[];
}
