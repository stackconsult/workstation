# Phase 5: Quick Start Guide

## 🚀 Quick Deploy

### 1. Install & Build (2 minutes)
```bash
# Clone and install
cd workstation
npm install

# Build everything
npm run build:all
```

### 2. Deploy to Staging (5 minutes)
```bash
# Deploy to Kubernetes staging
./scripts/deploy-k8s-staging.sh

# Verify deployment
kubectl get pods -n staging
kubectl get svc -n staging
kubectl get ingress -n staging
```

### 3. Test Performance (4 minutes)
```bash
# Run load tests
BASE_URL=https://staging.stackbrowseragent.example.com \
  ./scripts/run-load-tests.sh

# View results
cat tests/load/results/*.json
```

### 4. Deploy to Production (10 minutes)
```bash
# Deploy to production (requires confirmation)
./scripts/deploy-k8s-production.sh

# Monitor rollout
kubectl rollout status deployment/prod-stackbrowseragent -n production

# Check HPA
kubectl get hpa -n production
```

## 📁 File Locations

### React UI
```
src/ui/dashboard/
├── App.tsx                    # Main app
├── pages/                     # 5 pages
│   ├── OverviewPage.tsx
│   ├── AgentsPage.tsx
│   ├── WorkflowsPage.tsx
│   ├── MonitoringPage.tsx
│   └── SettingsPage.tsx
└── components/                # 15+ components
```

### Kubernetes
```
k8s/
├── base/                      # Base manifests
├── staging/                   # Staging overlay
└── production/                # Production overlay
```

### Performance
```
src/middleware/performance.ts  # Performance middleware
tests/load/                    # k6 load tests
scripts/run-load-tests.sh      # Test runner
```

## 🔧 Common Commands

### Development
```bash
# Run backend in dev mode
npm run dev

# Run UI in dev mode (separate terminal)
npm run dev:ui

# Lint code
npm run lint

# Run tests
npm test
```

### Build
```bash
# Build backend only
npm run build

# Build UI only
npm run build:ui

# Build everything
npm run build:all
```

### Deploy
```bash
# Deploy staging
./scripts/deploy-k8s-staging.sh

# Deploy production
./scripts/deploy-k8s-production.sh

# Check deployment status
kubectl get all -n staging
kubectl get all -n production
```

### Monitoring
```bash
# View pods
kubectl get pods -n production -w

# View logs
kubectl logs -f deployment/prod-stackbrowseragent -n production

# View HPA status
kubectl get hpa -n production -w

# View metrics
curl https://stackbrowseragent.example.com/api/metrics/dashboard
```

## 🎯 Performance Checklist

- [ ] Build completes successfully (`npm run build:all`)
- [ ] Linter passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] Staging deployed (`kubectl get pods -n staging`)
- [ ] Load tests pass (`./scripts/run-load-tests.sh`)
- [ ] p95 response time < 500ms
- [ ] Error rate < 1%
- [ ] Production deployed
- [ ] HPA scaling works
- [ ] Health checks passing

## 🐛 Troubleshooting

### UI Not Building
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build:all
```

### K8s Deployment Fails
```bash
# Check pod status
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace>

# Check secrets
kubectl get secrets -n <namespace>
```

### Load Tests Failing
```bash
# Check if application is running
curl http://localhost:3000/health/live

# Run single test
k6 run tests/load/basic-load-test.js

# Lower concurrent users
# Edit test files and reduce target numbers
```

### High Error Rate
```bash
# Check resource limits
kubectl top pods -n production

# Scale up manually
kubectl scale deployment prod-stackbrowseragent --replicas=10 -n production

# Check HPA
kubectl describe hpa -n production
```

## 📊 Metrics Endpoints

```bash
# Health checks
GET /health/live
GET /health/ready

# Dashboard metrics
GET /api/metrics/dashboard

# Performance metrics
GET /api/metrics/performance

# Resource metrics
GET /api/metrics/resources

# Activity feed
GET /api/activity/recent?limit=10

# Error logs
GET /api/logs/errors?limit=10
```

## 🔐 Security

### Update Secrets
```bash
# Generate new JWT secret
echo -n "new-secret-$(openssl rand -hex 32)" | base64

# Update secret
kubectl create secret generic stackbrowseragent-secrets \
  --from-literal=jwt-secret=<base64-value> \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to pick up new secret
kubectl rollout restart deployment/prod-stackbrowseragent -n production
```

### SSL Certificates
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f k8s/base/cluster-issuer.yaml

# Certificates are auto-generated via ingress annotations
```

## 📈 Scaling

### Manual Scaling
```bash
# Scale up
kubectl scale deployment prod-stackbrowseragent --replicas=15 -n production

# Scale down
kubectl scale deployment prod-stackbrowseragent --replicas=5 -n production
```

### Auto-Scaling
```bash
# View HPA
kubectl get hpa -n production

# Edit HPA
kubectl edit hpa prod-stackbrowseragent-hpa -n production

# Adjust thresholds in k8s/production/hpa-patch.yaml
```

## 🎉 Success Indicators

✅ All pods running: `kubectl get pods -n production | grep Running`
✅ HPA active: `kubectl get hpa -n production`
✅ Ingress configured: `kubectl get ingress -n production`
✅ Health checks passing: `curl https://domain.com/health/live`
✅ Metrics available: `curl https://domain.com/api/metrics/dashboard`
✅ Load tests passing: Green summary in `tests/load/results/`

## 📞 Support

- Documentation: `PHASE5_IMPLEMENTATION.md`
- Full Summary: `PHASE5_COMPLETE_SUMMARY.md`
- Issues: Create GitHub issue
- Logs: `kubectl logs -f deployment/<name> -n <namespace>`
