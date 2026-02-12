import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';
import { StatusProcessamento } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryAulasDto {
  @IsOptional()
  @IsUUID('4', { message: 'turma_id deve ser um UUID válido' })
  turma_id?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'data_inicio deve ser uma data ISO 8601 válida' },
  )
  data_inicio?: string; // ISO 8601

  @IsOptional()
  @IsDateString({}, { message: 'data_fim deve ser uma data ISO 8601 válida' })
  data_fim?: string; // ISO 8601

  @IsOptional()
  @IsArray({ message: 'status deve ser um array' })
  @IsEnum(StatusProcessamento, {
    each: true,
    message: 'Cada status deve ser um valor válido do enum StatusProcessamento',
  })
  status?: StatusProcessamento[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um número inteiro' })
  @Min(1, { message: 'page deve ser no mínimo 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit deve ser um número inteiro' })
  @Min(1, { message: 'limit deve ser no mínimo 1' })
  limit?: number;
}
