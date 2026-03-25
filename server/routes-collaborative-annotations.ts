import { Express, Request, Response } from "express";
import { z } from "zod";
import { pool } from "./db";

// Schema validation for document creation
const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  documentType: z.string().min(1).max(50),
  externalId: z.string().max(100).optional(),
});

// Schema validation for annotation creation
const createAnnotationSchema = z.object({
  documentId: z.number().int().positive(),
  userId: z.number().int().positive(),
  content: z.string().min(1),
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().nonnegative(),
  selectionText: z.string().min(1),
  color: z.string().default("yellow"),
  isPublic: z.boolean().default(true),
  isResolved: z.boolean().default(false),
  parentId: z.number().int().positive().nullable().optional(),
});

// Schema validation for reaction creation
const createReactionSchema = z.object({
  annotationId: z.number().int().positive(),
  userId: z.number().int().positive(),
  reaction: z.string().min(1).max(20),
});

// Schema validation for collaborator addition
const addCollaboratorSchema = z.object({
  documentId: z.number().int().positive(),
  userId: z.number().int().positive(),
  role: z.string().min(1).max(20).default("viewer"),
});

export function registerCollaborativeAnnotationsRoutes(app: Express) {
  // Get all documents
  app.get("/api/collaborative-annotations/documents", async (req: Request, res: Response) => {
    try {
      // Query all documents from the database
      const result = await pool.query("SELECT * FROM legislative_documents ORDER BY updated_at DESC");
      
      return res.json({
        success: true,
        data: result.rows,
      });
    } catch (error: any) {
      console.error("Error getting documents:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get documents",
      });
    }
  });

  // Get a single document by ID
  app.get("/api/collaborative-annotations/documents/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      // Query document by ID
      const result = await pool.query(
        "SELECT * FROM legislative_documents WHERE id = $1",
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Document not found",
        });
      }
      
      return res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error getting document:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get document",
      });
    }
  });

  // Create a new document
  app.post("/api/collaborative-annotations/documents", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = createDocumentSchema.parse(req.body);
      
      // Insert document into the database
      const result = await pool.query(
        `INSERT INTO legislative_documents 
         (title, content, document_type, external_id) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          validatedData.title,
          validatedData.content,
          validatedData.documentType,
          validatedData.externalId || null,
        ]
      );
      
      // Add creator as a collaborator with "owner" role
      // For simplicity, we're using userId 1 as a placeholder. In a real app, get this from auth
      const userId = 1; // This should come from authentication in a real app
      
      await pool.query(
        `INSERT INTO document_collaborators
         (document_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [result.rows[0].id, userId, "owner"]
      );
      
      return res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error creating document:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid document data",
          details: error.errors,
        });
      }
      
      return res.status(500).json({
        success: false,
        error: "Failed to create document",
      });
    }
  });

  // Get annotations for a document
  app.get("/api/collaborative-annotations/documents/:documentId/annotations", async (req: Request, res: Response) => {
    const { documentId } = req.params;
    
    try {
      // Query annotations for document
      const result = await pool.query(
        `SELECT * FROM annotations 
         WHERE document_id = $1 
         ORDER BY created_at ASC`,
        [documentId]
      );
      
      return res.json({
        success: true,
        data: result.rows,
      });
    } catch (error: any) {
      console.error("Error getting annotations:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get annotations",
      });
    }
  });

  // Create a new annotation
  app.post("/api/collaborative-annotations/documents/:documentId/annotations", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = createAnnotationSchema.parse({
        ...req.body,
        documentId: parseInt(req.params.documentId),
      });
      
      // Insert annotation into the database
      const result = await pool.query(
        `INSERT INTO annotations 
         (document_id, user_id, content, start_offset, end_offset, selection_text, color, is_public, is_resolved, parent_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [
          validatedData.documentId,
          validatedData.userId,
          validatedData.content,
          validatedData.startOffset,
          validatedData.endOffset,
          validatedData.selectionText,
          validatedData.color,
          validatedData.isPublic,
          validatedData.isResolved,
          validatedData.parentId || null,
        ]
      );
      
      return res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error creating annotation:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid annotation data",
          details: error.errors,
        });
      }
      
      return res.status(500).json({
        success: false,
        error: "Failed to create annotation",
      });
    }
  });

  // Update an annotation
  app.patch("/api/collaborative-annotations/annotations/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      // Check if annotation exists and user has permission to edit it
      const existingAnnotation = await pool.query(
        "SELECT * FROM annotations WHERE id = $1",
        [id]
      );
      
      if (existingAnnotation.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Annotation not found",
        });
      }
      
      // In a real app, check if the current user is the creator of the annotation
      // For simplicity, we're allowing any update here
      
      // Update only allowed fields
      const { content, color, isResolved } = req.body;
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      if (content !== undefined) {
        updateFields.push(`content = $${paramIndex}`);
        updateValues.push(content);
        paramIndex++;
      }
      
      if (color !== undefined) {
        updateFields.push(`color = $${paramIndex}`);
        updateValues.push(color);
        paramIndex++;
      }
      
      if (isResolved !== undefined) {
        updateFields.push(`is_resolved = $${paramIndex}`);
        updateValues.push(isResolved);
        paramIndex++;
      }
      
      // Add updated_at timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // If no fields to update, return the existing annotation
      if (updateFields.length === 1) {
        return res.json({
          success: true,
          data: existingAnnotation.rows[0],
        });
      }
      
      // Perform the update
      const result = await pool.query(
        `UPDATE annotations 
         SET ${updateFields.join(", ")} 
         WHERE id = $${paramIndex} 
         RETURNING *`,
        [...updateValues, id]
      );
      
      return res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error updating annotation:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update annotation",
      });
    }
  });

  // Delete an annotation
  app.delete("/api/collaborative-annotations/annotations/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      // Check if annotation exists and user has permission to delete it
      const existingAnnotation = await pool.query(
        "SELECT * FROM annotations WHERE id = $1",
        [id]
      );
      
      if (existingAnnotation.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Annotation not found",
        });
      }
      
      // In a real app, check if the current user is the creator of the annotation
      // For simplicity, we're allowing any deletion here
      
      // Delete the annotation
      await pool.query(
        "DELETE FROM annotations WHERE id = $1",
        [id]
      );
      
      return res.json({
        success: true,
        message: "Annotation deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting annotation:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete annotation",
      });
    }
  });

  // Get reactions for an annotation
  app.get("/api/collaborative-annotations/annotations/:annotationId/reactions", async (req: Request, res: Response) => {
    const { annotationId } = req.params;
    
    try {
      // Query reactions for annotation
      const result = await pool.query(
        `SELECT r.*, u.username 
         FROM collaborative_annotation_reactions r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.annotation_id = $1 
         ORDER BY r.created_at ASC`,
        [annotationId]
      );
      
      // Group reactions by type for easy frontend processing
      const reactionsByType: Record<string, any[]> = {};
      
      for (const row of result.rows) {
        if (!reactionsByType[row.reaction]) {
          reactionsByType[row.reaction] = [];
        }
        reactionsByType[row.reaction].push({
          id: row.id,
          userId: row.user_id,
          username: row.username,
          createdAt: row.created_at,
        });
      }
      
      return res.json({
        success: true,
        data: {
          reactions: result.rows,
          reactionsByType,
          counts: Object.entries(reactionsByType).reduce(
            (acc: Record<string, number>, [key, values]) => {
              acc[key] = values.length;
              return acc;
            },
            {}
          ),
        },
      });
    } catch (error: any) {
      console.error("Error getting reactions:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get reactions",
      });
    }
  });

  // Add a reaction to an annotation
  app.post("/api/collaborative-annotations/annotations/:annotationId/reactions", async (req: Request, res: Response) => {
    try {
      // Create the data object with explicit properties for validation
      const dataToValidate = {
        annotationId: parseInt(req.params.annotationId),
        userId: req.body.userId,
        reaction: req.body.reaction
      };
      
      // Validate request body
      const validatedData = createReactionSchema.parse(dataToValidate);
      
      // First, check if the annotation exists in our new table
      const annotationCheck = await pool.query(
        `SELECT id FROM annotations WHERE id = $1`,
        [validatedData.annotationId]
      );
      
      if (annotationCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Annotation not found",
        });
      }
      
      // Check if the reaction already exists
      const existingReaction = await pool.query(
        `SELECT * FROM collaborative_annotation_reactions 
         WHERE annotation_id = $1 AND user_id = $2 AND reaction = $3`,
        [validatedData.annotationId, validatedData.userId, validatedData.reaction]
      );
      
      if (existingReaction.rows.length > 0) {
        // Return the existing reaction without creating a duplicate
        return res.status(200).json({
          success: true,
          data: existingReaction.rows[0],
          message: "Reaction already exists"
        });
      }
      
      // Insert reaction into the database using our new table
      const result = await pool.query(
        `INSERT INTO collaborative_annotation_reactions 
         (annotation_id, user_id, reaction) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [
          validatedData.annotationId,
          validatedData.userId,
          validatedData.reaction,
        ]
      );
      
      return res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error creating reaction:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid reaction data",
          details: error.errors,
        });
      }
      
      return res.status(500).json({
        success: false,
        error: "Failed to create reaction",
      });
    }
  });
  
  // Remove a reaction from an annotation
  app.delete("/api/collaborative-annotations/annotations/:annotationId/reactions", async (req: Request, res: Response) => {
    try {
      const { annotationId } = req.params;
      const { userId, reaction } = req.query;
      
      if (!userId || !reaction) {
        return res.status(400).json({
          success: false,
          error: "userId and reaction query parameters are required",
        });
      }
      
      // Check if the reaction exists
      const existingReaction = await pool.query(
        `SELECT * FROM collaborative_annotation_reactions 
         WHERE annotation_id = $1 AND user_id = $2 AND reaction = $3`,
        [annotationId, userId, reaction]
      );
      
      if (existingReaction.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Reaction not found",
        });
      }
      
      // Delete the reaction
      await pool.query(
        `DELETE FROM collaborative_annotation_reactions 
         WHERE annotation_id = $1 AND user_id = $2 AND reaction = $3`,
        [annotationId, userId, reaction]
      );
      
      return res.json({
        success: true,
        message: "Reaction removed successfully",
      });
    } catch (error: any) {
      console.error("Error removing reaction:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to remove reaction",
      });
    }
  });

  // Get collaborators for a document
  app.get("/api/collaborative-annotations/documents/:documentId/collaborators", async (req: Request, res: Response) => {
    const { documentId } = req.params;
    
    try {
      // Query collaborators for document
      const result = await pool.query(
        `SELECT dc.*, u.username 
         FROM document_collaborators dc
         LEFT JOIN users u ON dc.user_id = u.id
         WHERE dc.document_id = $1 
         ORDER BY dc.joined_at ASC`,
        [documentId]
      );
      
      // Format collaborators with user info
      const collaborators = result.rows.map((row: any) => ({
        id: row.id,
        documentId: row.document_id,
        userId: row.user_id,
        role: row.role,
        joinedAt: row.joined_at,
        user: row.username ? {
          id: row.user_id,
          username: row.username
        } : null
      }));
      
      return res.json({
        success: true,
        data: collaborators,
      });
    } catch (error: any) {
      console.error("Error getting collaborators:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get collaborators",
      });
    }
  });

  // Add a collaborator to a document
  app.post("/api/collaborative-annotations/documents/:documentId/collaborators", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = addCollaboratorSchema.parse({
        ...req.body,
        documentId: parseInt(req.params.documentId),
      });
      
      // Check if collaborator already exists
      const existingCollaborator = await pool.query(
        `SELECT * FROM document_collaborators 
         WHERE document_id = $1 AND user_id = $2`,
        [validatedData.documentId, validatedData.userId]
      );
      
      if (existingCollaborator.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: "User is already a collaborator on this document",
        });
      }
      
      // Insert collaborator into the database
      const result = await pool.query(
        `INSERT INTO document_collaborators 
         (document_id, user_id, role) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [
          validatedData.documentId,
          validatedData.userId,
          validatedData.role,
        ]
      );
      
      return res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error adding collaborator:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid collaborator data",
          details: error.errors,
        });
      }
      
      return res.status(500).json({
        success: false,
        error: "Failed to add collaborator",
      });
    }
  });
}