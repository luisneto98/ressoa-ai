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

/**
 * Data structure for analysis ready email
 * Story 5.5 - Code Review Fix #8: Dedicated email template for analysis completion
 */
export interface AnaliseProntaEmailData {
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
   * Send analysis ready email to professor
   * Story 5.5 - Code Review Fix #8: Dedicated email template
   *
   * MEDIUM FIX: Prevents confusion by using dedicated template instead of reusing transcription email
   *
   * @param data - Email data (professor info, turma, link)
   * @returns Promise<void>
   */
  async sendAnaliseProntaEmail(data: AnaliseProntaEmailData): Promise<void> {
    const from = this.configService.get('EMAIL_FROM') || 'noreply@ressoa.ai';
    const formattedDate = new Date(data.aulaData).toLocaleDateString('pt-BR');

    const msg = {
      to: data.to,
      from,
      subject: 'Análise Pedagógica Pronta - Ressoa AI',
      html: this.getAnaliseProntaTemplate(data, formattedDate),
    };

    // PRODUCTION SAFETY: Mock emails in development
    if (this.isDevelopment || !this.emailEnabled) {
      this.logger.log(
        `[MOCK EMAIL] Analysis ready email to ${data.to}\nProfessor: ${data.professorNome}\nTurma: ${data.turmaNome}\nData: ${formattedDate}\nLink: ${data.link}`,
      );
      return;
    }

    try {
      await sgMail.send(msg);
      this.logger.log(
        `Analysis ready email sent successfully to ${data.to} (professor: ${data.professorNome})`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send analysis ready email to ${data.to}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send director invitation email with unique token
   * Story 13.2 - AC7: Email de convite com link de aceitação
   *
   * @param email - Director's email address
   * @param nome - Director's full name
   * @param escolaNome - School name
   * @param inviteToken - Secure invitation token (64 chars hex)
   * @returns Promise<void>
   */
  async sendDirectorInvitationEmail(
    email: string,
    nome: string,
    escolaNome: string,
    inviteToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const inviteUrl = `${frontendUrl}/aceitar-convite?token=${inviteToken}`;
    const from = this.configService.get('EMAIL_FROM') || 'noreply@ressoaai.com';

    const msg = {
      to: email,
      from,
      subject: `Você foi convidado como Diretor - ${escolaNome}`,
      html: this.getDirectorInvitationTemplate(nome, escolaNome, inviteUrl),
    };

    // PRODUCTION SAFETY: Mock emails in development
    if (this.isDevelopment || !this.emailEnabled) {
      this.logger.log(
        `[MOCK EMAIL] Director Invitation\nTo: ${email}\nSchool: ${escolaNome}\nToken: ${inviteToken}\nURL: ${inviteUrl}`,
      );
      return;
    }

    try {
      await sgMail.send(msg);
      this.logger.log(
        `Director invitation email sent to ${email} for school ${escolaNome}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      // Throw error so AdminService can log and handle gracefully
      throw new Error(`Failed to send director invitation email: ${errorMessage}`);
    }
  }

  /**
   * Send coordenador invitation email with unique token
   * Story 13.4 - AC6: Email de convite para coordenador
   *
   * @param params - Invitation data (to, nome, escola, token)
   * @returns Promise<void>
   */
  async sendCoordenadorInvitationEmail(params: {
    to: string;
    coordenadorNome: string;
    escolaNome: string;
    inviteToken: string;
  }): Promise<void> {
    const { to, coordenadorNome, escolaNome, inviteToken } = params;
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const inviteUrl = `${frontendUrl}/aceitar-convite?token=${inviteToken}`;
    const from = this.configService.get('EMAIL_FROM') || 'noreply@ressoaai.com';

    const msg = {
      to,
      from,
      subject: `Convite para Coordenador - ${escolaNome}`,
      html: this.getCoordenadorInvitationTemplate({
        coordenadorNome,
        escolaNome,
        inviteUrl,
      }),
    };

    // PRODUCTION SAFETY: Mock emails in development
    if (this.isDevelopment || !this.emailEnabled) {
      this.logger.log(
        `[MOCK EMAIL] Coordenador Invitation\nTo: ${to}\nSchool: ${escolaNome}\nToken: ${inviteToken}\nURL: ${inviteUrl}`,
      );
      return;
    }

    try {
      await sgMail.send(msg);
      this.logger.log(
        `Coordenador invitation email sent to ${to} for school ${escolaNome}`,
      );
    } catch (error: unknown) {
      // HIGH-3 FIX: Graceful degradation - DO NOT throw error
      // Token remains valid in Redis even if email fails
      this.logger.error('Failed to send coordenador invitation email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        to,
      });
      // Do NOT throw - graceful degradation
    }
  }

  /**
   * Send professor invitation email with unique token
   * Story 13.5 - AC6: Email de convite para professor
   *
   * @param params - Invitation data (to, nome, escola, disciplina, token)
   * @returns Promise<void>
   */
  async sendProfessorInvitationEmail(params: {
    to: string;
    professorNome: string;
    escolaNome: string;
    disciplina: string;
    inviteToken: string;
  }): Promise<void> {
    const { to, professorNome, escolaNome, disciplina, inviteToken } = params;

    if (this.isDevelopment || !this.emailEnabled) {
      this.logger.log(
        `[MOCK EMAIL] Professor invitation sent to ${to} | Token: ${inviteToken}`,
      );
      return;
    }

    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/aceitar-convite?token=${inviteToken}`;

    const disciplinaLabel =
      {
        MATEMATICA: 'Matemática',
        LINGUA_PORTUGUESA: 'Língua Portuguesa',
        CIENCIAS: 'Ciências',
      }[disciplina] || disciplina;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Inter, sans-serif; background-color: #F8FAFC; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-family: Montserrat, sans-serif; font-size: 28px; font-weight: 700; color: #0A2647; }
          .gradient-text { background: linear-gradient(135deg, #2563EB, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .content { color: #334155; line-height: 1.6; }
          .cta-button { display: inline-block; background: #2563EB; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 24px 0; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E2E8F0; color: #64748B; font-size: 14px; }
          .info-box { background: #F1F5F9; padding: 16px; border-radius: 6px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Ressoa<span class="gradient-text">AI</span></div>
            <p style="color: #64748B; margin-top: 8px;">Inteligência de Aula, Análise e Previsão de Conteúdo</p>
          </div>

          <div class="content">
            <h2 style="color: #0A2647;">Olá, ${professorNome}!</h2>

            <p>Você foi convidado(a) para fazer parte do <strong>${escolaNome}</strong> como Professor(a) de <strong>${disciplinaLabel}</strong> na plataforma Ressoa AI.</p>

            <div class="info-box">
              <p style="margin: 0;"><strong>Escola:</strong> ${escolaNome}</p>
              <p style="margin: 8px 0 0 0;"><strong>Disciplina Principal:</strong> ${disciplinaLabel}</p>
            </div>

            <p>Para aceitar o convite e criar sua senha de acesso, clique no botão abaixo:</p>

            <div style="text-align: center;">
              <a href="${inviteLink}" class="cta-button">Aceitar Convite e Criar Senha</a>
            </div>

            <p style="font-size: 14px; color: #64748B;">
              ⏱️ Este link é válido por <strong>24 horas</strong> e pode ser usado apenas uma vez.
            </p>

            <p style="font-size: 14px; color: #64748B;">
              Se você não conseguir clicar no botão, copie e cole o link abaixo no seu navegador:
              <br>
              <code style="background: #F1F5F9; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 8px;">${inviteLink}</code>
            </p>
          </div>

          <div class="footer">
            <p>Se você não esperava este convite, por favor ignore este email.</p>
            <p style="margin-top: 8px;">© 2026 Ressoa AI - Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sgMail.send({
        to,
        from: this.configService.get('EMAIL_FROM') || 'noreply@ressoaai.com',
        subject: `Convite para Professor - ${escolaNome}`,
        html: htmlContent,
      });

      this.logger.log(`Professor invitation email sent to ${to}`);
    } catch (error) {
      // HIGH-3 FIX: Graceful degradation - DO NOT throw error
      // Token remains valid in Redis even if email fails (AC7)
      this.logger.error(
        'Failed to send professor invitation email via SendGrid',
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          to,
        },
      );
      // Do NOT throw - graceful degradation per AC7
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

  /**
   * Generate HTML template for analysis ready email
   * Story 5.5 - Code Review Fix #8: Dedicated template
   *
   * @param data - Email data
   * @param formattedDate - Formatted date string (DD/MM/YYYY)
   * @returns HTML string
   */
  private getAnaliseProntaTemplate(
    data: AnaliseProntaEmailData,
    formattedDate: string,
  ): string {
    const currentYear = new Date().getFullYear();
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Análise Pronta - Ressoa AI</title>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F8FAFC;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0A2647; font-size: 28px; margin: 0; font-weight: 600;">Ressoa AI</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 5px;">Inteligência de Aula, Análise e Previsão de Conteúdo</p>
          </div>

          <h2 style="color: #0A2647; font-size: 20px; margin-bottom: 20px;">Análise Pedagógica Pronta! 🎓</h2>

          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Olá, <strong>${data.professorNome}</strong>!
          </p>

          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Sua aula de <strong>${data.turmaNome}</strong> (${formattedDate}) foi analisada e está pronta para revisão.
          </p>

          <div style="background-color: #EFF6FF; border-left: 4px solid #2563EB; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #1E40AF; font-size: 14px; margin: 0 0 10px 0; line-height: 1.5;">
              <strong>📊 O que você encontrará:</strong>
            </p>
            <ul style="color: #1E40AF; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Cobertura de habilidades da BNCC</li>
              <li>Relatório pedagógico completo</li>
              <li>Exercícios contextualizados</li>
              <li>Alertas e sugestões para próxima aula</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.link}" style="display: inline-block; background-color: #2563EB; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
              Ver Análise Completa
            </a>
          </div>

          <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.5;">
              💡 <strong>Lembre-se:</strong> Você pode editar o relatório e os exercícios antes de aprovar.
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

  /**
   * Generate HTML template for director invitation email
   * Story 13.2 - Task 3: Email Template
   *
   * @param nome - Director's full name
   * @param escolaNome - School name
   * @param inviteUrl - Full invitation URL with token
   * @returns HTML string
   */
  private getDirectorInvitationTemplate(
    nome: string,
    escolaNome: string,
    inviteUrl: string,
  ): string {
    const currentYear = new Date().getFullYear();
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Convite para Diretor - Ressoa AI</title>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F8FAFC;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0A2647; font-size: 28px; margin: 0; font-weight: 600;">Ressoa AI</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 5px;">Inteligência de Aula, Análise e Previsão de Conteúdo</p>
          </div>

          <h2 style="color: #0A2647; font-size: 20px; margin-bottom: 20px;">Bem-vindo ao Ressoa AI!</h2>

          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Olá, <strong>${nome}</strong>!
          </p>

          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Você foi convidado para ser <strong>Diretor</strong> da escola <strong>${escolaNome}</strong> na plataforma Ressoa AI.
          </p>

          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Clique no botão abaixo para aceitar o convite e criar sua senha de acesso:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="display: inline-block; background-color: #2563EB; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500; transition: background-color 0.2s;">
              Aceitar Convite
            </a>
          </div>

          <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="color: #92400E; font-size: 14px; margin: 0 0 10px 0; line-height: 1.5;">
              ⏱️ <strong>Validade:</strong> Este convite expira em <strong>24 horas</strong>.
            </p>
            <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.5;">
              Se o link não funcionar, copie e cole o seguinte endereço no navegador:
            </p>
          </div>

          <p style="color: #2563EB; font-size: 12px; word-break: break-all; background-color: #F1F5F9; padding: 10px; border-radius: 4px; margin-bottom: 30px;">
            ${inviteUrl}
          </p>

          <div style="background-color: #DBEAFE; border-left: 4px solid #2563EB; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="color: #1E40AF; font-size: 14px; margin: 0; line-height: 1.5;">
              💡 <strong>Instruções:</strong> Após aceitar o convite, você poderá criar sua senha e acessar a plataforma para gerenciar sua escola.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 40px 0;">

          <p style="color: #94A3B8; font-size: 12px; text-align: center; margin: 0;">
            Se você não solicitou este convite, ignore este email.
          </p>

          <p style="color: #94A3B8; font-size: 12px; text-align: center; margin: 15px 0 0 0;">
            © ${currentYear} Ressoa AI. Todos os direitos reservados.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML template for coordenador invitation email
   * Story 13.4 - Task 4.2: Email Template
   *
   * @param params - Template parameters (nome, escola, URL)
   * @returns HTML string
   */
  private getCoordenadorInvitationTemplate(params: {
    coordenadorNome: string;
    escolaNome: string;
    inviteUrl: string;
  }): string {
    const currentYear = new Date().getFullYear();
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Convite para Coordenador - Ressoa AI</title>
        <style>
          body { font-family: Inter, sans-serif; background-color: #F8FAFC; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; }
          .logo { color: #0A2647; font-size: 24px; font-weight: 700; margin-bottom: 20px; }
          h1 { color: #0A2647; font-size: 20px; margin-bottom: 16px; }
          p { color: #475569; line-height: 1.6; margin-bottom: 16px; }
          .cta-button {
            display: inline-block;
            background: #2563EB;
            color: white !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; }
          .footer { color: #94A3B8; font-size: 12px; margin-top: 32px; border-top: 1px solid #E2E8F0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Ressoa AI</div>
          <h1>Olá, ${params.coordenadorNome}!</h1>
          <p>Você foi convidado(a) para ser <strong>Coordenador(a)</strong> da escola <strong>${params.escolaNome}</strong> na plataforma Ressoa AI.</p>
          <p>Clique no botão abaixo para aceitar o convite e criar sua senha de acesso:</p>
          <a href="${params.inviteUrl}" class="cta-button">Aceitar Convite e Criar Senha</a>
          <div class="warning">
            <strong>⚠️ Atenção:</strong> Este link é válido por <strong>24 horas</strong> e pode ser usado apenas uma vez.
          </div>
          <p>Se você não solicitou este convite, pode ignorar este email.</p>
          <div class="footer">
            <p>Ressoa AI - Inteligência de Aula, Análise e Previsão de Conteúdo<br>
            Este é um email automático, não responda.</p>
            <p>© ${currentYear} Ressoa AI. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
