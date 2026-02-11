import { IsString, IsEmail, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEscolaDto {
  @ApiProperty({
    description: 'Nome da escola',
    example: 'Escola Municipal João Silva',
  })
  @IsString()
  nome!: string;

  @ApiProperty({
    description: 'CNPJ da escola no formato XX.XXX.XXX/XXXX-XX',
    example: '12.345.678/0001-90',
  })
  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX',
  })
  cnpj!: string;

  @ApiProperty({
    description: 'Email de contato da escola',
    example: 'contato@escola.com',
  })
  @IsEmail()
  email_contato!: string;

  @ApiPropertyOptional({
    description: 'Telefone de contato (opcional)',
    example: '(11) 98765-4321',
  })
  @IsOptional()
  @IsString()
  telefone?: string;
}
