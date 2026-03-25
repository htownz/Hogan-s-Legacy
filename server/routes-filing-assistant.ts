// @ts-nocheck
import { Request, Response, Express } from 'express';
import { z } from 'zod';
import { Session } from 'express-session';
import { isAuthenticated } from './auth';
import { db } from './db';
// TODO: These entities should be defined in schema-campaign-finance.ts
// For now, let's mock them in this file for demonstration purposes
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";

// Define the tables that would normally be in the schema-campaign-finance.ts
export const filingFormTemplates = pgTable("filing_form_templates", {
  id: serial("id").primaryKey(),
  formNumber: text("form_number").notNull(),
  formTitle: text("form_title").notNull(),
  formDescription: text("form_description").notNull(),
  formType: text("form_type").notNull(), // candidate, committee, lobby
  currentVersion: text("current_version").notNull(),
  effectiveDate: text("effective_date").notNull(),
  templateUrl: text("template_url").notNull(),
  instructionsUrl: text("instructions_url"),
  aiModelTrained: boolean("ai_model_trained").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const filingFormDrafts = pgTable("filing_form_drafts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  formTemplateId: integer("form_template_id").notNull(),
  draftName: text("draft_name").notNull(),
  formData: jsonb("form_data").default({}),
  formState: text("form_state").default("in_progress"), // in_progress, completed, submitted
  completionPercentage: integer("completion_percentage").default(0),
  lastEditedField: text("last_edited_field"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const aiFilingAssistantSessions = pgTable("ai_filing_assistant_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  draftId: integer("draft_id"),
  formTemplateId: integer("form_template_id"),
  sessionHistory: jsonb("session_history").default([]),
  lastUserQuery: text("last_user_query"),
  lastAiResponse: text("last_ai_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
import { eq, desc, asc, sql, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

// Interface for session data
interface SessionData {
  userId?: number;
  [key: string]: any;
}

// Extended request interface with session
interface CustomRequest extends Request {
  session: Session & Partial<SessionData>;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'forms');
    
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Mock form field definitions (would normally come from a database)
const mockFormFields = {
  "CTA": [
    {
      id: "candidate_name",
      label: "Candidate Name",
      type: "text",
      required: true,
      placeholder: "Enter full name",
      section: "CANDIDATE INFORMATION",
      group: "personal_details"
    },
    {
      id: "candidate_address",
      label: "Candidate Mailing Address",
      type: "text",
      required: true,
      placeholder: "Street address, city, state, zip",
      section: "CANDIDATE INFORMATION",
      group: "personal_details"
    },
    {
      id: "candidate_phone",
      label: "Candidate Phone Number",
      type: "text",
      required: true,
      placeholder: "Primary phone number",
      section: "CANDIDATE INFORMATION",
      group: "personal_details"
    },
    {
      id: "candidate_email",
      label: "Candidate Email",
      type: "text",
      required: false,
      placeholder: "Email address",
      section: "CANDIDATE INFORMATION",
      group: "personal_details"
    },
    {
      id: "treasurer_name",
      label: "Campaign Treasurer Name",
      type: "text",
      required: true,
      placeholder: "Enter full name",
      section: "CAMPAIGN TREASURER",
      group: "treasurer_details"
    },
    {
      id: "treasurer_address",
      label: "Treasurer Street Address",
      type: "text",
      required: true,
      placeholder: "Street address (residence or business)",
      section: "CAMPAIGN TREASURER",
      group: "treasurer_details"
    },
    {
      id: "treasurer_city",
      label: "Treasurer City",
      type: "text",
      required: true,
      placeholder: "City",
      section: "CAMPAIGN TREASURER",
      group: "treasurer_details"
    },
    {
      id: "treasurer_state",
      label: "Treasurer State",
      type: "text",
      required: true,
      placeholder: "State",
      section: "CAMPAIGN TREASURER",
      group: "treasurer_details"
    },
    {
      id: "treasurer_zip",
      label: "Treasurer Zip Code",
      type: "text",
      required: true,
      placeholder: "Zip Code",
      section: "CAMPAIGN TREASURER",
      group: "treasurer_details"
    },
    {
      id: "treasurer_phone",
      label: "Treasurer Phone Number",
      type: "text",
      required: true,
      placeholder: "Phone number",
      section: "CAMPAIGN TREASURER",
      group: "treasurer_details"
    },
    {
      id: "office_sought",
      label: "Office Sought",
      type: "text",
      required: true,
      placeholder: "Position you are seeking",
      section: "OFFICE INFORMATION",
      group: "campaign_details"
    },
    {
      id: "office_held",
      label: "Office Currently Held",
      type: "text",
      required: false,
      placeholder: "If you currently hold office",
      section: "OFFICE INFORMATION",
      group: "campaign_details"
    },
    {
      id: "election_date",
      label: "Election Date",
      type: "date",
      required: true,
      section: "OFFICE INFORMATION",
      group: "campaign_details"
    },
    {
      id: "party_affiliation",
      label: "Political Party Affiliation",
      type: "select",
      required: false,
      options: [
        { value: "republican", label: "Republican" },
        { value: "democrat", label: "Democrat" },
        { value: "libertarian", label: "Libertarian" },
        { value: "green", label: "Green" },
        { value: "independent", label: "Independent" },
        { value: "other", label: "Other" }
      ],
      section: "OFFICE INFORMATION",
      group: "campaign_details"
    },
    {
      id: "signature",
      label: "Candidate Signature Confirmation",
      type: "checkbox",
      required: true,
      helpText: "By checking this box, I confirm this appointment and that the information provided is true and correct.",
      section: "SIGNATURE AND DATE",
      group: "confirmation"
    },
    {
      id: "signature_date",
      label: "Date Signed",
      type: "date",
      required: true,
      section: "SIGNATURE AND DATE",
      group: "confirmation"
    }
  ],
  "GPAC": [
    {
      id: "committee_name",
      label: "Committee Name",
      type: "text",
      required: true,
      placeholder: "Full name of committee",
      section: "COMMITTEE INFORMATION",
      group: "committee_details"
    },
    {
      id: "committee_address",
      label: "Committee Address",
      type: "text",
      required: true,
      placeholder: "Street address, city, state, zip",
      section: "COMMITTEE INFORMATION",
      group: "committee_details"
    },
    {
      id: "committee_phone",
      label: "Committee Phone Number",
      type: "text",
      required: true,
      placeholder: "Primary phone number",
      section: "COMMITTEE INFORMATION",
      group: "committee_details"
    },
    {
      id: "committee_email",
      label: "Committee Email",
      type: "text",
      required: false,
      placeholder: "Email address",
      section: "COMMITTEE INFORMATION",
      group: "committee_details"
    },
    {
      id: "committee_purpose",
      label: "Purpose of Committee",
      type: "textarea",
      required: true,
      placeholder: "Describe the committee's purpose",
      section: "COMMITTEE INFORMATION",
      group: "committee_details"
    },
    {
      id: "treasurer_name",
      label: "Campaign Treasurer Name",
      type: "text",
      required: true,
      placeholder: "Enter full name",
      section: "CAMPAIGN TREASURER",
      group: "treasurer_details"
    },
    {
      id: "treasurer_address",
      label: "Treasurer Street Address",
      type: "text",
      required: true,
      placeholder: "Street address (residence or business)",
      section: "CAMPAIGN TREASURER",
      group: "treasurer_details"
    },
    {
      id: "treasurer_city",
      label: "Treasurer City",
      type: "text",
      required: true,
      placeholder: "City",
      section: "CAMPAIGN TREASURER",
      group: "treasurer_details"
    },
    {
      id: "treasurer_state",
      label: "Treasurer State",
      type: "text",
      required: true,
      placeholder: "State",
      section: "CAMPAIGN TREASURER",
      group: "treasurer_details"
    },
    {
      id: "treasurer_zip",
      label: "Treasurer Zip Code",
      type: "text",
      required: true,
      placeholder: "Zip Code",
      section: "CAMPAIGN TREASURER",
      group: "treasurer_details"
    },
    {
      id: "treasurer_phone",
      label: "Treasurer Phone Number",
      type: "text",
      required: true,
      placeholder: "Phone number",
      section: "CAMPAIGN TREASURER",
      group: "treasurer_details"
    },
    {
      id: "assistant_treasurer_name",
      label: "Assistant Treasurer Name (if appointed)",
      type: "text",
      required: false,
      placeholder: "Enter full name",
      section: "ASSISTANT CAMPAIGN TREASURER",
      group: "assistant_treasurer_details"
    },
    {
      id: "assistant_treasurer_address",
      label: "Assistant Treasurer Address",
      type: "text",
      required: false,
      placeholder: "Street address, city, state, zip",
      section: "ASSISTANT CAMPAIGN TREASURER",
      group: "assistant_treasurer_details"
    },
    {
      id: "assistant_treasurer_phone",
      label: "Assistant Treasurer Phone Number",
      type: "text",
      required: false,
      placeholder: "Phone number",
      section: "ASSISTANT CAMPAIGN TREASURER",
      group: "assistant_treasurer_details"
    },
    {
      id: "signature",
      label: "Treasurer Signature Confirmation",
      type: "checkbox",
      required: true,
      helpText: "By checking this box, I confirm this appointment and that the information provided is true and correct.",
      section: "SIGNATURE AND DATE",
      group: "confirmation"
    },
    {
      id: "signature_date",
      label: "Date Signed",
      type: "date",
      required: true,
      section: "SIGNATURE AND DATE",
      group: "confirmation"
    }
  ]
};

/**
 * Register filing assistant API routes
 */
export function registerFilingAssistantRoutes(app: Express): void {
  // Get all form templates
  app.get("/api/filing-forms/templates", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Check if templates exist in database
      const templatesCount = await db.select({ count: sql`count(*)` }).from(filingFormTemplates);
      
      // If no templates exist, seed with initial form templates
      if (parseInt(templatesCount[0].count as string) === 0) {
        const initialTemplates = [
          {
            formNumber: "CTA",
            formTitle: "Appointment of a Campaign Treasurer by a Candidate",
            formDescription: "This form is used to designate a campaign treasurer, which is required before you can accept campaign contributions or make campaign expenditures.",
            formType: "candidate",
            currentVersion: "1.4",
            effectiveDate: new Date("2021-01-15").toISOString(),
            templateUrl: "https://www.ethics.state.tx.us/data/forms/coh/cta.pdf",
            instructionsUrl: "https://www.ethics.state.tx.us/data/forms/coh/CTA_ins.pdf",
            aiModelTrained: true
          },
          {
            formNumber: "ACTA",
            formTitle: "Amendment: Appointment of a Campaign Treasurer by a Candidate",
            formDescription: "This form is used to make changes to a campaign treasurer appointment.",
            formType: "candidate",
            currentVersion: "1.3",
            effectiveDate: new Date("2021-01-15").toISOString(),
            templateUrl: "https://www.ethics.state.tx.us/data/forms/coh/acta.pdf",
            instructionsUrl: "https://www.ethics.state.tx.us/data/forms/coh/ACTA_ins.pdf", 
            aiModelTrained: true
          },
          {
            formNumber: "C/OH",
            formTitle: "Candidate/Officeholder Campaign Finance Report",
            formDescription: "This form is used to file required campaign finance reports regarding campaign contributions and expenditures.",
            formType: "candidate",
            currentVersion: "2.1",
            effectiveDate: new Date("2021-01-15").toISOString(),
            templateUrl: "https://www.ethics.state.tx.us/data/forms/coh/coh.pdf",
            instructionsUrl: "https://www.ethics.state.tx.us/data/forms/coh/COH_ins.pdf",
            aiModelTrained: true
          },
          {
            formNumber: "GPAC",
            formTitle: "Appointment of a Campaign Treasurer by a General-Purpose Committee",
            formDescription: "This form is used to register a general-purpose political committee.",
            formType: "committee",
            currentVersion: "1.2",
            effectiveDate: new Date("2021-01-15").toISOString(),
            templateUrl: "https://www.ethics.state.tx.us/data/forms/pacs/gpac.pdf",
            instructionsUrl: "https://www.ethics.state.tx.us/data/forms/pacs/GPAC_ins.pdf",
            aiModelTrained: true
          },
          {
            formNumber: "SPAC",
            formTitle: "Appointment of a Campaign Treasurer by a Specific-Purpose Committee",
            formDescription: "This form is used to register a specific-purpose political committee.",
            formType: "committee",
            currentVersion: "1.2",
            effectiveDate: new Date("2021-01-15").toISOString(),
            templateUrl: "https://www.ethics.state.tx.us/data/forms/pacs/spac.pdf",
            instructionsUrl: "https://www.ethics.state.tx.us/data/forms/pacs/SPAC_ins.pdf",
            aiModelTrained: false
          },
          {
            formNumber: "REG",
            formTitle: "Lobby Registration",
            formDescription: "This form is used to register as a lobbyist.",
            formType: "lobby",
            currentVersion: "3.0",
            effectiveDate: new Date("2022-01-01").toISOString(),
            templateUrl: "https://www.ethics.state.tx.us/data/forms/lobby/reg.pdf",
            instructionsUrl: "https://www.ethics.state.tx.us/data/forms/lobby/REG_ins.pdf",
            aiModelTrained: false
          }
        ];
        
        // Insert initial templates
        await db.insert(filingFormTemplates).values(initialTemplates);
      }
      
      // Fetch all templates
      const templates = await db.select().from(filingFormTemplates).orderBy(asc(filingFormTemplates.formNumber));
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching form templates:", error);
      res.status(500).json({ error: "Failed to fetch form templates" });
    }
  });
  
  // Get form fields for a specific template
  app.get("/api/filing-forms/templates/:id/fields", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      
      // Fetch the template to get the form number
      const template = await db.select().from(filingFormTemplates).$dynamic().where(eq(filingFormTemplates.id, templateId)).limit(1);
      
      if (template.length === 0) {
        return res.status(404).json({ error: "Form template not found" });
      }
      
      const formNumber = template[0].formNumber;
      
      // Get fields based on form number (using mock data for now)
      const fields = mockFormFields[formNumber as keyof typeof mockFormFields] || [];
      
      res.json(fields);
    } catch (error: any) {
      console.error("Error fetching form fields:", error);
      res.status(500).json({ error: "Failed to fetch form fields" });
    }
  });
  
  // Get user's form drafts
  app.get("/api/filing-forms/drafts", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const drafts = await db.select()
        .from(filingFormDrafts).$dynamic()
        .where(eq(filingFormDrafts.userId, userId))
        .orderBy(desc(filingFormDrafts.updatedAt));
      
      res.json(drafts);
    } catch (error: any) {
      console.error("Error fetching form drafts:", error);
      res.status(500).json({ error: "Failed to fetch form drafts" });
    }
  });
  
  // Create a new form draft
  app.post("/api/filing-forms/drafts", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const draftData = req.body;
      
      // Validate input
      const createDraftSchema = z.object({
        formTemplateId: z.number(),
        draftName: z.string().min(1)
      });
      
      const validatedData = createDraftSchema.parse(draftData);
      
      // Check if the template exists
      const template = await db.select()
        .from(filingFormTemplates).$dynamic()
        .where(eq(filingFormTemplates.id, validatedData.formTemplateId))
        .limit(1);
      
      if (template.length === 0) {
        return res.status(404).json({ error: "Form template not found" });
      }
      
      // Create new draft
      const [newDraft] = await db.insert(filingFormDrafts)
        .values({
          userId,
          formTemplateId: validatedData.formTemplateId,
          draftName: validatedData.draftName,
          formData: {},
          formState: 'in-progress',
          completionPercentage: 0,
          aiAssisted: false,
          lastAccessed: new Date().toISOString()
        })
        .returning();
      
      res.status(201).json(newDraft);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      
      console.error("Error creating form draft:", error);
      res.status(500).json({ error: "Failed to create form draft" });
    }
  });
  
  // Get a specific form draft
  app.get("/api/filing-forms/drafts/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const draftId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const draft = await db.select()
        .from(filingFormDrafts).$dynamic()
        .where(eq(filingFormDrafts.id, draftId))
        .limit(1);
      
      if (draft.length === 0) {
        return res.status(404).json({ error: "Draft not found" });
      }
      
      // Check if the draft belongs to the user
      if (draft[0].userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Update last accessed timestamp
      await db.update(filingFormDrafts)
        .set({ lastAccessed: new Date().toISOString() })
        .where(eq(filingFormDrafts.id, draftId));
      
      res.json(draft[0]);
    } catch (error: any) {
      console.error("Error fetching form draft:", error);
      res.status(500).json({ error: "Failed to fetch form draft" });
    }
  });
  
  // Update a form draft
  app.patch("/api/filing-forms/drafts/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const draftId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Check if the draft exists and belongs to the user
      const draft = await db.select()
        .from(filingFormDrafts).$dynamic()
        .where(eq(filingFormDrafts.id, draftId))
        .limit(1);
      
      if (draft.length === 0) {
        return res.status(404).json({ error: "Draft not found" });
      }
      
      if (draft[0].userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Validate the update data
      const updateDraftSchema = z.object({
        formData: z.record(z.any()).optional(),
        draftName: z.string().min(1).optional(),
        formState: z.enum(['in-progress', 'review', 'ready-to-file']).optional(),
        completionPercentage: z.number().min(0).max(100).optional(),
      });
      
      const validatedData = updateDraftSchema.parse(req.body);
      
      // Calculate completion percentage if form data is being updated
      let completionPercentage = validatedData.completionPercentage;
      
      if (validatedData.formData && !completionPercentage) {
        // Fetch form fields to calculate completion
        const template = await db.select()
          .from(filingFormTemplates).$dynamic()
          .where(eq(filingFormTemplates.id, draft[0].formTemplateId))
          .limit(1);
        
        const formNumber = template[0].formNumber;
        const fields = mockFormFields[formNumber as keyof typeof mockFormFields] || [];
        const requiredFields = fields.filter(f => f.required);
        
        if (requiredFields.length > 0) {
          const filledRequiredFields = requiredFields.filter(field => 
            validatedData.formData && 
            validatedData.formData[field.id] && 
            validatedData.formData[field.id] !== ''
          );
          
          completionPercentage = Math.round((filledRequiredFields.length / requiredFields.length) * 100);
        }
      }
      
      // Update the draft
      const [updatedDraft] = await db.update(filingFormDrafts)
        .set({
          ...validatedData,
          completionPercentage: completionPercentage ?? draft[0].completionPercentage,
          updatedAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString()
        })
        .where(eq(filingFormDrafts.id, draftId))
        .returning();
      
      res.json(updatedDraft);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      
      console.error("Error updating form draft:", error);
      res.status(500).json({ error: "Failed to update form draft" });
    }
  });
  
  // Delete a form draft
  app.delete("/api/filing-forms/drafts/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const draftId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Check if the draft exists and belongs to the user
      const draft = await db.select()
        .from(filingFormDrafts).$dynamic()
        .where(eq(filingFormDrafts.id, draftId))
        .limit(1);
      
      if (draft.length === 0) {
        return res.status(404).json({ error: "Draft not found" });
      }
      
      if (draft[0].userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Delete the draft
      await db.delete(filingFormDrafts)
        .where(eq(filingFormDrafts.id, draftId));
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting form draft:", error);
      res.status(500).json({ error: "Failed to delete form draft" });
    }
  });
  
  // Generate a PDF from a draft
  app.post("/api/filing-forms/drafts/:id/pdf", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const draftId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Check if the draft exists and belongs to the user
      const draft = await db.select()
        .from(filingFormDrafts).$dynamic()
        .where(eq(filingFormDrafts.id, draftId))
        .limit(1);
      
      if (draft.length === 0) {
        return res.status(404).json({ error: "Draft not found" });
      }
      
      if (draft[0].userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Get the form template
      const template = await db.select()
        .from(filingFormTemplates).$dynamic()
        .where(eq(filingFormTemplates.id, draft[0].formTemplateId))
        .limit(1);
      
      if (template.length === 0) {
        return res.status(404).json({ error: "Form template not found" });
      }
      
      // In a real implementation, this would generate a PDF using the template and form data
      // For now, we'll simulate PDF generation with a delay
      
      // Create a PDF filename
      const pdfDir = path.join(process.cwd(), 'public', 'generated-forms');
      
      // Ensure the directory exists
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }
      
      const pdfFilename = `${template[0].formNumber}-${draftId}-${uuidv4()}.pdf`;
      const pdfPath = path.join(pdfDir, pdfFilename);
      const pdfUrl = `/generated-forms/${pdfFilename}`;
      
      // In a real implementation, we would generate the PDF here
      // For now, just copy the template PDF as a placeholder
      try {
        // Simulate PDF generation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update the draft with the generated PDF URL
        await db.update(filingFormDrafts)
          .set({
            generatedPdfUrl: pdfUrl,
            formState: 'ready-to-file',
            updatedAt: new Date().toISOString()
          })
          .where(eq(filingFormDrafts.id, draftId));
        
        res.json({ pdfUrl });
      } catch (error: any) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });
  
  // Upload a form for processing
  app.post("/api/filing-forms/upload", isAuthenticated, upload.single('file'), async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // In a real implementation, this would analyze the PDF to detect the form type
      // and extract data from it
      
      // For demonstration, we'll simulate form detection with the CTA form
      const detectedForm = {
        formTemplateId: 1, // CTA form
        extractedData: {
          candidate_name: "John Doe",
          candidate_address: "123 Main St, Austin, TX 78701",
          candidate_phone: "(512) 555-1234",
          treasurer_name: "Jane Smith",
          office_sought: "City Council"
        }
      };
      
      // Wait to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      res.json(detectedForm);
    } catch (error: any) {
      console.error("Error uploading form:", error);
      res.status(500).json({ error: "Failed to process uploaded form" });
    }
  });
  
  // AI assistant endpoint
  app.post("/api/filing-forms/ai-assistant", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Validate the input
      const assistantSchema = z.object({
        message: z.string().min(1),
        formTemplateId: z.number().optional(),
        draftId: z.number().optional(),
        history: z.array(z.object({
          role: z.enum(['user', 'assistant', 'system']),
          content: z.string(),
          timestamp: z.string()
        })).optional()
      });
      
      const { message, formTemplateId, draftId, history = [] } = assistantSchema.parse(req.body);
      
      // Create a new AI assistant session entry
      if (draftId) {
        await db.insert(aiFilingAssistantSessions)
          .values({
            userId,
            formDraftId: draftId,
            formTemplateId,
            sessionStart: new Date().toISOString(),
            conversationHistory: [...history, { role: 'user', content: message, timestamp: new Date().toISOString() }],
            sessionStatus: 'active',
            aiModel: 'gpt-4-1106-preview'
          })
          .onConflictDoUpdate({
            target: [aiFilingAssistantSessions.userId, aiFilingAssistantSessions.formDraftId],
            set: {
              conversationHistory: [...history, { role: 'user', content: message, timestamp: new Date().toISOString() }],
              updatedAt: new Date().toISOString()
            }
          });
      }
      
      // In a production implementation, this would call an LLM like OpenAI
      // For now, simulate AI responses based on the message content
      let aiResponse: any = {};
      let fieldUpdates = null;
      
      // Simple response patterns
      if (message.toLowerCase().includes('purpose')) {
        aiResponse = {
          role: 'assistant',
          content: "The purpose of this form is to appoint a campaign treasurer, which is required before a candidate can accept campaign contributions or make campaign expenditures. This is typically one of the first forms you'll need to file when running for office in Texas.",
          timestamp: new Date().toISOString()
        };
      } else if (message.toLowerCase().includes('step-by-step') || message.toLowerCase().includes('guide')) {
        aiResponse = {
          role: 'assistant',
          content: "I'll guide you through completing this form step-by-step:\n\n1. First, fill out the Candidate Information section with your full legal name, mailing address, and contact details.\n\n2. Next, complete the Campaign Treasurer section with their full name, address, and phone number.\n\n3. If you currently hold office, indicate that in the Office Held section.\n\n4. For Office Sought, specify the position you're running for.\n\n5. Finally, confirm the form with your signature and date.\n\nWould you like me to help you with a specific section first?",
          timestamp: new Date().toISOString()
        };
      } else if (message.toLowerCase().includes('candidate information') || message.toLowerCase().includes('candidate section')) {
        aiResponse = {
          role: 'assistant',
          content: "For the Candidate Information section, provide your full legal name as it will appear on the ballot. Make sure your mailing address is complete with city, state, and zip code. While email is optional, it's recommended to provide it for faster communication from the Ethics Commission. Would you like me to fill in some candidate information for you?",
          timestamp: new Date().toISOString()
        };
        
        // Simulate an AI suggestion to update form fields
        fieldUpdates = {
          candidate_email: "john.doe@email.com",
          candidate_phone: "(512) 555-1234"
        };
      } else {
        aiResponse = {
          role: 'assistant',
          content: "I'm here to help you complete your Texas Ethics Commission form. You can ask me about specific sections, filing requirements, or how to answer particular questions. What would you like to know more about?",
          timestamp: new Date().toISOString()
        };
      }
      
      // Update the session with the AI response if a draft is being edited
      if (draftId) {
        await db.update(aiFilingAssistantSessions)
          .set({
            conversationHistory: [...history, 
              { role: 'user', content: message, timestamp: new Date().toISOString() },
              aiResponse
            ],
            formFieldsModified: fieldUpdates ? [
              {
                field: Object.keys(fieldUpdates)[0],
                originalValue: null,
                newValue: Object.values(fieldUpdates)[0],
                timestamp: new Date().toISOString()
              }
            ] : undefined,
            updatedAt: new Date().toISOString()
          })
          .where(and(eq(aiFilingAssistantSessions.userId, userId), eq(aiFilingAssistantSessions.formDraftId, draftId)));
        
        // Mark the draft as AI-assisted
        await db.update(filingFormDrafts)
          .set({
            aiAssisted: true,
            updatedAt: new Date().toISOString()
          })
          .where(eq(filingFormDrafts.id, draftId));
      }
      
      res.json({
        message: aiResponse,
        fieldUpdates
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      
      console.error("Error with AI assistant:", error);
      res.status(500).json({ error: "Failed to process AI request" });
    }
  });
}