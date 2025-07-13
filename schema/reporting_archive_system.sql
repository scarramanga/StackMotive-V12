-- Block 54: Reporting Archive System Schema

-- Report templates
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('portfolio', 'performance', 'tax', 'risk', 'compliance', 'custom')),
    category VARCHAR(50) NOT NULL,
    
    -- Template configuration
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    
    -- Template structure
    sections JSONB NOT NULL DEFAULT '[]',
    parameters JSONB NOT NULL DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    
    -- Formatting options
    format_options JSONB DEFAULT '{}',
    output_formats JSONB DEFAULT '["pdf", "excel", "csv"]',
    
    -- Schedule settings
    is_scheduled BOOLEAN DEFAULT false,
    schedule_config JSONB,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Generated reports
CREATE TABLE generated_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Report metadata
    report_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    
    -- Generation details
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by VARCHAR(50) DEFAULT 'manual' CHECK (generated_by IN ('manual', 'scheduled', 'api', 'trigger')),
    
    -- Data period
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed', 'archived', 'deleted')),
    error_message TEXT,
    
    -- File information
    file_path VARCHAR(500),
    file_name VARCHAR(200),
    file_size INTEGER,
    file_format VARCHAR(20),
    mime_type VARCHAR(100),
    
    -- Archive information
    archived_at TIMESTAMP WITH TIME ZONE,
    archive_location VARCHAR(500),
    retention_until TIMESTAMP WITH TIME ZONE,
    
    -- Access control
    is_public BOOLEAN DEFAULT false,
    access_level VARCHAR(20) DEFAULT 'private' CHECK (access_level IN ('private', 'shared', 'public')),
    
    -- Report content metadata
    data_sources JSONB DEFAULT '[]',
    parameters_used JSONB DEFAULT '{}',
    filters_applied JSONB DEFAULT '{}',
    
    -- Performance metrics
    generation_time_ms INTEGER,
    data_points_count INTEGER,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report sharing and access
CREATE TABLE report_access_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES generated_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('view', 'download', 'share', 'edit')),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(report_id, user_id, permission_type)
);

-- Archive storage locations
CREATE TABLE archive_storage_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    storage_type VARCHAR(50) NOT NULL CHECK (storage_type IN ('local', 's3', 'gcs', 'azure', 'ftp', 'sftp')),
    
    -- Storage configuration
    config JSONB NOT NULL DEFAULT '{}',
    credentials JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    
    -- Capacity and usage
    storage_quota INTEGER, -- in MB
    used_space INTEGER DEFAULT 0,
    
    -- Health check
    last_health_check TIMESTAMP WITH TIME ZONE,
    health_status VARCHAR(20) DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'warning', 'error', 'unknown')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Report schedules
CREATE TABLE report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Schedule configuration
    is_active BOOLEAN DEFAULT true,
    
    -- Cron expression for scheduling
    cron_expression VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Generation settings
    parameters JSONB DEFAULT '{}',
    output_format VARCHAR(20) DEFAULT 'pdf',
    
    -- Distribution settings
    auto_archive BOOLEAN DEFAULT true,
    archive_location_id UUID REFERENCES archive_storage_locations(id) ON DELETE SET NULL,
    
    -- Notification settings
    notify_on_completion BOOLEAN DEFAULT true,
    notify_on_failure BOOLEAN DEFAULT true,
    notification_emails JSONB DEFAULT '[]',
    
    -- Execution tracking
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error', 'stopped')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report generation queue
CREATE TABLE report_generation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
    report_id UUID REFERENCES generated_reports(id) ON DELETE CASCADE,
    
    -- Queue metadata
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Generation parameters
    parameters JSONB DEFAULT '{}',
    
    -- Processing details
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Worker information
    worker_id VARCHAR(100),
    processing_node VARCHAR(100),
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report audit trail
CREATE TABLE report_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES generated_reports(id) ON DELETE CASCADE,
    
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'viewed', 'downloaded', 'shared', 'archived', 'deleted', 'modified')),
    details TEXT,
    
    -- Context information
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_report_templates_user_id ON report_templates(user_id);
CREATE INDEX idx_report_templates_type ON report_templates(template_type);
CREATE INDEX idx_generated_reports_user_id ON generated_reports(user_id);
CREATE INDEX idx_generated_reports_template_id ON generated_reports(template_id);
CREATE INDEX idx_generated_reports_status ON generated_reports(status);
CREATE INDEX idx_generated_reports_generated_at ON generated_reports(generated_at);
CREATE INDEX idx_report_access_permissions_report_id ON report_access_permissions(report_id);
CREATE INDEX idx_report_access_permissions_user_id ON report_access_permissions(user_id);
CREATE INDEX idx_archive_storage_locations_user_id ON archive_storage_locations(user_id);
CREATE INDEX idx_report_schedules_user_id ON report_schedules(user_id);
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run);
CREATE INDEX idx_report_generation_queue_status ON report_generation_queue(status);
CREATE INDEX idx_report_generation_queue_priority ON report_generation_queue(priority);
CREATE INDEX idx_report_audit_trail_user_id ON report_audit_trail(user_id);
CREATE INDEX idx_report_audit_trail_report_id ON report_audit_trail(report_id);
CREATE INDEX idx_report_audit_trail_created_at ON report_audit_trail(created_at);

-- RLS Policies
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_access_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_audit_trail ENABLE ROW LEVEL SECURITY;

-- Users can manage their own templates and reports
CREATE POLICY "Users can manage own templates" ON report_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reports" ON generated_reports
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own storage locations" ON archive_storage_locations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own schedules" ON report_schedules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own queue items" ON report_generation_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own audit trail" ON report_audit_trail
    FOR SELECT USING (auth.uid() = user_id);

-- Shared report access through permissions
CREATE POLICY "Users can access shared reports" ON generated_reports
    FOR SELECT USING (
        id IN (
            SELECT report_id FROM report_access_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type = 'view'
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

-- Permission management
CREATE POLICY "Users can manage permissions for their reports" ON report_access_permissions
    FOR ALL USING (
        report_id IN (
            SELECT id FROM generated_reports WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view permissions granted to them" ON report_access_permissions
    FOR SELECT USING (user_id = auth.uid());

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_reports_updated_at BEFORE UPDATE ON generated_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_archive_storage_locations_updated_at BEFORE UPDATE ON archive_storage_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_schedules_updated_at BEFORE UPDATE ON report_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_generation_queue_updated_at BEFORE UPDATE ON report_generation_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 