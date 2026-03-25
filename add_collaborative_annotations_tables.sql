-- Create the legislative documents table
CREATE TABLE IF NOT EXISTS legislative_documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  external_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create the annotations table
CREATE TABLE IF NOT EXISTS annotations (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES legislative_documents(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  selection_text TEXT NOT NULL,
  color VARCHAR(20) DEFAULT 'yellow' NOT NULL,
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE NOT NULL,
  parent_id INTEGER REFERENCES annotations(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create the annotation reactions table
CREATE TABLE IF NOT EXISTS annotation_reactions (
  id SERIAL PRIMARY KEY,
  annotation_id INTEGER NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  reaction_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create the document collaborators table
CREATE TABLE IF NOT EXISTS document_collaborators (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES legislative_documents(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  role VARCHAR(20) DEFAULT 'viewer' NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_annotations_document_id ON annotations(document_id);
CREATE INDEX IF NOT EXISTS idx_annotations_parent_id ON annotations(parent_id);
CREATE INDEX IF NOT EXISTS idx_annotation_reactions_annotation_id ON annotation_reactions(annotation_id);
CREATE INDEX IF NOT EXISTS idx_document_collaborators_document_id ON document_collaborators(document_id);