/**
 * OpenAI API Status Routes
 * 
 * Provides endpoints for checking and managing the status of the OpenAI API integration.
 */
import { Request, Response, Express } from 'express';
import { isAuthenticated } from './auth';
import {
  checkOpenAIHealth,
  getOpenAIHealthStatus,
  resetOpenAIHealthStatus
} from './middleware/openai-status';
import { createLogger } from "./logger";
const log = createLogger("routes-openai-status");


/**
 * Register OpenAI status routes
 */
export function registerOpenAIStatusRoutes(app: Express): void {
  /**
   * Get the current OpenAI API health status
   */
  app.get('/api/openai/status', async (_req: Request, res: Response) => {
    const status = getOpenAIHealthStatus();
    return res.json({
      isHealthy: status.isHealthy,
      lastChecked: status.lastChecked,
      serviceStatus: status.isHealthy ? 'operational' : 'degraded'
    });
  });

  /**
   * Trigger a manual health check of the OpenAI API
   * This endpoint requires authentication
   */
  app.post('/api/openai/check-health', isAuthenticated, async (_req: Request, res: Response) => {
    try {
      const isHealthy = await checkOpenAIHealth();
      return res.json({
        success: true,
        isHealthy,
        message: isHealthy ? 'OpenAI API is operational' : 'OpenAI API is not responding correctly'
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error checking OpenAI health');
      return res.status(500).json({
        success: false,
        error: 'Failed to check OpenAI API health'
      });
    }
  });

  /**
   * Reset the OpenAI health status tracker
   * This endpoint requires authentication
   */
  app.post('/api/openai/reset-status', isAuthenticated, async (_req: Request, res: Response) => {
    try {
      resetOpenAIHealthStatus();
      const isHealthy = await checkOpenAIHealth();
      
      return res.json({
        success: true,
        isHealthy,
        message: 'OpenAI health status has been reset and rechecked'
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error resetting OpenAI health status');
      return res.status(500).json({
        success: false,
        error: 'Failed to reset OpenAI health status'
      });
    }
  });
}