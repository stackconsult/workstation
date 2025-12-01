#!/bin/bash
# Deploy to Kubernetes Staging Environment

set -e

echo "🚀 Deploying stackBrowserAgent to Staging..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl."
    exit 1
fi

# Check if kustomize is available
if ! command -v kustomize &> /dev/null; then
    echo "⚠️  kustomize not found. Using kubectl's built-in kustomize..."
    KUSTOMIZE_CMD="kubectl apply -k"
else
    KUSTOMIZE_CMD="kustomize build | kubectl apply -f -"
fi

# Create namespace if it doesn't exist
echo "📦 Creating staging namespace..."
kubectl create namespace staging --dry-run=client -o yaml | kubectl apply -f -

# Apply staging configuration
echo "⚙️  Applying staging configuration..."
kubectl apply -k k8s/staging/

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/staging-stackbrowseragent -n staging --timeout=300s

# Check pod status
echo "✅ Deployment complete! Pod status:"
kubectl get pods -n staging -l app=stackbrowseragent

# Get service information
echo "
📊 Service Information:"
kubectl get svc -n staging -l app=stackbrowseragent

# Get ingress information
echo "
🌐 Ingress Information:"
kubectl get ingress -n staging

echo "
✨ Staging deployment completed successfully!"
echo "🔗 Access the application at: https://staging.stackbrowseragent.example.com"
