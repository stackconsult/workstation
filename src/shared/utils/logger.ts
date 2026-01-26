/**
 * Shared Logger Utility
 *
 * Provides structured logging with levels, metadata, and context for all agents.
 * Used across the Workstation ecosystem for consistent logging.
 *
 * @module shared/utils/logger
 * @version 1.0.0
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  metadata?: Record<string, any>;
}

export interface LoggerOptions {
  level?: LogLevel;
  context?: string;
  enableColors?: boolean;
  enableTimestamp?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS = {
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m", // Green
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  reset: "\x1b[0m", // Reset
};

class Logger {
  private level: LogLevel;
  private context: string;
  private enableColors: boolean;
  private enableTimestamp: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || (process.env.LOG_LEVEL as LogLevel) || "info";
    this.context = options.context || "default";
    this.enableColors = options.enableColors !== false;
    this.enableTimestamp = options.enableTimestamp !== false;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ): string {
    const parts: string[] = [];

    if (this.enableTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(`[${level.toUpperCase()}]`);

    if (this.context) {
      parts.push(`[${this.context}]`);
    }

    parts.push(message);

    let formatted = parts.join(" ");

    if (metadata && Object.keys(metadata).length > 0) {
      formatted += ` ${JSON.stringify(metadata)}`;
    }

    return formatted;
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, metadata);
    const color = this.enableColors ? COLORS[level] : "";
    const reset = this.enableColors ? COLORS.reset : "";

    const output = `${color}${formatted}${reset}`;

    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.log("error", message, metadata);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: string): Logger {
    return new Logger({
      level: this.level,
      context: `${this.context}:${context}`,
      enableColors: this.enableColors,
      enableTimestamp: this.enableTimestamp,
    });
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

/**
 * Create a logger instance
 */
export function createLogger(
  context: string,
  options?: Omit<LoggerOptions, "context">,
): Logger {
  return new Logger({ ...options, context });
}

/**
 * Default logger instance
 */
export const logger = new Logger({ context: "workstation" });

/**
 * Simple logging functions (backwards compatible)
 */
export function log(
  level: LogLevel,
  message: string,
  metadata?: Record<string, any>,
): void {
  logger[level](message, metadata);
}

export { Logger };
