# Future Features & Roadmap Services

This document explains the service files in `src/services/` and `src/utils/` that are **not currently used** in Phase 0 but are part of the evolution roadmap.

## Overview

Phase 0 (current) is a **JWT Authentication Service**. The services listed below are **preparatory code** for future phases and are intentionally included in the codebase for:

1. **Architecture Planning**: Show the intended structure for Phase 1-2
2. **Type Definitions**: Establish interfaces and contracts early
3. **Reference Implementation**: Provide examples for contributors
4. **Gradual Development**: Allow incremental feature additions

## Unused Services (Phase 1+ Features)

### 1. Competitor Research Service

**File**: `src/services/competitorResearch.ts`  
**Purpose**: Automated competitor intelligence gathering using browser automation  
**Roadmap Phase**: Phase 1 (Core Browser Automation Layer)

**Capabilities**:
- Web scraping with Playwright
- Company profile building
- Feature comparison analysis
- Pricing intelligence
- Review aggregation from multiple sources
- Sentiment analysis of customer feedback
- Automated research reports

**Dependencies**:
- Playwright (browser automation)
- Cheerio (HTML parsing)
- Natural (sentiment analysis)
- Winston (logging)

**Why Not Used Yet**:
- Requires Playwright integration (Phase 1)
- Needs workflow orchestration (Phase 1)
- Requires database persistence (Phase 1)
- Part of agent ecosystem (Phase 2)

**When Will It Be Used**: Q1 2024 (Phase 1-2 implementation)

**Test Coverage**: 0% (integration tests planned for Phase 1)

---

### 2. Research Scheduler Service

**File**: `src/services/researchScheduler.ts`  
**Purpose**: Automated scheduling and execution of competitor research tasks  
**Roadmap Phase**: Phase 1 (Core Browser Automation Layer)

**Capabilities**:
- Cron-based task scheduling
- Multi-competitor orchestration
- Error recovery and retries
- Research report generation
- File system output management
- Configurable research intervals

**Dependencies**:
- node-cron (task scheduling)
- CompetitorResearchOrchestrator (main research service)
- Winston (logging)

**Why Not Used Yet**:
- Depends on competitorResearch.ts
- Requires workflow orchestration engine (Phase 1)
- Needs persistent storage for schedules (Phase 1)
- Part of automation framework (Phase 2)

**When Will It Be Used**: Q1 2024 (Phase 1-2 implementation)

**Test Coverage**: 0% (integration tests planned for Phase 1)

---

### 3. Sentiment Analyzer Utility

**File**: `src/utils/sentimentAnalyzer.ts`  
**Purpose**: NLP-based sentiment analysis for reviews and feedback  
**Roadmap Phase**: Phase 1 (Core Browser Automation Layer)

**Capabilities**:
- AFINN sentiment scoring (-5 to +5)
- Batch text analysis
- Sentiment classification (Positive/Neutral/Negative)
- Keyword extraction (positive and negative)
- Multi-text aggregation

**Dependencies**:
- natural (NLP library with AFINN sentiment analysis)

**Why Partially Used**:
- ✅ Code complete and tested (100% coverage)
- ⚠️ Not integrated into any API endpoints yet
- 🔄 Used by competitorResearch.ts (which isn't active yet)

**When Will It Be Used**: Q1 2024 (when competitor research activates)

**Test Coverage**: 100% ✅ (unit tests complete)

---

## Integration Plan

### Phase 1 (Weeks 1-2): Core Browser Automation Layer

**Services to Activate**:
1. `competitorResearch.ts` - Add Playwright integration
2. `researchScheduler.ts` - Implement cron scheduling
3. Create new endpoints:
   ```
   POST /api/research/start        # Start research for a competitor
   GET  /api/research/status/:id   # Check research status
   GET  /api/research/report/:id   # Get research report
   POST /api/research/schedule     # Schedule recurring research
   ```

**Database Schema** (SQLite → PostgreSQL):
```sql
CREATE TABLE research_tasks (
  id UUID PRIMARY KEY,
  competitor_name VARCHAR(255),
  website VARCHAR(255),
  status VARCHAR(50),
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  report_path VARCHAR(255)
);

CREATE TABLE research_results (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES research_tasks(id),
  data JSONB,
  created_at TIMESTAMP
);
```

### Phase 2 (Weeks 3-4): Agent Ecosystem

**Agent Integration**:
- Create `BrowserAgent` that uses competitorResearch.ts
- Create `SchedulerAgent` that uses researchScheduler.ts
- Create `AnalyticsAgent` that uses sentimentAnalyzer.ts
- Enable multi-agent workflows with dependencies

**New Capabilities**:
- 20+ specialized agents
- Parallel task execution
- Agent communication protocols
- Workflow dependency management

---

## Why Keep These Files Now?

### Technical Benefits

1. **Type Safety**: Interfaces and types are defined early
2. **Architecture Clarity**: Shows the intended structure
3. **No Breaking Changes**: Adding features doesn't require refactoring
4. **Contributor Reference**: New developers see the vision
5. **Incremental Development**: Can enable features one at a time

### Strategic Benefits

1. **Roadmap Transparency**: Code shows where we're going
2. **Stakeholder Alignment**: Everyone sees the full vision
3. **Realistic Planning**: Complexity is evident early
4. **Risk Mitigation**: Technical debt is minimized

### Cost-Benefit Analysis

**Costs**:
- ❌ 0% test coverage impacts overall metrics (Phase 0: 37.77% vs potential 90%+)
- ❌ Unused dependencies in package.json (playwright, natural, node-cron)
- ❌ Larger codebase (750+ lines of unused code)

**Benefits**:
- ✅ Architecture is proven and tested (in isolation)
- ✅ No refactoring needed when activating features
- ✅ Clear roadmap visibility
- ✅ Early feedback on design
- ✅ Parallel development possible

**Decision**: Keep the files, document clearly, test when activated

---

## For Developers

### Should I Modify These Files?

**Yes, if**:
- Improving type definitions
- Fixing bugs in the logic
- Adding JSDoc documentation
- Updating dependencies

**No, if**:
- Creating new Phase 0 features (use existing patterns)
- Unsure about Phase 1 timeline
- Breaking existing interfaces

### Should I Test These Files?

**Not Required for Phase 0**:
- Integration tests require Playwright setup
- Complex end-to-end scenarios
- Database fixtures

**Recommended**:
- ✅ Unit tests for sentimentAnalyzer (complete)
- ⏭️ Skip integration tests until Phase 1
- 📝 Document test plans for future

### Should I Remove These Files?

**NO** - These files are:
- Part of the documented roadmap
- Intentionally included
- Not causing bugs or issues
- Future features, not dead code

---

## Alternative Approaches Considered

### Approach 1: Remove Until Needed
**Pros**: Clean Phase 0, higher test coverage, smaller bundle  
**Cons**: Design not validated, larger Phase 1 work, no roadmap visibility

**Decision**: ❌ Rejected - Hides complexity until Phase 1

### Approach 2: Keep in Separate Branch
**Pros**: Clean main branch, still accessible  
**Cons**: Out of sync, harder to maintain, no visibility

**Decision**: ❌ Rejected - Complicates development workflow

### Approach 3: Keep in Monorepo Package
**Pros**: Clear separation, independent versioning  
**Cons**: Overhead of monorepo setup, complicates deployment

**Decision**: ❌ Rejected - Too early for monorepo

### Approach 4: Keep in Main Codebase (CHOSEN) ✅
**Pros**: Visible roadmap, validated design, ready for Phase 1  
**Cons**: Lower test coverage, unused dependencies

**Decision**: ✅ **Chosen** - Document clearly, test when activated

---

## Summary

**Current Status**:
- `competitorResearch.ts` - Complete, not active, 0% coverage
- `researchScheduler.ts` - Complete, not active, 0% coverage
- `sentimentAnalyzer.ts` - Complete, not active, **100% coverage** ✅

**Future Activation**: Q1 2024 (Phase 1-2)

**Action Required**: None - these are intentional future features

**Documentation**: This file explains the rationale and plan

---

## Quick Reference

| Service | Lines | Coverage | Phase | Status |
|---------|-------|----------|-------|--------|
| competitorResearch.ts | 493 | 0% | Phase 1 | Planned |
| researchScheduler.ts | 247 | 0% | Phase 1 | Planned |
| sentimentAnalyzer.ts | 90 | 100% | Phase 1 | Ready ✅ |

**Total Future Code**: 830 lines  
**When Active**: Phase 1 (Q1 2024)  
**Rationale**: Intentional architecture planning

---

**Related Documentation**:
- [ROADMAP.md](../ROADMAP.md) - Full product evolution plan
- [PROJECT_IDENTITY.md](../PROJECT_IDENTITY.md) - Why "stackBrowserAgent" vs "workstation"
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture

**Last Updated**: November 2024  
**Review Date**: January 2024 (Phase 1 kickoff)
