// @ts-nocheck
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import axios from 'axios';
import { createLogger } from "../logger";
const log = createLogger("multimodal-analysis-service");


// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

// Local path for storing temporary image files
const TEMP_DIR = path.join(process.cwd(), 'temp', 'multimodal');

// Define the type of media that can be analyzed
export type MediaType = 'image' | 'pdf' | 'presentation' | 'chart' | 'graph';

// Ensure temporary directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Analyze an image to extract legislative information
 * @param imageData Base64-encoded image data or URL to image
 * @param context Optional context about the image (e.g., bill number, committee name)
 * @param analysisType Type of analysis to perform
 */
export async function analyzeImage(
  imageData: string,
  context: Record<string, any> = {},
  analysisType: 'general' | 'detailed' | 'chart' | 'testimony' = 'general'
) {
  try {
    let imageContent;
    let tempFilePath = '';
    
    // Handle URL vs base64 data
    if (imageData.startsWith('http')) {
      // It's a URL, download the image
      const response = await axios.get(imageData, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      
      // Create a temporary file
      const hash = createHash('md5').update(imageData).digest('hex');
      tempFilePath = path.join(TEMP_DIR, `${hash}.jpg`);
      fs.writeFileSync(tempFilePath, buffer);
      
      // Convert to base64 for OpenAI
      imageContent = {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${buffer.toString('base64')}`
        }
      };
    } else if (imageData.startsWith('data:image')) {
      // It's already a data URL
      imageContent = {
        type: 'image_url',
        image_url: {
          url: imageData
        }
      };
    } else {
      // Assume it's base64 data without the prefix
      imageContent = {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageData}`
        }
      };
    }
    
    // Construct system prompt based on analysis type
    let systemPrompt = '';
    
    switch (analysisType) {
      case 'detailed':
        systemPrompt = `You are an expert legislative analyst specializing in Texas legislation. 
        Analyze this image from a legislative context and provide a detailed analysis including:
        1. Identify any bill numbers, committee names, or legislative references
        2. Summarize any key policy points presented
        3. Note any data, statistics or projections shown
        4. Identify speakers or presenters if visible
        5. Extract any voting information, fiscal notes, or impact assessments
        
        Return your analysis in a structured format with sections for each of the above categories.`;
        break;
        
      case 'chart':
        systemPrompt = `You are an expert data analyst specializing in legislative and policy data visualization.
        Analyze this chart or graph in detail and provide:
        1. The type of chart/graph (e.g., bar chart, line graph, pie chart)
        2. The primary metrics being displayed
        3. Key trends or patterns visible in the data
        4. Notable outliers or anomalies
        5. The main conclusion or insight the chart is conveying
        6. Any caveats or limitations in how the data is presented
        
        Be specific and quantitative where possible, mentioning actual values, percentages, or ranges shown.`;
        break;
        
      case 'testimony':
        systemPrompt = `You are an expert in legislative proceedings and testimonies.
        Analyze this image from a legislative testimony or hearing and provide:
        1. Identity of the person(s) testifying (if visible)
        2. The committee or body they are addressing (if identifiable)
        3. Key points of their testimony visible in any slides or materials
        4. Stance on legislation (supportive, opposed, neutral, offering amendments)
        5. Any explicit requests or recommendations they are making
        
        Focus particularly on concrete policy positions and specific requests or recommendations.`;
        break;
        
      case 'general':
      default:
        systemPrompt = `You are an expert legislative analyst. 
        Analyze this image from a legislative context and extract key information about any bills, 
        policies, proceedings, data, or other relevant legislative content visible. 
        Provide a concise summary of what this image shows and its significance in the legislative process.`;
    }
    
    // Add context to system prompt if provided
    if (Object.keys(context).length > 0) {
      systemPrompt += `\n\nAdditional context:\n`;
      for (const [key, value] of Object.entries(context)) {
        systemPrompt += `- ${key}: ${value}\n`;
      }
    }
    
    // Call OpenAI API for image analysis with function calling
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this image from a legislative context:'
            },
            imageContent
          ]
        }
      ],
      functions: [
        {
          name: 'extractLegislativeContent',
          description: 'Extract legislative content from visual material',
          parameters: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description: 'A concise summary of the image content and its legislative significance'
              },
              billReferences: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    billNumber: {
                      type: 'string',
                      description: 'Bill number (e.g., HB 1101, SB 42)'
                    },
                    context: {
                      type: 'string',
                      description: 'How the bill is referenced in the image'
                    }
                  }
                },
                description: 'Any bill numbers referenced in the image'
              },
              committeeReferences: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Names of committees referenced in the image'
              },
              dataPoints: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    metric: {
                      type: 'string',
                      description: 'The type of metric or data being presented'
                    },
                    value: {
                      type: 'string',
                      description: 'The value or finding'
                    },
                    context: {
                      type: 'string',
                      description: 'Contextual information about this data point'
                    }
                  }
                },
                description: 'Key statistics, data points, or metrics shown in the image'
              },
              speakers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Name of the speaker if identifiable'
                    },
                    role: {
                      type: 'string',
                      description: 'Role or title of the speaker'
                    }
                  }
                },
                description: 'People speaking or presenting in the image'
              },
              visualType: {
                type: 'string',
                enum: ['presentation', 'chart', 'graph', 'document', 'photograph', 'screenshot', 'other'],
                description: 'The type of visual content in the image'
              },
              confidence: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'Confidence level in the accuracy of the analysis'
              }
            },
            required: ['summary', 'confidence', 'visualType']
          }
        }
      ],
      function_call: { name: 'extractLegislativeContent' }
    });
    
    // Clean up temporary file if it was created
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    // Parse function call response
    if (response.choices[0].message.function_call) {
      const functionCall = response.choices[0].message.function_call;
      const analysisResult = JSON.parse(functionCall.arguments);
      
      return {
        success: true,
        data: analysisResult,
        model: 'gpt-4o'
      };
    } else {
      // Fallback to getting the text response
      return {
        success: true,
        data: {
          summary: response.choices[0].message.content,
          confidence: 'medium',
          visualType: 'unknown'
        },
        model: 'gpt-4o'
      };
    }
  } catch (error: any) {
    log.error({ err: error }, 'Error analyzing image');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      model: 'gpt-4o'
    };
  }
}

/**
 * Analyze a chart or graph to extract data points and insights
 * @param imageData Base64-encoded image data or URL to image
 * @param context Additional context about the chart
 */
export async function analyzeChart(
  imageData: string,
  context: Record<string, any> = {}
) {
  return analyzeImage(imageData, context, 'chart');
}

/**
 * Analyze legislative testimony from visual content
 * @param imageData Base64-encoded image data or URL to image
 * @param context Additional context about the testimony
 */
export async function analyzeTestimony(
  imageData: string,
  context: Record<string, any> = {}
) {
  return analyzeImage(imageData, context, 'testimony');
}

/**
 * Process a PDF document to extract images and analyze each page
 * @param pdfBuffer Buffer containing the PDF file
 * @param context Additional context about the document
 */
export async function analyzePdfDocument(
  pdfBuffer: Buffer,
  context: Record<string, any> = {}
): Promise<any> {
  try {
    // For PDF processing, we'd need additional libraries like pdf-lib or pdf.js
    // This is a placeholder for the implementation
    return {
      success: false,
      error: 'PDF analysis not yet implemented',
      model: 'none'
    };
  } catch (error: any) {
    log.error({ err: error }, 'Error analyzing PDF');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      model: 'none'
    };
  }
}

/**
 * Extract text from an image using OCR capabilities
 * @param imageData Base64-encoded image data or URL to image
 */
export async function extractTextFromImage(imageData: string): Promise<string> {
  try {
    let imageContent;
    
    // Prepare image content the same way as in analyzeImage
    if (imageData.startsWith('http')) {
      const response = await axios.get(imageData, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      imageContent = {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${buffer.toString('base64')}`
        }
      };
    } else if (imageData.startsWith('data:image')) {
      imageContent = {
        type: 'image_url',
        image_url: {
          url: imageData
        }
      };
    } else {
      imageContent = {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageData}`
        }
      };
    }
    
    // Use OpenAI's vision capabilities for OCR
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an OCR system. Extract all visible text from the image, preserving formatting as much as possible. Include only the text visible in the image, with no additional commentary or analysis.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image:'
            },
            imageContent
          ]
        }
      ],
    });
    
    return response.choices[0].message.content || '';
  } catch (error: any) {
    log.error({ err: error }, 'Error extracting text from image');
    throw error;
  }
}

/**
 * Analyze a video frame by frame to extract legislative information
 * @param videoPath Path to the video file
 * @param context Additional context about the video
 * @param frameInterval Interval between frames to analyze (in seconds)
 */
export async function analyzeVideo(
  videoPath: string,
  context: Record<string, any> = {},
  frameInterval: number = 30
): Promise<any> {
  try {
    // For video processing, we'd need additional libraries like ffmpeg
    // This is a placeholder for the implementation
    return {
      success: false,
      error: 'Video analysis not yet implemented',
      model: 'none'
    };
  } catch (error: any) {
    log.error({ err: error }, 'Error analyzing video');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      model: 'none'
    };
  }
}

/**
 * Generate a visual explanation of legislative concepts
 * @param conceptDescription Description of the concept to visualize
 * @param visualType Type of visualization to generate
 */
export async function generateVisualExplanation(
  conceptDescription: string,
  visualType: 'flowchart' | 'diagram' | 'infographic' = 'diagram'
): Promise<any> {
  try {
    // Generate a visual explanation using text-to-image models
    // This would require integration with DALL-E or similar
    return {
      success: false,
      error: 'Visual explanation generation not yet implemented',
      model: 'none'
    };
  } catch (error: any) {
    log.error({ err: error }, 'Error generating visual explanation');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      model: 'none'
    };
  }
}