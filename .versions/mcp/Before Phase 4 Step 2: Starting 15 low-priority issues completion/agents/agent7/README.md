# Agent 7: Security & Penetration Testing

**Status:** Placeholder Implementation  
**Schedule:** Saturday 2:00 AM MST  
**Duration:** 90 minutes  
**Dependencies:** None (runs first)

## Overview

Agent 7 is responsible for weekly security scans and penetration testing of the workstation system.

## Current Status

⚠️ **This is a placeholder implementation.** The full security scanning functionality is not yet implemented.

## Planned Features

1. **Dependency Vulnerability Scanning**
   - npm audit integration
   - Known CVE detection
   - Outdated package identification

2. **Static Code Analysis**
   - Security-focused code scanning
   - Best practice validation
   - Common vulnerability patterns

3. **Container Security**
   - Docker image scanning
   - Base image vulnerability checks
   - Configuration validation

4. **API Security Testing**
   - Authentication bypass attempts
   - Rate limiting verification
   - Input validation testing

## Usage

Run weekly security scan:
```bash
./agents/agent7/run-weekly-security.sh
```

Or via npm:
```bash
npm run agent7:weekly
```

## Output

- Security report: `agents/agent7/reports/{timestamp}/SECURITY_REPORT.md`
- Handoff artifact: `.agent7-handoff.json`

## Integration

Agent 7 creates a handoff artifact that is consumed by Agent 8 (Error Assessment).
