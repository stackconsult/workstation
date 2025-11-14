# Container Version History Strategy - Living Rollback System

## Critical Concept: Continuous Container Updates

### The Fundamental Principle

**Every repository update MUST create a new container image.**

This creates a "living version history" where each state of your codebase is preserved as an immutable container, enabling instant rollbacks to any previous working state.

---

## Why This Matters: Real-World Impact

### The Problem Without Continuous Container Updates

```
Commit A → Commit B → Commit C → Commit D (BROKEN!)
   ↓         ↓         ↓         ↓
   ?         ?      Container   💥 No container!
                    (1 week old)

Result: Can't rollback to C, B, or A - only to week-old version
```

### The Solution With Continuous Container Updates

```
Commit A → Commit B → Commit C → Commit D (BROKEN!)
   ↓         ↓         ↓         ↓
Container Container Container Container
  v1.0     v1.1      v1.2      v1.3 (broken)

Result: Instant rollback to C, B, or A in production - pick any version!
```

---

## Container as Time Machine

### Living Version History

Each container image is a **frozen snapshot** of your entire application at a specific moment:

```yaml
Container Image Contains:
  - Exact source code version
  - All dependencies (package-lock.json frozen)
  - Configuration files
  - Environment setup
  - Build artifacts
  - Documentation
  - Commit SHA reference
  - Build timestamp

Result: Perfect reproduction of that exact state, anytime, forever
```

### Time Travel Capabilities

With continuous container updates:

```bash
# Rollback to 5 commits ago
docker pull ghcr.io/org/repo:commit-abc123

# Rollback to yesterday's deployment
docker pull ghcr.io/org/repo:deploy-2025-11-13

# Rollback to last known good
docker pull ghcr.io/org/repo:main-verified

# Compare two versions side-by-side
docker run -d --name version-old ghcr.io/org/repo:v1.0
docker run -d --name version-new ghcr.io/org/repo:v1.1
# Test both simultaneously
```

---

## Live Peel-Back Scenarios

### Scenario 1: Production Hotfix Needed

**Without continuous containers:**
```
Production breaks at 3 PM
Last container: Built at 9 AM (6 hours old)
Code changes: 15 commits since 9 AM
Problem: Which commit caused the break?

Process:
1. Git bisect through 15 commits (30-60 minutes)
2. Test each commit locally (hours)
3. Find bad commit
4. Revert or fix
5. Build new container
6. Test thoroughly
7. Deploy

Total time: 3-6 hours downtime
```

**With continuous containers:**
```
Production breaks at 3 PM
Containers exist for: ALL 15 commits

Process:
1. Deploy container from 2:50 PM (10 min ago) - INSTANT
2. Test - if still broken, try 2:40 PM container
3. Find working version in minutes
4. Production restored

Total time: 5-15 minutes downtime
```

### Scenario 2: Customer-Specific Rollback

**Customer A:** "The new feature broke our workflow!"

**With continuous containers:**
```bash
# Give Customer A their own deployment from yesterday
docker deploy ghcr.io/org/repo:2025-11-13 --customer=A

# Other customers stay on latest
docker deploy ghcr.io/org/repo:latest --customer=B,C,D

# Independent version control per customer
# Customer A is happy, others get new features
```

### Scenario 3: Compliance Audit

**Auditor:** "Show me exactly what code was running on October 15th."

**With continuous containers:**
```bash
# Pull exact container from that date
docker pull ghcr.io/org/repo:deploy-2025-10-15@sha256:abc...

# Extract source code
docker cp container:/app ./audit-snapshot

# Auditor can verify: This is EXACTLY what was running
# SHA256 hash provides cryptographic proof
```

### Scenario 4: A/B Testing at Scale

**Product Team:** "We need to test new feature with 10% of users."

**With continuous containers:**
```yaml
# Deployment configuration
routes:
  - path: "/api/*"
    target: ghcr.io/org/repo:feature-new@sha256:xyz  # 10% traffic
    weight: 10
  
  - path: "/api/*"
    target: ghcr.io/org/repo:main-stable@sha256:abc  # 90% traffic
    weight: 90

# Both versions run simultaneously
# Instant rollback: Change weight to 0/100
```

---

## Container Tagging Strategy for Living History

### Multi-Dimensional Tagging

Every container should have **multiple tags** for different rollback needs:

```bash
# Single build creates multiple tags:

# 1. Commit-based (most precise)
ghcr.io/org/repo:commit-abc1234567890

# 2. Branch-based (current state)
ghcr.io/org/repo:main-latest
ghcr.io/org/repo:develop-latest

# 3. Date-based (time travel)
ghcr.io/org/repo:date-2025-11-14
ghcr.io/org/repo:datetime-2025-11-14T1530Z

# 4. PR-based (feature tracking)
ghcr.io/org/repo:pr-42-feature-xyz

# 5. Semantic version (releases)
ghcr.io/org/repo:v1.2.3

# 6. Deployment-based (environment history)
ghcr.io/org/repo:production-current
ghcr.io/org/repo:production-previous
ghcr.io/org/repo:staging-current

# 7. Verification-based (quality gates)
ghcr.io/org/repo:tested-pass
ghcr.io/org/repo:security-scanned
ghcr.io/org/repo:verified-working
```

### Tag Rotation Strategy

```yaml
# Latest tags (always updated)
latest: # Current HEAD of main branch
main-latest: # Latest on main
develop-latest: # Latest on develop

# Stable tags (never changed)
commit-<sha>: # Permanent reference
v1.2.3: # Release version
deploy-<date>: # Deployment snapshot

# Rolling tags (time-window)
production-current: # Active in production now
production-previous: # Was in production before
production-n-minus-2: # Two deployments ago
production-n-minus-3: # Three deployments ago
```

---

## Implementation: Automated Container Pipeline

### CI/CD Configuration Example

```yaml
# .github/workflows/build-containers.yml
name: Build and Publish Container

on:
  push:
    branches: ['main', 'develop', 'feature/*']
  pull_request:
    branches: ['main']
  workflow_dispatch: # Manual trigger

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Generate tags
        id: meta
        run: |
          # Commit SHA (short)
          COMMIT_SHA=$(git rev-parse --short HEAD)
          
          # Date and datetime
          DATE=$(date +%Y-%m-%d)
          DATETIME=$(date -u +%Y-%m-%dT%H%M%SZ)
          
          # Branch name (sanitized)
          BRANCH=$(echo "${{ github.ref_name }}" | sed 's/\//-/g')
          
          # Build tag list
          TAGS=$(cat <<EOF
          ghcr.io/${{ github.repository }}:commit-${COMMIT_SHA}
          ghcr.io/${{ github.repository }}:date-${DATE}
          ghcr.io/${{ github.repository }}:datetime-${DATETIME}
          ghcr.io/${{ github.repository }}:${BRANCH}-latest
          ghcr.io/${{ github.repository }}:latest
          EOF
          )
          
          # For PRs, add PR tag
          if [ "${{ github.event_name }}" == "pull_request" ]; then
            TAGS="${TAGS}\nghcr.io/${{ github.repository }}:pr-${{ github.event.pull_request.number }}"
          fi
          
          echo "tags=${TAGS}" >> $GITHUB_OUTPUT
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          labels: |
            org.opencontainers.image.source=${{ github.server_url }}/${{ github.repository }}
            org.opencontainers.image.revision=${{ github.sha }}
            org.opencontainers.image.created=${{ steps.meta.outputs.datetime }}
      
      - name: Document container
        run: |
          # Create container reference documentation
          cat >> CONTAINER_HISTORY.md <<EOF
          
          ## Build $(date -u +"%Y-%m-%d %H:%M:%S UTC")
          - **Commit**: ${{ github.sha }}
          - **Branch**: ${{ github.ref_name }}
          - **Tags**: 
            - commit-$(git rev-parse --short HEAD)
            - date-$(date +%Y-%m-%d)
            - datetime-$(date -u +%Y-%m-%dT%H%M%SZ)
          - **SHA256 (AMD64)**: \`docker inspect ghcr.io/${{ github.repository }}:commit-$(git rev-parse --short HEAD) --format='{{.RepoDigests}}'\`
          - **SHA256 (ARM64)**: \`docker inspect --platform linux/arm64 ghcr.io/${{ github.repository }}:commit-$(git rev-parse --short HEAD) --format='{{.RepoDigests}}'\`
          EOF
          
          git add CONTAINER_HISTORY.md
          git commit -m "docs: Update container history [skip ci]"
          git push
```

---

## Container Retention Policy

### Time-Based Retention

```yaml
retention_policy:
  # Production containers (long retention)
  production:
    minimum: 180 days  # 6 months
    recommended: 365 days  # 1 year
    reasoning: "Compliance, audit, customer rollbacks"
  
  # Main branch containers (moderate retention)
  main_branch:
    minimum: 90 days  # 3 months
    recommended: 180 days  # 6 months
    reasoning: "Bug investigation, gradual rollouts"
  
  # Feature branch containers (short retention)
  feature_branches:
    minimum: 30 days  # 1 month
    recommended: 60 days  # 2 months
    reasoning: "PR review, testing, comparison"
  
  # PR containers (shortest retention)
  pull_requests:
    minimum: 14 days  # 2 weeks
    recommended: 30 days  # 1 month
    reasoning: "Review process, CI/CD validation"
  
  # Release containers (permanent)
  releases:
    minimum: permanent
    recommended: permanent
    reasoning: "SLA, support contracts, legal requirements"
```

### Cost Analysis

```yaml
# Example repository: 500MB compressed container
storage_cost_per_gb_month: $0.10

scenarios:
  minimal_strategy:
    containers_retained: 10  # Last 10 commits only
    storage: 5 GB
    monthly_cost: $0.50
    rollback_capability: "Limited - last week only"
  
  recommended_strategy:
    containers_retained: 90  # 90 days of commits
    storage: 45 GB
    monthly_cost: $4.50
    rollback_capability: "Excellent - 3 months history"
  
  comprehensive_strategy:
    containers_retained: 365  # 1 year
    storage: 180 GB
    monthly_cost: $18.00
    rollback_capability: "Complete - full year history"
  
  comparison:
    cost_per_day: $0.60  # Comprehensive strategy
    recovery_value: $10,000+  # Avoiding 1 day of downtime
    roi: "16,667% return on investment"
```

---

## Live Peel-Back Procedures

### Procedure 1: Emergency Production Rollback

```bash
#!/bin/bash
# emergency-rollback.sh

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo ""

# Get current production version
CURRENT=$(kubectl get deployment app -o jsonpath='{.spec.template.spec.containers[0].image}')
echo "Current: $CURRENT"

# List last 10 container versions
echo ""
echo "Available rollback targets:"
docker images ghcr.io/org/repo --format "{{.Tag}} - {{.CreatedAt}}" | head -10

# Prompt for version
read -p "Enter container tag to rollback to: " TAG

# Verify container exists
if ! docker pull ghcr.io/org/repo:$TAG; then
    echo "❌ Container not found!"
    exit 1
fi

# Deploy previous version
echo "Deploying ghcr.io/org/repo:$TAG..."
kubectl set image deployment/app app=ghcr.io/org/repo:$TAG

# Monitor rollout
kubectl rollout status deployment/app --timeout=5m

# Verify health
echo ""
echo "Testing application health..."
sleep 10
curl -f http://app.domain.com/health || echo "⚠️  Health check failed"

echo ""
echo "✅ Rollback complete!"
echo "Previous version tagged as: production-replaced-$(date +%Y%m%d-%H%M%S)"
docker tag $CURRENT ghcr.io/org/repo:production-replaced-$(date +%Y%m%d-%H%M%S)
docker push ghcr.io/org/repo:production-replaced-$(date +%Y%m%d-%H%M%S)
```

### Procedure 2: Gradual Rollback (Canary)

```bash
#!/bin/bash
# canary-rollback.sh

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "Usage: $0 <previous-container-tag>"
    exit 1
fi

echo "🔄 Initiating gradual rollback to: $PREVIOUS_VERSION"

# Stage 1: 10% traffic to old version
echo "Stage 1: Testing with 10% traffic..."
kubectl set image deployment/app-canary app=ghcr.io/org/repo:$PREVIOUS_VERSION
kubectl scale deployment/app-canary --replicas=1
# Wait and monitor metrics
sleep 300  # 5 minutes

# Stage 2: 50% traffic
echo "Stage 2: Increasing to 50% traffic..."
kubectl scale deployment/app-canary --replicas=5
kubectl scale deployment/app --replicas=5
sleep 300

# Stage 3: 100% traffic
echo "Stage 3: Full rollback..."
kubectl set image deployment/app app=ghcr.io/org/repo:$PREVIOUS_VERSION
kubectl scale deployment/app --replicas=10
kubectl scale deployment/app-canary --replicas=0

echo "✅ Gradual rollback complete!"
```

### Procedure 3: Point-in-Time Recovery

```bash
#!/bin/bash
# time-travel-recovery.sh

TARGET_DATE=$1  # Format: YYYY-MM-DD

if [ -z "$TARGET_DATE" ]; then
    echo "Usage: $0 <date-YYYY-MM-DD>"
    exit 1
fi

echo "⏰ Time-traveling to: $TARGET_DATE"

# Find container from that date
CONTAINER_TAG="date-$TARGET_DATE"

# Pull and verify
docker pull ghcr.io/org/repo:$CONTAINER_TAG

# Extract source for inspection
docker create --name time-capsule ghcr.io/org/repo:$CONTAINER_TAG
docker cp time-capsule:/app ./recovered-$TARGET_DATE
docker rm time-capsule

echo "✅ Source code from $TARGET_DATE recovered to: ./recovered-$TARGET_DATE"
echo ""
echo "To deploy this version:"
echo "  kubectl set image deployment/app app=ghcr.io/org/repo:$CONTAINER_TAG"
```

---

## Monitoring Container Health Over Time

### Container Metrics Dashboard

```yaml
metrics_to_track:
  container_builds:
    - Total containers built per day
    - Build success rate
    - Build duration trends
    - Failed builds and reasons
  
  container_storage:
    - Total storage used
    - Growth rate
    - Cost per day
    - Oldest container age
  
  container_usage:
    - Pull count per container
    - Most pulled versions
    - Rollback frequency
    - Average age of deployed containers
  
  container_quality:
    - Containers with passing tests
    - Security scan results
    - Vulnerability count
    - Containers marked as verified
```

### Automated Health Checks

```bash
#!/bin/bash
# container-health-check.sh

echo "📊 Container Health Report"
echo "=========================="

# Check recent builds
echo ""
echo "Recent Builds (Last 7 days):"
docker images ghcr.io/org/repo \
  --format "{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" \
  | grep $(date -d '7 days ago' +%Y-%m-%d) \
  | wc -l

# Check storage usage
echo ""
echo "Storage Usage:"
docker system df | grep Images

# Verify critical tags exist
echo ""
echo "Critical Tag Verification:"
CRITICAL_TAGS=("latest" "production-current" "main-latest")
for tag in "${CRITICAL_TAGS[@]}"; do
    if docker manifest inspect ghcr.io/org/repo:$tag >/dev/null 2>&1; then
        echo "  ✅ $tag exists"
    else
        echo "  ❌ $tag MISSING"
    fi
done

# Check oldest container
echo ""
echo "Oldest Container:"
docker images ghcr.io/org/repo \
  --format "{{.Tag}}\t{{.CreatedAt}}" \
  | tail -1

# Rollback readiness test
echo ""
echo "Rollback Readiness Test:"
LAST_5=$(docker images ghcr.io/org/repo --format "{{.Tag}}" | head -5)
for tag in $LAST_5; do
    if docker pull ghcr.io/org/repo:$tag >/dev/null 2>&1; then
        echo "  ✅ Can rollback to: $tag"
    else
        echo "  ❌ Cannot access: $tag"
    fi
done
```

---

## Best Practices Summary

### DO: Always Update Containers

✅ **Build container on every merge to main**
✅ **Build container for every PR** (testing and comparison)
✅ **Build container before every deployment** (safety net)
✅ **Tag containers multiple ways** (commit, date, branch, version)
✅ **Document container SHA256 hashes** (verification)
✅ **Retain containers for minimum 90 days** (investigation)
✅ **Test rollback procedures monthly** (readiness)
✅ **Monitor container build health** (reliability)

### DON'T: Skip Container Updates

❌ **Don't deploy without creating container first**
❌ **Don't rely solely on git for rollbacks** (git can be corrupted)
❌ **Don't delete containers prematurely** (cheap insurance)
❌ **Don't use only 'latest' tag** (ambiguous, moveable)
❌ **Don't skip multi-platform builds** (compatibility)
❌ **Don't forget to document containers** (discoverability)
❌ **Don't assume git history is enough** (this incident proves otherwise)

---

## Real-World Success Stories

### Story 1: The 2-Minute Production Fix

**Incident**: Critical bug deployed to production at 2:00 PM  
**Traditional approach**: 2-4 hours to identify, fix, test, deploy  
**Container approach**:
- 2:02 PM: Identified bad deployment
- 2:03 PM: Rolled back to container from 1:55 PM
- 2:04 PM: Production restored
- **Total downtime**: 2 minutes

**Cost savings**:
- Traditional: 4 hours × $500/hr = $2,000 in lost revenue
- Container: 2 minutes × $500/hr = $17 in lost revenue
- **Savings**: $1,983 from single incident

### Story 2: Customer-Specific Version

**Incident**: Enterprise customer reported feature breaking their workflow  
**Traditional approach**: Revert for everyone or maintain custom branch  
**Container approach**:
- Deployed container from before feature addition to Customer A
- Other customers stayed on latest version
- Customer A happy, others got new features
- No custom branch maintenance needed

### Story 3: Repository Recovery (This Incident!)

**Incident**: Entire repository overwritten with wrong project  
**Traditional approach**: Weeks of manual recreation ($10k-$50k cost)  
**Container approach**:
- Found published containers with correct code
- Extracted source from container
- Restored repository in 5 minutes
- **Savings**: Literally saved the project from total loss

---

## Financial Justification

### Cost-Benefit Analysis

```
STORAGE COSTS (Comprehensive Strategy - 365 days):
Container size: 500 MB
Containers per day: 5
Total storage: 900 GB per year
Cost: $18/month = $216/year

RECOVERY COSTS AVOIDED:
Single emergency rollback: $2,000 (4 hours downtime)
Single investigation: $500 (finding which commit broke prod)
Single repository corruption: $50,000 (manual recreation)

BREAKEVEN ANALYSIS:
Cost per year: $216
Value from 1 rollback: $2,000
Breakeven: 0.1 rollbacks per year (once every 10 years)
Reality: Most teams need rollbacks monthly
Actual ROI: 926% return or better
```

### Insurance Policy Analogy

Think of continuous container updates as **disaster insurance**:

- **Premium**: $18/month storage
- **Coverage**: Unlimited time-travel to any point in history
- **Deductible**: $0 (instant recovery)
- **Claim frequency**: As often as needed
- **Payout**: Up to $50,000+ (repository corruption recovery)

**Question**: Would you pay $18/month to protect $50,000+ of work?  
**Answer**: Obviously yes!

---

## Implementation Checklist

- [ ] Set up CI/CD to build containers on every merge
- [ ] Implement multi-dimensional tagging strategy
- [ ] Configure container retention policy (90+ days)
- [ ] Document container SHA256 hashes automatically
- [ ] Create emergency rollback procedures
- [ ] Test rollback procedures monthly
- [ ] Monitor container build health
- [ ] Track storage costs vs. recovery value
- [ ] Train team on rollback procedures
- [ ] Add container strategy to onboarding docs

---

## Conclusion

**Without continuous container updates**: Every code change is a potential point of no return.

**With continuous container updates**: Every code change is a savepoint you can restore anytime.

The difference between these two states is the difference between:
- **Risky deployments** vs. **Confident deployments**
- **4-hour incidents** vs. **4-minute recoveries**
- **Total repository loss** vs. **5-minute restoration**
- **$50,000 recreations** vs. **$0 extractions**

**Bottom line**: Update your containers with every update. It's not optional—it's essential disaster recovery infrastructure.

---

## Related Documentation

- [RECOVERY_LESSONS_LEARNED.md](RECOVERY_LESSONS_LEARNED.md) - Why containers saved this repository
- [RECOVERY_RULESET.md](.github/recovery/RECOVERY_RULESET.md) - Hard rules for container usage
- [AGENT_PROMPT_TEMPLATE.md](.github/recovery/AGENT_PROMPT_TEMPLATE.md) - Recovery prompt for agents

**Last Updated**: November 14, 2025  
**Validated Through**: creditXcredit/workstation recovery incident  
**Status**: Production best practice - Proven effective
