import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { Env } from '../../config/env';

/**
 * Data structure for transcription ready email
 * Story 4.4 - AC2: EmailService with sendTranscricaoProntaEmail
 */
export interface TranscricaoProntaEmailData {
  to: string;
  professorNome: string;
  turmaNome: string;
  aulaData: Date;
  link: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isDevelopment: boolean;
  private readonly emailEnabled: boolean;

  constructor(private readonly configService: ConfigService<Env>) {
    const nodeEnv = this.configService.get('NODE_ENV');
    this.isDevelopment = nodeEnv === 'development' || nodeEnv === 'test';

    // Initialize SendGrid only in production with valid API key
    // Code Review MEDIUM-2: Improve API key validation
    const provider = this.configService.get('EMAIL_PROVIDER');
    const apiKey = this.configService.get('EMAIL_API_KEY');

    // Validate SendGrid API key format (SG. prefix + reasonable length)
    const isSendGridFormat =
      apiKey?.startsWith('SG.') &&
      apiKey.length > 20 &&
      apiKey !== 'SG.your_sendgrid_api_key_here';
    this.emailEnabled = nodeEnv === 'production' && isSendGridFormat;

    if (provider === 'sendgrid' && this.emailEnabled) {
      sgMail.setApiKey(apiKey);
      this.logger.log('SendGrid email service initialized (production mode)');
    } else {
      this.logger.warn(
        `Email service running in mock mode (env: ${nodeEnv}, valid key: ${isSendGridFormat})`,
      );
    }
  }

  /**
   * Send password reset email to user
   * Story 1.5 - AC: EmailService
   *
   * @param email - User email address
   * @param resetToken - Secure reset token (64 chars hex)
   * @returns Promise<void>
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const from = this.configService.get('EMAIL_FROM') || 'noreply@ressoa.ai';

    const msg = {
      to: email,
      from,
      subject: 'Recuperação de Senha - Ressoa AI',
      html: this.getPasswordResetTemplate(resetUrl),
    };

    // PRODUCTION SAFETY: Mock emails in development (Story 1.4 learning)
    if (this.isDevelopment || !this.emailEnabled) {
      this.logger.log(
        `[MOCK EMAIL] Password reset email to ${email}\nReset URL: ${resetUrl}`,
      );
      return;
    }

    try {
      await sgMail.send(msg);
      // Lesson from Story 1.4: Add audit logging for security events
      this.logger.log(`Password reset email sent successfully to ${email}`);
    } catch (error: unknown) {
      // Don't throw - this prevents revealing whether email was sent (security)
      // Story 1.2 learning: Generic error messages
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send password reset email: ${errorMessage}`);
    }
  }

  /**
   * Send transcription ready email to professor
   * Story 4.4 - AC2: EmailService with Email Integration
   *
   * @param data - Email data (professor info, turma, link)
   * @returns Promise<void>
   */
  async sendTranscricaoProntaEmail(
    data: TranscricaoProntaEmailData,
  ): Promise<void> {
    const from = this.configService.get('EMAIL_FROM') || 'noreply@ressoa.ai';
    const formattedDate = new Date(data.aulaData).toLocaleDateString('pt-BR');

    const msg = {
      to: data.to,
      from,
      subject: 'Transcrição Pronta - Ressoa AI',
      html: this.getTranscricaoProntaTemplate(data, formattedDate),
    };

    // PRODUCTION SAFETY: Mock emails in development (Story 1.5 learning)
    if (this.isDevelopment || !this.emailEnabled) {
      this.logger.log(
        `[MOCK EMAIL] Transcription ready email to ${data.to}\nProfessor: ${data.professorNome}\nTurma: ${data.turmaNome}\nData: ${formattedDate}\nLink: ${data.link}`,
      );
      return;
    }

    try {
      await sgMail.send(msg);
      // Add audit logging for notification events
      this.logger.log(
        `Transcription ready email sent successfully to ${data.to} (professor: ${data.professorNome})`,
      );
    } catch (error: unknown) {
      // Don't throw - this prevents blocking notification creation (Story 4.4 requirement)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send transcription ready email to ${data.to}: ${errorMessage}`,
      );
    }
  }

  /**
   * Generate HTML template for password reset email
   * Story 1.5 - Task 5: Email Template
   *
   * @param resetUrl - Full URL with token
   * @returns HTML string
   */
  private getPasswordResetTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha - Ressoa AI</title>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F8FAFC;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0A2647; font-size: 28px; margin: 0; font-weight: 600;">Ressoa AI</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 5px;">Inteligência de Aula, Análise e Previsão de Conteúdo</p>
          </div>

          <h2 style="color: #0A2647; font-size: 20px; margin-bottom: 20px;">Recuperação de Senha</h2>

          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Você solicitou a redefinição de sua senha no <strong>Ressoa AI</strong>.
          </p>

          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Clique no botão abaixo para criar uma nova senha:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #2563EB; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500; transition: background-color 0.2s;">
              Redefinir Senha
            </a>
          </div>

          <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.5;">
              ⏱️ <strong>Atenção:</strong> Este link expira em <strong>1 hora</strong>.
            </p>
          </div>

          <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="color: #991B1B; font-size: 14px; margin: 0; line-height: 1.5;">
              🔒 <strong>Segurança:</strong> Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.
            </p>
          </div>

          <p style="color: #64748B; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            Caso o botão não funcione, copie e cole o link abaixo no seu navegador:
          </p>
          <p style="color: #2563EB; font-size: 12px; word-break: break-all; background-color: #F1F5F9; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>

          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 40px 0;">

          <p style="color: #94A3B8; font-size: 12px; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} Ressoa AI. Todos os direitos reservados.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML template for transcription ready email
   * Story 4.4 - Task 2: Email Template
   *
   * @param data - Email data
   * @param formattedDate - Formatted date string (DD/MM/YYYY)
   * @returns HTML string
   */
  private getTranscricaoProntaTemplate(
    data: TranscricaoProntaEmailData,
    formattedDate: string,
  ): string {
    const currentYear = new Date().getFullYear();
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transcrição Pronta - Ressoa AI</title>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F8FAFC;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0A2647; font-size: 28px; margin: 0; font-weight: 600;">Ressoa AI</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 5px;">Inteligência de Aula, Análise e Previsão de Conteúdo</p>
          </div>

          <h2 style="color: #0A2647; font-size: 20px; margin-bottom: 20px;">Transcrição Pronta! 🎉</h2>

          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Olá, <strong>${data.professorNome}</strong>!
          </p>

          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Sua aula de <strong>${data.turmaNome}</strong> (${formattedDate}) foi transcrita e está pronta para análise.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.link}" style="display: inline-block; background-color: #2563EB; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
              Ver Transcrição
            </a>
          </div>

          <div style="background-color: #EFF6FF; border-left: 4px solid #2563EB; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="color: #1E40AF; font-size: 14px; margin: 0; line-height: 1.5;">
              💡 <strong>Próximos passos:</strong> Revise a transcrição e aguarde a análise pedagógica automática.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 40px 0;">

          <p style="color: #94A3B8; font-size: 12px; text-align: center; margin: 0;">
            © ${currentYear} Ressoa AI. Todos os direitos reservados.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}
