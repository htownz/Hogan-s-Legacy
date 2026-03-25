// @ts-nocheck
import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { collaborativeAnnotationsStorage } from './storage-collaborative-annotations';

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
  userId: number;
}

// Store active connections by document ID
const documentConnections: Record<number, Set<WebSocket>> = {};

// Helper function to broadcast to all clients viewing a document
const broadcastToDocument = (documentId: number, message: WsMessage, excludeSocket?: WebSocket) => {
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

  console.log('WebSocket server for annotations initialized');

  wss.on('connection', (ws) => {
    console.log('Client connected to annotation WebSocket');
    
    // Store document IDs this socket is connected to
    const clientDocuments = new Set<number>();
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as WsMessage;
        
        if (!data.type || !data.documentId || data.userId === undefined) {
          console.error('Invalid message format:', data);
          return;
        }
        
        const { type, payload, documentId, userId } = data;
        
        switch (type) {
          case 'join_document':
            // Add client to document's connection pool
            if (!documentConnections[documentId]) {
              documentConnections[documentId] = new Set();
            }
            documentConnections[documentId].add(ws);
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
              payload: { action: 'joined', userId },
              documentId,
              userId
            }, ws);
            break;
            
          case 'leave_document':
            // Remove client from document's connection pool
            if (documentConnections[documentId]) {
              documentConnections[documentId].delete(ws);
              clientDocuments.delete(documentId);
              
              // Clean up empty document connections
              if (documentConnections[documentId].size === 0) {
                delete documentConnections[documentId];
              }
            }
            
            // Notify others that someone left
            broadcastToDocument(documentId, {
              type: 'user_activity',
              payload: { action: 'left', userId },
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
              console.error('Failed to create annotation:', error);
            }
            break;
            
          case 'update_annotation':
            // Update annotation in database
            try {
              if (!payload.id) {
                console.error('Missing annotation ID in update request');
                return;
              }
              
              // Check if user can modify this annotation
              const annotation = await collaborativeAnnotationsStorage.getAnnotationById(payload.id);
              if (!annotation) {
                console.error('Annotation not found:', payload.id);
                return;
              }
              
              // Check if user owns the annotation or is an admin
              if (annotation.userId !== userId) {
                const userRole = await collaborativeAnnotationsStorage.getCollaboratorRole(documentId, userId);
                if (!userRole || userRole !== 'admin') {
                  console.error('User does not have permission to update annotation');
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
              console.error('Failed to update annotation:', error);
            }
            break;
            
          case 'delete_annotation':
            // Delete annotation from database
            try {
              if (!payload.id) {
                console.error('Missing annotation ID in delete request');
                return;
              }
              
              // Check if user can delete this annotation
              const annotation = await collaborativeAnnotationsStorage.getAnnotationById(payload.id);
              if (!annotation) {
                console.error('Annotation not found:', payload.id);
                return;
              }
              
              // Check if user owns the annotation or is an admin
              if (annotation.userId !== userId) {
                const userRole = await collaborativeAnnotationsStorage.getCollaboratorRole(documentId, userId);
                if (!userRole || userRole !== 'admin') {
                  console.error('User does not have permission to delete annotation');
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
              console.error('Failed to delete annotation:', error);
            }
            break;
            
          case 'add_reaction':
            // Add reaction to annotation
            try {
              if (!payload.annotationId || !payload.reactionType) {
                console.error('Missing required fields in reaction request');
                return;
              }
              
              const reaction = await collaborativeAnnotationsStorage.createAnnotationReaction({
                annotationId: payload.annotationId,
                userId,
                reactionType: payload.reactionType
              });
              
              // Broadcast to all clients viewing this document
              broadcastToDocument(documentId, {
                type: 'add_reaction',
                payload: reaction,
                documentId,
                userId
              });
            } catch (error: any) {
              console.error('Failed to add reaction:', error);
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
            }, ws);
            break;
            
          default:
            console.warn('Unknown message type:', type);
        }
      } catch (error: any) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from annotation WebSocket');
      
      // Clean up all document connections for this client
      clientDocuments.forEach(documentId => {
        if (documentConnections[documentId]) {
          documentConnections[documentId].delete(ws);
          
          // Clean up empty document connections
          if (documentConnections[documentId].size === 0) {
            delete documentConnections[documentId];
          }
        }
      });
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
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