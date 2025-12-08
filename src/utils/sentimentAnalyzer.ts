/**
 * Sentiment Analysis Utility
 * Analyzes text sentiment using natural NLP library
 */

import natural from "natural";

/**
 * Sentiment analyzer class using AFINN sentiment analysis
 */
export class SentimentAnalyzer {
  private analyzer: natural.SentimentAnalyzer;
  private tokenizer: natural.WordTokenizer;

  constructor() {
    this.analyzer = new natural.SentimentAnalyzer(
      "English",
      natural.PorterStemmer,
      "afinn",
    );
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Analyze sentiment of a single text
   * @param text Text to analyze
   * @returns Sentiment score (-5 to +5, where negative is negative sentiment)
   */
  analyzeSentiment(text: string): number {
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
    return this.analyzer.getSentiment(tokens);
  }

  /**
   * Analyze sentiment of multiple texts and return average
   * @param texts Array of texts to analyze
   * @returns Average sentiment score
   */
  analyzeMultiple(texts: string[]): number {
    if (texts.length === 0) return 0;

    let totalScore = 0;
    texts.forEach((text) => {
      totalScore += this.analyzeSentiment(text);
    });

    return totalScore / texts.length;
  }

  /**
   * Classify sentiment as Positive, Neutral, or Negative
   * @param score Sentiment score
   * @returns Classification string
   */
  classifySentiment(score: number): "Positive" | "Neutral" | "Negative" {
    if (score > 0.5) return "Positive";
    if (score < -0.5) return "Negative";
    return "Neutral";
  }

  /**
   * Extract positive and negative keywords from text
   * @param texts Array of review texts
   * @returns Object with positive and negative keywords
   */
  extractKeywords(texts: string[]): { positive: string[]; negative: string[] } {
    const positiveWords = new Set<string>();
    const negativeWords = new Set<string>();

    // Common positive keywords in reviews
    const positiveKeywords = [
      "excellent",
      "great",
      "amazing",
      "fantastic",
      "easy",
      "simple",
      "intuitive",
      "helpful",
      "responsive",
      "reliable",
      "fast",
      "powerful",
    ];
    // Common negative keywords in reviews
    const negativeKeywords = [
      "poor",
      "bad",
      "terrible",
      "difficult",
      "slow",
      "buggy",
      "expensive",
      "complicated",
      "confusing",
      "unreliable",
      "unresponsive",
      "lacking",
    ];

    texts.forEach((text) => {
      const lowerText = text.toLowerCase();

      positiveKeywords.forEach((keyword) => {
        if (lowerText.includes(keyword)) {
          positiveWords.add(keyword);
        }
      });

      negativeKeywords.forEach((keyword) => {
        if (lowerText.includes(keyword)) {
          negativeWords.add(keyword);
        }
      });
    });

    return {
      positive: Array.from(positiveWords),
      negative: Array.from(negativeWords),
    };
  }
}

// Export singleton instance
export const sentimentAnalyzer = new SentimentAnalyzer();
