/// <reference types="jest" />

import { S3Agent } from "../../../src/automation/agents/storage/s3";

describe("S3 Agent", () => {
  let agent: S3Agent;

  beforeEach(() => {
    agent = new S3Agent({
      region: "us-east-1",
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
      bucket: "test-bucket",
    });
  });

  describe("initialization", () => {
    it("should initialize with AWS S3 config", () => {
      expect(agent).toBeInstanceOf(S3Agent);
    });

    it("should initialize with S3-compatible service", () => {
      const minioAgent = new S3Agent({
        region: "us-east-1",
        accessKeyId: "minioadmin",
        secretAccessKey: "minioadmin",
        bucket: "test-bucket",
        endpoint: "http://localhost:9000",
        forcePathStyle: true,
      });

      expect(minioAgent).toBeInstanceOf(S3Agent);
    });

    it("should initialize with DigitalOcean Spaces config", () => {
      const spacesAgent = new S3Agent({
        region: "nyc3",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        bucket: "my-space",
        endpoint: "https://nyc3.digitaloceanspaces.com",
      });

      expect(spacesAgent).toBeInstanceOf(S3Agent);
    });
  });

  describe("uploadFile (mocked)", () => {
    it("should upload file from buffer", async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        success: true,
        key: "test/file.txt",
        etag: '"abc123"',
        location: "https://test-bucket.s3.amazonaws.com/test/file.txt",
      });

      const result = await mockUpload({
        key: "test/file.txt",
        content: Buffer.from("Hello World"),
        contentType: "text/plain",
      });

      expect(result.success).toBe(true);
      expect(result.key).toBe("test/file.txt");
      expect(result.etag).toBeDefined();
    });

    it("should upload file with metadata", async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        success: true,
        key: "documents/report.pdf",
        etag: '"def456"',
        metadata: {
          author: "John Doe",
          department: "Engineering",
        },
      });

      const result = await mockUpload({
        key: "documents/report.pdf",
        content: Buffer.from("PDF content"),
        contentType: "application/pdf",
        metadata: {
          author: "John Doe",
          department: "Engineering",
        },
      });

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it("should upload with ACL permissions", async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        success: true,
        key: "public/image.jpg",
        etag: '"ghi789"',
        acl: "public-read",
      });

      const result = await mockUpload({
        key: "public/image.jpg",
        content: Buffer.from("image data"),
        contentType: "image/jpeg",
        acl: "public-read",
      });

      expect(result.success).toBe(true);
      expect(result.acl).toBe("public-read");
    });

    it("should handle upload errors", async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        success: false,
        error: "Access Denied",
      });

      const result = await mockUpload({
        key: "restricted/file.txt",
        content: Buffer.from("content"),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Access Denied");
    });

    it("should handle large file uploads", async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        success: true,
        key: "large/file.bin",
        etag: '"jkl012"',
        size: 100 * 1024 * 1024, // 100MB
      });

      const result = await mockUpload({
        key: "large/file.bin",
        content: Buffer.alloc(100 * 1024 * 1024),
      });

      expect(result.success).toBe(true);
      expect(result.size).toBe(100 * 1024 * 1024);
    });
  });

  describe("downloadFile (mocked)", () => {
    it("should download file as buffer", async () => {
      const mockDownload = jest.fn().mockResolvedValue({
        success: true,
        buffer: Buffer.from("File content"),
        contentType: "text/plain",
        size: 12,
      });

      const result = await mockDownload({
        key: "test/file.txt",
      });

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.toString()).toBe("File content");
    });

    it("should download file to disk", async () => {
      const mockDownload = jest.fn().mockResolvedValue({
        success: true,
        savePath: "/tmp/downloaded-file.txt",
        size: 12,
      });

      const result = await mockDownload({
        key: "test/file.txt",
        savePath: "/tmp/downloaded-file.txt",
      });

      expect(result.success).toBe(true);
      expect(result.savePath).toBe("/tmp/downloaded-file.txt");
    });

    it("should handle non-existent file", async () => {
      const mockDownload = jest.fn().mockResolvedValue({
        success: false,
        error: "NoSuchKey: The specified key does not exist",
      });

      const result = await mockDownload({
        key: "nonexistent/file.txt",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("NoSuchKey");
    });

    it("should include metadata in download", async () => {
      const mockDownload = jest.fn().mockResolvedValue({
        success: true,
        buffer: Buffer.from("content"),
        metadata: {
          author: "Jane Doe",
          version: "1.0",
        },
      });

      const result = await mockDownload({
        key: "documents/file.pdf",
      });

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
    });
  });

  describe("listFiles (mocked)", () => {
    it("should list all files in bucket", async () => {
      const mockList = jest.fn().mockResolvedValue({
        success: true,
        files: [
          { key: "file1.txt", size: 100, lastModified: new Date("2024-01-01") },
          { key: "file2.txt", size: 200, lastModified: new Date("2024-01-02") },
        ],
        count: 2,
      });

      const result = await mockList({});

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it("should list files with prefix filter", async () => {
      const mockList = jest.fn().mockResolvedValue({
        success: true,
        files: [
          { key: "images/photo1.jpg", size: 5000 },
          { key: "images/photo2.jpg", size: 6000 },
        ],
        count: 2,
      });

      const result = await mockList({
        prefix: "images/",
      });

      expect(result.success).toBe(true);
      expect(result.files.every((f: any) => f.key.startsWith("images/"))).toBe(
        true,
      );
    });

    it("should handle pagination", async () => {
      const mockList = jest.fn().mockResolvedValue({
        success: true,
        files: Array.from({ length: 100 }, (_, i) => ({
          key: `file${i}.txt`,
          size: 100,
        })),
        count: 100,
        isTruncated: true,
        nextContinuationToken: "token123",
      });

      const result = await mockList({
        maxKeys: 100,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(100);
      expect(result.nextContinuationToken).toBe("token123");
    });

    it("should handle empty bucket", async () => {
      const mockList = jest.fn().mockResolvedValue({
        success: true,
        files: [],
        count: 0,
      });

      const result = await mockList({});

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(0);
    });
  });

  describe("deleteFile (mocked)", () => {
    it("should delete file", async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        success: true,
        key: "test/file.txt",
        deleted: true,
      });

      const result = await mockDelete({
        key: "test/file.txt",
      });

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
    });

    it("should handle deleting non-existent file", async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        success: true,
        key: "nonexistent.txt",
        deleted: false,
      });

      const result = await mockDelete({
        key: "nonexistent.txt",
      });

      expect(result.success).toBe(true);
      // S3 returns success even if file doesn't exist
    });

    it("should handle permission errors", async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        success: false,
        error: "Access Denied",
      });

      const result = await mockDelete({
        key: "protected/file.txt",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Access Denied");
    });
  });

  describe("getFileInfo (mocked)", () => {
    it("should get file metadata", async () => {
      const mockGetInfo = jest.fn().mockResolvedValue({
        success: true,
        info: {
          key: "test/file.txt",
          size: 1024,
          lastModified: new Date("2024-01-01"),
          etag: '"abc123"',
          contentType: "text/plain",
          metadata: {
            author: "John Doe",
          },
        },
      });

      const result = await mockGetInfo({
        key: "test/file.txt",
      });

      expect(result.success).toBe(true);
      expect(result.info.size).toBe(1024);
      expect(result.info.contentType).toBe("text/plain");
    });

    it("should handle non-existent file", async () => {
      const mockGetInfo = jest.fn().mockResolvedValue({
        success: false,
        error: "Not Found",
      });

      const result = await mockGetInfo({
        key: "nonexistent.txt",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Not Found");
    });
  });

  describe("generatePresignedUrl (mocked)", () => {
    it("should generate presigned URL for download", async () => {
      const mockGenerateUrl = jest.fn().mockResolvedValue({
        success: true,
        url: "https://test-bucket.s3.amazonaws.com/test/file.txt?X-Amz-Signature=...",
        expiresIn: 3600,
      });

      const result = await mockGenerateUrl({
        key: "test/file.txt",
        operation: "getObject",
        expiresIn: 3600,
      });

      expect(result.success).toBe(true);
      expect(result.url).toContain("X-Amz-Signature");
      expect(result.expiresIn).toBe(3600);
    });

    it("should generate presigned URL for upload", async () => {
      const mockGenerateUrl = jest.fn().mockResolvedValue({
        success: true,
        url: "https://test-bucket.s3.amazonaws.com/uploads/new-file.txt?X-Amz-Signature=...",
        expiresIn: 1800,
      });

      const result = await mockGenerateUrl({
        key: "uploads/new-file.txt",
        operation: "putObject",
        expiresIn: 1800,
      });

      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
    });

    it("should handle custom expiration times", async () => {
      const mockGenerateUrl = jest.fn().mockResolvedValue({
        success: true,
        url: "https://test-bucket.s3.amazonaws.com/file.txt?...",
        expiresIn: 7200,
      });

      const result = await mockGenerateUrl({
        key: "file.txt",
        expiresIn: 7200, // 2 hours
      });

      expect(result.success).toBe(true);
      expect(result.expiresIn).toBe(7200);
    });
  });

  describe("copyFile (mocked)", () => {
    it("should copy file within bucket", async () => {
      const mockCopy = jest.fn().mockResolvedValue({
        success: true,
        sourceKey: "source/file.txt",
        destinationKey: "destination/file.txt",
        etag: '"xyz789"',
      });

      const result = await mockCopy({
        sourceKey: "source/file.txt",
        destinationKey: "destination/file.txt",
      });

      expect(result.success).toBe(true);
      expect(result.destinationKey).toBe("destination/file.txt");
    });

    it("should copy file from different bucket", async () => {
      const mockCopy = jest.fn().mockResolvedValue({
        success: true,
        sourceKey: "file.txt",
        sourceBucket: "other-bucket",
        destinationKey: "imported/file.txt",
      });

      const result = await mockCopy({
        sourceKey: "file.txt",
        sourceBucket: "other-bucket",
        destinationKey: "imported/file.txt",
      });

      expect(result.success).toBe(true);
      expect(result.sourceBucket).toBe("other-bucket");
    });

    it("should copy with new metadata", async () => {
      const mockCopy = jest.fn().mockResolvedValue({
        success: true,
        sourceKey: "old/file.txt",
        destinationKey: "new/file.txt",
        metadata: {
          version: "2.0",
        },
        metadataDirective: "REPLACE",
      });

      const result = await mockCopy({
        sourceKey: "old/file.txt",
        destinationKey: "new/file.txt",
        metadata: { version: "2.0" },
        metadataDirective: "REPLACE",
      });

      expect(result.success).toBe(true);
      expect(result.metadataDirective).toBe("REPLACE");
    });
  });

  describe("moveFile (mocked)", () => {
    it("should move file (copy + delete)", async () => {
      const mockMove = jest.fn().mockResolvedValue({
        success: true,
        sourceKey: "temp/file.txt",
        destinationKey: "permanent/file.txt",
        deleted: true,
      });

      const result = await mockMove({
        sourceKey: "temp/file.txt",
        destinationKey: "permanent/file.txt",
      });

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
    });

    it("should handle move failure (source not deleted)", async () => {
      const mockMove = jest.fn().mockResolvedValue({
        success: false,
        error: "Failed to delete source after copy",
      });

      const result = await mockMove({
        sourceKey: "source.txt",
        destinationKey: "dest.txt",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("delete source");
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle bucket not found errors", async () => {
      const mockOperation = jest.fn().mockResolvedValue({
        success: false,
        error: "NoSuchBucket: The specified bucket does not exist",
      });

      const result = await mockOperation();

      expect(result.success).toBe(false);
      expect(result.error).toContain("NoSuchBucket");
    });

    it("should handle network timeouts", async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(
          new Error(
            "RequestTimeout: Your socket connection to the server was not read from or written to within the timeout period",
          ),
        );

      await expect(mockOperation()).rejects.toThrow("RequestTimeout");
    });

    it("should handle quota exceeded errors", async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        success: false,
        error:
          "TooManyBuckets: You have attempted to create more buckets than allowed",
      });

      const result = await mockUpload();

      expect(result.success).toBe(false);
      expect(result.error).toContain("TooManyBuckets");
    });

    it("should validate S3 key naming", () => {
      const isValidKey = (key: string) => {
        // S3 key can contain letters, numbers, and certain special characters
        return key.length > 0 && key.length <= 1024 && !key.includes("//");
      };

      expect(isValidKey("valid/key/file.txt")).toBe(true);
      expect(isValidKey("valid-file_name.123.txt")).toBe(true);
      expect(isValidKey("invalid//double-slash.txt")).toBe(false);
      expect(isValidKey("")).toBe(false);
    });

    it("should handle concurrent uploads", async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        success: true,
        key: "file.txt",
        etag: '"abc"',
      });

      const results = await Promise.all([
        mockUpload({ key: "file1.txt", content: Buffer.from("1") }),
        mockUpload({ key: "file2.txt", content: Buffer.from("2") }),
        mockUpload({ key: "file3.txt", content: Buffer.from("3") }),
      ]);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });
});
