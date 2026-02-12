import { IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FiltrosPromptsQualidadeDto {
  @ApiProperty({
    description: 'Período de consulta',
    enum: ['7d', '30d', '90d'],
    default: '30d',
    required: false,
  })
  @IsOptional()
  @IsIn(['7d', '30d', '90d'])
  periodo?: string = '30d';
}
