/**
 * Document type definitions for the document management system
 */

/**
 * Represents a document in the system
 */
export interface Document {
  id: number;
  title: string;
  description: string | null;
  file_key: string;
  file_url: string | null;
  file_type: string;
  file_name: string;
  file_size: number;
  owner_id: number;
  category: string | null;
  tags: string[] | null;
  is_public: boolean;
  allow_comments: boolean;
  download_count: number;
  created_at: string;
  updated_at: string | null;
}

/**
 * Input data for creating a new document
 */
export interface CreateDocumentInput {
  title: string;
  description?: string;
  file: File;
  category?: string;
  tags?: string[];
  is_public: boolean;
  allow_comments: boolean;
}

/**
 * Document comment type
 */
export interface DocumentComment {
  id: number;
  document_id: number;
  user_id: number;
  user_name: string;
  text: string;
  created_at: string;
  updated_at: string | null;
}