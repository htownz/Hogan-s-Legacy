-- Add legislative districts table
CREATE TABLE IF NOT EXISTS legislative_districts (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    district_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    representative_name TEXT,
    party_affiliation TEXT,
    geo_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add bill district impacts table
CREATE TABLE IF NOT EXISTS bill_district_impacts (
    id SERIAL PRIMARY KEY,
    bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    district_id INTEGER NOT NULL REFERENCES legislative_districts(id) ON DELETE CASCADE,
    impact_score REAL NOT NULL,
    impact_description TEXT,
    is_positive BOOLEAN,
    impact_areas JSONB DEFAULT '{}',
    source_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add bill activity heatmap table
CREATE TABLE IF NOT EXISTS bill_activity_heatmap (
    id SERIAL PRIMARY KEY,
    bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    activity_type TEXT NOT NULL,
    intensity REAL NOT NULL DEFAULT 1,
    user_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add committee meeting locations table
CREATE TABLE IF NOT EXISTS committee_meeting_locations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'TX',
    zip_code TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    building TEXT,
    room TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_legislative_districts_type ON legislative_districts(type);
CREATE INDEX IF NOT EXISTS idx_bill_district_impacts_bill_id ON bill_district_impacts(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_district_impacts_district_id ON bill_district_impacts(district_id);
CREATE INDEX IF NOT EXISTS idx_bill_activity_heatmap_bill_id ON bill_activity_heatmap(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_activity_heatmap_geo ON bill_activity_heatmap(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_committee_meeting_locations_geo ON committee_meeting_locations(latitude, longitude);
