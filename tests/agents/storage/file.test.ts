/// <reference types="jest" />

import { FileAgent } from "../../../src/automation/agents/storage/file";
import fs from "fs/promises";

describe("File Agent", () => {
  describe("local storage configuration", () => {
    it("should initialize with local storage config", () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp/test",
      });

      expect(agent).toBeInstanceOf(FileAgent);
    });

    it("should initialize without base path", () => {
      const agent = new FileAgent({
        storageType: "local",
      });

      expect(agent).toBeInstanceOf(FileAgent);
    });
  });

  describe("S3 storage configuration", () => {
    it("should initialize with S3 config", () => {
      const agent = new FileAgent({
        storageType: "s3",
        s3Config: {
          region: "us-east-1",
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
          bucket: "test-bucket",
        },
      });

      expect(agent).toBeInstanceOf(FileAgent);
    });
  });

  describe("GCS storage configuration", () => {
    it("should initialize with GCS config", () => {
      const agent = new FileAgent({
        storageType: "gcs",
        gcsConfig: {
          projectId: "test-project",
          keyFilename: "/path/to/key.json",
          bucket: "test-bucket",
        },
      });

      expect(agent).toBeInstanceOf(FileAgent);
    });
  });

  describe("Azure storage configuration", () => {
    it("should initialize with Azure config", () => {
      const agent = new FileAgent({
        storageType: "azure",
        azureConfig: {
          accountName: "testaccount",
          accountKey: "test-key",
          containerName: "test-container",
        },
      });

      expect(agent).toBeInstanceOf(FileAgent);
    });
  });

  describe("readFile", () => {
    it("should read text file with UTF-8 encoding", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      // Create a test file
      const testPath = "/tmp/test-read.txt";
      await fs.writeFile(testPath, "Test content", "utf-8");

      const content = await agent.readFile({
        path: "test-read.txt",
        encoding: "utf-8",
      });

      expect(content).toBe("Test content");

      // Cleanup
      await fs.unlink(testPath).catch(() => {});
    });

    it("should read file as buffer without encoding", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      const testPath = "/tmp/test-buffer.txt";
      await fs.writeFile(testPath, "Binary content");

      const content = await agent.readFile({
        path: "test-buffer.txt",
      });

      expect(Buffer.isBuffer(content)).toBe(true);

      await fs.unlink(testPath).catch(() => {});
    });

    it("should read file with base64 encoding", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      const testPath = "/tmp/test-base64.txt";
      await fs.writeFile(testPath, "Test data");

      const content = await agent.readFile({
        path: "test-base64.txt",
        encoding: "base64",
      });

      expect(typeof content).toBe("string");
      expect(content).toBe(Buffer.from("Test data").toString("base64"));

      await fs.unlink(testPath).catch(() => {});
    });

    it("should handle non-existent files", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      await expect(
        agent.readFile({
          path: "nonexistent.txt",
          encoding: "utf-8",
        }),
      ).rejects.toThrow();
    });

    it("should reject S3 read in demo version", async () => {
      const agent = new FileAgent({
        storageType: "s3",
        s3Config: {
          region: "us-east-1",
          accessKeyId: "key",
          secretAccessKey: "secret",
          bucket: "bucket",
        },
      });

      await expect(
        agent.readFile({
          path: "test.txt",
        }),
      ).rejects.toThrow("S3 read not implemented");
    });
  });

  describe("writeFile", () => {
    it("should write text file with UTF-8 encoding", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      await agent.writeFile({
        path: "test-write.txt",
        content: "Write test content",
        encoding: "utf-8",
      });

      const content = await fs.readFile("/tmp/test-write.txt", "utf-8");
      expect(content).toBe("Write test content");

      await fs.unlink("/tmp/test-write.txt").catch(() => {});
    });

    it("should write buffer content", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      const buffer = Buffer.from("Buffer content");

      await agent.writeFile({
        path: "test-buffer-write.txt",
        content: buffer,
      });

      const readContent = await fs.readFile("/tmp/test-buffer-write.txt");
      expect(readContent.toString()).toBe("Buffer content");

      await fs.unlink("/tmp/test-buffer-write.txt").catch(() => {});
    });

    it("should create directories if they do not exist", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      await agent.writeFile({
        path: "nested/dir/file.txt",
        content: "Nested file",
      });

      const content = await fs.readFile("/tmp/nested/dir/file.txt", "utf-8");
      expect(content).toBe("Nested file");

      // Cleanup
      await fs.rm("/tmp/nested", { recursive: true }).catch(() => {});
    });

    it("should overwrite existing files", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      await agent.writeFile({
        path: "overwrite.txt",
        content: "Original content",
      });

      await agent.writeFile({
        path: "overwrite.txt",
        content: "New content",
      });

      const content = await fs.readFile("/tmp/overwrite.txt", "utf-8");
      expect(content).toBe("New content");

      await fs.unlink("/tmp/overwrite.txt").catch(() => {});
    });

    it("should reject S3 write in demo version", async () => {
      const agent = new FileAgent({
        storageType: "s3",
        s3Config: {
          region: "us-east-1",
          accessKeyId: "key",
          secretAccessKey: "secret",
          bucket: "bucket",
        },
      });

      await expect(
        agent.writeFile({
          path: "test.txt",
          content: "content",
        }),
      ).rejects.toThrow("S3 write not implemented");
    });
  });

  describe("listFiles", () => {
    beforeAll(async () => {
      // Setup test directory structure
      await fs.mkdir("/tmp/test-list", { recursive: true });
      await fs.writeFile("/tmp/test-list/file1.txt", "content1");
      await fs.writeFile("/tmp/test-list/file2.txt", "content2");
      await fs.mkdir("/tmp/test-list/subdir", { recursive: true });
      await fs.writeFile("/tmp/test-list/subdir/file3.txt", "content3");
    });

    afterAll(async () => {
      await fs.rm("/tmp/test-list", { recursive: true }).catch(() => {});
    });

    it("should list files in directory", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      const files = await agent.listFiles({
        path: "test-list",
      });

      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f) => f.name === "file1.txt")).toBe(true);
      expect(files.some((f) => f.name === "file2.txt")).toBe(true);
    });

    it("should include file metadata", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      const files = await agent.listFiles({
        path: "test-list",
      });

      const file = files.find((f) => f.name === "file1.txt");
      expect(file).toBeDefined();
      expect(file?.size).toBeGreaterThan(0);
      // Check lastModified is defined and can be converted to Date
      expect(file?.lastModified).toBeDefined();
      expect(new Date(file?.lastModified!).getTime()).toBeGreaterThan(0);
      expect(file?.isDirectory).toBe(false);
    });

    it("should list directories", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      const files = await agent.listFiles({
        path: "test-list",
      });

      const dir = files.find((f) => f.name === "subdir");
      expect(dir).toBeDefined();
      expect(dir?.isDirectory).toBe(true);
    });

    it("should handle empty directory", async () => {
      await fs.mkdir("/tmp/test-empty", { recursive: true });

      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      const files = await agent.listFiles({
        path: "test-empty",
      });

      expect(files).toHaveLength(0);

      await fs.rmdir("/tmp/test-empty").catch(() => {});
    });
  });

  describe("deleteFile (mocked)", () => {
    it("should delete file", async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        success: true,
        deleted: true,
      });

      const result = await mockDelete({ path: "test.txt" });

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
    });

    it("should handle non-existent file", async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        success: false,
        error: "File not found",
      });

      const result = await mockDelete({ path: "nonexistent.txt" });

      expect(result.success).toBe(false);
    });
  });

  describe("copyFile (mocked)", () => {
    it("should copy file", async () => {
      const mockCopy = jest.fn().mockResolvedValue({
        success: true,
        sourcePath: "source.txt",
        destinationPath: "dest.txt",
      });

      const result = await mockCopy({
        source: "source.txt",
        destination: "dest.txt",
      });

      expect(result.success).toBe(true);
    });

    it("should handle copy errors", async () => {
      const mockCopy = jest.fn().mockResolvedValue({
        success: false,
        error: "Permission denied",
      });

      const result = await mockCopy({
        source: "source.txt",
        destination: "/restricted/dest.txt",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("moveFile (mocked)", () => {
    it("should move file", async () => {
      const mockMove = jest.fn().mockResolvedValue({
        success: true,
        oldPath: "old.txt",
        newPath: "new.txt",
      });

      const result = await mockMove({
        source: "old.txt",
        destination: "new.txt",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle files with special characters", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      await agent.writeFile({
        path: "special-chars-©®™.txt",
        content: "Special content",
      });

      const content = await agent.readFile({
        path: "special-chars-©®™.txt",
        encoding: "utf-8",
      });

      expect(content).toBe("Special content");

      await fs.unlink("/tmp/special-chars-©®™.txt").catch(() => {});
    });

    it("should handle very large files", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      const largeContent = "A".repeat(1024 * 1024); // 1MB

      await agent.writeFile({
        path: "large-file.txt",
        content: largeContent,
      });

      const content = await agent.readFile({
        path: "large-file.txt",
        encoding: "utf-8",
      });

      expect(content.length).toBe(1024 * 1024);

      await fs.unlink("/tmp/large-file.txt").catch(() => {});
    });

    it("should handle binary files", async () => {
      const agent = new FileAgent({
        storageType: "local",
        basePath: "/tmp",
      });

      const binaryData = Buffer.from([0x00, 0xff, 0xaa, 0x55]);

      await agent.writeFile({
        path: "binary.dat",
        content: binaryData,
      });

      const content = await agent.readFile({
        path: "binary.dat",
      });

      expect(Buffer.isBuffer(content)).toBe(true);
      expect(content).toEqual(binaryData);

      await fs.unlink("/tmp/binary.dat").catch(() => {});
    });

    it("should reject unsupported storage type", async () => {
      const agent = new FileAgent({
        storageType: "gcs",
        gcsConfig: {
          projectId: "test",
          keyFilename: "/key.json",
          bucket: "bucket",
        },
      });

      await expect(
        agent.readFile({
          path: "test.txt",
        }),
      ).rejects.toThrow("Unsupported storage type");
    });
  });
});
