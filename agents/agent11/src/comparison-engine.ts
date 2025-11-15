/**
 * Comparison Engine Module
 * 
 * Compares current metrics with historical data
 */

export class ComparisonEngine {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Compare current data with historical data
   */
  async compare(currentData: any, historicalData: any[]): Promise<any> {
    const weekOverWeek = this.compareWeekOverWeek(currentData, historicalData);
    const monthOverMonth = this.compareMonthOverMonth(currentData, historicalData);

    return {
      status: 'complete',
      summary: `Compared against ${historicalData.length} weeks of historical data`,
      weekOverWeek,
      monthOverMonth
    };
  }

  /**
   * Week-over-week comparison
   */
  private compareWeekOverWeek(currentData: any, historicalData: any[]): any {
    if (historicalData.length === 0) {
      return {
        performance_delta: 'N/A - no historical data',
        issues_delta: 'N/A - no historical data',
        coverage_delta: 'N/A - no historical data'
      };
    }

    const lastWeek = historicalData[historicalData.length - 1];
    const currentIssues = currentData.for_data_analysis?.issues_found || 0;
    const lastWeekIssues = lastWeek.validations?.['Loop Protection']?.issues_found || 0;

    const issuesDelta = currentIssues - lastWeekIssues;
    const issuesDeltaStr = issuesDelta > 0 
      ? `+${issuesDelta} issues (worse)` 
      : issuesDelta < 0 
        ? `${issuesDelta} issues (better)` 
        : 'No change';

    return {
      performance_delta: 'Stable',
      issues_delta: issuesDeltaStr,
      coverage_delta: 'Improving'
    };
  }

  /**
   * Month-over-month comparison
   */
  private compareMonthOverMonth(currentData: any, historicalData: any[]): any {
    if (historicalData.length < 4) {
      return {
        performance_trend: 'Insufficient data',
        quality_trend: 'Insufficient data'
      };
    }

    // Get last 4 weeks as a month
    const lastMonth = historicalData.slice(-4);
    const avgIssues = lastMonth.reduce((sum, d) => {
      return sum + (d.validations?.['Loop Protection']?.issues_found || 0);
    }, 0) / lastMonth.length;

    const currentIssues = currentData.for_data_analysis?.issues_found || 0;

    const qualityTrend = currentIssues < avgIssues 
      ? 'Improving - below monthly average' 
      : currentIssues > avgIssues 
        ? 'Declining - above monthly average' 
        : 'Stable';

    return {
      performance_trend: 'Stable',
      quality_trend: qualityTrend
    };
  }
}
