"""
Main FastAPI application for StackBrowserAgent backend.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from config.settings import settings
from src.agents import agent_registry, NavigatorAgent, PlannerAgent, ExecutorAgent
from src.orchestration import orchestrator
from src.routes import tasks
from src.database import init_db, close_db
from src.rag import rag_manager

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    # Startup
    logger.info("Starting StackBrowserAgent backend")
    
    # Initialize database
    await init_db()
    
    # Register default agents
    await agent_registry.register(NavigatorAgent())
    await agent_registry.register(NavigatorAgent())  # Register multiple instances
    await agent_registry.register(PlannerAgent())
    await agent_registry.register(ExecutorAgent())
    await agent_registry.register(ExecutorAgent())
    
    # Start orchestrator
    await orchestrator.start()
    
    logger.info("Backend started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down backend")
    await orchestrator.stop()
    await close_db()
    logger.info("Backend shut down")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for unified browser agent system",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks.router, prefix=settings.api_prefix)

# Import and include RAG router
from src.routes import rag
app.include_router(rag.router, prefix=settings.api_prefix)

# Import and include Workflow router
from src.routes import workflows
app.include_router(workflows.router, prefix=settings.api_prefix)

# Import and include Auth router
from src.routes import auth
app.include_router(auth.router)

# Import and include Metrics router
from src.routes import metrics
app.include_router(metrics.router)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version
    }


# Status endpoint with orchestrator stats
@app.get(f"{settings.api_prefix}/status")
async def get_status():
    """Get system status and statistics."""
    try:
        stats = await orchestrator.get_stats()
        return {
            "status": "operational",
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Error getting status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error getting system status")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "StackBrowserAgent Backend API",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "status": f"{settings.api_prefix}/status"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
