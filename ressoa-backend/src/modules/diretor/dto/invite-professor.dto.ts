import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// HIGH-1 FIX: Use TypeScript enum for type safety and refactoring
export enum Disciplina {
  MATEMATICA = 'MATEMATICA',
  LINGUA_PORTUGUESA = 'LINGUA_PORTUGUESA',
  CIENCIAS = 'CIENCIAS',
}

export class InviteProfessorDto {
  @ApiProperty({
    description: 'Email do professor',
    example: 'professor@escola.com.br',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({
    description: 'Nome completo do professor',
    example: 'João da Silva',
  })
  @IsString({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  nome!: string;

  @ApiProperty({
    description: 'Disciplina principal',
    enum: Disciplina,
    example: Disciplina.MATEMATICA,
  })
  @IsEnum(Disciplina, {
    message: 'Disciplina inválida',
  })
  disciplina!: Disciplina;

  @ApiProperty({
    description: 'Formação acadêmica',
    example: 'Licenciatura em Matemática',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Formação deve ter no máximo 200 caracteres' })
  formacao?: string;

  @ApiProperty({
    description: 'Registro profissional',
    example: 'RP 12345-SP',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Registro deve ter no máximo 50 caracteres' })
  registro?: string;

  @ApiProperty({
    description: 'Telefone de contato',
    example: '(11) 98765-4321',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, {
    message: 'Telefone deve estar no formato (XX) XXXXX-XXXX',
  })
  telefone?: string;
}
