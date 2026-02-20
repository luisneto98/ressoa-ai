import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAulaDescricaoDto {
  @ApiPropertyOptional({ maxLength: 2000, description: 'Objetivo/intenção da aula (imutável após início do processamento)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  descricao?: string;
}
