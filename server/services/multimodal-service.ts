// @ts-nocheck
import openai from './openai';
import { createLogger } from "../logger";
const log = createLogger("multimodal-service");


/**
 * Service for analyzing images, generating images, and multimodal interactions
 */
export class MultimodalService {
  /**
   * Analyze an image using GPT-4o Vision capabilities
   * @param base64Image - The base64-encoded image data
   * @param prompt - Optional custom prompt to guide the image analysis
   */
  async analyzeImage(base64Image: string, prompt?: string): Promise<{ 
    analysis: string, 
    tags: string[],
    emotions: string[],
    subjects: string[]
  }> {
    try {
      const defaultPrompt = "Analyze this image in detail and describe its key elements, context, and any notable aspects. Then, list any tags, emotions, and subjects you identify in JSON format.";
      
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt || defaultPrompt
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
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const content = visionResponse.choices[0].message.content;
      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      try {
        // Try to parse as JSON first
        const jsonResponse = JSON.parse(content);
        return {
          analysis: jsonResponse.analysis || jsonResponse.description || content,
          tags: jsonResponse.tags || [],
          emotions: jsonResponse.emotions || [],
          subjects: jsonResponse.subjects || []
        };
      } catch (parseError: any) {
        // If not valid JSON, return the text content as analysis
        log.warn({ detail: parseError }, "Couldn't parse JSON from OpenAI response, using text analysis");
        return {
          analysis: content,
          tags: [],
          emotions: [],
          subjects: []
        };
      }
    } catch (error: any) {
      log.error({ err: error }, "Error analyzing image");
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to analyze image: ${errorMessage}`);
    }
  }

  /**
   * Generate an image using DALL-E 3
   * @param prompt - Description of the image to generate
   * @param options - Additional configuration options
   */
  async generateImage(prompt: string, options?: {
    size?: "1024x1024" | "1792x1024" | "1024x1792",
    quality?: "standard" | "hd",
    style?: "vivid" | "natural"
  }): Promise<{ url: string, revisedPrompt?: string | undefined }> {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: options?.size || "1024x1024",
        quality: options?.quality || "standard",
        style: options?.style || "vivid",
      });

      return { 
        url: response.data[0].url,
        ...(response.data[0].revised_prompt ? { revisedPrompt: response.data[0].revised_prompt } : {})
      } as { url: string, revisedPrompt?: string };
    } catch (error: any) {
      log.error({ err: error }, "Error generating image");
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate image: ${errorMessage}`);
    }
  }

  /**
   * Perform sentiment analysis on text
   * @param text - The text to analyze
   */
  async analyzeSentiment(text: string): Promise<{
    rating: number,
    confidence: number,
    sentiment: 'positive' | 'negative' | 'neutral',
    emotions: string[],
    keyThemes: string[]
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a sentiment analysis expert. Analyze the sentiment of the text and provide a rating from 1 to 5 stars, a confidence score between 0 and 1, the overall sentiment (positive/negative/neutral), key emotions detected, and main themes. Respond with JSON in this format: { 'rating': number, 'confidence': number, 'sentiment': string, 'emotions': string[], 'keyThemes': string[] }",
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
        sentiment: result.sentiment as 'positive' | 'negative' | 'neutral',
        emotions: result.emotions || [],
        keyThemes: result.keyThemes || []
      };
    } catch (error: any) {
      log.error({ err: error }, "Error analyzing sentiment");
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to analyze sentiment: ${errorMessage}`);
    }
  }

  /**
   * Extract information from a document (PDF, image of text, etc.)
   * @param base64Document - The base64-encoded document
   * @param extractionType - The type of information to extract
   */
  async extractDocumentInformation(base64Document: string, extractionType: 'all' | 'key_points' | 'structured_data'): Promise<{
    extractedText: string,
    keyPoints?: string[],
    structuredData?: Record<string, any>
  }> {
    try {
      let prompt = "Extract and analyze the information in this document.";
      
      if (extractionType === 'key_points') {
        prompt = "Extract the key points from this document as a bulleted list.";
      } else if (extractionType === 'structured_data') {
        prompt = "Extract the structured data from this document (like form fields, tables, etc.) and format as JSON.";
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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
                  url: `data:application/pdf;base64,${base64Document}`
                }
              }
            ],
          },
        ],
        response_format: extractionType === 'structured_data' ? { type: "json_object" } : undefined,
        max_tokens: 4000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      // Default return object
      const result: {
        extractedText: string,
        keyPoints?: string[],
        structuredData?: Record<string, any>
      } = {
        extractedText: content
      };

      // For key points, try to extract bulletined items
      if (extractionType === 'key_points') {
        const points = content.split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
          .map(line => line.replace(/^[-•]\s*/, '').trim());
        
        if (points.length > 0) {
          result.keyPoints = points;
        } else {
          // If no bulleted items found, split by newlines as a fallback
          result.keyPoints = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        }
      }

      // For structured data, try to parse JSON
      if (extractionType === 'structured_data') {
        try {
          result.structuredData = JSON.parse(content);
        } catch (parseError: any) {
          log.warn({ detail: parseError }, "Failed to parse JSON from structured data extraction");
          result.structuredData = { raw: content };
        }
      }

      return result;
    } catch (error: any) {
      log.error({ err: error }, "Error extracting document information");
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to extract document information: ${errorMessage}`);
    }
  }

  /**
   * Compare and contrast multiple images or documents
   * @param base64Items - Array of base64-encoded items to compare
   * @param prompt - Custom prompt for comparison
   */
  async compareItems(base64Items: string[], prompt: string): Promise<{
    comparison: string,
    similarities: string[],
    differences: string[],
    recommendation?: string
  }> {
    try {
      if (base64Items.length < 2) {
        throw new Error("At least 2 items are required for comparison");
      }

      const messages: any[] = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || "Compare and contrast these items. Identify similarities, differences, and provide a recommendation based on your analysis. Format your response as JSON with 'comparison', 'similarities', 'differences', and 'recommendation' fields."
            }
          ],
        }
      ];

      // Add each item as an image to the message
      for (const base64Item of base64Items) {
        messages[0].content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Item}`
          }
        });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      try {
        return JSON.parse(content);
      } catch (parseError: any) {
        log.warn({ detail: parseError }, "Failed to parse JSON from comparison response");
        return {
          comparison: content,
          similarities: [],
          differences: []
        };
      }
    } catch (error: any) {
      log.error({ err: error }, "Error comparing items");
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to compare items: ${errorMessage}`);
    }
  }

  /**
   * Transcribe audio to text (using Whisper)
   * @param audioBlob - Blob containing the audio file
   * @param options - Additional options
   */
  async transcribeAudio(audioBlob: Blob, options?: {
    language?: string,
    prompt?: string
  }): Promise<{
    text: string,
    segments?: Array<{
      start: number,
      end: number,
      text: string
    }>
  }> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.mp3');
      formData.append('model', 'whisper-1');
      
      if (options?.language) {
        formData.append('language', options.language);
      }
      
      if (options?.prompt) {
        formData.append('prompt', options.prompt);
      }

      // We need to manually call the API since the official client doesn't fully support formData with Blobs
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.text,
        segments: data.segments
      };
    } catch (error: any) {
      log.error({ err: error }, "Error transcribing audio");
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to transcribe audio: ${errorMessage}`);
    }
  }
}

// Export a singleton instance
export const multimodalService = new MultimodalService();