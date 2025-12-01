#!/bin/bash
# Deploy to Kubernetes Production Environment

set -e

echo "🚀 Deploying stackBrowserAgent to Production..."

# Safety check
read -p "⚠️  Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl."
    exit 1
fi

# Create namespace if it doesn't exist
echo "📦 Creating production namespace..."
kubectl create namespace production --dry-run=client -o yaml | kubectl apply -f -

# Apply production configuration
echo "⚙️  Applying production configuration..."
kubectl apply -k k8s/production/

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/prod-stackbrowseragent -n production --timeout=600s

# Check pod status
echo "✅ Deployment complete! Pod status:"
kubectl get pods -n production -l app=stackbrowseragent

# Get service information
echo "
📊 Service Information:"
kubectl get svc -n production -l app=stackbrowseragent

# Get ingress information
echo "
🌐 Ingress Information:"
kubectl get ingress -n production

# Get HPA status
echo "
📈 HPA Status:"
kubectl get hpa -n production

echo "
✨ Production deployment completed successfully!"
echo "🔗 Access the application at: https://stackbrowseragent.example.com"
