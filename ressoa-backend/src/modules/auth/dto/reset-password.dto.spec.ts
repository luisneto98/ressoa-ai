import { validate } from 'class-validator';
import { ResetPasswordDto } from './reset-password.dto';
import { ForgotPasswordDto } from './forgot-password.dto';

describe('Password Recovery DTOs', () => {
  describe('ForgotPasswordDto', () => {
    it('should pass validation with valid email', async () => {
      const dto = new ForgotPasswordDto();
      dto.email = 'professor@escola.com';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid email', async () => {
      const dto = new ForgotPasswordDto();
      dto.email = 'invalid-email';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should fail validation with empty email', async () => {
      const dto = new ForgotPasswordDto();
      dto.email = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ResetPasswordDto', () => {
    const validToken =
      'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

    describe('Token validation', () => {
      it('should pass validation with valid token', async () => {
        const dto = new ResetPasswordDto();
        dto.token = validToken;
        dto.novaSenha = 'ValidPass123';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should pass with any string token (backend validates)', async () => {
        const dto = new ResetPasswordDto();
        dto.token = 'short-token';
        dto.novaSenha = 'ValidPass123';

        const errors = await validate(dto);
        // Token validation is lenient (backend checks Redis)
        expect(errors.length).toBe(0);
      });
    });

    describe('Password strength validation', () => {
      it('should pass with strong password (uppercase, lowercase, number)', async () => {
        const dto = new ResetPasswordDto();
        dto.token = validToken;
        dto.novaSenha = 'StrongPass123';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail with password shorter than 8 characters', async () => {
        const dto = new ResetPasswordDto();
        dto.token = validToken;
        dto.novaSenha = 'Pass1';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints?.minLength).toBeDefined();
      });

      it('should fail with password without uppercase letter', async () => {
        const dto = new ResetPasswordDto();
        dto.token = validToken;
        dto.novaSenha = 'lowercase123';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints?.matches).toBeDefined();
      });

      it('should fail with password without lowercase letter', async () => {
        const dto = new ResetPasswordDto();
        dto.token = validToken;
        dto.novaSenha = 'UPPERCASE123';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints?.matches).toBeDefined();
      });

      it('should fail with password without number', async () => {
        const dto = new ResetPasswordDto();
        dto.token = validToken;
        dto.novaSenha = 'NoNumbers';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints?.matches).toBeDefined();
      });

      it('should pass with special characters (not required but allowed)', async () => {
        const dto = new ResetPasswordDto();
        dto.token = validToken;
        dto.novaSenha = 'Strong!Pass123@';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });
  });
});
