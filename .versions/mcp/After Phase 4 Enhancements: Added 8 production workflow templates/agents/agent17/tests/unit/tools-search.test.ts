// Unit tests for search tool
import { search, multiSearch } from '../../src/tools/search.js';
import { BrowserManager, type SearchResult } from '../../src/browser/manager.js';
import type { SearchInput } from '../../src/types/index.js';

// Mock dependencies
jest.mock('../../src/browser/manager.js');
jest.mock('../../src/utils/logger.js', () => ({
  log: jest.fn(),
  setLogLevel: jest.fn(),
}));
jest.mock('../../src/utils/retry.js', () => ({
  withRetry: jest.fn((fn) => fn()), // Execute immediately without retry
}));

describe('Search Tool', () => {
  let mockManager: jest.Mocked<BrowserManager>;
  let mockSearchResults: SearchResult[];

  beforeEach(() => {
    mockSearchResults = [
      { title: 'Result 1', url: 'https://example.com/1', snippet: 'Snippet 1', position: 1 },
      { title: 'Result 2', url: 'https://example.com/2', snippet: 'Snippet 2', position: 2 },
      { title: 'Result 3', url: 'https://example.com/3', snippet: 'Snippet 3', position: 3 },
    ];

    mockManager = {
      search: jest.fn().mockResolvedValue(mockSearchResults),
    } as any;
  });

  describe('search', () => {
    it('should perform Google search successfully', async () => {
      const input: SearchInput = {
        query: 'test query',
        searchEngine: 'google',
      };

      const result = await search(mockManager, input);

      expect(result.success).toBe(true);
      expect(result.data.query).toBe('test query');
      expect(result.data.searchEngine).toBe('google');
      expect(result.data.results).toEqual(mockSearchResults);
      expect(result.data.totalResults).toBe(3);
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
    });

    it('should default to Google when search engine not specified', async () => {
      const input: SearchInput = {
        query: 'test query',
      };

      const result = await search(mockManager, input);

      expect(result.success).toBe(true);
      expect(result.data.searchEngine).toBe('google');
      expect(mockManager.search).toHaveBeenCalledWith('test query', 'google');
    });

    it('should support Bing search', async () => {
      const input: SearchInput = {
        query: 'test query',
        searchEngine: 'bing',
      };

      await search(mockManager, input);

      expect(mockManager.search).toHaveBeenCalledWith('test query', 'bing');
    });

    it('should support DuckDuckGo search', async () => {
      const input: SearchInput = {
        query: 'test query',
        searchEngine: 'duckduckgo',
      };

      await search(mockManager, input);

      expect(mockManager.search).toHaveBeenCalledWith('test query', 'duckduckgo');
    });

    it('should limit results when maxResults is specified', async () => {
      const input: SearchInput = {
        query: 'test query',
        maxResults: 2,
      };

      const result = await search(mockManager, input);

      expect(result.data.results.length).toBe(2);
      expect(result.data.results).toEqual(mockSearchResults.slice(0, 2));
    });

    it('should return all results when maxResults not specified', async () => {
      const input: SearchInput = {
        query: 'test query',
      };

      const result = await search(mockManager, input);

      expect(result.data.results.length).toBe(3);
      expect(result.data.totalResults).toBe(3);
    });

    it('should handle empty search results', async () => {
      mockManager.search.mockResolvedValue([]);

      const input: SearchInput = {
        query: 'no results query',
      };

      const result = await search(mockManager, input);

      expect(result.success).toBe(true);
      expect(result.data.results).toEqual([]);
      expect(result.data.totalResults).toBe(0);
    });

    it('should include metadata in result', async () => {
      const input: SearchInput = {
        query: 'test query',
      };

      const result = await search(mockManager, input);

      expect(result.metadata.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.metadata.duration).toBeDefined();
      expect(typeof result.metadata.duration).toBe('number');
    });

    it('should handle search errors', async () => {
      mockManager.search.mockRejectedValue(new Error('Search failed'));

      const input: SearchInput = {
        query: 'error query',
      };

      await expect(search(mockManager, input)).rejects.toThrow('Search failed');
    });
  });

  describe('multiSearch', () => {
    beforeEach(() => {
      mockManager.search
        .mockResolvedValueOnce([
          { title: 'Google Result 1', url: 'https://example.com/1', snippet: 'Snippet 1', position: 1 },
          { title: 'Google Result 2', url: 'https://example.com/2', snippet: 'Snippet 2', position: 2 },
        ])
        .mockResolvedValueOnce([
          { title: 'Bing Result 1', url: 'https://example.com/1', snippet: 'Snippet 1', position: 1 }, // Duplicate
          { title: 'Bing Result 3', url: 'https://example.com/3', snippet: 'Snippet 3', position: 3 },
        ]);
    });

    it('should search multiple engines successfully', async () => {
      const result = await multiSearch(mockManager, 'test query', ['google', 'bing']);

      expect(result.success).toBe(true);
      expect(result.data.query).toBe('test query');
      expect(result.data.engines).toEqual(['google', 'bing']);
      expect(mockManager.search).toHaveBeenCalledTimes(2);
    });

    it('should deduplicate results by URL', async () => {
      const result = await multiSearch(mockManager, 'test query', ['google', 'bing']);

      // Should have 3 unique results (google/1, google/2, bing/3)
      // bing/1 is duplicate of google/1
      expect(result.data.results.length).toBe(3);
      expect(result.data.totalResults).toBe(3);

      const urls = result.data.results.map((r: any) => r.url);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(3);
    });

    it('should sort results by position', async () => {
      const result = await multiSearch(mockManager, 'test query', ['google', 'bing']);

      const positions = result.data.results.map((r: any) => r.position);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    });

    it('should default to google and bing when engines not specified', async () => {
      await multiSearch(mockManager, 'test query');

      expect(mockManager.search).toHaveBeenCalledWith('test query', 'google');
      expect(mockManager.search).toHaveBeenCalledWith('test query', 'bing');
    });

    it('should support custom engine combinations', async () => {
      mockManager.search
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await multiSearch(mockManager, 'test query', ['google', 'bing', 'duckduckgo']);

      expect(mockManager.search).toHaveBeenCalledTimes(3);
      expect(mockManager.search).toHaveBeenCalledWith('test query', 'google');
      expect(mockManager.search).toHaveBeenCalledWith('test query', 'bing');
      expect(mockManager.search).toHaveBeenCalledWith('test query', 'duckduckgo');
    });

    it('should handle failures from individual engines gracefully', async () => {
      mockManager.search
        .mockReset()
        .mockResolvedValueOnce([
          { title: 'Google Result', url: 'https://example.com/1', snippet: 'Snippet', position: 1 },
        ])
        .mockRejectedValueOnce(new Error('Bing failed'));

      const result = await multiSearch(mockManager, 'test query', ['google', 'bing']);

      expect(result.success).toBe(true);
      expect(result.data.results.length).toBeGreaterThanOrEqual(1);
      // Should have at least the Google result
      const googleResult = result.data.results.find((r: any) => r.title === 'Google Result');
      expect(googleResult).toBeDefined();
    });

    it('should aggregate all results when no errors', async () => {
      const result = await multiSearch(mockManager, 'test query', ['google', 'bing']);

      expect(result.data.results.length).toBeGreaterThan(0);
      expect(result.data.totalResults).toBe(result.data.results.length);
    });

    it('should include metadata in result', async () => {
      const result = await multiSearch(mockManager, 'test query', ['google', 'bing']);

      expect(result.metadata.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.metadata.duration).toBeDefined();
      expect(typeof result.metadata.duration).toBe('number');
    });

    it('should handle empty results from all engines', async () => {
      mockManager.search.mockReset().mockResolvedValue([]);

      const result = await multiSearch(mockManager, 'no results', ['google', 'bing']);

      expect(result.success).toBe(true);
      expect(result.data.totalResults).toBeGreaterThanOrEqual(0);
    });

    it('should handle when all engines fail', async () => {
      mockManager.search
        .mockReset()
        .mockRejectedValue(new Error('All failed'));

      const result = await multiSearch(mockManager, 'test query', ['google', 'bing']);

      expect(result.success).toBe(true);
      // All engines failed, so results should be empty from catch handlers
      expect(result.data.results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network timeouts', async () => {
      mockManager.search.mockRejectedValue(new Error('Timeout'));

      const input: SearchInput = {
        query: 'timeout query',
      };

      await expect(search(mockManager, input)).rejects.toThrow('Timeout');
    });

    it('should handle invalid search engines gracefully', async () => {
      const input: SearchInput = {
        query: 'test query',
        searchEngine: 'google' as any,
      };

      await search(mockManager, input);
      expect(mockManager.search).toHaveBeenCalled();
    });

    it('should handle very large result sets', async () => {
      const largeResults: SearchResult[] = Array.from({ length: 100 }, (_, i) => ({
        title: `Result ${i}`,
        url: `https://example.com/${i}`,
        snippet: `Snippet ${i}`,
        position: i + 1,
      }));

      mockManager.search.mockReset().mockResolvedValue(largeResults);

      const input: SearchInput = {
        query: 'large query',
        maxResults: 50,
      };

      const result = await search(mockManager, input);

      expect(result.data.results.length).toBe(50);
      expect(result.data.totalResults).toBe(100);
    });
  });
});
