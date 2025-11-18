# MCP CLI Reference

## Command-Line Interface for MCP Server Management

The MCP CLI provides commands for managing, testing, and publishing your MCP server.

## Installation

```bash
# Global installation
npm install -g @modelcontextprotocol/cli

# Verify installation
mcp-cli --version
```

## Configuration

Create `.mcprc` in your project root:

```json
{
  "server": {
    "name": "workstation-mcp-server",
    "path": "./server.json",
    "baseUrl": "http://localhost:3000"
  },
  "auth": {
    "token": "${MCP_AUTH_TOKEN}"
  }
}
```

## Commands

### init

Initialize a new MCP server configuration.

```bash
mcp-cli init [options]

Options:
  --name <name>        Server name
  --description <desc> Server description
  --type <type>        Server type (http|websocket|stdio)
  --port <port>        Server port
```

**Example:**
```bash
mcp-cli init --name workstation-mcp-server \
  --description "Browser automation server" \
  --type http \
  --port 3000
```

**Output:**
Creates `server.json` with basic configuration.

### validate

Validate server.json against the MCP schema.

```bash
mcp-cli validate [file]

Options:
  --strict             Enable strict validation
  --schema <path>      Custom schema path
```

**Example:**
```bash
# Validate default server.json
mcp-cli validate

# Validate specific file
mcp-cli validate ./config/server.json

# Strict mode (fail on warnings)
mcp-cli validate --strict
```

**Output:**
```
✓ server.json is valid
✓ All tools have valid schemas
✓ All required fields present
✓ Version follows SemVer
```

### test

Test MCP server endpoints.

```bash
mcp-cli test [options]

Options:
  --endpoint <url>     Server endpoint
  --tool <name>        Test specific tool
  --all                Test all tools
  --auth <token>       Authentication token
```

**Example:**
```bash
# Test all tools
mcp-cli test --all --endpoint http://localhost:3000

# Test specific tool
mcp-cli test --tool browser_navigate \
  --endpoint http://localhost:3000 \
  --auth "Bearer token..."

# Interactive test
mcp-cli test --interactive
```

**Output:**
```
Testing browser_navigate... ✓
Testing browser_click... ✓
Testing browser_screenshot... ✓

3/3 tests passed
```

### publish

Publish server to MCP registry.

```bash
mcp-cli publish [options]

Options:
  --file <path>        Server.json path
  --tag <tag>          Version tag
  --dry-run            Validate without publishing
```

**Example:**
```bash
# Publish to registry
mcp-cli publish

# Dry run (validate only)
mcp-cli publish --dry-run

# Publish specific version
mcp-cli publish --tag v1.0.0
```

**Output:**
```
Validating server.json... ✓
Checking authentication... ✓
Publishing to registry... ✓

Server published successfully!
URL: https://registry.modelcontextprotocol.io/servers/workstation-mcp-server
```

### list

List published MCP servers.

```bash
mcp-cli list [options]

Options:
  --name <name>        Filter by name
  --category <cat>     Filter by category
  --mine               Show only your servers
```

**Example:**
```bash
# List all servers
mcp-cli list

# Find specific server
mcp-cli list --name workstation

# List your published servers
mcp-cli list --mine
```

### info

Get information about a published server.

```bash
mcp-cli info <server-name>

Options:
  --version <ver>      Specific version
  --json               Output as JSON
```

**Example:**
```bash
# Get server info
mcp-cli info workstation-mcp-server

# Specific version
mcp-cli info workstation-mcp-server --version 1.0.0

# JSON output
mcp-cli info workstation-mcp-server --json
```

### dev

Start development server with hot reload.

```bash
mcp-cli dev [options]

Options:
  --port <port>        Server port
  --watch              Enable file watching
  --verbose            Verbose logging
```

**Example:**
```bash
# Start dev server
mcp-cli dev --port 3000 --watch

# With verbose logging
mcp-cli dev --verbose
```

**Output:**
```
Starting MCP development server...
✓ Server loaded from server.json
✓ Listening on http://localhost:3000
✓ Watching for changes...

[12:00:00] Tool browser_navigate called
[12:00:01] Tool executed successfully
```

### login

Authenticate with MCP registry.

```bash
mcp-cli login [options]

Options:
  --token <token>      Use token directly
  --github             Login with GitHub
```

**Example:**
```bash
# Interactive login
mcp-cli login

# Use token
mcp-cli login --token your-token

# GitHub OAuth
mcp-cli login --github
```

### logout

Remove authentication credentials.

```bash
mcp-cli logout
```

### config

Manage CLI configuration.

```bash
mcp-cli config <command>

Commands:
  get <key>            Get config value
  set <key> <value>    Set config value
  list                 List all config
  reset                Reset to defaults
```

**Example:**
```bash
# Set default endpoint
mcp-cli config set endpoint http://localhost:3000

# Get current config
mcp-cli config list

# Reset configuration
mcp-cli config reset
```

### generate

Generate code and documentation.

```bash
mcp-cli generate <type> [options]

Types:
  client               Generate client library
  docs                 Generate documentation
  types                Generate TypeScript types
  examples             Generate usage examples
```

**Example:**
```bash
# Generate TypeScript client
mcp-cli generate client --lang typescript --output ./client

# Generate documentation
mcp-cli generate docs --output ./docs

# Generate type definitions
mcp-cli generate types --output ./types
```

## Package.json Scripts

Add these scripts to integrate with npm:

```json
{
  "scripts": {
    "mcp:validate": "mcp-cli validate",
    "mcp:test": "mcp-cli test --all",
    "mcp:publish": "mcp-cli publish",
    "mcp:dev": "mcp-cli dev --watch"
  }
}
```

**Usage:**
```bash
npm run mcp:validate
npm run mcp:test
npm run mcp:publish
```

## Environment Variables

Configure CLI behavior with environment variables:

```bash
# Authentication
export MCP_AUTH_TOKEN="your-token"

# Registry URL
export MCP_REGISTRY_URL="https://registry.modelcontextprotocol.io"

# Default server endpoint
export MCP_ENDPOINT="http://localhost:3000"

# Logging level
export MCP_LOG_LEVEL="info"
```

## Configuration Files

### Global Config

`~/.mcpconfig`:
```json
{
  "registry": "https://registry.modelcontextprotocol.io",
  "auth": {
    "token": "your-token"
  },
  "defaults": {
    "endpoint": "http://localhost:3000"
  }
}
```

### Project Config

`.mcprc`:
```json
{
  "server": {
    "name": "workstation-mcp-server",
    "path": "./server.json"
  },
  "test": {
    "endpoint": "http://localhost:3000",
    "timeout": 30000
  }
}
```

## Testing Examples

### Test All Tools

```bash
mcp-cli test --all --endpoint http://localhost:3000
```

### Test Specific Tool

```bash
mcp-cli test --tool browser_navigate \
  --params '{"url":"https://example.com"}'
```

### Interactive Testing

```bash
mcp-cli test --interactive

> Select tool: browser_navigate
> Enter parameters:
  url: https://example.com
  waitUntil: networkidle
> Executing...
✓ Success: {"url": "https://example.com", "loadTime": 1234}
```

## Publishing Workflow

Complete workflow for publishing:

```bash
# 1. Validate server.json
mcp-cli validate --strict

# 2. Test locally
npm run dev &
mcp-cli test --all

# 3. Generate documentation
mcp-cli generate docs

# 4. Dry run publish
mcp-cli publish --dry-run

# 5. Publish to registry
mcp-cli publish

# 6. Verify publication
mcp-cli info workstation-mcp-server
```

## Troubleshooting

### Validation Errors

```bash
# Get detailed validation errors
mcp-cli validate --verbose

# Check specific schema
mcp-cli validate --schema ./custom-schema.json
```

### Connection Issues

```bash
# Test connectivity
mcp-cli test --tool browser_navigate \
  --endpoint http://localhost:3000 \
  --verbose

# Check health endpoint
curl http://localhost:3000/health
```

### Authentication Problems

```bash
# Verify token
mcp-cli login --verify

# Get new token
mcp-cli login --github

# Manual token
export MCP_AUTH_TOKEN="your-token"
```

## Common Workflows

### Initial Setup

```bash
# 1. Initialize
mcp-cli init --name my-server

# 2. Validate
mcp-cli validate

# 3. Test
npm run dev &
mcp-cli test --all

# 4. Publish
mcp-cli publish
```

### Update Existing Server

```bash
# 1. Update server.json
# Edit version and capabilities

# 2. Validate changes
mcp-cli validate

# 3. Test changes
mcp-cli test --all

# 4. Publish update
mcp-cli publish --tag v1.1.0
```

### Continuous Integration

```yaml
# .github/workflows/mcp.yml
name: MCP CI
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g @modelcontextprotocol/cli
      - run: mcp-cli validate --strict
      - run: npm run dev &
      - run: mcp-cli test --all
```

## Advanced Usage

### Custom Validators

```bash
# Use custom validation script
mcp-cli validate --validator ./scripts/custom-validator.js
```

### Batch Operations

```bash
# Test multiple servers
for server in server1.json server2.json; do
  mcp-cli validate $server
done
```

### Scripting

```bash
#!/bin/bash
# publish-if-valid.sh

if mcp-cli validate --strict; then
  echo "Validation passed, publishing..."
  mcp-cli publish
else
  echo "Validation failed, skipping publish"
  exit 1
fi
```

## Resources

- [MCP Protocol Docs](https://modelcontextprotocol.io)
- [CLI GitHub Repo](https://github.com/modelcontextprotocol/cli)
- [Publishing Guide](../guides/PUBLISHING.md)
- [API Specification](../specs/API_SPEC.md)

## Support

- **Issues**: https://github.com/modelcontextprotocol/cli/issues
- **Discussions**: https://github.com/creditXcredit/workstation/discussions
- **Documentation**: https://github.com/creditXcredit/workstation/blob/main/.mcp/README.md
