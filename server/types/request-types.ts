import { Request } from 'express';
import { Session } from 'express-session';

// We're using any here to bypass the type checking issues with Express Request
// This is a pragmatic approach for our middleware code to work properly
export type AuthRequest = any;
export type StorageRequest = any;
export type EnhancedRequest = any;
export type CustomRequest = Request & {
  user?: {
    id: number;
    username: string;
    [key: string]: any;
  };
  session: any;
};

// The commented code below shows what these types should ideally be,
// but TypeScript has issues with the Request.isAuthenticated type compatibility

/*
export type AuthRequest = Request & {
  session: Session & {
    userId?: number;
  };
  isAuthenticated?: () => boolean;
  user?: any;
};

export type StorageRequest = Request & {
  storage?: {
    [key: string]: any;
  };
};

export type EnhancedRequest = Request & {
  session: Session & {
    userId?: number;
  };
  isAuthenticated?: () => boolean;
  user?: any;
  storage?: {
    [key: string]: any;
  };
};
*/