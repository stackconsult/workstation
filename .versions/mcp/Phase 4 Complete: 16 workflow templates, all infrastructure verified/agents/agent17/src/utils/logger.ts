// Logger utility for Agent #17
// Structured logging with levels and metadata

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLogLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

export function log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLogLevel]) {
    return;
  }
  
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    metadata,
  };
  
  const color = getColor(level);
  const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
  
  if (metadata && Object.keys(metadata).length > 0) {
    console.log(color, `${prefix} ${message}`, metadata);
  } else {
    console.log(color, `${prefix} ${message}`);
  }
}

function getColor(level: LogLevel): string {
  const colors = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
  };
  return colors[level] || '';
}

/**
 * Create a logger instance with context
 */
export function createLogger(context: string) {
  return {
    info: (message: string, metadata?: Record<string, any>) => 
      log('info', `[${context}] ${message}`, metadata),
    warn: (message: string, metadata?: Record<string, any>) => 
      log('warn', `[${context}] ${message}`, metadata),
    error: (message: string, metadata?: Record<string, any>) => 
      log('error', `[${context}] ${message}`, metadata),
    debug: (message: string, metadata?: Record<string, any>) => 
      log('debug', `[${context}] ${message}`, metadata),
  };
}
