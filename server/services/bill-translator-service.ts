import OpenAI from 'openai';
import { legiscanService } from './legiscan-service';
import { createLogger } from "../logger";
const log = createLogger("bill-translator-service");


// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

/**
 * Simplifies complex legislative text for non-technical users
 * @param text The legislative text to simplify
 * @param readabilityLevel The target reading level ('elementary', 'middle_school', 'high_school', 'college', 'general')
 * @param format The output format ('plain', 'bullet_points', 'sections', 'conversational')
 */
export async function simplifyLegislativeText(
  text: string,
  readabilityLevel: 'elementary' | 'middle_school' | 'high_school' | 'college' | 'general' = 'general',
  format: 'plain' | 'bullet_points' | 'sections' | 'conversational' = 'plain'
): Promise<any> {
  try {
    // Prepare system prompt based on readability level
    let systemPrompt = 'You are an expert at translating complex legislative language into ';
    
    switch (readabilityLevel) {
      case 'elementary':
        systemPrompt += 'extremely simple language suitable for elementary school students (grades 1-5). Use short sentences, basic vocabulary, and concrete examples.';
        break;
      case 'middle_school':
        systemPrompt += 'clear language suitable for middle school students (grades 6-8). Use straightforward explanations, simple terms, and relatable examples.';
        break;
      case 'high_school':
        systemPrompt += 'accessible language suitable for high school students (grades 9-12). Balance clarity with some complexity, introducing a few domain-specific terms with explanations.';
        break;
      case 'college':
        systemPrompt += 'moderately sophisticated language suitable for college-educated adults. Use precise language and maintain some technical accuracy while improving accessibility.';
        break;
      case 'general':
      default:
        systemPrompt += 'clear, everyday language that any adult can understand regardless of education level. Focus on clarity and accessibility without oversimplification.';
        break;
    }
    
    // Add format-specific instructions
    switch (format) {
      case 'bullet_points':
        systemPrompt += ' Present your translation as a series of bullet points highlighting the key points.';
        break;
      case 'sections':
        systemPrompt += ' Break down your translation into sections with clear headings that follow the structure of the original text.';
        break;
      case 'conversational':
        systemPrompt += ' Present your translation in a conversational tone, as if explaining to someone in person.';
        break;
      case 'plain':
      default:
        systemPrompt += ' Present your translation as a continuous plain text explanation.';
        break;
    }
    
    // Add general instructions
    systemPrompt += ' Always maintain factual accuracy. If there are particularly important legal concepts, briefly explain them in parentheses. Do not add information not present in the original text.';
    
    // Use function calling for structured response
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is the legislative text to translate:\n\n${text}` }
      ],
      functions: [
        {
          name: 'presentTranslatedBill',
          description: 'Present the translated bill text in a structured format',
          parameters: {
            type: 'object',
            properties: {
              simplifiedText: {
                type: 'string',
                description: 'The simplified version of the bill text'
              },
              keyTerms: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    term: {
                      type: 'string',
                      description: 'A key technical term from the bill'
                    },
                    explanation: {
                      type: 'string',
                      description: 'Simple explanation of the term'
                    }
                  }
                },
                description: 'Important terms and their explanations'
              },
              mainImpacts: {
                type: 'array',
                items: { type: 'string' },
                description: 'The main impacts or changes this bill would create'
              },
              readabilityStats: {
                type: 'object',
                properties: {
                  originalComplexity: {
                    type: 'string',
                    enum: ['very_high', 'high', 'medium', 'low'],
                    description: 'Estimated complexity level of the original text'
                  },
                  technicalTermCount: {
                    type: 'number',
                    description: 'Approximate number of technical/legal terms identified'
                  }
                },
                description: 'Statistics about the text complexity'
              }
            },
            required: ['simplifiedText']
          }
        }
      ],
      function_call: { name: 'presentTranslatedBill' }
    });
    
    // Parse and return the function call results
    if (response.choices[0].message.function_call) {
      const functionCall = response.choices[0].message.function_call;
      const translationResult = JSON.parse(functionCall.arguments);
      
      return {
        success: true,
        data: {
          ...translationResult,
          model: 'gpt-4o',
          readabilityLevel,
          format
        }
      };
    } else {
      // Fallback if function calling fails
      return {
        success: true,
        data: {
          simplifiedText: response.choices[0].message.content,
          model: 'gpt-4o',
          readabilityLevel,
          format
        }
      };
    }
  } catch (error: any) {
    log.error({ err: error }, 'Error in bill translator service');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Translates a legislative bill by its ID
 * @param billId The LegiScan bill ID
 * @param readabilityLevel The target reading level
 * @param format The output format
 */
export async function translateBillById(
  billId: number,
  readabilityLevel: 'elementary' | 'middle_school' | 'high_school' | 'college' | 'general' = 'general',
  format: 'plain' | 'bullet_points' | 'sections' | 'conversational' = 'plain'
): Promise<any> {
  try {
    // Get bill details from LegiScan
    const billDetails = await legiscanService.getBill(billId);
    if (!billDetails) {
      return {
        success: false,
        error: `Bill ID ${billId} not found`
      };
    }
    
    // Extract text to translate
    let textToTranslate = '';
    
    // Use bill text if available
    if (billDetails.texts && billDetails.texts.length > 0) {
      // Try to get the latest version of the bill text
      const sortedTexts = [...billDetails.texts].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      // For real implementation, we would need to fetch the actual text content from LegiScan
      // For now, we'll use the description and title as a placeholder
      textToTranslate = `Title: ${billDetails.title}\n\nDescription: ${billDetails.description || 'No description available.'}\n\nNote: This is a placeholder for the actual bill text which would be fetched from LegiScan API.`;
    } else {
      // Fallback to description and title if no bill text is available
      textToTranslate = `Title: ${billDetails.title}\n\nDescription: ${billDetails.description || 'No description available.'}`;
    }
    
    // Translate the bill text
    const translation = await simplifyLegislativeText(textToTranslate, readabilityLevel, format);
    
    // Add bill metadata to the response
    if (translation.success) {
      translation.data.billInfo = {
        billId: billId,
        billNumber: billDetails.bill_number,
        state: billDetails.state,
        title: billDetails.title
      };
    }
    
    return translation;
  } catch (error: any) {
    log.error({ err: error }, 'Error in translateBillById');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Compares original bill text with simplified version
 * @param originalText The original legislative text
 * @param simplifiedText The simplified version of the text
 */
export async function compareBillVersions(originalText: string, simplifiedText: string): Promise<any> {
  try {
    // Use OpenAI to analyze the differences between original and simplified versions
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing legislative language. Compare the original text of a bill with its simplified version and identify:
          1. Whether any important information was lost in simplification
          2. Whether any meaning was changed
          3. The accuracy of the simplified version in conveying the original intent
          4. Areas where the simplified version particularly succeeds or fails`
        },
        {
          role: 'user',
          content: `Original bill text:\n\n${originalText}\n\nSimplified version:\n\n${simplifiedText}`
        }
      ],
      functions: [
        {
          name: 'provideBillComparison',
          description: 'Provide a comparison between original and simplified bill versions',
          parameters: {
            type: 'object',
            properties: {
              contentAccuracy: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'How accurately the simplified version captures the original content'
              },
              meaningPreservation: {
                type: 'string',
                enum: ['fully_preserved', 'mostly_preserved', 'significantly_altered'],
                description: 'How well the meaning is preserved in simplification'
              },
              significantOmissions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Important content from the original that was omitted in the simplified version'
              },
              meaningChanges: {
                type: 'array',
                items: { type: 'string' },
                description: 'Areas where the meaning was changed in the simplified version'
              },
              simplificationSuccesses: {
                type: 'array',
                items: { type: 'string' },
                description: 'Areas where the simplification was particularly effective'
              },
              overallAssessment: {
                type: 'string',
                description: 'Overall assessment of the quality of the simplification'
              }
            },
            required: ['contentAccuracy', 'meaningPreservation', 'overallAssessment']
          }
        }
      ],
      function_call: { name: 'provideBillComparison' }
    });
    
    // Parse and return the function call results
    if (response.choices[0].message.function_call) {
      const functionCall = response.choices[0].message.function_call;
      const comparisonResult = JSON.parse(functionCall.arguments);
      
      return {
        success: true,
        data: comparisonResult
      };
    } else {
      // Fallback if function calling fails
      return {
        success: true,
        data: {
          overallAssessment: response.choices[0].message.content,
          contentAccuracy: 'medium',
          meaningPreservation: 'mostly_preserved'
        }
      };
    }
  } catch (error: any) {
    log.error({ err: error }, 'Error in bill version comparison');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}