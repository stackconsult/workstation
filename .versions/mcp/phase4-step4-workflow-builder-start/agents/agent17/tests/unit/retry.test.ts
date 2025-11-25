// Unit tests for retry utility
import { withRetry, retryUntil } from '../../src/utils/retry.js';
import { setLogLevel } from '../../src/utils/logger.js';

// Mock logger to avoid console output during tests
jest.mock('../../src/utils/logger.js', () => ({
  log: jest.fn(),
  setLogLevel: jest.fn(),
}));

describe('Retry Utility', () => {
  beforeAll(() => {
    setLogLevel('error'); // Minimize logging during tests
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');
      
      const result = await withRetry(mockFn, 3);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('persistent failure'));
      
      await expect(withRetry(mockFn, 3)).rejects.toThrow('persistent failure');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      jest.useFakeTimers();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');
      
      const promise = withRetry(mockFn, 3, 100);
      
      // First attempt fails immediately
      await jest.advanceTimersByTimeAsync(0);
      
      // Second attempt after 100ms (2^0 * 100)
      await jest.advanceTimersByTimeAsync(100);
      
      // Third attempt after 200ms (2^1 * 100)
      await jest.advanceTimersByTimeAsync(200);
      
      const result = await promise;
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
      
      jest.useRealTimers();
    });

    it('should work with custom max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));
      
      await expect(withRetry(mockFn, 5)).rejects.toThrow('fail');
      expect(mockFn).toHaveBeenCalledTimes(5);
    });

    it('should work with custom base delay', async () => {
      jest.useFakeTimers();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');
      
      const promise = withRetry(mockFn, 2, 500);
      
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(500);
      
      const result = await promise;
      expect(result).toBe('success');
      
      jest.useRealTimers();
    });

    it('should handle synchronous errors', async () => {
      const mockFn = jest.fn(() => {
        throw new Error('sync error');
      });
      
      await expect(withRetry(mockFn, 2)).rejects.toThrow('sync error');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should return value on immediate success', async () => {
      const mockFn = jest.fn().mockResolvedValue(42);
      const result = await withRetry(mockFn);
      
      expect(result).toBe(42);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryUntil', () => {
    it('should succeed when condition is met on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue(10);
      const condition = (val: number) => val > 5;
      
      const result = await retryUntil(mockFn, condition, 3);
      
      expect(result).toBe(10);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry until condition is met', async () => {
      let counter = 0;
      const mockFn = jest.fn().mockImplementation(async () => {
        counter++;
        return counter;
      });
      const condition = (val: number) => val >= 3;
      
      const result = await retryUntil(mockFn, condition, 5, 10);
      
      expect(result).toBe(3);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw error when condition is never met', async () => {
      const mockFn = jest.fn().mockResolvedValue(1);
      const condition = (val: number) => val > 10;
      
      await expect(
        retryUntil(mockFn, condition, 3, 10)
      ).rejects.toThrow('Condition not met after 3 attempts');
      
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should wait between attempts', async () => {
      jest.useFakeTimers();
      let counter = 0;
      const mockFn = jest.fn().mockImplementation(async () => {
        counter++;
        return counter;
      });
      const condition = (val: number) => val >= 3;
      
      const promise = retryUntil(mockFn, condition, 5, 100);
      
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(100);
      
      const result = await promise;
      expect(result).toBe(3);
      
      jest.useRealTimers();
    });

    it('should support custom max attempts', async () => {
      const mockFn = jest.fn().mockResolvedValue(1);
      const condition = (val: number) => val > 10;
      
      await expect(
        retryUntil(mockFn, condition, 10, 10)
      ).rejects.toThrow('Condition not met after 10 attempts');
      
      expect(mockFn).toHaveBeenCalledTimes(10);
    });

    it('should work with complex conditions', async () => {
      const mockFn = jest.fn().mockResolvedValue({ status: 'pending', count: 5 });
      const condition = (val: { status: string; count: number }) => 
        val.status === 'complete' || val.count > 10;
      
      mockFn
        .mockResolvedValueOnce({ status: 'pending', count: 5 })
        .mockResolvedValueOnce({ status: 'pending', count: 8 })
        .mockResolvedValue({ status: 'complete', count: 10 });
      
      const result = await retryUntil(mockFn, condition, 5, 10);
      
      expect(result).toEqual({ status: 'complete', count: 10 });
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should handle boolean conditions', async () => {
      let ready = false;
      const mockFn = jest.fn().mockImplementation(async () => {
        setTimeout(() => { ready = true; }, 50);
        return ready;
      });
      const condition = (val: boolean) => val === true;
      
      mockFn
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValue(true);
      
      const result = await retryUntil(mockFn, condition, 5, 10);
      
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('withRetry should handle zero retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('immediate fail'));
      
      await expect(withRetry(mockFn, 1)).rejects.toThrow('immediate fail');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('retryUntil should handle zero attempts gracefully', async () => {
      const mockFn = jest.fn().mockResolvedValue(1);
      const condition = (val: number) => val > 10;
      
      await expect(
        retryUntil(mockFn, condition, 0, 10)
      ).rejects.toThrow('Condition not met after 0 attempts');
    });

    it('should handle function that returns undefined', async () => {
      const mockFn = jest.fn().mockResolvedValue(undefined);
      const result = await withRetry(mockFn);
      
      expect(result).toBeUndefined();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle function that returns null', async () => {
      const mockFn = jest.fn().mockResolvedValue(null);
      const condition = (val: any) => val === null;
      
      const result = await retryUntil(mockFn, condition, 3);
      expect(result).toBeNull();
    });
  });
});
