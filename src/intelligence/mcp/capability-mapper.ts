/**
 * Capability Mapper for MCP System Context
 * Maps local and cloud capabilities for intelligent execution decisions
 */

export interface Capability {
  id: string;
  type: "local" | "cloud" | "hybrid";
  category: "compute" | "storage" | "network" | "ai" | "database" | "other";
  name: string;
  available: boolean;
  performance: {
    throughput?: number;
    latency?: number;
    reliability?: number;
  };
  cost: {
    type: "free" | "metered" | "subscription";
    amount?: number;
    unit?: string;
  };
  requirements?: {
    minMemory?: number;
    minCpu?: number;
    dependencies?: string[];
  };
}

export interface LocalCapability extends Capability {
  type: "local";
  resourceUsage: {
    cpuPercent: number;
    memoryMB: number;
    diskMB?: number;
  };
}

export interface CloudCapability extends Capability {
  type: "cloud";
  provider: string;
  region?: string;
  endpoint: string;
  authentication: {
    method: "api-key" | "oauth" | "credentials";
    configured: boolean;
  };
}

export class CapabilityMapper {
  private localCapabilities: Map<string, LocalCapability> = new Map();
  private cloudCapabilities: Map<string, CloudCapability> = new Map();
  private capabilityCache: Map<string, Capability> = new Map();

  constructor() {
    // Initialize with empty maps
  }

  /**
   * Map all available capabilities (local and cloud)
   */
  async mapCapabilities(): Promise<void> {
    await Promise.all([
      this.discoverLocalCapabilities(),
      this.discoverCloudCapabilities(),
    ]);

    console.log(
      `✅ Mapped ${this.localCapabilities.size} local + ${this.cloudCapabilities.size} cloud capabilities`,
    );
  }

  /**
   * Discover local system capabilities
   */
  private async discoverLocalCapabilities(): Promise<void> {
    // Compute capabilities
    await this.detectComputeCapabilities();

    // Storage capabilities
    await this.detectStorageCapabilities();

    // Network capabilities
    await this.detectNetworkCapabilities();

    // AI/ML capabilities (local models)
    await this.detectAICapabilities();

    // Database capabilities
    await this.detectDatabaseCapabilities();
  }

  /**
   * Detect local compute capabilities
   */
  private async detectComputeCapabilities(): Promise<void> {
    const capabilities: LocalCapability[] = [];

    // Node.js runtime
    capabilities.push({
      id: "local-nodejs",
      type: "local",
      category: "compute",
      name: "Node.js Runtime",
      available: true,
      performance: {
        throughput: 1000,
        latency: 1,
        reliability: 0.99,
      },
      cost: { type: "free" },
      resourceUsage: {
        cpuPercent: 5,
        memoryMB: 100,
      },
    });

    // Check for additional capabilities
    if (await this.checkCommandAvailable("python3")) {
      capabilities.push({
        id: "local-python",
        type: "local",
        category: "compute",
        name: "Python Runtime",
        available: true,
        performance: { throughput: 800, latency: 2, reliability: 0.98 },
        cost: { type: "free" },
        resourceUsage: { cpuPercent: 3, memoryMB: 80 },
      });
    }

    if (await this.checkCommandAvailable("docker")) {
      capabilities.push({
        id: "local-docker",
        type: "local",
        category: "compute",
        name: "Docker Container Runtime",
        available: true,
        performance: { throughput: 900, latency: 50, reliability: 0.97 },
        cost: { type: "free" },
        resourceUsage: { cpuPercent: 10, memoryMB: 200 },
      });
    }

    capabilities.forEach((cap) => this.localCapabilities.set(cap.id, cap));
  }

  /**
   * Detect local storage capabilities
   */
  private async detectStorageCapabilities(): Promise<void> {
    // Local filesystem
    this.localCapabilities.set("local-filesystem", {
      id: "local-filesystem",
      type: "local",
      category: "storage",
      name: "Local Filesystem",
      available: true,
      performance: {
        throughput: 500,
        latency: 1,
        reliability: 0.999,
      },
      cost: { type: "free" },
      resourceUsage: {
        cpuPercent: 1,
        memoryMB: 10,
        diskMB: 0,
      },
    });
  }

  /**
   * Detect local network capabilities
   */
  private async detectNetworkCapabilities(): Promise<void> {
    this.localCapabilities.set("local-http-client", {
      id: "local-http-client",
      type: "local",
      category: "network",
      name: "HTTP/HTTPS Client",
      available: true,
      performance: {
        throughput: 1000,
        latency: 10,
        reliability: 0.98,
      },
      cost: { type: "free" },
      resourceUsage: {
        cpuPercent: 2,
        memoryMB: 20,
      },
    });
  }

  /**
   * Detect local AI/ML capabilities
   */
  private async detectAICapabilities(): Promise<void> {
    // Check for Ollama (local LLM)
    if (await this.checkServiceAvailable("http://localhost:11434")) {
      this.localCapabilities.set("local-ollama", {
        id: "local-ollama",
        type: "local",
        category: "ai",
        name: "Ollama (Local LLM)",
        available: true,
        performance: {
          throughput: 50,
          latency: 100,
          reliability: 0.95,
        },
        cost: { type: "free" },
        resourceUsage: {
          cpuPercent: 30,
          memoryMB: 4096,
        },
      });
    }

    // Check for LM Studio
    if (await this.checkServiceAvailable("http://localhost:1234")) {
      this.localCapabilities.set("local-lmstudio", {
        id: "local-lmstudio",
        type: "local",
        category: "ai",
        name: "LM Studio (Local LLM)",
        available: true,
        performance: {
          throughput: 60,
          latency: 80,
          reliability: 0.96,
        },
        cost: { type: "free" },
        resourceUsage: {
          cpuPercent: 25,
          memoryMB: 3072,
        },
      });
    }
  }

  /**
   * Detect local database capabilities
   */
  private async detectDatabaseCapabilities(): Promise<void> {
    // Check for SQLite
    if (await this.checkCommandAvailable("sqlite3")) {
      this.localCapabilities.set("local-sqlite", {
        id: "local-sqlite",
        type: "local",
        category: "database",
        name: "SQLite Database",
        available: true,
        performance: {
          throughput: 10000,
          latency: 1,
          reliability: 0.999,
        },
        cost: { type: "free" },
        resourceUsage: {
          cpuPercent: 5,
          memoryMB: 50,
          diskMB: 100,
        },
      });
    }
  }

  /**
   * Discover cloud capabilities
   */
  private async discoverCloudCapabilities(): Promise<void> {
    // Check for configured cloud providers
    await this.detectOpenAI();
    await this.detectAnthropic();
    await this.detectAWS();
    await this.detectGCP();
    await this.detectAzure();
  }

  /**
   * Detect OpenAI availability
   */
  private async detectOpenAI(): Promise<void> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.length > 0) {
      this.cloudCapabilities.set("cloud-openai", {
        id: "cloud-openai",
        type: "cloud",
        category: "ai",
        name: "OpenAI GPT",
        available: true,
        provider: "OpenAI",
        endpoint: "https://api.openai.com/v1",
        authentication: {
          method: "api-key",
          configured: true,
        },
        performance: {
          throughput: 1000,
          latency: 200,
          reliability: 0.99,
        },
        cost: {
          type: "metered",
          amount: 0.002,
          unit: "per-1k-tokens",
        },
      });
    }
  }

  /**
   * Detect Anthropic availability
   */
  private async detectAnthropic(): Promise<void> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey.length > 0) {
      this.cloudCapabilities.set("cloud-anthropic", {
        id: "cloud-anthropic",
        type: "cloud",
        category: "ai",
        name: "Anthropic Claude",
        available: true,
        provider: "Anthropic",
        endpoint: "https://api.anthropic.com/v1",
        authentication: {
          method: "api-key",
          configured: true,
        },
        performance: {
          throughput: 900,
          latency: 250,
          reliability: 0.98,
        },
        cost: {
          type: "metered",
          amount: 0.008,
          unit: "per-1k-tokens",
        },
      });
    }
  }

  /**
   * Detect AWS availability
   */
  private async detectAWS(): Promise<void> {
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    if (accessKey && accessKey.length > 0) {
      this.cloudCapabilities.set("cloud-aws-s3", {
        id: "cloud-aws-s3",
        type: "cloud",
        category: "storage",
        name: "AWS S3",
        available: true,
        provider: "AWS",
        region: process.env.AWS_REGION || "us-east-1",
        endpoint: "https://s3.amazonaws.com",
        authentication: {
          method: "credentials",
          configured: true,
        },
        performance: {
          throughput: 5000,
          latency: 50,
          reliability: 0.9999,
        },
        cost: {
          type: "metered",
          amount: 0.023,
          unit: "per-GB-month",
        },
      });
    }
  }

  /**
   * Detect GCP availability
   */
  private async detectGCP(): Promise<void> {
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentials && credentials.length > 0) {
      this.cloudCapabilities.set("cloud-gcp-storage", {
        id: "cloud-gcp-storage",
        type: "cloud",
        category: "storage",
        name: "Google Cloud Storage",
        available: true,
        provider: "GCP",
        endpoint: "https://storage.googleapis.com",
        authentication: {
          method: "credentials",
          configured: true,
        },
        performance: {
          throughput: 5000,
          latency: 55,
          reliability: 0.9999,
        },
        cost: {
          type: "metered",
          amount: 0.02,
          unit: "per-GB-month",
        },
      });
    }
  }

  /**
   * Detect Azure availability
   */
  private async detectAzure(): Promise<void> {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (connectionString && connectionString.length > 0) {
      this.cloudCapabilities.set("cloud-azure-blob", {
        id: "cloud-azure-blob",
        type: "cloud",
        category: "storage",
        name: "Azure Blob Storage",
        available: true,
        provider: "Azure",
        endpoint: "https://blob.core.windows.net",
        authentication: {
          method: "credentials",
          configured: true,
        },
        performance: {
          throughput: 5000,
          latency: 60,
          reliability: 0.9999,
        },
        cost: {
          type: "metered",
          amount: 0.018,
          unit: "per-GB-month",
        },
      });
    }
  }

  /**
   * Get all available capabilities
   */
  getAvailableCapabilities(): Capability[] {
    return [
      ...Array.from(this.localCapabilities.values()),
      ...Array.from(this.cloudCapabilities.values()),
    ].filter((cap) => cap.available);
  }

  /**
   * Get local capabilities only
   */
  getLocalCapabilities(): LocalCapability[] {
    return Array.from(this.localCapabilities.values()).filter(
      (cap) => cap.available,
    );
  }

  /**
   * Get cloud capabilities only
   */
  getCloudCapabilities(): CloudCapability[] {
    return Array.from(this.cloudCapabilities.values()).filter(
      (cap) => cap.available,
    );
  }

  /**
   * Get capabilities by category
   */
  getCapabilitiesByCategory(category: string): Capability[] {
    return this.getAvailableCapabilities().filter(
      (cap) => cap.category === category,
    );
  }

  /**
   * Find best capability for a given task
   */
  findBestCapability(params: {
    category: string;
    preferLocal?: boolean;
    maxCost?: number;
    minReliability?: number;
  }): Capability | null {
    const candidates = this.getCapabilitiesByCategory(params.category);

    // Filter by requirements
    let filtered = candidates.filter((cap) => {
      if (
        params.minReliability &&
        cap.performance.reliability &&
        cap.performance.reliability < params.minReliability
      ) {
        return false;
      }

      if (
        params.maxCost !== undefined &&
        cap.cost.type === "metered" &&
        cap.cost.amount &&
        cap.cost.amount > params.maxCost
      ) {
        return false;
      }

      return true;
    });

    if (filtered.length === 0) return null;

    // Apply preference for local
    if (params.preferLocal) {
      const localCaps = filtered.filter((cap) => cap.type === "local");
      if (localCaps.length > 0) {
        filtered = localCaps;
      }
    }

    // Sort by performance and cost
    filtered.sort((a, b) => {
      // Free is better than paid
      if (a.cost.type === "free" && b.cost.type !== "free") return -1;
      if (a.cost.type !== "free" && b.cost.type === "free") return 1;

      // Higher reliability is better
      const reliabilityA = a.performance.reliability || 0;
      const reliabilityB = b.performance.reliability || 0;
      if (reliabilityA !== reliabilityB) {
        return reliabilityB - reliabilityA;
      }

      // Lower latency is better
      const latencyA = a.performance.latency || 1000;
      const latencyB = b.performance.latency || 1000;
      return latencyA - latencyB;
    });

    return filtered[0];
  }

  /**
   * Check if command is available
   */
  private async checkCommandAvailable(_command: string): Promise<boolean> {
    try {
      // Placeholder - would use child_process.exec in actual implementation
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if service is available
   */
  private async checkServiceAvailable(_url: string): Promise<boolean> {
    try {
      // Placeholder - would use fetch/axios in actual implementation
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get capability statistics
   */
  getStatistics(): {
    totalCapabilities: number;
    localCapabilities: number;
    cloudCapabilities: number;
    byCategory: Record<string, number>;
    freeCapabilities: number;
  } {
    const all = this.getAvailableCapabilities();
    const byCategory: Record<string, number> = {};

    all.forEach((cap) => {
      byCategory[cap.category] = (byCategory[cap.category] || 0) + 1;
    });

    return {
      totalCapabilities: all.length,
      localCapabilities: this.getLocalCapabilities().length,
      cloudCapabilities: this.getCloudCapabilities().length,
      byCategory,
      freeCapabilities: all.filter((cap) => cap.cost.type === "free").length,
    };
  }
}
