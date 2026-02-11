import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * ResetPasswordDto - Reset password with token
 * Story 1.5 - Task 2: Create DTOs for Password Recovery
 *
 * Password requirements (Security - Story 1.5):
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 *
 * CODE REVIEW NOTE (Issue #4):
 * Special characters (@, #, $, !) are NOT required per AC specification.
 * This meets Story 1.5 requirements but is weaker than OWASP recommendations.
 * Future improvement: Consider requiring special characters for stronger entropy.
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperação recebido por email',
    example: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    minLength: 64,
    maxLength: 64,
  })
  @IsString()
  token!: string;

  @ApiProperty({
    description:
      'Nova senha (mínimo 8 caracteres, deve conter maiúscula, minúscula e número)',
    example: 'NovaSenha123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
  })
  novaSenha!: string;
}
