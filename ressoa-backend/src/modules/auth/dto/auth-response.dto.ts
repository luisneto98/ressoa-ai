import { ApiProperty } from '@nestjs/swagger';

class UserDataDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Nome do usuário' })
  nome: string;

  @ApiProperty({
    description: 'Role do usuário',
    enum: ['PROFESSOR', 'COORDENADOR', 'DIRETOR'],
  })
  role: string;

  @ApiProperty({ description: 'Dados da escola' })
  escola: {
    id: string;
    nome: string;
  };
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (15 minutos)' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token (7 dias)' })
  refreshToken: string;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    type: UserDataDto,
  })
  user: UserDataDto;
}

export class LogoutResponseDto {
  @ApiProperty({ description: 'Mensagem de confirmação' })
  message: string;
}
