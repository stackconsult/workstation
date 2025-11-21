/// <reference types="jest" />
/**
 * Unit tests for Sentiment Analyzer
 */

import { SentimentAnalyzer } from '../src/utils/sentimentAnalyzer';

describe('SentimentAnalyzer', () => {
  let analyzer: SentimentAnalyzer;

  beforeEach(() => {
    analyzer = new SentimentAnalyzer();
  });

  describe('analyzeSentiment', () => {
    it('should return positive score for positive text', () => {
      const score = analyzer.analyzeSentiment('I love this amazing product!');
      expect(score).toBeGreaterThan(0);
    });

    it('should return negative score for negative text', () => {
      const score = analyzer.analyzeSentiment('I hate this terrible product!');
      expect(score).toBeLessThan(0);
    });

    it('should return neutral score for neutral text', () => {
      const score = analyzer.analyzeSentiment('The product is blue.');
      expect(score).toBeCloseTo(0, 1);
    });

    it('should handle empty text', () => {
      const score = analyzer.analyzeSentiment('');
      // Empty text returns NaN from natural library
      expect(isNaN(score) || score === 0).toBe(true);
    });
  });

  describe('analyzeMultiple', () => {
    it('should return average of multiple texts', () => {
      const texts = [
        'I love this!',
        'I hate this!',
        'This is okay.'
      ];
      const avgScore = analyzer.analyzeMultiple(texts);
      expect(typeof avgScore).toBe('number');
    });

    it('should return 0 for empty array', () => {
      const avgScore = analyzer.analyzeMultiple([]);
      expect(avgScore).toBe(0);
    });

    it('should handle array with one item', () => {
      const avgScore = analyzer.analyzeMultiple(['Great product!']);
      expect(avgScore).toBeGreaterThan(0);
    });
  });

  describe('classifySentiment', () => {
    it('should classify positive score as Positive', () => {
      const classification = analyzer.classifySentiment(2);
      expect(classification).toBe('Positive');
    });

    it('should classify negative score as Negative', () => {
      const classification = analyzer.classifySentiment(-2);
      expect(classification).toBe('Negative');
    });

    it('should classify near-zero score as Neutral', () => {
      const classification = analyzer.classifySentiment(0);
      expect(classification).toBe('Neutral');
    });

    it('should classify small positive score as Neutral', () => {
      const classification = analyzer.classifySentiment(0.3);
      expect(classification).toBe('Neutral');
    });

    it('should classify small negative score as Neutral', () => {
      const classification = analyzer.classifySentiment(-0.3);
      expect(classification).toBe('Neutral');
    });
  });

  describe('extractKeywords', () => {
    it('should extract positive and negative keywords', () => {
      const texts = [
        'This is an excellent and amazing product!',
        'It is terrible and buggy!',
        'Great features but slow performance'
      ];
      const keywords = analyzer.extractKeywords(texts);

      expect(keywords).toHaveProperty('positive');
      expect(keywords).toHaveProperty('negative');
      expect(Array.isArray(keywords.positive)).toBe(true);
      expect(Array.isArray(keywords.negative)).toBe(true);
      expect(keywords.positive).toContain('excellent');
      expect(keywords.positive).toContain('amazing');
      expect(keywords.negative).toContain('terrible');
      expect(keywords.negative).toContain('buggy');
    });

    it('should handle empty array', () => {
      const keywords = analyzer.extractKeywords([]);
      expect(keywords.positive).toEqual([]);
      expect(keywords.negative).toEqual([]);
    });

    it('should handle text with no keywords', () => {
      const keywords = analyzer.extractKeywords(['The sky is blue']);
      expect(keywords.positive).toEqual([]);
      expect(keywords.negative).toEqual([]);
    });
  });
});
