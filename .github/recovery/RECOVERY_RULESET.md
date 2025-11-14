# Repository Recovery Ruleset for Automated Agents

## Purpose
This document defines strict rules for automated agents (GitHub Copilot, custom agents, CI/CD systems) to discover, assess, and execute repository recovery operations. These rules are designed to be machine-readable and actionable.

---

## Rule Categories

### 🔍 **DETECTION RULES** - Identifying Recovery Situations

#### Rule D1: Repository Content Mismatch Detection
```yaml
trigger:
  - package.json name doesn't match repository name
  - README describes different project than code implements
  - Git history shows sudden content replacement
  - User reports "wrong code in repository"

action:
  - Flag as potential recovery situation
  - Begin investigation protocol
  - Do NOT make changes until investigation complete
```

#### Rule D2: Container Availability Check
```yaml
priority: ALWAYS_CHECK_FIRST
when: recovery_situation_detected
check:
  - Query GitHub Container Registry for packages
  - Search for tags matching recent commits/branches/PRs
  - Document all found containers with SHA256 hashes
  - Verify container accessibility (authentication)
```

#### Rule D3: Git History Integrity Verification
```yaml
when: recovery_situation_detected
verify:
  - Check if git history contains correct code at any point
  - Identify last known good commit (if exists)
  - Compare git history with container build dates
  - Flag if entire history contains wrong code
```

---

### 🛡️ **SAFETY RULES** - Preventing Data Loss

#### Rule S1: Backup Before Any Destructive Operation
```yaml
mandatory: true
before_actions:
  - git operations that modify history
  - file deletions or replacements
  - repository content changes

backup_requirements:
  - Create timestamped backup directory
  - Preserve .git and .github directories
  - Document backup location in logs
  - Verify backup completeness before proceeding
```

#### Rule S2: Preserve Git Infrastructure
```yaml
always_preserve:
  - .git/ (entire directory)
  - .github/ (workflows, agents, configs)
  - .gitignore
  - Git hooks and configuration

never_delete:
  - Commit history
  - Branch references
  - Remote configurations
  - Git metadata
```

#### Rule S3: Interactive Confirmation for Critical Operations
```yaml
require_human_approval:
  - Deleting current repository content
  - Replacing multiple files simultaneously
  - Force-pushing to remote
  - Permanent destructive actions

confirmation_format:
  - Display what will be changed
  - Show before/after comparison
  - Require explicit "yes" confirmation
  - Provide cancellation option
```

#### Rule S4: Rollback Capability
```yaml
mandatory: true
requirements:
  - Every operation must be reversible
  - Document rollback steps before executing
  - Test rollback procedure during development
  - Provide emergency restore instructions
```

---

### 📦 **CONTAINER RULES** - Working with Container Images

#### Rule C1: Container as Primary Recovery Source
```yaml
priority_order:
  1. Published container images (if available)
  2. Local workspace (if user has it)
  3. Git tags/branches (if history intact)
  4. Archive backups (if configured)

reasoning:
  - Containers are immutable
  - SHA256 provides cryptographic verification
  - Containers survive git repository corruption
  - Registry is separate infrastructure
```

#### Rule C2: SHA256 Hash Verification
```yaml
mandatory: true
when: using_container_for_recovery

requirements:
  - Use SHA256 digest references, not just tags
  - Verify hash matches documentation
  - Support multiple architectures (AMD64, ARM64)
  - Document which hash was used for recovery

format: "registry/image:tag@sha256:hash"
example: "ghcr.io/org/repo:v1@sha256:abc123..."
```

#### Rule C3: Multi-Architecture Support
```yaml
support_required:
  - linux/amd64 (Intel/AMD processors)
  - linux/arm64 (ARM processors, M1/M2 Macs)
  - Multi-arch manifests (when available)

agent_behavior:
  - Detect host architecture automatically
  - Offer appropriate container for platform
  - Provide manual selection option
  - Document all available architectures
```

#### Rule C4: Container Content Verification
```yaml
before_extraction:
  - Verify container can be pulled
  - Check container layers are complete
  - Validate container is not corrupted

after_extraction:
  - Verify extracted files are complete
  - Check package.json exists and is valid
  - Confirm source code matches expected project
  - Run basic validation (syntax check, file count)
```

---

### 🔧 **RECOVERY RULES** - Executing Recovery Operations

#### Rule R1: Investigation Before Action
```yaml
mandatory_investigation_steps:
  1. Document current repository state
     - package.json content
     - git log (last 20 commits)
     - directory structure
     - file counts and types
  
  2. Identify correct version source
     - Check container registry
     - Query git tags/branches
     - Ask user for local workspace location
  
  3. Document expected final state
     - What package.json should contain
     - What project should be present
     - How to verify correctness
  
  4. Create recovery plan
     - Step-by-step procedure
     - Verification at each step
     - Rollback instructions
```

#### Rule R2: Automated Recovery Script Requirements
```yaml
required_features:
  pre_flight_checks:
    - Docker installed and running
    - Authentication to container registry
    - Sufficient disk space
    - Container image accessible
  
  safety_features:
    - Automatic backup creation
    - Interactive confirmations
    - Git preservation (.git, .github)
    - Dry-run mode option
  
  recovery_steps:
    - Pull container image
    - Extract source code
    - Preserve git infrastructure
    - Replace repository content
    - Verify restoration
  
  post_recovery:
    - Display changes made
    - Show verification commands
    - Provide next steps
    - Document recovery in logs
```

#### Rule R3: Verification Protocol
```yaml
post_recovery_checks:
  - [ ] package.json has correct project name
  - [ ] npm install (or equivalent) succeeds
  - [ ] Build command succeeds
  - [ ] Test command succeeds (if tests exist)
  - [ ] No references to wrong project remain
  - [ ] README matches project purpose
  - [ ] Git status shows expected changes

failure_response:
  - Do NOT commit if verification fails
  - Restore from backup
  - Report issues to user
  - Request manual intervention
```

#### Rule R4: Multi-Stage Execution
```yaml
stage_1_test:
  - Run recovery on test branch
  - Verify all checks pass
  - Document any issues found

stage_2_approval:
  - Present recovery results to user
  - Request approval to apply to main
  - Provide detailed change summary

stage_3_production:
  - Apply to target branch only after approval
  - Monitor for issues
  - Be ready to rollback
```

---

### 📝 **DOCUMENTATION RULES** - Creating Recovery Resources

#### Rule DO1: Multi-Level Documentation
```yaml
required_documents:
  level_1_quick_start:
    name: "START_HERE.md"
    target: "Users who need immediate action"
    length: "< 1 page"
    content: "Quick commands and navigation"
  
  level_2_overview:
    name: "EXECUTIVE_SUMMARY.md"
    target: "Decision makers and managers"
    length: "2-3 pages"
    content: "Problem, solution, impact, cost"
  
  level_3_guide:
    name: "QUICK_RECOVERY_GUIDE.md"
    target: "Engineers executing recovery"
    length: "3-5 pages"
    content: "Step-by-step instructions"
  
  level_4_technical:
    name: "REPOSITORY_RECOVERY.md"
    target: "Advanced users and troubleshooting"
    length: "5-10 pages"
    content: "All options, technical details"
  
  level_5_tools:
    name: "scripts/README.md"
    target: "Script users and developers"
    length: "5-7 pages"
    content: "Usage, troubleshooting, API"
```

#### Rule DO2: Lessons Learned Documentation
```yaml
required: true
when: recovery_completed

document_sections:
  - What happened (incident summary)
  - What went wrong (root cause)
  - What saved us (recovery source)
  - Key lessons learned
  - Best practices going forward
  - Recommendations for prevention
  - Container strategy importance

filename: "RECOVERY_LESSONS_LEARNED.md"
location: "repository_root/"
```

#### Rule DO3: Container References Documentation
```yaml
required: true
when: containers_used_for_recovery

document_content:
  - Full container image paths
  - Tag names
  - SHA256 hashes for each architecture
  - Build date and commit reference
  - How to pull and extract
  - Verification steps

filename: "CONTAINER_REFERENCES.md"
location: "repository_root/ or .github/recovery/"
```

#### Rule DO4: Prompt Template Creation
```yaml
required: true
purpose: "Enable future agents to handle similar situations"

template_sections:
  - Investigation framework
  - Container analysis steps
  - Recovery strategy options
  - Automation requirements
  - Verification procedures
  - Documentation deliverables

format: "Markdown with YAML-style structure"
location: ".github/recovery/AGENT_PROMPT_TEMPLATE.md"
```

---

### 🤖 **AGENT BEHAVIOR RULES** - How Agents Should Act

#### Rule A1: Conservative by Default
```yaml
default_mode: SAFE
behavior:
  - Investigate thoroughly before acting
  - Ask for confirmation on destructive operations
  - Provide detailed explanations of actions
  - Offer multiple recovery options
  - Document everything automatically
```

#### Rule A2: Transparent Operations
```yaml
requirements:
  - Log all commands executed
  - Explain reasoning for each action
  - Show before/after state
  - Document decisions made
  - Provide audit trail
```

#### Rule A3: User Communication
```yaml
communication_style:
  - Clear and concise
  - Technical but accessible
  - Action-oriented
  - Include examples
  - Provide next steps

required_updates:
  - Initial assessment findings
  - Recovery plan proposal
  - Progress during execution
  - Completion status
  - Verification results
```

#### Rule A4: Error Handling
```yaml
on_error:
  - Stop immediately
  - Restore from backup if changes made
  - Log error details
  - Explain what went wrong
  - Provide troubleshooting steps
  - Offer manual fallback procedure

never:
  - Continue after critical error
  - Hide errors from user
  - Retry destructive operations automatically
  - Guess at recovery steps
```

---

## Container Importance - Hard Rules

### Rule CI1: Mandatory Containerization
```yaml
policy: MANDATORY
applies_to: ALL_REPOSITORIES

requirements:
  - Every repository must have a Dockerfile
  - Containers built on every merge to main
  - Containers published to registry automatically
  - SHA256 hashes documented for each build

reasoning:
  "Containers are the only recovery source that survives
   git repository corruption. Without containers, recovery
   may be impossible."
```

### Rule CI2: Container Retention Policy
```yaml
minimum_retention:
  - main_branch: "90 days minimum"
  - release_tags: "permanent"
  - pr_branches: "30 days minimum"
  - feature_branches: "7 days minimum"

storage_cost_justification:
  "Container storage cost (~$0.10/GB/month) is negligible
   compared to code recreation cost ($10,000-$50,000+)"
```

### Rule CI3: Container Content Standards
```yaml
required_in_container:
  - Source code (complete)
  - package.json and lock files
  - Configuration files
  - Documentation (README, LICENSE)
  - Build artifacts (optional but recommended)

verification:
  "Agent must verify source code is present in container,
   not just compiled artifacts"
```

### Rule CI4: Multi-Platform Builds
```yaml
required_platforms:
  - linux/amd64 (mandatory)
  - linux/arm64 (mandatory for repositories with Mac users)

build_command:
  "docker buildx build --platform linux/amd64,linux/arm64
   -t registry/image:tag --push ."
```

---

## Implementation Checklist for Agents

### When Recovery Situation Detected

- [ ] **Phase 1: Investigation**
  - [ ] Analyze current repository state
  - [ ] Check for container images
  - [ ] Verify git history integrity
  - [ ] Document findings

- [ ] **Phase 2: Source Identification**
  - [ ] List all available containers with SHA256 hashes
  - [ ] Check for git tags/branches with correct code
  - [ ] Ask user about local workspace
  - [ ] Prioritize recovery sources (containers first)

- [ ] **Phase 3: Recovery Planning**
  - [ ] Create detailed recovery plan
  - [ ] Document verification steps
  - [ ] Prepare rollback procedure
  - [ ] Get user approval

- [ ] **Phase 4: Automation**
  - [ ] Build recovery script with safety features
  - [ ] Create pre-flight test script
  - [ ] Implement verification protocol
  - [ ] Add error handling

- [ ] **Phase 5: Documentation**
  - [ ] Create multi-level documentation suite
  - [ ] Document container references
  - [ ] Write lessons learned
  - [ ] Create prompt template for future use

- [ ] **Phase 6: Execution**
  - [ ] Run pre-flight tests
  - [ ] Execute recovery with user confirmation
  - [ ] Verify restoration success
  - [ ] Document recovery in git history

---

## Quick Reference for Agents

```yaml
IF repository_has_wrong_code:
  THEN:
    1. CHECK: Container registry for published images
    2. DOCUMENT: All found containers with SHA256
    3. CREATE: Multi-level documentation suite
    4. BUILD: Automated recovery scripts
    5. VERIFY: Container extraction works
    6. APPROVE: Get user confirmation
    7. EXECUTE: Recovery with safety features
    8. VALIDATE: Check restoration succeeded
    9. DOCUMENT: Lessons learned and best practices

PRIORITY_ORDER:
  1. Containers (immutable, cryptographically verified)
  2. Local workspace (if user has it)
  3. Git history (if not corrupted)
  4. Manual recreation (last resort)

SAFETY_FIRST:
  - Backup before changes
  - Confirm before destructive operations
  - Preserve git infrastructure always
  - Verify after each step
  - Document everything

CONTAINER_IS_KING:
  "If containers exist, use them. They are the most
   reliable recovery source and the reason this
   repository was saved from complete loss."
```

---

## Validation

This ruleset was validated through:
- ✅ Successful recovery of creditXcredit/workstation repository
- ✅ Extraction from containers with SHA256 verification
- ✅ Complete automation with safety features
- ✅ Multi-level documentation creation
- ✅ Zero data loss during recovery

**Effectiveness**: Repository recovered in 5 minutes using containers (would have required weeks to recreate manually).

---

## Related Documents
- [RECOVERY_LESSONS_LEARNED.md](../../RECOVERY_LESSONS_LEARNED.md) - Detailed lessons from this recovery
- [AGENT_PROMPT_TEMPLATE.md](AGENT_PROMPT_TEMPLATE.md) - Prompt template for agents
- [START_HERE.md](../../START_HERE.md) - Quick recovery navigation

**Last Updated**: November 14, 2025  
**Version**: 1.0  
**Status**: Production - Validated through real recovery operation
