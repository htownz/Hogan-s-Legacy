import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { OpenAI } from 'openai';
import { Document } from 'langchain/document';
import fs from 'fs';
import path from 'path';
import { createLogger } from "../logger";
const log = createLogger("vector-database-service");


// Initialize OpenAI for embeddings and completions
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });

// Pinecone configuration
const PINECONE_INDEX_NAME = 'llama-text-embed-v2-index'; // Using your existing index
let pineconeClient: Pinecone | null = null;
let pineconeIndex: any = null;

// Local file storage for persisting embeddings if Pinecone is unavailable
const LOCAL_EMBEDDINGS_PATH = path.join(process.cwd(), 'data', 'embeddings.json');

// Type definitions for our document storage
interface EmbeddedDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
}

// Local storage for embeddings when Pinecone is not available
let localEmbeddings: EmbeddedDocument[] = [];

/**
 * Initialize the Pinecone client and connect to existing index
 */
export async function initializeVectorStore() {
  try {
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_ENVIRONMENT) {
      log.warn('Pinecone credentials not found. Using local embeddings storage.');
      // Initialize local embeddings from file if it exists
      try {
        if (fs.existsSync(LOCAL_EMBEDDINGS_PATH)) {
          const data = fs.readFileSync(LOCAL_EMBEDDINGS_PATH, 'utf8');
          localEmbeddings = JSON.parse(data);
          log.info(`Loaded ${localEmbeddings.length} embeddings from local storage`);
        } else {
          // Create directory if it doesn't exist
          const dir = path.dirname(LOCAL_EMBEDDINGS_PATH);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          // Initialize empty embeddings file
          fs.writeFileSync(LOCAL_EMBEDDINGS_PATH, JSON.stringify([]), 'utf8');
          localEmbeddings = [];
        }
      } catch (fileError: any) {
        log.error({ err: fileError }, 'Error initializing local embeddings storage');
        localEmbeddings = [];
      }
      return false;
    }

    // Initialize Pinecone client
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // Get the existing index
    pineconeIndex = pineconeClient.Index(PINECONE_INDEX_NAME);
    
    // Verify connection by fetching stats
    const stats = await pineconeIndex.describeIndexStats();
    log.info(`Connected to Pinecone index: ${PINECONE_INDEX_NAME}`);
    log.info(`Vector count: ${stats.totalVectorCount}`);
    
    log.info('Vector database initialized successfully');
    return true;
  } catch (error: any) {
    log.error({ err: error }, 'Failed to initialize vector database');
    log.warn('Falling back to local embeddings storage...');
    
    // Initialize local embeddings from file if it exists
    try {
      if (fs.existsSync(LOCAL_EMBEDDINGS_PATH)) {
        const data = fs.readFileSync(LOCAL_EMBEDDINGS_PATH, 'utf8');
        localEmbeddings = JSON.parse(data);
        log.info(`Loaded ${localEmbeddings.length} embeddings from local storage`);
      } else {
        // Create directory if it doesn't exist
        const dir = path.dirname(LOCAL_EMBEDDINGS_PATH);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        // Initialize empty embeddings file
        fs.writeFileSync(LOCAL_EMBEDDINGS_PATH, JSON.stringify([]), 'utf8');
        localEmbeddings = [];
      }
    } catch (fileError: any) {
      log.error({ err: fileError }, 'Error initializing local embeddings storage');
      localEmbeddings = [];
    }
    
    return false;
  }
}

/**
 * Add documents to the vector store
 * @param documents Array of documents to add
 */
export async function addDocumentsToVectorStore(
  documents: Array<{ id: string; text: string; metadata?: Record<string, any> }>
) {
  try {
    // Try to initialize or confirm vector store is ready
    const initialized = await initializeVectorStore();
    
    // Create embeddings for each document
    const embeddedDocuments: EmbeddedDocument[] = [];
    
    for (const doc of documents) {
      try {
        // Generate embeddings using OpenAI
        const response = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: doc.text.slice(0, 8000), // Limit text to prevent token limit issues
        });
        
        const embedding = response.data[0].embedding;
        
        embeddedDocuments.push({
          id: doc.id,
          text: doc.text,
          embedding: embedding,
          metadata: doc.metadata || {}
        });
      } catch (embeddingError: any) {
        log.error({ err: embeddingError }, `Error generating embedding for document ${doc.id}`);
      }
    }
    
    if (embeddedDocuments.length === 0) {
      log.error('No valid embeddings could be generated');
      return false;
    }
    
    if (initialized && pineconeIndex) {
      // Use Pinecone to store embeddings
      const upsertRequests = embeddedDocuments.map(doc => ({
        id: doc.id,
        values: doc.embedding,
        metadata: {
          text: doc.text.slice(0, 1000), // Store first 1000 chars in metadata for quick access
          ...doc.metadata
        }
      }));
      
      // Upsert in batches of 100 to avoid request size limits
      const batchSize = 100;
      for (let i = 0; i < upsertRequests.length; i += batchSize) {
        const batch = upsertRequests.slice(i, i + batchSize);
        await pineconeIndex.upsert(batch);
      }
      
      log.info(`Added ${embeddedDocuments.length} documents to Pinecone`);
    } else {
      // Fallback to local storage
      for (const doc of embeddedDocuments) {
        // Check if document already exists and update it
        const existingIndex = localEmbeddings.findIndex(d => d.id === doc.id);
        if (existingIndex >= 0) {
          localEmbeddings[existingIndex] = doc;
        } else {
          localEmbeddings.push(doc);
        }
      }
      
      // Save to file
      fs.writeFileSync(LOCAL_EMBEDDINGS_PATH, JSON.stringify(localEmbeddings), 'utf8');
      log.info(`Added ${embeddedDocuments.length} documents to local storage`);
    }
    
    return true;
  } catch (error: any) {
    log.error({ err: error }, 'Error adding documents to vector store');
    return false;
  }
}

/**
 * Query similar documents from the vector store
 * @param query Text query to find similar documents
 * @param limit Maximum number of results to return
 * @param filters Optional metadata filters
 */
export async function querySimilarDocuments(query: string, limit = 5, filters?: Record<string, any>) {
  try {
    const initialized = await initializeVectorStore();
    
    // Generate embedding for query
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    
    const queryEmbedding = response.data[0].embedding;
    
    if (initialized && pineconeIndex) {
      // Query Pinecone
      const queryResponse = await pineconeIndex.query({
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true,
        filter: filters
      });
      
      // Format results
      return queryResponse.matches.map((match: any) => ({
        id: match.id,
        score: match.score,
        text: match.metadata?.text || '',
        metadata: match.metadata || {}
      }));
    } else {
      // Fallback to local search
      if (localEmbeddings.length === 0) {
        return [];
      }
      
      // Calculate cosine similarity
      const results = localEmbeddings
        .map(doc => {
          const similarity = calculateCosineSimilarity(queryEmbedding, doc.embedding);
          return {
            id: doc.id,
            score: similarity,
            text: doc.text,
            metadata: doc.metadata
          };
        })
        .filter(result => {
          // Apply filters if provided
          if (!filters) return true;
          
          for (const [key, value] of Object.entries(filters)) {
            if (result.metadata[key] !== value) {
              return false;
            }
          }
          return true;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      return results;
    }
  } catch (error: any) {
    log.error({ err: error }, 'Error querying vector store');
    return [];
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Generate an augmented response using RAG
 * @param query User query about legislation
 * @param documentLimit Number of similar documents to retrieve
 */
export async function generateRAGResponse(query: string, documentLimit = 5) {
  try {
    // Get relevant documents from vector store
    const relevantDocs = await querySimilarDocuments(query, documentLimit);
    
    if (relevantDocs.length === 0) {
      // Fallback to normal completion if no relevant docs found
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: 'system',
            content: 'You are an expert in Texas legislation and policy. Provide accurate information based on your knowledge.'
          },
          { role: 'user', content: query }
        ],
      });
      
      return {
        response: completion.choices[0].message.content,
        sourceDocs: [],
        usingRAG: false
      };
    }
    
    // Prepare context from documents
    const context = relevantDocs.map((doc: any) => doc.text).join('\n\n');
    const sourceMetadata = relevantDocs.map((doc: any) => ({
      id: doc.id,
      score: doc.score,
      ...doc.metadata
    }));
    
    // Generate completion with retrieved context using function calling for structured response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: 'system',
          content: `You are an expert in Texas legislation and policy. Analyze the following legislative documents and answer the user's question based on this information. Be factual and specific, citing relevant details from the provided documents.`
        },
        {
          role: 'user',
          content: `Relevant legislative documents:\n\n${context}\n\nBased on these documents, please answer: ${query}`
        }
      ],
      functions: [
        {
          name: 'generateStructuredResponse',
          description: 'Generate a structured response to a legislative query with citation information',
          parameters: {
            type: 'object',
            properties: {
              response: {
                type: 'string',
                description: 'The complete response to the user query'
              },
              keyFindings: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Key findings or points extracted from the documents that address the query'
              },
              sourceReferences: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    documentId: {
                      type: 'string',
                      description: 'ID of the source document'
                    },
                    relevantSection: {
                      type: 'string',
                      description: 'The specific section or content from the document that supports the response'
                    },
                    citationContext: {
                      type: 'string',
                      description: 'How this source information contributes to answering the query'
                    }
                  }
                },
                description: 'References to specific parts of the source documents'
              },
              confidenceLevel: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'Confidence level in the accuracy and completeness of the response'
              }
            },
            required: ['response', 'keyFindings', 'confidenceLevel']
          }
        }
      ],
      function_call: { name: 'generateStructuredResponse' }
    });
    
    // Check if the response includes a function call
    if (completion.choices[0].message.function_call) {
      const functionCall = completion.choices[0].message.function_call;
      const args = JSON.parse(functionCall.arguments);
      
      return {
        ...args,
        sourceDocs: sourceMetadata,
        usingRAG: true
      };
    } else {
      // Fallback if function calling didn't work
      return {
        response: completion.choices[0].message.content || 'No response generated',
        keyFindings: [],
        confidenceLevel: 'medium',
        sourceDocs: sourceMetadata,
        usingRAG: true
      };
    }
  } catch (error: any) {
    log.error({ err: error }, 'Error generating RAG response');
    
    // Provide a fallback response
    return {
      response: "I'm sorry, but I encountered an issue while retrieving relevant information. Please try again or rephrase your question.",
      keyFindings: [],
      confidenceLevel: 'low',
      sourceDocs: [],
      usingRAG: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Initialize vector store on service startup
initializeVectorStore().catch(console.error);