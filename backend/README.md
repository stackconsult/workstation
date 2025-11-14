# StackBrowserAgent Backend

Python FastAPI backend for the unified browser agent system.

## Features

- **Orchestration Engine**: Task queue, priority management, worker pool
- **Agent Framework**: Specialized agents (Navigator, Planner, Executor, etc.)
- **Async Processing**: Concurrent task execution with retry logic
- **RESTful API**: Full API for task and agent management
- **Health Monitoring**: Status endpoints and metrics
- **Scalable**: Supports multiple concurrent agents and tasks

## Quick Start

### 1. Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env and set SECRET_KEY
```

### 2. Run the Server

```bash
# Development mode (with auto-reload)
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
python src/main.py
```

### 3. Access the API

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **System Status**: http://localhost:8000/api/status

## API Endpoints

### Tasks

- `POST /api/tasks` - Create new task
- `GET /api/tasks/{id}` - Get task status
- `GET /api/tasks` - List tasks
- `DELETE /api/tasks/{id}` - Cancel task

### System

- `GET /health` - Health check
- `GET /api/status` - System status and stats

## Example Usage

### Create a Task

```bash
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "navigate",
    "description": "Navigate to example.com",
    "priority": "high",
    "input_data": {"url": "https://example.com"}
  }'
```

### Get Task Status

```bash
curl http://localhost:8000/api/tasks/{task_id}
```

### List Active Tasks

```bash
curl http://localhost:8000/api/tasks?status=active
```

## Architecture

### Components

1. **Orchestrator** (`src/orchestration/orchestrator.py`)
   - Manages task lifecycle
   - Coordinates agent execution
   - Handles retries and failures
   - Worker pool management

2. **Task Queue** (`src/orchestration/queue.py`)
   - Priority-based task queuing
   - Concurrent task limits
   - Task status tracking

3. **Agent Registry** (`src/agents/registry.py`)
   - Agent registration and discovery
   - Load balancing
   - Health monitoring

4. **Base Agents** (`src/agents/base.py`)
   - Navigator, Planner, Executor agents
   - Extensible agent framework
   - Task execution lifecycle

### Flow

```
Client → API → Task Queue → Orchestrator → Agent → Execution → Result
```

## Configuration

Edit `.env` file:

```env
# Core settings
DEBUG=false
API_PORT=8000
SECRET_KEY=your-secret-key

# Agent settings
MAX_CONCURRENT_AGENTS=20
AGENT_TIMEOUT_SECONDS=300
TASK_RETRY_LIMIT=3

# LLM API keys (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Development

### Run Tests

```bash
pytest tests/ -v --cov=src
```

### Code Formatting

```bash
black src/
isort src/
flake8 src/
```

## Integration with Chrome Extension

The Chrome extension can communicate with this backend:

```typescript
// In extension
const response = await fetch('http://localhost:8000/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'navigate',
    description: 'Navigate to page',
    input_data: { url: 'https://example.com' }
  })
});

const { task_id } = await response.json();

// Poll for status
const status = await fetch(`http://localhost:8000/api/tasks/${task_id}`);
const taskData = await status.json();
```

## Docker Support

```bash
# Build image
docker build -t stackbrowseragent-backend .

# Run container
docker run -p 8000:8000 -e SECRET_KEY=your-key stackbrowseragent-backend
```

## Production Deployment

See [BACKEND_PLAN.md](./BACKEND_PLAN.md) for detailed deployment guide including:
- Railway/Render deployment
- Environment configuration
- CI/CD setup
- Monitoring and logging

## Next Steps

- [ ] Add database persistence (SQLAlchemy models)
- [ ] Implement authentication (JWT)
- [ ] Add RAG system with vector database
- [ ] Create workflow engine
- [ ] Add WebSocket support for real-time updates
- [ ] Implement comprehensive tests
- [ ] Add Docker Compose setup
- [ ] Create CI/CD pipelines

## License

MIT
