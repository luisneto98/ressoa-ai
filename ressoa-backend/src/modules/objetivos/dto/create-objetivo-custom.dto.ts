import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Length,
  Validate,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NivelBloom } from '@prisma/client';
import { IsCriteriosEvidenciaValid } from '../validators/is-criterios-evidencia-valid.validator';

/**
 * DTO para criação de objetivo de aprendizagem customizado
 * Story 11.4: Backend — CRUD de Objetivos Customizados
 *
 * Usado no endpoint POST /turmas/:turma_id/objetivos
 * tipo_fonte será setado automaticamente como CUSTOM pelo service
 *
 * Validações aplicadas (AC2):
 * - codigo: obrigatório, 3-20 chars, único por turma
 * - descricao: obrigatória, 20-500 chars
 * - nivel_cognitivo: enum válido (Taxonomia de Bloom)
 * - area_conhecimento: opcional, max 100 chars
 * - criterios_evidencia: 1-5 itens, cada um 10-200 chars
 */
export class CreateObjetivoCustomDto {
  @ApiProperty({
    description: 'Código único do objetivo dentro da turma (ex: PM-MAT-01)',
    example: 'PM-MAT-01',
    minLength: 3,
    maxLength: 20,
    pattern: '^[A-Z0-9\\-_]+$',
  })
  @IsString({ message: 'codigo deve ser uma string' })
  @Length(3, 20, { message: 'codigo deve ter entre 3 e 20 caracteres' })
  @Matches(/^[A-Z0-9\-_]+$/i, {
    message: 'codigo deve conter apenas letras, números, hífens e underscores',
  })
  codigo!: string;

  @ApiProperty({
    description: 'Descrição pedagógica do objetivo de aprendizagem',
    example:
      'Resolver problemas de regra de três simples e composta aplicados a questões da prova PM-SP',
    minLength: 20,
    maxLength: 500,
  })
  @IsString({ message: 'descricao deve ser uma string' })
  @Length(20, 500, { message: 'descricao deve ter entre 20 e 500 caracteres' })
  descricao!: string;

  @ApiProperty({
    description: 'Nível cognitivo segundo Taxonomia de Bloom',
    enum: NivelBloom,
    example: 'APLICAR',
    enumName: 'NivelBloom',
  })
  @IsEnum(NivelBloom, {
    message:
      'nivel_cognitivo deve ser um dos seguintes valores: LEMBRAR, ENTENDER, APLICAR, ANALISAR, AVALIAR, CRIAR',
  })
  nivel_cognitivo!: NivelBloom;

  @ApiPropertyOptional({
    description: 'Área de conhecimento específica (opcional)',
    example: 'Matemática - Raciocínio Lógico',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'area_conhecimento deve ser uma string' })
  @Length(0, 100, {
    message: 'area_conhecimento deve ter no máximo 100 caracteres',
  })
  area_conhecimento?: string;

  @ApiProperty({
    description:
      'Critérios de evidência para avaliar atingimento do objetivo (1-5 itens)',
    example: [
      'Identifica grandezas proporcionais',
      'Monta proporção corretamente',
      'Resolve equação e valida resultado com contexto do problema',
    ],
    type: [String],
    minItems: 1,
    maxItems: 5,
  })
  @IsArray({ message: 'criterios_evidencia deve ser um array' })
  @ArrayMinSize(1, { message: 'criterios_evidencia deve ter entre 1 e 5 itens' })
  @ArrayMaxSize(5, { message: 'criterios_evidencia deve ter entre 1 e 5 itens' })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? v.trim() : v)) : value,
  )
  @Validate(IsCriteriosEvidenciaValid)
  criterios_evidencia!: string[];
}
