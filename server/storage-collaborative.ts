import { db } from "./db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { users } from "@shared/schema";
import { 
  collaborativeEditSessions, 
  sessionParticipants, 
  collaborativeChanges, 
  documentVersions, 
  documentComments,
  type CollaborativeEditSession,
  type InsertCollaborativeEditSession,
  type SessionParticipant,
  type InsertSessionParticipant,
  type CollaborativeChange,
  type InsertCollaborativeChange,
  type DocumentVersion,
  type InsertDocumentVersion,
  type DocumentComment,
  type InsertDocumentComment
} from "@shared/schema-collaborative";

export interface ICollaborativeStorage {
  // Session management
  createSession(session: InsertCollaborativeEditSession): Promise<CollaborativeEditSession>;
  getSessionById(id: number): Promise<CollaborativeEditSession | undefined>;
  updateSession(id: number, updateData: Partial<InsertCollaborativeEditSession>): Promise<CollaborativeEditSession | undefined>;
  listSessions(limit?: number, offset?: number): Promise<CollaborativeEditSession[]>;
  listSessionsByBillId(billId: string): Promise<CollaborativeEditSession[]>;
  
  // Participant management
  addParticipant(participant: InsertSessionParticipant): Promise<SessionParticipant>;
  removeParticipant(sessionId: number, userId: number): Promise<boolean>;
  updateParticipantStatus(sessionId: number, userId: number, cursorPosition?: number): Promise<boolean>;
  listSessionParticipants(sessionId: number): Promise<SessionParticipant[]>;
  getActiveParticipants(sessionId: number): Promise<SessionParticipant[]>;
  
  // Change tracking
  recordChange(change: InsertCollaborativeChange): Promise<CollaborativeChange>;
  getSessionChanges(sessionId: number, limit?: number): Promise<CollaborativeChange[]>;
  
  // Version management
  createVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  getVersionByNumber(sessionId: number, versionNumber: number): Promise<DocumentVersion | undefined>;
  getLatestVersion(sessionId: number): Promise<DocumentVersion | undefined>;
  listVersions(sessionId: number): Promise<DocumentVersion[]>;
  
  // Comment management
  addComment(comment: InsertDocumentComment): Promise<DocumentComment>;
  updateComment(id: number, content: string): Promise<DocumentComment | undefined>;
  resolveComment(id: number, resolvedById: number): Promise<DocumentComment | undefined>;
  getComments(sessionId: number): Promise<DocumentComment[]>;
}

export class CollaborativeStorage implements ICollaborativeStorage {
  // Session management
  async createSession(session: InsertCollaborativeEditSession): Promise<CollaborativeEditSession> {
    const [newSession] = await db.insert(collaborativeEditSessions).values(session).returning();
    
    // Create initial version
    await db.insert(documentVersions).values({
      sessionId: newSession.id,
      versionNumber: 1,
      content: newSession.documentContent,
      createdById: newSession.createdById || undefined,
      changeDescription: "Initial document"
    });
    
    return newSession;
  }

  async getSessionById(id: number): Promise<CollaborativeEditSession | undefined> {
    const [session] = await db.select().from(collaborativeEditSessions).$dynamic().where(eq(collaborativeEditSessions.id, id));
    return session;
  }

  async updateSession(id: number, updateData: Partial<InsertCollaborativeEditSession>): Promise<CollaborativeEditSession | undefined> {
    const [updated] = await db.update(collaborativeEditSessions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(collaborativeEditSessions.id, id))
      .returning();
    return updated;
  }

  async listSessions(limit = 50, offset = 0): Promise<CollaborativeEditSession[]> {
    const sessions = await db.select().from(collaborativeEditSessions)
      .orderBy(desc(collaborativeEditSessions.updatedAt))
      .limit(limit)
      .offset(offset);
    return sessions;
  }

  async listSessionsByBillId(billId: string): Promise<CollaborativeEditSession[]> {
    const sessions = await db.select().from(collaborativeEditSessions).$dynamic()
      .where(eq(collaborativeEditSessions.billId, billId))
      .orderBy(desc(collaborativeEditSessions.updatedAt));
    return sessions;
  }

  // Participant management
  async addParticipant(participant: InsertSessionParticipant): Promise<SessionParticipant> {
    // Check if this user is already a participant
    const [existingParticipant] = await db.select().from(sessionParticipants).$dynamic()
      .where(
        and(
          eq(sessionParticipants.sessionId, participant.sessionId),
          eq(sessionParticipants.userId, participant.userId),
          isNull(sessionParticipants.leftAt)
        )
      );

    // If participant exists, return it
    if (existingParticipant) {
      await db.update(sessionParticipants)
        .set({ lastActiveAt: new Date() })
        .where(eq(sessionParticipants.id, existingParticipant.id));
      return existingParticipant;
    }

    // Otherwise create new participant
    const [newParticipant] = await db.insert(sessionParticipants)
      .values(participant)
      .returning();
    return newParticipant;
  }

  async removeParticipant(sessionId: number, userId: number): Promise<boolean> {
    const [participant] = await db.update(sessionParticipants)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.userId, userId),
          isNull(sessionParticipants.leftAt)
        )
      )
      .returning();
    return !!participant;
  }

  async updateParticipantStatus(sessionId: number, userId: number, cursorPosition?: number): Promise<boolean> {
    const updates: Partial<SessionParticipant> = { 
      lastActiveAt: new Date() 
    };
    
    if (cursorPosition !== undefined) {
      updates.currentCursorPosition = cursorPosition;
    }
    
    const [participant] = await db.update(sessionParticipants)
      .set(updates)
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.userId, userId),
          isNull(sessionParticipants.leftAt)
        )
      )
      .returning();
    return !!participant;
  }

  async listSessionParticipants(sessionId: number): Promise<SessionParticipant[]> {
    const participants = await db.select({
      participant: sessionParticipants,
      user: {
        id: users.id,
        username: users.username,
        name: users.name,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl
      }
    })
    .from(sessionParticipants)
    .leftJoin(users, eq(sessionParticipants.userId, users.id))
    .where(eq(sessionParticipants.sessionId, sessionId))
    .orderBy(desc(sessionParticipants.joinedAt));
    
    return participants.map(p => ({
      ...p.participant,
      user: p.user
    })) as SessionParticipant[];
  }

  async getActiveParticipants(sessionId: number): Promise<SessionParticipant[]> {
    const participants = await db.select({
      participant: sessionParticipants,
      user: {
        id: users.id,
        username: users.username,
        name: users.name,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl
      }
    })
    .from(sessionParticipants)
    .leftJoin(users, eq(sessionParticipants.userId, users.id))
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        isNull(sessionParticipants.leftAt)
      )
    );
    
    return participants.map(p => ({
      ...p.participant,
      user: p.user
    })) as SessionParticipant[];
  }

  // Change tracking
  async recordChange(change: InsertCollaborativeChange): Promise<CollaborativeChange> {
    const [newChange] = await db.insert(collaborativeChanges).values(change).returning();
    
    // Update document content in the session
    const session = await this.getSessionById(change.sessionId);
    if (session) {
      // Apply the change to the document content
      let newContent = session.documentContent;
      
      if (change.changeType === 'insert') {
        newContent = 
          newContent.substring(0, change.startPosition) + 
          change.content + 
          newContent.substring(change.startPosition);
      } else if (change.changeType === 'delete' && change.endPosition) {
        newContent = 
          newContent.substring(0, change.startPosition) + 
          newContent.substring(change.endPosition);
      } else if (change.changeType === 'replace' && change.endPosition && change.content) {
        newContent = 
          newContent.substring(0, change.startPosition) + 
          change.content + 
          newContent.substring(change.endPosition);
      }
      
      // Update the session with new content
      await this.updateSession(change.sessionId, { documentContent: newContent });
    }
    
    return newChange;
  }

  async getSessionChanges(sessionId: number, limit = 100): Promise<CollaborativeChange[]> {
    const changes = await db.select({
      change: collaborativeChanges,
      user: {
        id: users.id,
        username: users.username,
        name: users.name,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl
      }
    })
    .from(collaborativeChanges)
    .leftJoin(users, eq(collaborativeChanges.userId, users.id))
    .where(eq(collaborativeChanges.sessionId, sessionId))
    .orderBy(desc(collaborativeChanges.timestamp))
    .limit(limit);
    
    return changes.map(c => ({
      ...c.change,
      user: c.user
    })) as CollaborativeChange[];
  }

  // Version management
  async createVersion(version: InsertDocumentVersion): Promise<DocumentVersion> {
    const [newVersion] = await db.insert(documentVersions).values(version).returning();
    return newVersion;
  }

  async getVersionByNumber(sessionId: number, versionNumber: number): Promise<DocumentVersion | undefined> {
    const [version] = await db.select().from(documentVersions).$dynamic()
      .where(
        and(
          eq(documentVersions.sessionId, sessionId),
          eq(documentVersions.versionNumber, versionNumber)
        )
      );
    return version;
  }

  async getLatestVersion(sessionId: number): Promise<DocumentVersion | undefined> {
    const [version] = await db.select().from(documentVersions).$dynamic()
      .where(eq(documentVersions.sessionId, sessionId))
      .orderBy(desc(documentVersions.versionNumber))
      .limit(1);
    return version;
  }

  async listVersions(sessionId: number): Promise<DocumentVersion[]> {
    const versions = await db.select({
      version: documentVersions,
      user: {
        id: users.id,
        username: users.username,
        name: users.name,
        displayName: users.displayName
      }
    })
    .from(documentVersions)
    .leftJoin(users, eq(documentVersions.createdById, users.id))
    .where(eq(documentVersions.sessionId, sessionId))
    .orderBy(desc(documentVersions.versionNumber));
    
    return versions.map(v => ({
      ...v.version,
      createdBy: v.user
    })) as DocumentVersion[];
  }

  // Comment management
  async addComment(comment: InsertDocumentComment): Promise<DocumentComment> {
    const [newComment] = await db.insert(documentComments).values(comment).returning();
    return newComment;
  }

  async updateComment(id: number, content: string): Promise<DocumentComment | undefined> {
    const [updated] = await db.update(documentComments)
      .set({ content, updatedAt: new Date() })
      .where(eq(documentComments.id, id))
      .returning();
    return updated;
  }

  async resolveComment(id: number, resolvedById: number): Promise<DocumentComment | undefined> {
    const [resolved] = await db.update(documentComments)
      .set({ 
        resolved: 1, 
        resolvedById, 
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(documentComments.id, id))
      .returning();
    return resolved;
  }

  async getComments(sessionId: number): Promise<DocumentComment[]> {
    const comments = await db.select({
      comment: documentComments,
      user: {
        id: users.id,
        username: users.username,
        name: users.name,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl
      },
      resolvedBy: {
        id: users.id,
        username: users.username,
        name: users.name,
        displayName: users.displayName
      }
    })
    .from(documentComments)
    .leftJoin(
      users, 
      eq(documentComments.userId, users.id)
    )
    .leftJoin(
      users, 
      eq(documentComments.resolvedById, users.id)
    )
    .where(eq(documentComments.sessionId, sessionId))
    .orderBy(documentComments.createdAt);
    
    return comments.map(c => ({
      ...c.comment,
      user: c.user,
      resolvedBy: c.resolvedBy
    })) as DocumentComment[];
  }
}

export const collaborativeStorage = new CollaborativeStorage();