#!/bin/bash
# Railway startup script

set -e

echo "🚀 Starting stackBrowserAgent backend..."

# Run database migrations (if using Alembic)
if [ -d "alembic" ]; then
    echo "📦 Running database migrations..."
    alembic upgrade head
fi

# Initialize database
echo "🗄️  Initializing database..."
python -c "
from src.database.connection import init_db
import asyncio
asyncio.run(init_db())
print('Database initialized successfully')
"

# Start the application
echo "✅ Starting FastAPI server on port ${PORT:-8000}..."
exec uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2
