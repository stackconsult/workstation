/**
 * Agent 12: Quality Assurance & Intelligence Engine
 * 
 * Main orchestration module for QA analysis and intelligence tracking
 */

import * as fs from 'fs';
import * as path from 'path';

interface AgentHandoff {
  agent: number;
  name: string;
  timestamp: string;
  week: number;
  year: number;
  status: string;
  [key: string]: any;
}

interface QAMetrics {
  week: number;
  year: number;
  timestamp: string;
  agents_executed: number[];
  agents_successful: number[];
  agents_failed: number[];
  total_issues_found: number;
  total_issues_fixed: number;
  security_findings: number;
  optimization_improvements: number;
  guard_rails_added: number;
  intelligence_score: number;
  quality_grade: string;
  recommendations: string[];
}

interface IntelligenceData {
  week: number;
  year: number;
  timestamp: string;
  cycle_performance: {
    agents_success_rate: number;
    average_execution_time: number;
    issues_resolution_rate: number;
  };
  trend_analysis: {
    quality_trend: 'improving' | 'stable' | 'declining';
    security_trend: 'improving' | 'stable' | 'declining';
    performance_trend: 'improving' | 'stable' | 'declining';
  };
  system_health: {
    overall_score: number;
    critical_issues: number;
    warnings: number;
  };
  insights: string[];
  action_items: string[];
}

export class QAEngine {
  private projectRoot: string;
  private memoryPath: string;
  private intelligencePath: string;
  private currentWeek: number;
  private currentYear: number;

  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../..');
    this.memoryPath = path.join(__dirname, '../memory/qa-history.json');
    this.intelligencePath = path.join(__dirname, '../intelligence');
    this.currentWeek = this.getWeekNumber();
    this.currentYear = new Date().getFullYear();
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = [
      path.dirname(this.memoryPath),
      this.intelligencePath,
      path.join(__dirname, '../reports')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private getWeekNumber(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  }

  /**
   * Load handoff artifacts from all agents (1-12)
   */
  private loadHandoffArtifacts(): Record<number, AgentHandoff | null> {
    const handoffs: Record<number, AgentHandoff | null> = {};
    
    // Load build setup agents (1-6) - check for setup-complete artifacts
    for (let agentId = 1; agentId <= 6; agentId++) {
      const setupPath = path.join(this.projectRoot, `.agent${agentId}-setup-complete.json`);
      
      if (fs.existsSync(setupPath)) {
        try {
          const data = fs.readFileSync(setupPath, 'utf-8');
          handoffs[agentId] = JSON.parse(data);
          console.log(`✅ Loaded setup artifact from Agent ${agentId}`);
        } catch (error) {
          console.warn(`⚠️  Failed to parse Agent ${agentId} setup artifact`);
          handoffs[agentId] = null;
        }
      } else {
        console.log(`ℹ️  No setup artifact for Agent ${agentId} (build setup not run)`);
        handoffs[agentId] = null;
      }
    }
    
    // Load regular cycle agents (7-11)
    for (let agentId = 7; agentId <= 11; agentId++) {
      const handoffPath = path.join(this.projectRoot, `.agent${agentId}-handoff.json`);
      
      if (fs.existsSync(handoffPath)) {
        try {
          const data = fs.readFileSync(handoffPath, 'utf-8');
          handoffs[agentId] = JSON.parse(data);
          console.log(`✅ Loaded handoff from Agent ${agentId}`);
        } catch (error) {
          console.warn(`⚠️  Failed to parse Agent ${agentId} handoff`);
          handoffs[agentId] = null;
        }
      } else {
        console.log(`ℹ️  No handoff found for Agent ${agentId}`);
        handoffs[agentId] = null;
      }
    }
    
    return handoffs;
  }

  /**
   * Analyze quality metrics from all agents
   */
  private analyzeQualityMetrics(handoffs: Record<number, AgentHandoff | null>): QAMetrics {
    const executedAgents: number[] = [];
    const successfulAgents: number[] = [];
    const failedAgents: number[] = [];
    
    let totalIssuesFound = 0;
    let totalIssuesFixed = 0;
    let securityFindings = 0;
    let optimizationImprovements = 0;
    let guardRailsAdded = 0;
    
    // Analyze each agent's contribution
    Object.entries(handoffs).forEach(([agentIdStr, handoff]) => {
      const agentId = parseInt(agentIdStr);
      
      if (handoff) {
        executedAgents.push(agentId);
        
        if (handoff.status === 'success') {
          successfulAgents.push(agentId);
        } else {
          failedAgents.push(agentId);
        }
        
        // Extract metrics based on agent
        switch (agentId) {
          case 7: // Security
            if (handoff.findings) {
              securityFindings = Object.values(handoff.findings).reduce((sum: number, val: any) => sum + (val || 0), 0);
            }
            break;
          case 8: // Assessment
            if (handoff.summary) {
              totalIssuesFound += handoff.summary.total_issues || 0;
            }
            break;
          case 9: // Optimization
            if (handoff.optimizations_applied) {
              optimizationImprovements = handoff.optimizations_applied;
            }
            break;
          case 10: // Guard Rails
            if (handoff.guard_rails_added) {
              guardRailsAdded = handoff.guard_rails_added;
            }
            if (handoff.validation_results) {
              totalIssuesFixed += handoff.validation_results.issues_fixed || 0;
            }
            break;
          case 11: // Analytics
            // Analytics provides insights but not direct metrics
            break;
        }
      }
    });
    
    // Calculate intelligence score (0-100)
    const intelligenceScore = this.calculateIntelligenceScore({
      successRate: successfulAgents.length / Math.max(executedAgents.length, 1),
      issuesResolutionRate: totalIssuesFixed / Math.max(totalIssuesFound, 1),
      securityFindings,
      optimizationImprovements,
      guardRailsAdded
    });
    
    // Determine quality grade
    const qualityGrade = this.calculateQualityGrade(intelligenceScore);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations({
      failedAgents,
      totalIssuesFound,
      totalIssuesFixed,
      securityFindings,
      guardRailsAdded
    });
    
    return {
      week: this.currentWeek,
      year: this.currentYear,
      timestamp: new Date().toISOString(),
      agents_executed: executedAgents,
      agents_successful: successfulAgents,
      agents_failed: failedAgents,
      total_issues_found: totalIssuesFound,
      total_issues_fixed: totalIssuesFixed,
      security_findings: securityFindings,
      optimization_improvements: optimizationImprovements,
      guard_rails_added: guardRailsAdded,
      intelligence_score: intelligenceScore,
      quality_grade: qualityGrade,
      recommendations
    };
  }

  /**
   * Calculate intelligence score (0-100)
   */
  private calculateIntelligenceScore(data: {
    successRate: number;
    issuesResolutionRate: number;
    securityFindings: number;
    optimizationImprovements: number;
    guardRailsAdded: number;
  }): number {
    let score = 0;
    
    // Success rate: 40 points
    score += data.successRate * 40;
    
    // Issue resolution: 30 points
    score += Math.min(data.issuesResolutionRate * 30, 30);
    
    // Proactive improvements: 30 points
    const improvements = data.optimizationImprovements + data.guardRailsAdded;
    score += Math.min(improvements * 3, 30);
    
    // Penalty for security findings
    score -= Math.min(data.securityFindings * 5, 20);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate quality grade based on intelligence score
   */
  private calculateQualityGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(data: {
    failedAgents: number[];
    totalIssuesFound: number;
    totalIssuesFixed: number;
    securityFindings: number;
    guardRailsAdded: number;
  }): string[] {
    const recommendations: string[] = [];
    
    if (data.failedAgents.length > 0) {
      recommendations.push(`🔴 CRITICAL: ${data.failedAgents.length} agent(s) failed - investigate Agent ${data.failedAgents.join(', ')}`);
    }
    
    if (data.securityFindings > 0) {
      recommendations.push(`🔒 SECURITY: ${data.securityFindings} security finding(s) require immediate attention`);
    }
    
    const unresolvedIssues = data.totalIssuesFound - data.totalIssuesFixed;
    if (unresolvedIssues > 0) {
      recommendations.push(`⚠️  ${unresolvedIssues} issue(s) remain unresolved - prioritize fixes`);
    }
    
    if (data.guardRailsAdded === 0) {
      recommendations.push(`💡 Consider adding guard rails to prevent future issues`);
    }
    
    if (data.totalIssuesFound === 0 && data.securityFindings === 0) {
      recommendations.push(`✅ Excellent cycle - no issues found. Consider adding more comprehensive checks.`);
    }
    
    return recommendations;
  }

  /**
   * Generate intelligence data with trend analysis
   */
  private generateIntelligence(metrics: QAMetrics, history: QAMetrics[]): IntelligenceData {
    const recentHistory = history.slice(-4); // Last 4 weeks
    
    // Calculate trends
    const qualityTrend = this.analyzeTrend(recentHistory.map(h => h.intelligence_score));
    const securityTrend = this.analyzeTrend(recentHistory.map(h => -h.security_findings));
    const performanceTrend = this.analyzeTrend(recentHistory.map(h => h.agents_successful.length));
    
    // Calculate cycle performance
    const successRate = (metrics.agents_successful.length / Math.max(metrics.agents_executed.length, 1)) * 100;
    const resolutionRate = (metrics.total_issues_fixed / Math.max(metrics.total_issues_found, 1)) * 100;
    
    // Generate insights
    const insights = this.generateInsights(metrics, recentHistory);
    const actionItems = this.generateActionItems(metrics, qualityTrend);
    
    return {
      week: this.currentWeek,
      year: this.currentYear,
      timestamp: new Date().toISOString(),
      cycle_performance: {
        agents_success_rate: Math.round(successRate),
        average_execution_time: 0, // Placeholder
        issues_resolution_rate: Math.round(resolutionRate)
      },
      trend_analysis: {
        quality_trend: qualityTrend,
        security_trend: securityTrend,
        performance_trend: performanceTrend
      },
      system_health: {
        overall_score: metrics.intelligence_score,
        critical_issues: metrics.agents_failed.length,
        warnings: metrics.recommendations.length
      },
      insights,
      action_items: actionItems
    };
  }

  /**
   * Analyze trend from historical data
   */
  private analyzeTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-2);
    const change = recent[1] - recent[0];
    
    if (change > 0) return 'improving';
    if (change < 0) return 'declining';
    return 'stable';
  }

  /**
   * Generate insights from metrics and history
   */
  private generateInsights(metrics: QAMetrics, history: QAMetrics[]): string[] {
    const insights: string[] = [];
    
    // Success rate insight
    const successRate = (metrics.agents_successful.length / Math.max(metrics.agents_executed.length, 1)) * 100;
    if (successRate === 100) {
      insights.push('🎯 Perfect execution - all agents completed successfully');
    } else if (successRate >= 80) {
      insights.push(`✅ Strong performance - ${successRate.toFixed(0)}% agent success rate`);
    } else {
      insights.push(`⚠️  Performance concerns - only ${successRate.toFixed(0)}% agent success rate`);
    }
    
    // Quality trend
    if (history.length >= 2) {
      const previousScore = history[history.length - 1]?.intelligence_score || 0;
      const scoreDiff = metrics.intelligence_score - previousScore;
      
      if (scoreDiff > 5) {
        insights.push(`📈 Quality improving - intelligence score up ${scoreDiff} points`);
      } else if (scoreDiff < -5) {
        insights.push(`📉 Quality declining - intelligence score down ${Math.abs(scoreDiff)} points`);
      }
    }
    
    // Issue resolution
    if (metrics.total_issues_fixed > 0) {
      insights.push(`🔧 ${metrics.total_issues_fixed} issue(s) resolved this cycle`);
    }
    
    // Proactive improvements
    const improvements = metrics.optimization_improvements + metrics.guard_rails_added;
    if (improvements > 0) {
      insights.push(`💡 ${improvements} proactive improvement(s) implemented`);
    }
    
    return insights;
  }

  /**
   * Generate action items based on current state
   */
  private generateActionItems(metrics: QAMetrics, trend: 'improving' | 'stable' | 'declining'): string[] {
    const actions: string[] = [];
    
    if (metrics.agents_failed.length > 0) {
      actions.push(`Investigate and resolve Agent ${metrics.agents_failed.join(', ')} failures`);
    }
    
    if (metrics.security_findings > 0) {
      actions.push('Address security findings from Agent 7');
    }
    
    if (metrics.total_issues_found > metrics.total_issues_fixed) {
      actions.push(`Fix ${metrics.total_issues_found - metrics.total_issues_fixed} remaining issue(s)`);
    }
    
    if (trend === 'declining') {
      actions.push('Review recent changes that may have impacted quality');
    }
    
    if (metrics.intelligence_score < 70) {
      actions.push('Overall system quality needs improvement - review all agent outputs');
    }
    
    return actions;
  }

  /**
   * Save metrics to memory
   */
  private saveToMemory(metrics: QAMetrics): void {
    let history: QAMetrics[] = [];
    
    if (fs.existsSync(this.memoryPath)) {
      const data = fs.readFileSync(this.memoryPath, 'utf-8');
      history = JSON.parse(data);
    }
    
    // Add current metrics
    history.push(metrics);
    
    // Keep last 52 weeks
    if (history.length > 52) {
      history = history.slice(-52);
    }
    
    fs.writeFileSync(this.memoryPath, JSON.stringify(history, null, 2));
    console.log('✅ Metrics saved to MCP memory');
  }

  /**
   * Save intelligence data
   */
  private saveIntelligence(intelligence: IntelligenceData): void {
    const filename = `week-${this.currentWeek}-${this.currentYear}-intelligence.json`;
    const filepath = path.join(this.intelligencePath, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(intelligence, null, 2));
    console.log(`✅ Intelligence data saved: ${filename}`);
  }

  /**
   * Generate comprehensive QA report
   */
  private generateReport(metrics: QAMetrics, intelligence: IntelligenceData): string {
    const timestamp = new Date().toISOString().split('T')[0];
    
    let report = `# Quality Assurance & Intelligence Report
# Week ${this.currentWeek}, ${this.currentYear}

**Generated:** ${timestamp}  
**Agent:** Agent 12 - Quality Assurance & Intelligence  
**Intelligence Score:** ${metrics.intelligence_score}/100 (${metrics.quality_grade})

---

## Executive Summary

### Cycle Performance
- **Agents Executed:** ${metrics.agents_executed.length}/6
- **Success Rate:** ${intelligence.cycle_performance.agents_success_rate}%
- **Issues Resolution Rate:** ${intelligence.cycle_performance.issues_resolution_rate}%

### System Health
- **Overall Score:** ${intelligence.system_health.overall_score}/100
- **Critical Issues:** ${intelligence.system_health.critical_issues}
- **Warnings:** ${intelligence.system_health.warnings}

---

## Quality Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Intelligence Score | ${metrics.intelligence_score}/100 | ${metrics.quality_grade} |
| Agents Successful | ${metrics.agents_successful.length}/${metrics.agents_executed.length} | ${metrics.agents_failed.length === 0 ? '✅' : '⚠️'} |
| Issues Found | ${metrics.total_issues_found} | ${metrics.total_issues_found === 0 ? '✅' : 'ℹ️'} |
| Issues Fixed | ${metrics.total_issues_fixed} | ${metrics.total_issues_fixed === metrics.total_issues_found ? '✅' : '⚠️'} |
| Security Findings | ${metrics.security_findings} | ${metrics.security_findings === 0 ? '✅' : '🔒'} |
| Optimizations | ${metrics.optimization_improvements} | ${metrics.optimization_improvements > 0 ? '✅' : 'ℹ️'} |
| Guard Rails Added | ${metrics.guard_rails_added} | ${metrics.guard_rails_added > 0 ? '✅' : 'ℹ️'} |

---

## Trend Analysis

### Quality Trend
**Status:** ${this.getTrendEmoji(intelligence.trend_analysis.quality_trend)} ${intelligence.trend_analysis.quality_trend.toUpperCase()}

### Security Trend
**Status:** ${this.getTrendEmoji(intelligence.trend_analysis.security_trend)} ${intelligence.trend_analysis.security_trend.toUpperCase()}

### Performance Trend
**Status:** ${this.getTrendEmoji(intelligence.trend_analysis.performance_trend)} ${intelligence.trend_analysis.performance_trend.toUpperCase()}

---

## Insights

${intelligence.insights.map(insight => `- ${insight}`).join('\n')}

---

## Recommendations

${metrics.recommendations.map(rec => `- ${rec}`).join('\n')}

---

## Action Items

${intelligence.action_items.length > 0 
  ? intelligence.action_items.map(action => `- [ ] ${action}`).join('\n')
  : '- [x] No action items - system is healthy'}

---

## Agent Execution Details

### Successful Agents
${metrics.agents_successful.map(id => `- ✅ Agent ${id}`).join('\n') || '- None'}

### Failed Agents
${metrics.agents_failed.map(id => `- ❌ Agent ${id}`).join('\n') || '- None'}

---

## Next Cycle

**Scheduled:** Next Saturday 2:00 AM MST  
**Focus Areas:** ${this.getNextCycleFocus(metrics, intelligence)}

---

*Generated by Agent 12: Quality Assurance & Intelligence*
`;
    
    return report;
  }

  private getTrendEmoji(trend: string): string {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  }

  private getNextCycleFocus(metrics: QAMetrics, intelligence: IntelligenceData): string {
    const focus: string[] = [];
    
    if (metrics.agents_failed.length > 0) {
      focus.push('Agent stability');
    }
    if (metrics.security_findings > 0) {
      focus.push('Security improvements');
    }
    if (intelligence.trend_analysis.quality_trend === 'declining') {
      focus.push('Quality recovery');
    }
    if (metrics.guard_rails_added === 0) {
      focus.push('Error prevention');
    }
    
    return focus.length > 0 ? focus.join(', ') : 'Maintaining quality excellence';
  }

  /**
   * Main execution method
   */
  public async run(): Promise<void> {
    console.log('🔍 Agent 12: Quality Assurance & Intelligence');
    console.log('=============================================');
    console.log(`Week ${this.currentWeek}, ${this.currentYear}`);
    console.log('');
    
    try {
      // Step 1: Load handoff artifacts
      console.log('📥 Loading handoff artifacts from All Agents (1-12)...');
      const handoffs = this.loadHandoffArtifacts();
      console.log('');
      
      // Step 2: Analyze quality metrics
      console.log('📊 Analyzing quality metrics...');
      const metrics = this.analyzeQualityMetrics(handoffs);
      console.log(`✅ Intelligence Score: ${metrics.intelligence_score}/100 (${metrics.quality_grade})`);
      console.log('');
      
      // Step 3: Load historical data
      console.log('📚 Loading historical data...');
      let history: QAMetrics[] = [];
      if (fs.existsSync(this.memoryPath)) {
        const data = fs.readFileSync(this.memoryPath, 'utf-8');
        history = JSON.parse(data);
        console.log(`✅ Loaded ${history.length} weeks of historical data`);
      } else {
        console.log('ℹ️  No historical data found (first run)');
      }
      console.log('');
      
      // Step 4: Generate intelligence
      console.log('🧠 Generating intelligence data...');
      const intelligence = this.generateIntelligence(metrics, history);
      console.log('✅ Intelligence data generated');
      console.log('');
      
      // Step 5: Save to memory
      console.log('💾 Saving to MCP memory...');
      this.saveToMemory(metrics);
      this.saveIntelligence(intelligence);
      console.log('');
      
      // Step 6: Generate report
      console.log('📝 Generating QA report...');
      const report = this.generateReport(metrics, intelligence);
      const reportDir = path.join(__dirname, `../reports/week-${this.currentWeek}-${this.currentYear}`);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      const reportPath = path.join(reportDir, 'QA_INTELLIGENCE_REPORT.md');
      fs.writeFileSync(reportPath, report);
      console.log(`✅ Report saved: ${reportPath}`);
      console.log('');
      
      // Step 7: Create handoff artifact (end of cycle)
      console.log('📤 Creating cycle completion artifact...');
      const handoffPath = path.join(this.projectRoot, '.agent12-complete.json');
      fs.writeFileSync(handoffPath, JSON.stringify({
        agent: 12,
        name: 'Quality Assurance & Intelligence',
        timestamp: new Date().toISOString(),
        week: this.currentWeek,
        year: this.currentYear,
        status: 'success',
        intelligence_score: metrics.intelligence_score,
        quality_grade: metrics.quality_grade,
        cycle_complete: true,
        report_path: reportPath
      }, null, 2));
      console.log('✅ Cycle completion artifact created');
      console.log('');
      
      console.log('✅ Agent 12 execution completed successfully');
      console.log('');
      console.log('Summary:');
      console.log(`- Intelligence Score: ${metrics.intelligence_score}/100 (${metrics.quality_grade})`);
      console.log(`- Agents Success Rate: ${intelligence.cycle_performance.agents_success_rate}%`);
      console.log(`- System Health: ${intelligence.system_health.overall_score}/100`);
      console.log(`- Recommendations: ${metrics.recommendations.length}`);
      
    } catch (error) {
      console.error('❌ Agent 12 execution failed:', error);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const engine = new QAEngine();
  engine.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
