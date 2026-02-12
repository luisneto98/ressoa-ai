import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { IsNotFutureDate } from '../validators/is-not-future-date.validator';

export class EntradaManualDto {
  @IsUUID('4', { message: 'turma_id deve ser um UUID válido' })
  turma_id!: string;

  @IsDateString({}, { message: 'data deve ser uma data ISO 8601 válida' })
  @IsNotFutureDate()
  data!: string; // ISO 8601

  @IsOptional()
  @IsUUID('4', { message: 'planejamento_id deve ser um UUID válido' })
  planejamento_id?: string;

  @IsString({ message: 'resumo deve ser uma string' })
  @MinLength(200, { message: 'Resumo deve ter no mínimo 200 caracteres' })
  @MaxLength(5000, { message: 'Resumo não pode exceder 5.000 caracteres' })
  resumo!: string;
}
