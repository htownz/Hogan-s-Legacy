// @ts-nocheck
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  LegislativeDocument, 
  InsertLegislativeDocument, 
  legislativeDocuments,
  Annotation,
  InsertAnnotation,
  annotations,
  AnnotationReaction,
  InsertAnnotationReaction,
  annotationReactions,
  DocumentCollaborator,
  InsertDocumentCollaborator,
  documentCollaborators
} from '@shared/schema-collaborative-annotations';

export interface ICollaborativeAnnotationsStorage {
  // Legislative Document methods
  getLegislativeDocuments(): Promise<LegislativeDocument[]>;
  getLegislativeDocumentById(id: number): Promise<LegislativeDocument | undefined>;
  getLegislativeDocumentByExternalId(externalId: string): Promise<LegislativeDocument | undefined>;
  createLegislativeDocument(document: InsertLegislativeDocument): Promise<LegislativeDocument>;
  updateLegislativeDocument(id: number, document: Partial<InsertLegislativeDocument>): Promise<LegislativeDocument | undefined>;
  deleteLegislativeDocument(id: number): Promise<boolean>;

  // Annotation methods
  getAnnotationsByDocumentId(documentId: number): Promise<Annotation[]>;
  getAnnotationById(id: number): Promise<Annotation | undefined>;
  getAnnotationReplies(annotationId: number): Promise<Annotation[]>;
  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  updateAnnotation(id: number, annotation: Partial<InsertAnnotation>): Promise<Annotation | undefined>;
  deleteAnnotation(id: number): Promise<boolean>;

  // Annotation Reaction methods
  getReactionsByAnnotationId(annotationId: number): Promise<AnnotationReaction[]>;
  getUserReactionForAnnotation(annotationId: number, userId: number): Promise<AnnotationReaction | undefined>;
  createAnnotationReaction(reaction: InsertAnnotationReaction): Promise<AnnotationReaction>;
  deleteAnnotationReaction(id: number): Promise<boolean>;

  // Collaborator methods
  getCollaboratorsByDocumentId(documentId: number): Promise<DocumentCollaborator[]>;
  getCollaboratorRole(documentId: number, userId: number): Promise<string | undefined>;
  addCollaborator(collaborator: InsertDocumentCollaborator): Promise<DocumentCollaborator>;
  updateCollaboratorRole(documentId: number, userId: number, role: string): Promise<DocumentCollaborator | undefined>;
  removeCollaborator(documentId: number, userId: number): Promise<boolean>;
}

export class DatabaseCollaborativeAnnotationsStorage implements ICollaborativeAnnotationsStorage {
  // Legislative Document methods
  async getLegislativeDocuments(): Promise<LegislativeDocument[]> {
    return db.select().from(legislativeDocuments).orderBy(desc(legislativeDocuments.updatedAt));
  }

  async getLegislativeDocumentById(id: number): Promise<LegislativeDocument | undefined> {
    const [document] = await db
      .select()
      .from(legislativeDocuments).$dynamic()
      .where(eq(legislativeDocuments.id, id));
    return document;
  }

  async getLegislativeDocumentByExternalId(externalId: string): Promise<LegislativeDocument | undefined> {
    const [document] = await db
      .select()
      .from(legislativeDocuments).$dynamic()
      .where(eq(legislativeDocuments.externalId, externalId));
    return document;
  }

  async createLegislativeDocument(document: InsertLegislativeDocument): Promise<LegislativeDocument> {
    const [createdDocument] = await db
      .insert(legislativeDocuments)
      .values(document)
      .returning();
    return createdDocument;
  }

  async updateLegislativeDocument(id: number, document: Partial<InsertLegislativeDocument>): Promise<LegislativeDocument | undefined> {
    const [updatedDocument] = await db
      .update(legislativeDocuments)
      .set({
        ...document,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(legislativeDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteLegislativeDocument(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(legislativeDocuments)
      .where(eq(legislativeDocuments.id, id))
      .returning({ id: legislativeDocuments.id });
    return !!deleted;
  }

  // Annotation methods
  async getAnnotationsByDocumentId(documentId: number): Promise<Annotation[]> {
    return db
      .select()
      .from(annotations).$dynamic()
      .where(and(
        eq(annotations.documentId, documentId),
        isNull(annotations.parentId) // Only return top-level annotations
      ))
      .orderBy(annotations.startOffset);
  }

  async getAnnotationById(id: number): Promise<Annotation | undefined> {
    const [annotation] = await db
      .select()
      .from(annotations).$dynamic()
      .where(eq(annotations.id, id));
    return annotation;
  }

  async getAnnotationReplies(annotationId: number): Promise<Annotation[]> {
    return db
      .select()
      .from(annotations).$dynamic()
      .where(eq(annotations.parentId, annotationId))
      .orderBy(annotations.createdAt);
  }

  async createAnnotation(annotation: InsertAnnotation): Promise<Annotation> {
    const [createdAnnotation] = await db
      .insert(annotations)
      .values(annotation)
      .returning();
    return createdAnnotation;
  }

  async updateAnnotation(id: number, annotation: Partial<InsertAnnotation>): Promise<Annotation | undefined> {
    const [updatedAnnotation] = await db
      .update(annotations)
      .set({
        ...annotation,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(annotations.id, id))
      .returning();
    return updatedAnnotation;
  }

  async deleteAnnotation(id: number): Promise<boolean> {
    // First delete any replies to this annotation
    await db
      .delete(annotations)
      .where(eq(annotations.parentId, id));
      
    // Then delete the annotation itself
    const [deleted] = await db
      .delete(annotations)
      .where(eq(annotations.id, id))
      .returning({ id: annotations.id });
    return !!deleted;
  }

  // Annotation Reaction methods
  async getReactionsByAnnotationId(annotationId: number): Promise<AnnotationReaction[]> {
    return db
      .select()
      .from(annotationReactions).$dynamic()
      .where(eq(annotationReactions.annotationId, annotationId));
  }

  async getUserReactionForAnnotation(annotationId: number, userId: number): Promise<AnnotationReaction | undefined> {
    const [reaction] = await db
      .select()
      .from(annotationReactions).$dynamic()
      .where(and(
        eq(annotationReactions.annotationId, annotationId),
        eq(annotationReactions.userId, userId)
      ));
    return reaction;
  }

  async createAnnotationReaction(reaction: InsertAnnotationReaction): Promise<AnnotationReaction> {
    // First check if user already had a reaction
    const existingReaction = await this.getUserReactionForAnnotation(
      reaction.annotationId,
      reaction.userId
    );

    // If same reaction type, do nothing
    if (existingReaction && existingReaction.reaction === reaction.reaction) {
      return existingReaction;
    }
    
    // If different reaction type, delete existing one
    if (existingReaction) {
      await db
        .delete(annotationReactions)
        .where(eq(annotationReactions.id, existingReaction.id));
    }
    
    // Create the new reaction
    const [createdReaction] = await db
      .insert(annotationReactions)
      .values(reaction)
      .returning();
    return createdReaction;
  }

  async deleteAnnotationReaction(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(annotationReactions)
      .where(eq(annotationReactions.id, id))
      .returning({ id: annotationReactions.id });
    return !!deleted;
  }

  // Collaborator methods
  async getCollaboratorsByDocumentId(documentId: number): Promise<DocumentCollaborator[]> {
    return db
      .select()
      .from(documentCollaborators).$dynamic()
      .where(eq(documentCollaborators.documentId, documentId));
  }

  async getCollaboratorRole(documentId: number, userId: number): Promise<string | undefined> {
    const [collaborator] = await db
      .select()
      .from(documentCollaborators).$dynamic()
      .where(and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, userId)
      ));
    return collaborator?.role;
  }

  async addCollaborator(collaborator: InsertDocumentCollaborator): Promise<DocumentCollaborator> {
    // Check if collaborator already exists
    const [existingCollaborator] = await db
      .select()
      .from(documentCollaborators).$dynamic()
      .where(and(
        eq(documentCollaborators.documentId, collaborator.documentId),
        eq(documentCollaborators.userId, collaborator.userId)
      ));

    if (existingCollaborator) {
      // Update the role if it's changed
      if (existingCollaborator.role !== collaborator.role) {
        return (await this.updateCollaboratorRole(
          collaborator.documentId,
          collaborator.userId,
          collaborator.role
        ))!;
      }
      return existingCollaborator;
    }
    
    // Create new collaborator
    const [createdCollaborator] = await db
      .insert(documentCollaborators)
      .values(collaborator)
      .returning();
    return createdCollaborator;
  }

  async updateCollaboratorRole(documentId: number, userId: number, role: string): Promise<DocumentCollaborator | undefined> {
    const [updatedCollaborator] = await db
      .update(documentCollaborators)
      .set({ role })
      .where(and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, userId)
      ))
      .returning();
    return updatedCollaborator;
  }

  async removeCollaborator(documentId: number, userId: number): Promise<boolean> {
    const [deleted] = await db
      .delete(documentCollaborators)
      .where(and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, userId)
      ))
      .returning({ id: documentCollaborators.id });
    return !!deleted;
  }
}

export const collaborativeAnnotationsStorage = new DatabaseCollaborativeAnnotationsStorage();