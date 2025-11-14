# Copilot Coding Agent — Onboarding for stackBrowserAgent

Purpose
-------
This document onboards Copilot coding agents (and humans) to the repository. It explains the contract, quick verification steps, useful commands, and files to avoid editing.

Repo at-a-glance (contract)
- Inputs: a clear task/issue or PR description, target files/areas, and reproduction steps.
- Outputs: minimal, well-tested code changes; updated documentation; green build and lint; a PR with a verification checklist.
- Error modes: failing build, lint errors, broken types. If build or lint fails, stop and fix immediately.

Quick start — what the agent should do first
1. Read `.github/copilot-coding-agent.yml` for canonical commands and protected files.
2. Run the build and lint locally:
   - `npm install` (if dependencies not installed)
   - `npm run build`
   - `npm run lint`
3. Run the app in dev mode to verify behavior if needed: `npm run dev`.

Important commands
- Build: `npm run build` (uses `tsc`)
- Dev: `npm run dev` (ts-node)
- Lint: `npm run lint` (eslint)
- Test: `npm test` (runs Jest test suite with coverage reporting)

Files & areas of concern
- Core source: `src/` — preferred area for code changes.
- Auth: `src/auth/jwt.ts` — marked as protected; changes here must be small and must include security justification and tests.
- Package metadata: `package.json`, `tsconfig.json` — update with care and document changes in the PR.

Minimal verification checklist for PRs
1. Build completes locally: `npm run build` (no TypeScript errors)
2. Lint passes: `npm run lint` (no new warnings/errors)
3. If the change affects runtime behavior, run the app and exercise the relevant endpoint(s).
4. Update `CHANGELOG.md` and relevant docs (API.md, README.md) for visible changes.

Edge cases for the agent to watch
- Do not expose secrets. Never add real secrets to code or docs.
- If a change requires schema migrations or changes to the public API, open a draft PR and request a human reviewer.
- If tests are missing for the changed behavior, add a small test or ask a maintainer to prioritize tests.

Where to ask for help
- GitHub Issues: https://github.com/stackconsult/stackBrowserAgent/issues
- GitHub Discussions: https://github.com/stackconsult/stackBrowserAgent/discussions

How to update this onboarding
1. Edit `.github/COPILOT_ONBOARDING.md` and `.github/copilot-coding-agent.yml` as needed.
2. Provide a short explanation in the PR describing why the update is necessary.

Notes
- This repository now includes comprehensive automated tests; run `npm test` to verify changes along with `build` and `lint`.
