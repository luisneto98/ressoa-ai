import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ description: 'Nome do usuário', minLength: 3, maxLength: 200 })
  @IsOptional()
  @IsString({ message: 'nome deve ser uma string' })
  @MinLength(3, { message: 'nome deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'nome deve ter no máximo 200 caracteres' })
  nome?: string;

  @ApiPropertyOptional({ description: 'Email do usuário' })
  @IsOptional()
  @IsEmail({}, { message: 'email deve ser um email válido' })
  email?: string;
}
