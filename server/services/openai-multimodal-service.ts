// @ts-nocheck
import OpenAI from "openai";
import { createLogger } from "../logger";
const log = createLogger("openai-multimodal-service");


// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

/**
 * Service for handling OpenAI multimodal interactions
 */
export class OpenAIMultimodalService {
  /**
   * Analyze sentiment of text using multimodal capabilities
   * @param text The text to analyze
   * @returns Sentiment analysis with rating and confidence score
   */
  async analyzeSentiment(text: string): Promise<{
    rating: number,
    confidence: number,
    explanation: string
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a sentiment analysis expert. Analyze the sentiment of the text and provide a rating from 1 to 5 stars and a confidence score between 0 and 1. Also provide a brief explanation. Respond with JSON in this format: { 'rating': number, 'confidence': number, 'explanation': string }",
          },
          {
            role: "user",
            content: text,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content || "{}";
      const result = JSON.parse(content);

      return {
        rating: Math.max(1, Math.min(5, Math.round(result.rating))),
        confidence: Math.max(0, Math.min(1, result.confidence)),
        explanation: result.explanation || "No explanation provided"
      };
    } catch (error: any) {
      log.error({ err: error }, "Error in sentiment analysis");
      throw new Error(`Failed to analyze sentiment: ${error.message}`);
    }
  }

  /**
   * Analyze an image (from base64 string)
   * @param base64Image Base64-encoded image data
   * @param prompt Custom prompt for analysis (optional)
   * @returns Analysis results
   */
  async analyzeImage(base64Image: string, prompt: string = "Analyze this image in detail and describe its key elements, context, and any notable aspects."): Promise<string> {
    try {
      const visionResponse = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ],
          },
        ],
        max_tokens: 800,
      });

      return visionResponse.choices[0].message.content || "No analysis generated";
    } catch (error: any) {
      log.error({ err: error }, "Error in image analysis");
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  /**
   * Generate an image using DALL-E
   * @param prompt Text prompt for image generation
   * @returns URL of the generated image
   */
  async generateImage(prompt: string): Promise<{ url: string }> {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return { url: response.data[0].url || "" };
    } catch (error: any) {
      log.error({ err: error }, "Error in image generation");
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  /**
   * Enhanced version: Analyze document content with multimodal capabilities
   * @param textContent Text content to analyze
   * @param context Additional context about the document (optional)
   * @returns Detailed analysis with multiple dimensions
   */
  async analyzeDocumentContent(textContent: string, context?: string): Promise<{
    keyThemes: string[];
    summary: string;
    sentiment: { rating: number; description: string };
    suggestedActions: string[];
  }> {
    try {
      const prompt = `
      Please analyze the following ${context || "document"} content:
      
      ${textContent}
      
      Provide a comprehensive analysis with:
      1. Key themes (list of 3-5 main topics)
      2. Summary (concise 2-3 sentences)
      3. Sentiment (rating from 1-5 and brief description)
      4. Suggested actions (2-3 concrete next steps)
      
      Format your response as a JSON object with the following structure:
      {
        "keyThemes": ["theme1", "theme2", ...],
        "summary": "concise summary here",
        "sentiment": { "rating": number, "description": "brief description" },
        "suggestedActions": ["action1", "action2", ...]
      }
      `;

      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content || "{}";
      return JSON.parse(content);
    } catch (error: any) {
      log.error({ err: error }, "Error in document content analysis");
      throw new Error(`Failed to analyze document content: ${error.message}`);
    }
  }

  /**
   * Analyze political bias in text
   * @param text Text to analyze for political bias
   * @returns Analysis of political bias with score and explanation
   */
  async analyzePoliticalBias(text: string): Promise<{
    biasScore: number; // -5 (extremely left) to 5 (extremely right), 0 is neutral
    biasLevel: string; // Descriptive level (e.g., "Strongly Left", "Moderate Right")
    explanation: string; // Reasoning behind the bias assessment
    perspectivesOmitted: string[]; // Perspectives that might be missing
  }> {
    try {
      const prompt = `
      Please analyze the following text for political bias:
      
      "${text}"
      
      Provide a non-partisan, objective analysis with:
      1. A bias score from -5 (extremely left-leaning) to 5 (extremely right-leaning), with 0 being neutral
      2. A descriptive bias level (e.g., "Strongly Left", "Slightly Right", "Neutral")
      3. An explanation of your reasoning with specific examples from the text
      4. A list of perspectives that might be omitted or underrepresented
      
      Format your response as a JSON object with the following structure:
      {
        "biasScore": number,
        "biasLevel": "string",
        "explanation": "string",
        "perspectivesOmitted": ["string", "string", ...]
      }
      `;

      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content || "{}";
      return JSON.parse(content);
    } catch (error: any) {
      log.error({ err: error }, "Error in political bias analysis");
      throw new Error(`Failed to analyze political bias: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const openAIMultimodalService = new OpenAIMultimodalService();