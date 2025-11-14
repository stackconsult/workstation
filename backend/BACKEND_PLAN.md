# Backend Architecture Plan

## Hybrid System Overview

This document outlines the Python FastAPI backend that complements the Chrome extension, creating a complete hybrid browser agent system.

## Architecture Components

### Frontend (Chrome Extension - Already Built ✅)
- React/TypeScript UI (sidepanel + popup)
- Browser automation via Chrome APIs
- Local LLM support (Ollama)
- Client-side agents and workflows
- Chrome storage for settings

### Backend (Python FastAPI - To Build 🚧)
- RESTful API for extension communication
- Persistent database (SQLite → PostgreSQL)
- Advanced orchestration and agent management
- RAG system for contextual memory
- Multi-user support with authentication
- Cloud LLM integration
- Logging and monitoring
- CI/CD and deployment

## 8-Segment Build Plan

### ✅ Segment 1: Foundation & Configuration
- [x] Project structure
- [ ] Configuration management (YAML/ENV)
- [ ] Constants and settings
- [ ] Logging setup
- [ ] Health check endpoints

### 🚧 Segment 2: Orchestration & Agent Framework (CURRENT)
- [ ] Agent lifecycle management
- [ ] Task queue and dispatcher
- [ ] Agent registry and discovery
- [ ] Task execution with retries
- [ ] Status tracking and updates
- [ ] Concurrency management
- [ ] Agent communication protocol

### ⏳ Segment 3: Database & Persistence
- [ ] SQLite/PostgreSQL setup
- [ ] Models: Users, Tasks, Agents, Results, Workflows
- [ ] Database migrations (Alembic)
- [ ] Query optimization
- [ ] Connection pooling

### ⏳ Segment 4: LLM & RAG Integration
- [ ] LLM provider abstraction
- [ ] Vector database (ChromaDB/Pinecone)
- [ ] Embeddings generation
- [ ] Context retrieval
- [ ] Memory management
- [ ] Streaming responses

### ⏳ Segment 5: Workflow Engine
- [ ] Workflow definitions and storage
- [ ] Step execution engine
- [ ] Conditional logic
- [ ] Error handling and recovery
- [ ] Workflow templates
- [ ] Scheduling

### ⏳ Segment 6: API & Authentication
- [ ] REST endpoints
- [ ] JWT authentication
- [ ] API key management
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] WebSocket for real-time updates

### ⏳ Segment 7: Testing & Monitoring
- [ ] Unit tests (Pytest)
- [ ] Integration tests
- [ ] Load testing
- [ ] Logging (structured JSON)
- [ ] Metrics (Prometheus)
- [ ] Health checks
- [ ] Error tracking

### ⏳ Segment 8: Deployment & DevOps
- [ ] Docker containerization
- [ ] Docker Compose setup
- [ ] CI/CD pipelines (GitHub Actions)
- [ ] Railway/Render deployment
- [ ] Environment management
- [ ] Backup strategies
- [ ] Rollback procedures

## API Endpoints Overview

### Agent Management
- `POST /api/agents/register` - Register new agent
- `GET /api/agents` - List all agents
- `GET /api/agents/{id}` - Get agent details
- `POST /api/agents/{id}/execute` - Execute agent task
- `DELETE /api/agents/{id}` - Deregister agent

### Task Management
- `POST /api/tasks` - Create new task
- `GET /api/tasks` - List tasks with filtering
- `GET /api/tasks/{id}` - Get task details
- `PATCH /api/tasks/{id}` - Update task status
- `DELETE /api/tasks/{id}` - Cancel task

### Workflow Management
- `POST /api/workflows` - Create workflow
- `GET /api/workflows` - List workflows
- `POST /api/workflows/{id}/execute` - Execute workflow
- `GET /api/workflows/{id}/status` - Get execution status

### User & Auth
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/users/me` - Current user profile

### System
- `GET /api/health` - Health check
- `GET /api/metrics` - System metrics
- `GET /api/status` - Service status

## Technology Stack

### Core Framework
- **FastAPI** - Modern async web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation

### Database
- **SQLAlchemy** - ORM
- **Alembic** - Migrations
- **SQLite/PostgreSQL** - Database

### AI/ML
- **LangChain** - LLM orchestration
- **ChromaDB** - Vector database
- **OpenAI/Anthropic** - LLM providers

### Task Queue
- **Celery** or **asyncio** - Async task execution
- **Redis** - Task broker (optional)

### Monitoring
- **Prometheus** - Metrics
- **Grafana** - Dashboards
- **Sentry** - Error tracking

### Testing
- **Pytest** - Testing framework
- **pytest-asyncio** - Async testing
- **pytest-cov** - Coverage

### Deployment
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Railway/Render** - Hosting

## Integration with Chrome Extension

### Communication Flow
1. Extension sends request to backend API
2. Backend authenticates and validates request
3. Backend creates task and assigns to agent
4. Agent executes task (may call LLM, query DB, etc.)
5. Backend returns result to extension
6. Extension displays result in UI

### Data Sync
- Extension can work offline (local mode)
- Extension syncs with backend when online
- Backend provides persistent storage
- Backend enables multi-device sync

### Use Cases Enabled by Backend
1. **Persistent Context** - Remember previous interactions
2. **Advanced RAG** - Search across all past tasks
3. **Multi-user Workflows** - Share workflows with team
4. **Scheduled Tasks** - Run automation on schedule
5. **Analytics** - Track usage and performance
6. **Team Collaboration** - Shared agent libraries

## Security Considerations

- JWT tokens with refresh mechanism
- API key rotation
- Rate limiting per user
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS properly configured
- Secrets in environment variables
- HTTPS only in production

## Performance Targets

- API response time: < 200ms (p95)
- Task execution: < 5s for simple tasks
- Concurrent requests: 1000+ req/s
- Database queries: < 50ms
- WebSocket latency: < 100ms
- Agent spawn time: < 1s

## Development Workflow

1. **Local Development**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn src.main:app --reload
   ```

2. **Testing**
   ```bash
   pytest tests/ -v --cov=src
   ```

3. **Docker Build**
   ```bash
   docker build -t stackbrowseragent-backend .
   docker run -p 8000:8000 stackbrowseragent-backend
   ```

4. **Deployment**
   - Push to main branch
   - GitHub Actions runs tests
   - Auto-deploy to Railway/Render
   - Health check verification

## Next Steps (Immediate)

1. ✅ Create backend directory structure
2. 🚧 Implement Segment 2: Orchestration & Agent Framework
   - Agent base classes
   - Task queue system
   - Agent registry
   - Execution engine
   - Status tracking
3. ⏳ Set up FastAPI application
4. ⏳ Create initial API endpoints
5. ⏳ Add database models
6. ⏳ Implement authentication

## File Structure

```
backend/
├── config/
│   ├── settings.py           # Configuration management
│   ├── constants.py          # Constants
│   └── agents_config.yaml    # Agent definitions
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base.py          # Base agent class
│   │   ├── registry.py      # Agent registry
│   │   └── specialized/     # Specialized agents
│   ├── orchestration/
│   │   ├── __init__.py
│   │   ├── orchestrator.py  # Main orchestrator
│   │   ├── dispatcher.py    # Task dispatcher
│   │   ├── queue.py         # Task queue
│   │   └── executor.py      # Task executor
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── agents.py        # Agent endpoints
│   │   ├── tasks.py         # Task endpoints
│   │   ├── workflows.py     # Workflow endpoints
│   │   └── health.py        # Health check
│   ├── models/
│   │   ├── __init__.py
│   │   ├── database.py      # DB setup
│   │   ├── agent.py         # Agent model
│   │   ├── task.py          # Task model
│   │   └── user.py          # User model
│   └── utils/
│       ├── __init__.py
│       ├── logging.py       # Logger setup
│       └── errors.py        # Error handlers
├── tests/
│   ├── __init__.py
│   ├── test_agents.py
│   ├── test_orchestration.py
│   └── test_api.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```
