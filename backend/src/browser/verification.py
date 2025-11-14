"""Result verification agent."""
from typing import Dict, Any

class VerificationAgent:
    """Verifies browser action results."""
    
    @staticmethod
    async def verify_navigation(result: Dict[str, Any]) -> bool:
        """Verify navigation completed."""
        return "url" in result and "title" in result
    
    @staticmethod
    async def verify_extraction(result: Dict[str, Any]) -> bool:
        """Verify data extraction."""
        return "text" in result and result["text"] is not None
