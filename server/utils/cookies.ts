import { IncomingMessage } from 'http';

/**
 * Parses cookies from the incoming request headers
 * 
 * @param req The HTTP request
 * @returns An object with cookie names as keys and values as values
 */
export function parseCookies(req: IncomingMessage): { [key: string]: string } {
  const cookies: { [key: string]: string } = {};
  const cookieHeader = req.headers.cookie;
  
  if (!cookieHeader) {
    return cookies;
  }
  
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies[key] = value;
    }
  });
  
  return cookies;
}