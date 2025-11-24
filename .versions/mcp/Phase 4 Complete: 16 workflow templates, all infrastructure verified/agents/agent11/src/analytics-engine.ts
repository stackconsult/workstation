/**
 * Analytics Engine - Main orchestration for Agent 11
 * 
 * Analyzes validation data from Agent 10 and provides trend analysis,
 * comparative metrics, and actionable insights.
 */

import * as fs from 'fs';
import * as path from 'path';
import { TrendAnalyzer } from './trend-analyzer';
import { ComparisonEngine } from './comparison-engine';
import { ReportGenerator } from './report-generator';

interface Agent10Handoff {
  from_agent: number;
  to_agent: number;
  timestamp: string;
  validation_status: string;
  week_number?: number;
  year?: number;
  guard_rails_validated: {
    [key: string]: string;
  };
  performance_metrics: {
    guard_rail_overhead?: string | number;
    acceptable?: boolean;
    api_response_time_avg_ms?: number;
    workflow_execution_time_avg_ms?: number;
    database_query_time_avg_ms?: number;
    browser_operation_time_avg_ms?: number;
  };
  for_data_analysis: {
    guard_rails_added_count: number;
    validation_time_ms?: number;
    issues_found: number;
    issues_auto_fixed: number;
    manual_review_required?: boolean;
    test_coverage_delta?: string;
  };
  data_for_weekly_comparison: {
    week: number;
    year: number;
    metrics: {
      loop_protection_coverage?: string;
      timeout_coverage?: string;
      edge_case_tests?: number;
      performance_overhead_ms?: number;
      errors_caught?: number;
      silent_failures_prevented?: number;
    };
  };
  agent_activity_log?: {
    [key: string]: {
      executed: boolean;
      duration_ms: number;
      [key: string]: any;
    };
  };
}

interface WeeklySnapshot {
  week: number;
  year: number;
  timestamp: string;
  metrics: {
    guard_rails: {
      added: number;
      validated: string[];
      overhead_ms: number;
    };
    validation: {
      issues_found: number;
      issues_fixed: number;
      execution_time_ms: number;
    };
    performance: {
      api_response_ms?: number;
      workflow_execution_ms?: number;
      database_query_ms?: number;
      browser_operation_ms?: number;
    };
    quality: {
      test_coverage?: string;
      errors_caught?: number;
      silent_failures_prevented?: number;
    };
  };
  comparison: {
    vs_last_week?: {
      performance_delta: string;
      issues_delta: string;
      coverage_delta?: string;
    };
    vs_last_month?: {
      performance_trend: string;
      quality_trend: string;
    };
  };
  insights: string[];
  recommendations: string[];
  alerts: Array<{
    level: 'critical' | 'warning' | 'info';
    message: string;
  }>;
}

export class AnalyticsEngine {
  private projectRoot: string;
  private trendAnalyzer: TrendAnalyzer;
  private comparisonEngine: ComparisonEngine;
  private reportGenerator: ReportGenerator;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.trendAnalyzer = new TrendAnalyzer(projectRoot);
    this.comparisonEngine = new ComparisonEngine(projectRoot);
    this.reportGenerator = new ReportGenerator(projectRoot);
  }

  /**
   * Main execution method - runs all analytics
   */
  async run(): Promise<void> {
    console.log('📊 Agent 11: Data Analytics & Comparison Specialist');
    console.log('='.repeat(60));
    console.log('');

    // Step 1: Load Agent 10 handoff
    const handoff = this.loadAgent10Handoff();
    console.log(`✅ Loaded Agent 10 handoff for Week ${handoff.data_for_weekly_comparison.week}, ${handoff.data_for_weekly_comparison.year}`);
    console.log('');

    // Step 2: Load historical data
    console.log('📚 Loading historical data...');
    const historicalData = await this.loadHistoricalData();
    console.log(`✅ Loaded ${historicalData.length} weeks of historical data`);
    console.log('');

    // Step 3: Perform trend analysis
    console.log('📈 ANALYSIS 1: Trend Analysis');
    console.log('─'.repeat(40));
    const trends = await this.trendAnalyzer.analyze(handoff, historicalData);
    console.log(`${trends.status === 'complete' ? '✅' : '⚠️'} ${trends.summary}`);
    console.log('');

    // Step 4: Perform comparative analysis
    console.log('⚖️  ANALYSIS 2: Comparative Analysis');
    console.log('─'.repeat(40));
    const comparison = await this.comparisonEngine.compare(handoff, historicalData);
    console.log(`${comparison.status === 'complete' ? '✅' : '⚠️'} ${comparison.summary}`);
    console.log('');

    // Step 5: Generate weekly snapshot
    const snapshot = this.generateWeeklySnapshot(handoff, trends, comparison);
    
    // Step 6: Generate reports
    console.log('📊 Generating reports...');
    await this.reportGenerator.generate(snapshot, trends, comparison);
    console.log('✅ Reports generated');
    console.log('');

    // Step 7: Update memory
    await this.updateMemory(snapshot);
    console.log('💾 MCP memory updated');
    console.log('');

    // Step 8: Check for alerts
    const alerts = this.checkAlerts(snapshot);
    if (alerts.length > 0) {
      console.log('🚨 ALERTS:');
      alerts.forEach(alert => {
        const icon = alert.level === 'critical' ? '🔴' : alert.level === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} ${alert.message}`);
      });
      console.log('');
    }

    console.log('═'.repeat(60));
    console.log('✅ Agent 11 Data Analytics Complete');
    console.log('═'.repeat(60));
  }

  /**
   * Load Agent 10 handoff artifact
   */
  private loadAgent10Handoff(): Agent10Handoff {
    const handoffPath = path.join(this.projectRoot, '.agent10-to-agent11.json');
    
    if (!fs.existsSync(handoffPath)) {
      throw new Error('Agent 10 handoff not found. Agent 10 must run before Agent 11.');
    }

    const data = JSON.parse(fs.readFileSync(handoffPath, 'utf8'));
    
    // Ensure week and year are set
    if (!data.week_number && data.data_for_weekly_comparison) {
      data.week_number = data.data_for_weekly_comparison.week;
      data.year = data.data_for_weekly_comparison.year;
    }
    
    return data;
  }

  /**
   * Load historical data from Agent 10 memory
   */
  private async loadHistoricalData(): Promise<any[]> {
    const memoryPath = path.join(this.projectRoot, 'agents', 'agent10', 'memory', 'guard-rails-history.json');
    
    if (!fs.existsSync(memoryPath)) {
      console.warn('⚠️  No historical data found');
      return [];
    }

    return JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
  }

  /**
   * Generate weekly snapshot
   */
  private generateWeeklySnapshot(
    handoff: Agent10Handoff,
    trends: any,
    comparison: any
  ): WeeklySnapshot {
    const overhead = typeof handoff.performance_metrics.guard_rail_overhead === 'string' 
      ? parseFloat(handoff.performance_metrics.guard_rail_overhead) || 5
      : handoff.performance_metrics.guard_rail_overhead || 5;

    return {
      week: handoff.data_for_weekly_comparison.week,
      year: handoff.data_for_weekly_comparison.year,
      timestamp: handoff.timestamp,
      metrics: {
        guard_rails: {
          added: handoff.for_data_analysis.guard_rails_added_count,
          validated: Object.keys(handoff.guard_rails_validated),
          overhead_ms: overhead
        },
        validation: {
          issues_found: handoff.for_data_analysis.issues_found,
          issues_fixed: handoff.for_data_analysis.issues_auto_fixed,
          execution_time_ms: handoff.for_data_analysis.validation_time_ms || 0
        },
        performance: {
          api_response_ms: handoff.performance_metrics.api_response_time_avg_ms,
          workflow_execution_ms: handoff.performance_metrics.workflow_execution_time_avg_ms,
          database_query_ms: handoff.performance_metrics.database_query_time_avg_ms,
          browser_operation_ms: handoff.performance_metrics.browser_operation_time_avg_ms
        },
        quality: {
          test_coverage: handoff.for_data_analysis.test_coverage_delta,
          errors_caught: handoff.data_for_weekly_comparison.metrics.errors_caught,
          silent_failures_prevented: handoff.data_for_weekly_comparison.metrics.silent_failures_prevented
        }
      },
      comparison: {
        vs_last_week: comparison.weekOverWeek,
        vs_last_month: comparison.monthOverMonth
      },
      insights: trends.insights || [],
      recommendations: this.generateRecommendations(handoff, trends, comparison),
      alerts: this.checkAlerts({ metrics: {}, comparison: {}, insights: [], recommendations: [], alerts: [] } as any)
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(handoff: Agent10Handoff, trends: any, comparison: any): string[] {
    const recommendations: string[] = [];

    // Check guard rail overhead
    const overhead = typeof handoff.performance_metrics.guard_rail_overhead === 'string'
      ? parseFloat(handoff.performance_metrics.guard_rail_overhead) || 5
      : handoff.performance_metrics.guard_rail_overhead || 5;
    
    if (overhead > 10) {
      recommendations.push('Consider optimizing guard rail overhead (currently above 10ms threshold)');
    }

    // Check issues
    if (handoff.for_data_analysis.issues_found > 5) {
      recommendations.push(`Review and address ${handoff.for_data_analysis.issues_found} issues flagged by Agent 10`);
    }

    // Check manual review
    if (handoff.for_data_analysis.manual_review_required) {
      recommendations.push('Manual review required for some validation findings');
    }

    // Positive reinforcement
    if (handoff.for_data_analysis.issues_found === 0) {
      recommendations.push('Excellent - zero issues detected. Maintain current practices.');
    }

    return recommendations;
  }

  /**
   * Check for alerts based on thresholds
   */
  private checkAlerts(snapshot: WeeklySnapshot): Array<{ level: 'critical' | 'warning' | 'info'; message: string }> {
    const alerts: Array<{ level: 'critical' | 'warning' | 'info'; message: string }> = [];

    // Performance alerts
    if (snapshot.metrics && snapshot.metrics.guard_rails && snapshot.metrics.guard_rails.overhead_ms > 10) {
      alerts.push({
        level: 'critical',
        message: `Guard rail overhead is ${snapshot.metrics.guard_rails.overhead_ms}ms (threshold: 10ms)`
      });
    }

    // Quality alerts
    if (snapshot.metrics && snapshot.metrics.validation && snapshot.metrics.validation.issues_found > 10) {
      alerts.push({
        level: 'warning',
        message: `${snapshot.metrics.validation.issues_found} issues found in validation`
      });
    }

    return alerts;
  }

  /**
   * Update MCP memory with weekly snapshot
   */
  private async updateMemory(snapshot: WeeklySnapshot): Promise<void> {
    const memoryFile = path.join(__dirname, '..', 'memory', 'analytics-history.json');
    
    let memory: any[] = [];
    if (fs.existsSync(memoryFile)) {
      memory = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
    }

    memory.push(snapshot);
    
    // Keep only last 52 weeks (1 year)
    if (memory.length > 52) {
      memory = memory.slice(-52);
    }

    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
  }

  /**
   * Get week number from date
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}

// Main execution
if (require.main === module) {
  // Project root is 3 levels up from dist/ (dist -> agent11 -> agents -> root)
  const projectRoot = path.join(__dirname, '..', '..', '..');
  const engine = new AnalyticsEngine(projectRoot);
  
  engine.run().catch(error => {
    console.error('❌ Analytics Engine failed:', error);
    process.exit(1);
  });
}
