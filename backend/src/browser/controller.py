"""Browser controller using Playwright."""
import asyncio
from typing import Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page

class BrowserController:
    """Singleton browser controller."""
    _instance: Optional['BrowserController'] = None
    
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        
    @classmethod
    async def get_instance(cls) -> 'BrowserController':
        if cls._instance is None:
            cls._instance = cls()
            await cls._instance.initialize()
        return cls._instance
    
    async def initialize(self):
        """Initialize Playwright and browser."""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=True)
        self.context = await self.browser.new_context()
    
    async def get_page(self) -> Page:
        """Get a new page."""
        return await self.context.new_page()
    
    async def close(self):
        """Close browser and cleanup."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
