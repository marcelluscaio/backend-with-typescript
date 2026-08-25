type LogLevel = 'info' | 'warn' | 'error';

export class LoggerService {
  private write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    // eslint-disable-next-line no-console
    console[level === 'info' ? 'log' : level](JSON.stringify(entry));
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write('error', message, meta);
  }
}

export const logger = new LoggerService();
