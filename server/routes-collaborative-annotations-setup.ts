import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { collaborativeAnnotationsStorage } from './storage-collaborative-annotations';
import { authenticateWebSocket, startHeartbeat } from './websocket-auth';
import { createLogger } from "./logger";
const log = createLogger("routes-collaborative-annotations-setup");


// Define message types
type MessageType = 
  | 'join_document' 
  | 'leave_document' 
  | 'create_annotation' 
  | 'update_annotation' 
  | 'delete_annotation'
  | 'add_reaction'
  | 'cursor_position'
  | 'user_activity';

interface WsMessage {
  type: MessageType;
  payload: any;
  documentId: number;
  userId?: number;
}

interface AuthenticatedSocket extends WebSocket {
  userId: number;
  username: string;
  displayName: string | null;
}

// Store active connections by document ID
const documentConnections: Record<number, Set<AuthenticatedSocket>> = {};

// Helper function to broadcast to all clients viewing a document
const broadcastToDocument = (documentId: number, message: WsMessage, excludeSocket?: AuthenticatedSocket) => {
  const connections = documentConnections[documentId];
  if (!connections) return;

  const messageStr = JSON.stringify(message);
  connections.forEach(client => {
    if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
};

// Setup WebSocket server
export const setupWebsocketServer = (httpServer: HttpServer) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/annotations' });

  log.info('WebSocket server for annotations initialized');

  wss.on('connection', async (ws, req) => {
    log.info('Client connected to annotation WebSocket');

    const auth = await authenticateWebSocket(ws, req);
    if (!auth) return;
    
    const stopHeartbeat = startHeartbeat(ws);

    const authedSocket = ws as AuthenticatedSocket;
    authedSocket.userId = auth.user.id;
    authedSocket.username = auth.user.username;
    authedSocket.displayName = auth.user.displayName || auth.user.name || null;
    
    // Store document IDs this socket is connected to
    const clientDocuments = new Set<number>();
    
    authedSocket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as WsMessage;
        
        if (!data.type || !data.documentId) {
          log.error({ err: data }, 'Invalid message format');
          return;
        }
        
        const { type, payload, documentId } = data;
        const userId = authedSocket.userId;
        
        switch (type) {
          case 'join_document':
            // Add client to document's connection pool
            if (!documentConnections[documentId]) {
              documentConnections[documentId] = new Set();
            }
            documentConnections[documentId].add(authedSocket);
            clientDocuments.add(documentId);
            
            // Check user permissions
            const role = await collaborativeAnnotationsStorage.getCollaboratorRole(documentId, userId);
            if (!role) {
              // Add user as a viewer if not already a collaborator
              await collaborativeAnnotationsStorage.addCollaborator({
                documentId,
                userId,
                role: 'viewer'
              });
            }
            
            // Notify others that someone joined
            broadcastToDocument(documentId, {
              type: 'user_activity',
              payload: { action: 'joined', userId, username: authedSocket.username, displayName: authedSocket.displayName },
              documentId,
              userId
            }, authedSocket);
            break;
            
          case 'leave_document':
            // Remove client from document's connection pool
            if (documentConnections[documentId]) {
              documentConnections[documentId].delete(authedSocket);
              clientDocuments.delete(documentId);
              
              // Clean up empty document connections
              if (documentConnections[documentId].size === 0) {
                delete documentConnections[documentId];
              }
            }
            
            // Notify others that someone left
            broadcastToDocument(documentId, {
              type: 'user_activity',
              payload: { action: 'left', userId, username: authedSocket.username, displayName: authedSocket.displayName },
              documentId,
              userId
            });
            break;
            
          case 'create_annotation':
            // Store annotation in database
            try {
              const annotation = await collaborativeAnnotationsStorage.createAnnotation({
                ...payload,
                documentId,
                userId
              });
              
              // Broadcast to all clients viewing this document
              broadcastToDocument(documentId, {
                type: 'create_annotation',
                payload: annotation,
                documentId,
                userId
              });
            } catch (error: any) {
              log.error({ err: error }, 'Failed to create annotation');
            }
            break;
            
          case 'update_annotation':
            // Update annotation in database
            try {
              if (!payload.id) {
                log.error('Missing annotation ID in update request');
                return;
              }
              
              // Check if user can modify this annotation
              const annotation = await collaborativeAnnotationsStorage.getAnnotationById(payload.id);
              if (!annotation) {
                log.error({ err: payload.id }, 'Annotation not found');
                return;
              }
              
              // Check if user owns the annotation or is an admin
              if (annotation.userId !== userId) {
                const userRole = await collaborativeAnnotationsStorage.getCollaboratorRole(documentId, userId);
                if (!userRole || userRole !== 'admin') {
                  log.error('User does not have permission to update annotation');
                  return;
                }
              }
              
              const updatedAnnotation = await collaborativeAnnotationsStorage.updateAnnotation(
                payload.id,
                payload
              );
              
              if (updatedAnnotation) {
                // Broadcast to all clients viewing this document
                broadcastToDocument(documentId, {
                  type: 'update_annotation',
                  payload: updatedAnnotation,
                  documentId,
                  userId
                });
              }
            } catch (error: any) {
              log.error({ err: error }, 'Failed to update annotation');
            }
            break;
            
          case 'delete_annotation':
            // Delete annotation from database
            try {
              if (!payload.id) {
                log.error('Missing annotation ID in delete request');
                return;
              }
              
              // Check if user can delete this annotation
              const annotation = await collaborativeAnnotationsStorage.getAnnotationById(payload.id);
              if (!annotation) {
                log.error({ err: payload.id }, 'Annotation not found');
                return;
              }
              
              // Check if user owns the annotation or is an admin
              if (annotation.userId !== userId) {
                const userRole = await collaborativeAnnotationsStorage.getCollaboratorRole(documentId, userId);
                if (!userRole || userRole !== 'admin') {
                  log.error('User does not have permission to delete annotation');
                  return;
                }
              }
              
              const deleted = await collaborativeAnnotationsStorage.deleteAnnotation(payload.id);
              
              if (deleted) {
                // Broadcast to all clients viewing this document
                broadcastToDocument(documentId, {
                  type: 'delete_annotation',
                  payload: { id: payload.id },
                  documentId,
                  userId
                });
              }
            } catch (error: any) {
              log.error({ err: error }, 'Failed to delete annotation');
            }
            break;
            
          case 'add_reaction':
            // Add reaction to annotation
            try {
              if (!payload.annotationId || !payload.reaction) {
                log.error('Missing required fields in reaction request');
                return;
              }
              
              const reaction = await collaborativeAnnotationsStorage.createAnnotationReaction({
                annotationId: payload.annotationId,
                userId,
                reaction: payload.reaction
              });
              
              // Broadcast to all clients viewing this document
              broadcastToDocument(documentId, {
                type: 'add_reaction',
                payload: reaction,
                documentId,
                userId
              });
            } catch (error: any) {
              log.error({ err: error }, 'Failed to add reaction');
            }
            break;
            
          case 'cursor_position':
            // Just broadcast cursor position to other clients
            broadcastToDocument(documentId, {
              type: 'cursor_position',
              payload: {
                ...payload,
                userId
              },
              documentId,
              userId
            }, authedSocket);
            break;
            
          default:
            log.warn({ detail: type }, 'Unknown message type');
        }
      } catch (error: any) {
        log.error({ err: error }, 'WebSocket message error');
      }
    });
    
    authedSocket.on('close', () => {
      stopHeartbeat();
      log.info('Client disconnected from annotation WebSocket');
      
      // Clean up all document connections for this client
      clientDocuments.forEach(documentId => {
        if (documentConnections[documentId]) {
          documentConnections[documentId].delete(authedSocket);
          
          // Clean up empty document connections
          if (documentConnections[documentId].size === 0) {
            delete documentConnections[documentId];
          }
        }
      });
    });
    
    authedSocket.on('error', (error) => {
      log.error({ err: error }, 'WebSocket error');
    });
  });

  return wss;
};

// Export helper functions
export const getActiveDocumentConnections = () => {
  return Object.keys(documentConnections).map(id => ({
    documentId: parseInt(id),
    connectionCount: documentConnections[parseInt(id)].size
  }));
};

export const getActiveConnectionCount = (documentId: number) => {
  return documentConnections[documentId]?.size || 0;
};