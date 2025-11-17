# Automation Test Templates

**Purpose:** Provide consistent, reusable test templates for all automation and agent components  
**Date:** November 17, 2025

## Template 1: Browser Automation Tests

Use this template for `src/automation/agents/core/browser.ts` and similar browser automation files.

### Key Test Areas
- Initialization (with/without config, error handling)
- Navigation (success, timeout, invalid URLs)
- Page interaction (click, type, handle missing elements)
- Error handling (crashes, network errors)
- Resource management (cleanup, lifecycle)

### Example Structure
```typescript
describe('Browser Automation', () => {
  describe('Initialization', () => { /* tests */ });
  describe('Navigation', () => { /* tests */ });
  describe('Page Interaction', () => { /* tests */ });
  describe('Error Handling', () => { /* tests */ });
  describe('Resource Management', () => { /* tests */ });
});
```

## Template 2: Agent Registry Tests

Use this template for `src/automation/agents/core/registry.ts` and similar registry files.

### Key Test Areas
- Registration (new agent, duplicates, validation, events)
- Lookup (by ID, by name, list all, filter)
- Lifecycle (deregister, events)
- State management (count, clear)

### Example Structure
```typescript
describe('Agent Registry', () => {
  describe('Registration', () => { /* tests */ });
  describe('Lookup', () => { /* tests */ });
  describe('Lifecycle', () => { /* tests */ });
  describe('State Management', () => { /* tests */ });
});
```

## Template 3: Orchestrator Tests

Use this template for `src/automation/orchestrator/engine.ts` and similar orchestration files.

### Key Test Areas
- Workflow execution (simple, multi-step, failures, rollback)
- State management (tracking, updates, recovery)
- Concurrency (multiple workflows, limits)
- Error handling (timeouts, non-critical errors)

### Example Structure
```typescript
describe('Orchestrator Engine', () => {
  describe('Workflow Execution', () => { /* tests */ });
  describe('State Management', () => { /* tests */ });
  describe('Concurrency', () => { /* tests */ });
  describe('Error Handling', () => { /* tests */ });
});
```

## Template 4: Database Tests

Use this template for `src/automation/db/database.ts` and similar database files.

### Key Test Areas
- Initialization (setup, tables, errors)
- CRUD operations (insert, query, update, delete)
- Error handling (constraints, transactions)

### Example Structure
```typescript
describe('Database', () => {
  describe('Initialization', () => { /* tests */ });
  describe('CRUD Operations', () => { /* tests */ });
  describe('Error Handling', () => { /* tests */ });
});
```

## Usage Guidelines

### When to Use Each Template

1. **Browser Template:** Files that interact with browser APIs (puppeteer, playwright)
2. **Registry Template:** Files that manage collections of agents/workflows/entities
3. **Orchestrator Template:** Files that coordinate workflow execution and state
4. **Database Template:** Files that interact with SQLite/databases

### Best Practices

✅ **DO:**
- Test error paths as much as success paths
- Mock external dependencies (browser, network, database)
- Use descriptive test names
- Group related tests in describe blocks
- Clean up resources in afterEach/afterAll

❌ **DON'T:**
- Test implementation details
- Make tests depend on each other
- Use real external services (use mocks)
- Leave resources uncleaned
- Write tests just for coverage numbers

### Progressive Enhancement

Start with basic tests and progressively add:
1. **Phase 1:** Basic happy path tests (30% coverage)
2. **Phase 2:** Error handling tests (50% coverage)
3. **Phase 3:** Edge case tests (70% coverage)
4. **Phase 4:** Integration tests (85%+ coverage)

## Implementation Priority

Based on current coverage gaps:

**High Priority (Start Q4 2025):**
1. `src/orchestration/agent-orchestrator.ts` (0% → 50%)
2. `src/automation/agents/core/registry.ts` (8% branches → 30%)
3. `src/routes/automation.ts` (25% branches → 40%)

**Medium Priority (Q1 2026):**
1. `src/automation/agents/core/browser.ts` (15% → 40%)
2. `src/automation/orchestrator/engine.ts` (23% branches → 50%)

**Low Priority (Q2 2026):**
1. `src/automation/workflow/service.ts` (already 58%)
2. `src/automation/db/database.ts` (already 88%)

## Testing Tools

- **Framework:** Jest (already configured)
- **Mocking:** jest.fn(), jest.spyOn()
- **Browser Mocking:** Consider playwright or puppeteer mocks
- **Database:** Use :memory: SQLite for tests
- **Async:** async/await patterns

## Maintenance

- **Review:** Quarterly template updates
- **Share:** Document learnings in team meetings
- **Evolve:** Add new patterns as discovered
- **Deprecate:** Remove outdated patterns

---

**Last Updated:** November 17, 2025  
**Next Review:** February 2026  
**Owner:** Testing & Quality Team
