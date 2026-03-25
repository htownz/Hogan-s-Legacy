import { Request } from 'express';
import { Session } from 'express-session';
import { IOfficialsStorage } from './storage-officials';
import { EnhancedRequest } from './types/request-types';

// Export for backward compatibility - use the types from request-types.ts in new code
export type { EnhancedRequest as CustomRequest } from './types/request-types';

// Extend Express Session type to include userId
declare module 'express-session' {
  interface Session {
    userId?: number;
  }
}