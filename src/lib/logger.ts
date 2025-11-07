// Secure error logging utility
// Logs detailed errors server-side only, shows generic messages to users

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private sanitizeError(error: any): string {
    // In production, return generic message
    if (!this.isDevelopment) {
      return 'Ocorreu um erro. Tente novamente.';
    }

    // In development, show details
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  private logToService(level: LogLevel, message: string, context?: LogContext, error?: any) {
    // In production, this would send to a logging service like Sentry or LogRocket
    // For now, we only log in development
    if (this.isDevelopment) {
      const logData = {
        level,
        message,
        timestamp: new Date().toISOString(),
        context,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : undefined,
      };

      switch (level) {
        case 'error':
          console.error('[Logger]', logData);
          break;
        case 'warn':
          console.warn('[Logger]', logData);
          break;
        default:
          console.log('[Logger]', logData);
      }
    }
  }

  info(message: string, context?: LogContext) {
    this.logToService('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.logToService('warn', message, context);
  }

  error(message: string, error?: any, context?: LogContext) {
    this.logToService('error', message, context, error);
  }

  // Get user-friendly error message
  getUserMessage(error: any): string {
    return this.sanitizeError(error);
  }
}

export const logger = new Logger();
