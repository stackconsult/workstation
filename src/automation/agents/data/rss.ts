/**
 * RSS Agent for building client/prospect repositories
 * Parses RSS feeds and extracts relevant information
 * Phase 10: Workspace Automation
 */

import { logger } from "../../../utils/logger";

export interface RssFeed {
  url: string;
  sourceName: string;
}

export interface RssItem {
  title: string;
  link: string;
  content: string;
  contentSnippet: string;
  pubDate: string;
  categories: string[];
}

export interface ClientMention {
  phrase: string;
  context: string;
}

export interface ClientIntelligence {
  title: string;
  url: string;
  summary: string;
  date: string;
  source?: string;
  relevanceScore: number;
  clientMentions: ClientMention[];
}

/**
 * RSS Agent Implementation
 * Note: Simplified implementation for demo
 * Production would use rss-parser library
 */
export class RssAgent {
  /**
   * Fetch and parse RSS feed
   */
  async fetchFeed(params: { url: string; maxItems?: number }): Promise<{
    title: string;
    description: string;
    items: RssItem[];
  }> {
    logger.info("Fetching RSS feed", { url: params.url });

    // Placeholder implementation
    // Production would use rss-parser library
    const mockFeed = {
      title: "Example Feed",
      description: "Example RSS feed",
      items: [
        {
          title: "Technology Update Q4 2024",
          link: "https://example.com/tech-update",
          content: "Latest technology trends and industry updates...",
          contentSnippet: "Latest technology trends...",
          pubDate: new Date().toISOString(),
          categories: ["Technology", "Industry News"],
        },
      ],
    };

    const maxItems = params.maxItems || 20;
    return {
      ...mockFeed,
      items: mockFeed.items.slice(0, maxItems),
    };
  }

  /**
   * Extract client-specific information from RSS feed
   */
  async extractClientInfo(params: {
    url: string;
    clientName: string;
    maxItems?: number;
  }): Promise<ClientIntelligence[]> {
    logger.info("Extracting client information", {
      url: params.url,
      clientName: params.clientName,
    });

    const feed = await this.fetchFeed({
      url: params.url,
      maxItems: params.maxItems,
    });

    const intelligenceItems: ClientIntelligence[] = [];

    for (const item of feed.items) {
      // Find client mentions in content
      const mentions = this.findClientMentions(
        item.content || item.contentSnippet,
        params.clientName,
      );

      // Calculate relevance score
      const relevanceScore = this.calculateRelevance(
        item,
        mentions,
        params.clientName,
      );

      // Only include if relevant
      if (relevanceScore > 0.3) {
        intelligenceItems.push({
          title: item.title,
          url: item.link,
          summary: this.summarizeContent(
            item.contentSnippet || item.content,
            150,
          ),
          date: item.pubDate,
          relevanceScore,
          clientMentions: mentions,
        });
      }
    }

    // Sort by relevance
    intelligenceItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return intelligenceItems;
  }

  /**
   * Find mentions of client name in content
   */
  private findClientMentions(
    content: string,
    clientName: string,
  ): ClientMention[] {
    const mentions: ClientMention[] = [];

    if (!content || !clientName) {
      return mentions;
    }

    const normalizedContent = content.toLowerCase();
    const normalizedClient = clientName.toLowerCase();

    // Find exact matches with context
    let startIndex = 0;
    while (true) {
      const index = normalizedContent.indexOf(normalizedClient, startIndex);
      if (index === -1) break;

      // Extract context (50 characters before and after)
      const contextStart = Math.max(0, index - 50);
      const contextEnd = Math.min(
        content.length,
        index + clientName.length + 50,
      );

      mentions.push({
        phrase: clientName,
        context: `...${content.substring(contextStart, contextEnd)}...`,
      });

      startIndex = index + clientName.length;
    }

    return mentions;
  }

  /**
   * Calculate relevance score for an item
   */
  private calculateRelevance(
    item: RssItem,
    mentions: ClientMention[],
    clientName: string,
  ): number {
    let score = 0;

    // Title relevance (40% weight)
    if (item.title.toLowerCase().includes(clientName.toLowerCase())) {
      score += 0.4;
    }

    // Mention count (40% weight, capped at 0.4)
    score += Math.min(mentions.length * 0.2, 0.4);

    // Recency bonus (20% weight)
    const pubDate = new Date(item.pubDate);
    const now = new Date();
    const daysAgo = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);

    // Decay over 30 days
    const recencyMultiplier = Math.max(0.5, 1 - daysAgo / 30);
    score *= recencyMultiplier;

    return Math.min(score, 1.0);
  }

  /**
   * Summarize content to specified length
   */
  private summarizeContent(content: string, maxLength: number): string {
    if (!content) {
      return "";
    }

    if (content.length <= maxLength) {
      return content;
    }

    // Find last complete word within limit
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + "...";
    }

    return truncated + "...";
  }

  /**
   * Build comprehensive client repository from multiple RSS feeds
   */
  async buildClientRepository(params: {
    rssFeeds: RssFeed[];
    clientName: string;
    timeRange?: {
      start: Date;
      end: Date;
    };
  }): Promise<{
    clientName: string;
    sources: Array<{
      name: string;
      itemCount: number;
      lastUpdated: string;
    }>;
    items: ClientIntelligence[];
    lastUpdated: string;
  }> {
    logger.info("Building client repository", {
      clientName: params.clientName,
      feedCount: params.rssFeeds.length,
    });

    const allItems: ClientIntelligence[] = [];
    const sources: Array<{
      name: string;
      itemCount: number;
      lastUpdated: string;
    }> = [];

    // Process each feed
    for (const feed of params.rssFeeds) {
      try {
        const items = await this.extractClientInfo({
          url: feed.url,
          clientName: params.clientName,
        });

        // Add source to items
        const itemsWithSource = items.map((item) => ({
          ...item,
          source: feed.sourceName,
        }));

        allItems.push(...itemsWithSource);

        sources.push({
          name: feed.sourceName,
          itemCount: items.length,
          lastUpdated: new Date().toISOString(),
        });

        logger.info("Processed feed successfully", {
          source: feed.sourceName,
          itemCount: items.length,
        });
      } catch (error) {
        logger.error("Error processing feed", {
          source: feed.sourceName,
          error,
        });
      }
    }

    // Filter by time range if provided
    let filteredItems = allItems;
    if (params.timeRange) {
      filteredItems = allItems.filter((item) => {
        const itemDate = new Date(item.date);
        return (
          itemDate >= params.timeRange!.start &&
          itemDate <= params.timeRange!.end
        );
      });
    }

    // Sort by relevance first, then by date
    filteredItems.sort((a, b) => {
      // Primary sort by relevance
      if (Math.abs(b.relevanceScore - a.relevanceScore) > 0.01) {
        return b.relevanceScore - a.relevanceScore;
      }

      // Secondary sort by date (newer first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    logger.info("Client repository built successfully", {
      totalItems: filteredItems.length,
      sources: sources.length,
    });

    return {
      clientName: params.clientName,
      sources,
      items: filteredItems,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Monitor RSS feeds for new client mentions
   * Returns items published since last check
   */
  async monitorFeeds(params: {
    rssFeeds: RssFeed[];
    clientName: string;
    lastCheck: Date;
  }): Promise<ClientIntelligence[]> {
    logger.info("Monitoring feeds for new mentions", {
      clientName: params.clientName,
      lastCheck: params.lastCheck,
    });

    const repository = await this.buildClientRepository({
      rssFeeds: params.rssFeeds,
      clientName: params.clientName,
      timeRange: {
        start: params.lastCheck,
        end: new Date(),
      },
    });

    return repository.items;
  }
}
