/**
 * LLM API Routes
 * Endpoints for AI-powered workflow features
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../auth/jwt';
import { llmService } from '../services/llm-service';
import { logger } from '../utils/logger';
import { validateRequest, schemas } from '../middleware/validation';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for LLM endpoints (more restrictive due to API costs)
// Configurable via LLM_RATE_LIMIT env var for development
const llmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LLM_RATE_LIMIT || '20'), // Default: 20 LLM calls per 15 minutes
  message: 'Too many LLM requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Get LLM service health status
 * GET /api/llm/health
 */
router.get('/health', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const health = llmService.getHealthStatus();
    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    logger.error('Failed to get LLM health status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get LLM health status'
    });
  }
});

/**
 * Check if LLM service is available
 * GET /api/llm/available
 */
router.get('/available', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const available = llmService.isAvailable();
    res.json({
      success: true,
      data: {
        available,
        provider: llmService.getHealthStatus().provider,
        model: llmService.getHealthStatus().model
      }
    });
  } catch (error: any) {
    logger.error('Failed to check LLM availability', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to check LLM availability'
    });
  }
});

/**
 * Generate workflow from natural language
 * POST /api/llm/generate-workflow
 */
router.post('/generate-workflow', authenticateToken, llmLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!llmService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'LLM service is not available. Please configure API key.'
      });
    }

    const { prompt, context } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string'
      });
    }

    logger.info('Generating workflow from prompt', { 
      userId: req.user?.userId, 
      promptLength: prompt.length 
    });

    const result = await llmService.generateWorkflow({
      prompt,
      context: context || {}
    });

    logger.info('Workflow generated successfully', { 
      userId: req.user?.userId,
      taskCount: result.workflow.tasks.length,
      confidence: result.confidence
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Failed to generate workflow', { 
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate workflow'
    });
  }
});

/**
 * Select appropriate agent for a task
 * POST /api/llm/select-agent
 */
router.post('/select-agent', authenticateToken, llmLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!llmService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'LLM service is not available'
      });
    }

    const { task, parameters, context } = req.body;

    if (!task || typeof task !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Task description is required'
      });
    }

    logger.info('Selecting agent for task', { 
      userId: req.user?.userId,
      task 
    });

    const result = await llmService.selectAgent({
      task,
      parameters: parameters || {},
      context: context || {}
    });

    logger.info('Agent selected', { 
      userId: req.user?.userId,
      agentType: result.agentType,
      confidence: result.confidence
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Failed to select agent', { 
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to select agent'
    });
  }
});

/**
 * Suggest error recovery strategies
 * POST /api/llm/suggest-recovery
 */
router.post('/suggest-recovery', authenticateToken, llmLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!llmService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'LLM service is not available'
      });
    }

    const { error: errorInfo, workflow, taskHistory } = req.body;

    if (!errorInfo || !errorInfo.code || !errorInfo.message) {
      return res.status(400).json({
        success: false,
        error: 'Error information (code and message) is required'
      });
    }

    logger.info('Suggesting error recovery', { 
      userId: req.user?.userId,
      errorCode: errorInfo.code 
    });

    const result = await llmService.suggestErrorRecovery({
      error: errorInfo,
      workflow,
      taskHistory
    });

    logger.info('Error recovery suggestions generated', { 
      userId: req.user?.userId,
      suggestionCount: result.suggestions.length
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Failed to suggest error recovery', { 
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to suggest error recovery'
    });
  }
});

/**
 * Optimize workflow
 * POST /api/llm/optimize-workflow
 */
router.post('/optimize-workflow', authenticateToken, llmLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!llmService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'LLM service is not available'
      });
    }

    const { workflow, metrics } = req.body;

    if (!workflow || !workflow.tasks) {
      return res.status(400).json({
        success: false,
        error: 'Workflow with tasks is required'
      });
    }

    logger.info('Optimizing workflow', { 
      userId: req.user?.userId,
      taskCount: workflow.tasks.length 
    });

    const result = await llmService.optimizeWorkflow({
      workflow,
      metrics: metrics || {}
    });

    logger.info('Workflow optimization complete', { 
      userId: req.user?.userId,
      suggestionCount: result.suggestions.length
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Failed to optimize workflow', { 
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to optimize workflow'
    });
  }
});

/**
 * Generic LLM completion endpoint (for custom use cases)
 * POST /api/llm/complete
 */
router.post('/complete', authenticateToken, llmLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!llmService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'LLM service is not available'
      });
    }

    const { messages, temperature, maxTokens } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    logger.info('LLM completion requested', { 
      userId: req.user?.userId,
      messageCount: messages.length 
    });

    const result = await llmService.complete({
      messages,
      temperature,
      maxTokens
    });

    logger.info('LLM completion successful', { 
      userId: req.user?.userId,
      tokensUsed: result.usage.totalTokens
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('LLM completion failed', { 
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      error: error.message || 'LLM completion failed'
    });
  }
});

export default router;
