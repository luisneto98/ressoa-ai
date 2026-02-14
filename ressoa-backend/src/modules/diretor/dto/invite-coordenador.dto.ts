import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class InviteCoordenadorDto {
  @ApiProperty({
    description: 'Email do coordenador',
    example: 'coordenador@escola.com.br',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({
    description: 'Nome completo do coordenador',
    example: 'Maria Silva',
  })
  @IsString({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome!: string;
}
