DO $$
BEGIN
  CREATE TYPE policy_intel_issue_room_status AS ENUM ('active', 'watching', 'resolved', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE policy_intel_issue_room_relationship_type AS ENUM (
    'primary_authority',
    'background',
    'opposition_signal',
    'funding_context',
    'stakeholder_signal',
    'timeline_event'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE policy_intel_issue_room_update_type AS ENUM (
    'analysis',
    'status',
    'political',
    'legal',
    'funding',
    'meeting_note'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE policy_intel_issue_room_task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE policy_intel_issue_room_task_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE policy_intel_alerts ADD COLUMN IF NOT EXISTS issue_room_id integer;
ALTER TABLE policy_intel_alerts ADD COLUMN IF NOT EXISTS confidence_score integer NOT NULL DEFAULT 0;

ALTER TABLE policy_intel_briefs ADD COLUMN IF NOT EXISTS issue_room_id integer;

ALTER TABLE policy_intel_activities ADD COLUMN IF NOT EXISTS issue_room_id integer;

ALTER TABLE policy_intel_stakeholders ADD COLUMN IF NOT EXISTS issue_room_id integer;

CREATE TABLE IF NOT EXISTS policy_intel_issue_rooms (
  id serial PRIMARY KEY,
  workspace_id integer NOT NULL REFERENCES policy_intel_workspaces(id) ON DELETE CASCADE,
  matter_id integer REFERENCES policy_intel_matters(id) ON DELETE SET NULL,
  slug varchar(150) NOT NULL,
  title varchar(255) NOT NULL,
  issue_type varchar(128),
  jurisdiction varchar(64) NOT NULL DEFAULT 'texas',
  status policy_intel_issue_room_status NOT NULL DEFAULT 'active',
  summary text,
  recommended_path text,
  owner_user_id integer,
  related_bill_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS policy_intel_issue_rooms_workspace_slug_idx
  ON policy_intel_issue_rooms (workspace_id, slug);

CREATE TABLE IF NOT EXISTS policy_intel_issue_room_source_documents (
  id serial PRIMARY KEY,
  issue_room_id integer NOT NULL REFERENCES policy_intel_issue_rooms(id) ON DELETE CASCADE,
  source_document_id integer NOT NULL REFERENCES policy_intel_source_documents(id) ON DELETE CASCADE,
  relationship_type policy_intel_issue_room_relationship_type NOT NULL DEFAULT 'background',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS policy_intel_issue_room_source_documents_unique_idx
  ON policy_intel_issue_room_source_documents (issue_room_id, source_document_id);

CREATE TABLE IF NOT EXISTS policy_intel_issue_room_updates (
  id serial PRIMARY KEY,
  issue_room_id integer NOT NULL REFERENCES policy_intel_issue_rooms(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  body text NOT NULL,
  update_type policy_intel_issue_room_update_type NOT NULL DEFAULT 'analysis',
  source_pack_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policy_intel_issue_room_strategy_options (
  id serial PRIMARY KEY,
  issue_room_id integer NOT NULL REFERENCES policy_intel_issue_rooms(id) ON DELETE CASCADE,
  label varchar(255) NOT NULL,
  description text,
  pros_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  cons_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  political_feasibility varchar(32) DEFAULT 'unknown',
  legal_durability varchar(32) DEFAULT 'unknown',
  implementation_complexity varchar(32) DEFAULT 'unknown',
  recommendation_rank integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policy_intel_issue_room_tasks (
  id serial PRIMARY KEY,
  issue_room_id integer NOT NULL REFERENCES policy_intel_issue_rooms(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  status policy_intel_issue_room_task_status NOT NULL DEFAULT 'todo',
  priority policy_intel_issue_room_task_priority NOT NULL DEFAULT 'medium',
  assignee varchar(255),
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);