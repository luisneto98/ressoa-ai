import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'professor@escola.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 8 caracteres)',
    example: 'SenhaSegura123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  senha!: string;
}
