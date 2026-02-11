import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * ForgotPasswordDto - Request password reset via email
 * Story 1.5 - Task 2: Create DTOs for Password Recovery
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email do usuário que esqueceu a senha',
    example: 'professor@escola.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;
}
