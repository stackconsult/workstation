# Contributing to stackBrowserAgent

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Run in development mode: `npm run dev`
5. Run tests (when available): `npm test`

## Code Style

- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint)
- Run `npm run lint` before committing
- Ensure `npm run build` passes without errors

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, descriptive commits
3. Update documentation if needed
4. Ensure all checks pass (build, lint)
5. Submit a pull request with a clear description

## Security

If you discover a security vulnerability, please email the maintainers directly instead of opening a public issue.

## Deployment

### Railway Deployment

The project includes Railway deployment configuration in `railway.json`. When deploying:

1. Ensure `JWT_SECRET` is set (Railway can generate it automatically)
2. Optionally customize `JWT_EXPIRATION`
3. The application will automatically build and start

### Docker Deployment

The project includes a `Dockerfile` for containerized deployment:

```bash
docker build -t stackbrowseragent .
docker run -p 3000:3000 -e JWT_SECRET=your-secret stackbrowseragent
```

## Testing

Before submitting:

1. Test all API endpoints locally
2. Verify JWT authentication works correctly
3. Check that environment variables are properly handled
4. Ensure the application starts successfully after build

## Questions?

Open an issue for questions or suggestions!
