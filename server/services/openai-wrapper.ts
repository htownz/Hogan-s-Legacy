// @ts-nocheck
/**
 * OpenAI API Client Wrapper
 * 
 * A robust wrapper around the OpenAI API client that provides:
 * - Rate limiting with token bucket algorithm
 * - Exponential backoff retries for rate limit and server errors
 * - Error handling and logging
 * - Automatic fallbacks to simpler models when advanced models fail
 */

import OpenAI from "openai";
import { getOpenAIHealthStatus } from "../middleware/openai-status";

// Initialize the OpenAI client 
// (The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user)
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Rate limit configurations
const RATE_LIMIT = {
  tokensPerMinute: 90000, // RPM for paid account (90k tokens per minute)
  maxRetries: 5,
  initialBackoffMs: 1000, // Start with 1 second delay
  maxBackoffMs: 60000,    // Max 1 minute delay
  backoffFactor: 2,       // Double the delay with each retry
  jitterFactor: 0.1       // Add 10% random jitter to prevent thundering herd
};

// Track the token usage
let tokenBucket = {
  tokens: RATE_LIMIT.tokensPerMinute,
  lastRefill: Date.now()
};

// Refill token bucket based on time elapsed
function refillTokenBucket(): void {
  const now = Date.now();
  const timeElapsedMs = now - tokenBucket.lastRefill;
  const tokensToAdd = Math.floor((timeElapsedMs / 60000) * RATE_LIMIT.tokensPerMinute);
  
  if (tokensToAdd > 0) {
    tokenBucket.tokens = Math.min(
      RATE_LIMIT.tokensPerMinute, 
      tokenBucket.tokens + tokensToAdd
    );
    tokenBucket.lastRefill = now;
  }
}

// Take tokens from the bucket
function consumeTokens(tokens: number): boolean {
  refillTokenBucket();
  
  if (tokenBucket.tokens >= tokens) {
    tokenBucket.tokens -= tokens;
    return true;
  }
  
  return false;
}

// Calculate backoff delay with jitter
function calculateBackoff(attempt: number): number {
  const backoff = Math.min(
    RATE_LIMIT.maxBackoffMs,
    RATE_LIMIT.initialBackoffMs * Math.pow(RATE_LIMIT.backoffFactor, attempt)
  );
  
  // Add random jitter to prevent thundering herd problem
  const jitter = backoff * RATE_LIMIT.jitterFactor * Math.random();
  return backoff + jitter;
}

// Wait for the specified time
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Estimate token usage for a request (rough estimation)
function estimateTokenUsage(messages: Array<any>, model: string, maxTokens?: number): number {
  // Rough character to token ratio (this is approximate)
  const CHAR_TO_TOKEN_RATIO = 4;
  
  // Calculate input tokens from messages
  let inputTokens = 0;
  for (const message of messages) {
    if (typeof message.content === 'string') {
      inputTokens += Math.ceil(message.content.length / CHAR_TO_TOKEN_RATIO);
    } else if (Array.isArray(message.content)) {
      // Handle multi-modal content
      for (const content of message.content) {
        if (typeof content === 'string' || content.type === 'text') {
          inputTokens += Math.ceil((content.text || content).length / CHAR_TO_TOKEN_RATIO);
        } else if (content.type === 'image_url') {
          // Images use a lot of tokens, rough estimate
          inputTokens += 1000;
        }
      }
    }
  }
  
  // Estimate output tokens (use maxTokens if provided, otherwise guess based on model)
  const outputTokens = maxTokens || (model.includes('gpt-4') ? 1500 : 500);
  
  // Add some buffer for API overhead
  return inputTokens + outputTokens + 100;
}

// Determine if an error is retryable
function isRetryableError(error: any): boolean {
  // Check for rate limit errors
  if (error.status === 429 || error.code === 'rate_limit_exceeded' || 
      error.type === 'insufficient_quota' || error.code === 'insufficient_quota') {
    return true;
  }
  
  // Check for server errors (5xx)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // Check for specific OpenAI error types that might be transient
  const transientErrorTypes = [
    'server_error',
    'timeout',
    'connection_error',
    'service_unavailable'
  ];
  
  return transientErrorTypes.includes(error.type);
}

// Helper to determine if we should fallback to a simpler model
function shouldUseFallbackModel(error: any): boolean {
  // Only fallback for specific errors that suggest model issues
  return error.status === 400 || 
         error.code === 'context_length_exceeded' || 
         error.type === 'invalid_request_error';
}

// Get a fallback model based on the current model
function getFallbackModel(model: string): string {
  // Model fallback hierarchy
  const modelFallbacks: Record<string, string> = {
    'gpt-4o': 'gpt-4',
    'gpt-4': 'gpt-3.5-turbo-16k',
    'gpt-3.5-turbo-16k': 'gpt-3.5-turbo',
    'dall-e-3': 'dall-e-2'
  };
  
  return modelFallbacks[model] || 'gpt-3.5-turbo';
}

/**
 * Make a robust chat completion request with retries and fallbacks
 */
export async function robustChatCompletion(
  params: OpenAI.Chat.ChatCompletionCreateParams,
  options: {
    logger?: (message: string) => void,
    fallbackAllowed?: boolean,
    estimatedTokens?: number
  } = {}
): Promise<OpenAI.Chat.ChatCompletion> {
  const { 
    logger = console.log, 
    fallbackAllowed = true,
    estimatedTokens
  } = options;
  
  // Check if OpenAI API is healthy
  const healthStatus = getOpenAIHealthStatus();
  if (!healthStatus.isHealthy) {
    throw new Error(`OpenAI API is unhealthy: ${healthStatus.lastErrorMessage}`);
  }
  
  // Use estimate or calculate token usage
  const modelStr = typeof params.model === 'string' ? params.model : 'gpt-3.5-turbo';
  const tokenEstimate = estimatedTokens || estimateTokenUsage(params.messages, modelStr, params.max_tokens);
  
  // Check rate limit with token bucket
  if (!consumeTokens(tokenEstimate)) {
    logger(`Rate limit exceeded, waiting for token bucket to refill...`);
    await sleep(5000); // Wait 5 seconds before retrying
    return robustChatCompletion(params, options);
  }
  
  let currentModel = params.model;
  let attempts = 0;
  
  // Retry loop
  while (attempts < RATE_LIMIT.maxRetries) {
    try {
      // Update model in parameters (in case we're using a fallback)
      const requestParams = { ...params, model: currentModel };
      
      // Log the request if excessive retries are happening
      if (attempts > 0) {
        logger(`Attempt ${attempts + 1}/${RATE_LIMIT.maxRetries} with model ${currentModel}`);
      }
      
      // Make the request
      const response = await openaiClient.chat.completions.create(requestParams);
      
      // Log token usage for monitoring if available
      if ('usage' in response) {
        const inputTokens = response.usage?.prompt_tokens || 0;
        const outputTokens = response.usage?.completion_tokens || 0;
        logger(`OpenAI request successful: ${inputTokens} input tokens, ${outputTokens} output tokens`);
      } else {
        logger(`OpenAI request successful, but no token usage information available`);
      }
      
      return response as OpenAI.Chat.ChatCompletion;
      
    } catch (error: any) {
      attempts++;
      
      // Log the error
      logger(`OpenAI API error (attempt ${attempts}/${RATE_LIMIT.maxRetries}): ${error.message}`);
      
      // Handle errors
      if (isRetryableError(error)) {
        // Get retry-after header or use calculated backoff
        const retryAfterHeader = error.response?.headers?.get('retry-after');
        let retryAfterSeconds: number | undefined;
        
        if (retryAfterHeader) {
          const parsed = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsed)) {
            retryAfterSeconds = parsed;
          }
        }
        
        const backoffMs = retryAfterSeconds 
          ? retryAfterSeconds * 1000 
          : calculateBackoff(attempts);
        
        logger(`Rate limit or server error, retrying in ${Math.ceil(backoffMs / 1000)} seconds...`);
        await sleep(backoffMs);
        
        // Continue to next attempt
        continue;
      } else if (fallbackAllowed && shouldUseFallbackModel(error) && attempts < RATE_LIMIT.maxRetries - 1) {
        // Try a fallback model
        const currModelStr = typeof currentModel === 'string' ? currentModel : 'gpt-4o';
        const fallbackModel = getFallbackModel(currModelStr);
        
        // If no fallback or we're already at the simplest model, just retry with same model
        if (fallbackModel === currentModel) {
          logger(`Model fallback not available for ${currentModel}, retrying...`);
          await sleep(calculateBackoff(attempts));
          continue;
        }
        
        logger(`Falling back from ${currentModel} to ${fallbackModel}...`);
        currentModel = fallbackModel;
        
        // Wait before retrying with new model
        await sleep(calculateBackoff(attempts));
        continue;
      }
      
      // If we've exhausted retries or it's a non-retryable error, throw
      throw error;
    }
  }
  
  // If we get here, we've exhausted all retries
  throw new Error(`Failed after ${RATE_LIMIT.maxRetries} attempts to call OpenAI API`);
}

/**
 * Make a robust image generation request with retries and fallbacks
 */
export async function robustImageGeneration(
  params: OpenAI.Images.ImageGenerateParams,
  options: {
    logger?: (message: string) => void,
    fallbackAllowed?: boolean
  } = {}
): Promise<OpenAI.Images.ImagesResponse> {
  const { 
    logger = console.log, 
    fallbackAllowed = true
  } = options;
  
  // Check if OpenAI API is healthy
  const healthStatus = getOpenAIHealthStatus();
  if (!healthStatus.isHealthy) {
    throw new Error(`OpenAI API is unhealthy: ${healthStatus.lastErrorMessage}`);
  }
  
  // Token cost for image generation (rough estimate)
  const tokenEstimate = 5000;
  
  // Check rate limit with token bucket
  if (!consumeTokens(tokenEstimate)) {
    logger(`Rate limit exceeded, waiting for token bucket to refill...`);
    await sleep(5000); // Wait 5 seconds before retrying
    return robustImageGeneration(params, options);
  }
  
  let currentModel = params.model || 'dall-e-3';
  let attempts = 0;
  
  // Retry loop
  while (attempts < RATE_LIMIT.maxRetries) {
    try {
      // Update model in parameters (in case we're using a fallback)
      const requestParams = { ...params, model: currentModel };
      
      // Log the request if excessive retries are happening
      if (attempts > 0) {
        logger(`Attempt ${attempts + 1}/${RATE_LIMIT.maxRetries} with model ${currentModel}`);
      }
      
      // Make the request
      const response = await openaiClient.images.generate(requestParams);
      
      logger(`Image generation successful with model ${currentModel}`);
      return response;
      
    } catch (error: any) {
      attempts++;
      
      // Log the error
      logger(`OpenAI image API error (attempt ${attempts}/${RATE_LIMIT.maxRetries}): ${error.message}`);
      
      // Handle errors
      if (isRetryableError(error)) {
        // Get retry-after header or use calculated backoff
        const retryAfterHeader = error.response?.headers?.get('retry-after');
        let retryAfterSeconds: number | undefined;
        
        if (retryAfterHeader) {
          const parsed = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsed)) {
            retryAfterSeconds = parsed;
          }
        }
        
        const backoffMs = retryAfterSeconds 
          ? retryAfterSeconds * 1000 
          : calculateBackoff(attempts);
        
        logger(`Rate limit or server error, retrying in ${Math.ceil(backoffMs / 1000)} seconds...`);
        await sleep(backoffMs);
        
        // Continue to next attempt
        continue;
      } else if (fallbackAllowed && shouldUseFallbackModel(error) && attempts < RATE_LIMIT.maxRetries - 1) {
        // Try a fallback model
        const currModelStr = typeof currentModel === 'string' ? currentModel : 'dall-e-3';
        const fallbackModel = getFallbackModel(currModelStr);
        
        // If no fallback or we're already at the simplest model, just retry with same model
        if (fallbackModel === currentModel) {
          logger(`Model fallback not available for ${currentModel}, retrying...`);
          await sleep(calculateBackoff(attempts));
          continue;
        }
        
        logger(`Falling back from ${currentModel} to ${fallbackModel}...`);
        currentModel = fallbackModel;
        
        // Wait before retrying with new model
        await sleep(calculateBackoff(attempts));
        continue;
      }
      
      // If we've exhausted retries or it's a non-retryable error, throw
      throw error;
    }
  }
  
  // If we get here, we've exhausted all retries
  throw new Error(`Failed after ${RATE_LIMIT.maxRetries} attempts to call OpenAI image API`);
}

/**
 * Make a robust moderation request with retries
 */
export async function robustModeration(
  input: string | string[],
  options: {
    logger?: (message: string) => void
  } = {}
): Promise<OpenAI.Moderations.ModerationCreateResponse> {
  const { logger = console.log } = options;
  
  // Check if OpenAI API is healthy
  const healthStatus = getOpenAIHealthStatus();
  if (!healthStatus.isHealthy) {
    throw new Error(`OpenAI API is unhealthy: ${healthStatus.lastErrorMessage}`);
  }
  
  // Estimate token usage (moderation typically uses fewer tokens)
  const tokenEstimate = typeof input === 'string' 
    ? Math.ceil(input.length / 4) 
    : Math.ceil(input.join(' ').length / 4);
  
  // Check rate limit with token bucket
  if (!consumeTokens(tokenEstimate)) {
    logger(`Rate limit exceeded, waiting for token bucket to refill...`);
    await sleep(5000); // Wait 5 seconds before retrying
    return robustModeration(input, options);
  }
  
  let attempts = 0;
  
  // Retry loop
  while (attempts < RATE_LIMIT.maxRetries) {
    try {
      // Make the request
      const response = await openaiClient.moderations.create({ input });
      
      logger(`Moderation request successful`);
      return response;
      
    } catch (error: any) {
      attempts++;
      
      // Log the error
      logger(`OpenAI moderation API error (attempt ${attempts}/${RATE_LIMIT.maxRetries}): ${error.message}`);
      
      // Handle errors
      if (isRetryableError(error)) {
        // Get retry-after header or use calculated backoff
        const retryAfterHeader = error.response?.headers?.get('retry-after');
        let retryAfterSeconds: number | undefined;
        
        if (retryAfterHeader) {
          const parsed = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsed)) {
            retryAfterSeconds = parsed;
          }
        }
        
        const backoffMs = retryAfterSeconds 
          ? retryAfterSeconds * 1000 
          : calculateBackoff(attempts);
        
        logger(`Rate limit or server error, retrying in ${Math.ceil(backoffMs / 1000)} seconds...`);
        await sleep(backoffMs);
        
        // Continue to next attempt
        continue;
      }
      
      // If we've exhausted retries or it's a non-retryable error, throw
      throw error;
    }
  }
  
  // If we get here, we've exhausted all retries
  throw new Error(`Failed after ${RATE_LIMIT.maxRetries} attempts to call OpenAI moderation API`);
}

/**
 * Export raw OpenAI client for any use cases not covered by the robust wrappers
 */
export { openaiClient };