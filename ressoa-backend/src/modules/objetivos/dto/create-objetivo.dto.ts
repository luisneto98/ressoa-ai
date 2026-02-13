import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateIf,
  IsObject,
} from 'class-validator';
import { NivelBloom, TipoFonte } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para criação de ObjetivoAprendizagem
 * Story 11.1: Backend — Modelo de Dados - Objetivos de Aprendizagem
 *
 * Validações condicionais:
 * - BNCC: requer habilidade_bncc_id
 * - CUSTOM: requer turma_id, area_conhecimento, criterios_evidencia (min 1)
 */
export class CreateObjetivoDto {
  @ApiProperty({
    description: 'Código único do objetivo (ex: EF06MA01 para BNCC, PM-MAT-01 para custom)',
    example: 'PM-MAT-01',
  })
  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @ApiProperty({
    description: 'Descrição textual do objetivo de aprendizagem',
    example: 'Resolver problemas envolvendo regra de três simples e composta',
  })
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @ApiProperty({
    description: 'Nível cognitivo segundo Taxonomia de Bloom (6 níveis)',
    enum: NivelBloom,
    example: 'APLICAR',
  })
  @IsEnum(NivelBloom)
  @IsNotEmpty()
  nivel_cognitivo!: NivelBloom;

  @ApiProperty({
    description: 'Tipo de fonte do objetivo (BNCC ou CUSTOM)',
    enum: TipoFonte,
    example: 'CUSTOM',
  })
  @IsEnum(TipoFonte)
  @IsNotEmpty()
  tipo_fonte!: TipoFonte;

  // ==========================================
  // Campos condicionais - BNCC
  // ==========================================

  @ApiPropertyOptional({
    description: 'UUID da habilidade BNCC (obrigatório se tipo_fonte = BNCC)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ValidateIf((o) => o.tipo_fonte === 'BNCC')
  @IsNotEmpty({ message: 'habilidade_bncc_id é obrigatório para objetivos BNCC' })
  @IsUUID('4', { message: 'habilidade_bncc_id deve ser um UUID válido' })
  habilidade_bncc_id?: string;

  // ==========================================
  // Campos condicionais - CUSTOM
  // ==========================================

  @ApiPropertyOptional({
    description: 'UUID da turma (obrigatório se tipo_fonte = CUSTOM)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ValidateIf((o) => o.tipo_fonte === 'CUSTOM')
  @IsNotEmpty({ message: 'turma_id é obrigatório para objetivos customizados' })
  @IsUUID('4', { message: 'turma_id deve ser um UUID válido' })
  turma_id?: string;

  @ApiPropertyOptional({
    description: 'Área de conhecimento (obrigatória se tipo_fonte = CUSTOM)',
    example: 'Matemática Financeira',
  })
  @ValidateIf((o) => o.tipo_fonte === 'CUSTOM')
  @IsNotEmpty({ message: 'area_conhecimento é obrigatória para objetivos customizados' })
  @IsString()
  area_conhecimento?: string;

  @ApiPropertyOptional({
    description:
      'Critérios de evidência para detectar atingimento do objetivo (obrigatório se tipo_fonte = CUSTOM, máximo 5 itens)',
    example: [
      'Identifica grandezas diretamente proporcionais',
      'Aplica regra de três corretamente',
      'Resolve problemas contextualizados',
    ],
    type: [String],
  })
  @ValidateIf((o) => o.tipo_fonte === 'CUSTOM')
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Objetivos customizados requerem ao menos 1 critério de evidência',
  })
  @ArrayMaxSize(5, {
    message: 'Máximo de 5 critérios de evidência permitidos',
  })
  @IsString({ each: true, message: 'Cada critério deve ser uma string' })
  criterios_evidencia?: string[];

  @ApiPropertyOptional({
    description: 'Metadata adicional (JSON livre)',
    example: {
      disciplina: 'Matemática',
      competencia_especifica: 3,
      metodologia_sugerida: 'Resolução de problemas',
    },
  })
  @IsOptional()
  @IsObject()
  contexto_json?: Record<string, any>;
}
