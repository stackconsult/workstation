import winston from "winston";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

/**
 * Ensure log directory exists before creating file transports
 */
function ensureLogDirectory(filepath: string): void {
  const dir = dirname(filepath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Configure Winston logger with appropriate formatting and transports
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: "stackBrowserAgent",
  },
  transports: [
    // Console transport with colorized output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

// In production, also log to file with proper directory setup
if (process.env.NODE_ENV === "production") {
  const errorLogPath = "logs/error.log";
  const combinedLogPath = "logs/combined.log";

  // Ensure log directory exists
  ensureLogDirectory(errorLogPath);

  logger.add(
    new winston.transports.File({
      filename: errorLogPath,
      level: "error",
    }),
  );
  logger.add(
    new winston.transports.File({
      filename: combinedLogPath,
    }),
  );
}
