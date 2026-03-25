// @ts-nocheck
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Basic text analysis example
export async function summarizeText(text: string): Promise<string> {
  const prompt = `Please summarize the following text concisely while maintaining key points:\n\n${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content || '';
}

export async function analyzeSentiment(text: string): Promise<{
  rating: number,
  confidence: number
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a sentiment analysis expert. Analyze the sentiment of the text and provide a rating from 1 to 5 stars and a confidence score between 0 and 1. Respond with JSON in this format: { 'rating': number, 'confidence': number }",
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
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to analyze sentiment: ${errorMessage}`);
  }
}

// Image analysis example
export async function analyzeImage(base64Image: string, prompt?: string): Promise<string> {
  try {
    const defaultPrompt = "Analyze this image in detail and describe its key elements, context, and any notable aspects.";
    
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
      max_tokens: 500,
    });

    return visionResponse.choices[0].message.content || '';
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to analyze image: ${errorMessage}`);
  }
}

// Image generation example
export async function generateImage(text: string, options?: {
  size?: "1024x1024" | "1792x1024" | "1024x1792",
  quality?: "standard" | "hd",
  style?: "vivid" | "natural"
}): Promise<{ url: string, revisedPrompt?: string }> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: text,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to generate image: ${errorMessage}`);
  }
}

// Export the OpenAI instance for direct use
export default openai;