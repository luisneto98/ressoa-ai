import { IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FiltrosCustosDto {
  @ApiProperty({
    description: 'Mês de consulta (YYYY-MM)',
    example: '2026-02',
    required: false,
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Formato inválido. Use YYYY-MM',
  })
  mes?: string;
}
