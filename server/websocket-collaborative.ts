import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { collaborativeStorage } from './storage-collaborative';
import { getAuthenticatedUserFromRequest } from './auth';
import { createLogger } from "./logger";
const log = createLogger("websocket-collaborative");


// Define message types
type MessageType = 
  | 'join'
  | 'leave'
  | 'cursor_position'
  | 'text_change'
  | 'selection_change'
  | 'user_activity'
  | 'comment_add'
  | 'comment_update'
  | 'comment_resolve'
  | 'version_create'
  | 'error'
  | 'ping';

// Define message structure
interface WebSocketMessage {
  type: MessageType;
  sessionId: number;
  userId?: number;
  data?: any;
  timestamp?: number;
}

// Define client with user context
interface CollaborativeClient extends WebSocket {
  userId?: number;
  username?: string;
  displayName?: string;
  sessionId?: number;
  isAlive: boolean;
}

// Map to store session subscribers
const sessionClients: Map<number, Map<number, CollaborativeClient>> = new Map();

// Initialize WebSocket Server
export function initializeCollaborativeWebsockets(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws/collaborative' });

  wss.on('connection', async (ws: CollaborativeClient, req) => {
    // Set initial connection state
    ws.isAlive = true;

    try {
      const user = await getAuthenticatedUserFromRequest(req);
      
      if (!user) {
        sendError(ws, 'Invalid authentication');
        ws.close();
        return;
      }

      // Set user info on the connection
      ws.userId = user.id;
      ws.username = user.username;
      ws.displayName = user.displayName || user.name;

      // Set up ping-pong for keeping connection alive
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle messages
      ws.on('message', async (message: string) => {
        try {
          const parsedMessage: WebSocketMessage = JSON.parse(message);
          
          if (!parsedMessage.type || !parsedMessage.sessionId) {
            sendError(ws, 'Invalid message format');
            return;
          }

          // Add timestamp and user info to all outgoing messages
          parsedMessage.timestamp = Date.now();
          parsedMessage.userId = ws.userId;

          // Handle different message types
          switch (parsedMessage.type) {
            case 'join':
              await handleJoin(ws, parsedMessage);
              break;
            case 'leave':
              await handleLeave(ws, parsedMessage);
              break;
            case 'cursor_position':
              await handleCursorPosition(ws, parsedMessage);
              break;
            case 'text_change':
              await handleTextChange(ws, parsedMessage);
              break;
            case 'selection_change':
              await handleSelectionChange(ws, parsedMessage);
              break;
            case 'user_activity':
              await handleUserActivity(ws, parsedMessage);
              break;
            case 'comment_add':
              await handleCommentAdd(ws, parsedMessage);
              break;
            case 'comment_update':
              await handleCommentUpdate(ws, parsedMessage);
              break;
            case 'comment_resolve':
              await handleCommentResolve(ws, parsedMessage);
              break;
            case 'version_create':
              await handleVersionCreate(ws, parsedMessage);
              break;
            case 'ping':
              // Simple ping message, no action needed
              ws.isAlive = true;
              break;
            default:
              sendError(ws, 'Unknown message type');
          }
        } catch (error: any) {
          log.error({ err: error }, 'Error handling WebSocket message');
          sendError(ws, 'Failed to process message');
        }
      });

      // Handle close event
      ws.on('close', async () => {
        if (ws.sessionId && ws.userId) {
          // Remove user from active session participants
          await collaborativeStorage.removeParticipant(ws.sessionId, ws.userId);
          
          // Remove client from session clients map
          const sessionClientMap = sessionClients.get(ws.sessionId);
          if (sessionClientMap) {
            sessionClientMap.delete(ws.userId);
            
            // If this was the last client, remove the session entry
            if (sessionClientMap.size === 0) {
              sessionClients.delete(ws.sessionId);
            }
          }
          
          // Notify other participants that user has left
          broadcastToSession(ws.sessionId, {
            type: 'leave',
            sessionId: ws.sessionId,
            userId: ws.userId,
            data: {
              username: ws.username,
              displayName: ws.displayName
            }
          }, ws.userId);
        }
      });

    } catch (error: any) {
      log.error({ err: error }, 'WebSocket authentication error');
      sendError(ws, 'Authentication failed');
      ws.close();
    }
  });

  // Set up interval to check for inactive connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as CollaborativeClient;
      if (!client.isAlive) {
        return client.terminate();
      }
      
      client.isAlive = false;
      client.ping();
    });
  }, 30000); // Check every 30 seconds

  // Clean up the interval when the WebSocket server closes
  wss.on('close', () => {
    clearInterval(interval);
  });

  log.info('Collaborative WebSocket server initialized');
}

// Helper function to send error messages
function sendError(ws: CollaborativeClient, message: string) {
  ws.send(JSON.stringify({
    type: 'error',
    data: { message }
  }));
}

// Helper function to broadcast message to all clients in a session except sender
function broadcastToSession(sessionId: number, message: WebSocketMessage, excludeUserId?: number) {
  const sessionClientMap = sessionClients.get(sessionId);
  
  if (!sessionClientMap) {
    return;
  }
  
  const messageStr = JSON.stringify(message);
  
  sessionClientMap.forEach((client, userId) => {
    if (excludeUserId !== userId && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Handler functions for different message types

async function handleJoin(ws: CollaborativeClient, message: WebSocketMessage) {
  const { sessionId } = message;
  const userId = ws.userId;
  
  if (!userId) {
    sendError(ws, 'User not authenticated');
    return;
  }
  
  try {
    // Check if session exists
    const session = await collaborativeStorage.getSessionById(sessionId);
    if (!session) {
      sendError(ws, 'Session not found');
      return;
    }
    
    // Record user joining the session
    await collaborativeStorage.addParticipant({
      sessionId,
      userId
    });
    
    // Store session ID on the connection
    ws.sessionId = sessionId;
    
    // Add client to the session clients map
    if (!sessionClients.has(sessionId)) {
      sessionClients.set(sessionId, new Map());
    }
    
    const sessionClientMap = sessionClients.get(sessionId);
    sessionClientMap!.set(userId, ws);
    
    // Get active participants
    const participants = await collaborativeStorage.getActiveParticipants(sessionId);
    
    // Send session state to the client
    ws.send(JSON.stringify({
      type: 'join',
      sessionId,
      userId,
      data: {
        success: true,
        session,
        participants
      }
    }));
    
    // Broadcast to other clients that a new user joined
    broadcastToSession(sessionId, {
      type: 'join',
      sessionId,
      userId,
      data: {
        username: ws.username,
        displayName: ws.displayName
      }
    }, userId);
    
  } catch (error: any) {
    log.error({ err: error }, 'Error handling join');
    sendError(ws, 'Failed to join session');
  }
}

async function handleLeave(ws: CollaborativeClient, message: WebSocketMessage) {
  const { sessionId } = message;
  const userId = ws.userId;
  
  if (!userId) {
    sendError(ws, 'User not authenticated');
    return;
  }
  
  try {
    // Record user leaving the session
    await collaborativeStorage.removeParticipant(sessionId, userId);
    
    // Remove client from session clients map
    const sessionClientMap = sessionClients.get(sessionId);
    if (sessionClientMap) {
      sessionClientMap.delete(userId);
      
      // If this was the last client, remove the session entry
      if (sessionClientMap.size === 0) {
        sessionClients.delete(sessionId);
      }
    }
    
    // Clear session ID on the connection
    ws.sessionId = undefined;
    
    // Broadcast to other clients that a user left
    broadcastToSession(sessionId, {
      type: 'leave',
      sessionId,
      userId,
      data: {
        username: ws.username,
        displayName: ws.displayName
      }
    });
    
    // Acknowledge leave to the client
    ws.send(JSON.stringify({
      type: 'leave',
      sessionId,
      userId,
      data: {
        success: true
      }
    }));
    
  } catch (error: any) {
    log.error({ err: error }, 'Error handling leave');
    sendError(ws, 'Failed to leave session');
  }
}

async function handleCursorPosition(ws: CollaborativeClient, message: WebSocketMessage) {
  const { sessionId, data } = message;
  const userId = ws.userId;
  
  if (!userId || !data || !data.position) {
    sendError(ws, 'Invalid cursor position data');
    return;
  }
  
  try {
    // Update participant's cursor position
    await collaborativeStorage.updateParticipantStatus(sessionId, userId, data.position);
    
    // Broadcast cursor position to other clients
    broadcastToSession(sessionId, {
      type: 'cursor_position',
      sessionId,
      userId,
      data: {
        position: data.position,
        username: ws.username,
        displayName: ws.displayName
      }
    }, userId);
    
  } catch (error: any) {
    log.error({ err: error }, 'Error handling cursor position');
    sendError(ws, 'Failed to update cursor position');
  }
}

async function handleTextChange(ws: CollaborativeClient, message: WebSocketMessage) {
  const { sessionId, data } = message;
  const userId = ws.userId;
  
  if (!userId || !data || !data.changeType || !data.startPosition) {
    sendError(ws, 'Invalid text change data');
    return;
  }
  
  try {
    // Record change in the database
    const change = await collaborativeStorage.recordChange({
      sessionId,
      userId,
      changeType: data.changeType,
      startPosition: data.startPosition,
      endPosition: data.endPosition,
      content: data.content,
      metadata: data.metadata
    });
    
    // Broadcast change to other clients
    broadcastToSession(sessionId, {
      type: 'text_change',
      sessionId,
      userId,
      data: {
        change,
        username: ws.username,
        displayName: ws.displayName
      }
    }, userId);
    
  } catch (error: any) {
    log.error({ err: error }, 'Error handling text change');
    sendError(ws, 'Failed to process text change');
  }
}

async function handleSelectionChange(ws: CollaborativeClient, message: WebSocketMessage) {
  const { sessionId, data } = message;
  const userId = ws.userId;
  
  if (!userId || !data || !data.startPosition || !data.endPosition) {
    sendError(ws, 'Invalid selection data');
    return;
  }
  
  // Broadcast selection to other clients (no need to store this in the database)
  broadcastToSession(sessionId, {
    type: 'selection_change',
    sessionId,
    userId,
    data: {
      startPosition: data.startPosition,
      endPosition: data.endPosition,
      username: ws.username,
      displayName: ws.displayName
    }
  }, userId);
}

async function handleUserActivity(ws: CollaborativeClient, message: WebSocketMessage) {
  const { sessionId } = message;
  const userId = ws.userId;
  
  if (!userId) {
    sendError(ws, 'User not authenticated');
    return;
  }
  
  try {
    // Update participant's last active time
    await collaborativeStorage.updateParticipantStatus(sessionId, userId);
    
    // No need to broadcast this message as it's just a heartbeat
  } catch (error: any) {
    log.error({ err: error }, 'Error handling user activity');
    // Don't send error for activity updates to avoid noise
  }
}

async function handleCommentAdd(ws: CollaborativeClient, message: WebSocketMessage) {
  const { sessionId, data } = message;
  const userId = ws.userId;
  
  if (!userId || !data || !data.content) {
    sendError(ws, 'Invalid comment data');
    return;
  }
  
  try {
    // Add comment to the database
    const comment = await collaborativeStorage.addComment({
      sessionId,
      userId,
      content: data.content,
      startPosition: data.startPosition,
      endPosition: data.endPosition
    });
    
    // Broadcast comment to all clients including sender
    broadcastToSession(sessionId, {
      type: 'comment_add',
      sessionId,
      userId,
      data: {
        comment,
        username: ws.username,
        displayName: ws.displayName
      }
    });
    
    // Send acknowledgment to the sender
    ws.send(JSON.stringify({
      type: 'comment_add',
      sessionId,
      userId,
      data: {
        success: true,
        comment
      }
    }));
    
  } catch (error: any) {
    log.error({ err: error }, 'Error handling comment add');
    sendError(ws, 'Failed to add comment');
  }
}

async function handleCommentUpdate(ws: CollaborativeClient, message: WebSocketMessage) {
  const { sessionId, data } = message;
  const userId = ws.userId;
  
  if (!userId || !data || !data.commentId || !data.content) {
    sendError(ws, 'Invalid comment update data');
    return;
  }
  
  try {
    // Update comment in the database
    const comment = await collaborativeStorage.updateComment(data.commentId, data.content);
    
    if (!comment) {
      sendError(ws, 'Comment not found');
      return;
    }
    
    // Broadcast comment update to all clients
    broadcastToSession(sessionId, {
      type: 'comment_update',
      sessionId,
      userId,
      data: {
        comment,
        username: ws.username,
        displayName: ws.displayName
      }
    });
    
  } catch (error: any) {
    log.error({ err: error }, 'Error handling comment update');
    sendError(ws, 'Failed to update comment');
  }
}

async function handleCommentResolve(ws: CollaborativeClient, message: WebSocketMessage) {
  const { sessionId, data } = message;
  const userId = ws.userId;
  
  if (!userId || !data || !data.commentId) {
    sendError(ws, 'Invalid comment resolve data');
    return;
  }
  
  try {
    // Resolve comment in the database
    const comment = await collaborativeStorage.resolveComment(data.commentId, userId);
    
    if (!comment) {
      sendError(ws, 'Comment not found');
      return;
    }
    
    // Broadcast comment resolution to all clients
    broadcastToSession(sessionId, {
      type: 'comment_resolve',
      sessionId,
      userId,
      data: {
        comment,
        username: ws.username,
        displayName: ws.displayName
      }
    });
    
  } catch (error: any) {
    log.error({ err: error }, 'Error handling comment resolve');
    sendError(ws, 'Failed to resolve comment');
  }
}

async function handleVersionCreate(ws: CollaborativeClient, message: WebSocketMessage) {
  const { sessionId, data } = message;
  const userId = ws.userId;
  
  if (!userId || !data) {
    sendError(ws, 'Invalid version data');
    return;
  }
  
  try {
    // Get the session to get the content
    const session = await collaborativeStorage.getSessionById(sessionId);
    if (!session) {
      sendError(ws, 'Session not found');
      return;
    }
    
    // Get the latest version to determine the next version number
    const latestVersion = await collaborativeStorage.getLatestVersion(sessionId);
    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
    
    // Create new version
    const version = await collaborativeStorage.createVersion({
      sessionId,
      versionNumber: nextVersionNumber,
      content: session.documentContent,
      createdById: userId,
      changeDescription: data.changeDescription || `Version ${nextVersionNumber}`
    });
    
    // Broadcast new version to all clients
    broadcastToSession(sessionId, {
      type: 'version_create',
      sessionId,
      userId,
      data: {
        version,
        username: ws.username,
        displayName: ws.displayName
      }
    });
    
    // Send acknowledgment to the sender
    ws.send(JSON.stringify({
      type: 'version_create',
      sessionId,
      userId,
      data: {
        success: true,
        version
      }
    }));
    
  } catch (error: any) {
    log.error({ err: error }, 'Error handling version create');
    sendError(ws, 'Failed to create version');
  }
}