/**
 * Trend Analyzer Module
 * 
 * Analyzes trends in validation data over time
 */

export class TrendAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Analyze trends in validation data
   */
  async analyze(currentData: any, historicalData: any[]): Promise<any> {
    const insights: string[] = [];
    
    // Performance trend
    const perfTrend = this.analyzePerformanceTrend(historicalData);
    if (perfTrend) {
      insights.push(perfTrend);
    }

    // Issue trend
    const issueTrend = this.analyzeIssueTrend(currentData, historicalData);
    if (issueTrend) {
      insights.push(issueTrend);
    }

    // Coverage trend
    const coverageTrend = this.analyzeCoverageTrend(historicalData);
    if (coverageTrend) {
      insights.push(coverageTrend);
    }

    return {
      status: 'complete',
      summary: `Analyzed ${historicalData.length} weeks of data - ${insights.length} insights generated`,
      insights,
      trends: {
        performance: perfTrend,
        issues: issueTrend,
        coverage: coverageTrend
      }
    };
  }

  /**
   * Analyze performance trends
   */
  private analyzePerformanceTrend(historicalData: any[]): string | null {
    if (historicalData.length < 2) {
      return null;
    }

    // Get last 4 weeks of data
    const recentData = historicalData.slice(-4);
    const avgOverhead = recentData.reduce((sum, d) => {
      const overhead = d.validations?.['Loop Protection']?.overhead_ms || 0;
      return sum + overhead;
    }, 0) / recentData.length;

    if (avgOverhead > 5) {
      return `Performance overhead averaging ${avgOverhead.toFixed(1)}ms over last 4 weeks`;
    } else if (avgOverhead < 3) {
      return `Excellent performance - overhead consistently below 3ms`;
    }

    return null;
  }

  /**
   * Analyze issue trends
   */
  private analyzeIssueTrend(currentData: any, historicalData: any[]): string | null {
    const currentIssues = currentData.for_data_analysis?.issues_found || 0;
    
    if (historicalData.length < 1) {
      return `Current week: ${currentIssues} issues found`;
    }

    const lastWeek = historicalData[historicalData.length - 1];
    const lastWeekIssues = lastWeek.validations?.['Loop Protection']?.issues_found || 0;

    if (currentIssues > lastWeekIssues) {
      return `Issue count increased from ${lastWeekIssues} to ${currentIssues} (week-over-week)`;
    } else if (currentIssues < lastWeekIssues) {
      return `Issue count decreased from ${lastWeekIssues} to ${currentIssues} - improvement!`;
    } else {
      return `Issue count stable at ${currentIssues}`;
    }
  }

  /**
   * Analyze coverage trends
   */
  private analyzeCoverageTrend(historicalData: any[]): string | null {
    if (historicalData.length < 2) {
      return null;
    }

    // Check if coverage has been consistently improving
    const recentData = historicalData.slice(-3);
    let improving = true;
    
    for (let i = 1; i < recentData.length; i++) {
      const current = recentData[i].validations?.['Edge Case Coverage']?.status;
      const previous = recentData[i - 1].validations?.['Edge Case Coverage']?.status;
      
      if (current === 'pass' && previous !== 'pass') {
        continue; // improvement
      } else if (current !== 'pass' && previous === 'pass') {
        improving = false;
        break;
      }
    }

    if (improving) {
      return 'Edge case coverage showing consistent improvement';
    }

    return null;
  }
}
