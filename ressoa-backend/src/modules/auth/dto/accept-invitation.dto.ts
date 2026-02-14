import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Token de convite recebido por email',
    example: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234',
    minLength: 64,
    maxLength: 64,
  })
  @IsString()
  @MinLength(64, { message: 'Token inválido' })
  @MaxLength(64, { message: 'Token inválido' })
  token!: string;

  @ApiProperty({
    description: 'Nova senha (mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial)',
    example: 'MinhaSenh@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&)',
  })
  senha!: string;
}
