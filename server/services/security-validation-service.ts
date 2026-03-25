import OpenAI from 'openai';

// Initialize OpenAI client for content validation
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface SecurityValidationResult {
  isValid: boolean;
  confidence: number;
  reason?: string;
  category: 'civic_engagement' | 'suspicious' | 'malicious' | 'commercial_abuse' | 'unclear';
  recommendedAction: 'allow' | 'block' | 'flag_for_review';
}

/**
 * Validates that content and requests are for legitimate civic purposes
 */
export async function validateCivicPurpose(
  content: string,
  context: {
    userAgent?: string;
    endpoint: string;
    method: string;
    ip?: string;
  }
): Promise<SecurityValidationResult> {
  try {
    // Quick validation for obvious civic content
    const civicKeywords = [
      'bill', 'legislation', 'vote', 'representative', 'senator', 'congress',
      'democracy', 'civic', 'government', 'policy', 'law', 'ethics',
      'transparency', 'accountability', 'citizen', 'constituent', 'election'
    ];

    const suspiciousKeywords = [
      'hack', 'exploit', 'bypass', 'injection', 'malware', 'phishing',
      'scrape', 'bot', 'automated', 'spam', 'commercial', 'profit',
      'marketing', 'advertisement', 'selling', 'business'
    ];

    const contentLower = content.toLowerCase();
    const hasCivicContent = civicKeywords.some(keyword => contentLower.includes(keyword));
    const hasSuspiciousContent = suspiciousKeywords.some(keyword => contentLower.includes(keyword));

    // If clearly suspicious, block immediately
    if (hasSuspiciousContent && !hasCivicContent) {
      return {
        isValid: false,
        confidence: 0.9,
        reason: 'Content contains suspicious keywords not related to civic engagement',
        category: 'suspicious',
        recommendedAction: 'block'
      };
    }

    // If clearly civic, allow immediately
    if (hasCivicContent && !hasSuspiciousContent) {
      return {
        isValid: true,
        confidence: 0.8,
        category: 'civic_engagement',
        recommendedAction: 'allow'
      };
    }

    // Use AI for nuanced validation
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a security validator for a civic engagement platform. Your job is to determine if content is related to legitimate democratic participation, legislative transparency, or civic engagement.

ALLOW: Content about bills, voting, representatives, government transparency, civic education, democracy, political accountability, legislative analysis, citizen engagement.

BLOCK: Content about hacking, exploitation, commercial activities, spam, non-civic automation, data scraping for profit, malicious activities, or anything unrelated to civic engagement.

Respond with a security assessment.`
        },
        {
          role: 'user',
          content: `Validate this content for civic purpose:
Content: "${content}"
Endpoint: ${context.endpoint}
Method: ${context.method}
User Agent: ${context.userAgent || 'unknown'}`
        }
      ],
      functions: [
        {
          name: 'validateContent',
          description: 'Validate content for civic engagement purposes',
          parameters: {
            type: 'object',
            properties: {
              isValid: {
                type: 'boolean',
                description: 'Whether the content is valid for civic engagement'
              },
              confidence: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Confidence level of the assessment'
              },
              reason: {
                type: 'string',
                description: 'Explanation of the decision'
              },
              category: {
                type: 'string',
                enum: ['civic_engagement', 'suspicious', 'malicious', 'commercial_abuse', 'unclear'],
                description: 'Category of the content'
              },
              recommendedAction: {
                type: 'string',
                enum: ['allow', 'block', 'flag_for_review'],
                description: 'Recommended action to take'
              }
            },
            required: ['isValid', 'confidence', 'category', 'recommendedAction']
          }
        }
      ],
      function_call: { name: 'validateContent' }
    });

    if (response.choices[0].message.function_call) {
      const functionCall = response.choices[0].message.function_call;
      const result = JSON.parse(functionCall.arguments);
      
      // Log validation for audit trail
      console.log('Security validation completed:', {
        endpoint: context.endpoint,
        result: result.category,
        confidence: result.confidence,
        timestamp: new Date().toISOString()
      });

      return result;
    }

    // Fallback validation
    return {
      isValid: hasCivicContent,
      confidence: 0.5,
      reason: 'AI validation unavailable, using keyword-based fallback',
      category: hasCivicContent ? 'civic_engagement' : 'unclear',
      recommendedAction: hasCivicContent ? 'allow' : 'flag_for_review'
    };

  } catch (error: any) {
    console.error('Security validation error:', error);
    
    // Conservative fallback - allow but flag for review
    return {
      isValid: true,
      confidence: 0.3,
      reason: 'Validation service error - defaulting to manual review',
      category: 'unclear',
      recommendedAction: 'flag_for_review'
    };
  }
}

/**
 * Validates API usage patterns to prevent abuse
 */
export function validateUsagePattern(
  requests: Array<{ timestamp: Date; endpoint: string; userAgent?: string }>
): {
  isValid: boolean;
  violations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  const violations: string[] = [];
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Check for rapid-fire requests (potential bot)
  const recentRequests = requests.filter(r => 
    Date.now() - r.timestamp.getTime() < 60000 // Last minute
  );

  if (recentRequests.length > 50) {
    violations.push('Excessive request rate detected');
    severity = 'high';
  }

  // Check for automated patterns
  const userAgents = requests.map(r => r.userAgent).filter(Boolean);
  const uniqueUserAgents = new Set(userAgents);
  
  if (userAgents.length > 10 && uniqueUserAgents.size === 1) {
    violations.push('Consistent user agent suggests automation');
    severity = severity === 'high' ? 'critical' : 'medium';
  }

  // Check for endpoint abuse
  const endpointCounts = requests.reduce((acc, req) => {
    acc[req.endpoint] = (acc[req.endpoint] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxEndpointRequests = Math.max(...Object.values(endpointCounts));
  if (maxEndpointRequests > 100) {
    violations.push('Excessive requests to single endpoint');
    severity = 'high';
  }

  return {
    isValid: violations.length === 0,
    violations,
    severity
  };
}

/**
 * Content sanitization to prevent injection attacks
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/eval\s*\(/gi, '')
      .replace(/exec\s*\(/gi, '')
      .trim();
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

/**
 * Validates that bill IDs are legitimate
 */
export function validateBillId(billId: any): boolean {
  if (typeof billId !== 'number' && typeof billId !== 'string') {
    return false;
  }

  const id = String(billId);
  
  // Check for reasonable bill ID format
  const validPatterns = [
    /^\d+$/, // Pure numeric
    /^[A-Z]{1,3}\s?\d+$/, // HB 123, SB 456, etc.
    /^[A-Z]{1,3}-?\d+$/ // HB-123, SB-456, etc.
  ];

  return validPatterns.some(pattern => pattern.test(id)) && id.length <= 20;
}

/**
 * Rate limiting check for AI/expensive operations
 */
export function checkRateLimit(
  userId: string | number,
  operation: string,
  rateLimits: Record<string, { requests: number; window: number; max: number }>
): { allowed: boolean; resetTime?: Date } {
  const key = `${userId}-${operation}`;
  const limit = rateLimits[key];

  if (!limit) {
    rateLimits[key] = {
      requests: 1,
      window: Date.now(),
      max: 10 // Default limit
    };
    return { allowed: true };
  }

  const now = Date.now();
  const windowStart = limit.window;
  const windowDuration = 15 * 60 * 1000; // 15 minutes

  // Reset window if expired
  if (now - windowStart > windowDuration) {
    limit.requests = 1;
    limit.window = now;
    return { allowed: true };
  }

  // Check if within limits
  if (limit.requests >= limit.max) {
    return { 
      allowed: false, 
      resetTime: new Date(windowStart + windowDuration)
    };
  }

  limit.requests++;
  return { allowed: true };
}