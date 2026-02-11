import { IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { StatusProcessamento } from '@prisma/client';

export class QueryAulasDto {
  @IsOptional()
  @IsUUID('4', { message: 'turma_id deve ser um UUID válido' })
  turma_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'data_inicio deve ser uma data ISO 8601 válida' })
  data_inicio?: string; // ISO 8601

  @IsOptional()
  @IsDateString({}, { message: 'data_fim deve ser uma data ISO 8601 válida' })
  data_fim?: string; // ISO 8601

  @IsOptional()
  @IsEnum(StatusProcessamento, {
    message:
      'status_processamento deve ser um valor válido do enum StatusProcessamento',
  })
  status_processamento?: StatusProcessamento;
}
