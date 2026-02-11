import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enum para disciplinas BNCC (MVP)
 * Nota: Não usamos Prisma enum porque Habilidade.disciplina é String
 * (compatibilidade com model Disciplina existente)
 */
export enum DisciplinaEnum {
  MATEMATICA = 'MATEMATICA',
  LINGUA_PORTUGUESA = 'LINGUA_PORTUGUESA',
  CIENCIAS = 'CIENCIAS',
}

/**
 * DTO para query params do endpoint GET /api/v1/habilidades
 *
 * Suporta filtros combinados:
 * - disciplina: filtra por disciplina BNCC
 * - serie: filtra por ano escolar (6-9), considera blocos compartilhados LP
 * - unidade_tematica: filtra por unidade temática (ex: Álgebra, Números)
 * - search: full-text search no código e descrição (PostgreSQL tsvector)
 * - limit: limite de resultados por página (default 50, max 200)
 * - offset: número de registros a pular (pagination)
 */
export class QueryHabilidadesDto {
  @IsOptional()
  @IsEnum(DisciplinaEnum, {
    message: 'Disciplina inválida. Valores permitidos: MATEMATICA, LINGUA_PORTUGUESA, CIENCIAS',
  })
  disciplina?: DisciplinaEnum;

  @IsOptional()
  @IsInt({ message: 'Série deve ser um número inteiro' })
  @Min(6, { message: 'Série mínima é 6 (6º ano)' })
  @Max(9, { message: 'Série máxima é 9 (9º ano)' })
  @Type(() => Number) // Converte string query param para number
  serie?: number;

  @IsOptional()
  @IsString({ message: 'Unidade temática deve ser uma string' })
  unidade_tematica?: string;

  @IsOptional()
  @IsString({ message: 'Search deve ser uma string' })
  search?: string;

  @IsOptional()
  @IsInt({ message: 'Limit deve ser um número inteiro' })
  @Min(1, { message: 'Limit mínimo é 1' })
  @Max(200, { message: 'Limit máximo é 200 (evita queries muito grandes)' })
  @Type(() => Number)
  limit?: number = 50; // Default: 50 registros

  @IsOptional()
  @IsInt({ message: 'Offset deve ser um número inteiro' })
  @Min(0, { message: 'Offset mínimo é 0' })
  @Type(() => Number)
  offset?: number = 0; // Default: primeira página
}
