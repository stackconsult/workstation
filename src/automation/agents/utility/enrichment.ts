/**
 * Enrichment Agent for data enhancement
 * Enriches data with external APIs (geocoding, company info, contact enrichment)
 * Phase 2: Agent Ecosystem - Utility Agents
 */

import axios from "axios";
import { logger } from "../../../utils/logger";
import { ErrorHandler, ErrorCategory } from "../../../utils/error-handler";
import { Validator } from "../../../utils/validation";

export interface EnrichmentOptions {
  timeout?: number;
  retries?: number;
  cacheResults?: boolean;
}

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface CompanyInfo {
  name: string;
  domain: string;
  description?: string;
  industry?: string;
  employees?: string;
  founded?: string;
  headquarters?: string;
  website?: string;
}

export interface ContactEnrichment {
  email: string;
  name?: string;
  title?: string;
  company?: string;
  linkedin?: string;
  twitter?: string;
  phoneNumber?: string;
}

/**
 * Enrichment Agent Implementation
 * Provides data enrichment capabilities using external APIs
 */
export class EnrichmentAgent {
  private cache: Map<string, unknown> = new Map();

  /**
   * Geocode an address to get coordinates and location details
   * Uses OpenStreetMap Nominatim API (free, no API key required)
   */
  async geocode(params: {
    address: string;
    options?: EnrichmentOptions;
  }): Promise<{
    success: boolean;
    data?: GeocodeResult;
    error?: string;
  }> {
    try {
      // Validate input
      if (!params.address || params.address.trim().length === 0) {
        throw ErrorHandler.validationError(
          "Address is required",
          "address",
          params.address,
        );
      }

      const address = Validator.sanitizeString(params.address);
      const options: EnrichmentOptions = {
        timeout: 5000,
        retries: 3,
        cacheResults: true,
        ...params.options,
      };

      // Check cache
      const cacheKey = `geocode:${address}`;
      if (options.cacheResults && this.cache.has(cacheKey)) {
        logger.info("Returning geocode result from cache", { address });
        return {
          success: true,
          data: this.cache.get(cacheKey) as GeocodeResult,
        };
      }

      // Execute with retry and timeout
      const result = await ErrorHandler.withRetry(
        () =>
          ErrorHandler.withTimeout(async () => {
            logger.info("Geocoding address", { address });

            const response = await axios.get(
              "https://nominatim.openstreetmap.org/search",
              {
                params: {
                  q: address,
                  format: "json",
                  addressdetails: 1,
                  limit: 1,
                },
                headers: {
                  "User-Agent": "stackBrowserAgent/1.0",
                },
                timeout: options.timeout,
              },
            );

            if (!response.data || response.data.length === 0) {
              throw ErrorHandler.networkError(
                "No geocoding results found for address",
                "https://nominatim.openstreetmap.org/search",
              );
            }

            const location = response.data[0];
            const geocodeResult: GeocodeResult = {
              address: location.display_name,
              latitude: parseFloat(location.lat),
              longitude: parseFloat(location.lon),
              city:
                location.address?.city ||
                location.address?.town ||
                location.address?.village,
              state: location.address?.state,
              country: location.address?.country,
              postalCode: location.address?.postcode,
            };

            return geocodeResult;
          }, options.timeout!),
        {
          maxRetries: options.retries!,
          delayMs: 1000,
          backoffMultiplier: 2,
          retryableErrors: [ErrorCategory.NETWORK, ErrorCategory.TIMEOUT],
        },
      );

      // Cache result
      if (options.cacheResults) {
        this.cache.set(cacheKey, result);
      }

      logger.info("Successfully geocoded address", {
        address,
        coordinates: `${result.latitude},${result.longitude}`,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error during geocoding";
      logger.error("Failed to geocode address", {
        error: errorMessage,
        address: params.address,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Enrich company information using domain lookup
   * Uses Clearbit-like free alternatives or web scraping
   */
  async enrichCompanyData(params: {
    domain: string;
    options?: EnrichmentOptions;
  }): Promise<{
    success: boolean;
    data?: CompanyInfo;
    error?: string;
  }> {
    try {
      // Validate input
      if (!params.domain || params.domain.trim().length === 0) {
        throw ErrorHandler.validationError(
          "Domain is required",
          "domain",
          params.domain,
        );
      }

      // Sanitize and extract clean domain
      const sanitizedUrl = Validator.sanitizeUrl(params.domain, [
        "http",
        "https",
      ]);
      const cleanDomain = this.extractCleanDomain(sanitizedUrl);

      const options: EnrichmentOptions = {
        timeout: 5000,
        retries: 3,
        cacheResults: true,
        ...params.options,
      };

      // Check cache
      const cacheKey = `company:${cleanDomain}`;
      if (options.cacheResults && this.cache.has(cacheKey)) {
        logger.info("Returning company data from cache", {
          domain: cleanDomain,
        });
        return {
          success: true,
          data: this.cache.get(cacheKey) as CompanyInfo,
        };
      }

      // Execute with retry and timeout
      const result = await ErrorHandler.withRetry(
        () =>
          ErrorHandler.withTimeout(async () => {
            logger.info("Enriching company data", { domain: cleanDomain });

            // Simulate company data enrichment
            // In production, this would use APIs like Clearbit, FullContact, or Hunter.io
            // For now, we'll create a basic implementation that could be enhanced
            const companyInfo: CompanyInfo = {
              name: this.extractCompanyName(cleanDomain),
              domain: cleanDomain,
              description: `Company information for ${cleanDomain}`,
              website: `https://${cleanDomain}`,
            };

            // Try to fetch additional info from the website's meta tags
            try {
              const websiteResponse = await axios.get(
                `https://${cleanDomain}`,
                {
                  timeout: options.timeout,
                  headers: {
                    "User-Agent": "stackBrowserAgent/1.0",
                  },
                  maxRedirects: 5,
                },
              );

              // Parse meta information using cheerio for robust HTML parsing
              const cheerio = await import("cheerio");
              const $ = cheerio.load(websiteResponse.data);

              // Extract description from meta tag
              const description =
                $('meta[name="description"]').attr("content") ||
                $('meta[property="og:description"]').attr("content");

              if (description) {
                companyInfo.description = description;
              }
            } catch {
              logger.warn("Could not fetch website metadata", {
                domain: cleanDomain,
              });
              // Continue with basic info
            }

            return companyInfo;
          }, options.timeout!),
        {
          maxRetries: options.retries!,
          delayMs: 1000,
          backoffMultiplier: 2,
          retryableErrors: [ErrorCategory.NETWORK, ErrorCategory.TIMEOUT],
        },
      );

      // Cache result
      if (options.cacheResults) {
        this.cache.set(cacheKey, result);
      }

      logger.info("Successfully enriched company data", {
        domain: cleanDomain,
        name: result.name,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error during company enrichment";
      logger.error("Failed to enrich company data", {
        error: errorMessage,
        domain: params.domain,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Enrich contact information (email-based lookup)
   * Uses Hunter.io-like services or data enrichment APIs
   */
  async enrichContact(params: {
    email: string;
    options?: EnrichmentOptions;
  }): Promise<{
    success: boolean;
    data?: ContactEnrichment;
    error?: string;
  }> {
    try {
      // Validate input
      if (!params.email || params.email.trim().length === 0) {
        throw ErrorHandler.validationError(
          "Email is required",
          "email",
          params.email,
        );
      }

      const email = Validator.sanitizeString(params.email);

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw ErrorHandler.validationError(
          "Invalid email format",
          "email",
          email,
        );
      }

      const options: EnrichmentOptions = {
        timeout: 5000,
        retries: 3,
        cacheResults: true,
        ...params.options,
      };

      // Check cache
      const cacheKey = `contact:${email}`;
      if (options.cacheResults && this.cache.has(cacheKey)) {
        logger.info("Returning contact data from cache", { email });
        return {
          success: true,
          data: this.cache.get(cacheKey) as ContactEnrichment,
        };
      }

      logger.info("Enriching contact information", { email });

      // Extract domain from email
      const domain = email.split("@")[1];

      // Basic contact enrichment (simplified)
      // In production, this would use APIs like Hunter.io, Clearbit, or FullContact
      const contactInfo: ContactEnrichment = {
        email,
        company: domain,
      };

      // Try to enrich with company data
      try {
        const companyResult = await this.enrichCompanyData({
          domain,
          // Respect the original cacheResults option to maintain consistency
          options: { ...options, cacheResults: options.cacheResults },
        });

        if (companyResult.success && companyResult.data) {
          contactInfo.company = companyResult.data.name;
        }
      } catch {
        logger.warn("Could not enrich with company data", { email });
        // Continue with basic info
      }

      // Cache result
      if (options.cacheResults) {
        this.cache.set(cacheKey, contactInfo);
      }

      logger.info("Successfully enriched contact information", { email });

      return {
        success: true,
        data: contactInfo,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error during contact enrichment";
      logger.error("Failed to enrich contact", {
        error: errorMessage,
        email: params.email,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Batch enrich multiple records
   */
  async batchEnrich(params: {
    records: Array<{
      type: "geocode" | "company" | "contact";
      value: string;
    }>;
    options?: EnrichmentOptions;
  }): Promise<{
    success: boolean;
    data?: Array<{ success: boolean; data?: unknown; error?: string }>;
    error?: string;
  }> {
    try {
      logger.info("Starting batch enrichment", {
        count: params.records.length,
      });

      const results = await Promise.all(
        params.records.map(async (record) => {
          switch (record.type) {
            case "geocode":
              return await this.geocode({
                address: record.value,
                options: params.options,
              });
            case "company":
              return await this.enrichCompanyData({
                domain: record.value,
                options: params.options,
              });
            case "contact":
              return await this.enrichContact({
                email: record.value,
                options: params.options,
              });
            default:
              return {
                success: false,
                error: `Unknown enrichment type: ${record.type}`,
              };
          }
        }),
      );

      const successCount = results.filter((r) => r.success).length;
      logger.info("Batch enrichment complete", {
        total: params.records.length,
        successful: successCount,
        failed: params.records.length - successCount,
      });

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error during batch enrichment";
      logger.error("Failed batch enrichment", { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Clear enrichment cache
   */
  clearCache(): void {
    const cacheSize = this.cache.size;
    this.cache.clear();
    logger.info("Cleared enrichment cache", { entriesRemoved: cacheSize });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: string[];
  } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Helper: Extract clean domain from URL
   * Removes protocol, www, and path components
   */
  private extractCleanDomain(url: string): string {
    return url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }

  /**
   * Helper: Extract company name from domain
   */
  private extractCompanyName(domain: string): string {
    // Remove TLD and common words, capitalize
    const parts = domain.split(".");
    const name = parts[0];

    // Capitalize first letter and handle common patterns
    return name
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
