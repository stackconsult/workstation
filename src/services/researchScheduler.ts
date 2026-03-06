/**
 * Research Scheduler
 * Manages automated competitor research scheduling and change detection
 */

import * as nodeCron from "node-cron";
import { CompetitorResearchOrchestrator } from "./competitorResearch";
import {
  CompetitorProfile,
  CompetitorConfig,
  CompetitorChange,
} from "../types/competitor";
import { logger } from "../utils/logger";

export class ResearchScheduler {
  private orchestrator: CompetitorResearchOrchestrator;
  private previousProfiles: Map<string, CompetitorProfile> = new Map();
  private scheduledTasks: Map<string, nodeCron.ScheduledTask> = new Map();

  constructor() {
    this.orchestrator = new CompetitorResearchOrchestrator();
  }

  /**
   * Initialize the scheduler and browser
   */
  async initialize(): Promise<void> {
    await this.orchestrator.initialize();
    logger.info("Research scheduler initialized");
  }

  /**
   * Schedule weekly research for each competitor
   */
  scheduleWeeklyResearch(competitors: CompetitorConfig[]): void {
    competitors.forEach((competitor) => {
      // Schedule research (default: Monday 2 AM)
      const schedule = competitor.schedule || "0 2 * * 1";

      const task = nodeCron.schedule(schedule, async () => {
        logger.info(`Starting scheduled research for ${competitor.name}`);

        try {
          const profile = await this.orchestrator.buildCompetitorProfile(
            competitor.name,
            competitor.website,
          );

          // Save to database
          await this.saveProfile(profile);

          // Check for significant changes
          const changes = this.detectChanges(competitor.name, profile);

          if (changes.length > 0) {
            await this.sendChangeAlert(competitor.name, changes);
          }

          // Store for next comparison
          this.previousProfiles.set(competitor.name, profile);
        } catch (error) {
          logger.error(`Research failed for ${competitor.name}`, { error });
        }
      });

      this.scheduledTasks.set(competitor.name, task);
      logger.info(`Scheduled research for ${competitor.name}`, { schedule });
    });
  }

  /**
   * Run research immediately for a specific competitor
   */
  async runImmediateResearch(
    name: string,
    website: string,
  ): Promise<CompetitorProfile> {
    logger.info(`Running immediate research for ${name}`);

    try {
      const profile = await this.orchestrator.buildCompetitorProfile(
        name,
        website,
      );

      // Save to database
      await this.saveProfile(profile);

      // Check for significant changes if we have previous data
      const changes = this.detectChanges(name, profile);
      if (changes.length > 0) {
        await this.sendChangeAlert(name, changes);
      }

      // Store for future comparisons
      this.previousProfiles.set(name, profile);

      return profile;
    } catch (error) {
      logger.error(`Immediate research failed for ${name}`, { error });
      throw error;
    }
  }

  /**
   * Detect significant changes between profiles
   */
  private detectChanges(
    name: string,
    newProfile: CompetitorProfile,
  ): CompetitorChange[] {
    const changes: CompetitorChange[] = [];
    const oldProfile = this.previousProfiles.get(name);

    if (!oldProfile) {
      logger.info(
        `No previous profile found for ${name}, skipping change detection`,
      );
      return changes;
    }

    // Check pricing changes
    newProfile.pricing.pricePoints.forEach((newPrice) => {
      const oldPrice = oldProfile.pricing.pricePoints.find(
        (p) => p.product === newPrice.product,
      );
      if (oldPrice && oldPrice.price !== newPrice.price) {
        const diff = newPrice.price - oldPrice.price;
        const percent = ((diff / oldPrice.price) * 100).toFixed(1);
        changes.push({
          field: "pricing",
          change: `${newPrice.product} price changed: $${oldPrice.price} → $${newPrice.price} (${diff > 0 ? "+" : ""}${percent}%)`,
        });
      }
    });

    // Check product additions
    if (
      newProfile.offerings.products.length >
      oldProfile.offerings.products.length
    ) {
      const newProducts = newProfile.offerings.products.filter(
        (np) =>
          !oldProfile.offerings.products.some((op) => op.name === np.name),
      );
      newProducts.forEach((p) => {
        changes.push({
          field: "products",
          change: `New product launched: ${p.name}`,
        });
      });
    }

    // Check funding rounds
    const newFunding = newProfile.financials.funding.totalRaised;
    const oldFunding = oldProfile.financials.funding.totalRaised;
    if (
      newFunding !== null &&
      oldFunding !== null &&
      newFunding !== oldFunding
    ) {
      changes.push({
        field: "funding",
        change: `Funding changed: $${oldFunding} → $${newFunding}`,
      });
    }

    // Check leadership changes
    if (
      newProfile.leadership.executives.length >
      oldProfile.leadership.executives.length
    ) {
      const newExecs = newProfile.leadership.executives.filter(
        (ne) =>
          !oldProfile.leadership.executives.some((oe) => oe.name === ne.name),
      );
      newExecs.forEach((exec) => {
        changes.push({
          field: "leadership",
          change: `New executive: ${exec.name} - ${exec.title}`,
        });
      });
    }

    // Check review rating changes
    const newG2Rating = newProfile.reputation.reviews.g2.rating;
    const oldG2Rating = oldProfile.reputation.reviews.g2.rating;
    if (newG2Rating !== null && oldG2Rating !== null) {
      const ratingDiff = newG2Rating - oldG2Rating;
      if (Math.abs(ratingDiff) >= 0.1) {
        changes.push({
          field: "reputation",
          change: `G2 rating changed: ${oldG2Rating} → ${newG2Rating} (${ratingDiff > 0 ? "+" : ""}${ratingDiff.toFixed(1)})`,
        });
      }
    }

    logger.info(`Detected ${changes.length} changes for ${name}`, { changes });
    return changes;
  }

  /**
   * Send alert about significant changes
   * In production, this would integrate with Slack, email, etc.
   */
  private async sendChangeAlert(
    name: string,
    changes: CompetitorChange[],
  ): Promise<void> {
    const message =
      `🚨 *Competitor Alert: ${name}*\n\n` +
      `Significant changes detected:\n\n` +
      changes.map((c) => `- ${c.change}`).join("\n");

    // Log the alert (in production, would send to Slack/email)
    logger.warn("Competitor change alert", { name, changes });
    console.log("\n" + message + "\n");

    // Placeholder for actual integration
    // Example: await axios.post(SLACK_WEBHOOK_URL, { text: message });
    // Example: await sendEmail({ subject: `Competitor Alert: ${name}`, body: message });
  }

  /**
   * Save profile to database
   * In production, this would save to PostgreSQL or similar
   */
  private async saveProfile(profile: CompetitorProfile): Promise<void> {
    logger.info(`Saving profile for ${profile.company.name}`, {
      completeness: profile.metadata.dataQuality.completeness,
    });

    // Placeholder for actual database save
    // Example implementation:
    // await db.query(
    //   'INSERT INTO competitor_profiles (id, data, created_at) VALUES ($1, $2, $3)',
    //   [profile.id, JSON.stringify(profile), new Date()]
    // );
  }

  /**
   * Stop a scheduled research task for a specific competitor
   */
  stopScheduledResearch(name: string): void {
    const task = this.scheduledTasks.get(name);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(name);
      logger.info(`Stopped scheduled research for ${name}`);
    }
  }

  /**
   * Stop all scheduled research tasks
   */
  stopAllScheduledResearch(): void {
    this.scheduledTasks.forEach((task, name) => {
      task.stop();
      logger.info(`Stopped scheduled research for ${name}`);
    });
    this.scheduledTasks.clear();
  }

  /**
   * Get the current profile for a competitor
   */
  getProfile(name: string): CompetitorProfile | undefined {
    return this.previousProfiles.get(name);
  }

  /**
   * Get all stored profiles
   */
  getAllProfiles(): Map<string, CompetitorProfile> {
    return new Map(this.previousProfiles);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopAllScheduledResearch();
    await this.orchestrator.cleanup();
    logger.info("Research scheduler cleanup completed");
  }
}
