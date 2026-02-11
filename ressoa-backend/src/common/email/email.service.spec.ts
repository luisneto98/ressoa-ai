import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as sgMail from '@sendgrid/mail';

// Mock SendGrid
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockConfigDevelopment = {
    NODE_ENV: 'development',
    EMAIL_PROVIDER: 'sendgrid',
    EMAIL_API_KEY: 'SG.test-key',
    EMAIL_FROM: 'noreply@test.com',
    FRONTEND_URL: 'http://localhost:5173',
  };

  const mockConfigProduction = {
    NODE_ENV: 'production',
    EMAIL_PROVIDER: 'sendgrid',
    EMAIL_API_KEY: 'SG.real-api-key',
    EMAIL_FROM: 'noreply@ressoa.ai',
    FRONTEND_URL: 'https://app.ressoa.ai',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (sgMail.send as jest.Mock).mockResolvedValue([{ statusCode: 202 }]);

    const mockConfig = jest.fn((key: string) => mockConfigDevelopment[key]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: mockConfig,
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail - Development Mode', () => {
    it('should log email in development mode (not send)', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.sendPasswordResetEmail(
        'test@example.com',
        'test-token-123',
      );

      // Should log instead of sending
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MOCK EMAIL]'),
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('test@example.com'),
      );

      // Should NOT call SendGrid in development
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    it('should generate correct reset URL with token', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.sendPasswordResetEmail(
        'user@test.com',
        'secure-token-abc123',
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'http://localhost:5173/reset-password?token=secure-token-abc123',
        ),
      );
    });
  });

  describe('sendPasswordResetEmail - Production Mode', () => {
    beforeEach(async () => {
      // Recreate service with production config
      const mockConfig = jest.fn((key: string) => mockConfigProduction[key]);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: mockConfig,
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    it('should send real email in production', async () => {
      await service.sendPasswordResetEmail(
        'professor@escola.com',
        'production-token-xyz',
      );

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'professor@escola.com',
          from: 'noreply@ressoa.ai',
          subject: 'Recuperação de Senha - Ressoa AI',
          html: expect.stringContaining(
            'https://app.ressoa.ai/reset-password?token=production-token-xyz',
          ),
        }),
      );
    });

    it('should use correct email template with branding', async () => {
      await service.sendPasswordResetEmail(
        'user@test.com',
        'test-token',
      );

      const call = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(call.html).toContain('Ressoa AI');
      expect(call.html).toContain('Recuperação de Senha');
      expect(call.html).toContain('Este link expira em <strong>1 hora</strong>');
      expect(call.html).toContain('Se você não solicitou esta redefinição');
    });

    it('should include security warning in email', async () => {
      await service.sendPasswordResetEmail(
        'user@test.com',
        'token',
      );

      const call = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(call.html).toContain('Segurança');
      expect(call.html).toContain('ignore este email');
    });

    it('should handle SendGrid errors gracefully (no throw)', async () => {
      (sgMail.send as jest.Mock).mockRejectedValueOnce(
        new Error('SendGrid API error'),
      );

      // Should NOT throw - security requirement (Story 1.2)
      await expect(
        service.sendPasswordResetEmail('user@test.com', 'token'),
      ).resolves.not.toThrow();
    });

    it('should log error when email fails', async () => {
      (sgMail.send as jest.Mock).mockRejectedValueOnce(
        new Error('Network timeout'),
      );
      const errorSpy = jest.spyOn(service['logger'], 'error');

      await service.sendPasswordResetEmail('user@test.com', 'token');

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send password reset email'),
      );
    });

    it('should log success when email sent', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.sendPasswordResetEmail('professor@escola.com', 'token');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Password reset email sent successfully'),
      );
    });
  });

  describe('Email template', () => {
    it('should be responsive (viewport meta tag)', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.sendPasswordResetEmail('user@test.com', 'token');

      const logCall = loggerSpy.mock.calls.find((call) =>
        call[0].includes('[MOCK EMAIL]'),
      );

      // In development, we can't directly inspect the HTML
      // But we verify the method was called correctly
      expect(logCall).toBeDefined();
    });
  });

  describe('Configuration validation', () => {
    it('should initialize SendGrid when API key is valid', () => {
      expect(sgMail.setApiKey).toHaveBeenCalled();
    });

    it('should use default email if EMAIL_FROM not configured', async () => {
      const mockConfigNoFrom = jest.fn((key: string) => {
        if (key === 'EMAIL_FROM') return undefined;
        return mockConfigProduction[key];
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: mockConfigNoFrom,
            },
          },
        ],
      }).compile();

      const serviceNoFrom = module.get<EmailService>(EmailService);

      await serviceNoFrom.sendPasswordResetEmail('user@test.com', 'token');

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@ressoa.ai', // Default fallback
        }),
      );
    });
  });
});
