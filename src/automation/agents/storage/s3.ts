/**
 * S3 Agent for workflow automation
 * Handles S3 and S3-compatible cloud storage operations
 * Phase 10: Storage Agents
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2CommandOutput,
  HeadObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "../../../utils/logger";
import fs from "fs/promises";
import path from "path";
import { Readable } from "stream";

export interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint?: string; // For S3-compatible services (MinIO, DigitalOcean Spaces)
  forcePathStyle?: boolean; // Required for some S3-compatible services
}

export interface UploadParams {
  key: string;
  content: Buffer | string | Readable;
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: "private" | "public-read" | "public-read-write" | "authenticated-read";
}

export interface DownloadParams {
  key: string;
  savePath?: string; // If provided, saves to file; otherwise returns buffer
}

export interface ListParams {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface DeleteParams {
  key: string;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface CopyParams {
  sourceKey: string;
  destinationKey: string;
  sourceBucket?: string; // If copying from different bucket
  metadata?: Record<string, string>;
  metadataDirective?: "COPY" | "REPLACE";
}

export interface MoveParams {
  sourceKey: string;
  destinationKey: string;
}

export interface PresignedUrlParams {
  key: string;
  expiresIn?: number; // Seconds, default 3600 (1 hour)
  operation?: "getObject" | "putObject";
}

/**
 * S3 Agent Implementation
 * Provides comprehensive S3/cloud storage operations
 */
export class S3Agent {
  private client: S3Client;
  private config: S3Config;

  constructor(config: S3Config) {
    this.config = config;

    // Initialize S3 client with configuration
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle || false,
    });

    logger.info("S3 Agent initialized", {
      region: config.region,
      bucket: config.bucket,
      endpoint: config.endpoint || "AWS S3",
    });
  }

  /**
   * Upload file to S3 bucket
   */
  async uploadFile(params: UploadParams): Promise<{
    success: boolean;
    key: string;
    etag?: string;
    location: string;
  }> {
    logger.info("Uploading file to S3", {
      key: params.key,
      bucket: this.config.bucket,
    });

    try {
      let body: Buffer | Readable;

      if (typeof params.content === "string") {
        body = Buffer.from(params.content, "utf-8");
      } else {
        body = params.content;
      }

      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: params.key,
        Body: body,
        ContentType: params.contentType || "application/octet-stream",
        Metadata: params.metadata,
        ACL: params.acl || "private",
      });

      const response = await this.client.send(command);

      const location = this.config.endpoint
        ? `${this.config.endpoint}/${this.config.bucket}/${params.key}`
        : `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${params.key}`;

      logger.info("File uploaded successfully", { key: params.key });

      return {
        success: true,
        key: params.key,
        etag: response.ETag,
        location,
      };
    } catch (error) {
      logger.error("File upload failed", { error, key: params.key });
      throw error;
    }
  }

  /**
   * Download file from S3
   */
  async downloadFile(params: DownloadParams): Promise<{
    success: boolean;
    data?: Buffer;
    savedPath?: string;
    metadata?: Record<string, string>;
  }> {
    logger.info("Downloading file from S3", {
      key: params.key,
      bucket: this.config.bucket,
    });

    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: params.key,
      });

      const response: GetObjectCommandOutput = await this.client.send(command);

      if (!response.Body) {
        throw new Error("No data received from S3");
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as Readable) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Save to file if path provided
      if (params.savePath) {
        await fs.mkdir(path.dirname(params.savePath), { recursive: true });
        await fs.writeFile(params.savePath, buffer);

        logger.info("File downloaded and saved", {
          key: params.key,
          path: params.savePath,
        });

        return {
          success: true,
          savedPath: params.savePath,
          metadata: response.Metadata,
        };
      }

      logger.info("File downloaded to buffer", { key: params.key });

      return {
        success: true,
        data: buffer,
        metadata: response.Metadata,
      };
    } catch (error) {
      logger.error("File download failed", { error, key: params.key });
      throw error;
    }
  }

  /**
   * List files in bucket with optional prefix filtering
   */
  async listFiles(params: ListParams = {}): Promise<{
    files: Array<{
      key: string;
      size: number;
      lastModified: Date;
      etag: string;
    }>;
    isTruncated: boolean;
    nextContinuationToken?: string;
    count: number;
  }> {
    logger.info("Listing files in S3", {
      bucket: this.config.bucket,
      prefix: params.prefix,
    });

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: params.prefix,
        MaxKeys: params.maxKeys || 1000,
        ContinuationToken: params.continuationToken,
      });

      const response: ListObjectsV2CommandOutput =
        await this.client.send(command);

      const files = (response.Contents || []).map((item) => ({
        key: item.Key || "",
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        etag: item.ETag || "",
      }));

      logger.info("Files listed successfully", {
        count: files.length,
        isTruncated: response.IsTruncated,
      });

      return {
        files,
        isTruncated: response.IsTruncated || false,
        nextContinuationToken: response.NextContinuationToken,
        count: files.length,
      };
    } catch (error) {
      logger.error("List files failed", { error });
      throw error;
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(params: DeleteParams): Promise<{
    success: boolean;
    key: string;
  }> {
    logger.info("Deleting file from S3", {
      key: params.key,
      bucket: this.config.bucket,
    });

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: params.key,
      });

      await this.client.send(command);

      logger.info("File deleted successfully", { key: params.key });

      return {
        success: true,
        key: params.key,
      };
    } catch (error) {
      logger.error("File deletion failed", { error, key: params.key });
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(params: { key: string }): Promise<FileInfo> {
    logger.info("Getting file info from S3", {
      key: params.key,
      bucket: this.config.bucket,
    });

    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: params.key,
      });

      const response: HeadObjectCommandOutput = await this.client.send(command);

      const fileInfo: FileInfo = {
        key: params.key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || "",
        contentType: response.ContentType,
        metadata: response.Metadata,
      };

      logger.info("File info retrieved", {
        key: params.key,
        size: fileInfo.size,
      });

      return fileInfo;
    } catch (error) {
      logger.error("Get file info failed", { error, key: params.key });
      throw error;
    }
  }

  /**
   * Generate presigned URL for temporary access
   */
  async generatePresignedUrl(params: PresignedUrlParams): Promise<{
    url: string;
    expiresIn: number;
  }> {
    logger.info("Generating presigned URL", {
      key: params.key,
      operation: params.operation || "getObject",
    });

    try {
      const expiresIn = params.expiresIn || 3600; // Default 1 hour

      let command;
      if (params.operation === "putObject") {
        command = new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: params.key,
        });
      } else {
        command = new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: params.key,
        });
      }

      const url = await getSignedUrl(this.client, command, { expiresIn });

      logger.info("Presigned URL generated", {
        key: params.key,
        expiresIn,
      });

      return {
        url,
        expiresIn,
      };
    } catch (error) {
      logger.error("Presigned URL generation failed", {
        error,
        key: params.key,
      });
      throw error;
    }
  }

  /**
   * Copy file within bucket or from another bucket
   */
  async copyFile(params: CopyParams): Promise<{
    success: boolean;
    destinationKey: string;
    etag?: string;
  }> {
    logger.info("Copying file in S3", {
      source: params.sourceKey,
      destination: params.destinationKey,
    });

    try {
      const sourceBucket = params.sourceBucket || this.config.bucket;
      const copySource = `${sourceBucket}/${params.sourceKey}`;

      const command = new CopyObjectCommand({
        Bucket: this.config.bucket,
        CopySource: copySource,
        Key: params.destinationKey,
        Metadata: params.metadata,
        MetadataDirective: params.metadataDirective || "COPY",
      });

      const response = await this.client.send(command);

      logger.info("File copied successfully", {
        source: params.sourceKey,
        destination: params.destinationKey,
      });

      return {
        success: true,
        destinationKey: params.destinationKey,
        etag: response.CopyObjectResult?.ETag,
      };
    } catch (error) {
      logger.error("File copy failed", {
        error,
        source: params.sourceKey,
        destination: params.destinationKey,
      });
      throw error;
    }
  }

  /**
   * Move file to different location (copy + delete)
   */
  async moveFile(params: MoveParams): Promise<{
    success: boolean;
    destinationKey: string;
  }> {
    logger.info("Moving file in S3", {
      source: params.sourceKey,
      destination: params.destinationKey,
    });

    try {
      // Copy to new location
      await this.copyFile({
        sourceKey: params.sourceKey,
        destinationKey: params.destinationKey,
      });

      // Delete original
      await this.deleteFile({ key: params.sourceKey });

      logger.info("File moved successfully", {
        source: params.sourceKey,
        destination: params.destinationKey,
      });

      return {
        success: true,
        destinationKey: params.destinationKey,
      };
    } catch (error) {
      logger.error("File move failed", {
        error,
        source: params.sourceKey,
        destination: params.destinationKey,
      });
      throw error;
    }
  }

  /**
   * Upload file from local path
   */
  async uploadFromPath(params: {
    localPath: string;
    key?: string; // If not provided, uses filename
    contentType?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    success: boolean;
    key: string;
    etag?: string;
    location: string;
  }> {
    logger.info("Uploading file from local path", { path: params.localPath });

    try {
      const buffer = await fs.readFile(params.localPath);
      const key = params.key || path.basename(params.localPath);

      return await this.uploadFile({
        key,
        content: buffer,
        contentType: params.contentType,
        metadata: params.metadata,
      });
    } catch (error) {
      logger.error("Upload from path failed", {
        error,
        path: params.localPath,
      });
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(params: { key: string }): Promise<boolean> {
    try {
      await this.getFileInfo(params);
      return true;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "NotFound"
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get bucket name
   */
  getBucket(): string {
    return this.config.bucket;
  }

  /**
   * Get region
   */
  getRegion(): string {
    return this.config.region;
  }
}

// Singleton instance for default configuration
let defaultS3Agent: S3Agent | null = null;

export function getS3Agent(config?: S3Config): S3Agent {
  if (config) {
    return new S3Agent(config);
  }

  if (!defaultS3Agent) {
    const defaultConfig: S3Config = {
      region: process.env.AWS_REGION || "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      bucket: process.env.AWS_S3_BUCKET || "",
      endpoint: process.env.AWS_S3_ENDPOINT,
      forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === "true",
    };

    if (
      !defaultConfig.accessKeyId ||
      !defaultConfig.secretAccessKey ||
      !defaultConfig.bucket
    ) {
      throw new Error(
        "AWS S3 credentials not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET environment variables.",
      );
    }

    defaultS3Agent = new S3Agent(defaultConfig);
  }

  return defaultS3Agent;
}

export const s3Agent = getS3Agent;
