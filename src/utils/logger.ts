/**
 * Logger Utility
 * Structured logging for the application
 */

import pino from 'pino';

/**
 * Logger levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Log level */
  level: LogLevel;
  /** Enable pretty print */
  pretty: boolean;
  /** Application name */
  name: string;
}

/**
 * Default logger configuration
 */
export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  pretty: true,
  name: 'lark-task-reminder',
};

/**
 * Create a logger instance
 */
export function createLogger(config: Partial<LoggerConfig> = {}): pino.Logger {
  const finalConfig = { ...DEFAULT_LOGGER_CONFIG, ...config };

  if (finalConfig.pretty) {
    return pino({
      name: finalConfig.name,
      level: finalConfig.level,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino({
    name: finalConfig.name,
    level: finalConfig.level,
  });
}

/**
 * Default logger instance
 */
export const logger = createLogger();