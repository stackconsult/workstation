/**
 * Learning Model - ML-powered optimization and pattern recognition
 * Part of Context Memory Module - Intelligence Layer
 * Version: v0.1.0-context-memory
 * Created: 2025-11-21
 */

import { globalEntityStore } from './entity-store';
import { globalWorkflowHistory, WorkflowAnalytics } from './workflow-history';

// ========== Type Definitions ==========

export type InsightType = 'optimization' | 'pattern' | 'suggestion' | 'warning' | 'prediction';

export interface LearningInsight {
  id: string;
  insight_type: InsightType;
  workflow_id?: string;
  confidence: number; // 0.0 - 1.0
  title: string;
  description: string;
  suggested_action: string;
  impact_estimate: {
    time_saved_ms: number;
    accuracy_improvement: number; // 0.0 - 1.0
    entities_affected: number;
  };
  created_at: Date;
  applied: boolean;
}

export interface WorkflowOptimization {
  workflow_id: string;
  current_avg_duration: number;
  optimized_avg_duration: number;
  improvement_percent: number;
  recommended_changes: string[];
  confidence: number;
}

export interface PredictiveRecommendation {
  next_workflow_id: string;
  workflow_name: string;
  confidence: number;
  reason: string;
  expected_entities: string[];
}

// ========== Learning Model Class ==========

export class LearningModel {
  private insights: Map<string, LearningInsight>;
  private patterns: Map<string, number>; // pattern -> frequency
  private minInsightConfidence: number;

  constructor(minInsightConfidence: number = 0.7) {
    this.insights = new Map();
    this.patterns = new Map();
    this.minInsightConfidence = minInsightConfidence;
  }

  /**
   * Analyze all workflow executions and generate insights
   */
  async analyzeWorkflows(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Get all unique workflow IDs from history
    const recentActivity = globalWorkflowHistory.getRecentActivity(1000);
    const workflowIds = [...new Set(recentActivity.map(e => e.workflow_id))];

    for (const workflowId of workflowIds) {
      const analytics = globalWorkflowHistory.getWorkflowAnalytics(workflowId);
      
      // Generate insights based on analytics
      insights.push(...this.detectBottlenecks(workflowId, analytics));
      insights.push(...this.detectPatterns(workflowId, analytics));
      insights.push(...this.suggestOptimizations(workflowId, analytics));
    }

    // Store high-confidence insights
    insights
      .filter(insight => insight.confidence >= this.minInsightConfidence)
      .forEach(insight => this.insights.set(insight.id, insight));

    return insights;
  }

  /**
   * Predict next workflow based on current context
   */
  predictNextWorkflow(params: {
    current_workflow_id: string;
    entities_in_context: string[];
    user_id: string;
  }): PredictiveRecommendation | null {
    const analytics = globalWorkflowHistory.getWorkflowAnalytics(params.current_workflow_id);
    
    if (!analytics.most_common_next_workflow) {
      return null;
    }

    // Calculate confidence based on frequency
    const chains = globalWorkflowHistory.getCommonChains();
    const relevantChain = chains.find(c => 
      c.workflows[0] === params.current_workflow_id && 
      c.workflows[1] === analytics.most_common_next_workflow
    );

    if (!relevantChain) return null;

    const confidence = Math.min(0.95, relevantChain.frequency / 10); // Cap at 95%

    return {
      next_workflow_id: analytics.most_common_next_workflow,
      workflow_name: analytics.most_common_next_workflow, // Would be enriched with actual name
      confidence,
      reason: `This workflow is triggered ${relevantChain.frequency} times after ${params.current_workflow_id}`,
      expected_entities: params.entities_in_context,
    };
  }

  /**
   * Learn from user corrections and feedback
   */
  async learnFromCorrection(params: {
    workflow_id: string;
    execution_id: string;
    correction_type: 'entity_fix' | 'parameter_adjustment' | 'node_reorder' | 'validation_override';
    correction_details: Record<string, any>;
  }): Promise<void> {
    // Track correction patterns
    const patternKey = `${params.workflow_id}:${params.correction_type}`;
    this.patterns.set(patternKey, (this.patterns.get(patternKey) || 0) + 1);

    // If pattern occurs frequently, generate warning insight
    const frequency = this.patterns.get(patternKey)!;
    if (frequency >= 3) {
      const insight: LearningInsight = {
        id: `warning_${Date.now()}_${Math.random()}`,
        insight_type: 'warning',
        workflow_id: params.workflow_id,
        confidence: Math.min(0.9, frequency / 10),
        title: `Frequent ${params.correction_type} corrections detected`,
        description: `Users have corrected ${params.correction_type} ${frequency} times in workflow ${params.workflow_id}`,
        suggested_action: 'Review workflow configuration and consider automated adjustments',
        impact_estimate: {
          time_saved_ms: frequency * 5000, // 5 seconds per correction
          accuracy_improvement: 0.1,
          entities_affected: frequency,
        },
        created_at: new Date(),
        applied: false,
      };

      this.insights.set(insight.id, insight);
    }
  }

  /**
   * Suggest workflow parameter optimizations
   */
  async optimizeWorkflowParameters(workflow_id: string): Promise<WorkflowOptimization | null> {
    const analytics = globalWorkflowHistory.getWorkflowAnalytics(workflow_id);
    
    if (analytics.total_executions < 10) {
      return null; // Need more data
    }

    const recommended_changes: string[] = [];
    let estimated_improvement = 0;

    // Analyze bottlenecks
    if (analytics.bottleneck_nodes.length > 0) {
      recommended_changes.push(
        `Optimize nodes: ${analytics.bottleneck_nodes.join(', ')}`
      );
      estimated_improvement += 0.2; // 20% improvement
    }

    // Analyze timing
    if (analytics.peak_usage_hours.length > 0) {
      recommended_changes.push(
        `Consider scheduling during off-peak hours: ${analytics.peak_usage_hours.map(h => `${h}:00`).join(', ')}`
      );
      estimated_improvement += 0.1; // 10% improvement
    }

    // Analyze success rate
    if (analytics.failure_count / analytics.total_executions > 0.2) {
      recommended_changes.push(
        'Add retry logic and better error handling (failure rate > 20%)'
      );
      estimated_improvement += 0.15;
    }

    if (recommended_changes.length === 0) {
      return null;
    }

    return {
      workflow_id,
      current_avg_duration: analytics.avg_duration_ms,
      optimized_avg_duration: analytics.avg_duration_ms * (1 - estimated_improvement),
      improvement_percent: estimated_improvement * 100,
      recommended_changes,
      confidence: 0.75,
    };
  }

  /**
   * Detect bottlenecks from analytics
   */
  private detectBottlenecks(workflow_id: string, analytics: WorkflowAnalytics): LearningInsight[] {
    const insights: LearningInsight[] = [];

    if (analytics.bottleneck_nodes.length > 0) {
      insights.push({
        id: `bottleneck_${workflow_id}_${Date.now()}`,
        insight_type: 'warning',
        workflow_id,
        confidence: 0.85,
        title: `Bottleneck detected in workflow`,
        description: `Nodes ${analytics.bottleneck_nodes.join(', ')} have high error rates`,
        suggested_action: 'Review node configuration and add error handling',
        impact_estimate: {
          time_saved_ms: 10000,
          accuracy_improvement: 0.15,
          entities_affected: analytics.total_executions,
        },
        created_at: new Date(),
        applied: false,
      });
    }

    return insights;
  }

  /**
   * Detect usage patterns
   */
  private detectPatterns(workflow_id: string, analytics: WorkflowAnalytics): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Pattern: High usage during specific hours
    if (analytics.peak_usage_hours.length > 0) {
      insights.push({
        id: `pattern_${workflow_id}_${Date.now()}`,
        insight_type: 'pattern',
        workflow_id,
        confidence: 0.9,
        title: 'Peak usage pattern detected',
        description: `Workflow is most active during ${analytics.peak_usage_hours.map(h => `${h}:00`).join(', ')}`,
        suggested_action: 'Consider pre-warming resources during peak hours',
        impact_estimate: {
          time_saved_ms: 5000,
          accuracy_improvement: 0.05,
          entities_affected: analytics.total_executions,
        },
        created_at: new Date(),
        applied: false,
      });
    }

    // Pattern: Consistent next workflow
    if (analytics.most_common_next_workflow) {
      insights.push({
        id: `pattern_chain_${workflow_id}_${Date.now()}`,
        insight_type: 'suggestion',
        workflow_id,
        confidence: 0.8,
        title: 'Workflow chain opportunity',
        description: `${workflow_id} frequently triggers ${analytics.most_common_next_workflow}`,
        suggested_action: 'Create automatic handoff or combined workflow',
        impact_estimate: {
          time_saved_ms: 15000,
          accuracy_improvement: 0.1,
          entities_affected: Math.floor(analytics.total_executions * 0.7),
        },
        created_at: new Date(),
        applied: false,
      });
    }

    return insights;
  }

  /**
   * Suggest optimizations based on performance
   */
  private suggestOptimizations(workflow_id: string, analytics: WorkflowAnalytics): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Suggest optimization if duration is high
    if (analytics.avg_duration_ms > 30000) { // > 30 seconds
      insights.push({
        id: `optimization_${workflow_id}_${Date.now()}`,
        insight_type: 'optimization',
        workflow_id,
        confidence: 0.75,
        title: 'Performance optimization opportunity',
        description: `Average execution time is ${(analytics.avg_duration_ms / 1000).toFixed(1)}s`,
        suggested_action: 'Implement caching, parallel execution, or reduce data processing',
        impact_estimate: {
          time_saved_ms: analytics.avg_duration_ms * 0.3, // 30% improvement
          accuracy_improvement: 0,
          entities_affected: analytics.total_executions,
        },
        created_at: new Date(),
        applied: false,
      });
    }

    // Suggest improvement if accuracy is low
    if (analytics.avg_accuracy < 0.8 && analytics.avg_accuracy > 0) {
      insights.push({
        id: `accuracy_${workflow_id}_${Date.now()}`,
        insight_type: 'optimization',
        workflow_id,
        confidence: 0.8,
        title: 'Accuracy improvement needed',
        description: `Average accuracy is ${(analytics.avg_accuracy * 100).toFixed(1)}%`,
        suggested_action: 'Review entity extraction logic and validation rules',
        impact_estimate: {
          time_saved_ms: 0,
          accuracy_improvement: 0.2,
          entities_affected: analytics.total_executions,
        },
        created_at: new Date(),
        applied: false,
      });
    }

    return insights;
  }

  /**
   * Get all insights
   */
  getInsights(filter?: { type?: InsightType; workflow_id?: string }): LearningInsight[] {
    let insights = Array.from(this.insights.values());

    if (filter?.type) {
      insights = insights.filter(i => i.insight_type === filter.type);
    }

    if (filter?.workflow_id) {
      insights = insights.filter(i => i.workflow_id === filter.workflow_id);
    }

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Mark insight as applied
   */
  markInsightApplied(insight_id: string): void {
    const insight = this.insights.get(insight_id);
    if (insight) {
      insight.applied = true;
    }
  }

  /**
   * Clear all insights
   */
  clear(): void {
    this.insights.clear();
    this.patterns.clear();
  }
}

// ========== Singleton Instance ==========

export const globalLearningModel = new LearningModel();
