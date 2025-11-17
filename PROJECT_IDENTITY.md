# Project Identity: stackBrowserAgent → workstation Evolution

## Overview

This repository represents an **intentional evolution** from a JWT authentication service to a comprehensive browser automation platform.

### Current State (Phase 0)
- **Package Name**: `stackbrowseragent`
- **Repository Name**: `creditXcredit/workstation`
- **Current Functionality**: JWT-based authentication service with Express.js
- **Purpose**: Foundation layer for browser automation platform

### Why Two Names?

This is **not a mistake** but a deliberate architectural decision:

1. **stackBrowserAgent** = The current working code (Phase 0)
   - JWT authentication service
   - Express.js REST API
   - Docker deployment
   - Security features (rate limiting, CORS, helmet)
   - 94% test coverage

2. **workstation** = The future vision (Phases 1-5)
   - Browser automation orchestration
   - Multi-agent workflows
   - Natural language control
   - Slack integration
   - Full automation platform

### Evolution Roadmap

```
Phase 0 (Complete): stackBrowserAgent ✅
    ├── JWT Authentication
    ├── Express.js API
    └── Security Foundation

Phase 1 (Complete): Core Browser Automation ✅
    ├── Playwright integration
    ├── Workflow orchestration
    ├── Database persistence
    └── RESTful API v2

Phase 2 (Next): Agent Ecosystem
    ├── 20+ specialized agents
    ├── Multi-agent workflows
    └── Parallel execution

Phase 3: Slack Orchestration
    ├── Conversational interface
    ├── Natural language control
    └── Team collaboration

Phase 4-5: Enterprise & Scale
    ├── Multi-tenant workspaces
    ├── Plugin system
    └── Kubernetes deployment
```

### Agent System (Quality Assurance)

The `agents/` folder contains **monitoring and QA agents** for the evolution:

- **Agent 7**: Security Scanner
- **Agent 8**: Error Assessment & Documentation
- **Agent 9**: Optimization Magician
- **Agent 10**: Guard Rails & Error Prevention
- **Agent 11**: Data Analytics & Comparison
- **Agent 12**: QA Intelligence

These agents ensure code quality during the transformation from Phase 0 to Phase 5.

### Why Keep Both Names?

**Technical Reasons**:
1. **NPM Package**: `stackbrowseragent` is the published package name
2. **Container Registry**: Images published as `ghcr.io/creditxcredit/workstation`
3. **Git History**: Maintains continuity from original stackBrowserAgent project
4. **Gradual Migration**: Allows seamless transition without breaking changes

**Strategic Reasons**:
1. **Clear Evolution Path**: Shows where we started and where we're going
2. **Documentation**: Roadmap explicitly describes this transformation
3. **Stakeholder Communication**: Everyone understands we're in Phase 0 heading to Phase 5
4. **No Confusion**: This document clarifies the intentional duality

### When Will Names Align?

The package name will change to "workstation" when:
- ✅ Phase 1 completes (browser automation layer)
- ✅ Phase 2 completes (agent ecosystem)
- ✅ Major version bump to v2.0.0

**Estimated Timeline**: Q1-Q2 2024 (see ROADMAP.md for details)

### What To Call This Project?

**Internally**: "workstation" or "the workstation project"
**In Code**: `stackbrowseragent` (until v2.0.0)
**In Documentation**: "stackBrowserAgent evolving to workstation"
**In URLs**: `github.com/creditXcredit/workstation`

### For Developers

When working on this project:

1. **package.json**: Keep `"name": "stackbrowseragent"` (Phase 0 reality)
2. **README.md**: Describes current JWT auth capabilities + future vision
3. **ROADMAP.md**: Shows the full evolution plan
4. **Container Tags**: Use `workstation` namespace (future-focused)
5. **Documentation**: Refer to "workstation project" or "Phase X of workstation"

### Quick Reference

| Aspect | Current Name | Future Name | When Changes |
|--------|-------------|-------------|--------------|
| NPM Package | stackbrowseragent | workstation | v2.0.0 |
| Repository | workstation | workstation | ✅ Already set |
| Container Images | workstation | workstation | ✅ Already set |
| Main Export | stackBrowserAgent | Workstation | v2.0.0 |
| Documentation | "stackBrowserAgent" | "workstation" | Progressive |

### Summary

**This is NOT a mistake or confusion.** This is an **intentional, documented evolution** from:
- A focused JWT authentication service (Phase 0) ✅
- To a browser automation platform (Phase 1) ✅
- To a comprehensive multi-agent automation platform (Phases 2-5)

The dual naming reflects:
- **Current reality**: Phase 1 Browser Automation (operational ✅)
- **Future vision**: workstation (Phases 2-5)

See [ROADMAP.md](./ROADMAP.md) for the complete evolution plan and timeline.  
See [PHASE1_COMPLETE.md](./PHASE1_COMPLETE.md) for Phase 1 features and usage.

---

**Status**: Phase 0 Complete ✅ | Phase 1 Complete ✅ | Phase 2 In Planning
**Last Updated**: November 2024  
**Version**: 1.1.0 (Phase 1 operational)
