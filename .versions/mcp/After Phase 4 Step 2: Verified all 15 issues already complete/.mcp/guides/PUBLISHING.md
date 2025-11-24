# MCP Server Publishing Guide

## 📤 How to Publish Your MCP Server to the Registry

This guide walks you through publishing the Workstation MCP server to the Model Context Protocol registry, making it discoverable by GitHub Copilot and other MCP clients.

## Prerequisites

Before publishing, ensure you have:

- ✅ A valid `server.json` file in your repository root
- ✅ MCP server implementation with documented capabilities
- ✅ Repository is public or accessible to your organization
- ✅ All tests passing (`npm test`)
- ✅ Documentation is up-to-date

## Publishing Steps

### 1. Validate server.json

Ensure your `server.json` follows the [MCP specification](../specs/SERVER_JSON_SPEC.md):

```bash
# Validate server.json schema
npm run mcp:validate

# Or manually check against schema
node -e "console.log(JSON.parse(require('fs').readFileSync('server.json', 'utf8')))"
```

**Required fields:**
- `name`: Unique server identifier (e.g., "workstation-mcp-server")
- `version`: Semver version (e.g., "1.0.0")
- `description`: Clear, concise server description
- `capabilities`: Tools, resources, and prompts your server provides
- `config.transport`: How clients connect to your server

### 2. Test Your Server Locally

Before publishing, test your MCP server thoroughly:

```bash
# Start the MCP server
npm run dev

# In another terminal, test MCP endpoints
curl http://localhost:3000/api/v2/mcp/tools

# Test authentication
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/mcp/tools
```

### 3. Create Repository Tags

Tag your release for proper versioning:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0 with MCP support"
git push origin v1.0.0
```

### 4. Publish to GitHub

Ensure your repository is properly configured:

```bash
# Update package.json with repository info
{
  "name": "workstation-mcp-server",
  "version": "1.0.0",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/creditXcredit/workstation.git"
  },
  "homepage": "https://github.com/creditXcredit/workstation",
  "keywords": ["mcp", "browser-automation", "copilot"]
}
```

### 5. Submit to MCP Registry

#### Option A: Automated Submission (Recommended)

```bash
# Install MCP CLI
npm install -g @modelcontextprotocol/cli

# Login to registry
mcp-cli login

# Publish server
mcp-cli publish ./server.json

# Verify publication
mcp-cli list --name workstation-mcp-server
```

#### Option B: Manual Submission

1. Go to https://registry.modelcontextprotocol.io/submit
2. Fill in the submission form with:
   - **Server Name**: workstation-mcp-server
   - **Repository URL**: https://github.com/creditXcredit/workstation
   - **server.json URL**: https://raw.githubusercontent.com/creditXcredit/workstation/main/server.json
   - **Category**: Browser Automation
   - **Tags**: browser-automation, ai-agents, workflow-engine
3. Submit for review

### 6. Add Registry Badge

Add a badge to your README to show registry status:

```markdown
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io/servers/workstation-mcp-server)
```

## Updating Your Published Server

### Version Updates

When releasing a new version:

```bash
# Update version in server.json and package.json
npm version minor  # or major, patch

# Tag and push
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0

# Publish update
mcp-cli publish ./server.json
```

### Capability Updates

When adding new tools or capabilities:

1. Update `server.json` capabilities section
2. Update API implementation
3. Update documentation
4. Increment version
5. Republish

## Registry Best Practices

### 1. Naming Conventions

- Use lowercase, hyphen-separated names
- Include organization prefix: `orgname-server-type`
- Example: `workstation-mcp-server`

### 2. Version Management

- Follow semantic versioning (SemVer)
- Major version: Breaking changes
- Minor version: New features, backward compatible
- Patch version: Bug fixes

### 3. Documentation

Provide comprehensive documentation:
- Clear capability descriptions
- Input/output schemas for all tools
- Code examples for common use cases
- Authentication requirements
- Rate limiting information

### 4. Security

- Always use authentication for production servers
- Implement rate limiting
- Validate all inputs
- Never expose secrets in server.json
- Use HTTPS for production deployments

### 5. Monitoring

Track your server's usage:
- Monitor API endpoint performance
- Log authentication attempts
- Track tool invocation patterns
- Monitor error rates

## Validation Checklist

Before publishing, verify:

- [ ] `server.json` is valid JSON
- [ ] All required fields are present
- [ ] Version follows SemVer
- [ ] Description is clear and concise (< 200 chars)
- [ ] All capabilities are documented
- [ ] All tools have valid input schemas
- [ ] Authentication is configured
- [ ] Rate limiting is enabled
- [ ] Documentation links are valid
- [ ] Server is accessible (if HTTP transport)
- [ ] All tests pass
- [ ] README includes MCP information

## Troubleshooting

### Server Not Appearing in Registry

1. Check server.json validation
2. Verify repository is public/accessible
3. Ensure version is new (not already published)
4. Check registry submission status

### Authentication Issues

```bash
# Test auth endpoint
curl http://localhost:3000/auth/demo-token

# Verify token works
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/mcp/tools
```

### Tool Discovery Failing

Ensure your MCP endpoints return proper schemas:

```bash
# Test tools endpoint
curl http://localhost:3000/api/v2/mcp/tools | jq .

# Should return:
{
  "tools": [
    {
      "name": "browser_navigate",
      "description": "...",
      "inputSchema": { ... }
    }
  ]
}
```

## Examples

### Minimal server.json

```json
{
  "name": "workstation-mcp-server",
  "version": "1.0.0",
  "description": "Browser automation MCP server",
  "capabilities": {
    "tools": [
      {
        "name": "browser_navigate",
        "description": "Navigate to URL",
        "inputSchema": {
          "type": "object",
          "properties": {
            "url": { "type": "string" }
          },
          "required": ["url"]
        }
      }
    ]
  },
  "config": {
    "transport": {
      "type": "http",
      "baseUrl": "http://localhost:3000"
    }
  }
}
```

### Full-featured server.json

See [root server.json](../../server.json) for a complete example with:
- Multiple tools
- Resources
- Prompts
- Authentication
- Rate limiting
- Documentation links

## Next Steps

After publishing:

1. **Monitor Usage**: Track how your server is being used
2. **Gather Feedback**: Listen to community feedback
3. **Iterate**: Improve based on usage patterns
4. **Promote**: Share your server with the community
5. **Maintain**: Keep documentation and capabilities up-to-date

## Resources

- [server.json Specification](../specs/SERVER_JSON_SPEC.md)
- [API Specification](../specs/API_SPEC.md)
- [MCP Protocol Documentation](https://modelcontextprotocol.io)
- [GitHub Copilot MCP Integration](https://docs.github.com/en/copilot/using-github-copilot/using-extensions-to-integrate-external-tools-with-copilot-chat)

## Support

Need help publishing? 

- Open an issue: https://github.com/creditXcredit/workstation/issues
- Ask in discussions: https://github.com/creditXcredit/workstation/discussions
- Review examples: [Community Projects](../COMMUNITY_PROJECTS.md)
