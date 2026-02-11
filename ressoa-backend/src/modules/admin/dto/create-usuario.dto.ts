import {
  IsEmail,
  IsString,
  MinLength,
  IsUUID,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleUsuario } from '@prisma/client';

export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'professor@escola.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description:
      'Senha do usuário (mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número)',
    example: 'Senha@123',
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Senha deve conter pelo menos 1 letra maiúscula, 1 minúscula e 1 número',
  })
  senha!: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Professor Silva',
  })
  @IsString()
  nome!: string;

  @ApiProperty({
    description: 'ID da escola à qual o usuário pertence',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  escola_id!: string;

  @ApiProperty({
    description: 'Role do usuário no sistema',
    enum: RoleUsuario,
    example: RoleUsuario.PROFESSOR,
  })
  @IsEnum(RoleUsuario, {
    message: 'Role deve ser PROFESSOR, COORDENADOR, DIRETOR ou ADMIN',
  })
  role!: RoleUsuario;
}
