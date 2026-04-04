DO $$
BEGIN
  CREATE TYPE policy_intel_passage_prediction AS ENUM (
    'likely_pass',
    'lean_pass',
    'toss_up',
    'lean_fail',
    'likely_fail',
    'dead'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint

DO $$
BEGIN
  CREATE TYPE policy_intel_relationship_type AS ENUM (
    'funds',
    'lobbies_for',
    'opposes',
    'co_sponsors',
    'staff_of',
    'committee_together',
    'testified_before',
    'client_of',
    'ally',
    'adversary'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint

DO $$
BEGIN
  CREATE TYPE policy_intel_session_phase AS ENUM (
    'interim',
    'pre_filing',
    'filing_period',
    'committee_hearings',
    'floor_action',
    'conference',
    'enrollment',
    'post_session',
    'special_session'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint

DO $$
BEGIN
  CREATE TYPE policy_intel_session_milestone_status AS ENUM (
    'upcoming',
    'in_progress',
    'completed',
    'missed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint

DO $$
BEGIN
  CREATE TYPE policy_intel_client_action_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'deferred',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint

DO $$
BEGIN
  CREATE TYPE policy_intel_client_action_type AS ENUM (
    'testimony_prep',
    'legislator_meeting',
    'position_letter',
    'coalition_outreach',
    'media_response',
    'amendment_draft',
    'fiscal_note_review',
    'witness_coordination',
    'client_briefing',
    'strategy_pivot',
    'opposition_research',
    'grassroots_activation'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS policy_intel_client_profiles (
  id serial PRIMARY KEY,
  workspace_id integer NOT NULL REFERENCES policy_intel_workspaces(id) ON DELETE CASCADE,
  firm_name varchar(255) NOT NULL,
  contact_name varchar(255),
  contact_email varchar(255),
  contact_phone varchar(64),
  industry varchar(128),
  priority_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  jurisdictions jsonb NOT NULL DEFAULT '["texas"]'::jsonb,
  reporting_preferences jsonb NOT NULL DEFAULT '{
    "frequency": "weekly",
    "deliverableTypes": ["client_alert", "weekly_digest"],
    "includePassageProbability": true,
    "includeStakeholderIntel": true
  }'::jsonb,
  scoring_weights jsonb,
  notification_channels jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS policy_intel_client_profiles_workspace_idx
  ON policy_intel_client_profiles (workspace_id);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS policy_intel_passage_predictions (
  id serial PRIMARY KEY,
  workspace_id integer NOT NULL REFERENCES policy_intel_workspaces(id) ON DELETE CASCADE,
  bill_id varchar(64) NOT NULL,
  bill_title text,
  prediction policy_intel_passage_prediction NOT NULL DEFAULT 'toss_up',
  probability double precision NOT NULL DEFAULT 0.5,
  confidence double precision NOT NULL DEFAULT 0,
  regime varchar(32) NOT NULL DEFAULT 'interim',
  current_stage varchar(128),
  next_milestone varchar(255),
  next_milestone_date timestamptz,
  risk_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  support_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  opposition_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  historical_comps jsonb NOT NULL DEFAULT '[]'::jsonb,
  sponsor_strength double precision DEFAULT 0,
  committee_alignment double precision DEFAULT 0,
  previous_probability double precision,
  probability_delta double precision,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS policy_intel_passage_predictions_ws_bill_idx
  ON policy_intel_passage_predictions (workspace_id, bill_id);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS policy_intel_passage_predictions_prediction_idx
  ON policy_intel_passage_predictions (prediction);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS policy_intel_passage_predictions_probability_idx
  ON policy_intel_passage_predictions (probability);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS policy_intel_relationships (
  id serial PRIMARY KEY,
  workspace_id integer NOT NULL REFERENCES policy_intel_workspaces(id) ON DELETE CASCADE,
  from_stakeholder_id integer NOT NULL REFERENCES policy_intel_stakeholders(id) ON DELETE CASCADE,
  to_stakeholder_id integer NOT NULL REFERENCES policy_intel_stakeholders(id) ON DELETE CASCADE,
  relationship_type policy_intel_relationship_type NOT NULL,
  strength double precision NOT NULL DEFAULT 0.5,
  evidence_summary text,
  source_document_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS policy_intel_relationships_from_to_type_idx
  ON policy_intel_relationships (from_stakeholder_id, to_stakeholder_id, relationship_type);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS policy_intel_relationships_workspace_idx
  ON policy_intel_relationships (workspace_id);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS policy_intel_relationships_to_idx
  ON policy_intel_relationships (to_stakeholder_id);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS policy_intel_legislative_sessions (
  id serial PRIMARY KEY,
  workspace_id integer NOT NULL REFERENCES policy_intel_workspaces(id) ON DELETE CASCADE,
  session_number integer NOT NULL,
  session_type varchar(32) NOT NULL DEFAULT 'regular',
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  current_phase policy_intel_session_phase NOT NULL DEFAULT 'interim',
  is_active boolean NOT NULL DEFAULT true,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS policy_intel_leg_sessions_ws_num_idx
  ON policy_intel_legislative_sessions (workspace_id, session_number);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS policy_intel_session_milestones (
  id serial PRIMARY KEY,
  session_id integer NOT NULL REFERENCES policy_intel_legislative_sessions(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  phase policy_intel_session_phase NOT NULL,
  due_date timestamptz NOT NULL,
  status policy_intel_session_milestone_status NOT NULL DEFAULT 'upcoming',
  assignee varchar(255),
  matter_id integer REFERENCES policy_intel_matters(id) ON DELETE SET NULL,
  completed_at timestamptz,
  notes_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS policy_intel_session_milestones_session_phase_idx
  ON policy_intel_session_milestones (session_id, phase);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS policy_intel_session_milestones_due_date_idx
  ON policy_intel_session_milestones (due_date);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS policy_intel_report_templates (
  id serial PRIMARY KEY,
  workspace_id integer NOT NULL REFERENCES policy_intel_workspaces(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  type policy_intel_deliverable_type NOT NULL,
  template_markdown text NOT NULL,
  header_html text,
  footer_html text,
  brand_config jsonb NOT NULL DEFAULT '{
    "primaryColor": "#1a365d",
    "accentColor": "#c53030",
    "firmName": "Grace & McEwan Consulting LLC"
  }'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS policy_intel_report_templates_ws_type_idx
  ON policy_intel_report_templates (workspace_id, type);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS policy_intel_client_actions (
  id serial PRIMARY KEY,
  workspace_id integer NOT NULL REFERENCES policy_intel_workspaces(id) ON DELETE CASCADE,
  matter_id integer REFERENCES policy_intel_matters(id) ON DELETE SET NULL,
  issue_room_id integer REFERENCES policy_intel_issue_rooms(id) ON DELETE SET NULL,
  alert_id integer REFERENCES policy_intel_alerts(id) ON DELETE SET NULL,
  action_type policy_intel_client_action_type NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  status policy_intel_client_action_status NOT NULL DEFAULT 'pending',
  priority policy_intel_issue_room_task_priority NOT NULL DEFAULT 'medium',
  assignee varchar(255),
  due_date timestamptz,
  related_bill_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  stakeholder_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  outcome text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS policy_intel_client_actions_ws_status_idx
  ON policy_intel_client_actions (workspace_id, status);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS policy_intel_client_actions_due_date_idx
  ON policy_intel_client_actions (due_date);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS policy_intel_client_actions_matter_idx
  ON policy_intel_client_actions (matter_id);
