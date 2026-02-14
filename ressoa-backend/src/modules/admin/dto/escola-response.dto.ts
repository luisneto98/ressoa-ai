import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EscolaResponseDto {
  @ApiProperty({
    description: 'ID único da escola',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome da escola',
    example: 'Colégio Exemplo',
  })
  nome!: string;

  @ApiProperty({
    description: 'CNPJ da escola (sem formatação)',
    example: '12345678000190',
  })
  cnpj!: string;

  @ApiProperty({
    description: 'Tipo de escola',
    enum: ['particular', 'publica_municipal', 'publica_estadual'],
    example: 'particular',
  })
  tipo!: 'particular' | 'publica_municipal' | 'publica_estadual';

  @ApiPropertyOptional({
    description: 'Endereço da escola',
  })
  endereco?: object;

  @ApiProperty({
    description: 'Nome do responsável principal',
    example: 'Maria Silva',
  })
  contato_principal!: string;

  @ApiProperty({
    description: 'Email de contato',
    example: 'contato@escola.com.br',
  })
  email_contato!: string;

  @ApiProperty({
    description: 'Telefone de contato',
    example: '11987654321',
  })
  telefone!: string;

  @ApiProperty({
    description: 'Plano contratado',
    enum: ['trial', 'basico', 'completo', 'enterprise'],
    example: 'basico',
  })
  plano!: string;

  @ApiProperty({
    description: 'Limite de horas de transcrição por mês',
    example: 400,
  })
  limite_horas_mes!: number;

  @ApiProperty({
    description: 'Status da escola',
    example: 'ativa',
  })
  status!: string;

  @ApiProperty({
    description: 'Data de ativação da escola',
    example: '2026-02-14T10:00:00.000Z',
  })
  data_ativacao!: Date;

  @ApiProperty({
    description: 'Data de criação',
    example: '2026-02-14T10:00:00.000Z',
  })
  created_at!: Date;
}
