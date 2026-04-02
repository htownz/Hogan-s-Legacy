/**
 * Shared WebSocket authentication and connection management utilities.
 *
 * All WebSocket servers should use `authenticateWebSocket` on each new
 * connection instead of inlining the auth check.
 */
import { WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { getAuthenticatedUserFromRequest } from "./auth";
import type { User as UserType } from "@shared/schema";
import { createLogger } from "./logger";

const log = createLogger("websocket-auth");

/** Result returned when authentication succeeds. */
export interface AuthenticatedWsConnection {
  user: UserType;
}

/**
 * Authenticate an incoming WebSocket upgrade request using the session cookie.
 *
 * Returns the authenticated user or `null` (after closing the socket with
 * code 1008 – Policy Violation).
 */
export async function authenticateWebSocket(
  ws: WebSocket,
  req: IncomingMessage,
): Promise<AuthenticatedWsConnection | null> {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    if (!user) {
      ws.close(1008, "Authentication required");
      return null;
    }
    return { user };
  } catch (err) {
    log.error({ err }, "WebSocket authentication error");
    ws.close(1011, "Authentication error");
    return null;
  }
}

/**
 * Start a ping/pong heartbeat to detect stale connections.
 *
 * Sends a ping every `intervalMs` milliseconds.  If the peer does not respond
 * with a pong before the *next* ping, the connection is terminated.
 *
 * Returns a cleanup function that should be called when the connection is
 * closed to stop the interval.
 */
export function startHeartbeat(ws: WebSocket, intervalMs = 30_000): () => void {
  let alive = true;

  ws.on("pong", () => {
    alive = true;
  });

  const timer = setInterval(() => {
    if (!alive) {
      ws.terminate();
      return;
    }
    alive = false;
    ws.ping();
  }, intervalMs);

  return () => clearInterval(timer);
}
