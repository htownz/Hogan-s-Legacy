import { Express, Request, Response } from "express";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import { multimodalService } from "./services/multimodal-service";
import multer from "multer";
import fs from "fs";
import { z } from "zod";
import path from "path";

// Setup multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = "./uploads";
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extname = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + extname);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Helper function to convert file to base64
const fileToBase64 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data.toString("base64"));
    });
  });
};

// Cleanup helper to remove temporary files
const cleanupFiles = (files: Express.Multer.File[]) => {
  files.forEach((file) => {
    fs.unlink(file.path, (err) => {
      if (err) console.error(`Failed to delete temp file ${file.path}:`, err);
    });
  });
};

/**
 * Register multimodal assistant API routes
 */
export function registerMultimodalAssistantRoutes(app: Express): void {
  /**
   * Analyze an image using AI
   */
  app.post(
    "/api/ai/analyze-image",
    isAuthenticated,
    upload.single("image"),
    async (req: CustomRequest, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No image file provided" });
        }

        // Convert file to base64
        const base64Image = await fileToBase64(req.file.path);
        
        // Extract custom prompt if provided
        const prompt = req.body.prompt;

        // Analyze the image
        const analysis = await multimodalService.analyzeImage(base64Image, prompt);

        // Clean up the temporary file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error(`Failed to delete temp file ${req.file!.path}:`, err);
        });

        res.status(200).json(analysis);
      } catch (error: any) {
        console.error("Error analyzing image:", error);
        
        // Clean up temp file if it exists
        if (req.file) {
          fs.unlink(req.file.path, () => {});
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: "Failed to analyze image", error: errorMessage });
      }
    }
  );

  /**
   * Generate an image using DALL-E
   */
  app.post("/api/ai/generate-image", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { prompt, size, quality, style } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Validate size if provided
      if (size && !["1024x1024", "1792x1024", "1024x1792"].includes(size)) {
        return res.status(400).json({ 
          message: "Invalid size parameter. Must be one of: 1024x1024, 1792x1024, 1024x1792" 
        });
      }

      // Validate quality if provided
      if (quality && !["standard", "hd"].includes(quality)) {
        return res.status(400).json({ 
          message: "Invalid quality parameter. Must be one of: standard, hd" 
        });
      }

      // Validate style if provided
      if (style && !["vivid", "natural"].includes(style)) {
        return res.status(400).json({ 
          message: "Invalid style parameter. Must be one of: vivid, natural" 
        });
      }

      const result = await multimodalService.generateImage(prompt, {
        size: size as any,
        quality: quality as any,
        style: style as any,
      });

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error generating image:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ message: "Failed to generate image", error: errorMessage });
    }
  });

  /**
   * Analyze sentiment in text
   */
  app.post("/api/ai/analyze-sentiment", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const analysis = await multimodalService.analyzeSentiment(text);
      res.status(200).json(analysis);
    } catch (error: any) {
      console.error("Error analyzing sentiment:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ message: "Failed to analyze sentiment", error: errorMessage });
    }
  });

  /**
   * Extract information from a document
   */
  app.post(
    "/api/ai/extract-document-info",
    isAuthenticated,
    upload.single("document"),
    async (req: CustomRequest, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No document file provided" });
        }

        // Convert file to base64
        const base64Document = await fileToBase64(req.file.path);
        
        // Get extraction type from query params with default
        const extractionType = (req.query.type as string) || "all";
        
        if (!["all", "key_points", "structured_data"].includes(extractionType)) {
          return res.status(400).json({ 
            message: "Invalid extraction type. Must be one of: all, key_points, structured_data" 
          });
        }

        // Extract information from the document
        const extractionResult = await multimodalService.extractDocumentInformation(
          base64Document, 
          extractionType as any
        );

        // Clean up the temporary file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error(`Failed to delete temp file ${req.file!.path}:`, err);
        });

        res.status(200).json(extractionResult);
      } catch (error: any) {
        console.error("Error extracting document information:", error);
        
        // Clean up temp file if it exists
        if (req.file) {
          fs.unlink(req.file.path, () => {});
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ 
          message: "Failed to extract document information", 
          error: errorMessage 
        });
      }
    }
  );

  /**
   * Compare multiple images or documents
   */
  app.post(
    "/api/ai/compare-items",
    isAuthenticated,
    upload.array("items", 5), // Allow up to 5 files
    async (req: CustomRequest, res: Response) => {
      try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length < 2) {
          return res.status(400).json({ 
            message: "At least 2 files are required for comparison" 
          });
        }

        // Convert all files to base64
        const base64Items: string[] = [];
        for (const file of files) {
          const base64Data = await fileToBase64(file.path);
          base64Items.push(base64Data);
        }
        
        // Get prompt from request body
        const prompt = req.body.prompt || "Compare and contrast these items";

        // Compare the items
        const comparisonResult = await multimodalService.compareItems(base64Items, prompt);

        // Clean up the temporary files
        cleanupFiles(files);

        res.status(200).json(comparisonResult);
      } catch (error: any) {
        console.error("Error comparing items:", error);
        
        // Clean up temp files if they exist
        if (req.files) {
          cleanupFiles(req.files as Express.Multer.File[]);
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ 
          message: "Failed to compare items", 
          error: errorMessage 
        });
      }
    }
  );

  /**
   * Transcribe audio to text
   */
  app.post(
    "/api/ai/transcribe",
    isAuthenticated,
    upload.single("audio"),
    async (req: CustomRequest, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No audio file provided" });
        }

        // Read the file into a blob
        const fileBuffer = fs.readFileSync(req.file.path);
        const audioBlob = new Blob([fileBuffer], { type: req.file.mimetype });
        
        // Extract options from request body
        const options = {
          language: req.body.language,
          prompt: req.body.prompt
        };

        // Transcribe the audio
        const transcription = await multimodalService.transcribeAudio(audioBlob, options);

        // Clean up the temporary file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error(`Failed to delete temp file ${req.file!.path}:`, err);
        });

        res.status(200).json(transcription);
      } catch (error: any) {
        console.error("Error transcribing audio:", error);
        
        // Clean up temp file if it exists
        if (req.file) {
          fs.unlink(req.file.path, () => {});
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ 
          message: "Failed to transcribe audio", 
          error: errorMessage 
        });
      }
    }
  );

  /**
   * Check OpenAI API status
   */
  app.get("/api/ai/status", async (_req: Request, res: Response) => {
    try {
      // Simple test to check if OpenAI API is accessible
      const response = await multimodalService.analyzeSentiment("This is a test message to check API status.");
      
      res.status(200).json({ 
        status: "operational",
        apiConnected: true,
        features: {
          imageAnalysis: true,
          imageGeneration: true,
          sentimentAnalysis: true,
          documentExtraction: true,
          comparison: true,
          transcription: true
        }
      });
    } catch (error: any) {
      console.error("OpenAI API status check failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'API connection failed';
      res.status(200).json({ 
        status: "degraded",
        apiConnected: false,
        error: errorMessage,
        recommendation: "Check your OpenAI API key configuration"
      });
    }
  });
}