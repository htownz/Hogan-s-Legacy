-- Comprehensive Texas Government Data Expansion Schema
-- Supporting all five data expansion areas with authentic government data structures

-- Committee Data Expansion Tables
CREATE TABLE IF NOT EXISTS texas_committees (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    chamber VARCHAR NOT NULL,
    chair VARCHAR,
    vice_chair VARCHAR,
    members INTEGER,
    jurisdiction TEXT,
    meeting_schedule VARCHAR,
    recent_activity VARCHAR,
    website VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS committee_meetings (
    id VARCHAR PRIMARY KEY,
    committee_id VARCHAR REFERENCES texas_committees(id),
    committee_name VARCHAR NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time TIME,
    location VARCHAR,
    agenda TEXT,
    status VARCHAR DEFAULT 'Scheduled',
    witness_registration BOOLEAN DEFAULT FALSE,
    livestream_url VARCHAR,
    minutes_url VARCHAR,
    audio_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS committee_votes (
    id SERIAL PRIMARY KEY,
    meeting_id VARCHAR REFERENCES committee_meetings(id),
    bill_id VARCHAR,
    vote_type VARCHAR, -- 'favorable', 'unfavorable', 'without_recommendation'
    vote_date TIMESTAMP,
    ayes INTEGER DEFAULT 0,
    nays INTEGER DEFAULT 0,
    present_not_voting INTEGER DEFAULT 0,
    absent INTEGER DEFAULT 0,
    result VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign Finance Deep Dive Tables
CREATE TABLE IF NOT EXISTS campaign_finance_reports (
    id VARCHAR PRIMARY KEY,
    candidate_name VARCHAR NOT NULL,
    office VARCHAR,
    reporting_period VARCHAR NOT NULL,
    total_contributions DECIMAL(15,2) DEFAULT 0,
    total_expenditures DECIMAL(15,2) DEFAULT 0,
    cash_on_hand DECIMAL(15,2) DEFAULT 0,
    largest_donor VARCHAR,
    largest_donation DECIMAL(15,2) DEFAULT 0,
    number_of_donors INTEGER DEFAULT 0,
    average_donation DECIMAL(10,2) DEFAULT 0,
    filing_date DATE,
    source VARCHAR DEFAULT 'Texas Ethics Commission',
    report_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_contributions (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR REFERENCES campaign_finance_reports(id),
    contributor_name VARCHAR NOT NULL,
    contributor_address TEXT,
    contributor_occupation VARCHAR,
    contributor_employer VARCHAR,
    contribution_amount DECIMAL(10,2) NOT NULL,
    contribution_date DATE,
    contribution_type VARCHAR, -- 'monetary', 'in_kind', 'pledge'
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lobbying_expenditures (
    id VARCHAR PRIMARY KEY,
    lobbyist_name VARCHAR NOT NULL,
    client_name VARCHAR NOT NULL,
    reporting_period VARCHAR NOT NULL,
    total_expenditure DECIMAL(15,2) DEFAULT 0,
    compensation DECIMAL(12,2) DEFAULT 0,
    advertising DECIMAL(12,2) DEFAULT 0,
    events DECIMAL(12,2) DEFAULT 0,
    transportation DECIMAL(12,2) DEFAULT 0,
    other_expenses DECIMAL(12,2) DEFAULT 0,
    legislation_lobbied TEXT[], -- Array of bill IDs
    contacted_officials TEXT[], -- Array of official names
    filing_date DATE,
    source VARCHAR DEFAULT 'Texas Ethics Commission',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP
);

-- Regulatory Agency Data Tables
CREATE TABLE IF NOT EXISTS texas_state_agencies (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    abbreviation VARCHAR,
    commissioner VARCHAR,
    commissioners TEXT[], -- For multi-member commissions
    budget BIGINT,
    employees INTEGER,
    headquarters VARCHAR,
    website VARCHAR,
    mission TEXT,
    recent_rules INTEGER DEFAULT 0,
    pending_rulemaking INTEGER DEFAULT 0,
    enforcement_actions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agency_rulemaking (
    id VARCHAR PRIMARY KEY,
    agency_id VARCHAR REFERENCES texas_state_agencies(id),
    agency_name VARCHAR NOT NULL,
    rule_title VARCHAR NOT NULL,
    rule_number VARCHAR,
    status VARCHAR, -- 'proposed', 'adopted', 'withdrawn', 'emergency'
    public_comment_start DATE,
    public_comment_end DATE,
    effective_date DATE,
    summary TEXT,
    economic_impact TEXT,
    public_hearing_date DATE,
    comments_received INTEGER DEFAULT 0,
    rule_text_url VARCHAR,
    preamble_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agency_enforcement_actions (
    id SERIAL PRIMARY KEY,
    agency_id VARCHAR REFERENCES texas_state_agencies(id),
    case_number VARCHAR,
    respondent_name VARCHAR,
    violation_type VARCHAR,
    violation_date DATE,
    penalty_amount DECIMAL(12,2),
    status VARCHAR,
    settlement_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- State Contracts & Procurement Tables
CREATE TABLE IF NOT EXISTS state_contracts (
    id VARCHAR PRIMARY KEY,
    contract_number VARCHAR UNIQUE NOT NULL,
    vendor_name VARCHAR NOT NULL,
    vendor_address TEXT,
    agency_name VARCHAR NOT NULL,
    description TEXT,
    contract_value DECIMAL(15,2) NOT NULL,
    start_date DATE,
    end_date DATE,
    procurement_method VARCHAR,
    contract_type VARCHAR,
    status VARCHAR DEFAULT 'Active',
    modifications INTEGER DEFAULT 0,
    total_paid DECIMAL(15,2) DEFAULT 0,
    remaining_value DECIMAL(15,2),
    contract_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_payments (
    id VARCHAR PRIMARY KEY,
    contract_id VARCHAR REFERENCES state_contracts(id),
    vendor_name VARCHAR NOT NULL,
    agency_name VARCHAR NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_type VARCHAR,
    description TEXT,
    fiscal_year VARCHAR,
    appropriation VARCHAR,
    fund_source VARCHAR,
    voucher_number VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS procurement_solicitations (
    id SERIAL PRIMARY KEY,
    solicitation_number VARCHAR UNIQUE,
    agency_name VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    estimated_value DECIMAL(15,2),
    solicitation_type VARCHAR,
    issue_date DATE,
    response_due_date DATE,
    pre_bid_conference_date DATE,
    status VARCHAR,
    awarded_vendor VARCHAR,
    award_amount DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ethics & Transparency Records Tables
CREATE TABLE IF NOT EXISTS ethics_violations (
    id VARCHAR PRIMARY KEY,
    respondent_name VARCHAR NOT NULL,
    position VARCHAR,
    violation_type VARCHAR NOT NULL,
    allegation TEXT,
    filing_date DATE,
    investigation_start DATE,
    status VARCHAR, -- 'filed', 'under_investigation', 'resolved', 'dismissed'
    penalty_amount DECIMAL(10,2),
    penalty_type VARCHAR,
    resolution TEXT,
    public_hearing BOOLEAN DEFAULT FALSE,
    hearing_date DATE,
    document_url VARCHAR,
    case_number VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS disclosure_forms (
    id VARCHAR PRIMARY KEY,
    filer_name VARCHAR NOT NULL,
    position VARCHAR,
    form_type VARCHAR NOT NULL,
    filing_period VARCHAR,
    filing_date DATE,
    due_date DATE,
    status VARCHAR, -- 'filed', 'late', 'amended', 'not_filed'
    amendments INTEGER DEFAULT 0,
    late_filing_fee DECIMAL(8,2) DEFAULT 0,
    financial_interests INTEGER DEFAULT 0,
    gifts INTEGER DEFAULT 0,
    contractual_interests INTEGER DEFAULT 0,
    form_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_interests (
    id SERIAL PRIMARY KEY,
    disclosure_id VARCHAR REFERENCES disclosure_forms(id),
    interest_type VARCHAR, -- 'stocks', 'bonds', 'business_interest', 'real_estate'
    entity_name VARCHAR,
    description TEXT,
    value_range VARCHAR, -- '$1,000-$4,999', '$5,000-$9,999', etc.
    acquired_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gift_disclosures (
    id SERIAL PRIMARY KEY,
    disclosure_id VARCHAR REFERENCES disclosure_forms(id),
    gift_giver VARCHAR NOT NULL,
    gift_description TEXT,
    gift_value DECIMAL(8,2),
    gift_date DATE,
    occasion VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_committees_chamber ON texas_committees(chamber);
CREATE INDEX IF NOT EXISTS idx_committee_meetings_date ON committee_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_candidate ON campaign_finance_reports(candidate_name);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_period ON campaign_finance_reports(reporting_period);
CREATE INDEX IF NOT EXISTS idx_contributions_amount ON campaign_contributions(contribution_amount DESC);
CREATE INDEX IF NOT EXISTS idx_lobbying_period ON lobbying_expenditures(reporting_period);
CREATE INDEX IF NOT EXISTS idx_lobbying_expenditure ON lobbying_expenditures(total_expenditure DESC);
CREATE INDEX IF NOT EXISTS idx_agencies_name ON texas_state_agencies(name);
CREATE INDEX IF NOT EXISTS idx_rulemaking_status ON agency_rulemaking(status);
CREATE INDEX IF NOT EXISTS idx_contracts_value ON state_contracts(contract_value DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_agency ON state_contracts(agency_name);
CREATE INDEX IF NOT EXISTS idx_payments_date ON vendor_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON vendor_payments(amount DESC);
CREATE INDEX IF NOT EXISTS idx_ethics_status ON ethics_violations(status);
CREATE INDEX IF NOT EXISTS idx_disclosures_filer ON disclosure_forms(filer_name);
CREATE INDEX IF NOT EXISTS idx_disclosures_period ON disclosure_forms(filing_period);

-- Add comments for documentation
COMMENT ON TABLE texas_committees IS 'Texas Legislature committee information with authentic data structure';
COMMENT ON TABLE committee_meetings IS 'Scheduled and past committee meetings with agenda and voting information';
COMMENT ON TABLE campaign_finance_reports IS 'Campaign finance reports from Texas Ethics Commission';
COMMENT ON TABLE lobbying_expenditures IS 'Lobbying expenditure reports showing influence spending';
COMMENT ON TABLE texas_state_agencies IS 'Texas state agencies with regulatory authority';
COMMENT ON TABLE agency_rulemaking IS 'Agency rulemaking activities and public participation';
COMMENT ON TABLE state_contracts IS 'Texas state contracts and procurement transparency';
COMMENT ON TABLE vendor_payments IS 'State payments to vendors for goods and services';
COMMENT ON TABLE ethics_violations IS 'Ethics violation cases and investigations';
COMMENT ON TABLE disclosure_forms IS 'Financial disclosure forms from public officials';