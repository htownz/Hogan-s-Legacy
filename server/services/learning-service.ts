import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { Bill } from "@shared/schema";
import { CivicConcept, UserQuizAttempt } from "@shared/schema-learning";
import { storage } from "../storage";
import { createLogger } from "../logger";
const log = createLogger("learning-service");


// Initialize OpenAI API client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Interfaces for learning service
export interface LearningContentRequest {
  query: string;
  userId: number;
  billId?: string;
  userContext?: {
    interests?: string[];
    readingLevel?: string;
    priorKnowledge?: string[];
    learningGoals?: string[];
    [key: string]: any;
  };
}

export interface CivicConceptRequest {
  term: string;
  category?: string;
  complexityLevel?: string;
}

export interface QuizGenerationRequest {
  topic: string;
  difficultyLevel: string;
  numberOfQuestions: number;
  concepts?: string[];
  learningObjectives?: string[];
}

export interface QuizFeedbackRequest {
  userAttempt: UserQuizAttempt;
  questions: any[]; // Quiz questions with correct answers
  userAnswers: any[]; // User's answers
}

/**
 * Generate contextual learning content based on user query and context
 */
export async function generateContextualLearningContent(
  request: LearningContentRequest
): Promise<{
  content: string;
  topics: string[];
  relatedConcepts: string[];
  learningObjectives: string[];
  suggestedResources: string[];
  furtherQuestions: string[];
}> {
  try {
    // Get bill data if billId is provided
    let billData = null;
    if (request.billId) {
      const bill = await storage.getBillById(request.billId);
      if (bill) {
        billData = {
          id: bill.id,
          title: bill.title,
          description: bill.description,
          status: bill.status,
          sponsors: bill.sponsors,
          topics: bill.topics,
        };
      }
    }

    // Prepare the prompt
    const prompt = `
    Generate personalized, contextual learning content to help the user understand civic and legislative concepts.
    
    USER QUERY: "${request.query}"
    
    ${request.userContext ? `USER CONTEXT:
    ${Object.entries(request.userContext)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key.toUpperCase()}: ${value.join(", ")}`;
        }
        return `${key.toUpperCase()}: ${value}`;
      })
      .join("\n")}` : ""}
    
    ${billData ? `RELATED BILL:
    ID: ${billData.id}
    TITLE: ${billData.title}
    DESCRIPTION: ${billData.description}
    STATUS: ${billData.status}
    SPONSORS: ${billData.sponsors.join(", ")}
    TOPICS: ${billData.topics.join(", ")}` : ""}
    
    Please provide the following in a structured JSON response:
    
    1. "content": Detailed, educational content that answers the user's query in a clear, accessible manner. Write in a conversational, second-person style as if speaking directly to the user. Break complex concepts into manageable chunks. If related to a bill, explain how the concepts connect to the legislation. (800-1200 words)
    
    2. "topics": An array of 3-5 key civic or legislative topics covered in the content.
    
    3. "relatedConcepts": An array of 3-7 specific civic or legislative concepts mentioned that the user might want to explore further.
    
    4. "learningObjectives": An array of 3-5 learning objectives that this content helps fulfill.
    
    5. "suggestedResources": An array of 3-5 types of resources the user might consult to learn more (e.g., "Texas House Rules manual", "Introduction to Parliamentary Procedure", etc.)
    
    6. "furtherQuestions": An array of 3-5 follow-up questions the user might want to explore next.
    
    Ensure the content is factually accurate, politically neutral, and appropriate for a civic education context. Match the complexity to the user's indicated reading level if provided, or aim for an accessible general audience level if not specified.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are an expert civic educator specializing in making complex legislative processes and government concepts accessible to the public. Your goal is to empower citizens through knowledge, explaining concepts clearly and accurately without political bias." 
        } as ChatCompletionMessageParam,
        { role: "user", content: prompt } as ChatCompletionMessageParam
      ] as ChatCompletionMessageParam[],
      temperature: 0.5,
      max_tokens: 2500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error: any) {
    log.error({ err: error }, "Error generating contextual learning content");
    throw new Error("Failed to generate learning content");
  }
}

/**
 * Generate a definition and examples for a civic concept
 */
export async function generateCivicConceptDefinition(
  request: CivicConceptRequest
): Promise<{
  term: string;
  definition: string;
  category: string;
  complexityLevel: string;
  examples: string[];
  relatedTerms: string[];
}> {
  try {
    const prompt = `
    Generate a comprehensive definition and explanation for the civic or legislative term: "${request.term}"
    
    ${request.category ? `CATEGORY: ${request.category}` : ""}
    ${request.complexityLevel ? `COMPLEXITY LEVEL: ${request.complexityLevel}` : ""}
    
    Please provide the following in a structured JSON response:
    
    1. "term": The exact term being defined.
    
    2. "definition": A clear, comprehensive definition of the term (150-250 words) that explains what it means in a civic or legislative context.
    
    3. "category": The appropriate category for this term (e.g., "legislative", "judicial", "electoral", "constitutional", "local_government", etc.)
    
    4. "complexityLevel": The appropriate complexity level for this term ("beginner", "intermediate", or "advanced")
    
    5. "examples": An array of 2-4 concrete examples that illustrate the concept in action.
    
    6. "relatedTerms": An array of 3-6 related civic or legislative terms that someone learning about this concept might also want to understand.
    
    Ensure the definition is factually accurate, politically neutral, and appropriate for a civic education context.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are a civic education expert specializing in defining and explaining civic and legislative concepts accurately and accessibly. Your definitions are factual, comprehensive, and free from political bias." 
        } as ChatCompletionMessageParam,
        { role: "user", content: prompt } as ChatCompletionMessageParam
      ] as ChatCompletionMessageParam[],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error: any) {
    log.error({ err: error }, "Error generating civic concept definition");
    throw new Error("Failed to generate concept definition");
  }
}

/**
 * Generate questions for a quiz on civic or legislative topics
 */
export async function generateQuizQuestions(
  request: QuizGenerationRequest
): Promise<{
  questions: {
    text: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  }[];
}> {
  try {
    const prompt = `
    Generate a set of multiple-choice quiz questions to test knowledge about civic and legislative concepts.
    
    TOPIC: ${request.topic}
    DIFFICULTY LEVEL: ${request.difficultyLevel}
    NUMBER OF QUESTIONS: ${request.numberOfQuestions}
    ${request.concepts && request.concepts.length > 0 ? `CONCEPTS TO COVER: ${request.concepts.join(", ")}` : ""}
    ${request.learningObjectives && request.learningObjectives.length > 0 ? `LEARNING OBJECTIVES: ${request.learningObjectives.join("; ")}` : ""}
    
    Please provide the following in a structured JSON response:
    
    "questions": An array of ${request.numberOfQuestions} question objects, each with:
      - "text": The question text
      - "options": An array of 4 possible answer options
      - "correctOptionIndex": The index (0-3) of the correct option
      - "explanation": A brief explanation of why the correct answer is right and what makes the other options incorrect
    
    The questions should:
    1. Be factually accurate and politically neutral
    2. Cover a range of concepts within the topic
    3. Match the specified difficulty level
    4. Include a mix of recall, application, and critical thinking
    5. Have clearly written, unambiguous question text
    6. Have plausible but clearly incorrect wrong answers
    7. Have explanations that provide educational value
    
    Don't use obvious patterns in correct answers (like always option B) and ensure the questions challenge the user's understanding of civic concepts without being tricky or misleading.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are an expert in civic education and assessment design, specializing in creating high-quality quiz questions that test understanding of civic and legislative concepts. Your questions are clear, accurate, and educational." 
        } as ChatCompletionMessageParam,
        { role: "user", content: prompt } as ChatCompletionMessageParam
      ] as ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error: any) {
    log.error({ err: error }, "Error generating quiz questions");
    throw new Error("Failed to generate quiz questions");
  }
}

/**
 * Generate personalized feedback on a user's quiz attempt
 */
export async function generateQuizFeedback(
  request: QuizFeedbackRequest
): Promise<{
  overallFeedback: string;
  strengthAreas: string[];
  improvementAreas: string[];
  misconceptions: string[];
  nextSteps: string[];
}> {
  try {
    // Format questions and answers for the prompt
    const questionAnswerPairs = request.questions.map((question, index) => {
      const userAnswer = request.userAnswers[index];
      const isCorrect = question.correctOptionIndex === userAnswer.selectedOptionIndex;
      
      return {
        questionText: question.text,
        correctAnswer: question.options[question.correctOptionIndex],
        userAnswer: question.options[userAnswer.selectedOptionIndex],
        isCorrect: isCorrect,
        explanation: question.explanation
      };
    });
    
    const prompt = `
    Analyze this user's quiz performance and provide personalized, constructive feedback.
    
    QUIZ ATTEMPT DETAILS:
    Score: ${request.userAttempt.score}%
    Passing Score: ${request.userAttempt.passed ? "Passed" : "Not Passed"}
    
    QUESTION-ANSWER ANALYSIS:
    ${JSON.stringify(questionAnswerPairs, null, 2)}
    
    Please provide the following in a structured JSON response:
    
    1. "overallFeedback": A personalized 150-200 word summary of the user's performance, highlighting strengths and areas for improvement. Focus on being constructive and encouraging, while providing specific guidance based on their answers.
    
    2. "strengthAreas": An array of 2-3 specific areas where the user demonstrated good understanding.
    
    3. "improvementAreas": An array of 2-3 specific areas where the user could improve their understanding.
    
    4. "misconceptions": An array of 1-3 potential misconceptions the user may have based on their incorrect answers.
    
    5. "nextSteps": An array of 3-4 specific, actionable recommendations for what the user should study next to improve their understanding.
    
    Make your feedback supportive but substantive, focusing on helping the user learn rather than just pointing out errors. Be specific about concepts that need clarification and provide clear guidance for improvement.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are an expert civic education instructor who specializes in providing constructive, personalized feedback to help learners improve their understanding of civic and legislative concepts. Your feedback is specific, actionable, and supportive." 
        } as ChatCompletionMessageParam,
        { role: "user", content: prompt } as ChatCompletionMessageParam
      ] as ChatCompletionMessageParam[],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error: any) {
    log.error({ err: error }, "Error generating quiz feedback");
    throw new Error("Failed to generate quiz feedback");
  }
}

/**
 * Generate learning objectives for a civic education module
 */
export async function generateLearningObjectives(
  topic: string,
  difficultyLevel: string = "intermediate"
): Promise<{
  title: string;
  description: string;
  learningObjectives: string[];
  estimatedTimeMinutes: number;
}> {
  try {
    const prompt = `
    Generate learning objectives and structure for a civic education module on the following topic:
    
    TOPIC: ${topic}
    DIFFICULTY LEVEL: ${difficultyLevel}
    
    Please provide the following in a structured JSON response:
    
    1. "title": A clear, descriptive title for this learning module (5-10 words)
    
    2. "description": A concise overview of what this module covers and why it's important for civic education (100-150 words)
    
    3. "learningObjectives": An array of 4-6 specific, measurable learning objectives that follow best practices in educational design. Each objective should start with an action verb (e.g., "Explain", "Analyze", "Compare") and clearly state what the learner will be able to do after completing the module.
    
    4. "estimatedTimeMinutes": A reasonable estimate of how long it would take an average learner to complete this module (in minutes)
    
    Ensure the objectives are appropriate for the specified difficulty level, build from more basic to more complex understanding, and focus on applicable civic knowledge rather than just memorization.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are an expert in civic education curriculum design, specializing in creating effective learning objectives and educational structures for teaching civic and legislative concepts." 
        } as ChatCompletionMessageParam,
        { role: "user", content: prompt } as ChatCompletionMessageParam
      ] as ChatCompletionMessageParam[],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error: any) {
    log.error({ err: error }, "Error generating learning objectives");
    throw new Error("Failed to generate learning objectives");
  }
}

export default {
  generateContextualLearningContent,
  generateCivicConceptDefinition,
  generateQuizQuestions,
  generateQuizFeedback,
  generateLearningObjectives
};