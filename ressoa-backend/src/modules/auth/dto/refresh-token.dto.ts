import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token obtido no login',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString({ message: 'Refresh token inválido' })
  refreshToken: string;
}
