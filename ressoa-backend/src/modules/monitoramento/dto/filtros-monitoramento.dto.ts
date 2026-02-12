import { IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FiltrosMonitoramentoDto {
  @ApiProperty({
    description: 'Período de consulta',
    enum: ['1h', '24h', '7d', '30d'],
    default: '24h',
    required: false,
  })
  @IsOptional()
  @IsIn(['1h', '24h', '7d', '30d'])
  periodo?: string = '24h';
}
