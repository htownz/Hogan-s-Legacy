-- Create enum types
CREATE TYPE campaign_finance_source AS ENUM (
  'fec',
  'tec',
  'other_state',
  'manual'
);

CREATE TYPE campaign_finance_entity_type AS ENUM (
  'individual',
  'candidate',
  'committee',
  'pac',
  'super_pac',
  'party_committee',
  'organization',
  'lobbyist',
  'consulting_firm'
);

CREATE TYPE campaign_finance_transaction_type AS ENUM (
  'contribution',
  'expenditure',
  'transfer',
  'loan',
  'loan_repayment',
  'refund',
  'in_kind',
  'independent_expenditure'
);

-- Create political entities table
CREATE TABLE IF NOT EXISTS political_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entity_type campaign_finance_entity_type NOT NULL,
  profile_id UUID REFERENCES scout_bot_profiles(id) ON DELETE SET NULL,
  source_system campaign_finance_source NOT NULL,
  source_id TEXT,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  occupation TEXT,
  employer TEXT,
  party TEXT,
  office TEXT,
  district TEXT,
  categories JSONB DEFAULT '[]',
  flags JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '{}',
  official_url TEXT,
  metadata JSONB DEFAULT '{}',
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID,
  verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create financial transactions table
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type campaign_finance_transaction_type NOT NULL,
  source_entity_id UUID REFERENCES political_entities(id),
  target_entity_id UUID REFERENCES political_entities(id),
  amount DECIMAL(12, 2) NOT NULL,
  transaction_date DATE,
  filing_date DATE,
  source_system campaign_finance_source NOT NULL,
  source_transaction_id TEXT,
  purpose TEXT,
  description TEXT,
  election_year TEXT,
  election_type TEXT,
  memo TEXT,
  line_number TEXT,
  aggregated_amount DECIMAL(12, 2),
  report_type TEXT,
  report_id TEXT,
  transaction_id TEXT,
  flags JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create committees table
CREATE TABLE IF NOT EXISTS committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES political_entities(id) ON DELETE CASCADE,
  committee_type TEXT NOT NULL,
  committee_designation TEXT,
  organization_type TEXT,
  connected_organization TEXT,
  candidate_id UUID REFERENCES political_entities(id),
  treasurer_name TEXT,
  custodian_name TEXT,
  first_file_date DATE,
  last_file_date DATE,
  filing_frequency TEXT,
  party_affiliation TEXT,
  interest_group_category TEXT,
  source_system campaign_finance_source NOT NULL,
  source_id TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES political_entities(id) ON DELETE CASCADE,
  office TEXT NOT NULL,
  state TEXT,
  district TEXT,
  incumbent_challenger TEXT,
  party_affiliation TEXT,
  election_year TEXT[],
  active_through TEXT,
  source_system campaign_finance_source NOT NULL,
  source_id TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create entity relationships table
CREATE TABLE IF NOT EXISTS entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL REFERENCES political_entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES political_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  monetary_value DECIMAL(12, 2),
  source_system campaign_finance_source NOT NULL,
  confidence_score INTEGER DEFAULT 70,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_political_entities_name ON political_entities(name);
CREATE INDEX IF NOT EXISTS idx_political_entities_entity_type ON political_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_political_entities_source_system ON political_entities(source_system);
CREATE INDEX IF NOT EXISTS idx_political_entities_source_id ON political_entities(source_id);
CREATE INDEX IF NOT EXISTS idx_political_entities_state ON political_entities(state);
CREATE INDEX IF NOT EXISTS idx_political_entities_party ON political_entities(party);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_transaction_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_source_entity_id ON financial_transactions(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_target_entity_id ON financial_transactions(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_transaction_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_filing_date ON financial_transactions(filing_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_amount ON financial_transactions(amount);

CREATE INDEX IF NOT EXISTS idx_committees_entity_id ON committees(entity_id);
CREATE INDEX IF NOT EXISTS idx_committees_committee_type ON committees(committee_type);
CREATE INDEX IF NOT EXISTS idx_committees_source_system ON committees(source_system);
CREATE INDEX IF NOT EXISTS idx_committees_source_id ON committees(source_id);

CREATE INDEX IF NOT EXISTS idx_candidates_entity_id ON candidates(entity_id);
CREATE INDEX IF NOT EXISTS idx_candidates_office ON candidates(office);
CREATE INDEX IF NOT EXISTS idx_candidates_state ON candidates(state);
CREATE INDEX IF NOT EXISTS idx_candidates_party_affiliation ON candidates(party_affiliation);
CREATE INDEX IF NOT EXISTS idx_candidates_source_system ON candidates(source_system);
CREATE INDEX IF NOT EXISTS idx_candidates_source_id ON candidates(source_id);

CREATE INDEX IF NOT EXISTS idx_entity_relationships_source_entity_id ON entity_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_relationships_target_entity_id ON entity_relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_relationships_relationship_type ON entity_relationships(relationship_type);