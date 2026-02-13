import { IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { TipoFonte } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para query params /objetivos/tipo-fonte
 * Story 11.1 - Code Review Fix: Validar query params
 */
export class FindByTipoFonteDto {
  @ApiProperty({
    description: 'Tipo de fonte do objetivo (BNCC, CUSTOM, CEFR, SENAC)',
    enum: TipoFonte,
    example: 'BNCC',
  })
  @IsEnum(TipoFonte, { message: 'tipo_fonte deve ser um valor válido: BNCC, CUSTOM, CEFR, SENAC' })
  @IsNotEmpty()
  tipo_fonte!: TipoFonte;
}

/**
 * DTO para query params /objetivos/turma
 * Story 11.1 - Code Review Fix: Validar query params
 */
export class FindByTurmaDto {
  @ApiProperty({
    description: 'UUID da turma',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'turma_id deve ser um UUID válido' })
  @IsNotEmpty()
  turma_id!: string;
}

/**
 * DTO para query params /objetivos/count
 * Story 11.1 - Code Review Fix: Validar query params
 */
export class CountByTipoFonteDto {
  @ApiProperty({
    description: 'Tipo de fonte do objetivo para contar',
    enum: TipoFonte,
    example: 'CUSTOM',
  })
  @IsEnum(TipoFonte, { message: 'tipo_fonte deve ser um valor válido: BNCC, CUSTOM, CEFR, SENAC' })
  @IsNotEmpty()
  tipo_fonte!: TipoFonte;
}
