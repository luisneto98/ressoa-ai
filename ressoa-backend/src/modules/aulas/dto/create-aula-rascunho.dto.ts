import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAulaRascunhoDto {
  @ApiProperty({ description: 'ID da turma' })
  @IsUUID('4', { message: 'turma_id deve ser um UUID válido' })
  turma_id!: string;

  @ApiProperty({ description: 'Aceita datas futuras para planejamento antecipado' })
  @IsDateString({}, { message: 'data deve ser uma data ISO 8601 válida' })
  // SEM @IsNotFutureDate() — DT-3: rascunhos aceitam datas futuras
  data!: string;

  @ApiPropertyOptional({ description: 'ID do planejamento (opcional)' })
  @IsOptional()
  @IsUUID('4', { message: 'planejamento_id deve ser um UUID válido' })
  planejamento_id?: string;

  @ApiPropertyOptional({ maxLength: 2000, description: 'Objetivo/intenção da aula' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  descricao?: string;
}
