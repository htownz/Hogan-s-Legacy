/**
 * Middleware to track and check OpenAI API status
 */
import { Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';

// Constants for status checking
const STATUS_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour
const MAX_CONSECUTIVE_ERRORS = 5;

// Singleton class to track OpenAI API health
class OpenAIHealthTracker {
  private lastCheckTime: number = 0;
  private isHealthy: boolean = true;
  private consecutiveErrors: number = 0;
  private lastErrorMessage: string = '';

  // Get the current health status
  getStatus(): { 
    isHealthy: boolean; 
    lastErrorMessage: string;
    lastChecked: Date | null;
  } {
    return {
      isHealthy: this.isHealthy,
      lastErrorMessage: this.lastErrorMessage,
      lastChecked: this.lastCheckTime ? new Date(this.lastCheckTime) : null
    };
  }

  // Record a successful API call
  recordSuccess(): void {
    this.isHealthy = true;
    this.consecutiveErrors = 0;
    this.lastCheckTime = Date.now();
  }

  // Record a failed API call
  recordError(errorMessage: string): void {
    this.consecutiveErrors++;
    this.lastErrorMessage = errorMessage;
    this.lastCheckTime = Date.now();
    
    // If we've had too many consecutive errors, mark the service as unhealthy
    if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      this.isHealthy = false;
    }
  }

  // Check if we should perform a health check
  shouldCheckHealth(): boolean {
    return !this.lastCheckTime || (Date.now() - this.lastCheckTime) > STATUS_CHECK_INTERVAL;
  }

  // Reset the health status
  reset(): void {
    this.isHealthy = true;
    this.consecutiveErrors = 0;
    this.lastErrorMessage = '';
  }
}

// Create singleton instance
const healthTracker = new OpenAIHealthTracker();

/**
 * Check OpenAI API health with a simple request
 */
export async function checkOpenAIHealth(): Promise<boolean> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Make a minimal API call to check if the API is responding
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use the smaller model for health check
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5 // Minimal response to conserve tokens
    });
    
    if (response.choices && response.choices.length > 0) {
      healthTracker.recordSuccess();
      return true;
    } else {
      healthTracker.recordError("No response choices from OpenAI");
      return false;
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    healthTracker.recordError(errorMessage);
    console.error("OpenAI health check failed:", errorMessage);
    return false;
  }
}

/**
 * Middleware to check OpenAI API status before making calls
 */
export function openAIStatusMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only run checks for OpenAI-related routes
  const isOpenAIRoute = req.path.includes('/api/bills') && 
                        (req.path.includes('/summary') || req.path.includes('/impact'));
  
  if (!isOpenAIRoute) {
    return next();
  }
  
  const status = healthTracker.getStatus();
  
  // If the API is unhealthy, return an error
  if (!status.isHealthy) {
    return res.status(503).json({
      error: "OpenAI API is currently unavailable",
      details: status.lastErrorMessage,
      lastChecked: status.lastChecked
    });
  }
  
  // If it's time to check health, do it asynchronously
  if (healthTracker.shouldCheckHealth()) {
    checkOpenAIHealth().catch(err => {
      console.error("Background health check failed:", err);
    });
  }
  
  next();
}

/**
 * Manual reset of the OpenAI health status (for admin use)
 */
export function resetOpenAIHealthStatus(): void {
  healthTracker.reset();
}

/**
 * Get the current OpenAI API health status
 */
export function getOpenAIHealthStatus(): {
  isHealthy: boolean;
  lastErrorMessage: string;
  lastChecked: Date | null;
} {
  return healthTracker.getStatus();
}