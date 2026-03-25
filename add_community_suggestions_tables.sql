-- Create bill suggestions table
CREATE TABLE IF NOT EXISTS bill_suggestions (
  id SERIAL PRIMARY KEY,
  bill_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending' NOT NULL,
  priority_score INTEGER DEFAULT 0,
  tags TEXT[]
);

-- Create bill suggestion upvotes table
CREATE TABLE IF NOT EXISTS bill_suggestion_upvotes (
  id SERIAL PRIMARY KEY,
  suggestion_id INTEGER NOT NULL REFERENCES bill_suggestions(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create bill suggestion comments table
CREATE TABLE IF NOT EXISTS bill_suggestion_comments (
  id SERIAL PRIMARY KEY,
  suggestion_id INTEGER NOT NULL REFERENCES bill_suggestions(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bill_suggestions_status ON bill_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_bill_suggestions_user_id ON bill_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_suggestion_upvotes_suggestion_id ON bill_suggestion_upvotes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_bill_suggestion_upvotes_user_id ON bill_suggestion_upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_suggestion_comments_suggestion_id ON bill_suggestion_comments(suggestion_id);