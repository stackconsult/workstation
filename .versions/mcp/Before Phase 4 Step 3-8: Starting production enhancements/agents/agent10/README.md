# Agent 10: Guard Rails & Error Prevention Specialist

**Identity:** Defensive guardian who prevents failures before they happen  
**Motto:** "An ounce of prevention is worth a pound of cure"  
**Schedule:** Weekly Saturday 4:00 AM MST (after Agent 9)  
**Duration:** 45-60 minutes

## Mission

Ensure the system never fails silently and always recovers gracefully. Detect and prevent infinite loops, race conditions, and edge cases.

## Core Responsibilities

- ✅ Validate all error handling added by Agent 9
- 🔁 Detect potential infinite loops and add protection
- 🏁 Prevent race conditions in concurrent operations
- ⏱️ Ensure timeouts exist for all external calls
- 🔒 Verify error messages don't leak sensitive data
- 🎯 Test edge cases that other agents might miss
- 🛡️ Add circuit breakers where appropriate
- 📉 Ensure graceful degradation under load

## Validation Checklist

### Error Handling
- All async operations have timeout protection
- Errors include actionable context without sensitive data
- Error logs include request IDs for tracing
- User-facing errors are friendly and helpful
- System errors trigger alerts

### Loop Protection
- All while loops have max iteration guards
- Recursive functions have depth limits
- Retry logic has exponential backoff and max attempts
- Infinite loop detection in workflow execution

### Timeout Protection
- All HTTP requests have timeouts
- Database queries have max execution time
- Browser operations have page load timeouts
- Workflow tasks have execution time limits

### Edge Cases
- Empty array/null/undefined handling
- Zero values and negative numbers validated
- String length limits enforced
- Rate limit handling

## Usage

### Manual Execution

```bash
cd agents/agent10
npm install
npm run build
npm run validate
```

### Automated Weekly Execution

```bash
./run-weekly-guard-rails.sh
```

### Via npm (from project root)

```bash
npm run agent10:build
npm run agent10:validate
npm run agent10:weekly
```

## Architecture

```
agents/agent10/
├── src/
│   ├── guard-rails-engine.ts      # Main orchestration
│   ├── loop-detection.ts           # Infinite loop detection
│   ├── timeout-validation.ts       # Timeout protection validation
│   └── edge-case-tester.ts         # Edge case testing
├── memory/
│   └── guard-rails-history.json    # MCP memory persistence
├── reports/
│   └── YYYYMMDD/                   # Daily validation reports
├── validations/
│   └── YYYYMMDD_HHMMSS/           # Validation logs
├── agent-prompt.yml                # Agent identity & instructions
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript configuration
└── run-weekly-guard-rails.sh      # Automated execution script
```

## Workflow

1. **Load Agent 9 Handoff** - Import optimizations from Agent 9
2. **Loop Detection** - Scan for unguarded loops and add protection
3. **Timeout Validation** - Verify all async operations have timeouts
4. **Edge Case Testing** - Test boundary conditions and error paths
5. **Generate Report** - Create validation report with findings
6. **Update Memory** - Store patterns in MCP memory
7. **Create Snapshot** - Docker snapshot for persistence
8. **Generate Handoff** - Create artifact for Agent 11

## Outputs

### Validation Report
- Location: `reports/YYYYMMDD/GUARD_RAILS_REPORT.md`
- Contains: Summary of validations, issues found, guard rails added

### Handoff Artifact
- Location: `.agent10-to-agent11.json`
- For: Agent 11 (Data Analytics & Comparison)
- Contains: Performance metrics, validation data, weekly trends

### MCP Memory
- Location: `memory/guard-rails-history.json`
- Contains: Historical validation data (52 weeks)
- Used for: Pattern recognition and trend analysis

## Guard Rails Added

Each guard rail is annotated with:

```typescript
// AGENT10_GUARD: {protection_type} - {why_necessary}
```

Examples:
- `// AGENT10_GUARD: Max iterations prevents infinite loop on malformed workflow`
- `// AGENT10_GUARD: Timeout prevents hung connections to external API`
- `// AGENT10_GUARD: Null check prevents runtime crash on missing config`

## Approval Criteria

### Must Pass
- ✅ No infinite loop potential detected
- ✅ All timeouts properly configured
- ✅ All error paths tested
- ✅ No race conditions in critical sections
- ✅ Edge cases covered by tests

### Quality Gates
- 100% of async functions have timeout protection
- 100% of loops have iteration limits
- 95%+ error coverage

## Dependencies

- **Agent 9**: Provides optimization handoff
- **TypeScript**: Source language
- **Node.js**: Runtime environment
- **jq**: JSON processing (optional)
- **Docker**: Memory persistence (optional)

## Handoff Protocol

### To Agent 11 (Data Analytics)
- Provides: Guard rails added, error scenarios prevented, performance metrics
- Format: `.agent10-to-agent11.json`

### Back to Agent 7 (if issues found)
- Triggers: Security vulnerability, sensitive data in errors
- Format: `.agent10-to-agent7-urgent.json`

### Back to Agent 9 (if optimization needed)
- Triggers: Performance degradation >10%
- Format: `.agent10-to-agent9-optimize.json`

## Troubleshooting

### Build Fails
```bash
cd agents/agent10
rm -rf node_modules dist
npm install
npm run build
```

### Validation Issues
- Check `validations/YYYYMMDD_HHMMSS/validation.log`
- Review guard rails added in report
- Verify Agent 9 handoff exists

### Memory Issues
- Memory file auto-creates on first run
- Keeps last 52 weeks of history
- Can be manually reset if corrupted

## Development

### Adding New Validations

1. Create new validator in `src/`
2. Implement validation interface
3. Add to `guard-rails-engine.ts`
4. Update tests and documentation

### Testing

```bash
npm run lint      # Check code style
npm run build     # Compile TypeScript
npm run validate  # Run validation engine
```

## Weekly Schedule

- **Saturday 4:00 AM MST**: Automated execution
- **Dependencies**: Agent 9 must complete first
- **Next**: Hands off to Agent 11

## Contact

For questions or issues with Agent 10:
- Check: `GUARD_RAILS_REPORT.md` in reports
- Review: `guard-rails-history.json` for patterns
- Escalate: Via Agent 7 if security concerns

---

**Status:** ✅ Operational  
**Last Updated:** 2025-11-15  
**Version:** 1.0.0
