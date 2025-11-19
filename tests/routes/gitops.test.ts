import request from 'supertest';
import express, { Express } from 'express';
import gitopsRoutes from '../../src/routes/gitops';
import * as gitOps from '../../src/services/gitOps';
import { generateToken } from '../../src/auth/jwt';

// Mock dependencies
jest.mock('../../src/services/gitOps');
jest.mock('../../src/utils/logger');

const mockedGitOps = gitOps as jest.Mocked<typeof gitOps>;

describe('GitOps Routes', () => {
  let app: Express;
  let token: string;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/v2/gitops', gitopsRoutes);
    
    // Generate valid JWT token
    token = generateToken({ userId: 'test-user', role: 'admin' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (mockedGitOps.default as any) = {
      safeRun: jest.fn(),
      gitAddAll: jest.fn(),
      gitCommit: jest.fn(),
      gitPush: jest.fn(),
      gitCreateBranch: jest.fn(),
      ghCreatePR: jest.fn(),
    };
  });

  describe('POST /add-commit-push', () => {
    it('should reject requests without JWT token', async () => {
      const response = await request(app)
        .post('/api/v2/gitops/add-commit-push')
        .send({ message: 'test' });

      expect(response.status).toBe(401);
    });

    it('should successfully perform add-commit-push', async () => {
      // Mock successful git operations
      mockedGitOps.default.safeRun = jest.fn()
        .mockResolvedValueOnce({ ok: true, stdout: 'added', stderr: '' })
        .mockResolvedValueOnce({ ok: true, stdout: 'committed', stderr: '' })
        .mockResolvedValueOnce({ ok: true, stdout: 'pushed', stderr: '' });

      const response = await request(app)
        .post('/api/v2/gitops/add-commit-push')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'Test commit',
          branch: 'test-branch',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('add');
      expect(response.body.data).toHaveProperty('commit');
      expect(response.body.data).toHaveProperty('push');
    });
  });
});
