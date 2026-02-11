import { ApiProperty } from '@nestjs/swagger';
import { RoleUsuario } from '@prisma/client';

export class UsuarioResponseDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'professor@escola.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Professor Silva',
  })
  nome!: string;

  @ApiProperty({
    description: 'ID da escola',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  escola_id!: string;

  @ApiProperty({
    description: 'Role do usuário',
    enum: RoleUsuario,
    example: RoleUsuario.PROFESSOR,
  })
  role!: RoleUsuario;

  @ApiProperty({
    description: 'Data de criação',
    example: '2026-02-11T17:14:34.000Z',
  })
  created_at!: Date;

  // NUNCA incluir senha ou senha_hash por segurança
}
