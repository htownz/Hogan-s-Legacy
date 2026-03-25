-- Create state agencies table
CREATE TABLE IF NOT EXISTS state_agencies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agency bill reports table
CREATE TABLE IF NOT EXISTS agency_bill_reports (
  id SERIAL PRIMARY KEY,
  agency_id TEXT NOT NULL REFERENCES state_agencies(id),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  publish_date TIMESTAMP NOT NULL,
  bill_ids TEXT[],
  summary TEXT,
  content_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agency legislative contacts table
CREATE TABLE IF NOT EXISTS agency_legislative_contacts (
  id SERIAL PRIMARY KEY,
  agency_id TEXT NOT NULL REFERENCES state_agencies(id),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agency initiatives table
CREATE TABLE IF NOT EXISTS agency_initiatives (
  id SERIAL PRIMARY KEY,
  agency_id TEXT NOT NULL REFERENCES state_agencies(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  related_bill_ids TEXT[],
  status TEXT NOT NULL,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial state agency data
INSERT INTO state_agencies (id, name, url, description)
VALUES 
  ('tdi', 'Texas Department of Insurance', 'https://www.tdi.texas.gov', 'Regulates the state''s insurance industry, oversees agent licensing, and helps consumers with insurance issues'),
  ('tceq', 'Texas Commission on Environmental Quality', 'https://www.tceq.texas.gov', 'Protects the state''s public health and natural resources'),
  ('hhsc', 'Texas Health and Human Services Commission', 'https://www.hhs.texas.gov', 'Provides health and human services to Texans'),
  ('tea', 'Texas Education Agency', 'https://tea.texas.gov', 'Provides leadership, guidance, and resources to help schools meet the educational needs of students'),
  ('txdot', 'Texas Department of Transportation', 'https://www.txdot.gov', 'Provides safe and reliable transportation solutions for Texas'),
  ('rrc', 'Railroad Commission of Texas', 'https://www.rrc.texas.gov', 'Regulates the oil and gas industry, gas utilities, pipeline safety, and surface mining operations'),
  ('twdb', 'Texas Water Development Board', 'https://www.twdb.texas.gov', 'Provides water planning, data collection and dissemination, and financial assistance for water projects'),
  ('tpwd', 'Texas Parks and Wildlife Department', 'https://tpwd.texas.gov', 'Manages and conserves the natural and cultural resources of Texas')
ON CONFLICT (id) DO NOTHING;