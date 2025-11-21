/**
 * File Agent for workspace file operations
 * Handles local, S3, and other storage systems
 * Phase 10: Workspace Automation
 */

import { logger } from "../../../utils/logger";
import fs from "fs/promises";
import path from "path";

export interface FileConfig {
  storageType: "local" | "s3" | "gcs" | "azure";
  basePath?: string;
  s3Config?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
  };
  gcsConfig?: {
    projectId: string;
    keyFilename: string;
    bucket: string;
  };
  azureConfig?: {
    accountName: string;
    accountKey: string;
    containerName: string;
  };
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
}

/**
 * File Agent Implementation
 */
export class FileAgent {
  private s3Client: any = null;
  private gcsClient: any = null;
  private azureClient: any = null;

  constructor(private config: FileConfig) {
    this.initializeClients();
  }

  /**
   * Initialize cloud storage clients if needed
   */
  private initializeClients(): void {
    if (this.config.storageType === "s3" && this.config.s3Config) {
      // Placeholder for S3 client initialization
      // Production would use @aws-sdk/client-s3
      this.s3Client = {
        config: this.config.s3Config,
      };
    } else if (this.config.storageType === "gcs" && this.config.gcsConfig) {
      // Placeholder for GCS client initialization
      // Production would use @google-cloud/storage
      this.gcsClient = {
        config: this.config.gcsConfig,
      };
    } else if (this.config.storageType === "azure" && this.config.azureConfig) {
      // Placeholder for Azure client initialization
      // Production would use @azure/storage-blob
      this.azureClient = {
        config: this.config.azureConfig,
      };
    }
  }

  /**
   * Read file from storage
   */
  async readFile(params: {
    path: string;
    encoding?: "utf-8" | "base64" | null;
  }): Promise<string | Buffer> {
    logger.info("Reading file", {
      path: params.path,
      storageType: this.config.storageType,
    });

    if (this.config.storageType === "local") {
      const fullPath = path.join(this.config.basePath || "", params.path);
      const content = await fs.readFile(
        fullPath,
        params.encoding
          ? { encoding: params.encoding as "utf-8" | "base64" }
          : undefined,
      );
      return content;
    } else if (this.config.storageType === "s3" && this.s3Client) {
      // Placeholder for S3 read
      // Production would use GetObjectCommand
      throw new Error("S3 read not implemented in demo version");
    }

    throw new Error(`Unsupported storage type: ${this.config.storageType}`);
  }

  /**
   * Write file to storage
   */
  async writeFile(params: {
    path: string;
    content: string | Buffer;
    encoding?: "utf-8" | "base64";
  }): Promise<void> {
    logger.info("Writing file", {
      path: params.path,
      storageType: this.config.storageType,
    });

    if (this.config.storageType === "local") {
      const fullPath = path.join(this.config.basePath || "", params.path);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(
        fullPath,
        params.content,
        params.encoding
          ? { encoding: params.encoding as "utf-8" | "base64" }
          : undefined,
      );
      logger.info("File written successfully", { path: params.path });
    } else if (this.config.storageType === "s3" && this.s3Client) {
      // Placeholder for S3 write
      throw new Error("S3 write not implemented in demo version");
    } else {
      throw new Error(`Unsupported storage type: ${this.config.storageType}`);
    }
  }

  /**
   * List files in directory
   */
  async listFiles(params: {
    path: string;
    recursive?: boolean;
  }): Promise<FileInfo[]> {
    logger.info("Listing files", {
      path: params.path,
      recursive: params.recursive,
    });

    if (this.config.storageType === "local") {
      const fullPath = path.join(this.config.basePath || "", params.path);
      const files: FileInfo[] = [];

      const processDirectory = async (
        dirPath: string,
        basePath: string,
      ): Promise<void> => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry.name);
          const relativePath = path.relative(basePath, entryPath);
          const stats = await fs.stat(entryPath);

          files.push({
            name: entry.name,
            path: relativePath,
            size: stats.size,
            lastModified: stats.mtime,
            isDirectory: entry.isDirectory(),
          });

          if (params.recursive && entry.isDirectory()) {
            await processDirectory(entryPath, basePath);
          }
        }
      };

      try {
        await processDirectory(fullPath, this.config.basePath || "");
        return files;
      } catch (error) {
        logger.error("Error listing files", { error });
        throw error;
      }
    }

    throw new Error(`Unsupported storage type: ${this.config.storageType}`);
  }

  /**
   * Create directory
   */
  async createDirectory(params: { path: string }): Promise<void> {
    logger.info("Creating directory", { path: params.path });

    if (this.config.storageType === "local") {
      const fullPath = path.join(this.config.basePath || "", params.path);
      await fs.mkdir(fullPath, { recursive: true });
      logger.info("Directory created successfully", { path: params.path });
    } else {
      throw new Error(`Unsupported storage type: ${this.config.storageType}`);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(params: { path: string }): Promise<void> {
    logger.info("Deleting file", { path: params.path });

    if (this.config.storageType === "local") {
      const fullPath = path.join(this.config.basePath || "", params.path);
      await fs.unlink(fullPath);
      logger.info("File deleted successfully", { path: params.path });
    } else {
      throw new Error(`Unsupported storage type: ${this.config.storageType}`);
    }
  }

  /**
   * Move file
   */
  async moveFile(params: { fromPath: string; toPath: string }): Promise<void> {
    logger.info("Moving file", { from: params.fromPath, to: params.toPath });

    if (this.config.storageType === "local") {
      const fromFullPath = path.join(
        this.config.basePath || "",
        params.fromPath,
      );
      const toFullPath = path.join(this.config.basePath || "", params.toPath);

      // Ensure target directory exists
      await fs.mkdir(path.dirname(toFullPath), { recursive: true });
      await fs.rename(fromFullPath, toFullPath);

      logger.info("File moved successfully", {
        from: params.fromPath,
        to: params.toPath,
      });
    } else {
      throw new Error(`Unsupported storage type: ${this.config.storageType}`);
    }
  }

  /**
   * Copy file
   */
  async copyFile(params: { fromPath: string; toPath: string }): Promise<void> {
    logger.info("Copying file", { from: params.fromPath, to: params.toPath });

    if (this.config.storageType === "local") {
      const fromFullPath = path.join(
        this.config.basePath || "",
        params.fromPath,
      );
      const toFullPath = path.join(this.config.basePath || "", params.toPath);

      // Ensure target directory exists
      await fs.mkdir(path.dirname(toFullPath), { recursive: true });
      await fs.copyFile(fromFullPath, toFullPath);

      logger.info("File copied successfully", {
        from: params.fromPath,
        to: params.toPath,
      });
    } else {
      throw new Error(`Unsupported storage type: ${this.config.storageType}`);
    }
  }

  /**
   * Search files by name or extension
   */
  async searchFiles(params: {
    path: string;
    query: string;
    extension?: string;
  }): Promise<Array<{ path: string; score: number }>> {
    logger.info("Searching files", params);

    if (this.config.storageType === "local") {
      const files = await this.listFiles({
        path: params.path,
        recursive: true,
      });
      const results: Array<{ path: string; score: number }> = [];

      for (const file of files) {
        if (file.isDirectory) continue;

        let score = 0;

        // Check extension match
        if (params.extension) {
          if (file.name.endsWith(params.extension)) {
            score += 0.5;
          } else {
            continue; // Skip if extension doesn't match
          }
        }

        // Check query match
        const queryLower = params.query.toLowerCase();
        const nameLower = file.name.toLowerCase();

        if (nameLower.includes(queryLower)) {
          score += 0.5;

          // Boost exact matches
          if (nameLower === queryLower) {
            score += 0.3;
          }

          // Boost starts-with matches
          if (nameLower.startsWith(queryLower)) {
            score += 0.2;
          }
        }

        if (score > 0) {
          results.push({
            path: file.path,
            score: Math.min(score, 1.0),
          });
        }
      }

      // Sort by score descending
      results.sort((a, b) => b.score - a.score);

      return results;
    }

    throw new Error(`Unsupported storage type: ${this.config.storageType}`);
  }
}
