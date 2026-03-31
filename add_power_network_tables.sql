-- Power Network Tables Migration
-- Maps Texas political power structure: Big Three, voting blocs, capitol network, legislation predictions

-- Enums
DO $$ BEGIN
  CREATE TYPE power_center_role AS ENUM (
    'governor','lieutenant_governor','speaker','pro_tempore',
    'majority_leader','minority_leader','whip','caucus_chair',
    'committee_chair','appropriations_chair','rules_chair'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE capitol_actor_type AS ENUM (
    'elected_official','capitol_staff','campaign_staff','lobbyist',
    'association_leader','government_relations','consultant',
    'donor','media','business_leader','advocacy_org'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE network_connection_type AS ENUM (
    'employs','donates_to','lobbies_for','advises','formerly_worked_for',
    'campaigns_for','married_to','related_to','business_partner',
    'co_sponsors_with','votes_with','opposes','mentors','appointed_by',
    'association_member','client_of'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE prediction_status AS ENUM (
    'predicted','filed','confirmed','missed','partially_correct'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Power Centers (Big Three + elected leadership)
CREATE TABLE IF NOT EXISTS power_centers (
  id SERIAL PRIMARY KEY,
  role power_center_role NOT NULL,
  name TEXT NOT NULL,
  stakeholder_id INTEGER REFERENCES policy_intel_stakeholders(id),
  chamber TEXT,
  party TEXT,
  session TEXT NOT NULL,
  priorities JSONB DEFAULT '[]',
  influence_score INTEGER DEFAULT 0,
  stats JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Capitol Actors (staff, lobbyists, consultants, donors, GR, associations)
CREATE TABLE IF NOT EXISTS capitol_actors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  actor_type capitol_actor_type NOT NULL,
  stakeholder_id INTEGER REFERENCES policy_intel_stakeholders(id),
  title TEXT,
  organization TEXT,
  clients JSONB DEFAULT '[]',
  total_contributions DOUBLE PRECISION DEFAULT 0,
  office TEXT,
  party TEXT,
  influence_score INTEGER DEFAULT 0,
  email TEXT,
  phone TEXT,
  tec_id TEXT,
  fec_id TEXT,
  openstates_id TEXT,
  bio TEXT,
  tags JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Network Connections (edges in the political graph)
CREATE TABLE IF NOT EXISTS capitol_connections (
  id SERIAL PRIMARY KEY,
  source_actor_id INTEGER REFERENCES capitol_actors(id),
  source_stakeholder_id INTEGER REFERENCES policy_intel_stakeholders(id),
  target_actor_id INTEGER REFERENCES capitol_actors(id),
  target_stakeholder_id INTEGER REFERENCES policy_intel_stakeholders(id),
  connection_type network_connection_type NOT NULL,
  strength DOUBLE PRECISION DEFAULT 0.5,
  evidence TEXT,
  financial_amount DOUBLE PRECISION,
  session TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Voting Blocs (computed groups of legislators who vote together)
CREATE TABLE IF NOT EXISTS voting_blocs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  session TEXT NOT NULL,
  chamber TEXT NOT NULL,
  detection_method TEXT DEFAULT 'co-voting-analysis',
  cohesion DOUBLE PRECISION DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  issue_areas JSONB DEFAULT '[]',
  aligned_power_center TEXT,
  votes_analyzed INTEGER DEFAULT 0,
  bipartisan BOOLEAN DEFAULT FALSE,
  narrative TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Voting Bloc Members
CREATE TABLE IF NOT EXISTS voting_bloc_members (
  id SERIAL PRIMARY KEY,
  bloc_id INTEGER NOT NULL REFERENCES voting_blocs(id) ON DELETE CASCADE,
  stakeholder_id INTEGER NOT NULL REFERENCES policy_intel_stakeholders(id),
  loyalty DOUBLE PRECISION DEFAULT 0,
  is_leader BOOLEAN DEFAULT FALSE,
  joined_session TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Legislation Predictions
CREATE TABLE IF NOT EXISTS legislation_predictions (
  id SERIAL PRIMARY KEY,
  session TEXT NOT NULL,
  predicted_topic TEXT NOT NULL,
  predicted_bill_type TEXT,
  predicted_chamber TEXT,
  predicted_sponsors JSONB DEFAULT '[]',
  predicted_champion JSONB,
  confidence DOUBLE PRECISION DEFAULT 0,
  reasoning TEXT,
  evidence_sources JSONB DEFAULT '[]',
  passage_probability DOUBLE PRECISION,
  power_center_dynamic JSONB,
  status prediction_status DEFAULT 'predicted',
  actual_bill_id TEXT,
  actual_sponsor TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Leadership Priorities
CREATE TABLE IF NOT EXISTS leadership_priorities (
  id SERIAL PRIMARY KEY,
  power_center_id INTEGER REFERENCES power_centers(id),
  session TEXT NOT NULL,
  topic TEXT NOT NULL,
  stance TEXT NOT NULL,
  intensity INTEGER DEFAULT 5,
  evidence_type TEXT,
  evidence_detail TEXT,
  evidence_url TEXT,
  evidence_date TIMESTAMP,
  acted BOOLEAN DEFAULT FALSE,
  bill_filed BOOLEAN DEFAULT FALSE,
  bill_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_power_centers_session ON power_centers(session);
CREATE INDEX IF NOT EXISTS idx_capitol_actors_type ON capitol_actors(actor_type);
CREATE INDEX IF NOT EXISTS idx_capitol_actors_org ON capitol_actors(organization);
CREATE INDEX IF NOT EXISTS idx_capitol_connections_source ON capitol_connections(source_actor_id, source_stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_capitol_connections_target ON capitol_connections(target_actor_id, target_stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_capitol_connections_type ON capitol_connections(connection_type);
CREATE INDEX IF NOT EXISTS idx_voting_blocs_session ON voting_blocs(session, chamber);
CREATE INDEX IF NOT EXISTS idx_voting_bloc_members_bloc ON voting_bloc_members(bloc_id);
CREATE INDEX IF NOT EXISTS idx_voting_bloc_members_stakeholder ON voting_bloc_members(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_legislation_predictions_session ON legislation_predictions(session);
CREATE INDEX IF NOT EXISTS idx_legislation_predictions_status ON legislation_predictions(status);
CREATE INDEX IF NOT EXISTS idx_leadership_priorities_session ON leadership_priorities(session);
CREATE INDEX IF NOT EXISTS idx_leadership_priorities_power_center ON leadership_priorities(power_center_id);
