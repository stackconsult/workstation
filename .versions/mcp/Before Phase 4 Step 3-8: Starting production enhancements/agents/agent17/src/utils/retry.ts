// Retry utility with exponential backoff
// Used across all tools for resilient operations

import { log } from './logger.js';

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries - 1) {
        // Last attempt failed, throw error
        log('error', 'All retry attempts failed', { 
          attempts: maxRetries, 
          error: lastError.message 
        });
        throw lastError;
      }
      
      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt);
      log('warn', 'Retry attempt', { 
        attempt: attempt + 1, 
        maxRetries, 
        delay,
        error: lastError.message 
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Retry failed');
}

/**
 * Retry with custom condition
 */
export async function retryUntil<T>(
  fn: () => Promise<T>,
  condition: (result: T) => boolean,
  maxAttempts: number = 10,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await fn();
    
    if (condition(result)) {
      return result;
    }
    
    if (attempt < maxAttempts - 1) {
      log('info', 'Condition not met, retrying', { attempt: attempt + 1 });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Condition not met after ${maxAttempts} attempts`);
}
