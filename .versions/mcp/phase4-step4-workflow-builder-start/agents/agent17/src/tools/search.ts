// Search Tool for Agent #17
// Provides web search capabilities using multiple search engines

import { BrowserManager, SearchResult } from '../browser/manager.js';
import { SearchInput, ToolResult } from '../types/index.js';
import { withRetry } from '../utils/retry.js';
import { log } from '../utils/logger.js';

export async function search(
  manager: BrowserManager,
  input: SearchInput
): Promise<ToolResult> {
  const startTime = Date.now();
  
  return await withRetry(async () => {
    try {
      log('info', 'Performing search', { 
        query: input.query, 
        engine: input.searchEngine || 'google' 
      });
      
      const results = await manager.search(
        input.query, 
        input.searchEngine || 'google'
      );
      
      // Filter results if maxResults specified
      const filteredResults = input.maxResults 
        ? results.slice(0, input.maxResults)
        : results;

      return {
        success: true,
        data: {
          query: input.query,
          searchEngine: input.searchEngine || 'google',
          results: filteredResults,
          totalResults: results.length,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      log('error', 'Search failed', { error, query: input.query });
      throw error;
    }
  }, 3, 1000);
}

/**
 * Search multiple engines and aggregate results
 */
export async function multiSearch(
  manager: BrowserManager,
  query: string,
  engines: Array<'google' | 'bing' | 'duckduckgo'> = ['google', 'bing']
): Promise<ToolResult> {
  const startTime = Date.now();
  
  try {
    log('info', 'Performing multi-engine search', { query, engines });
    
    const searchPromises = engines.map(engine => 
      manager.search(query, engine).catch(err => {
        log('error', `Search failed on ${engine}`, { error: err });
        return [];
      })
    );
    
    const results = await Promise.all(searchPromises);
    
    // Aggregate and deduplicate results
    const allResults: SearchResult[] = [];
    const seenUrls = new Set<string>();
    
    results.forEach((engineResults, index) => {
      engineResults.forEach(result => {
        if (!seenUrls.has(result.url)) {
          seenUrls.add(result.url);
          allResults.push({
            ...result,
            searchEngine: engines[index],
          } as SearchResult);
        }
      });
    });
    
    // Sort by relevance (position across engines)
    allResults.sort((a, b) => a.position - b.position);

    return {
      success: true,
      data: {
        query,
        engines,
        results: allResults,
        totalResults: allResults.length,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      },
    };
  } catch (error) {
    log('error', 'Multi-search failed', { error });
    throw error;
  }
}
