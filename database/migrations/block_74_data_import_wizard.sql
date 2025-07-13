-- Block 74: Data Import Wizard - Database Schema
-- Comprehensive data import wizard system with templates, validation, and audit trails

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE wizard_status AS ENUM ('draft', 'in_progress', 'completed', 'failed', 'cancelled');
CREATE TYPE wizard_type AS ENUM ('portfolio', 'transactions', 'assets', 'categories', 'custom');
CREATE TYPE import_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'partial');
CREATE TYPE validation_severity AS ENUM ('error', 'warning', 'info');
CREATE TYPE data_type AS ENUM ('file', 'api', 'manual', 'clipboard');
CREATE TYPE field_type AS ENUM ('string', 'number', 'date', 'boolean', 'email', 'url', 'phone', 'currency');
CREATE TYPE transformation_type AS ENUM ('none', 'uppercase', 'lowercase', 'trim', 'format', 'calculate', 'lookup', 'custom');
CREATE TYPE mapping_type AS ENUM ('direct', 'transform', 'calculate', 'lookup', 'default');
CREATE TYPE quality_issue_type AS ENUM ('missing_data', 'invalid_format', 'duplicate', 'inconsistent', 'outlier');
CREATE TYPE quality_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE duplicate_handling AS ENUM ('skip', 'update', 'create_new', 'ask');
CREATE TYPE hook_event AS ENUM ('before_validation', 'after_validation', 'before_transform', 'after_transform', 'before_import', 'after_import');

-- Data Import Wizards table
CREATE TABLE data_import_wizards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Wizard configuration
    wizard_type wizard_type NOT NULL,
    template_id UUID,
    
    -- Current state
    current_step_id VARCHAR(100),
    status wizard_status NOT NULL DEFAULT 'draft',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Steps configuration (stored as JSONB for flexibility)
    steps JSONB NOT NULL DEFAULT '[]',
    completed_steps TEXT[] DEFAULT '{}',
    
    -- Source data configuration
    source_data JSONB DEFAULT '{}',
    
    -- Processing results
    processed_data JSONB DEFAULT '{}',
    
    -- Import results
    import_results JSONB DEFAULT '{}',
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100),
    CONSTRAINT valid_completion_time CHECK (completed_at IS NULL OR completed_at >= started_at),
    CONSTRAINT valid_estimated_completion CHECK (estimated_completion IS NULL OR estimated_completion >= created_at)
);

-- Import Templates table
CREATE TABLE import_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template configuration
    template_type wizard_type NOT NULL,
    category VARCHAR(100) NOT NULL,
    
    -- Template structure
    schema JSONB NOT NULL DEFAULT '{}',
    steps JSONB NOT NULL DEFAULT '[]',
    settings JSONB NOT NULL DEFAULT '{}',
    
    -- Template properties
    is_public BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    
    -- Template metadata
    tags TEXT[] DEFAULT '{}',
    version VARCHAR(20) DEFAULT '1.0.0',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT valid_usage_count CHECK (usage_count >= 0)
);

-- Template Reviews table
CREATE TABLE template_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES import_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Review data
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(template_id, user_id)
);

-- Template Versions table
CREATE TABLE template_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES import_templates(id) ON DELETE CASCADE,
    
    -- Version info
    version VARCHAR(20) NOT NULL,
    changes TEXT[] DEFAULT '{}',
    author VARCHAR(255) NOT NULL,
    
    -- Version data
    schema_snapshot JSONB NOT NULL,
    steps_snapshot JSONB NOT NULL,
    settings_snapshot JSONB NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(template_id, version)
);

-- Import History table
CREATE TABLE import_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wizard_id UUID NOT NULL REFERENCES data_import_wizards(id) ON DELETE CASCADE,
    
    -- Import details
    import_type VARCHAR(100) NOT NULL,
    source_file VARCHAR(255),
    records_processed INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    
    -- Results
    success BOOLEAN DEFAULT FALSE,
    duration INTEGER DEFAULT 0, -- in milliseconds
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_records_processed CHECK (records_processed >= 0),
    CONSTRAINT valid_records_imported CHECK (records_imported >= 0 AND records_imported <= records_processed),
    CONSTRAINT valid_duration CHECK (duration >= 0),
    CONSTRAINT valid_error_count CHECK (error_count >= 0),
    CONSTRAINT valid_warning_count CHECK (warning_count >= 0)
);

-- Wizard Steps table (for detailed step tracking)
CREATE TABLE wizard_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wizard_id UUID NOT NULL REFERENCES data_import_wizards(id) ON DELETE CASCADE,
    
    -- Step info
    step_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Step configuration
    step_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    is_completed BOOLEAN DEFAULT FALSE,
    can_skip BOOLEAN DEFAULT FALSE,
    estimated_time INTEGER DEFAULT 0, -- in minutes
    
    -- Dependencies
    dependencies TEXT[] DEFAULT '{}',
    
    -- Validation
    validation_rules JSONB DEFAULT '{}',
    validation_errors TEXT[] DEFAULT '{}',
    validation_warnings TEXT[] DEFAULT '{}',
    
    -- Step data
    step_data JSONB DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(wizard_id, step_id),
    CONSTRAINT valid_step_order CHECK (step_order > 0),
    CONSTRAINT valid_estimated_time CHECK (estimated_time >= 0),
    CONSTRAINT valid_step_timing CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- Data Quality Issues table
CREATE TABLE data_quality_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wizard_id UUID NOT NULL REFERENCES data_import_wizards(id) ON DELETE CASCADE,
    
    -- Issue details
    issue_type quality_issue_type NOT NULL,
    field_name VARCHAR(255),
    row_index INTEGER,
    description TEXT NOT NULL,
    severity quality_severity NOT NULL,
    
    -- Issue data
    original_value TEXT,
    expected_value TEXT,
    suggested_fix TEXT,
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT FALSE,
    resolution_action TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_row_index CHECK (row_index IS NULL OR row_index >= 0)
);

-- Import Errors table
CREATE TABLE import_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wizard_id UUID NOT NULL REFERENCES data_import_wizards(id) ON DELETE CASCADE,
    
    -- Error details
    error_type VARCHAR(100) NOT NULL,
    error_code VARCHAR(50),
    message TEXT NOT NULL,
    
    -- Error context
    row_index INTEGER,
    field_name VARCHAR(255),
    original_value TEXT,
    expected_value TEXT,
    
    -- Stack trace and debugging
    stack_trace TEXT,
    context_data JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_row_index CHECK (row_index IS NULL OR row_index >= 0)
);

-- Custom Validators table
CREATE TABLE custom_validators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Validator info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Validator function
    validator_function TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, name)
);

-- Custom Transformers table
CREATE TABLE custom_transformers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Transformer info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Transformer function
    transformer_function TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, name)
);

-- Import Hooks table
CREATE TABLE import_hooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Hook info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event hook_event NOT NULL,
    
    -- Hook function
    hook_function TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, name)
);

-- Wizard Configurations table (for reusable configurations)
CREATE TABLE wizard_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Configuration info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    wizard_type wizard_type NOT NULL,
    
    -- Configuration data
    default_settings JSONB DEFAULT '{}',
    field_mappings JSONB DEFAULT '{}',
    validation_rules JSONB DEFAULT '{}',
    transformation_rules JSONB DEFAULT '{}',
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, name)
);

-- Create indexes for performance
CREATE INDEX idx_data_import_wizards_user_id ON data_import_wizards(user_id);
CREATE INDEX idx_data_import_wizards_status ON data_import_wizards(status);
CREATE INDEX idx_data_import_wizards_wizard_type ON data_import_wizards(wizard_type);
CREATE INDEX idx_data_import_wizards_template_id ON data_import_wizards(template_id);
CREATE INDEX idx_data_import_wizards_created_at ON data_import_wizards(created_at);
CREATE INDEX idx_data_import_wizards_updated_at ON data_import_wizards(updated_at);

CREATE INDEX idx_import_templates_user_id ON import_templates(user_id);
CREATE INDEX idx_import_templates_template_type ON import_templates(template_type);
CREATE INDEX idx_import_templates_category ON import_templates(category);
CREATE INDEX idx_import_templates_is_public ON import_templates(is_public);
CREATE INDEX idx_import_templates_is_system ON import_templates(is_system);
CREATE INDEX idx_import_templates_is_active ON import_templates(is_active);
CREATE INDEX idx_import_templates_rating ON import_templates(rating);
CREATE INDEX idx_import_templates_usage_count ON import_templates(usage_count);

CREATE INDEX idx_template_reviews_template_id ON template_reviews(template_id);
CREATE INDEX idx_template_reviews_user_id ON template_reviews(user_id);
CREATE INDEX idx_template_reviews_rating ON template_reviews(rating);

CREATE INDEX idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX idx_template_versions_version ON template_versions(version);

CREATE INDEX idx_import_history_user_id ON import_history(user_id);
CREATE INDEX idx_import_history_wizard_id ON import_history(wizard_id);
CREATE INDEX idx_import_history_import_type ON import_history(import_type);
CREATE INDEX idx_import_history_success ON import_history(success);
CREATE INDEX idx_import_history_created_at ON import_history(created_at);

CREATE INDEX idx_wizard_steps_wizard_id ON wizard_steps(wizard_id);
CREATE INDEX idx_wizard_steps_step_id ON wizard_steps(step_id);
CREATE INDEX idx_wizard_steps_step_order ON wizard_steps(step_order);
CREATE INDEX idx_wizard_steps_is_completed ON wizard_steps(is_completed);

CREATE INDEX idx_data_quality_issues_wizard_id ON data_quality_issues(wizard_id);
CREATE INDEX idx_data_quality_issues_issue_type ON data_quality_issues(issue_type);
CREATE INDEX idx_data_quality_issues_severity ON data_quality_issues(severity);
CREATE INDEX idx_data_quality_issues_is_resolved ON data_quality_issues(is_resolved);

CREATE INDEX idx_import_errors_wizard_id ON import_errors(wizard_id);
CREATE INDEX idx_import_errors_error_type ON import_errors(error_type);
CREATE INDEX idx_import_errors_error_code ON import_errors(error_code);

CREATE INDEX idx_custom_validators_user_id ON custom_validators(user_id);
CREATE INDEX idx_custom_validators_is_active ON custom_validators(is_active);

CREATE INDEX idx_custom_transformers_user_id ON custom_transformers(user_id);
CREATE INDEX idx_custom_transformers_is_active ON custom_transformers(is_active);

CREATE INDEX idx_import_hooks_user_id ON import_hooks(user_id);
CREATE INDEX idx_import_hooks_event ON import_hooks(event);
CREATE INDEX idx_import_hooks_is_active ON import_hooks(is_active);
CREATE INDEX idx_import_hooks_priority ON import_hooks(priority);

CREATE INDEX idx_wizard_configurations_user_id ON wizard_configurations(user_id);
CREATE INDEX idx_wizard_configurations_wizard_type ON wizard_configurations(wizard_type);
CREATE INDEX idx_wizard_configurations_is_active ON wizard_configurations(is_active);

-- Add foreign key constraint for template_id (after templates table is created)
ALTER TABLE data_import_wizards 
ADD CONSTRAINT fk_wizard_template_id 
FOREIGN KEY (template_id) REFERENCES import_templates(id) ON DELETE SET NULL;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_data_import_wizards_updated_at
    BEFORE UPDATE ON data_import_wizards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_templates_updated_at
    BEFORE UPDATE ON import_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wizard_steps_updated_at
    BEFORE UPDATE ON wizard_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_validators_updated_at
    BEFORE UPDATE ON custom_validators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_transformers_updated_at
    BEFORE UPDATE ON custom_transformers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_hooks_updated_at
    BEFORE UPDATE ON import_hooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wizard_configurations_updated_at
    BEFORE UPDATE ON wizard_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Template rating update trigger
CREATE OR REPLACE FUNCTION update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE import_templates
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM template_reviews
        WHERE template_id = NEW.template_id
    )
    WHERE id = NEW.template_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_template_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON template_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_template_rating();

-- Validation functions
CREATE OR REPLACE FUNCTION validate_wizard_steps(steps JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    step JSONB;
BEGIN
    -- Check if steps is an array
    IF jsonb_typeof(steps) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Validate each step
    FOR step IN SELECT jsonb_array_elements(steps)
    LOOP
        -- Check required fields
        IF NOT (step ? 'id' AND step ? 'name' AND step ? 'title') THEN
            RETURN FALSE;
        END IF;
        
        -- Check order is positive
        IF (step->>'order')::INTEGER <= 0 THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_import_settings(settings JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if settings is an object
    IF jsonb_typeof(settings) != 'object' THEN
        RETURN FALSE;
    END IF;
    
    -- Validate batch size if present
    IF settings ? 'batchSize' THEN
        IF (settings->>'batchSize')::INTEGER <= 0 THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Validate max errors if present
    IF settings ? 'maxErrorsAllowed' THEN
        IF (settings->>'maxErrorsAllowed')::INTEGER < 0 THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add validation constraints
ALTER TABLE data_import_wizards
ADD CONSTRAINT valid_steps CHECK (validate_wizard_steps(steps));

ALTER TABLE data_import_wizards
ADD CONSTRAINT valid_settings CHECK (validate_import_settings(settings));

-- Row Level Security (RLS) Policies
ALTER TABLE data_import_wizards ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wizard_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_validators ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_transformers ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wizard_configurations ENABLE ROW LEVEL SECURITY;

-- Data Import Wizards policies
CREATE POLICY "Users can view own wizards" ON data_import_wizards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wizards" ON data_import_wizards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wizards" ON data_import_wizards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wizards" ON data_import_wizards
    FOR DELETE USING (auth.uid() = user_id);

-- Import Templates policies
CREATE POLICY "Users can view own templates and public templates" ON import_templates
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own templates" ON import_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON import_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON import_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Template Reviews policies
CREATE POLICY "Users can view all template reviews" ON template_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own template reviews" ON template_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own template reviews" ON template_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own template reviews" ON template_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Template Versions policies
CREATE POLICY "Users can view template versions for accessible templates" ON template_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM import_templates
            WHERE id = template_versions.template_id
            AND (user_id = auth.uid() OR is_public = true)
        )
    );

CREATE POLICY "Users can insert template versions for own templates" ON template_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM import_templates
            WHERE id = template_versions.template_id
            AND user_id = auth.uid()
        )
    );

-- Import History policies
CREATE POLICY "Users can view own import history" ON import_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import history" ON import_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wizard Steps policies
CREATE POLICY "Users can view wizard steps for own wizards" ON wizard_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM data_import_wizards
            WHERE id = wizard_steps.wizard_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert wizard steps for own wizards" ON wizard_steps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_import_wizards
            WHERE id = wizard_steps.wizard_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update wizard steps for own wizards" ON wizard_steps
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM data_import_wizards
            WHERE id = wizard_steps.wizard_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete wizard steps for own wizards" ON wizard_steps
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM data_import_wizards
            WHERE id = wizard_steps.wizard_id
            AND user_id = auth.uid()
        )
    );

-- Data Quality Issues policies
CREATE POLICY "Users can view quality issues for own wizards" ON data_quality_issues
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM data_import_wizards
            WHERE id = data_quality_issues.wizard_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert quality issues for own wizards" ON data_quality_issues
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_import_wizards
            WHERE id = data_quality_issues.wizard_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update quality issues for own wizards" ON data_quality_issues
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM data_import_wizards
            WHERE id = data_quality_issues.wizard_id
            AND user_id = auth.uid()
        )
    );

-- Import Errors policies
CREATE POLICY "Users can view import errors for own wizards" ON import_errors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM data_import_wizards
            WHERE id = import_errors.wizard_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert import errors for own wizards" ON import_errors
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_import_wizards
            WHERE id = import_errors.wizard_id
            AND user_id = auth.uid()
        )
    );

-- Custom Validators policies
CREATE POLICY "Users can view own custom validators" ON custom_validators
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom validators" ON custom_validators
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom validators" ON custom_validators
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom validators" ON custom_validators
    FOR DELETE USING (auth.uid() = user_id);

-- Custom Transformers policies
CREATE POLICY "Users can view own custom transformers" ON custom_transformers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom transformers" ON custom_transformers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom transformers" ON custom_transformers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom transformers" ON custom_transformers
    FOR DELETE USING (auth.uid() = user_id);

-- Import Hooks policies
CREATE POLICY "Users can view own import hooks" ON import_hooks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import hooks" ON import_hooks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own import hooks" ON import_hooks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own import hooks" ON import_hooks
    FOR DELETE USING (auth.uid() = user_id);

-- Wizard Configurations policies
CREATE POLICY "Users can view own wizard configurations" ON wizard_configurations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wizard configurations" ON wizard_configurations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wizard configurations" ON wizard_configurations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wizard configurations" ON wizard_configurations
    FOR DELETE USING (auth.uid() = user_id);

-- Create helpful views
CREATE VIEW wizard_summary AS
SELECT 
    w.*,
    t.name AS template_name,
    t.template_type AS template_type,
    (
        SELECT COUNT(*)
        FROM wizard_steps ws
        WHERE ws.wizard_id = w.id
    ) AS total_steps,
    (
        SELECT COUNT(*)
        FROM wizard_steps ws
        WHERE ws.wizard_id = w.id AND ws.is_completed = true
    ) AS completed_steps_count,
    (
        SELECT COUNT(*)
        FROM data_quality_issues dqi
        WHERE dqi.wizard_id = w.id AND dqi.is_resolved = false
    ) AS unresolved_issues_count,
    (
        SELECT COUNT(*)
        FROM import_errors ie
        WHERE ie.wizard_id = w.id
    ) AS error_count
FROM data_import_wizards w
LEFT JOIN import_templates t ON w.template_id = t.id;

CREATE VIEW template_summary AS
SELECT 
    t.*,
    (
        SELECT COUNT(*)
        FROM template_reviews tr
        WHERE tr.template_id = t.id
    ) AS review_count,
    (
        SELECT COUNT(*)
        FROM data_import_wizards w
        WHERE w.template_id = t.id
    ) AS wizard_count
FROM import_templates t;

CREATE VIEW import_statistics AS
SELECT 
    user_id,
    COUNT(*) AS total_wizards,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_wizards,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_wizards,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress_wizards,
    AVG(CASE WHEN status = 'completed' THEN progress END) AS avg_completion_progress,
    (
        SELECT COUNT(*)
        FROM import_history ih
        WHERE ih.user_id = w.user_id
    ) AS total_imports,
    (
        SELECT COUNT(*)
        FROM import_history ih
        WHERE ih.user_id = w.user_id AND ih.success = true
    ) AS successful_imports,
    (
        SELECT AVG(duration)
        FROM import_history ih
        WHERE ih.user_id = w.user_id
    ) AS avg_import_duration
FROM data_import_wizards w
GROUP BY user_id;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create initial system templates
INSERT INTO import_templates (
    id,
    user_id,
    name,
    description,
    template_type,
    category,
    schema,
    steps,
    settings,
    is_public,
    is_system,
    tags,
    version
) VALUES (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000000', -- System user
    'Portfolio CSV Import',
    'Standard template for importing portfolio data from CSV files',
    'portfolio',
    'Standard',
    '{"fields": [{"name": "symbol", "type": "string", "isRequired": true}, {"name": "quantity", "type": "number", "isRequired": true}, {"name": "price", "type": "currency", "isRequired": true}]}',
    '[{"id": "upload", "name": "upload", "title": "Upload File", "description": "Upload your CSV file", "order": 1, "isRequired": true}, {"id": "mapping", "name": "mapping", "title": "Map Fields", "description": "Map CSV columns to portfolio fields", "order": 2, "isRequired": true}]',
    '{"strictValidation": true, "duplicateHandling": "skip", "batchSize": 100}',
    true,
    true,
    ARRAY['portfolio', 'csv', 'standard'],
    '1.0.0'
), (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000000', -- System user
    'Transaction History Import',
    'Template for importing transaction history from various formats',
    'transactions',
    'Standard',
    '{"fields": [{"name": "date", "type": "date", "isRequired": true}, {"name": "symbol", "type": "string", "isRequired": true}, {"name": "type", "type": "string", "isRequired": true}, {"name": "quantity", "type": "number", "isRequired": true}, {"name": "price", "type": "currency", "isRequired": true}]}',
    '[{"id": "upload", "name": "upload", "title": "Upload File", "description": "Upload your transaction file", "order": 1, "isRequired": true}, {"id": "mapping", "name": "mapping", "title": "Map Fields", "description": "Map file columns to transaction fields", "order": 2, "isRequired": true}]',
    '{"strictValidation": false, "duplicateHandling": "update", "batchSize": 500}',
    true,
    true,
    ARRAY['transactions', 'history', 'standard'],
    '1.0.0'
);

-- Add comments for documentation
COMMENT ON TABLE data_import_wizards IS 'Main table for data import wizards with step-by-step import process';
COMMENT ON TABLE import_templates IS 'Reusable templates for common import scenarios';
COMMENT ON TABLE template_reviews IS 'User reviews and ratings for import templates';
COMMENT ON TABLE template_versions IS 'Version history for import templates';
COMMENT ON TABLE import_history IS 'Historical record of completed imports';
COMMENT ON TABLE wizard_steps IS 'Detailed tracking of individual wizard steps';
COMMENT ON TABLE data_quality_issues IS 'Issues found during data quality assessment';
COMMENT ON TABLE import_errors IS 'Errors encountered during import process';
COMMENT ON TABLE custom_validators IS 'User-defined validation functions';
COMMENT ON TABLE custom_transformers IS 'User-defined data transformation functions';
COMMENT ON TABLE import_hooks IS 'User-defined hooks for import process events';
COMMENT ON TABLE wizard_configurations IS 'Reusable configurations for import wizards'; 