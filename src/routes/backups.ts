/**
 * Backup Management Routes
 * 
 * API endpoints for database backup operations
 */

import { Router, Request, Response } from 'express';
import {
  createBackup,
  listBackups,
  getBackup,
  verifyBackup,
  getBackupStatistics,
  getBackupConfig,
  updateBackupConfig,
  BackupConfig,
} from '../services/backup';
import { authenticateToken } from '../auth/jwt';

const router = Router();

/**
 * Create a manual backup
 * POST /api/backups
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await createBackup('manual');
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Backup created successfully',
        backup: result.backup,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Backup creation failed',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List all backups
 * GET /api/backups
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const backups = await listBackups();
    const stats = await getBackupStatistics();

    res.json({
      success: true,
      backups,
      statistics: stats,
      count: backups.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get backup statistics
 * GET /api/backups/stats
 */
router.get('/stats', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const stats = await getBackupStatistics();

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get backup configuration
 * GET /api/backups/config
 */
router.get('/config', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const config = getBackupConfig();

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get backup by ID
 * GET /api/backups/:id
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const backupId = parseInt(req.params.id);
    
    if (isNaN(backupId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid backup ID',
      });
      return;
    }

    const backup = await getBackup(backupId);
    
    if (!backup) {
      res.status(404).json({
        success: false,
        error: 'Backup not found',
      });
      return;
    }

    res.json({
      success: true,
      backup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Verify backup integrity
 * POST /api/backups/:id/verify
 */
router.post('/:id/verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const backupId = parseInt(req.params.id);
    
    if (isNaN(backupId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid backup ID',
      });
      return;
    }

    const isValid = await verifyBackup(backupId);

    res.json({
      success: true,
      backupId,
      valid: isValid,
      message: isValid ? 'Backup is valid' : 'Backup verification failed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Update backup configuration
 * PUT /api/backups/config
 */
router.put('/config', authenticateToken, async (req: Request, res: Response) => {
  try {
    const updates: Partial<BackupConfig> = req.body;

    // Validate updates
    if (updates.maxBackups !== undefined && (updates.maxBackups < 1 || updates.maxBackups > 100)) {
      res.status(400).json({
        success: false,
        error: 'maxBackups must be between 1 and 100',
      });
      return;
    }

    if (updates.autoBackupInterval !== undefined) {
      if (updates.autoBackupInterval < 3600000) {
        res.status(400).json({
          success: false,
          error: 'autoBackupInterval must be at least 1 hour (3600000ms)',
        });
        return;
      }
      // Maximum allowed interval is 1 week (604800000 ms)
      if (updates.autoBackupInterval >= 604800000) {
        res.status(400).json({
          success: false,
          error: 'autoBackupInterval must be less than 1 week (604800000ms)',
        });
        return;
      }
    }

    updateBackupConfig(updates);
    const config = getBackupConfig();

    res.json({
      success: true,
      message: 'Backup configuration updated',
      config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
