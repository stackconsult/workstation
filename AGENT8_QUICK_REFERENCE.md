# Agent 8 Quick Reference

## 🚀 Quick Commands

```bash
# Run assessment manually
npm run agent8:assess

# Run weekly automation script
npm run agent8:weekly

# Build Agent 8
npm run agent8:build

# View latest report
cat agents/agent8/reports/*/ASSESSMENT_REPORT.md | tail -50

# Check handoff artifact
cat .agent8-handoff.json

# View memory history
cat agents/agent8/memory/assessment-history.json
```

## 🐳 Docker Commands

```bash
# Build container
docker-compose build agent8-auditor

# Start Agent 8
docker-compose up -d agent8-auditor

# View logs
docker logs agent8-auditor -f

# Stop Agent 8
docker-compose stop agent8-auditor

# Restart Agent 8
docker-compose restart agent8-auditor

# Remove container
docker-compose down agent8-auditor
```

## 📊 Check Results

| Check ID | Category | Description | Severity |
|----------|----------|-------------|----------|
| EH-01 | Error Handling | Specific error types | High |
| EH-02 | Error Handling | User-friendly messages | Medium |
| EH-03 | Error Handling | Error logging | High |
| EH-04 | Error Handling | No empty catch blocks | Critical |
| EH-05 | Error Handling | HTTP status codes | High |
| EH-06 | Error Handling | Database errors | High |
| CQ-01 | Code Quality | Function length <50 lines | Low |
| CQ-02 | Code Quality | Complexity <10 | Medium |
| CQ-03 | Code Quality | No hardcoded values | High |
| CQ-04 | Code Quality | Comment quality | Low |
| CQ-05 | Code Quality | Type safety | Medium |
| CQ-06 | Code Quality | DRY principle | Medium |
| DOC-01 | Documentation | JSDoc comments | High |
| DOC-02 | Documentation | README complete | High |
| DOC-03 | Documentation | API docs | Medium |
| DOC-04 | Documentation | Env vars documented | High |
| DOC-05 | Documentation | Inline comments | Medium |
| DOC-06 | Documentation | CHANGELOG | Low |
| SEC-01 | Security | No secrets | Critical |
| SEC-02 | Security | Input validation | Critical |
| SEC-03 | Security | SQL injection | Critical |
| SEC-04 | Security | XSS prevention | Critical |
| SEC-05 | Security | CSRF protection | High |
| SEC-06 | Security | Rate limiting | High |

## 📁 Directory Structure

```
agents/agent8/
├── src/                          # Source code
├── checklists/                   # Assessment criteria
├── reports/                      # Generated reports
├── memory/                       # MCP memory
└── run-weekly-assessment.sh      # Automation script
```

## ⏰ Schedule

- **Frequency:** Weekly
- **Day:** Saturday
- **Time:** 2:00 AM MST
- **Cron:** `0 2 * * 6`

## 🔄 Workflow

```
Agent 7 (Security) → Agent 8 (Assessment) → Agent 9 (Optimization)
```

## 📈 Grading Scale

- **A+:** 95-100 points
- **A:** 90-94 points
- **A-:** 85-89 points
- **B+:** 80-84 points (Minimum for Agent 9)
- **B:** 75-79 points
- **Below B:** Optimization required

## ⚠️ Approval Criteria

Agent 9 proceeds only if:
- Grade ≥ B+
- Critical issues = 0
- High issues ≤ 2

## 🔧 Troubleshooting

### Assessment fails
```bash
cd agents/agent8
npm install
npm run build
npm run assess
```

### Docker issues
```bash
docker-compose build agent8-auditor --no-cache
docker-compose up -d agent8-auditor
docker logs agent8-auditor
```

### Memory corruption
```bash
echo '[]' > agents/agent8/memory/assessment-history.json
docker volume rm agent8-assessment-memory
```

## 📞 Support

- **Documentation:** `agents/agent8/README.md`
- **Reports:** `agents/agent8/reports/`
- **Logs:** `docker logs agent8-auditor`
- **Status:** `.agent8-complete.json`
