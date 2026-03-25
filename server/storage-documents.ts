import { 
  Document, 
  InsertDocument, 
  DocumentShare, 
  InsertDocumentShare, 
  DocumentComment, 
  InsertDocumentComment,
  DocumentCollection,
  InsertDocumentCollection,
  CollectionItem,
  InsertCollectionItem
} from "../shared/schema-documents";
import { db } from "./db";
import { 
  documents, 
  documentShares, 
  documentComments, 
  documentCollections,
  collectionItems
} from "../shared/schema-documents";
import { and, eq, sql, desc, asc, like, isNull, inArray, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { s3Service } from "./aws/s3Service";

/**
 * Document Storage Interface
 */
export interface IDocumentStorage {
  // Document methods
  createDocument(data: InsertDocument): Promise<Document>;
  getDocumentById(id: number): Promise<Document | null>;
  getDocumentsByOwnerId(ownerId: number): Promise<Document[]>;
  getPublicDocuments(): Promise<Document[]>;
  searchDocuments(userId: number, query: string): Promise<Document[]>;
  updateDocument(id: number, data: Partial<InsertDocument>): Promise<Document | null>;
  deleteDocument(id: number): Promise<boolean>;
  incrementDownloadCount(id: number): Promise<boolean>;
  getDocumentsSharedWithUser(userId: number): Promise<Document[]>;
  
  // Document sharing methods
  shareDocumentWithUser(data: InsertDocumentShare): Promise<DocumentShare>;
  createPublicShareLink(documentId: number, sharedById: number, permission: string, expiresAt?: Date): Promise<string>;
  getDocumentByShareLink(accessLink: string): Promise<{ document: Document, permission: string } | null>;
  getDocumentShares(documentId: number): Promise<DocumentShare[]>;
  deleteDocumentShare(id: number): Promise<boolean>;
  
  // Document comment methods
  addDocumentComment(data: InsertDocumentComment): Promise<DocumentComment>;
  getDocumentComments(documentId: number): Promise<DocumentComment[]>;
  getCommentReplies(commentId: number): Promise<DocumentComment[]>;
  updateDocumentComment(id: number, content: string): Promise<DocumentComment | null>;
  deleteDocumentComment(id: number): Promise<boolean>;
  
  // Collection methods
  createCollection(data: InsertDocumentCollection): Promise<DocumentCollection>;
  getCollectionById(id: number): Promise<DocumentCollection | null>;
  getCollectionsByOwnerId(ownerId: number): Promise<DocumentCollection[]>;
  getPublicCollections(): Promise<DocumentCollection[]>;
  updateCollection(id: number, data: Partial<InsertDocumentCollection>): Promise<DocumentCollection | null>;
  deleteCollection(id: number): Promise<boolean>;
  addDocumentToCollection(data: InsertCollectionItem): Promise<CollectionItem>;
  getDocumentsInCollection(collectionId: number): Promise<Document[]>;
  removeDocumentFromCollection(collectionId: number, documentId: number): Promise<boolean>;
  updateCollectionItemOrder(id: number, displayOrder: number): Promise<boolean>;
}

/**
 * Document storage service
 */
class DocumentStorage implements IDocumentStorage {
  /**
   * Create a new document record
   */
  async createDocument(data: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(data).returning();
    return result[0];
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: number): Promise<Document | null> {
    const result = await db.select().from(documents).$dynamic().where(eq(documents.id, id));
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get documents by owner ID
   */
  async getDocumentsByOwnerId(ownerId: number): Promise<Document[]> {
    return await db.select().from(documents).$dynamic().where(eq(documents.ownerId, ownerId)).orderBy(desc(documents.createdAt));
  }

  /**
   * Get public documents
   */
  async getPublicDocuments(): Promise<Document[]> {
    return await db.select().from(documents).$dynamic().where(eq(documents.isPublic, true)).orderBy(desc(documents.createdAt));
  }

  /**
   * Search documents by title or description
   */
  async searchDocuments(userId: number, query: string): Promise<Document[]> {
    // Search user's own documents and public documents
    return await db.select().from(documents).$dynamic()
      .where(
        and(
          or(
            eq(documents.ownerId, userId),
            eq(documents.isPublic, true)
          ),
          or(
            like(documents.title, `%${query}%`),
            like(documents.description, `%${query}%`)
          )
        )
      )
      .orderBy(desc(documents.createdAt));
  }

  /**
   * Update document
   */
  async updateDocument(id: number, data: Partial<InsertDocument>): Promise<Document | null> {
    const result = await db.update(documents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Delete document
   */
  async deleteDocument(id: number): Promise<boolean> {
    // Get the document to get the file key
    const document = await this.getDocumentById(id);
    if (!document) return false;

    // Delete from S3
    try {
      await s3Service.deleteFile(document.fileKey);
    } catch (error: any) {
      console.error('Error deleting file from S3:', error);
      // Continue anyway to delete the database record
    }

    // Delete from database
    const result = await db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(id: number): Promise<boolean> {
    const result = await db.update(documents)
      .set({ 
        downloadCount: sql`${documents.downloadCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(documents.id, id))
      .returning();
    return result.length > 0;
  }

  /**
   * Get documents shared with a user
   */
  async getDocumentsSharedWithUser(userId: number): Promise<Document[]> {
    const result = await db.select({ document: documents })
      .from(documentShares)
      .innerJoin(documents, eq(documentShares.documentId, documents.id))
      .where(
        and(
          eq(documentShares.sharedWithId, userId),
          eq(documentShares.isActive, true)
        )
      );
    return result.map(r => r.document);
  }

  /**
   * Share a document with a user
   */
  async shareDocumentWithUser(data: InsertDocumentShare): Promise<DocumentShare> {
    const result = await db.insert(documentShares).values(data).returning();
    return result[0];
  }

  /**
   * Create a public share link
   */
  async createPublicShareLink(documentId: number, sharedById: number, permission: string, expiresAt?: Date): Promise<string> {
    const accessLink = uuidv4();
    await db.insert(documentShares).values({
      documentId,
      sharedById,
      accessLink,
      accessPermission: permission,
      expiresAt,
      isActive: true
    });
    return accessLink;
  }

  /**
   * Get document by share link
   */
  async getDocumentByShareLink(accessLink: string): Promise<{ document: Document, permission: string } | null> {
    const now = new Date();
    const result = await db.select({ 
      document: documents, 
      permission: documentShares.accessPermission 
    })
      .from(documentShares)
      .innerJoin(documents, eq(documentShares.documentId, documents.id))
      .where(
        and(
          eq(documentShares.accessLink, accessLink),
          eq(documentShares.isActive, true),
          or(
            isNull(documentShares.expiresAt),
            sql`${documentShares.expiresAt} > ${now}`
          )
        )
      );
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get document shares
   */
  async getDocumentShares(documentId: number): Promise<DocumentShare[]> {
    return await db.select().from(documentShares).$dynamic()
      .where(eq(documentShares.documentId, documentId))
      .orderBy(desc(documentShares.createdAt));
  }

  /**
   * Delete document share
   */
  async deleteDocumentShare(id: number): Promise<boolean> {
    const result = await db.delete(documentShares).where(eq(documentShares.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Add comment to document
   */
  async addDocumentComment(data: InsertDocumentComment): Promise<DocumentComment> {
    const result = await db.insert(documentComments).values(data).returning();
    return result[0];
  }

  /**
   * Get document comments
   */
  async getDocumentComments(documentId: number): Promise<DocumentComment[]> {
    return await db.select().from(documentComments).$dynamic()
      .where(
        and(
          eq(documentComments.documentId, documentId),
          eq(documentComments.isActive, true),
          isNull(documentComments.parentId) // Top-level comments only
        )
      )
      .orderBy(desc(documentComments.createdAt));
  }

  /**
   * Get comment replies
   */
  async getCommentReplies(commentId: number): Promise<DocumentComment[]> {
    return await db.select().from(documentComments).$dynamic()
      .where(
        and(
          eq(documentComments.parentId, commentId),
          eq(documentComments.isActive, true)
        )
      )
      .orderBy(asc(documentComments.createdAt));
  }

  /**
   * Update document comment
   */
  async updateDocumentComment(id: number, content: string): Promise<DocumentComment | null> {
    const result = await db.update(documentComments)
      .set({ 
        content, 
        updatedAt: new Date() 
      })
      .where(eq(documentComments.id, id))
      .returning();
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Delete document comment
   */
  async deleteDocumentComment(id: number): Promise<boolean> {
    // Only soft delete by marking as inactive
    const result = await db.update(documentComments)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(documentComments.id, id))
      .returning();
    return result.length > 0;
  }

  /**
   * Create document collection
   */
  async createCollection(data: InsertDocumentCollection): Promise<DocumentCollection> {
    const result = await db.insert(documentCollections).values(data).returning();
    return result[0];
  }

  /**
   * Get collection by ID
   */
  async getCollectionById(id: number): Promise<DocumentCollection | null> {
    const result = await db.select().from(documentCollections).$dynamic().where(eq(documentCollections.id, id));
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get collections by owner ID
   */
  async getCollectionsByOwnerId(ownerId: number): Promise<DocumentCollection[]> {
    return await db.select().from(documentCollections).$dynamic()
      .where(eq(documentCollections.ownerId, ownerId))
      .orderBy(desc(documentCollections.createdAt));
  }

  /**
   * Get public collections
   */
  async getPublicCollections(): Promise<DocumentCollection[]> {
    return await db.select().from(documentCollections).$dynamic()
      .where(eq(documentCollections.isPublic, true))
      .orderBy(desc(documentCollections.createdAt));
  }

  /**
   * Update collection
   */
  async updateCollection(id: number, data: Partial<InsertDocumentCollection>): Promise<DocumentCollection | null> {
    const result = await db.update(documentCollections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documentCollections.id, id))
      .returning();
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Delete collection
   */
  async deleteCollection(id: number): Promise<boolean> {
    const result = await db.delete(documentCollections).where(eq(documentCollections.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Add document to collection
   */
  async addDocumentToCollection(data: InsertCollectionItem): Promise<CollectionItem> {
    const result = await db.insert(collectionItems).values(data).returning();
    return result[0];
  }

  /**
   * Get documents in collection
   */
  async getDocumentsInCollection(collectionId: number): Promise<Document[]> {
    const result = await db.select({ document: documents })
      .from(collectionItems)
      .innerJoin(documents, eq(collectionItems.documentId, documents.id))
      .where(eq(collectionItems.collectionId, collectionId))
      .orderBy(asc(collectionItems.displayOrder));
    return result.map(r => r.document);
  }

  /**
   * Remove document from collection
   */
  async removeDocumentFromCollection(collectionId: number, documentId: number): Promise<boolean> {
    const result = await db.delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.documentId, documentId)
        )
      )
      .returning();
    return result.length > 0;
  }

  /**
   * Update collection item order
   */
  async updateCollectionItemOrder(id: number, displayOrder: number): Promise<boolean> {
    const result = await db.update(collectionItems)
      .set({ displayOrder })
      .where(eq(collectionItems.id, id))
      .returning();
    return result.length > 0;
  }
}

export const documentStorage = new DocumentStorage();