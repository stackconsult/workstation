/**
 * Competitor Intelligence Data Model
 * Comprehensive interface for competitor research and analysis
 */

export interface CompetitorProfile {
  id: string;

  // Basic Information
  company: {
    name: string;
    website: string;
    founded: Date | null;
    headquarters: {
      address: string;
      city: string;
      state: string;
      country: string;
    };
    size: {
      employees: number | null;
      employeesGrowthRate: number | null; // YoY %
      estimatedRevenue: number | null;
      revenueGrowthRate: number | null; // YoY %
    };
    legal: {
      type: "Private" | "Public" | "Subsidiary";
      stockSymbol?: string;
      parentCompany?: string;
    };
  };

  // Market Position
  marketPosition: {
    marketShare: number | null; // %
    ranking: number | null;
    category: string;
    subcategories: string[];
    geographicReach: string[];
    targetMarket: {
      b2b: boolean;
      b2c: boolean;
      b2g: boolean;
      segments: string[];
    };
  };

  // Product/Service Portfolio
  offerings: {
    products: Array<{
      name: string;
      description: string;
      launchDate: Date | null;
      pricing: {
        model: "Subscription" | "One-time" | "Usage-based" | "Freemium";
        tiers: Array<{
          name: string;
          price: number;
          currency: string;
          billingCycle: "Monthly" | "Annual" | "Per-use";
          features: string[];
        }>;
      };
      targetAudience: string;
      competitiveAdvantage: string[];
    }>;
    services: Array<{
      name: string;
      description: string;
      pricing: string;
      deliveryModel: "On-premise" | "Cloud" | "Hybrid";
    }>;
  };

  // Pricing Intelligence
  pricing: {
    strategy: "Premium" | "Value" | "Penetration" | "Skimming";
    pricePoints: Array<{
      product: string;
      price: number;
      currency: string;
      lastUpdated: Date;
      historicalPrices: Array<{
        date: Date;
        price: number;
        changeReason?: string;
      }>;
    }>;
    discounts: {
      seasonal: Array<{ period: string; discount: number }>;
      volumeBased: Array<{ threshold: number; discount: number }>;
    };
  };

  // Technology Stack
  technology: {
    frontend: string[];
    backend: string[];
    infrastructure: string[];
    security: string[];
    integrations: string[];
  };

  // Marketing & Sales
  marketing: {
    channels: {
      organic: {
        seo: {
          domainAuthority: number | null;
          organicTraffic: number | null;
          topKeywords: Array<{
            keyword: string;
            position: number;
            volume: number;
          }>;
        };
      };
      paid: {
        googleAds: {
          active: boolean;
          estimatedSpend: number | null;
        };
      };
      social: {
        platforms: Array<{
          platform: string;
          handle: string;
          followers: number;
          engagementRate: number;
        }>;
      };
    };
    messaging: {
      valueProposition: string;
      tagline: string;
      keyMessages: string[];
    };
  };

  // Customer Intelligence
  customers: {
    totalCustomers: number | null;
    notableClients: Array<{
      name: string;
      industry: string;
      publiclyAnnounced: boolean;
    }>;
    customerRetention: number | null;
    nps: number | null;
  };

  // Reviews & Reputation
  reputation: {
    reviews: {
      g2: { rating: number | null; reviewCount: number; url: string };
      capterra: { rating: number | null; reviewCount: number; url: string };
      trustpilot: { rating: number | null; reviewCount: number; url: string };
    };
    sentiment: {
      overall: "Positive" | "Neutral" | "Negative";
      strengths: string[];
      weaknesses: string[];
    };
  };

  // Leadership
  leadership: {
    executives: Array<{
      name: string;
      title: string;
      background: string;
      linkedin: string;
    }>;
  };

  // Financial Health
  financials: {
    funding: {
      totalRaised: number | null;
      lastRound: {
        type: string;
        amount: number | null;
        date: Date | null;
        valuation: number | null;
      } | null;
    };
  };

  // Recent Developments
  recentActivity: Array<{
    date: Date;
    type:
      | "Product Launch"
      | "Acquisition"
      | "Partnership"
      | "Funding"
      | "Expansion";
    description: string;
    impact: "High" | "Medium" | "Low";
    source: string;
  }>;

  // Metadata
  metadata: {
    lastUpdated: Date;
    dataQuality: {
      completeness: number; // % of fields populated
      accuracy: number; // Confidence score
      sources: string[];
    };
    nextReviewDate: Date;
  };
}

/**
 * Competitor configuration for scheduled research
 */
export interface CompetitorConfig {
  name: string;
  website: string;
  schedule: string; // Cron expression
}

/**
 * Change detection result
 */
export interface CompetitorChange {
  field: string;
  change: string;
}
