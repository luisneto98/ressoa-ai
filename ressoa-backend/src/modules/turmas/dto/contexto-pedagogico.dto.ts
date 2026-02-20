import {
  IsString,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para contexto pedagógico de turmas customizadas (não-BNCC)
 * Obrigatório quando curriculo_tipo = CUSTOM
 */
export class ContextoPedagogicoDto {
  @ApiProperty({
    minLength: 100,
    maxLength: 500,
    example:
      'Preparar alunos para concurso da Polícia Militar SP (prova de matemática e português)',
    description: 'Objetivo geral do curso customizado',
  })
  @IsString()
  @MinLength(100, {
    message: 'objetivo_geral deve ter no mínimo 100 caracteres',
  })
  @MaxLength(500, {
    message: 'objetivo_geral deve ter no máximo 500 caracteres',
  })
  objetivo_geral!: string;

  @ApiProperty({
    minLength: 20,
    maxLength: 200,
    example:
      'Jovens 18-25 anos, ensino médio completo, aspirantes a carreira militar',
    description: 'Descrição do público-alvo do curso',
  })
  @IsString({ message: 'publico_alvo deve ser uma string' })
  @MinLength(20, { message: 'publico_alvo deve ter no mínimo 20 caracteres' })
  @MaxLength(200, { message: 'publico_alvo deve ter no máximo 200 caracteres' })
  publico_alvo!: string;

  @ApiProperty({
    minLength: 20,
    maxLength: 300,
    example:
      'Simulados semanais + revisão teórica + resolução de provas anteriores',
    description: 'Metodologia utilizada no curso',
  })
  @IsString({ message: 'metodologia deve ser uma string' })
  @MinLength(20, { message: 'metodologia deve ter no mínimo 20 caracteres' })
  @MaxLength(300, { message: 'metodologia deve ter no máximo 300 caracteres' })
  metodologia!: string;

  @ApiProperty({
    minimum: 8,
    maximum: 1000,
    example: 120,
    description: 'Carga horária total do curso em horas',
  })
  @IsInt({ message: 'carga_horaria_total deve ser um número inteiro' })
  @Min(8, { message: 'carga_horaria_total deve ser no mínimo 8 horas' })
  @Max(1000, { message: 'carga_horaria_total deve ser no máximo 1000 horas' })
  carga_horaria_total!: number;
}
