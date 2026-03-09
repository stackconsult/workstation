/**
 * Downloads Routes
 * API endpoints for serving build artifacts (Chrome Extension, Workflow Builder)
 *
 * Features:
 * - File download endpoints with proper headers
 * - Rate limiting to prevent abuse
 * - Download analytics logging
 * - Manifest endpoint for version information
 * - Health check endpoint
 */

import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { join } from "path";
import { existsSync, statSync, createReadStream } from "fs";
import { createHash } from "crypto";
import { logger } from "../utils/logger";

const router = Router();

// Downloads directory path
const DOWNLOADS_DIR = join(__dirname, "../../public/downloads");

// Whitelist of allowed download files
const ALLOWED_FILES = [
  "chrome-extension.zip",
  "workflow-builder.zip",
  "manifest.json",
];

// Rate limiter for downloads - 20 requests per 15 minutes
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 download requests per windowMs
  message: {
    success: false,
    error: "Too many download requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful responses from being counted against the limit
  skipSuccessfulRequests: false,
  // Skip failed requests from being counted
  skipFailedRequests: true,
});

/**
 * Get MIME type for file
 */
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    zip: "application/zip",
    json: "application/json",
    txt: "text/plain",
    md: "text/markdown",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}

/**
 * Anonymize IP address for privacy
 */
function anonymizeIp(ip: string | undefined): string {
  if (!ip) return "unknown";
  const hash = createHash("sha256").update(ip).digest("hex");
  return hash.substring(0, 16);
}

/**
 * Health check endpoint
 * GET /downloads/health
 */
router.get("/health", (_req: Request, res: Response) => {
  try {
    // Check if downloads directory exists
    const downloadsExist = existsSync(DOWNLOADS_DIR);

    // Check for required files
    const filesStatus = ALLOWED_FILES.map((filename) => {
      const filePath = join(DOWNLOADS_DIR, filename);
      return {
        name: filename,
        exists: existsSync(filePath),
        size: existsSync(filePath) ? statSync(filePath).size : 0,
      };
    });

    const allFilesExist = filesStatus.every((f) => f.exists);

    res.json({
      success: true,
      status: allFilesExist ? "healthy" : "degraded",
      downloadsDirectory: downloadsExist,
      files: filesStatus,
      timestamp: new Date().toISOString(),
    });

    logger.info("Downloads health check", {
      status: allFilesExist ? "healthy" : "degraded",
      filesCount: filesStatus.filter((f) => f.exists).length,
    });
  } catch (error) {
    logger.error("Downloads health check error:", error);
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Download file endpoint
 * GET /downloads/:filename
 *
 * Serves whitelisted files with proper headers and analytics
 */
router.get("/:filename", downloadLimiter, (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    // Validate filename is in whitelist
    if (!ALLOWED_FILES.includes(filename)) {
      logger.warn("Download attempt for non-whitelisted file", {
        filename,
        ip: anonymizeIp(req.ip),
      });
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    // Construct file path
    const filePath = join(DOWNLOADS_DIR, filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      logger.error("Download file not found", {
        filename,
        path: filePath,
      });
      return res.status(404).json({
        success: false,
        error: "File not found. Please ensure builds have been generated.",
      });
    }

    // Get file stats
    const stats = statSync(filePath);
    const fileSize = stats.size;

    // Set appropriate headers
    const mimeType = getMimeType(filename);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", fileSize);

    // For zip files, set Content-Disposition to trigger download
    if (filename.endsWith(".zip")) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
    }

    // Cache control headers
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.setHeader("ETag", `"${stats.mtime.getTime()}-${fileSize}"`);

    // Log download analytics
    logger.info("File download", {
      filename,
      size: fileSize,
      sizeFormatted: `${(fileSize / 1024).toFixed(2)} KB`,
      ip: anonymizeIp(req.ip),
      userAgent: req.get("User-Agent")?.substring(0, 100) || "unknown",
      timestamp: new Date().toISOString(),
    });

    // Stream file to client
    const fileStream = createReadStream(filePath);

    fileStream.on("error", (error) => {
      logger.error("File stream error", { filename, error });
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Error streaming file",
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    logger.error("Download error:", error);

    // Only send response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
});

export default router;
