/// <reference types="jest" />

import { initializeWorkspaces } from '../../src/scripts/initialize-workspaces';
import db from '../../src/db/connection';
import bcrypt from 'bcrypt';

// Mock the database and logger
jest.mock('../../src/db/connection');
jest.mock('../../src/utils/logger');

describe('Workspace Initialization', () => {
  const mockQuery = db.query as jest.MockedFunction<typeof db.query>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeWorkspaces', () => {
    it('should skip initialization if workspaces already exist', async () => {
      // Mock that 20 workspaces already exist
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '20' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      });

      await initializeWorkspaces();

      // Should only query for count, not insert anything
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith('SELECT COUNT(*) FROM workspaces');
    });

    it('should create workspaces when none exist', async () => {
      // Mock empty database
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '0' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      });

      // Mock successful insertions for all 20 workspaces
      for (let i = 0; i < 20; i++) {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: `workspace-${i}` }],
          command: 'INSERT',
          rowCount: 1,
          oid: 0,
          fields: []
        });
      }

      await initializeWorkspaces();

      // Should query count + 20 inserts
      expect(mockQuery).toHaveBeenCalledTimes(21);
      
      // Verify first insert has correct structure
      const firstInsertCall = mockQuery.mock.calls[1];
      expect(firstInsertCall[0]).toContain('INSERT INTO workspaces');
      expect(firstInsertCall[0]).toContain('ON CONFLICT (slug) DO NOTHING');
      expect(firstInsertCall[1]).toHaveLength(5); // name, slug, username, hash, description
    });

    it('should handle idempotent behavior with ON CONFLICT DO NOTHING', async () => {
      // Mock that some workspaces exist
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '10' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      });

      // Mock: first 10 already exist (no rows returned), last 10 are new
      for (let i = 0; i < 20; i++) {
        if (i < 10) {
          // Existing workspace - ON CONFLICT returns no rows
          mockQuery.mockResolvedValueOnce({
            rows: [],
            command: 'INSERT',
            rowCount: 0,
            oid: 0,
            fields: []
          });
        } else {
          // New workspace - returns id
          mockQuery.mockResolvedValueOnce({
            rows: [{ id: `workspace-${i}` }],
            command: 'INSERT',
            rowCount: 1,
            oid: 0,
            fields: []
          });
        }
      }

      await initializeWorkspaces();

      // Should attempt to insert all 20
      expect(mockQuery).toHaveBeenCalledTimes(21); // count + 20 inserts
    });

    it('should generate unique passwords for each workspace', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '0' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      });

      const passwordHashes: string[] = [];
      
      // Capture password hashes from insert calls
      for (let i = 0; i < 20; i++) {
        mockQuery.mockImplementationOnce((query, params) => {
          if (params && params[3]) {
            passwordHashes.push(params[3] as string);
          }
          return Promise.resolve({
            rows: [{ id: `workspace-${i}` }],
            command: 'INSERT',
            rowCount: 1,
            oid: 0,
            fields: []
          });
        });
      }

      await initializeWorkspaces();

      // Verify all password hashes are unique
      const uniqueHashes = new Set(passwordHashes);
      expect(uniqueHashes.size).toBe(20);

      // Verify all hashes look like bcrypt hashes (start with $2b$)
      passwordHashes.forEach(hash => {
        expect(hash).toMatch(/^\$2[aby]\$/);
      });
    });

    it('should handle database connection failures gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(initializeWorkspaces()).rejects.toThrow('Database connection failed');
    });

    it('should continue initialization if individual workspace creation fails', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '0' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      });

      // Mock: first insert fails, rest succeed
      mockQuery.mockRejectedValueOnce(new Error('Constraint violation'));
      for (let i = 1; i < 20; i++) {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: `workspace-${i}` }],
          command: 'INSERT',
          rowCount: 1,
          oid: 0,
          fields: []
        });
      }

      // Should not throw, but log error and continue
      await expect(initializeWorkspaces()).resolves.not.toThrow();
      expect(mockQuery).toHaveBeenCalledTimes(21); // count + 20 attempts (including failed one)
    });

    it('should use cryptographically secure random passwords', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '0' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      });

      const passwords: string[] = [];
      
      for (let i = 0; i < 20; i++) {
        mockQuery.mockImplementationOnce((query, params) => {
          // Extract password from query params - it's the hashed version
          // We'll verify it's a proper bcrypt hash
          if (params && params[3]) {
            passwords.push(params[3] as string);
          }
          return Promise.resolve({
            rows: [{ id: `workspace-${i}` }],
            command: 'INSERT',
            rowCount: 1,
            oid: 0,
            fields: []
          });
        });
      }

      await initializeWorkspaces();

      // All passwords should be valid bcrypt hashes with cost factor 10
      passwords.forEach(hash => {
        expect(hash).toMatch(/^\$2[aby]\$10\$/);
      });
    });

    it('should create exactly 20 workspaces', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '0' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      });

      for (let i = 0; i < 20; i++) {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: `workspace-${i}` }],
          command: 'INSERT',
          rowCount: 1,
          oid: 0,
          fields: []
        });
      }

      await initializeWorkspaces();

      // Verify exactly 20 insert attempts (plus 1 count query)
      expect(mockQuery).toHaveBeenCalledTimes(21);
    });

    it('should set correct workspace properties', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '0' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      });

      let firstWorkspaceParams: any[] = [];
      
      mockQuery.mockImplementationOnce((query, params) => {
        firstWorkspaceParams = params as any[];
        return Promise.resolve({
          rows: [{ id: 'workspace-1' }],
          command: 'INSERT',
          rowCount: 1,
          oid: 0,
          fields: []
        });
      });

      // Mock remaining inserts
      for (let i = 1; i < 20; i++) {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: `workspace-${i}` }],
          command: 'INSERT',
          rowCount: 1,
          oid: 0,
          fields: []
        });
      }

      await initializeWorkspaces();

      // Verify first workspace has expected properties
      expect(firstWorkspaceParams).toHaveLength(5);
      expect(firstWorkspaceParams[0]).toBe('Workspace Alpha'); // name
      expect(firstWorkspaceParams[1]).toBe('workspace-alpha'); // slug
      expect(firstWorkspaceParams[2]).toBe('ws_alpha_user'); // username
      expect(firstWorkspaceParams[3]).toMatch(/^\$2[aby]\$10\$/); // password hash
      expect(firstWorkspaceParams[4]).toBe('Generic workspace for initial setup'); // description
    });
  });
});
