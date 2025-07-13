-- Phase 5: Direct SQL Data Migration from SQLite to PostgreSQL
-- This script handles the type conversions and data migration

-- First, let's create a temporary table to hold the migrated data
-- We'll use a simple approach: export SQLite data to CSV, then import to PostgreSQL

-- Create temporary import tables with flexible types
CREATE TABLE IF NOT EXISTS temp_users (
    id INTEGER,
    username TEXT,
    email TEXT,
    password TEXT,
    full_name TEXT,
    created_at TEXT,
    last_login TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_tier TEXT,
    two_factor_enabled INTEGER,
    two_factor_secret TEXT,
    role TEXT,
    trial_started_at TEXT,
    trial_ends_at TEXT,
    onboarding_complete INTEGER,
    onboarding_step INTEGER,
    tax_residency TEXT,
    secondary_tax_residency TEXT,
    tax_identification_number TEXT,
    tax_file_number TEXT,
    tax_registered_business INTEGER,
    tax_year TEXT
);

-- Function to convert SQLite timestamp to PostgreSQL timestamp
CREATE OR REPLACE FUNCTION convert_sqlite_timestamp(timestamp_text TEXT)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    -- If NULL, return NULL
    IF timestamp_text IS NULL OR timestamp_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- If it's already a proper timestamp, convert directly
    IF timestamp_text LIKE '%-%-%T%:%:%' THEN
        RETURN timestamp_text::TIMESTAMPTZ;
    END IF;
    
    -- If it's a Unix timestamp, convert from epoch
    IF timestamp_text ~ '^[0-9]+$' THEN
        RETURN to_timestamp(timestamp_text::BIGINT);
    END IF;
    
    -- Default to current timestamp if can't parse
    RETURN NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to convert SQLite boolean to PostgreSQL boolean
CREATE OR REPLACE FUNCTION convert_sqlite_boolean(bool_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF bool_text IS NULL OR bool_text = '' THEN
        RETURN FALSE;
    END IF;
    
    IF bool_text = '1' OR bool_text = 'true' OR bool_text = 'TRUE' THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'SQL migration functions created successfully';
    RAISE NOTICE 'Ready to import data from SQLite CSV exports';
END $$; 