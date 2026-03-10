/**
 * Tests for webpage-stats-analyzer
 */

import {
  countActualStats,
  compareStats,
} from "../../src/scripts/webpage-stats-analyzer";
import * as path from "path";

describe("Webpage Stats Analyzer", () => {
  describe("countActualStats", () => {
    it("should count repository files correctly", async () => {
      const repoPath = path.resolve(__dirname, "../..");
      const stats = await countActualStats(repoPath);

      // Verify we have some files
      expect(stats.totalFiles).toBeGreaterThan(800);
      expect(stats.tsFiles).toBeGreaterThan(60);
      expect(stats.jsFiles).toBeGreaterThan(30);
      expect(stats.testFiles).toBeGreaterThan(20);
      expect(stats.markdownFiles).toBeGreaterThan(300);
      expect(stats.totalLines).toBeGreaterThan(20000);
    });

    it("should exclude node_modules, .git, and dist directories", async () => {
      const repoPath = path.resolve(__dirname, "../..");
      const stats = await countActualStats(repoPath);

      // Ensure counts are reasonable (not including node_modules which would be thousands)
      expect(stats.totalFiles).toBeLessThan(30000);
      expect(stats.tsFiles).toBeLessThan(500);
    });
  });

  describe("compareStats", () => {
    it("should generate recommendations when there are no discrepancies", () => {
      const githubStats = { stars: 2, forks: 0 };
      const ghlocStats = { totalLines: 22000, files: 106 };
      const actualStats = {
        totalFiles: 887,
        tsFiles: 68,
        jsFiles: 38,
        testFiles: 25,
        markdownFiles: 375,
        totalLines: 21964,
        codeLines: 0,
        commentLines: 0,
        blankLines: 0,
      };

      const report = compareStats(githubStats, ghlocStats, actualStats);

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.actualStats).toEqual(actualStats);
    });

    it("should detect differences between ghloc and actual stats", () => {
      const githubStats = { stars: 2, forks: 0 };
      const ghlocStats = { totalLines: 50000, files: 200 }; // Significantly different
      const actualStats = {
        totalFiles: 887,
        tsFiles: 68,
        jsFiles: 38,
        testFiles: 25,
        markdownFiles: 375,
        totalLines: 21964,
        codeLines: 0,
        commentLines: 0,
        blankLines: 0,
      };

      const report = compareStats(githubStats, ghlocStats, actualStats);

      expect(report.differences).toBeDefined();
      expect(report.differences.length).toBeGreaterThan(0);

      // Should detect the significant line count difference
      const lineCountDiff = report.differences.find((d) => d.includes("lines"));
      expect(lineCountDiff).toBeDefined();
    });

    it("should include file type breakdown in recommendations", () => {
      const githubStats = { stars: 2, forks: 0 };
      const ghlocStats = {};
      const actualStats = {
        totalFiles: 887,
        tsFiles: 68,
        jsFiles: 38,
        testFiles: 25,
        markdownFiles: 375,
        totalLines: 21964,
        codeLines: 0,
        commentLines: 0,
        blankLines: 0,
      };

      const report = compareStats(githubStats, ghlocStats, actualStats);

      const fileBreakdown = report.recommendations.find(
        (r) =>
          r.includes("TypeScript files") &&
          r.includes("JavaScript files") &&
          r.includes("test files"),
      );

      expect(fileBreakdown).toBeDefined();
      expect(fileBreakdown).toContain("68 TypeScript files");
      expect(fileBreakdown).toContain("38 JavaScript files");
      expect(fileBreakdown).toContain("25 test files");
      expect(fileBreakdown).toContain("375 documentation files");
    });
  });
});
