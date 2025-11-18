# GitHub Copilot MCP Setup Guide

## Using Workstation MCP with GitHub Copilot

This guide shows how to configure GitHub Copilot to use the Workstation MCP server for browser automation through natural language.

## Prerequisites

1. **GitHub Copilot subscription** (Individual, Business, or Enterprise)
2. **Workstation repository cloned** and built
3. **Environment variables configured** (JWT_SECRET, etc.)

## Quick Setup

### 1. Build the Server

```bash
npm install
npm run build
```

### 2. Start the MCP Server

```bash
npm run dev
```

### 3. Use in Copilot Chat

```
@workspace Navigate to https://example.com and take a screenshot
```

## Documentation

- [Complete Setup Guide](.mcp/guides/SETUP.md)
- [MCP Documentation](.mcp/README.md)
- [API Reference](.mcp/specs/API_SPEC.md)

## Support

- **Issues**: https://github.com/creditXcredit/workstation/issues
- **Documentation**: https://github.com/creditXcredit/workstation/blob/main/docs/DOCUMENTATION_INDEX.md
