-- Comprehensive Texas Government Data Expansion Schema
-- This schema adds tables for committees, hearings, voting records, historical sessions, and ethics data
-- All data will be authentic and properly sourced from official Texas government websites

-- =============================================================================
-- COMMITTEE TABLES
-- =============================================================================

-- Texas Legislative Committees (House and Senate)
CREATE TABLE IF NOT EXISTS committees (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    chamber VARCHAR NOT NULL CHECK (chamber IN ('House', 'Senate')),
    chair VARCHAR,
    vice_chair VARCHAR,
    jurisdiction TEXT[],
    meeting_schedule TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    source_url VARCHAR,
    active BOOLEAN DEFAULT true
);

-- Committee Members (linking legislators to committees)
CREATE TABLE IF NOT EXISTS committee_members (
    id SERIAL PRIMARY KEY,
    committee_id VARCHAR REFERENCES committees(id),
    legislator_id INTEGER REFERENCES legislators(id),
    role VARCHAR DEFAULT 'Member', -- 'Chair', 'Vice Chair', 'Member'
    appointment_date DATE,
    term_end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(committee_id, legislator_id)
);

-- =============================================================================
-- HEARING TABLES
-- =============================================================================

-- Committee Hearings
CREATE TABLE IF NOT EXISTS committee_hearings (
    id VARCHAR PRIMARY KEY,
    committee_id VARCHAR REFERENCES committees(id),
    hearing_date DATE NOT NULL,
    hearing_time TIME,
    location VARCHAR,
    agenda_text TEXT,
    transcript_url VARCHAR,
    video_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    source_url VARCHAR
);

-- Hearing Agenda Items (bills and topics discussed)
CREATE TABLE IF NOT EXISTS hearing_agenda_items (
    id SERIAL PRIMARY KEY,
    hearing_id VARCHAR REFERENCES committee_hearings(id),
    bill_id VARCHAR REFERENCES bills(id),
    subject VARCHAR NOT NULL,
    description TEXT,
    time_allotted INTERVAL,
    order_sequence INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Hearing Witnesses (people who testified)
CREATE TABLE IF NOT EXISTS hearing_witnesses (
    id SERIAL PRIMARY KEY,
    hearing_id VARCHAR REFERENCES committee_hearings(id),
    name VARCHAR NOT NULL,
    organization VARCHAR,
    position VARCHAR CHECK (position IN ('For', 'Against', 'Neutral', 'Information')),
    testimony_text TEXT,
    testimony_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- VOTING RECORDS TABLES
-- =============================================================================

-- Comprehensive Voting Records (individual legislator votes)
CREATE TABLE IF NOT EXISTS voting_records (
    id VARCHAR PRIMARY KEY,
    bill_id VARCHAR REFERENCES bills(id),
    legislator_id INTEGER REFERENCES legislators(id),
    vote VARCHAR NOT NULL CHECK (vote IN ('Yes', 'No', 'Present', 'Absent')),
    vote_date DATE NOT NULL,
    chamber VARCHAR NOT NULL CHECK (chamber IN ('House', 'Senate')),
    vote_type VARCHAR NOT NULL CHECK (vote_type IN ('Final', 'Committee', 'Amendment')),
    amendment_id VARCHAR,
    motion_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    source_url VARCHAR,
    UNIQUE(bill_id, legislator_id, vote_date, vote_type)
);

-- Vote Summaries (roll call results for each bill)
CREATE TABLE IF NOT EXISTS vote_summaries (
    id SERIAL PRIMARY KEY,
    bill_id VARCHAR REFERENCES bills(id),
    vote_date DATE NOT NULL,
    chamber VARCHAR NOT NULL,
    vote_type VARCHAR NOT NULL,
    motion_text TEXT,
    yes_votes INTEGER DEFAULT 0,
    no_votes INTEGER DEFAULT 0,
    present_votes INTEGER DEFAULT 0,
    absent_votes INTEGER DEFAULT 0,
    result VARCHAR CHECK (result IN ('Passed', 'Failed')),
    created_at TIMESTAMP DEFAULT NOW(),
    source_url VARCHAR
);

-- =============================================================================
-- HISTORICAL SESSIONS TABLES
-- =============================================================================

-- Legislative Sessions (Regular and Special)
CREATE TABLE IF NOT EXISTS legislative_sessions (
    id VARCHAR PRIMARY KEY,
    year INTEGER NOT NULL,
    session_type VARCHAR NOT NULL CHECK (session_type IN ('Regular', 'Special')),
    start_date DATE,
    end_date DATE,
    bills_introduced INTEGER DEFAULT 0,
    bills_passed INTEGER DEFAULT 0,
    session_number INTEGER, -- For special sessions
    created_at TIMESTAMP DEFAULT NOW(),
    source_url VARCHAR
);

-- Session Statistics (detailed metrics for each session)
CREATE TABLE IF NOT EXISTS session_statistics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR REFERENCES legislative_sessions(id),
    chamber VARCHAR CHECK (chamber IN ('House', 'Senate', 'Joint')),
    metric_name VARCHAR NOT NULL,
    metric_value NUMERIC,
    metric_description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- ETHICS COMMISSION TABLES
-- =============================================================================

-- Personal Financial Statements (from Texas Ethics Commission)
CREATE TABLE IF NOT EXISTS personal_financial_statements (
    id VARCHAR PRIMARY KEY,
    filer_name VARCHAR NOT NULL,
    legislator_id INTEGER REFERENCES legislators(id),
    filing_year INTEGER NOT NULL,
    filing_date DATE,
    amended BOOLEAN DEFAULT false,
    total_assets NUMERIC,
    total_liabilities NUMERIC,
    created_at TIMESTAMP DEFAULT NOW(),
    source_url VARCHAR,
    file_url VARCHAR
);

-- Financial Statement Assets
CREATE TABLE IF NOT EXISTS pfs_assets (
    id SERIAL PRIMARY KEY,
    pfs_id VARCHAR REFERENCES personal_financial_statements(id),
    asset_type VARCHAR,
    asset_description TEXT,
    estimated_value NUMERIC,
    income_received NUMERIC,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Financial Statement Liabilities
CREATE TABLE IF NOT EXISTS pfs_liabilities (
    id SERIAL PRIMARY KEY,
    pfs_id VARCHAR REFERENCES personal_financial_statements(id),
    liability_type VARCHAR,
    creditor_name VARCHAR,
    amount_owed NUMERIC,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lobby Registrations
CREATE TABLE IF NOT EXISTS lobby_registrations (
    id VARCHAR PRIMARY KEY,
    lobbyist_name VARCHAR NOT NULL,
    client_name VARCHAR NOT NULL,
    registration_date DATE,
    termination_date DATE,
    subjects TEXT[],
    expenditure_threshold VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    source_url VARCHAR,
    active BOOLEAN DEFAULT true
);

-- Lobbying Activities (specific interactions)
CREATE TABLE IF NOT EXISTS lobbying_activities (
    id SERIAL PRIMARY KEY,
    registration_id VARCHAR REFERENCES lobby_registrations(id),
    legislator_id INTEGER REFERENCES legislators(id),
    activity_date DATE,
    activity_type VARCHAR,
    subject_matter TEXT,
    expenditure_amount NUMERIC,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ethics Violations and Enforcement Actions
CREATE TABLE IF NOT EXISTS ethics_violations (
    id VARCHAR PRIMARY KEY,
    subject_name VARCHAR NOT NULL,
    legislator_id INTEGER REFERENCES legislators(id),
    violation_type VARCHAR,
    violation_description TEXT,
    filing_date DATE,
    resolution_date DATE,
    penalty_amount NUMERIC,
    resolution_type VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    source_url VARCHAR
);

-- =============================================================================
-- BILL AMENDMENTS (Enhanced)
-- =============================================================================

-- Bill Amendments (detailed tracking of all changes)
CREATE TABLE IF NOT EXISTS bill_amendments (
    id VARCHAR PRIMARY KEY,
    bill_id VARCHAR REFERENCES bills(id),
    amendment_number VARCHAR,
    author_name VARCHAR,
    author_legislator_id INTEGER REFERENCES legislators(id),
    amendment_text TEXT,
    purpose_statement TEXT,
    date_proposed DATE,
    date_adopted DATE,
    status VARCHAR DEFAULT 'Proposed',
    vote_summary_id INTEGER REFERENCES vote_summaries(id),
    created_at TIMESTAMP DEFAULT NOW(),
    source_url VARCHAR
);

-- =============================================================================
-- DATA COLLECTION TRACKING
-- =============================================================================

-- Track data collection runs and status
CREATE TABLE IF NOT EXISTS data_collection_runs (
    id SERIAL PRIMARY KEY,
    collection_type VARCHAR NOT NULL,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    status VARCHAR DEFAULT 'Running' CHECK (status IN ('Running', 'Completed', 'Failed')),
    records_collected INTEGER DEFAULT 0,
    errors_encountered INTEGER DEFAULT 0,
    source_urls TEXT[],
    error_log TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Data source verification and quality metrics
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR NOT NULL,
    collection_date DATE DEFAULT CURRENT_DATE,
    total_records INTEGER,
    verified_records INTEGER,
    source_authenticated BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT NOW(),
    data_freshness_hours INTEGER
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Committee indexes
CREATE INDEX IF NOT EXISTS idx_committees_chamber ON committees(chamber);
CREATE INDEX IF NOT EXISTS idx_committee_members_legislator ON committee_members(legislator_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_committee ON committee_members(committee_id);

-- Hearing indexes
CREATE INDEX IF NOT EXISTS idx_hearings_committee ON committee_hearings(committee_id);
CREATE INDEX IF NOT EXISTS idx_hearings_date ON committee_hearings(hearing_date);
CREATE INDEX IF NOT EXISTS idx_agenda_items_hearing ON hearing_agenda_items(hearing_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_bill ON hearing_agenda_items(bill_id);

-- Voting record indexes
CREATE INDEX IF NOT EXISTS idx_voting_records_bill ON voting_records(bill_id);
CREATE INDEX IF NOT EXISTS idx_voting_records_legislator ON voting_records(legislator_id);
CREATE INDEX IF NOT EXISTS idx_voting_records_date ON voting_records(vote_date);
CREATE INDEX IF NOT EXISTS idx_vote_summaries_bill ON vote_summaries(bill_id);

-- Ethics data indexes
CREATE INDEX IF NOT EXISTS idx_pfs_filer ON personal_financial_statements(filer_name);
CREATE INDEX IF NOT EXISTS idx_pfs_year ON personal_financial_statements(filing_year);
CREATE INDEX IF NOT EXISTS idx_lobby_reg_lobbyist ON lobby_registrations(lobbyist_name);
CREATE INDEX IF NOT EXISTS idx_lobby_reg_client ON lobby_registrations(client_name);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_year ON legislative_sessions(year);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON legislative_sessions(session_type);

-- =============================================================================
-- DATA INTEGRITY CONSTRAINTS
-- =============================================================================

-- Ensure data quality and referential integrity
ALTER TABLE committees ADD CONSTRAINT check_chamber_valid 
    CHECK (chamber IN ('House', 'Senate'));

ALTER TABLE voting_records ADD CONSTRAINT check_vote_valid 
    CHECK (vote IN ('Yes', 'No', 'Present', 'Absent'));

ALTER TABLE legislative_sessions ADD CONSTRAINT check_session_type_valid 
    CHECK (session_type IN ('Regular', 'Special'));

-- Ensure dates are reasonable (not in the future for most data)
ALTER TABLE committee_hearings ADD CONSTRAINT check_hearing_date_reasonable 
    CHECK (hearing_date >= '1990-01-01' AND hearing_date <= CURRENT_DATE + INTERVAL '1 year');

ALTER TABLE voting_records ADD CONSTRAINT check_vote_date_reasonable 
    CHECK (vote_date >= '1990-01-01' AND vote_date <= CURRENT_DATE + INTERVAL '1 year');

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Committee Overview with Member Count
CREATE OR REPLACE VIEW committee_overview AS
SELECT 
    c.id,
    c.name,
    c.chamber,
    c.chair,
    COUNT(cm.legislator_id) as member_count,
    c.meeting_schedule,
    c.active
FROM committees c
LEFT JOIN committee_members cm ON c.id = cm.committee_id
GROUP BY c.id, c.name, c.chamber, c.chair, c.meeting_schedule, c.active;

-- Recent Hearing Activity
CREATE OR REPLACE VIEW recent_hearings AS
SELECT 
    ch.id,
    ch.hearing_date,
    c.name as committee_name,
    c.chamber,
    COUNT(hai.id) as agenda_items,
    COUNT(hw.id) as witnesses
FROM committee_hearings ch
JOIN committees c ON ch.committee_id = c.id
LEFT JOIN hearing_agenda_items hai ON ch.id = hai.hearing_id
LEFT JOIN hearing_witnesses hw ON ch.id = hw.hearing_id
WHERE ch.hearing_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ch.id, ch.hearing_date, c.name, c.chamber
ORDER BY ch.hearing_date DESC;

-- Legislator Voting Statistics
CREATE OR REPLACE VIEW legislator_voting_stats AS
SELECT 
    l.id,
    l.name,
    l.chamber,
    l.party,
    COUNT(vr.id) as total_votes,
    COUNT(CASE WHEN vr.vote = 'Yes' THEN 1 END) as yes_votes,
    COUNT(CASE WHEN vr.vote = 'No' THEN 1 END) as no_votes,
    COUNT(CASE WHEN vr.vote = 'Present' THEN 1 END) as present_votes,
    COUNT(CASE WHEN vr.vote = 'Absent' THEN 1 END) as absent_votes,
    ROUND(COUNT(CASE WHEN vr.vote = 'Yes' THEN 1 END) * 100.0 / NULLIF(COUNT(vr.id), 0), 2) as yes_percentage
FROM legislators l
LEFT JOIN voting_records vr ON l.id = vr.legislator_id
GROUP BY l.id, l.name, l.chamber, l.party;

-- Session Productivity Metrics
CREATE OR REPLACE VIEW session_productivity AS
SELECT 
    ls.id,
    ls.year,
    ls.session_type,
    ls.bills_introduced,
    ls.bills_passed,
    CASE 
        WHEN ls.bills_introduced > 0 
        THEN ROUND(ls.bills_passed * 100.0 / ls.bills_introduced, 2)
        ELSE 0 
    END as passage_rate,
    EXTRACT(DAYS FROM (ls.end_date - ls.start_date)) as session_length_days
FROM legislative_sessions ls
ORDER BY ls.year DESC, ls.session_type;

-- COMMENT ON SCHEMA
COMMENT ON TABLE committees IS 'Texas Legislative Committees from House and Senate with authentic data from official sources';
COMMENT ON TABLE committee_hearings IS 'Committee hearing records with agendas, witnesses, and transcripts from Texas Legislature';
COMMENT ON TABLE voting_records IS 'Individual legislator voting records on bills and amendments from official sources';
COMMENT ON TABLE legislative_sessions IS 'Historical Texas legislative sessions with statistics and metrics';
COMMENT ON TABLE personal_financial_statements IS 'Personal Financial Statements from Texas Ethics Commission';
COMMENT ON TABLE lobby_registrations IS 'Lobbyist registrations from Texas Ethics Commission';

-- Grant permissions (adjust as needed for your database setup)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO your_app_user;