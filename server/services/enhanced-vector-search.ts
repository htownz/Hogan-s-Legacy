// @ts-nocheck
import { Pinecone } from '@pinecone-database/pinecone';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { createLogger } from "../logger";
const log = createLogger("enhanced-vector-search");


// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index('llama-text-embed-v2-index');

interface EnhancedSearchQuery {
  query: string;
  type?: 'semantic' | 'hybrid' | 'contextual' | 'multimodal';
  filters?: {
    dateRange?: { start: string; end: string };
    documentType?: string[];
    entities?: string[];
    topics?: string[];
    urgency?: string[];
    complexity?: string[];
  };
  options?: {
    topK?: number;
    threshold?: number;
    includeMetadata?: boolean;
    rerank?: boolean;
    expandQuery?: boolean;
  };
}

interface EnhancedSearchResult {
  id: string;
  score: number;
  document: {
    title: string;
    content: string;
    type: string;
    metadata: Record<string, any>;
  };
  explanation: {
    matchType: 'exact' | 'semantic' | 'contextual' | 'inferred';
    keyTerms: string[];
    relevanceFactors: string[];
    confidenceScore: number;
  };
  relatedDocuments: {
    id: string;
    title: string;
    relationship: string;
    score: number;
  }[];
}

interface SemanticCluster {
  id: string;
  name: string;
  description: string;
  centroid: number[];
  documents: string[];
  keyTerms: string[];
  themes: string[];
  size: number;
}

interface QueryExpansion {
  originalQuery: string;
  expandedTerms: string[];
  synonyms: string[];
  relatedConcepts: string[];
  contextualTerms: string[];
  finalQuery: string;
}

export class EnhancedVectorSearch {
  
  async performAdvancedSearch(searchQuery: EnhancedSearchQuery): Promise<EnhancedSearchResult[]> {
    try {
      // Step 1: Query expansion and enhancement
      const expandedQuery = await this.expandQuery(searchQuery.query);
      
      // Step 2: Generate embeddings for the enhanced query
      const queryEmbedding = await this.generateEmbedding(expandedQuery.finalQuery);
      
      // Step 3: Execute vector search with filters
      const searchResults = await this.executeVectorSearch(queryEmbedding, searchQuery);
      
      // Step 4: Enhance results with AI analysis
      const enhancedResults = await this.enhanceSearchResults(searchResults, searchQuery.query);
      
      // Step 5: Rerank if requested
      if (searchQuery.options?.rerank) {
        return await this.rerankResults(enhancedResults, searchQuery.query);
      }
      
      return enhancedResults;
    } catch (error: any) {
      log.error({ err: error }, 'Advanced search failed');
      throw new Error('Failed to perform advanced vector search');
    }
  }

  private async expandQuery(query: string): Promise<QueryExpansion> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1000,
        system: `You are a query expansion expert specializing in legislative and political terminology. Expand search queries with relevant synonyms, related concepts, and contextual terms to improve search accuracy. Always respond with valid JSON.`,
        messages: [{
          role: 'user',
          content: `Expand this search query for better legislative document retrieval:

Query: "${query}"

Provide query expansion in this JSON format:
{
  "originalQuery": "${query}",
  "expandedTerms": ["term1", "term2", "term3"],
  "synonyms": ["synonym1", "synonym2"],
  "relatedConcepts": ["concept1", "concept2"],
  "contextualTerms": ["context1", "context2"],
  "finalQuery": "enhanced query text"
}`
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      throw new Error('Invalid query expansion response');
    } catch (error: any) {
      log.error({ err: error }, 'Query expansion failed');
      // Fallback to original query
      return {
        originalQuery: query,
        expandedTerms: [],
        synonyms: [],
        relatedConcepts: [],
        contextualTerms: [],
        finalQuery: query
      };
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error: any) {
      log.error({ err: error }, 'Embedding generation failed');
      throw new Error('Failed to generate embeddings - please ensure OpenAI API key is configured');
    }
  }

  private async executeVectorSearch(
    queryEmbedding: number[], 
    searchQuery: EnhancedSearchQuery
  ): Promise<any[]> {
    try {
      const { filters, options } = searchQuery;
      
      // Build Pinecone filter object
      const pineconeFilter: any = {};
      
      if (filters?.documentType?.length) {
        pineconeFilter.type = { $in: filters.documentType };
      }
      
      if (filters?.dateRange) {
        pineconeFilter.date = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        };
      }
      
      if (filters?.entities?.length) {
        pineconeFilter.entities = { $in: filters.entities };
      }

      const searchResults = await index.query({
        vector: queryEmbedding,
        topK: options?.topK || 20,
        includeMetadata: true,
        filter: Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined
      });

      return searchResults.matches?.filter(match => 
        match.score && match.score >= (options?.threshold || 0.7)
      ) || [];
    } catch (error: any) {
      log.error({ err: error }, 'Vector search execution failed');
      throw new Error('Failed to execute vector search - please ensure Pinecone is properly configured');
    }
  }

  private async enhanceSearchResults(
    rawResults: any[], 
    originalQuery: string
  ): Promise<EnhancedSearchResult[]> {
    const enhancedResults: EnhancedSearchResult[] = [];
    
    for (const result of rawResults) {
      try {
        // Analyze why this result matches
        const explanation = await this.explainMatch(originalQuery, result);
        
        // Find related documents
        const relatedDocs = await this.findRelatedDocuments(result.id);
        
        enhancedResults.push({
          id: result.id,
          score: result.score,
          document: {
            title: result.metadata?.title || 'Untitled Document',
            content: result.metadata?.content || '',
            type: result.metadata?.type || 'unknown',
            metadata: result.metadata || {}
          },
          explanation,
          relatedDocuments: relatedDocs
        });
      } catch (error: any) {
        log.error({ err: error }, `Failed to enhance result ${result.id}`);
        // Include basic result even if enhancement fails
        enhancedResults.push({
          id: result.id,
          score: result.score,
          document: {
            title: result.metadata?.title || 'Untitled Document',
            content: result.metadata?.content || '',
            type: result.metadata?.type || 'unknown',
            metadata: result.metadata || {}
          },
          explanation: {
            matchType: 'semantic',
            keyTerms: [],
            relevanceFactors: ['Vector similarity'],
            confidenceScore: result.score * 100
          },
          relatedDocuments: []
        });
      }
    }
    
    return enhancedResults;
  }

  private async explainMatch(query: string, result: any): Promise<any> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 800,
        system: `You are an expert in search relevance analysis. Explain why a document matches a search query by identifying key terms, semantic connections, and relevance factors. Always respond with valid JSON.`,
        messages: [{
          role: 'user',
          content: `Explain why this document matches the search query:

Query: "${query}"
Document Title: "${result.metadata?.title || 'Unknown'}"
Document Content: "${(result.metadata?.content || '').substring(0, 500)}..."
Similarity Score: ${result.score}

Provide explanation in this JSON format:
{
  "matchType": "exact|semantic|contextual|inferred",
  "keyTerms": ["term1", "term2"],
  "relevanceFactors": ["factor1", "factor2"],
  "confidenceScore": 85
}`
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
    } catch (error: any) {
      log.error({ err: error }, 'Match explanation failed');
    }
    
    // Fallback explanation
    return {
      matchType: 'semantic',
      keyTerms: query.split(' ').slice(0, 3),
      relevanceFactors: ['Vector similarity match'],
      confidenceScore: result.score * 100
    };
  }

  private async findRelatedDocuments(documentId: string): Promise<any[]> {
    try {
      // Get the document's embedding and find similar documents
      const similarResults = await index.query({
        id: documentId,
        topK: 5,
        includeMetadata: true
      });

      return similarResults.matches?.slice(1).map(match => ({
        id: match.id,
        title: match.metadata?.title || 'Related Document',
        relationship: 'Similar content',
        score: match.score || 0
      })) || [];
    } catch (error: any) {
      log.error({ err: error }, 'Related documents search failed');
      return [];
    }
  }

  private async rerankResults(
    results: EnhancedSearchResult[], 
    query: string
  ): Promise<EnhancedSearchResult[]> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1500,
        system: `You are an expert in search result ranking for legislative documents. Reorder search results based on relevance, importance, and user intent. Always respond with valid JSON.`,
        messages: [{
          role: 'user',
          content: `Rerank these search results for optimal relevance:

Query: "${query}"
Results: ${JSON.stringify(results.map(r => ({
            id: r.id,
            title: r.document.title,
            score: r.score,
            type: r.document.type
          })))}

Provide reranked order in this JSON format:
{
  "rankedIds": ["id1", "id2", "id3"],
  "reasoning": "Brief explanation of ranking factors"
}`
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const reranking = JSON.parse(content.text);
        const rerankedResults: EnhancedSearchResult[] = [];
        
        for (const id of reranking.rankedIds) {
          const result = results.find(r => r.id === id);
          if (result) {
            rerankedResults.push(result);
          }
        }
        
        // Add any results not in the reranking
        for (const result of results) {
          if (!rerankedResults.find(r => r.id === result.id)) {
            rerankedResults.push(result);
          }
        }
        
        return rerankedResults;
      }
    } catch (error: any) {
      log.error({ err: error }, 'Reranking failed');
    }
    
    // Return original order if reranking fails
    return results;
  }

  async discoverSemanticClusters(
    documentIds?: string[], 
    minClusterSize: number = 3
  ): Promise<SemanticCluster[]> {
    try {
      // This would involve clustering analysis on the vector space
      // For now, return a basic implementation
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2000,
        system: `You are an expert in document clustering and thematic analysis. Identify semantic clusters in legislative documents. Always respond with valid JSON.`,
        messages: [{
          role: 'user',
          content: `Identify semantic clusters in the document collection:

Document Count: ${documentIds?.length || 'All documents'}
Min Cluster Size: ${minClusterSize}

Provide clusters in this JSON format:
{
  "clusters": [
    {
      "id": "cluster_1",
      "name": "Healthcare Policy",
      "description": "Documents related to healthcare legislation",
      "documents": ["doc1", "doc2"],
      "keyTerms": ["healthcare", "insurance", "medical"],
      "themes": ["Healthcare access", "Insurance reform"],
      "size": 5
    }
  ]
}`
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const clustering = JSON.parse(content.text);
        return clustering.clusters.map((cluster: any) => ({
          ...cluster,
          centroid: [] // Would be calculated from actual embeddings
        }));
      }
    } catch (error: any) {
      log.error({ err: error }, 'Semantic clustering failed');
    }
    
    return [];
  }

  async buildSemanticIndex(documents: any[]): Promise<{ success: boolean; indexed: number }> {
    try {
      let indexedCount = 0;
      
      for (const doc of documents) {
        try {
          // Generate embedding for the document
          const embedding = await this.generateEmbedding(
            `${doc.title} ${doc.content}`.substring(0, 8000)
          );
          
          // Upsert to Pinecone
          await index.upsert([{
            id: doc.id,
            values: embedding,
            metadata: {
              title: doc.title,
              content: doc.content.substring(0, 1000),
              type: doc.type,
              date: doc.date,
              entities: doc.entities || [],
              topics: doc.topics || []
            }
          }]);
          
          indexedCount++;
        } catch (error: any) {
          log.error({ err: error }, `Failed to index document ${doc.id}`);
        }
      }
      
      return { success: true, indexed: indexedCount };
    } catch (error: any) {
      log.error({ err: error }, 'Semantic indexing failed');
      throw new Error('Failed to build semantic index - please check API configurations');
    }
  }

  async performHybridSearch(
    textQuery: string, 
    filters: any = {}
  ): Promise<EnhancedSearchResult[]> {
    try {
      // Combine vector search with traditional keyword search
      const vectorResults = await this.performAdvancedSearch({
        query: textQuery,
        type: 'semantic',
        filters,
        options: { topK: 15, rerank: false }
      });
      
      // Enhance with keyword matching
      const keywordEnhanced = await this.enhanceWithKeywords(vectorResults, textQuery);
      
      return keywordEnhanced;
    } catch (error: any) {
      log.error({ err: error }, 'Hybrid search failed');
      throw new Error('Failed to perform hybrid search');
    }
  }

  private async enhanceWithKeywords(
    vectorResults: EnhancedSearchResult[], 
    query: string
  ): Promise<EnhancedSearchResult[]> {
    // Analyze keyword overlap and boost scores accordingly
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    return vectorResults.map(result => {
      const contentText = `${result.document.title} ${result.document.content}`.toLowerCase();
      const matchingTerms = queryTerms.filter(term => contentText.includes(term));
      
      // Boost score based on keyword matches
      const keywordBoost = matchingTerms.length / queryTerms.length * 0.2;
      const enhancedScore = Math.min(result.score + keywordBoost, 1.0);
      
      return {
        ...result,
        score: enhancedScore,
        explanation: {
          ...result.explanation,
          keyTerms: [...result.explanation.keyTerms, ...matchingTerms],
          relevanceFactors: [
            ...result.explanation.relevanceFactors,
            `${matchingTerms.length}/${queryTerms.length} keyword matches`
          ]
        }
      };
    }).sort((a, b) => b.score - a.score);
  }

  async getSearchAnalytics(): Promise<any> {
    try {
      // Get index statistics
      const stats = await index.describeIndexStats();
      
      return {
        totalVectors: stats.totalVectorCount,
        indexDimension: stats.dimension,
        namespaces: stats.namespaces,
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
      log.error({ err: error }, 'Failed to get search analytics');
      return {
        totalVectors: 0,
        indexDimension: 0,
        namespaces: {},
        lastUpdated: new Date().toISOString(),
        error: 'Unable to retrieve analytics'
      };
    }
  }
}

export const enhancedVectorSearch = new EnhancedVectorSearch();