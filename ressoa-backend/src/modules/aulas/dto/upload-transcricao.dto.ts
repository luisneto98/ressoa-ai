import { IsUUID, IsDateString, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { IsNotFutureDate } from '../validators/is-not-future-date.validator';

export class UploadTranscricaoDto {
  @IsUUID('4', { message: 'turma_id deve ser um UUID válido' })
  turma_id!: string;

  @IsDateString({}, { message: 'data deve ser uma data ISO 8601 válida' })
  @IsNotFutureDate()
  data!: string; // ISO 8601

  @IsOptional()
  @IsUUID('4', { message: 'planejamento_id deve ser um UUID válido' })
  planejamento_id?: string;

  @IsString({ message: 'transcricao_texto deve ser uma string' })
  @MinLength(100, { message: 'Transcrição deve ter no mínimo 100 caracteres' })
  @MaxLength(50000, { message: 'Transcrição não pode exceder 50.000 caracteres' })
  @Matches(/\S{50,}/, { message: 'Transcrição deve conter pelo menos 50 caracteres não-brancos' })
  transcricao_texto!: string;
}
