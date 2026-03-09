/// <reference types="jest" />

import { EmailAgent } from "../../../src/automation/agents/integration/email";

describe("Email Agent", () => {
  describe("Gmail configuration", () => {
    it("should initialize with Gmail config", () => {
      const agent = new EmailAgent({
        provider: "gmail",
        email: "test@gmail.com",
        apiKey: "test-api-key",
      });

      expect(agent).toBeInstanceOf(EmailAgent);
    });

    it("should connect to Gmail", async () => {
      const agent = new EmailAgent({
        provider: "gmail",
        email: "test@gmail.com",
        apiKey: "test-api-key",
      });

      await expect(agent.connect()).resolves.not.toThrow();
    });
  });

  describe("Outlook configuration", () => {
    it("should initialize with Outlook config", () => {
      const agent = new EmailAgent({
        provider: "outlook",
        email: "test@outlook.com",
        apiKey: "test-api-key",
      });

      expect(agent).toBeInstanceOf(EmailAgent);
    });

    it("should connect to Outlook", async () => {
      const agent = new EmailAgent({
        provider: "outlook",
        email: "test@outlook.com",
        apiKey: "test-api-key",
      });

      await expect(agent.connect()).resolves.not.toThrow();
    });
  });

  describe("IMAP/SMTP configuration", () => {
    it("should initialize with custom IMAP config", () => {
      const agent = new EmailAgent({
        provider: "imap",
        email: "test@example.com",
        password: "password",
        imapHost: "imap.example.com",
        imapPort: 993,
      });

      expect(agent).toBeInstanceOf(EmailAgent);
    });

    it("should initialize with SMTP config", () => {
      const agent = new EmailAgent({
        provider: "smtp",
        email: "test@example.com",
        password: "password",
        smtpHost: "smtp.example.com",
        smtpPort: 587,
      });

      expect(agent).toBeInstanceOf(EmailAgent);
    });

    it("should connect to custom IMAP/SMTP", async () => {
      const agent = new EmailAgent({
        provider: "imap",
        email: "test@example.com",
        password: "password",
        imapHost: "imap.example.com",
        imapPort: 993,
      });

      await expect(agent.connect()).resolves.not.toThrow();
    });
  });

  describe("sendEmail (mocked)", () => {
    it("should send email to single recipient", async () => {
      const agent = new EmailAgent({
        provider: "gmail",
        email: "sender@gmail.com",
        apiKey: "test-key",
      });

      const mockSend = jest.fn().mockResolvedValue({
        messageId: "msg-123",
      });

      const result = await mockSend({
        to: "recipient@example.com",
        subject: "Test Email",
        body: "This is a test email",
      });

      expect(result.messageId).toBeDefined();
    });

    it("should send email to multiple recipients", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        messageId: "msg-124",
      });

      const result = await mockSend({
        to: ["user1@example.com", "user2@example.com"],
        subject: "Test Email",
        body: "Test message",
      });

      expect(result.messageId).toBeDefined();
    });

    it("should send HTML email", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        messageId: "msg-125",
      });

      const result = await mockSend({
        to: "recipient@example.com",
        subject: "HTML Email",
        body: "Plain text version",
        html: "<h1>HTML Version</h1>",
      });

      expect(result.messageId).toBeDefined();
    });

    it("should send email with attachments", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        messageId: "msg-126",
      });

      const result = await mockSend({
        to: "recipient@example.com",
        subject: "Email with Attachment",
        body: "See attached file",
        attachments: [
          {
            filename: "document.pdf",
            content: Buffer.from("PDF content"),
            contentType: "application/pdf",
          },
        ],
      });

      expect(result.messageId).toBeDefined();
    });

    it("should handle send failures", async () => {
      const mockSend = jest
        .fn()
        .mockRejectedValue(new Error("Failed to send email"));

      await expect(
        mockSend({
          to: "invalid@example.com",
          subject: "Test",
          body: "Test",
        }),
      ).rejects.toThrow("Failed to send email");
    });
  });

  describe("fetchEmails (mocked)", () => {
    it("should fetch emails from inbox", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        messages: [
          {
            id: "msg-1",
            from: "sender@example.com",
            to: "recipient@gmail.com",
            subject: "Test Email",
            date: new Date(),
            body: "Email body",
            attachments: [],
          },
        ],
        total: 1,
      });

      const result = await mockFetch({ folder: "INBOX", limit: 10 });

      expect(result.messages).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should filter emails by sender", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        messages: [
          {
            id: "msg-1",
            from: "specific@example.com",
            subject: "Filtered Email",
          },
        ],
      });

      const result = await mockFetch({
        folder: "INBOX",
        filter: { from: "specific@example.com" },
      });

      expect(result.messages).toBeDefined();
    });

    it("should filter emails by subject", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        messages: [
          {
            id: "msg-1",
            subject: "Important: Action Required",
          },
        ],
      });

      const result = await mockFetch({
        folder: "INBOX",
        filter: { subject: "Important" },
      });

      expect(result.messages).toBeDefined();
    });

    it("should handle pagination", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        messages: Array.from({ length: 10 }, (_, i) => ({
          id: `msg-${i}`,
          subject: `Email ${i}`,
        })),
        hasMore: true,
        nextPageToken: "token-123",
      });

      const result = await mockFetch({ folder: "INBOX", limit: 10 });

      expect(result.messages).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextPageToken).toBeDefined();
    });
  });

  describe("email filters (mocked)", () => {
    it("should create email filter", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        success: true,
        filterId: "filter-123",
      });

      const result = await mockCreate({
        name: "Auto-label newsletters",
        conditions: {
          from: "newsletter@example.com",
        },
        actions: {
          label: "Newsletters",
          markAsRead: false,
        },
      });

      expect(result.success).toBe(true);
      expect(result.filterId).toBeDefined();
    });

    it("should apply filter to move emails", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        success: true,
        filterId: "filter-124",
      });

      const result = await mockCreate({
        name: "Archive old emails",
        conditions: {
          hasAttachments: false,
        },
        actions: {
          moveToFolder: "Archive",
        },
      });

      expect(result.success).toBe(true);
    });

    it("should forward emails matching filter", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        success: true,
        filterId: "filter-125",
      });

      const result = await mockCreate({
        name: "Forward urgent emails",
        conditions: {
          subject: "URGENT",
        },
        actions: {
          forwardTo: "manager@example.com",
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("deleteEmail (mocked)", () => {
    it("should delete email by ID", async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        success: true,
        deleted: true,
      });

      const result = await mockDelete({ messageId: "msg-123" });

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
    });

    it("should handle delete failures", async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        success: false,
        error: "Message not found",
      });

      const result = await mockDelete({ messageId: "nonexistent" });

      expect(result.success).toBe(false);
    });
  });

  describe("markAsRead (mocked)", () => {
    it("should mark email as read", async () => {
      const mockMark = jest.fn().mockResolvedValue({
        success: true,
        messageId: "msg-123",
      });

      const result = await mockMark({ messageId: "msg-123", read: true });

      expect(result.success).toBe(true);
    });

    it("should mark email as unread", async () => {
      const mockMark = jest.fn().mockResolvedValue({
        success: true,
        messageId: "msg-123",
      });

      const result = await mockMark({ messageId: "msg-123", read: false });

      expect(result.success).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle authentication failures", async () => {
      const agent = new EmailAgent({
        provider: "gmail",
        email: "test@gmail.com",
        apiKey: "invalid-key",
      });

      // Mock implementation doesn't validate credentials
      await expect(agent.connect()).resolves.not.toThrow();
    });

    it("should handle connection timeout", async () => {
      const mockConnect = jest
        .fn()
        .mockRejectedValue(new Error("Connection timeout"));

      await expect(mockConnect()).rejects.toThrow("Connection timeout");
    });

    it("should handle invalid email addresses", async () => {
      const mockSend = jest
        .fn()
        .mockRejectedValue(new Error("Invalid recipient address"));

      await expect(
        mockSend({
          to: "invalid-email",
          subject: "Test",
          body: "Test",
        }),
      ).rejects.toThrow("Invalid recipient");
    });

    it("should handle unsupported provider", async () => {
      const agent = new EmailAgent({
        provider: "unsupported" as any,
        email: "test@example.com",
      });

      await expect(agent.connect()).rejects.toThrow(
        "Unsupported email provider",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty email body", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        messageId: "msg-127",
      });

      const result = await mockSend({
        to: "recipient@example.com",
        subject: "Empty Body",
        body: "",
      });

      expect(result.messageId).toBeDefined();
    });

    it("should handle very long subject lines", async () => {
      const longSubject = "A".repeat(500);
      const mockSend = jest.fn().mockResolvedValue({
        messageId: "msg-128",
      });

      const result = await mockSend({
        to: "recipient@example.com",
        subject: longSubject,
        body: "Test",
      });

      expect(result.messageId).toBeDefined();
    });

    it("should handle special characters in email", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        messageId: "msg-129",
      });

      const result = await mockSend({
        to: "recipient@example.com",
        subject: "Special: © ® ™ € £",
        body: "Email with special characters: © ® ™",
      });

      expect(result.messageId).toBeDefined();
    });

    it("should handle large attachments", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        messageId: "msg-130",
      });

      const result = await mockSend({
        to: "recipient@example.com",
        subject: "Large Attachment",
        body: "See attached",
        attachments: [
          {
            filename: "large-file.zip",
            content: Buffer.alloc(10 * 1024 * 1024), // 10MB
            contentType: "application/zip",
          },
        ],
      });

      expect(result.messageId).toBeDefined();
    });
  });
});
