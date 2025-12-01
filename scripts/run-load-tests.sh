#!/bin/bash
# Run K6 Load Tests

set -e

echo "🧪 Running K6 Load Tests..."

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 not found. Installing k6..."
    
    # Install k6 based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install k6
    else
        echo "⚠️  Please install k6 manually: https://k6.io/docs/getting-started/installation"
        exit 1
    fi
fi

# Get base URL
BASE_URL=${BASE_URL:-"http://localhost:3000"}
echo "📍 Testing: $BASE_URL"

# Create results directory
mkdir -p tests/load/results

# Run basic load test
echo "
1️⃣ Running basic load test..."
k6 run --out json=tests/load/results/basic-$(date +%Y%m%d-%H%M%S).json tests/load/basic-load-test.js

# Run stress test (optional, commented out by default)
# echo "
# 2️⃣ Running stress test..."
# k6 run --out json=tests/load/results/stress-$(date +%Y%m%d-%H%M%S).json tests/load/stress-test.js

# Run spike test
echo "
3️⃣ Running spike test..."
k6 run --out json=tests/load/results/spike-$(date +%Y%m%d-%H%M%S).json tests/load/spike-test.js

echo "
✅ All load tests completed!"
echo "📊 Results saved in tests/load/results/"
