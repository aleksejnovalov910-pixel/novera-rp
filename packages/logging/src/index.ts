export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Record<string, unknown>;

const weight: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export class Logger {
  constructor(private readonly scope: string, private readonly minimum: LogLevel = 'info') {}

  child(scope: string): Logger { return new Logger(`${this.scope}:${scope}`, this.minimum); }
  debug(message: string, context: LogContext = {}): void { this.write('debug', message, context); }
  info(message: string, context: LogContext = {}): void { this.write('info', message, context); }
  warn(message: string, context: LogContext = {}): void { this.write('warn', message, context); }
  error(message: string, context: LogContext = {}): void { this.write('error', message, context); }

  private write(level: LogLevel, message: string, context: LogContext): void {
    if (weight[level] < weight[this.minimum]) return;
    const payload = { timestamp: new Date().toISOString(), level, scope: this.scope, message, ...context };
    const line = JSON.stringify(payload);
    if (level === 'error') console.error(line); else if (level === 'warn') console.warn(line); else console.log(line);
  }
}
