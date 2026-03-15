-- CANLK Database Schema - Complete Setup
-- Executed via Supabase CLI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: TDL Requests
CREATE TABLE IF NOT EXISTS tdl_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id),
    client_name VARCHAR(255),
    project_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Brouillon',
    priority VARCHAR(20) DEFAULT 'Normale',
    created_by UUID REFERENCES auth.users(id),
    team_members UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Financial Data
CREATE TABLE IF NOT EXISTS tdl_financial (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    unit_price DECIMAL(10,2),
    quantity INTEGER,
    total_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Technical Specs
CREATE TABLE IF NOT EXISTS tdl_technical_specs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    domain VARCHAR(100),
    sub_domain VARCHAR(100),
    analysis_type VARCHAR(100),
    complexity_score INTEGER DEFAULT 1,
    estimated_hours DECIMAL(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: SOPs
CREATE TABLE IF NOT EXISTS tdl_sops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    version VARCHAR(20),
    file_path VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: TDL SOPs (Many-to-Many)
CREATE TABLE IF NOT EXISTS tdl_request_sops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    sop_id UUID REFERENCES tdl_sops(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Test Results
CREATE TABLE IF NOT EXISTS tdl_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    conclusion TEXT,
    test_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Photos
CREATE TABLE IF NOT EXISTS tdl_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Sample Orders
CREATE TABLE IF NOT EXISTS tdl_sample_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    sample_type VARCHAR(50),
    quantity INTEGER DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'chips',
    shipping_format VARCHAR(50) DEFAULT 'bag',
    substrate_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: PDF Reports
CREATE TABLE IF NOT EXISTS tdl_pdf_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE UNIQUE,
    version INTEGER DEFAULT 1,
    file_path VARCHAR(500),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID REFERENCES auth.users(id)
);

-- Table: Archives
CREATE TABLE IF NOT EXISTS tdl_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    archive_path VARCHAR(500),
    archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Stage Logs
CREATE TABLE IF NOT EXISTS tdl_stage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    action VARCHAR(100),
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_technical_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_request_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_sample_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_pdf_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_stage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - adjust in production)
CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tdl_requests" ON tdl_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tdl_financial" ON tdl_financial FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tdl_technical_specs" ON tdl_technical_specs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tdl_sops" ON tdl_sops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tdl_request_sops" ON tdl_request_sops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tdl_test_results" ON tdl_test_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tdl_photos" ON tdl_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tdl_sample_orders" ON tdl_sample_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tdl_pdf_reports" ON tdl_pdf_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tdl_archives" ON tdl_archives FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tdl_stage_logs" ON tdl_stage_logs FOR ALL USING (true) WITH CHECK (true);
