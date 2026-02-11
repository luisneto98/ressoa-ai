import { IsUUID, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { TipoEntrada } from '@prisma/client';
import { IsNotFutureDate } from '../validators/is-not-future-date.validator';

export class CreateAulaDto {
  @IsUUID('4', { message: 'turma_id deve ser um UUID válido' })
  turma_id!: string;

  @IsDateString({}, { message: 'data deve ser uma data ISO 8601 válida' })
  @IsNotFutureDate()
  data!: string; // ISO 8601

  @IsOptional()
  @IsUUID('4', { message: 'planejamento_id deve ser um UUID válido' })
  planejamento_id?: string;

  @IsEnum(TipoEntrada, {
    message: 'tipo_entrada deve ser AUDIO, TRANSCRICAO ou MANUAL',
  })
  tipo_entrada!: TipoEntrada;
}
