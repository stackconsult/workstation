"""
RAG and context management API endpoints.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from src.rag import rag_manager, intent_parser

router = APIRouter(prefix="/rag", tags=["rag"])


class AddContextRequest(BaseModel):
    """Request to add context to RAG."""
    content: str = Field(..., description="Context content")
    content_type: str = Field(..., description="Type of content (task, workflow, page)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class SearchContextRequest(BaseModel):
    """Request to search context."""
    query: str = Field(..., description="Search query")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of results")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Metadata filters")


class ParseIntentRequest(BaseModel):
    """Request to parse intent."""
    command: str = Field(..., description="User command")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Optional context")


@router.post("/context")
async def add_context(request: AddContextRequest):
    """
    Add context to the RAG system.
    """
    try:
        metadata = {
            **request.metadata,
            "content_type": request.content_type
        }
        
        context_id = await rag_manager.add_context(
            content=request.content,
            metadata=metadata
        )
        
        return {
            "context_id": context_id,
            "status": "added"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding context: {str(e)}")


@router.post("/search")
async def search_context(request: SearchContextRequest):
    """
    Search for relevant context using semantic similarity.
    """
    try:
        results = await rag_manager.search_context(
            query=request.query,
            top_k=request.top_k,
            filters=request.filters
        )
        
        # Rerank results
        reranked = await rag_manager.rerank_results(request.query, results)
        
        return {
            "query": request.query,
            "results": reranked,
            "count": len(reranked)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching context: {str(e)}")


@router.post("/parse-intent")
async def parse_intent(request: ParseIntentRequest):
    """
    Parse user command into structured intent.
    """
    try:
        intent = await intent_parser.parse(
            command=request.command,
            context=request.context
        )
        
        return intent
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing intent: {str(e)}")


@router.delete("/context/{context_id}")
async def delete_context(context_id: str):
    """
    Delete context from RAG system.
    """
    try:
        success = await rag_manager.clear_context(context_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Context not found")
        
        return {
            "context_id": context_id,
            "status": "deleted"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting context: {str(e)}")
