import { Express, Request, Response } from "express";
import { z } from "zod";
import { pool } from "./db";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import { createLogger } from "./logger";
const log = createLogger("routes-collaborative-annotations");


const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  documentType: z.string().min(1).max(50),
  externalId: z.string().max(100).optional(),
});

const createAnnotationSchema = z
  .object({
    documentId: z.number().int().positive(),
    content: z.string().min(1),
    startOffset: z.number().int().nonnegative(),
    endOffset: z.number().int().nonnegative(),
    selectionText: z.string().min(1),
    color: z.string().default("yellow"),
    isPublic: z.boolean().default(true),
    isResolved: z.boolean().default(false),
    parentId: z.number().int().positive().nullable().optional(),
  })
  .refine((value) => value.endOffset >= value.startOffset, {
    message: "endOffset must be greater than or equal to startOffset",
    path: ["endOffset"],
  });

const createReactionSchema = z.object({
  annotationId: z.number().int().positive(),
  reaction: z.string().min(1).max(20),
});

const addCollaboratorSchema = z.object({
  documentId: z.number().int().positive(),
  userId: z.number().int().positive(),
  role: z.string().min(1).max(20).default("viewer"),
});

function getCurrentUserId(req: CustomRequest): number | null {
  if (req?.session?.userId && Number.isInteger(req.session.userId)) {
    return Number(req.session.userId);
  }

  if (req?.user?.id && Number.isInteger(req.user.id)) {
    return Number(req.user.id);
  }

  return null;
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

async function getCollaboratorRole(documentId: number, userId: number): Promise<string | null> {
  const result = await pool.query(
    `SELECT role FROM document_collaborators WHERE document_id = $1 AND user_id = $2 LIMIT 1`,
    [documentId, userId],
  );

  return result.rows[0]?.role ?? null;
}

async function hasDocumentAccess(documentId: number, userId: number): Promise<boolean> {
  const role = await getCollaboratorRole(documentId, userId);
  return role !== null;
}

async function hasDocumentAdminAccess(documentId: number, userId: number): Promise<boolean> {
  const role = await getCollaboratorRole(documentId, userId);
  return role === "owner" || role === "admin";
}

function getAuthenticatedUserIdOrRespond(req: CustomRequest, res: Response): number | null {
  const userId = getCurrentUserId(req);
  if (!userId) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
    });
    return null;
  }
  return userId;
}

export function registerCollaborativeAnnotationsRoutes(app: Express) {
  app.get("/api/collaborative-annotations/documents", isAuthenticated, async (req: CustomRequest, res: Response) => {
    const userId = getAuthenticatedUserIdOrRespond(req, res);
    if (!userId) return;

    try {
      const result = await pool.query(
        `SELECT d.*
         FROM legislative_documents d
         INNER JOIN document_collaborators dc ON d.id = dc.document_id
         WHERE dc.user_id = $1
         ORDER BY d.updated_at DESC`,
        [userId],
      );

      return res.json({
        success: true,
        data: result.rows,
      });
    } catch (error: any) {
      log.error({ err: error }, "Error getting documents");
      return res.status(500).json({
        success: false,
        error: "Failed to get documents",
      });
    }
  });

  app.get("/api/collaborative-annotations/documents/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    const userId = getAuthenticatedUserIdOrRespond(req, res);
    if (!userId) return;

    const documentId = parsePositiveInt(req.params.id);
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Invalid document ID",
      });
    }

    try {
      const result = await pool.query("SELECT * FROM legislative_documents WHERE id = $1", [documentId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Document not found",
        });
      }

      const allowed = await hasDocumentAccess(documentId, userId);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: "Forbidden",
        });
      }

      return res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      log.error({ err: error }, "Error getting document");
      return res.status(500).json({
        success: false,
        error: "Failed to get document",
      });
    }
  });

  app.post("/api/collaborative-annotations/documents", isAuthenticated, async (req: CustomRequest, res: Response) => {
    const userId = getAuthenticatedUserIdOrRespond(req, res);
    if (!userId) return;

    try {
      const validatedData = createDocumentSchema.parse(req.body);

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
        ],
      );

      await pool.query(
        `INSERT INTO document_collaborators
         (document_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [result.rows[0].id, userId, "owner"],
      );

      return res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      log.error({ err: error }, "Error creating document");

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

  app.get(
    "/api/collaborative-annotations/documents/:documentId/annotations",
    isAuthenticated,
    async (req: CustomRequest, res: Response) => {
      const userId = getAuthenticatedUserIdOrRespond(req, res);
      if (!userId) return;

      const documentId = parsePositiveInt(req.params.documentId);
      if (!documentId) {
        return res.status(400).json({
          success: false,
          error: "Invalid document ID",
        });
      }

      try {
        const allowed = await hasDocumentAccess(documentId, userId);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
          });
        }

        const result = await pool.query(
          `SELECT * FROM annotations
           WHERE document_id = $1
           ORDER BY created_at ASC`,
          [documentId],
        );

        return res.json({
          success: true,
          data: result.rows,
        });
      } catch (error: any) {
        log.error({ err: error }, "Error getting annotations");
        return res.status(500).json({
          success: false,
          error: "Failed to get annotations",
        });
      }
    },
  );

  app.post(
    "/api/collaborative-annotations/documents/:documentId/annotations",
    isAuthenticated,
    async (req: CustomRequest, res: Response) => {
      const userId = getAuthenticatedUserIdOrRespond(req, res);
      if (!userId) return;

      const documentId = parsePositiveInt(req.params.documentId);
      if (!documentId) {
        return res.status(400).json({
          success: false,
          error: "Invalid document ID",
        });
      }

      try {
        const allowed = await hasDocumentAccess(documentId, userId);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
          });
        }

        const validatedData = createAnnotationSchema.parse({
          ...req.body,
          documentId,
        });

        const result = await pool.query(
          `INSERT INTO annotations
           (document_id, user_id, content, start_offset, end_offset, selection_text, color, is_public, is_resolved, parent_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [
            validatedData.documentId,
            userId,
            validatedData.content,
            validatedData.startOffset,
            validatedData.endOffset,
            validatedData.selectionText,
            validatedData.color,
            validatedData.isPublic,
            validatedData.isResolved,
            validatedData.parentId || null,
          ],
        );

        return res.status(201).json({
          success: true,
          data: result.rows[0],
        });
      } catch (error: any) {
        log.error({ err: error }, "Error creating annotation");

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
    },
  );

  app.patch("/api/collaborative-annotations/annotations/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    const userId = getAuthenticatedUserIdOrRespond(req, res);
    if (!userId) return;

    const annotationId = parsePositiveInt(req.params.id);
    if (!annotationId) {
      return res.status(400).json({
        success: false,
        error: "Invalid annotation ID",
      });
    }

    try {
      const existingAnnotation = await pool.query("SELECT * FROM annotations WHERE id = $1", [annotationId]);

      if (existingAnnotation.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Annotation not found",
        });
      }

      const annotation = existingAnnotation.rows[0];
      const isOwner = Number(annotation.user_id) === userId;
      const canAdminDocument = await hasDocumentAdminAccess(Number(annotation.document_id), userId);
      if (!isOwner && !canAdminDocument) {
        return res.status(403).json({
          success: false,
          error: "Forbidden",
        });
      }

      const { content, color, isResolved } = req.body;
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (content !== undefined) {
        updateFields.push(`content = $${paramIndex}`);
        updateValues.push(content);
        paramIndex += 1;
      }

      if (color !== undefined) {
        updateFields.push(`color = $${paramIndex}`);
        updateValues.push(color);
        paramIndex += 1;
      }

      if (isResolved !== undefined) {
        updateFields.push(`is_resolved = $${paramIndex}`);
        updateValues.push(isResolved);
        paramIndex += 1;
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");

      if (updateFields.length === 1) {
        return res.json({
          success: true,
          data: existingAnnotation.rows[0],
        });
      }

      const result = await pool.query(
        `UPDATE annotations
         SET ${updateFields.join(", ")}
         WHERE id = $${paramIndex}
         RETURNING *`,
        [...updateValues, annotationId],
      );

      return res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      log.error({ err: error }, "Error updating annotation");
      return res.status(500).json({
        success: false,
        error: "Failed to update annotation",
      });
    }
  });

  app.delete("/api/collaborative-annotations/annotations/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    const userId = getAuthenticatedUserIdOrRespond(req, res);
    if (!userId) return;

    const annotationId = parsePositiveInt(req.params.id);
    if (!annotationId) {
      return res.status(400).json({
        success: false,
        error: "Invalid annotation ID",
      });
    }

    try {
      const existingAnnotation = await pool.query("SELECT * FROM annotations WHERE id = $1", [annotationId]);

      if (existingAnnotation.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Annotation not found",
        });
      }

      const annotation = existingAnnotation.rows[0];
      const isOwner = Number(annotation.user_id) === userId;
      const canAdminDocument = await hasDocumentAdminAccess(Number(annotation.document_id), userId);
      if (!isOwner && !canAdminDocument) {
        return res.status(403).json({
          success: false,
          error: "Forbidden",
        });
      }

      await pool.query("DELETE FROM annotations WHERE id = $1", [annotationId]);

      return res.json({
        success: true,
        message: "Annotation deleted successfully",
      });
    } catch (error: any) {
      log.error({ err: error }, "Error deleting annotation");
      return res.status(500).json({
        success: false,
        error: "Failed to delete annotation",
      });
    }
  });

  app.get(
    "/api/collaborative-annotations/annotations/:annotationId/reactions",
    isAuthenticated,
    async (req: CustomRequest, res: Response) => {
      const userId = getAuthenticatedUserIdOrRespond(req, res);
      if (!userId) return;

      const annotationId = parsePositiveInt(req.params.annotationId);
      if (!annotationId) {
        return res.status(400).json({
          success: false,
          error: "Invalid annotation ID",
        });
      }

      try {
        const annotation = await pool.query("SELECT document_id FROM annotations WHERE id = $1", [annotationId]);
        if (annotation.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: "Annotation not found",
          });
        }

        const documentId = Number(annotation.rows[0].document_id);
        const allowed = await hasDocumentAccess(documentId, userId);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
          });
        }

        const result = await pool.query(
          `SELECT r.*, u.username
           FROM collaborative_annotation_reactions r
           LEFT JOIN users u ON r.user_id = u.id
           WHERE r.annotation_id = $1
           ORDER BY r.created_at ASC`,
          [annotationId],
        );

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
            counts: Object.entries(reactionsByType).reduce((acc: Record<string, number>, [key, values]) => {
              acc[key] = values.length;
              return acc;
            }, {}),
          },
        });
      } catch (error: any) {
        log.error({ err: error }, "Error getting reactions");
        return res.status(500).json({
          success: false,
          error: "Failed to get reactions",
        });
      }
    },
  );

  app.post(
    "/api/collaborative-annotations/annotations/:annotationId/reactions",
    isAuthenticated,
    async (req: CustomRequest, res: Response) => {
      const userId = getAuthenticatedUserIdOrRespond(req, res);
      if (!userId) return;

      const annotationId = parsePositiveInt(req.params.annotationId);
      if (!annotationId) {
        return res.status(400).json({
          success: false,
          error: "Invalid annotation ID",
        });
      }

      try {
        const validatedData = createReactionSchema.parse({
          annotationId,
          reaction: req.body.reaction,
        });

        const annotationCheck = await pool.query(`SELECT id, document_id FROM annotations WHERE id = $1`, [validatedData.annotationId]);

        if (annotationCheck.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: "Annotation not found",
          });
        }

        const documentId = Number(annotationCheck.rows[0].document_id);
        const allowed = await hasDocumentAccess(documentId, userId);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
          });
        }

        const existingReaction = await pool.query(
          `SELECT * FROM collaborative_annotation_reactions
           WHERE annotation_id = $1 AND user_id = $2 AND reaction = $3`,
          [validatedData.annotationId, userId, validatedData.reaction],
        );

        if (existingReaction.rows.length > 0) {
          return res.status(200).json({
            success: true,
            data: existingReaction.rows[0],
            message: "Reaction already exists",
          });
        }

        const result = await pool.query(
          `INSERT INTO collaborative_annotation_reactions
           (annotation_id, user_id, reaction)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [validatedData.annotationId, userId, validatedData.reaction],
        );

        return res.status(201).json({
          success: true,
          data: result.rows[0],
        });
      } catch (error: any) {
        log.error({ err: error }, "Error creating reaction");

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
    },
  );

  app.delete(
    "/api/collaborative-annotations/annotations/:annotationId/reactions",
    isAuthenticated,
    async (req: CustomRequest, res: Response) => {
      const userId = getAuthenticatedUserIdOrRespond(req, res);
      if (!userId) return;

      const annotationId = parsePositiveInt(req.params.annotationId);
      if (!annotationId) {
        return res.status(400).json({
          success: false,
          error: "Invalid annotation ID",
        });
      }

      const reaction = typeof req.query.reaction === "string" ? req.query.reaction.trim() : "";
      if (!reaction) {
        return res.status(400).json({
          success: false,
          error: "reaction query parameter is required",
        });
      }

      try {
        const annotation = await pool.query("SELECT document_id FROM annotations WHERE id = $1", [annotationId]);
        if (annotation.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: "Annotation not found",
          });
        }

        const documentId = Number(annotation.rows[0].document_id);
        const allowed = await hasDocumentAccess(documentId, userId);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
          });
        }

        const existingReaction = await pool.query(
          `SELECT * FROM collaborative_annotation_reactions
           WHERE annotation_id = $1 AND user_id = $2 AND reaction = $3`,
          [annotationId, userId, reaction],
        );

        if (existingReaction.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: "Reaction not found",
          });
        }

        await pool.query(
          `DELETE FROM collaborative_annotation_reactions
           WHERE annotation_id = $1 AND user_id = $2 AND reaction = $3`,
          [annotationId, userId, reaction],
        );

        return res.json({
          success: true,
          message: "Reaction removed successfully",
        });
      } catch (error: any) {
        log.error({ err: error }, "Error removing reaction");
        return res.status(500).json({
          success: false,
          error: "Failed to remove reaction",
        });
      }
    },
  );

  app.get(
    "/api/collaborative-annotations/documents/:documentId/collaborators",
    isAuthenticated,
    async (req: CustomRequest, res: Response) => {
      const userId = getAuthenticatedUserIdOrRespond(req, res);
      if (!userId) return;

      const documentId = parsePositiveInt(req.params.documentId);
      if (!documentId) {
        return res.status(400).json({
          success: false,
          error: "Invalid document ID",
        });
      }

      try {
        const allowed = await hasDocumentAccess(documentId, userId);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
          });
        }

        const result = await pool.query(
          `SELECT dc.*, u.username
           FROM document_collaborators dc
           LEFT JOIN users u ON dc.user_id = u.id
           WHERE dc.document_id = $1
           ORDER BY dc.joined_at ASC`,
          [documentId],
        );

        const collaborators = result.rows.map((row: any) => ({
          id: row.id,
          documentId: row.document_id,
          userId: row.user_id,
          role: row.role,
          joinedAt: row.joined_at,
          user: row.username
            ? {
                id: row.user_id,
                username: row.username,
              }
            : null,
        }));

        return res.json({
          success: true,
          data: collaborators,
        });
      } catch (error: any) {
        log.error({ err: error }, "Error getting collaborators");
        return res.status(500).json({
          success: false,
          error: "Failed to get collaborators",
        });
      }
    },
  );

  app.post(
    "/api/collaborative-annotations/documents/:documentId/collaborators",
    isAuthenticated,
    async (req: CustomRequest, res: Response) => {
      const currentUserId = getAuthenticatedUserIdOrRespond(req, res);
      if (!currentUserId) return;

      const documentId = parsePositiveInt(req.params.documentId);
      if (!documentId) {
        return res.status(400).json({
          success: false,
          error: "Invalid document ID",
        });
      }

      try {
        const canManage = await hasDocumentAdminAccess(documentId, currentUserId);
        if (!canManage) {
          return res.status(403).json({
            success: false,
            error: "Only document owners or admins can add collaborators",
          });
        }

        const validatedData = addCollaboratorSchema.parse({
          ...req.body,
          documentId,
        });

        const existingCollaborator = await pool.query(
          `SELECT * FROM document_collaborators
           WHERE document_id = $1 AND user_id = $2`,
          [validatedData.documentId, validatedData.userId],
        );

        if (existingCollaborator.rows.length > 0) {
          return res.status(409).json({
            success: false,
            error: "User is already a collaborator on this document",
          });
        }

        const result = await pool.query(
          `INSERT INTO document_collaborators
           (document_id, user_id, role)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [validatedData.documentId, validatedData.userId, validatedData.role],
        );

        return res.status(201).json({
          success: true,
          data: result.rows[0],
        });
      } catch (error: any) {
        log.error({ err: error }, "Error adding collaborator");

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
    },
  );
}
