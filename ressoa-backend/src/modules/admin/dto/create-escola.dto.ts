import {
  IsString,
  IsEmail,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
  IsEnum,
  IsInt,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEscolaDto {
  @ApiProperty({
    description: 'Nome da escola',
    example: 'Colégio Exemplo',
  })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  nome!: string;

  @ApiProperty({
    description: 'CNPJ (formatado ou não)',
    example: '12.345.678/0001-90',
  })
  @IsString()
  @Matches(/^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14})$/, {
    message: 'CNPJ inválido (formato: XX.XXX.XXX/XXXX-XX ou 14 dígitos)',
  })
  cnpj!: string;

  @ApiProperty({
    description: 'Tipo de escola',
    enum: ['particular', 'publica_municipal', 'publica_estadual'],
    example: 'particular',
  })
  @IsEnum(['particular', 'publica_municipal', 'publica_estadual'], {
    message: 'Tipo deve ser: particular, publica_municipal ou publica_estadual',
  })
  tipo!: 'particular' | 'publica_municipal' | 'publica_estadual';

  @ApiProperty({
    description: 'Nome do responsável principal',
    example: 'Maria Silva',
  })
  @IsString()
  @MinLength(3, {
    message: 'Nome do responsável deve ter no mínimo 3 caracteres',
  })
  @MaxLength(100, {
    message: 'Nome do responsável deve ter no máximo 100 caracteres',
  })
  contato_principal!: string;

  @ApiProperty({
    description: 'Email de contato da escola',
    example: 'contato@escola.com.br',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email_contato!: string;

  @ApiProperty({
    description: 'Telefone de contato',
    example: '(11) 98765-4321',
  })
  @IsString()
  @Matches(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, {
    message: 'Telefone inválido (formato: (XX) XXXXX-XXXX)',
  })
  telefone!: string;

  @ApiProperty({
    description: 'Plano contratado',
    enum: ['trial', 'basico', 'completo', 'enterprise'],
    example: 'basico',
  })
  @IsEnum(['trial', 'basico', 'completo', 'enterprise'], {
    message: 'Plano deve ser: trial, basico, completo ou enterprise',
  })
  plano!: 'trial' | 'basico' | 'completo' | 'enterprise';

  @ApiProperty({
    description: 'Limite de horas de transcrição por mês',
    example: 400,
    minimum: 1,
  })
  @IsInt()
  @Min(1, { message: 'Limite deve ser no mínimo 1 hora/mês' })
  limite_horas_mes!: number;

  @ApiPropertyOptional({
    description: 'Endereço da escola (opcional)',
    example: {
      rua: 'Rua Exemplo',
      numero: '123',
      bairro: 'Centro',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01234-567',
    },
  })
  @IsOptional()
  @IsObject()
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
}
