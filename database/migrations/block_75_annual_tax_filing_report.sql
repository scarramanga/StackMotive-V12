-- Block 75: Annual Tax Filing Report - Database Schema
-- Focused on Australian and New Zealand Tax Legislation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types for AU/NZ tax system
CREATE TYPE jurisdiction_type AS ENUM ('AU', 'NZ');
CREATE TYPE nz_investor_status AS ENUM ('investor', 'trader');
CREATE TYPE nz_residency_status AS ENUM ('resident', 'non_resident', 'transitional_resident');
CREATE TYPE au_residency_status AS ENUM ('resident', 'foreign_resident', 'temporary_resident');
CREATE TYPE au_cgt_status AS ENUM ('full_cgt', 'main_residence_exempt', 'foreign_resident_cgt');
CREATE TYPE report_status AS ENUM ('draft', 'generating', 'completed', 'filed', 'amended', 'error');
CREATE TYPE report_type AS ENUM ('annual', 'quarterly', 'custom');
CREATE TYPE asset_type AS ENUM ('equity', 'etf', 'managed_fund', 'bond', 'crypto', 'property', 'other');
CREATE TYPE geographic_source AS ENUM ('AU', 'NZ', 'US', 'UK', 'OTHER');
CREATE TYPE tax_treatment AS ENUM ('cgt_exempt', 'cgt_discount', 'cgt_full', 'fif_treatment', 'income_treatment', 'crypto_property');
CREATE TYPE crypto_type AS ENUM ('bitcoin', 'ethereum', 'other_currency', 'nft', 'token');
CREATE TYPE crypto_tax_treatment AS ENUM ('property_nz', 'cgt_asset_au', 'trading_stock', 'income_asset');
CREATE TYPE transaction_type AS ENUM ('buy', 'sell', 'dividend', 'interest', 'split', 'bonus', 'rights', 'merger', 'spinoff', 'crypto_mine', 'crypto_stake', 'other');
CREATE TYPE cgt_event_type AS ENUM ('asset_disposal', 'asset_loss', 'dividend_reinvestment', 'bonus_shares', 'rights_issue', 'return_of_capital', 'crypto_disposal', 'crypto_trade');
CREATE TYPE income_event_type AS ENUM ('dividend', 'interest', 'distribution', 'franking_credit', 'foreign_income', 'crypto_income', 'staking_reward');
CREATE TYPE fif_method AS ENUM ('fair_dividend_rate', 'cost_method', 'deemed_rate_return');
CREATE TYPE fif_status AS ENUM ('not_applicable', 'under_threshold', 'fif_applicable');
CREATE TYPE compliance_status AS ENUM ('compliant', 'non_compliant', 'warning', 'requires_review');
CREATE TYPE compliance_check_type AS ENUM ('investor_trader_classification', 'fif_threshold_compliance', 'cgt_exemption_validity', 'franking_credit_eligibility', 'crypto_treatment_compliance', 'residency_status_verification', 'filing_requirement', 'deadline_compliance');
CREATE TYPE issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE au_nz_form_type AS ENUM ('ir3', 'ir3nr', 'ir4', 'individual_tax_return', 'foreign_income_return', 'cgt_schedule', 'other');
CREATE TYPE report_format AS ENUM ('pdf', 'csv', 'xlsx', 'xml', 'html', 'txt', 'ato_xml', 'ird_xml');
CREATE TYPE filing_method AS ENUM ('electronic', 'paper', 'tax_agent', 'other');

-- User Tax Classifications table
CREATE TABLE user_tax_classifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Jurisdiction
    jurisdiction jurisdiction_type NOT NULL,
    
    -- New Zealand specific classifications
    nz_investor_status nz_investor_status,
    nz_residency_status nz_residency_status,
    
    -- Australia specific classifications
    au_residency_status au_residency_status,
    au_cgt_status au_cgt_status,
    
    -- Classification tracking
    classification_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_review_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id),
    CONSTRAINT valid_nz_fields CHECK (
        (jurisdiction = 'NZ' AND nz_investor_status IS NOT NULL AND nz_residency_status IS NOT NULL) OR
        (jurisdiction != 'NZ' AND nz_investor_status IS NULL AND nz_residency_status IS NULL)
    ),
    CONSTRAINT valid_au_fields CHECK (
        (jurisdiction = 'AU' AND au_residency_status IS NOT NULL AND au_cgt_status IS NOT NULL) OR
        (jurisdiction != 'AU' AND au_residency_status IS NULL AND au_cgt_status IS NULL)
    )
);

-- Annual Tax Filing Reports table
CREATE TABLE annual_tax_filing_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Report identification
    report_name VARCHAR(255) NOT NULL,
    tax_year INTEGER NOT NULL CHECK (tax_year >= 2000 AND tax_year <= 2100),
    
    -- Report configuration
    report_type report_type NOT NULL DEFAULT 'annual',
    jurisdiction jurisdiction_type NOT NULL,
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('AUD', 'NZD')),
    
    -- User classification reference
    user_classification_id UUID REFERENCES user_tax_classifications(id),
    
    -- Tax periods and data
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    
    -- Report status
    report_status report_status NOT NULL DEFAULT 'draft',
    
    -- Calculated totals (for quick access)
    total_tax_liability DECIMAL(15,2) DEFAULT 0,
    total_tax_owed DECIMAL(15,2) DEFAULT 0,
    total_refund DECIMAL(15,2) DEFAULT 0,
    estimated_tax_payments DECIMAL(15,2) DEFAULT 0,
    withholding_tax DECIMAL(15,2) DEFAULT 0,
    
    -- AU specific totals
    total_franking_credits DECIMAL(15,2), -- AU only
    cgt_discount_amount DECIMAL(15,2), -- AU only
    
    -- NZ specific totals
    fif_income DECIMAL(15,2), -- NZ only
    exempt_cgt_gains DECIMAL(15,2), -- NZ investor exemption
    
    -- Processing metadata
    generated_at TIMESTAMP WITH TIME ZONE,
    filed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_currency_jurisdiction CHECK (
        (jurisdiction = 'AU' AND currency = 'AUD') OR
        (jurisdiction = 'NZ' AND currency = 'NZD')
    ),
    CONSTRAINT valid_period CHECK (reporting_period_end >= reporting_period_start),
    CONSTRAINT valid_tax_amounts CHECK (
        total_tax_liability >= 0 AND 
        total_tax_owed >= 0 AND 
        total_refund >= 0
    )
);

-- Tax Holdings table (portfolio positions at period end)
CREATE TABLE tax_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES annual_tax_filing_reports(id) ON DELETE CASCADE,
    
    -- Asset identification
    symbol VARCHAR(50) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    
    -- Holdings data
    quantity DECIMAL(20,8) NOT NULL CHECK (quantity >= 0),
    market_value DECIMAL(15,2) NOT NULL CHECK (market_value >= 0),
    cost_basis DECIMAL(15,2) NOT NULL CHECK (cost_basis >= 0),
    unrealized_gain DECIMAL(15,2) NOT NULL,
    
    -- Tax classification
    geographic_source geographic_source NOT NULL,
    asset_type asset_type NOT NULL,
    tax_treatment tax_treatment NOT NULL,
    
    -- Acquisition details
    acquisition_date DATE NOT NULL,
    acquisition_method VARCHAR(50) NOT NULL,
    
    -- AU/NZ specific fields
    is_franking_credit_eligible BOOLEAN DEFAULT FALSE, -- AU
    fif_status fif_status DEFAULT 'not_applicable', -- NZ
    cgt_exempt BOOLEAN DEFAULT FALSE, -- NZ investor status
    cgt_discount_eligible BOOLEAN DEFAULT FALSE, -- AU >12 months
    
    -- Foreign asset information (for FIF calculation)
    is_foreign_asset BOOLEAN DEFAULT FALSE,
    foreign_currency VARCHAR(3),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_fif_status_jurisdiction CHECK (
        (fif_status != 'not_applicable' AND geographic_source NOT IN ('AU', 'NZ')) OR
        (fif_status = 'not_applicable' AND geographic_source IN ('AU', 'NZ'))
    )
);

-- Tax Lots table (for cost basis tracking)
CREATE TABLE tax_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holding_id UUID NOT NULL REFERENCES tax_holdings(id) ON DELETE CASCADE,
    
    -- Lot details
    quantity DECIMAL(20,8) NOT NULL CHECK (quantity > 0),
    cost_basis DECIMAL(15,2) NOT NULL CHECK (cost_basis >= 0),
    acquisition_date DATE NOT NULL,
    
    -- AU/NZ specific
    cgt_discount_eligible BOOLEAN DEFAULT FALSE, -- AU: >12 months
    cgt_exempt BOOLEAN DEFAULT FALSE, -- NZ investor status
    
    -- Status
    is_open BOOLEAN DEFAULT TRUE,
    
    -- Associated transactions
    opening_transaction_id UUID,
    closing_transaction_id UUID,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE tax_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES annual_tax_filing_reports(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_date DATE NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    transaction_type transaction_type NOT NULL,
    
    -- Amounts
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(15,4) NOT NULL CHECK (price >= 0),
    value DECIMAL(15,2) NOT NULL,
    fees DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (fees >= 0),
    
    -- Tax implications
    is_tax_event BOOLEAN DEFAULT TRUE,
    geographic_source geographic_source NOT NULL,
    
    -- Withholding tax
    withholding_tax DECIMAL(15,2) DEFAULT 0 CHECK (withholding_tax >= 0),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CGT Events table
CREATE TABLE cgt_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES annual_tax_filing_reports(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES tax_transactions(id),
    
    -- Event details
    event_type cgt_event_type NOT NULL,
    event_date DATE NOT NULL,
    asset_symbol VARCHAR(50) NOT NULL,
    
    -- Amounts
    quantity DECIMAL(20,8) NOT NULL,
    sale_proceeds DECIMAL(15,2),
    cost_base DECIMAL(15,2) NOT NULL CHECK (cost_base >= 0),
    
    -- Calculation
    capital_gain DECIMAL(15,2) NOT NULL DEFAULT 0,
    capital_loss DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (capital_loss >= 0),
    
    -- AU specific
    discount_applicable BOOLEAN DEFAULT FALSE, -- AU 50% discount
    discount_amount DECIMAL(15,2) DEFAULT 0, -- AU discount amount
    indexation_adjustment DECIMAL(15,2) DEFAULT 0, -- AU indexation
    
    -- NZ specific
    exempt_gain BOOLEAN DEFAULT FALSE, -- NZ investor in AU/NZ equities
    trader_gain BOOLEAN DEFAULT FALSE, -- NZ trader status
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_gain_loss CHECK (
        (capital_gain > 0 AND capital_loss = 0) OR 
        (capital_gain = 0 AND capital_loss > 0) OR
        (capital_gain = 0 AND capital_loss = 0)
    )
);

-- Income Events table
CREATE TABLE income_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES annual_tax_filing_reports(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES tax_transactions(id),
    
    -- Event details
    event_type income_event_type NOT NULL,
    event_date DATE NOT NULL,
    asset_symbol VARCHAR(50) NOT NULL,
    
    -- Income amounts
    gross_income DECIMAL(15,2) NOT NULL CHECK (gross_income >= 0),
    net_income DECIMAL(15,2) NOT NULL CHECK (net_income >= 0),
    withholding_tax DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (withholding_tax >= 0),
    
    -- AU franking credits
    franking_credit DECIMAL(15,2) DEFAULT 0, -- AU only
    franking_percentage DECIMAL(5,2) DEFAULT 0 CHECK (franking_percentage >= 0 AND franking_percentage <= 100), -- AU only
    grossed_up_dividend DECIMAL(15,2) DEFAULT 0, -- AU franking gross-up
    
    -- NZ exemptions
    exempt_amount DECIMAL(15,2) DEFAULT 0, -- NZ investor exemption
    
    -- Foreign income
    foreign_tax_credit DECIMAL(15,2) DEFAULT 0,
    source_country VARCHAR(2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FIF Calculations table (NZ only)
CREATE TABLE fif_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES annual_tax_filing_reports(id) ON DELETE CASCADE,
    holding_id UUID REFERENCES tax_holdings(id),
    
    -- FIF details
    asset_symbol VARCHAR(50) NOT NULL,
    fif_year INTEGER NOT NULL,
    
    -- Calculation method
    fif_method fif_method NOT NULL,
    
    -- Values
    opening_value DECIMAL(15,2) NOT NULL CHECK (opening_value >= 0),
    closing_value DECIMAL(15,2) NOT NULL CHECK (closing_value >= 0),
    average_value DECIMAL(15,2) CHECK (average_value >= 0),
    
    -- Results
    fif_income DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (fif_income >= 0),
    days_held INTEGER NOT NULL CHECK (days_held >= 0 AND days_held <= 366),
    
    -- Rate applied (e.g., 5% for fair dividend rate)
    rate_applied DECIMAL(5,4) CHECK (rate_applied >= 0 AND rate_applied <= 1),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(report_id, holding_id, fif_year)
);

-- Franking Credits table (AU only)
CREATE TABLE franking_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES annual_tax_filing_reports(id) ON DELETE CASCADE,
    income_event_id UUID REFERENCES income_events(id),
    
    -- Franking details
    asset_symbol VARCHAR(50) NOT NULL,
    dividend_date DATE NOT NULL,
    
    -- Credit amounts
    franking_credit DECIMAL(15,2) NOT NULL CHECK (franking_credit >= 0),
    franking_percentage DECIMAL(5,2) NOT NULL CHECK (franking_percentage >= 0 AND franking_percentage <= 100),
    
    -- Usage
    credit_used DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (credit_used >= 0),
    credit_carried_forward DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (credit_carried_forward >= 0),
    
    -- Refund
    refundable_credit DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (refundable_credit >= 0),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crypto Events table
CREATE TABLE crypto_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES annual_tax_filing_reports(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES tax_transactions(id),
    
    -- Event details
    event_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    crypto_symbol VARCHAR(20) NOT NULL,
    crypto_type crypto_type NOT NULL,
    
    -- Amounts
    quantity DECIMAL(20,8) NOT NULL,
    market_value DECIMAL(15,2) NOT NULL CHECK (market_value >= 0),
    cost_basis DECIMAL(15,2) CHECK (cost_basis >= 0),
    
    -- Tax implications
    taxable_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    treatment_type crypto_tax_treatment NOT NULL,
    
    -- Mining/staking specific
    mining_pool VARCHAR(100),
    electricity_costs DECIMAL(15,2) DEFAULT 0 CHECK (electricity_costs >= 0),
    equipment_depreciation DECIMAL(15,2) DEFAULT 0 CHECK (equipment_depreciation >= 0),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax Forms table
CREATE TABLE tax_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES annual_tax_filing_reports(id) ON DELETE CASCADE,
    
    -- Form details
    form_name VARCHAR(100) NOT NULL,
    form_type au_nz_form_type NOT NULL,
    jurisdiction jurisdiction_type NOT NULL,
    
    -- Form metadata
    description TEXT,
    tax_year INTEGER NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    
    -- Status
    is_required BOOLEAN DEFAULT TRUE,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Form data (stored as JSONB for flexibility)
    form_data JSONB DEFAULT '{}',
    
    -- Generated outputs
    generated_pdf_path TEXT,
    generated_xml_path TEXT,
    
    -- Filing information
    filing_method filing_method,
    filed_date TIMESTAMP WITH TIME ZONE,
    acknowledgment_number VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax Schedules table
CREATE TABLE tax_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES tax_forms(id) ON DELETE CASCADE,
    
    -- Schedule details
    schedule_name VARCHAR(100) NOT NULL,
    jurisdiction jurisdiction_type NOT NULL,
    
    -- Schedule metadata
    description TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Schedule data
    schedule_data JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule Line Items table
CREATE TABLE schedule_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES tax_schedules(id) ON DELETE CASCADE,
    
    -- Line item details
    line_number VARCHAR(20) NOT NULL,
    form_reference VARCHAR(50), -- e.g., "IR3-18" for NZ or "Item 18" for AU
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    -- Supporting details
    supporting_transaction_ids UUID[],
    calculation_method TEXT,
    
    -- Validation
    is_calculated BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Checks table
CREATE TABLE compliance_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES annual_tax_filing_reports(id) ON DELETE CASCADE,
    
    -- Check details
    check_name VARCHAR(255) NOT NULL,
    check_type compliance_check_type NOT NULL,
    jurisdiction jurisdiction_type NOT NULL,
    
    -- Check information
    description TEXT NOT NULL,
    requirement TEXT NOT NULL,
    legislative_reference TEXT,
    
    -- Results
    status compliance_status NOT NULL,
    check_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Recommendations
    recommendations TEXT[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Issues table
CREATE TABLE compliance_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compliance_check_id UUID NOT NULL REFERENCES compliance_checks(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES annual_tax_filing_reports(id) ON DELETE CASCADE,
    
    -- Issue details
    issue_type VARCHAR(100) NOT NULL,
    severity issue_severity NOT NULL,
    description TEXT NOT NULL,
    legislative_reference TEXT,
    recommendation TEXT NOT NULL,
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT FALSE,
    resolution_date TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Reports table
CREATE TABLE generated_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES annual_tax_filing_reports(id) ON DELETE CASCADE,
    
    -- Report details
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    jurisdiction jurisdiction_type NOT NULL,
    
    -- Report metadata
    description TEXT,
    format report_format NOT NULL,
    
    -- Content
    file_path TEXT,
    file_size BIGINT CHECK (file_size >= 0),
    page_count INTEGER CHECK (page_count >= 0),
    
    -- AU/NZ specific
    form_type au_nz_form_type,
    
    -- Generation info
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    generated_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Status
    generation_status VARCHAR(50) NOT NULL DEFAULT 'completed',
    
    -- Sharing
    is_shared BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Trail table
CREATE TABLE tax_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES annual_tax_filing_reports(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Action details
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    
    -- Affected data
    affected_object VARCHAR(100) NOT NULL,
    affected_fields TEXT[],
    
    -- Changes (stored as JSONB)
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- AU/NZ specific
    legislative_reference TEXT,
    compliance_impact TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_tax_classifications_user_id ON user_tax_classifications(user_id);
CREATE INDEX idx_user_tax_classifications_jurisdiction ON user_tax_classifications(jurisdiction);

CREATE INDEX idx_annual_tax_filing_reports_user_id ON annual_tax_filing_reports(user_id);
CREATE INDEX idx_annual_tax_filing_reports_tax_year ON annual_tax_filing_reports(tax_year);
CREATE INDEX idx_annual_tax_filing_reports_jurisdiction ON annual_tax_filing_reports(jurisdiction);
CREATE INDEX idx_annual_tax_filing_reports_status ON annual_tax_filing_reports(report_status);
CREATE INDEX idx_annual_tax_filing_reports_created_at ON annual_tax_filing_reports(created_at);

CREATE INDEX idx_tax_holdings_report_id ON tax_holdings(report_id);
CREATE INDEX idx_tax_holdings_symbol ON tax_holdings(symbol);
CREATE INDEX idx_tax_holdings_geographic_source ON tax_holdings(geographic_source);
CREATE INDEX idx_tax_holdings_asset_type ON tax_holdings(asset_type);
CREATE INDEX idx_tax_holdings_fif_status ON tax_holdings(fif_status);

CREATE INDEX idx_tax_lots_holding_id ON tax_lots(holding_id);
CREATE INDEX idx_tax_lots_acquisition_date ON tax_lots(acquisition_date);
CREATE INDEX idx_tax_lots_is_open ON tax_lots(is_open);

CREATE INDEX idx_tax_transactions_report_id ON tax_transactions(report_id);
CREATE INDEX idx_tax_transactions_date ON tax_transactions(transaction_date);
CREATE INDEX idx_tax_transactions_symbol ON tax_transactions(symbol);
CREATE INDEX idx_tax_transactions_type ON tax_transactions(transaction_type);

CREATE INDEX idx_cgt_events_report_id ON cgt_events(report_id);
CREATE INDEX idx_cgt_events_event_date ON cgt_events(event_date);
CREATE INDEX idx_cgt_events_event_type ON cgt_events(event_type);
CREATE INDEX idx_cgt_events_symbol ON cgt_events(asset_symbol);

CREATE INDEX idx_income_events_report_id ON income_events(report_id);
CREATE INDEX idx_income_events_event_date ON income_events(event_date);
CREATE INDEX idx_income_events_event_type ON income_events(event_type);
CREATE INDEX idx_income_events_symbol ON income_events(asset_symbol);

CREATE INDEX idx_fif_calculations_report_id ON fif_calculations(report_id);
CREATE INDEX idx_fif_calculations_fif_year ON fif_calculations(fif_year);
CREATE INDEX idx_fif_calculations_symbol ON fif_calculations(asset_symbol);

CREATE INDEX idx_franking_credits_report_id ON franking_credits(report_id);
CREATE INDEX idx_franking_credits_dividend_date ON franking_credits(dividend_date);
CREATE INDEX idx_franking_credits_symbol ON franking_credits(asset_symbol);

CREATE INDEX idx_crypto_events_report_id ON crypto_events(report_id);
CREATE INDEX idx_crypto_events_event_date ON crypto_events(event_date);
CREATE INDEX idx_crypto_events_crypto_type ON crypto_events(crypto_type);

CREATE INDEX idx_tax_forms_report_id ON tax_forms(report_id);
CREATE INDEX idx_tax_forms_form_type ON tax_forms(form_type);
CREATE INDEX idx_tax_forms_jurisdiction ON tax_forms(jurisdiction);

CREATE INDEX idx_compliance_checks_report_id ON compliance_checks(report_id);
CREATE INDEX idx_compliance_checks_check_type ON compliance_checks(check_type);
CREATE INDEX idx_compliance_checks_status ON compliance_checks(status);
CREATE INDEX idx_compliance_checks_jurisdiction ON compliance_checks(jurisdiction);

CREATE INDEX idx_compliance_issues_check_id ON compliance_issues(compliance_check_id);
CREATE INDEX idx_compliance_issues_report_id ON compliance_issues(report_id);
CREATE INDEX idx_compliance_issues_severity ON compliance_issues(severity);
CREATE INDEX idx_compliance_issues_is_resolved ON compliance_issues(is_resolved);

CREATE INDEX idx_generated_reports_report_id ON generated_reports(report_id);
CREATE INDEX idx_generated_reports_jurisdiction ON generated_reports(jurisdiction);
CREATE INDEX idx_generated_reports_form_type ON generated_reports(form_type);

CREATE INDEX idx_tax_audit_trail_report_id ON tax_audit_trail(report_id);
CREATE INDEX idx_tax_audit_trail_user_id ON tax_audit_trail(user_id);
CREATE INDEX idx_tax_audit_trail_action ON tax_audit_trail(action);
CREATE INDEX idx_tax_audit_trail_timestamp ON tax_audit_trail(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_tax_classifications_updated_at
    BEFORE UPDATE ON user_tax_classifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annual_tax_filing_reports_updated_at
    BEFORE UPDATE ON annual_tax_filing_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_forms_updated_at
    BEFORE UPDATE ON tax_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_schedules_updated_at
    BEFORE UPDATE ON tax_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Validation functions
CREATE OR REPLACE FUNCTION validate_fif_threshold(report_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_foreign_value DECIMAL(15,2);
    threshold_nzd DECIMAL(15,2) := 50000; -- $50,000 NZD threshold
    report_jurisdiction jurisdiction_type;
BEGIN
    -- Get report jurisdiction
    SELECT jurisdiction INTO report_jurisdiction 
    FROM annual_tax_filing_reports 
    WHERE id = report_id;
    
    -- Only apply to NZ reports
    IF report_jurisdiction != 'NZ' THEN
        RETURN TRUE;
    END IF;
    
    -- Calculate total foreign holdings value
    SELECT COALESCE(SUM(market_value), 0) INTO total_foreign_value
    FROM tax_holdings
    WHERE report_id = validate_fif_threshold.report_id
    AND geographic_source NOT IN ('AU', 'NZ')
    AND is_foreign_asset = TRUE;
    
    -- Return whether FIF rules should apply
    RETURN total_foreign_value > threshold_nzd;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_franking_credit_eligibility(holding_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    holding_jurisdiction jurisdiction_type;
    holding_geographic_source geographic_source;
BEGIN
    -- Get holding details
    SELECT r.jurisdiction, h.geographic_source 
    INTO holding_jurisdiction, holding_geographic_source
    FROM tax_holdings h
    JOIN annual_tax_filing_reports r ON h.report_id = r.id
    WHERE h.id = holding_id;
    
    -- Franking credits only available for AU jurisdiction and AU assets
    RETURN holding_jurisdiction = 'AU' AND holding_geographic_source = 'AU';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_cgt_discount_eligibility(lot_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    acquisition_date DATE;
    holding_jurisdiction jurisdiction_type;
    twelve_months_ago DATE;
BEGIN
    -- Get lot and jurisdiction details
    SELECT tl.acquisition_date, r.jurisdiction
    INTO acquisition_date, holding_jurisdiction
    FROM tax_lots tl
    JOIN tax_holdings h ON tl.holding_id = h.id
    JOIN annual_tax_filing_reports r ON h.report_id = r.id
    WHERE tl.id = lot_id;
    
    -- CGT discount only applies to AU and for holdings >12 months
    IF holding_jurisdiction != 'AU' THEN
        RETURN FALSE;
    END IF;
    
    twelve_months_ago := CURRENT_DATE - INTERVAL '12 months';
    RETURN acquisition_date <= twelve_months_ago;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_tax_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_tax_filing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cgt_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fif_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE franking_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_audit_trail ENABLE ROW LEVEL SECURITY;

-- User Tax Classifications policies
CREATE POLICY "Users can view own classification" ON user_tax_classifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own classification" ON user_tax_classifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own classification" ON user_tax_classifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Annual Tax Filing Reports policies
CREATE POLICY "Users can view own reports" ON annual_tax_filing_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON annual_tax_filing_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON annual_tax_filing_reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON annual_tax_filing_reports
    FOR DELETE USING (auth.uid() = user_id);

-- Tax Holdings policies
CREATE POLICY "Users can view holdings for own reports" ON tax_holdings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = tax_holdings.report_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert holdings for own reports" ON tax_holdings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = tax_holdings.report_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update holdings for own reports" ON tax_holdings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = tax_holdings.report_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete holdings for own reports" ON tax_holdings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = tax_holdings.report_id
            AND user_id = auth.uid()
        )
    );

-- Apply similar policies to all other tables (using same pattern as tax_holdings)
-- Tax Lots policies
CREATE POLICY "Users can access tax lots for own holdings" ON tax_lots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tax_holdings h
            JOIN annual_tax_filing_reports r ON h.report_id = r.id
            WHERE h.id = tax_lots.holding_id
            AND r.user_id = auth.uid()
        )
    );

-- Tax Transactions policies
CREATE POLICY "Users can access transactions for own reports" ON tax_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = tax_transactions.report_id
            AND user_id = auth.uid()
        )
    );

-- CGT Events policies
CREATE POLICY "Users can access cgt events for own reports" ON cgt_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = cgt_events.report_id
            AND user_id = auth.uid()
        )
    );

-- Income Events policies
CREATE POLICY "Users can access income events for own reports" ON income_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = income_events.report_id
            AND user_id = auth.uid()
        )
    );

-- FIF Calculations policies (NZ only)
CREATE POLICY "Users can access fif calculations for own reports" ON fif_calculations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = fif_calculations.report_id
            AND user_id = auth.uid()
            AND jurisdiction = 'NZ'
        )
    );

-- Franking Credits policies (AU only)
CREATE POLICY "Users can access franking credits for own reports" ON franking_credits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = franking_credits.report_id
            AND user_id = auth.uid()
            AND jurisdiction = 'AU'
        )
    );

-- Crypto Events policies
CREATE POLICY "Users can access crypto events for own reports" ON crypto_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = crypto_events.report_id
            AND user_id = auth.uid()
        )
    );

-- Tax Forms policies
CREATE POLICY "Users can access tax forms for own reports" ON tax_forms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = tax_forms.report_id
            AND user_id = auth.uid()
        )
    );

-- Tax Schedules policies
CREATE POLICY "Users can access tax schedules for own forms" ON tax_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tax_forms f
            JOIN annual_tax_filing_reports r ON f.report_id = r.id
            WHERE f.id = tax_schedules.form_id
            AND r.user_id = auth.uid()
        )
    );

-- Schedule Line Items policies
CREATE POLICY "Users can access line items for own schedules" ON schedule_line_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tax_schedules s
            JOIN tax_forms f ON s.form_id = f.id
            JOIN annual_tax_filing_reports r ON f.report_id = r.id
            WHERE s.id = schedule_line_items.schedule_id
            AND r.user_id = auth.uid()
        )
    );

-- Compliance Checks policies
CREATE POLICY "Users can access compliance checks for own reports" ON compliance_checks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = compliance_checks.report_id
            AND user_id = auth.uid()
        )
    );

-- Compliance Issues policies
CREATE POLICY "Users can access compliance issues for own reports" ON compliance_issues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = compliance_issues.report_id
            AND user_id = auth.uid()
        )
    );

-- Generated Reports policies
CREATE POLICY "Users can access generated reports for own reports" ON generated_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = generated_reports.report_id
            AND user_id = auth.uid()
        )
    );

-- Tax Audit Trail policies
CREATE POLICY "Users can view audit trail for own reports" ON tax_audit_trail
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM annual_tax_filing_reports
            WHERE id = tax_audit_trail.report_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert audit entries" ON tax_audit_trail
    FOR INSERT WITH CHECK (true); -- System/trigger access

-- Create helpful views for AU/NZ specific data
CREATE VIEW nz_investor_reports AS
SELECT 
    r.*,
    c.nz_investor_status,
    c.nz_residency_status
FROM annual_tax_filing_reports r
JOIN user_tax_classifications c ON r.user_classification_id = c.id
WHERE r.jurisdiction = 'NZ'
AND c.nz_investor_status = 'investor';

CREATE VIEW au_cgt_discount_holdings AS
SELECT 
    h.*,
    r.jurisdiction,
    r.tax_year
FROM tax_holdings h
JOIN annual_tax_filing_reports r ON h.report_id = r.id
WHERE r.jurisdiction = 'AU'
AND h.cgt_discount_eligible = TRUE;

CREATE VIEW fif_applicable_holdings AS
SELECT 
    h.*,
    r.tax_year,
    fif.fif_income
FROM tax_holdings h
JOIN annual_tax_filing_reports r ON h.report_id = r.id
LEFT JOIN fif_calculations fif ON h.id = fif.holding_id
WHERE r.jurisdiction = 'NZ'
AND h.fif_status = 'fif_applicable';

CREATE VIEW franking_credit_summary AS
SELECT 
    r.id as report_id,
    r.tax_year,
    SUM(fc.franking_credit) as total_franking_credits,
    SUM(fc.refundable_credit) as total_refundable_credits,
    SUM(fc.credit_carried_forward) as total_carried_forward
FROM annual_tax_filing_reports r
JOIN franking_credits fc ON r.id = fc.report_id
WHERE r.jurisdiction = 'AU'
GROUP BY r.id, r.tax_year;

CREATE VIEW compliance_summary AS
SELECT 
    r.id as report_id,
    r.report_name,
    r.jurisdiction,
    r.tax_year,
    COUNT(cc.id) as total_checks,
    COUNT(CASE WHEN cc.status = 'compliant' THEN 1 END) as compliant_checks,
    COUNT(CASE WHEN cc.status = 'non_compliant' THEN 1 END) as non_compliant_checks,
    COUNT(CASE WHEN cc.status = 'warning' THEN 1 END) as warning_checks,
    COUNT(ci.id) as total_issues,
    COUNT(CASE WHEN ci.is_resolved = FALSE THEN 1 END) as unresolved_issues
FROM annual_tax_filing_reports r
LEFT JOIN compliance_checks cc ON r.id = cc.report_id
LEFT JOIN compliance_issues ci ON cc.id = ci.compliance_check_id
GROUP BY r.id, r.report_name, r.jurisdiction, r.tax_year;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE user_tax_classifications IS 'User tax classifications for AU/NZ jurisdictions with investor/trader status';
COMMENT ON TABLE annual_tax_filing_reports IS 'Main table for AU/NZ annual tax filing reports';
COMMENT ON TABLE tax_holdings IS 'Portfolio holdings with AU/NZ specific tax treatment';
COMMENT ON TABLE cgt_events IS 'Capital gains tax events with AU discount and NZ exemption rules';
COMMENT ON TABLE income_events IS 'Income events including AU franking credits and NZ exemptions';
COMMENT ON TABLE fif_calculations IS 'New Zealand Foreign Investment Fund calculations';
COMMENT ON TABLE franking_credits IS 'Australian franking credit system with gross-up calculations';
COMMENT ON TABLE crypto_events IS 'Cryptocurrency events with jurisdiction-specific treatment';
COMMENT ON TABLE compliance_checks IS 'AU/NZ specific compliance checking including investor/trader classification';

-- Initial system data
INSERT INTO user_tax_classifications (
    id,
    user_id,
    jurisdiction,
    nz_investor_status,
    nz_residency_status,
    classification_date
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000', -- System user
    'NZ',
    'investor',
    'resident',
    NOW()
), (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000', -- System user
    'AU',
    NULL,
    NULL,
    NOW()
);

-- Update the AU classification
UPDATE user_tax_classifications 
SET au_residency_status = 'resident', au_cgt_status = 'full_cgt'
WHERE id = '00000000-0000-0000-0000-000000000002'; 