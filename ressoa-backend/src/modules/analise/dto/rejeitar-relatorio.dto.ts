import { IsString, MinLength, MaxLength } from 'class-validator';

export class RejeitarRelatorioDto {
  @IsString()
  @MinLength(10, { message: 'Motivo deve ter ao menos 10 caracteres' })
  @MaxLength(500, { message: 'Motivo deve ter no máximo 500 caracteres' })
  motivo!: string; // Feedback explícito do professor
}
