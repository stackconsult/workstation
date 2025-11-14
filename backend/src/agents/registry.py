"""
Agent Registry - Manages agent registration, discovery, and lifecycle.
"""
from typing import Dict, List, Optional, Type
from .base import BaseAgent, AgentType, AgentStatus
import asyncio
from datetime import datetime


class AgentRegistry:
    """
    Central registry for managing all agents in the system.
    
    Provides:
    - Agent registration and deregistration
    - Agent discovery by type or capability
    - Agent health monitoring
    - Load balancing
    """
    
    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}
        self._agents_by_type: Dict[AgentType, List[BaseAgent]] = {}
        self._lock = asyncio.Lock()
        
    async def register(self, agent: BaseAgent) -> None:
        """
        Register a new agent in the registry.
        
        Args:
            agent: Agent instance to register
        """
        async with self._lock:
            self._agents[agent.agent_id] = agent
            
            # Add to type-based index
            if agent.agent_type not in self._agents_by_type:
                self._agents_by_type[agent.agent_type] = []
            self._agents_by_type[agent.agent_type].append(agent)
            
    async def deregister(self, agent_id: str) -> bool:
        """
        Remove an agent from the registry.
        
        Args:
            agent_id: ID of agent to remove
            
        Returns:
            True if agent was removed, False if not found
        """
        async with self._lock:
            agent = self._agents.pop(agent_id, None)
            if agent:
                # Remove from type index
                if agent.agent_type in self._agents_by_type:
                    self._agents_by_type[agent.agent_type] = [
                        a for a in self._agents_by_type[agent.agent_type]
                        if a.agent_id != agent_id
                    ]
                return True
            return False
    
    async def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """
        Get agent by ID.
        
        Args:
            agent_id: Agent ID
            
        Returns:
            Agent instance or None if not found
        """
        return self._agents.get(agent_id)
    
    async def get_agents_by_type(self, agent_type: AgentType) -> List[BaseAgent]:
        """
        Get all agents of a specific type.
        
        Args:
            agent_type: Type of agents to retrieve
            
        Returns:
            List of agents of the specified type
        """
        return self._agents_by_type.get(agent_type, [])
    
    async def get_available_agent(self, agent_type: AgentType) -> Optional[BaseAgent]:
        """
        Get an available (idle) agent of the specified type.
        
        Args:
            agent_type: Type of agent needed
            
        Returns:
            Available agent or None if no agents available
        """
        agents = await self.get_agents_by_type(agent_type)
        for agent in agents:
            if agent.status == AgentStatus.IDLE:
                return agent
        return None
    
    async def get_all_agents(self) -> List[BaseAgent]:
        """
        Get all registered agents.
        
        Returns:
            List of all agents
        """
        return list(self._agents.values())
    
    async def get_agent_stats(self) -> Dict:
        """
        Get statistics about registered agents.
        
        Returns:
            Dictionary with agent statistics
        """
        agents = await self.get_all_agents()
        stats = {
            "total_agents": len(agents),
            "by_type": {},
            "by_status": {
                "idle": 0,
                "running": 0,
                "failed": 0,
                "initializing": 0
            }
        }
        
        for agent in agents:
            # Count by type
            type_key = agent.agent_type.value
            stats["by_type"][type_key] = stats["by_type"].get(type_key, 0) + 1
            
            # Count by status
            status_key = agent.status.value
            if status_key in stats["by_status"]:
                stats["by_status"][status_key] += 1
        
        return stats


# Global registry instance
agent_registry = AgentRegistry()
