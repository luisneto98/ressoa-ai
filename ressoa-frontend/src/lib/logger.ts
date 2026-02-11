/**
 * Simple structured logger for frontend
 * In production, this should integrate with Sentry
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In development, use console for better DX
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      consoleMethod(`[${level.toUpperCase()}]`, message, context || '');
    }

    // In production, send to Sentry (TODO: integrate Sentry SDK)
    if (!this.isDevelopment && level === 'error') {
      // window.Sentry?.captureException(new Error(message), { extra: context });
      console.error('PRODUCTION ERROR:', logEntry); // Fallback until Sentry is integrated
    }

    return logEntry;
  }

  info(message: string, context?: LogContext) {
    return this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    return this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    return this.log('error', message, context);
  }
}

export const logger = new Logger();
