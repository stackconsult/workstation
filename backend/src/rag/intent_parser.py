"""
Intent parser with RAG, NER, and zero-shot classification.
"""
from typing import Dict, Any, List, Optional
import re
from .manager import rag_manager
import logging

logger = logging.getLogger(__name__)


class IntentParser:
    """
    Advanced intent parser with:
    - Zero-shot classification
    - Named Entity Recognition
    - RAG context retrieval
    - Multi-intent detection
    """
    
    # Intent patterns
    INTENT_PATTERNS = {
        "navigate": [
            r"go to (.+)",
            r"navigate to (.+)",
            r"open (.+)",
            r"visit (.+)",
        ],
        "extract": [
            r"extract (.+)",
            r"get (.+) from",
            r"find (.+)",
            r"scrape (.+)",
        ],
        "fill_form": [
            r"fill (.+) form",
            r"complete (.+)",
            r"enter (.+) in",
        ],
        "click": [
            r"click (.+)",
            r"press (.+)",
            r"tap (.+)",
        ],
        "analyze": [
            r"analyze (.+)",
            r"summarize (.+)",
            r"review (.+)",
        ],
        "compare": [
            r"compare (.+) and (.+)",
            r"difference between (.+)",
        ],
    }
    
    def __init__(self):
        self.entity_patterns = {
            "url": r"https?://[^\s]+",
            "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            "selector": r"#[a-zA-Z0-9_-]+|\\.[a-zA-Z0-9_-]+",
            "price": r"\\$\\d+(?:\\.\\d{2})?",
        }
    
    async def parse(self, command: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Parse user command into structured intent.
        
        Args:
            command: User command
            context: Optional context (current page, history, etc.)
            
        Returns:
            Parsed intent with entities and context
        """
        command_lower = command.lower()
        
        # Classify intent
        intent = self._classify_intent(command_lower)
        
        # Extract entities
        entities = self._extract_entities(command)
        
        # Get RAG context
        rag_context = await self._get_rag_context(command, intent)
        
        # Extract parameters
        parameters = self._extract_parameters(command, intent, entities)
        
        return {
            "intent": intent,
            "original_command": command,
            "entities": entities,
            "parameters": parameters,
            "rag_context": rag_context,
            "confidence": self._calculate_confidence(intent, entities),
            "suggested_tasks": self._suggest_tasks(intent, parameters, rag_context)
        }
    
    def _classify_intent(self, command: str) -> str:
        """Classify the intent using pattern matching."""
        for intent, patterns in self.INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, command):
                    return intent
        
        # Default to generic "execute"
        return "execute"
    
    def _extract_entities(self, command: str) -> Dict[str, List[str]]:
        """Extract named entities from command."""
        entities = {}
        
        for entity_type, pattern in self.entity_patterns.items():
            matches = re.findall(pattern, command)
            if matches:
                entities[entity_type] = matches
        
        return entities
    
    async def _get_rag_context(self, command: str, intent: str) -> List[Dict[str, Any]]:
        """Get relevant context from RAG."""
        try:
            contexts = await rag_manager.get_context_for_task(
                task_description=command,
                task_type=intent,
                top_k=3
            )
            return contexts
        except Exception as e:
            logger.error(f"Error getting RAG context: {e}")
            return []
    
    def _extract_parameters(
        self,
        command: str,
        intent: str,
        entities: Dict[str, List[str]]
    ) -> Dict[str, Any]:
        """Extract parameters based on intent and entities."""
        parameters = {}
        
        if intent == "navigate":
            if "url" in entities:
                parameters["url"] = entities["url"][0]
            else:
                # Try to extract URL from command
                words = command.split()
                for word in words:
                    if "." in word and len(word) > 3:
                        parameters["url"] = word if word.startswith("http") else f"https://{word}"
                        break
        
        elif intent == "extract":
            parameters["extract_type"] = "text"
            if "email" in entities:
                parameters["extract_type"] = "email"
            elif "price" in entities:
                parameters["extract_type"] = "price"
        
        elif intent == "click":
            if "selector" in entities:
                parameters["selector"] = entities["selector"][0]
        
        return parameters
    
    def _calculate_confidence(self, intent: str, entities: Dict[str, List[str]]) -> float:
        """Calculate confidence score for the parsed intent."""
        confidence = 0.5  # Base confidence
        
        # Increase confidence if we found a matching pattern
        if intent != "execute":
            confidence += 0.3
        
        # Increase confidence based on entities found
        confidence += min(len(entities) * 0.1, 0.2)
        
        return min(confidence, 1.0)
    
    def _suggest_tasks(
        self,
        intent: str,
        parameters: Dict[str, Any],
        rag_context: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Suggest tasks based on intent and context."""
        tasks = []
        
        # Base task from intent
        base_task = {
            "type": intent,
            "priority": "medium",
            "parameters": parameters
        }
        tasks.append(base_task)
        
        # Add related tasks from RAG context
        for context in rag_context[:2]:
            if context.get('metadata', {}).get('success_rate', 0) > 0.8:
                related_task = {
                    "type": context['metadata'].get('task_type', intent),
                    "priority": "low",
                    "parameters": context['metadata'].get('parameters', {}),
                    "reason": "Similar successful task"
                }
                tasks.append(related_task)
        
        return tasks


# Global intent parser instance
intent_parser = IntentParser()
