/**
 * Mock for @octokit/rest to handle ESM module in Jest
 * This avoids ES module import issues during testing
 */

export class Octokit {
  constructor(_options?: any) {
    // Mock constructor
  }

  rest = {
    pulls: {
      list: jest.fn().mockResolvedValue({ data: [] }),
      create: jest.fn().mockResolvedValue({
        data: {
          number: 1,
          title: 'Test PR',
          html_url: 'https://github.com/test/test/pull/1',
          state: 'open',
          head: { ref: 'test-branch' },
          base: { ref: 'main' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: { login: 'testuser' }
        }
      }),
      get: jest.fn().mockResolvedValue({ data: { number: 1, state: 'open' } }),
      update: jest.fn().mockResolvedValue({ data: { number: 1, state: 'closed' } }),
    },
    repos: {
      get: jest.fn().mockResolvedValue({
        data: {
          name: 'workstation',
          owner: { login: 'creditXcredit' },
          full_name: 'creditXcredit/workstation'
        }
      }),
      listBranches: jest.fn().mockResolvedValue({ data: [] }),
    },
    git: {
      getRef: jest.fn().mockResolvedValue({ 
        data: { 
          ref: 'refs/heads/main', 
          object: { sha: 'abc123' } 
        } 
      }),
    }
  };
}

export default { Octokit };
