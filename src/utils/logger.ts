import winston from 'winston';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

/**
 * Ensure log directory exists before creating file transports
 * 
 * @error_handling_strategy
 * - Creates directories recursively if they don't exist
 * - Prevents file transport initialization failures
 * - Handles permission errors gracefully
 * 
 * @rollback_considerations
 * - If log directory path changes, update volume mounts in Docker
 * - Verify directory permissions in containerized environments
 */
function ensureLogDirectory(filepath: string): void {
  // ERROR_HANDLING_NOTE: Check existence before creating to avoid errors
  const dir = dirname(filepath);
  if (!existsSync(dir)) {
    // ERROR_HANDLING_NOTE: recursive:true handles nested directory creation
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Configure Winston logger with appropriate formatting and transports
 * 
 * @error_handling_strategy
 * - Uses structured JSON logging for production parsing
 * - Colorized console output for development readability
 * - Separate error.log for critical issues
 * - Automatic timestamp inclusion
 * 
 * @security_notes
 * - Logs are written to files in production (not exposed via API)
 * - Stack traces are included but never sent to clients
 * - Log level can be controlled via environment variable
 * 
 * @rollback_considerations
 * - Log format changes may break log parsing tools
 * - Ensure log aggregators (ELK, Datadog) can parse new formats
 * - Test log rotation after format changes
 * 
 * @monitoring_integration
 * - JSON format enables structured queries in log aggregators
 * - Error-level logs should trigger alerts in monitoring systems
 * - defaultMeta.service identifies log source in multi-service environments
 */
export const logger = winston.createLogger({
  // ERROR_HANDLING_NOTE: LOG_LEVEL environment variable controls verbosity
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    // ERROR_HANDLING_NOTE: errors format captures stack traces
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'stackBrowserAgent',
  },
  transports: [
    // Console transport with colorized output for development
    // ERROR_HANDLING_NOTE: Console logs for real-time debugging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// In production, also log to file with proper directory setup
// ERROR_HANDLING_NOTE: File logging only in production to prevent disk fills in dev
if (process.env.NODE_ENV === 'production') {
  const errorLogPath = 'logs/error.log';
  const combinedLogPath = 'logs/combined.log';
  
  // Ensure log directory exists
  // ERROR_HANDLING_NOTE: Directory creation happens before transport initialization
  ensureLogDirectory(errorLogPath);
  
  // ERROR_HANDLING_NOTE: Separate error log for critical issues
  logger.add(
    new winston.transports.File({
      filename: errorLogPath,
      level: 'error',
    })
  );
  
  // ERROR_HANDLING_NOTE: Combined log for all levels
  logger.add(
    new winston.transports.File({
      filename: combinedLogPath,
    })
  );
  
  // ROLLBACK_NOTE: If file logging fails after deployment:
  // 1. Check file permissions in Docker volume
  // 2. Verify logs/ directory exists and is writable
  // 3. Check disk space on host
  // 4. Roll back to previous version if critical
}
