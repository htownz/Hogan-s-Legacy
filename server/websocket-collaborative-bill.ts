import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'http';
import { collaborativeStorage } from './storage-collaborative';
import { db } from './db';

// Define message types
interface WebSocketMessage {
  type: string;
  sessionId: number;
  userId: number;
  username?: string;
  displayName?: string;
  [key: string]: any;
}

// Define client interface
interface CollaborativeBillClient {
  id: string;
  ws: WebSocket;
  sessionId: number | null;
  userId: number | null;
  username: string | null;
  displayName: string | null;
  color: string | null;
}

/**
 * Initialize WebSocket server for collaborative bill editing
 */
// Utility function to broadcast a message to all clients in a session
function broadcastToSession(
  sessionParticipants: Map<number, Set<string>>,
  connectedClients: Map<string, CollaborativeBillClient>,
  sessionId: number, 
  message: any, 
  excludeClientId?: string
) {
  const participants = sessionParticipants.get(sessionId);
  if (!participants) return;
  
  const messageStr = JSON.stringify(message);
  
  participants.forEach(clientId => {
    if (clientId !== excludeClientId) {
      const client = connectedClients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    }
  });
}

// Utility function to send an error message to a client
function sendError(client: CollaborativeBillClient, message: string) {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({
      type: 'error',
      message
    }));
  }
}

// Utility function to generate a random color for users
function generateRandomColor(): string {
  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Handle join session message
async function handleJoin(
  client: CollaborativeBillClient, 
  message: WebSocketMessage, 
  sessionParticipants: Map<number, Set<string>>, 
  connectedClients: Map<string, CollaborativeBillClient>
) {
  const { sessionId, userId, username, displayName, color } = message;
  
  if (!sessionId || !userId) {
    return sendError(client, 'Session ID and user ID are required');
  }
  
  try {
    // Validate session exists
    const session = await collaborativeStorage.getSessionById(sessionId);
    if (!session) {
      return sendError(client, 'Session not found');
    }
    
    // Update client info
    client.sessionId = sessionId;
    client.userId = userId;
    client.username = username || null;
    client.displayName = displayName || null;
    client.color = color || generateRandomColor();
    
    // Add client to session participants
    if (!sessionParticipants.has(sessionId)) {
      sessionParticipants.set(sessionId, new Set<string>());
    }
    sessionParticipants.get(sessionId)!.add(client.id);
    
    // Add participant to database if not already present
    try {
      await collaborativeStorage.addParticipant({
        sessionId,
        userId,
        currentCursorPosition: null // Will be updated with cursor moves
      });
    } catch (error: any) {
      console.error(`Error adding participant to database: ${error}`);
      // Continue even if database update fails
    }
    
    // Get current participants in session
    const activeParticipants = await collaborativeStorage.getActiveParticipants(sessionId);
    
    // Send join confirmation to client
    client.ws.send(JSON.stringify({
      type: 'join_confirmed',
      sessionId,
      userId,
      participants: activeParticipants
    }));
    
    // Notify other participants about the new joiner
    const user = {
      id: userId,
      username: username || `User-${userId}`,
      displayName: displayName,
      color: client.color,
      isActive: true
    };
    
    broadcastToSession(
      sessionParticipants,
      connectedClients,
      sessionId, 
      {
        type: 'participant_joined',
        sessionId,
        user
      }, 
      client.id
    );
    
    console.log(`Client ${client.id} joined session ${sessionId} as user ${userId}`);
  } catch (error: any) {
    console.error(`Error handling join: ${error}`);
    sendError(client, 'Failed to join session');
  }
}

// Handle leave session message
async function handleLeave(
  client: CollaborativeBillClient, 
  message: WebSocketMessage, 
  sessionParticipants: Map<number, Set<string>>, 
  connectedClients: Map<string, CollaborativeBillClient>
) {
  if (!client.sessionId || !client.userId) {
    return sendError(client, 'Not currently in a session');
  }
  
  const sessionId = client.sessionId;
  const userId = client.userId;
  
  try {
    // Update database to mark participant as left
    await collaborativeStorage.removeParticipant(sessionId, userId);
    
    // Send leave notification to other participants
    broadcastToSession(
      sessionParticipants,
      connectedClients,
      sessionId, 
      {
        type: 'participant_left',
        sessionId,
        userId,
        username: client.username
      }, 
      client.id
    );
    
    // Update session participants map
    const participants = sessionParticipants.get(sessionId);
    if (participants) {
      participants.delete(client.id);
      if (participants.size === 0) {
        sessionParticipants.delete(sessionId);
      } else {
        sessionParticipants.set(sessionId, participants);
      }
    }
    
    // Update client state
    client.sessionId = null;
    client.userId = null;
    client.username = null;
    client.displayName = null;
    
    // Send confirmation to client
    client.ws.send(JSON.stringify({
      type: 'leave_confirmed',
      message: 'Successfully left session'
    }));
    
    console.log(`Client ${client.id} left session ${sessionId}`);
  } catch (error: any) {
    console.error(`Error handling leave: ${error}`);
    sendError(client, 'Failed to leave session');
  }
}

// Handle content change message
async function handleContentChange(
  client: CollaborativeBillClient, 
  message: WebSocketMessage, 
  sessionParticipants: Map<number, Set<string>>, 
  connectedClients: Map<string, CollaborativeBillClient>
) {
  if (!client.sessionId || !client.userId) {
    return sendError(client, 'Not currently in a session');
  }
  
  const { content, change } = message;
  if (!content) {
    return sendError(client, 'Content is required');
  }
  
  try {
    // Update session content in database
    await collaborativeStorage.updateSession(client.sessionId, {
      documentContent: content
    });
    
    // Record change in database if provided
    if (change) {
      await collaborativeStorage.recordChange({
        sessionId: client.sessionId,
        userId: client.userId,
        changeType: change.type,
        startPosition: change.startPosition,
        endPosition: change.endPosition,
        content: change.content,
        metadata: change.metadata
      });
    }
    
    // Broadcast content change to other participants
    broadcastToSession(
      sessionParticipants,
      connectedClients,
      client.sessionId, 
      {
        type: 'content_change',
        sessionId: client.sessionId,
        userId: client.userId,
        username: client.username,
        displayName: client.displayName,
        content,
        change
      }, 
      client.id
    );
    
    console.log(`Content updated in session ${client.sessionId} by user ${client.userId}`);
  } catch (error: any) {
    console.error(`Error handling content change: ${error}`);
    sendError(client, 'Failed to update content');
  }
}

// Handle cursor move message
async function handleCursorMove(
  client: CollaborativeBillClient, 
  message: WebSocketMessage, 
  sessionParticipants: Map<number, Set<string>>, 
  connectedClients: Map<string, CollaborativeBillClient>
) {
  if (!client.sessionId || !client.userId) {
    return sendError(client, 'Not currently in a session');
  }
  
  const { position, sectionId } = message;
  if (!position) {
    return sendError(client, 'Cursor position is required');
  }
  
  try {
    // Update participant status in database
    if (typeof position.line === 'number') {
      // Convert position to character index if needed for storage
      await collaborativeStorage.updateParticipantStatus(
        client.sessionId, 
        client.userId, 
        position.line * 100 + (position.ch || 0) // Simple encoding of line/column
      );
    }
    
    // Broadcast cursor position to other participants
    broadcastToSession(
      sessionParticipants,
      connectedClients,
      client.sessionId, 
      {
        type: 'cursor_move',
        sessionId: client.sessionId,
        userId: client.userId,
        username: client.username,
        displayName: client.displayName,
        position,
        sectionId
      }, 
      client.id
    );
  } catch (error: any) {
    console.error(`Error handling cursor move: ${error}`);
    // Don't send error to client to avoid spamming for frequent cursor updates
  }
}

// Handle selection change message
async function handleSelectionChange(
  client: CollaborativeBillClient, 
  message: WebSocketMessage, 
  sessionParticipants: Map<number, Set<string>>, 
  connectedClients: Map<string, CollaborativeBillClient>
) {
  if (!client.sessionId || !client.userId) {
    return sendError(client, 'Not currently in a session');
  }
  
  const { selection } = message;
  if (!selection) {
    return sendError(client, 'Selection is required');
  }
  
  try {
    // Broadcast selection to other participants
    broadcastToSession(
      sessionParticipants,
      connectedClients,
      client.sessionId, 
      {
        type: 'selection_change',
        sessionId: client.sessionId,
        userId: client.userId,
        username: client.username,
        displayName: client.displayName,
        selection
      }, 
      client.id
    );
  } catch (error: any) {
    console.error(`Error handling selection change: ${error}`);
    // Don't send error to client for selection updates
  }
}

// Handle comment added message
async function handleCommentAdded(
  client: CollaborativeBillClient, 
  message: WebSocketMessage, 
  sessionParticipants: Map<number, Set<string>>, 
  connectedClients: Map<string, CollaborativeBillClient>
) {
  if (!client.sessionId || !client.userId) {
    return sendError(client, 'Not currently in a session');
  }
  
  const { comment } = message;
  if (!comment) {
    return sendError(client, 'Comment data is required');
  }
  
  try {
    // Broadcast comment to other participants
    broadcastToSession(
      sessionParticipants,
      connectedClients,
      client.sessionId, 
      {
        type: 'comment_added',
        sessionId: client.sessionId,
        userId: client.userId,
        username: client.username,
        displayName: client.displayName,
        comment
      }, 
      client.id
    );
  } catch (error: any) {
    console.error(`Error handling comment added: ${error}`);
    sendError(client, 'Failed to broadcast comment');
  }
}

// Handle comment deleted message
async function handleCommentDeleted(
  client: CollaborativeBillClient, 
  message: WebSocketMessage, 
  sessionParticipants: Map<number, Set<string>>, 
  connectedClients: Map<string, CollaborativeBillClient>
) {
  if (!client.sessionId || !client.userId) {
    return sendError(client, 'Not currently in a session');
  }
  
  const { commentId } = message;
  if (!commentId) {
    return sendError(client, 'Comment ID is required');
  }
  
  try {
    // Broadcast comment deletion to other participants
    broadcastToSession(
      sessionParticipants,
      connectedClients,
      client.sessionId, 
      {
        type: 'comment_deleted',
        sessionId: client.sessionId,
        userId: client.userId,
        username: client.username,
        displayName: client.displayName,
        commentId
      }, 
      client.id
    );
  } catch (error: any) {
    console.error(`Error handling comment deleted: ${error}`);
    sendError(client, 'Failed to broadcast comment deletion');
  }
}

// Handle user section change message
async function handleUserSectionChange(
  client: CollaborativeBillClient, 
  message: WebSocketMessage, 
  sessionParticipants: Map<number, Set<string>>, 
  connectedClients: Map<string, CollaborativeBillClient>
) {
  if (!client.sessionId || !client.userId) {
    return sendError(client, 'Not currently in a session');
  }
  
  const { sectionId } = message;
  if (!sectionId) {
    return sendError(client, 'Section ID is required');
  }
  
  try {
    // Broadcast section change to other participants
    broadcastToSession(
      sessionParticipants,
      connectedClients,
      client.sessionId, 
      {
        type: 'user_section_change',
        sessionId: client.sessionId,
        userId: client.userId,
        username: client.username,
        displayName: client.displayName,
        sectionId
      }, 
      client.id
    );
  } catch (error: any) {
    console.error(`Error handling user section change: ${error}`);
    // Don't send error to client for section updates
  }
}

export function initializeCollaborativeBillWebSockets(httpServer: Server) {
  try {
    // Create a new WebSocket server for collaborative bill editing
    // Use a different path from other WebSocket servers to avoid conflicts
    const wss = new WebSocketServer({ server: httpServer, path: '/ws/bill-editing' });
    console.log("WebSocket server created for collaborative bill editing");
    
    // Keep track of connected clients
    const connectedClients = new Map<string, CollaborativeBillClient>();
    
    // Keep track of which users are in which sessions
    const sessionParticipants = new Map<number, Set<string>>();
    
    // Handle connections
    wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection established for collaborative bill editing');
      
      // Generate unique ID for this client
      const clientId = uuidv4();
      
      // Initialize client info
      const client: CollaborativeBillClient = {
        id: clientId,
        ws,
        sessionId: null,
        userId: null,
        username: null,
        displayName: null,
        color: null
      };
      
      // Store client in connected clients map
      connectedClients.set(clientId, client);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to Act Up collaborative bill editing service'
      }));
      
      // Handle messages from client
      ws.on('message', async (message: string | Buffer | ArrayBuffer | Buffer[]) => {
        try {
          const data = JSON.parse(message.toString()) as WebSocketMessage;
          console.log(`Received message: ${data.type} from client ${clientId}`);
          
          // Process different message types
          switch (data.type) {
            case 'join':
              await handleJoin(client, data, sessionParticipants, connectedClients);
              break;
              
            case 'leave':
              await handleLeave(client, data, sessionParticipants, connectedClients);
              break;
              
            case 'content_change':
              await handleContentChange(client, data, sessionParticipants, connectedClients);
              break;
              
            case 'cursor_move':
              await handleCursorMove(client, data, sessionParticipants, connectedClients);
              break;
              
            case 'selection_change':
              await handleSelectionChange(client, data, sessionParticipants, connectedClients);
              break;
              
            case 'comment_added':
              await handleCommentAdded(client, data, sessionParticipants, connectedClients);
              break;
              
            case 'comment_deleted':
              await handleCommentDeleted(client, data, sessionParticipants, connectedClients);
              break;
              
            case 'user_section_change':
              await handleUserSectionChange(client, data, sessionParticipants, connectedClients);
              break;
              
            default:
              sendError(client, `Unknown message type: ${data.type}`);
          }
        } catch (error: any) {
          console.error('Error processing message:', error);
          sendError(client, 'Failed to process message');
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        
        // If client was in a session, remove them
        if (client.sessionId !== null) {
          // Send leave message to others in the session
          const leaveMessage = {
            type: 'participant_left',
            sessionId: client.sessionId,
            userId: client.userId,
            username: client.username
          };
          
          broadcastToSession(sessionParticipants, connectedClients, client.sessionId, leaveMessage, clientId);
          
          // Update session participants map
          const participants = sessionParticipants.get(client.sessionId);
          if (participants) {
            participants.delete(clientId);
            if (participants.size === 0) {
              sessionParticipants.delete(client.sessionId);
            } else {
              sessionParticipants.set(client.sessionId, participants);
            }
          }
          
          // Update database to mark participant as left
          if (client.userId) {
            try {
              collaborativeStorage.removeParticipant(client.sessionId, client.userId)
                .catch(error => console.error(`Error removing participant ${client.userId} from session ${client.sessionId}:`, error));
            } catch (error: any) {
              console.error(`Error removing participant ${client.userId} from session ${client.sessionId}:`, error);
            }
          }
        }
        
        // Remove client from connected clients map
        connectedClients.delete(clientId);
      });
      
      // Handle connection errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });
    });
    
    return wss;
  } catch (error: any) {
    console.error("Failed to initialize collaborative bill WebSocket server:", error);
    return null;
  }
}