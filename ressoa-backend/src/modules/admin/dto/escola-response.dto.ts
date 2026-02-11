import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EscolaResponseDto {
  @ApiProperty({
    description: 'ID único da escola',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome da escola',
    example: 'Escola Municipal João Silva',
  })
  nome!: string;

  @ApiProperty({
    description: 'CNPJ da escola',
    example: '12.345.678/0001-90',
  })
  cnpj!: string;

  @ApiProperty({
    description: 'Email de contato da escola',
    example: 'contato@escola.com',
  })
  email_contato!: string;

  @ApiPropertyOptional({
    description: 'Telefone de contato',
    example: '(11) 98765-4321',
  })
  telefone?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2026-02-11T17:14:34.000Z',
  })
  created_at!: Date;
}
