# Module 1: Clone & Configure

## Learning objectives

By the end of this module, you will be able to:

- Clone the Workstation repository, install dependencies, and run the backend locally or in a Codespace without errors.  
- Configure environment variables for JWT auth, database paths, and any external services in a way that is safe to commit to Git.  
- Run a basic health check and a sample workflow execution via curl so you know your environment matches the course reference environment.  
- Capture these steps in your own notes or internal docs so you can repeat them quickly for future projects or client implementations.

## Overview

Set up your local development environment and get the Workstation browser-agent system running in under 30 minutes.

## Learning Objectives

- Clone and configure the workstation repository
- Set up environment variables and secrets
- Run the agent server locally
- Validate the installation with end-to-end tests
- Deploy using Docker (optional)

## Prerequisites

- Node.js 18+ and npm installed
- Git CLI
- Code editor (VS Code recommended)
- Docker Desktop (optional, for containerized deployment)

## Files in This Module

- **setup-steps.md** - Step-by-step installation guide
- **env-configuration.md** - Environment variable reference
- **validation-checklist.md** - Post-install verification steps
- **test.sh** - Automated validation script

## Quick Start

```bash
# Clone the repository
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start the server
npm run dev
```

## What You'll Build

By the end of this module, you will have:

✅ A running agent server on `http://localhost:3000`  
✅ Configured environment variables  
✅ Passing E2E validation tests  
✅ (Optional) Dockerized deployment

## Time to Complete

- **Basic Setup**: 15-20 minutes
- **With Docker**: 30-40 minutes
- **Full Validation**: 10 minutes

## Next Steps

Once your environment is validated, proceed to [Module 2: Architecture Deep Dive](../module-2-architecture/README.md) to understand the system design.

## Troubleshooting

Common issues and solutions:

- **Port 3000 in use**: Change `PORT` in `.env`
- **Node version**: Use nvm to switch to Node 18+
- **Permission errors**: Check file ownership
- **Docker issues**: Ensure Docker Desktop is running

## Support

For questions or issues, open a GitHub issue or check the [main README](../../../README.md).