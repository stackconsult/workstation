"""
RAG (Retrieval Augmented Generation) Manager with Pinecone/ChromaDB support.
"""
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
import openai
from config.settings import settings
import logging
import hashlib
import json

logger = logging.getLogger(__name__)


class RAGManager:
    """
    Advanced RAG manager with:
    - Vector database (ChromaDB/Pinecone)
    - Semantic search with BM25-style reranking
    - Context caching
    - Multi-source context retrieval
    """
    
    def __init__(self, use_pinecone: bool = False):
        self.use_pinecone = use_pinecone
        
        if use_pinecone:
            try:
                import pinecone
                pinecone.init(
                    api_key=settings.pinecone_api_key,
                    environment=settings.pinecone_environment
                )
                self.index = pinecone.Index(settings.pinecone_index_name)
                logger.info("Initialized Pinecone vector database")
            except Exception as e:
                logger.warning(f"Failed to initialize Pinecone: {e}, falling back to ChromaDB")
                self._init_chromadb()
        else:
            self._init_chromadb()
    
    def _init_chromadb(self):
        """Initialize ChromaDB."""
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=settings.chroma_persist_directory
        ))
        
        # Create or get collection
        self.collection = self.client.get_or_create_collection(
            name="stackbrowseragent",
            metadata={"description": "Browser agent context storage"}
        )
        logger.info("Initialized ChromaDB vector database")
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text using OpenAI.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector
        """
        try:
            if settings.openai_api_key:
                response = await openai.Embedding.acreate(
                    model=settings.embedding_model,
                    input=text
                )
                return response['data'][0]['embedding']
            else:
                # Fallback to simple hash-based embedding for testing
                return self._simple_embedding(text)
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return self._simple_embedding(text)
    
    def _simple_embedding(self, text: str, dim: int = 384) -> List[float]:
        """Simple hash-based embedding for testing without API key."""
        hash_obj = hashlib.sha256(text.encode())
        hash_bytes = hash_obj.digest()
        
        # Convert to normalized vector
        embedding = []
        for i in range(min(dim, len(hash_bytes))):
            embedding.append((hash_bytes[i] / 255.0) * 2 - 1)
        
        # Pad if needed
        while len(embedding) < dim:
            embedding.append(0.0)
        
        return embedding[:dim]
    
    async def add_context(
        self,
        content: str,
        metadata: Dict[str, Any],
        context_id: Optional[str] = None
    ) -> str:
        """
        Add context to the vector database.
        
        Args:
            content: Context content
            metadata: Metadata about the context
            context_id: Optional ID for the context
            
        Returns:
            Context ID
        """
        if not context_id:
            context_id = hashlib.md5(content.encode()).hexdigest()
        
        # Generate embedding
        embedding = await self.generate_embedding(content)
        
        if self.use_pinecone and hasattr(self, 'index'):
            # Store in Pinecone
            self.index.upsert(
                vectors=[(context_id, embedding, metadata)]
            )
        else:
            # Store in ChromaDB
            self.collection.add(
                embeddings=[embedding],
                documents=[content],
                metadatas=[metadata],
                ids=[context_id]
            )
        
        logger.info(f"Added context {context_id} to vector database")
        return context_id
    
    async def search_context(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant context using semantic similarity.
        
        Args:
            query: Search query
            top_k: Number of results to return
            filters: Optional metadata filters
            
        Returns:
            List of relevant contexts with scores
        """
        # Generate query embedding
        query_embedding = await self.generate_embedding(query)
        
        if self.use_pinecone and hasattr(self, 'index'):
            # Search in Pinecone
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filters
            )
            
            return [
                {
                    "id": match['id'],
                    "score": match['score'],
                    "metadata": match['metadata']
                }
                for match in results['matches']
            ]
        else:
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=filters
            )
            
            contexts = []
            if results['ids'] and len(results['ids'][0]) > 0:
                for i, doc_id in enumerate(results['ids'][0]):
                    contexts.append({
                        "id": doc_id,
                        "content": results['documents'][0][i],
                        "score": results['distances'][0][i] if results['distances'] else 1.0,
                        "metadata": results['metadatas'][0][i] if results['metadatas'] else {}
                    })
            
            return contexts
    
    async def rerank_results(
        self,
        query: str,
        results: List[Dict[str, Any]],
        use_bm25: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Rerank search results using BM25-style scoring.
        
        Args:
            query: Original query
            results: Search results
            use_bm25: Whether to use BM25 scoring
            
        Returns:
            Reranked results
        """
        if not use_bm25:
            return results
        
        # Simple BM25-like scoring based on term frequency
        query_terms = set(query.lower().split())
        
        for result in results:
            content = result.get('content', '')
            content_terms = content.lower().split()
            
            # Calculate term frequency
            tf_score = sum(1 for term in content_terms if term in query_terms)
            
            # Combine with original similarity score
            original_score = result.get('score', 0.5)
            result['reranked_score'] = (original_score * 0.7) + (tf_score * 0.3)
        
        # Sort by reranked score
        results.sort(key=lambda x: x.get('reranked_score', 0), reverse=True)
        
        return results
    
    async def get_context_for_task(
        self,
        task_description: str,
        task_type: str,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Get relevant context for a task.
        
        Args:
            task_description: Description of the task
            task_type: Type of task
            top_k: Number of contexts to retrieve
            
        Returns:
            Relevant contexts
        """
        # Search with filters
        filters = {"content_type": task_type} if task_type else None
        
        results = await self.search_context(
            query=task_description,
            top_k=top_k * 2,  # Get more for reranking
            filters=filters
        )
        
        # Rerank results
        reranked = await self.rerank_results(task_description, results)
        
        return reranked[:top_k]
    
    async def clear_context(self, context_id: str) -> bool:
        """
        Remove context from database.
        
        Args:
            context_id: ID of context to remove
            
        Returns:
            Success status
        """
        try:
            if self.use_pinecone and hasattr(self, 'index'):
                self.index.delete(ids=[context_id])
            else:
                self.collection.delete(ids=[context_id])
            
            logger.info(f"Removed context {context_id}")
            return True
        except Exception as e:
            logger.error(f"Error removing context: {e}")
            return False


# Global RAG manager instance
rag_manager = RAGManager()
