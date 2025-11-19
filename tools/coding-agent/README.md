# Coding Agent Tool

**GitHub Integration Tool for MCP Container Management**

This is a minimal TypeScript/Node.js tool that enables GitHub integration for the Workstation platform, providing capabilities for branch management, repository synchronization, and status checking.

---

## ⚠️ Security Notice

**NEVER commit your `GITHUB_TOKEN` to version control!**

- Store tokens in `.env` file (which is in `.gitignore`)
- Use environment variables in production
- Generate tokens with minimal required scopes
- Rotate tokens regularly

---

## Quick Start

### 1. Installation

```bash
cd tools/coding-agent
npm install
```

### 2. Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=creditXcredit
GITHUB_REPO=workstation
GITHUB_DEFAULT_BRANCH=main
```

### 3. Generate GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" (classic)
3. Select scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
4. Generate token and copy it to your `.env` file

### 4. Usage

```bash
# Check repository status
npm run status

# Push a branch
npm run push-branch -- --branch feature/my-feature --message "Add new feature"

# Sync repository
npm run sync-repo -- --branch main --pull
```

---

## Commands

### `status`

Check repository status, branches, and recent commits.

```bash
npm run status
```

**Output:**
```
📊 Checking repository status...

📦 Repository Information:
   Name: creditXcredit/workstation
   Description: Browser automation platform
   Default branch: main
   Private: No
   Stars: 42
   Forks: 7
   Open issues: 3
   Last updated: 2024-11-19T12:00:00Z

🌿 Recent Branches:
   - main (a1b2c3d)
   - feature/mcp-docs (e4f5g6h)

📝 Recent Commits:
   - a1b2c3d Add MCP documentation
     by Developer on 2024-11-19T11:00:00Z
```

### `push-branch`

Push a branch to GitHub.

```bash
npm run push-branch -- --branch feature/my-feature --message "Add new feature"
```

**Options:**
- `--branch <name>` - Branch name (required)
- `--message <message>` - Commit message (optional)
- `--files <files...>` - Files to commit (optional)

**Example:**
```bash
npm run push-branch -- \
  --branch feature/update-mcp-containers \
  --message "Update MCP container configuration" \
  --files docker-compose.mcp.yml
```

### `sync-repo`

Sync repository with GitHub.

```bash
npm run sync-repo -- --branch main --pull
```

**Options:**
- `--branch <name>` - Branch to sync (default: main)
- `--pull` - Pull latest changes
- `--push` - Push local changes

**Example:**
```bash
# Pull latest changes from main
npm run sync-repo -- --branch main --pull

# Push local changes to feature branch
npm run sync-repo -- --branch feature/my-feature --push
```

---

## Development

### Building

```bash
npm run build
```

### Running Development Mode

```bash
npm run dev
```

### Linting

```bash
npm run lint
```

---

## Architecture

```
tools/coding-agent/
├── src/
│   └── index.ts          # Main entry point
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variable template
├── .env                  # Your local config (gitignored)
└── README.md             # This file
```

---

## Integration with Agent-16

This tool is designed to work with **Agent-16 (MCP Container Manager)**, which provides API endpoints for container management and GitHub integration.

**Agent-16 API Endpoints:**
- `POST /api/github/push-branch` - Push branch via API
- `POST /api/github/sync` - Sync repository via API

**Usage with Agent-16:**

```bash
# Via Agent-16 API (requires JWT token)
curl -X POST http://localhost:3016/api/github/push-branch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "feature/new-container",
    "message": "Add new MCP container",
    "files": ["docker-compose.mcp.yml"]
  }'
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | ✅ Yes | - | GitHub personal access token |
| `GITHUB_OWNER` | No | `creditXcredit` | Repository owner |
| `GITHUB_REPO` | No | `workstation` | Repository name |
| `GITHUB_DEFAULT_BRANCH` | No | `main` | Default branch |

---

## Security Best Practices

1. **Never Commit Tokens**
   - Add `.env` to `.gitignore`
   - Use environment variables in CI/CD
   - Store secrets in secure vaults (e.g., GitHub Secrets)

2. **Minimal Permissions**
   - Only request required token scopes
   - Use fine-grained personal access tokens when possible
   - Limit token expiration time

3. **Rotate Tokens**
   - Rotate tokens every 90 days
   - Revoke unused tokens
   - Monitor token usage

4. **Secure Storage**
   - Don't log tokens
   - Don't share tokens
   - Use encrypted storage in production

---

## Troubleshooting

### Error: GITHUB_TOKEN not found

**Problem:** Token not set in environment

**Solution:**
```bash
# Create .env file
cp .env.example .env

# Add your token
echo "GITHUB_TOKEN=your_token_here" >> .env
```

### Error: Bad credentials

**Problem:** Invalid or expired token

**Solution:**
1. Generate new token at https://github.com/settings/tokens
2. Ensure token has required scopes (`repo`, `workflow`)
3. Update `.env` file with new token

### Error: Not Found

**Problem:** Repository or branch doesn't exist

**Solution:**
1. Check `GITHUB_OWNER` and `GITHUB_REPO` in `.env`
2. Verify you have access to the repository
3. Ensure branch name is correct

---

## Future Enhancements

This is a minimal scaffold implementation. Future enhancements include:

- [ ] Full branch creation and management
- [ ] File commit and push operations
- [ ] Pull request creation
- [ ] Merge operations
- [ ] Tag management
- [ ] Release creation
- [ ] CI/CD workflow triggering
- [ ] Webhook integration
- [ ] Multi-repository support

---

## Additional Resources

- [GitHub REST API](https://docs.github.com/en/rest)
- [Octokit.js Documentation](https://octokit.github.io/rest.js/)
- [Agent-16 Assignment](.agents/agent-16-assignment.json)
- [MCP Containers Guide](mcp-containers/README.md)
- [Architecture Documentation](ARCHITECTURE.md)

---

## Support

For issues or questions:
- 📖 [Documentation](../../docs/DOCUMENTATION_INDEX.md)
- 🐛 [Issue Tracker](https://github.com/creditXcredit/workstation/issues)
- 💬 [Discussions](https://github.com/creditXcredit/workstation/discussions)

---

**Version:** 1.0.0  
**Status:** Scaffold (to be completed in future PRs)  
**Last Updated:** November 19, 2024
