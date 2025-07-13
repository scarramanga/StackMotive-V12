-- Block 15: Onboarding Flow - Database Schema
-- Comprehensive user onboarding and preference management system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- User Onboarding Progress Table
CREATE TABLE IF NOT EXISTS user_onboarding_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Progress Tracking
    current_step INTEGER DEFAULT 1, -- Current step (1-5)
    completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Array of completed step numbers
    is_complete BOOLEAN DEFAULT false,
    completion_percentage DECIMAL(5,2) DEFAULT 0.0, -- 0-100%
    
    -- Step-specific data storage
    welcome_viewed BOOLEAN DEFAULT false,
    welcome_viewed_at TIMESTAMPTZ,
    
    -- Portfolio preferences (Step 2)
    trading_experience TEXT, -- 'beginner', 'intermediate', 'advanced', 'expert'
    risk_tolerance TEXT, -- 'conservative', 'moderate', 'aggressive'
    investment_horizon TEXT, -- 'short', 'medium', 'long'
    initial_investment DECIMAL(15,2),
    trading_frequency TEXT, -- 'daily', 'weekly', 'monthly', 'occasional'
    preferred_markets TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['NZX', 'ASX', 'NYSE', 'NASDAQ', 'Crypto']
    
    -- Personal info (Step 3)
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    preferred_currency TEXT DEFAULT 'NZD', -- 'NZD', 'AUD', 'USD'
    date_of_birth DATE,
    
    -- Tax information (Step 4)
    tax_residency TEXT,
    secondary_tax_residency TEXT,
    tax_identification_number TEXT,
    tax_file_number TEXT,
    employment_status TEXT, -- 'employed', 'self_employed', 'student', 'retired', 'other'
    tax_year_preference TEXT DEFAULT 'calendar', -- 'calendar', 'nz_fiscal', 'au_fiscal'
    tax_registered_business BOOLEAN DEFAULT false,
    
    -- Platform preferences
    help_level TEXT DEFAULT 'guided', -- 'minimal', 'guided', 'detailed'
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    privacy_settings JSONB DEFAULT '{"profile_public": false, "performance_public": false}',
    
    -- Broker connections and setup
    connect_brokers BOOLEAN DEFAULT false,
    selected_brokers TEXT[] DEFAULT ARRAY[]::TEXT[],
    has_existing_portfolio BOOLEAN DEFAULT false,
    existing_portfolio_value DECIMAL(15,2),
    
    -- Terms and conditions
    terms_accepted BOOLEAN DEFAULT false,
    terms_accepted_at TIMESTAMPTZ,
    privacy_policy_accepted BOOLEAN DEFAULT false,
    privacy_policy_accepted_at TIMESTAMPTZ,
    
    -- Session and tracking
    session_id TEXT,
    user_agent TEXT,
    ip_address INET,
    referral_source TEXT,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- User Trading Preferences Table
CREATE TABLE IF NOT EXISTS user_trading_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Trading Style Preferences
    trading_style TEXT DEFAULT 'balanced', -- 'conservative', 'balanced', 'aggressive', 'speculative'
    strategy_preference TEXT DEFAULT 'mixed', -- 'technical', 'fundamental', 'mixed', 'algorithmic'
    position_sizing_method TEXT DEFAULT 'percentage', -- 'fixed_amount', 'percentage', 'volatility_based'
    default_position_size DECIMAL(5,2) DEFAULT 5.0, -- Default position size as percentage
    
    -- Risk Management
    max_position_size DECIMAL(5,2) DEFAULT 20.0, -- Maximum position size as percentage
    stop_loss_percentage DECIMAL(5,2) DEFAULT 10.0, -- Default stop loss percentage
    take_profit_percentage DECIMAL(5,2) DEFAULT 20.0, -- Default take profit percentage
    max_daily_trades INTEGER DEFAULT 10,
    max_weekly_trades INTEGER DEFAULT 50,
    
    -- Portfolio Allocation
    cash_allocation_target DECIMAL(5,2) DEFAULT 10.0, -- Target cash percentage
    equity_allocation_target DECIMAL(5,2) DEFAULT 70.0, -- Target equity percentage
    bond_allocation_target DECIMAL(5,2) DEFAULT 15.0, -- Target bond percentage
    alternative_allocation_target DECIMAL(5,2) DEFAULT 5.0, -- Target alternatives percentage
    
    -- Rebalancing Preferences
    auto_rebalance_enabled BOOLEAN DEFAULT true,
    rebalance_threshold DECIMAL(5,2) DEFAULT 5.0, -- Rebalance when drift exceeds this percentage
    rebalance_frequency TEXT DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'quarterly'
    
    -- Currency and Localization
    base_currency TEXT DEFAULT 'NZD',
    currency_hedging_preference TEXT DEFAULT 'auto', -- 'none', 'partial', 'full', 'auto'
    
    -- Tax Optimization
    tax_loss_harvesting_enabled BOOLEAN DEFAULT true,
    franking_credits_consideration BOOLEAN DEFAULT true, -- For AU investors
    nz_tax_optimization BOOLEAN DEFAULT true, -- For NZ investors
    
    -- Notifications and Alerts
    price_alert_threshold DECIMAL(5,2) DEFAULT 5.0, -- Alert when price moves > X%
    portfolio_alert_threshold DECIMAL(5,2) DEFAULT 10.0, -- Alert when portfolio moves > X%
    news_alert_enabled BOOLEAN DEFAULT true,
    signal_alert_enabled BOOLEAN DEFAULT true,
    
    -- Platform Behavior
    auto_save_enabled BOOLEAN DEFAULT true,
    advanced_mode_enabled BOOLEAN DEFAULT false,
    paper_trading_enabled BOOLEAN DEFAULT true,
    real_trading_enabled BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Onboarding Step Templates Table
CREATE TABLE IF NOT EXISTS onboarding_step_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    step_title TEXT NOT NULL,
    step_description TEXT,
    
    -- Content and configuration
    required_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
    optional_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
    validation_rules JSONB DEFAULT '{}',
    
    -- Display configuration
    component_name TEXT,
    display_order INTEGER,
    is_skippable BOOLEAN DEFAULT false,
    min_time_seconds INTEGER DEFAULT 0, -- Minimum time to spend on step
    
    -- Help and guidance
    help_text TEXT,
    tooltip_text TEXT,
    example_data JSONB DEFAULT '{}',
    
    -- Versioning
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(step_number, version)
);

-- User Onboarding Analytics Table
CREATE TABLE IF NOT EXISTS user_onboarding_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Step-specific analytics
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    
    -- Timing analytics
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER, -- Time spent on this step
    
    -- Interaction analytics
    field_interactions JSONB DEFAULT '{}', -- Track which fields were focused/changed
    validation_errors JSONB DEFAULT '[]', -- Track validation errors encountered
    help_requests INTEGER DEFAULT 0, -- Number of times help was accessed
    
    -- Completion analytics
    completion_method TEXT, -- 'completed', 'skipped', 'abandoned'
    retry_count INTEGER DEFAULT 0, -- Number of times step was attempted
    
    -- Technical analytics
    device_type TEXT, -- 'desktop', 'tablet', 'mobile'
    browser TEXT,
    screen_resolution TEXT,
    
    -- Data quality
    form_completion_percentage DECIMAL(5,2) DEFAULT 0.0, -- Percentage of fields completed
    data_accuracy_score DECIMAL(5,2) DEFAULT 0.0, -- Estimated data accuracy
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profile Information Table (Extended)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    linkedin_url TEXT,
    twitter_handle TEXT,
    
    -- Investment Profile
    investment_goals TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['retirement', 'wealth_building', 'income', 'speculation']
    financial_situation TEXT, -- 'student', 'early_career', 'established', 'pre_retirement', 'retired'
    annual_income_range TEXT, -- 'under_50k', '50k_100k', '100k_200k', '200k_plus'
    net_worth_range TEXT, -- 'under_100k', '100k_500k', '500k_1m', '1m_plus'
    
    -- Experience and Knowledge
    years_trading_experience INTEGER DEFAULT 0,
    investment_knowledge_level TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced', 'expert'
    certifications TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['CFA', 'FRM', 'CFP', etc.]
    
    -- Platform Usage
    signup_source TEXT, -- 'organic', 'referral', 'advertisement', 'social_media'
    referral_code TEXT,
    referred_by_user_id UUID,
    
    -- Preferences and Settings
    timezone TEXT DEFAULT 'Pacific/Auckland',
    language_preference TEXT DEFAULT 'en',
    email_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'never'
    
    -- Privacy and Sharing
    profile_visibility TEXT DEFAULT 'private', -- 'public', 'followers', 'private'
    allow_performance_sharing BOOLEAN DEFAULT false,
    allow_strategy_sharing BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trading_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_step_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User onboarding progress policies
CREATE POLICY "Users can manage own onboarding progress" ON user_onboarding_progress
    FOR ALL USING (auth.uid() = user_id);

-- User trading preferences policies
CREATE POLICY "Users can manage own trading preferences" ON user_trading_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Onboarding step templates policies (public read)
CREATE POLICY "Anyone can view onboarding templates" ON onboarding_step_templates
    FOR SELECT USING (is_active = true);

-- User onboarding analytics policies
CREATE POLICY "Users can view own onboarding analytics" ON user_onboarding_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert onboarding analytics" ON user_onboarding_analytics
    FOR INSERT WITH CHECK (true);

-- User profiles policies
CREATE POLICY "Users can manage own profiles" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable" ON user_profiles
    FOR SELECT USING (profile_visibility = 'public' OR auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_onboarding_progress_user_id ON user_onboarding_progress(user_id);
CREATE INDEX idx_user_onboarding_progress_current_step ON user_onboarding_progress(current_step);
CREATE INDEX idx_user_onboarding_progress_is_complete ON user_onboarding_progress(is_complete);
CREATE INDEX idx_user_onboarding_progress_completion_percentage ON user_onboarding_progress(completion_percentage);

CREATE INDEX idx_user_trading_preferences_user_id ON user_trading_preferences(user_id);
CREATE INDEX idx_user_trading_preferences_trading_style ON user_trading_preferences(trading_style);
CREATE INDEX idx_user_trading_preferences_base_currency ON user_trading_preferences(base_currency);

CREATE INDEX idx_onboarding_step_templates_step_number ON onboarding_step_templates(step_number);
CREATE INDEX idx_onboarding_step_templates_is_active ON onboarding_step_templates(is_active);
CREATE INDEX idx_onboarding_step_templates_display_order ON onboarding_step_templates(display_order);

CREATE INDEX idx_user_onboarding_analytics_user_id ON user_onboarding_analytics(user_id);
CREATE INDEX idx_user_onboarding_analytics_step_number ON user_onboarding_analytics(step_number);
CREATE INDEX idx_user_onboarding_analytics_started_at ON user_onboarding_analytics(started_at);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX idx_user_profiles_profile_visibility ON user_profiles(profile_visibility);

-- Updated timestamp triggers
CREATE TRIGGER update_user_onboarding_progress_updated_at
    BEFORE UPDATE ON user_onboarding_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_trading_preferences_updated_at
    BEFORE UPDATE ON user_trading_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_step_templates_updated_at
    BEFORE UPDATE ON onboarding_step_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for onboarding management
CREATE OR REPLACE FUNCTION start_user_onboarding(
    p_user_id UUID,
    p_session_id TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_referral_source TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    progress_id UUID;
BEGIN
    INSERT INTO user_onboarding_progress (
        user_id, session_id, user_agent, ip_address, referral_source,
        current_step, welcome_viewed
    )
    VALUES (
        p_user_id, p_session_id, p_user_agent, p_ip_address, p_referral_source,
        1, false
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        session_id = EXCLUDED.session_id,
        last_active_at = NOW()
    RETURNING id INTO progress_id;
    
    RETURN progress_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_onboarding_step(
    p_user_id UUID,
    p_step_number INTEGER,
    p_step_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    current_step_num INTEGER;
    completion_pct DECIMAL(5,2);
BEGIN
    -- Get current step
    SELECT current_step INTO current_step_num
    FROM user_onboarding_progress
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User onboarding not found';
    END IF;
    
    -- Update step data based on step number
    CASE p_step_number
        WHEN 1 THEN
            UPDATE user_onboarding_progress
            SET welcome_viewed = true,
                welcome_viewed_at = NOW(),
                current_step = GREATEST(current_step, 2),
                completed_steps = array_append(completed_steps, 1),
                last_active_at = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 2 THEN
            UPDATE user_onboarding_progress
            SET trading_experience = p_step_data->>'tradingExperience',
                risk_tolerance = p_step_data->>'riskTolerance',
                investment_horizon = p_step_data->>'investmentHorizon',
                initial_investment = (p_step_data->>'initialInvestment')::DECIMAL,
                trading_frequency = p_step_data->>'tradingFrequency',
                preferred_markets = ARRAY(SELECT jsonb_array_elements_text(p_step_data->'preferredMarkets')),
                current_step = GREATEST(current_step, 3),
                completed_steps = array_append(completed_steps, 2),
                last_active_at = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 3 THEN
            UPDATE user_onboarding_progress
            SET full_name = p_step_data->>'fullName',
                first_name = p_step_data->>'firstName',
                last_name = p_step_data->>'lastName',
                phone_number = p_step_data->>'phoneNumber',
                preferred_currency = p_step_data->>'preferredCurrency',
                date_of_birth = (p_step_data->>'dateOfBirth')::DATE,
                current_step = GREATEST(current_step, 4),
                completed_steps = array_append(completed_steps, 3),
                last_active_at = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 4 THEN
            UPDATE user_onboarding_progress
            SET tax_residency = p_step_data->>'taxResidency',
                secondary_tax_residency = p_step_data->>'secondaryTaxResidency',
                tax_identification_number = p_step_data->>'taxIdentificationNumber',
                tax_file_number = p_step_data->>'taxFileNumber',
                employment_status = p_step_data->>'employmentStatus',
                tax_year_preference = p_step_data->>'taxYearPreference',
                tax_registered_business = (p_step_data->>'taxRegisteredBusiness')::BOOLEAN,
                current_step = GREATEST(current_step, 5),
                completed_steps = array_append(completed_steps, 4),
                last_active_at = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 5 THEN
            -- Final step - mark as complete
            UPDATE user_onboarding_progress
            SET terms_accepted = true,
                terms_accepted_at = NOW(),
                privacy_policy_accepted = true,
                privacy_policy_accepted_at = NOW(),
                is_complete = true,
                completed_at = NOW(),
                current_step = 5,
                completed_steps = array_append(completed_steps, 5),
                completion_percentage = 100.0,
                last_active_at = NOW()
            WHERE user_id = p_user_id;
            
    END CASE;
    
    -- Calculate completion percentage
    completion_pct := (array_length(
        (SELECT completed_steps FROM user_onboarding_progress WHERE user_id = p_user_id), 1
    ) * 100.0 / 5.0);
    
    UPDATE user_onboarding_progress
    SET completion_percentage = completion_pct
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_user_onboarding(
    p_user_id UUID,
    p_final_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    progress_record RECORD;
BEGIN
    -- Get onboarding progress
    SELECT * INTO progress_record
    FROM user_onboarding_progress
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User onboarding not found';
    END IF;
    
    -- Mark onboarding as complete
    UPDATE user_onboarding_progress
    SET is_complete = true,
        completed_at = NOW(),
        completion_percentage = 100.0,
        current_step = 5,
        terms_accepted = true,
        terms_accepted_at = NOW(),
        privacy_policy_accepted = true,
        privacy_policy_accepted_at = NOW(),
        last_active_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Create trading preferences record
    INSERT INTO user_trading_preferences (
        user_id,
        trading_style,
        base_currency,
        auto_rebalance_enabled,
        paper_trading_enabled
    )
    VALUES (
        p_user_id,
        CASE 
            WHEN progress_record.risk_tolerance = 'conservative' THEN 'conservative'
            WHEN progress_record.risk_tolerance = 'aggressive' THEN 'aggressive'
            ELSE 'balanced'
        END,
        COALESCE(progress_record.preferred_currency, 'NZD'),
        true,
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET
        trading_style = EXCLUDED.trading_style,
        base_currency = EXCLUDED.base_currency,
        updated_at = NOW();
    
    -- Create user profile record
    INSERT INTO user_profiles (
        user_id,
        display_name,
        investment_knowledge_level,
        base_currency,
        timezone
    )
    VALUES (
        p_user_id,
        progress_record.full_name,
        COALESCE(progress_record.trading_experience, 'beginner'),
        COALESCE(progress_record.preferred_currency, 'NZD'),
        CASE 
            WHEN progress_record.preferred_currency = 'AUD' THEN 'Australia/Sydney'
            WHEN progress_record.preferred_currency = 'USD' THEN 'America/New_York'
            ELSE 'Pacific/Auckland'
        END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        investment_knowledge_level = EXCLUDED.investment_knowledge_level,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_onboarding_analytics(
    p_user_id UUID
)
RETURNS TABLE (
    total_time_seconds INTEGER,
    steps_completed INTEGER,
    completion_rate DECIMAL(5,2),
    average_step_time DECIMAL(8,2),
    help_requests_total INTEGER,
    retry_count_total INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(time_spent_seconds), 0)::INTEGER as total_time_seconds,
        COUNT(DISTINCT step_number)::INTEGER as steps_completed,
        (COUNT(DISTINCT CASE WHEN completion_method = 'completed' THEN step_number END) * 100.0 / 5.0)::DECIMAL(5,2) as completion_rate,
        COALESCE(AVG(time_spent_seconds), 0)::DECIMAL(8,2) as average_step_time,
        COALESCE(SUM(help_requests), 0)::INTEGER as help_requests_total,
        COALESCE(SUM(retry_count), 0)::INTEGER as retry_count_total
    FROM user_onboarding_analytics
    WHERE user_onboarding_analytics.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default onboarding step templates
INSERT INTO onboarding_step_templates (
    step_number, step_name, step_title, step_description, 
    required_fields, optional_fields, component_name, display_order
) VALUES 
(1, 'welcome', 'Welcome to StackMotive', 'Get started with your trading journey', 
 ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'StepWelcome', 1),
 
(2, 'portfolio', 'Portfolio Preferences', 'Configure your trading style and risk tolerance',
 ARRAY['tradingExperience', 'riskTolerance', 'investmentHorizon']::TEXT[], 
 ARRAY['initialInvestment', 'tradingFrequency', 'preferredMarkets']::TEXT[], 
 'StepPortfolio', 2),
 
(3, 'personal', 'Personal Information', 'Tell us about yourself',
 ARRAY['fullName', 'preferredCurrency']::TEXT[], 
 ARRAY['phoneNumber', 'dateOfBirth']::TEXT[], 
 'StepPersonalInfo', 3),
 
(4, 'tax', 'Tax Information', 'Configure your tax settings',
 ARRAY['taxResidency', 'employmentStatus']::TEXT[], 
 ARRAY['taxIdentificationNumber', 'taxFileNumber', 'taxYearPreference']::TEXT[], 
 'StepTaxInfo', 4),
 
(5, 'summary', 'Review & Complete', 'Review your information and complete setup',
 ARRAY['termsAccepted']::TEXT[], 
 ARRAY[]::TEXT[], 
 'StepSummary', 5)

ON CONFLICT (step_number, version) DO NOTHING; 
-- Comprehensive user onboarding and preference management system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- User Onboarding Progress Table
CREATE TABLE IF NOT EXISTS user_onboarding_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Progress Tracking
    current_step INTEGER DEFAULT 1, -- Current step (1-5)
    completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Array of completed step numbers
    is_complete BOOLEAN DEFAULT false,
    completion_percentage DECIMAL(5,2) DEFAULT 0.0, -- 0-100%
    
    -- Step-specific data storage
    welcome_viewed BOOLEAN DEFAULT false,
    welcome_viewed_at TIMESTAMPTZ,
    
    -- Portfolio preferences (Step 2)
    trading_experience TEXT, -- 'beginner', 'intermediate', 'advanced', 'expert'
    risk_tolerance TEXT, -- 'conservative', 'moderate', 'aggressive'
    investment_horizon TEXT, -- 'short', 'medium', 'long'
    initial_investment DECIMAL(15,2),
    trading_frequency TEXT, -- 'daily', 'weekly', 'monthly', 'occasional'
    preferred_markets TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['NZX', 'ASX', 'NYSE', 'NASDAQ', 'Crypto']
    
    -- Personal info (Step 3)
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    preferred_currency TEXT DEFAULT 'NZD', -- 'NZD', 'AUD', 'USD'
    date_of_birth DATE,
    
    -- Tax information (Step 4)
    tax_residency TEXT,
    secondary_tax_residency TEXT,
    tax_identification_number TEXT,
    tax_file_number TEXT,
    employment_status TEXT, -- 'employed', 'self_employed', 'student', 'retired', 'other'
    tax_year_preference TEXT DEFAULT 'calendar', -- 'calendar', 'nz_fiscal', 'au_fiscal'
    tax_registered_business BOOLEAN DEFAULT false,
    
    -- Platform preferences
    help_level TEXT DEFAULT 'guided', -- 'minimal', 'guided', 'detailed'
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    privacy_settings JSONB DEFAULT '{"profile_public": false, "performance_public": false}',
    
    -- Broker connections and setup
    connect_brokers BOOLEAN DEFAULT false,
    selected_brokers TEXT[] DEFAULT ARRAY[]::TEXT[],
    has_existing_portfolio BOOLEAN DEFAULT false,
    existing_portfolio_value DECIMAL(15,2),
    
    -- Terms and conditions
    terms_accepted BOOLEAN DEFAULT false,
    terms_accepted_at TIMESTAMPTZ,
    privacy_policy_accepted BOOLEAN DEFAULT false,
    privacy_policy_accepted_at TIMESTAMPTZ,
    
    -- Session and tracking
    session_id TEXT,
    user_agent TEXT,
    ip_address INET,
    referral_source TEXT,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- User Trading Preferences Table
CREATE TABLE IF NOT EXISTS user_trading_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Trading Style Preferences
    trading_style TEXT DEFAULT 'balanced', -- 'conservative', 'balanced', 'aggressive', 'speculative'
    strategy_preference TEXT DEFAULT 'mixed', -- 'technical', 'fundamental', 'mixed', 'algorithmic'
    position_sizing_method TEXT DEFAULT 'percentage', -- 'fixed_amount', 'percentage', 'volatility_based'
    default_position_size DECIMAL(5,2) DEFAULT 5.0, -- Default position size as percentage
    
    -- Risk Management
    max_position_size DECIMAL(5,2) DEFAULT 20.0, -- Maximum position size as percentage
    stop_loss_percentage DECIMAL(5,2) DEFAULT 10.0, -- Default stop loss percentage
    take_profit_percentage DECIMAL(5,2) DEFAULT 20.0, -- Default take profit percentage
    max_daily_trades INTEGER DEFAULT 10,
    max_weekly_trades INTEGER DEFAULT 50,
    
    -- Portfolio Allocation
    cash_allocation_target DECIMAL(5,2) DEFAULT 10.0, -- Target cash percentage
    equity_allocation_target DECIMAL(5,2) DEFAULT 70.0, -- Target equity percentage
    bond_allocation_target DECIMAL(5,2) DEFAULT 15.0, -- Target bond percentage
    alternative_allocation_target DECIMAL(5,2) DEFAULT 5.0, -- Target alternatives percentage
    
    -- Rebalancing Preferences
    auto_rebalance_enabled BOOLEAN DEFAULT true,
    rebalance_threshold DECIMAL(5,2) DEFAULT 5.0, -- Rebalance when drift exceeds this percentage
    rebalance_frequency TEXT DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'quarterly'
    
    -- Currency and Localization
    base_currency TEXT DEFAULT 'NZD',
    currency_hedging_preference TEXT DEFAULT 'auto', -- 'none', 'partial', 'full', 'auto'
    
    -- Tax Optimization
    tax_loss_harvesting_enabled BOOLEAN DEFAULT true,
    franking_credits_consideration BOOLEAN DEFAULT true, -- For AU investors
    nz_tax_optimization BOOLEAN DEFAULT true, -- For NZ investors
    
    -- Notifications and Alerts
    price_alert_threshold DECIMAL(5,2) DEFAULT 5.0, -- Alert when price moves > X%
    portfolio_alert_threshold DECIMAL(5,2) DEFAULT 10.0, -- Alert when portfolio moves > X%
    news_alert_enabled BOOLEAN DEFAULT true,
    signal_alert_enabled BOOLEAN DEFAULT true,
    
    -- Platform Behavior
    auto_save_enabled BOOLEAN DEFAULT true,
    advanced_mode_enabled BOOLEAN DEFAULT false,
    paper_trading_enabled BOOLEAN DEFAULT true,
    real_trading_enabled BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Onboarding Step Templates Table
CREATE TABLE IF NOT EXISTS onboarding_step_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    step_title TEXT NOT NULL,
    step_description TEXT,
    
    -- Content and configuration
    required_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
    optional_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
    validation_rules JSONB DEFAULT '{}',
    
    -- Display configuration
    component_name TEXT,
    display_order INTEGER,
    is_skippable BOOLEAN DEFAULT false,
    min_time_seconds INTEGER DEFAULT 0, -- Minimum time to spend on step
    
    -- Help and guidance
    help_text TEXT,
    tooltip_text TEXT,
    example_data JSONB DEFAULT '{}',
    
    -- Versioning
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(step_number, version)
);

-- User Onboarding Analytics Table
CREATE TABLE IF NOT EXISTS user_onboarding_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Step-specific analytics
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    
    -- Timing analytics
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER, -- Time spent on this step
    
    -- Interaction analytics
    field_interactions JSONB DEFAULT '{}', -- Track which fields were focused/changed
    validation_errors JSONB DEFAULT '[]', -- Track validation errors encountered
    help_requests INTEGER DEFAULT 0, -- Number of times help was accessed
    
    -- Completion analytics
    completion_method TEXT, -- 'completed', 'skipped', 'abandoned'
    retry_count INTEGER DEFAULT 0, -- Number of times step was attempted
    
    -- Technical analytics
    device_type TEXT, -- 'desktop', 'tablet', 'mobile'
    browser TEXT,
    screen_resolution TEXT,
    
    -- Data quality
    form_completion_percentage DECIMAL(5,2) DEFAULT 0.0, -- Percentage of fields completed
    data_accuracy_score DECIMAL(5,2) DEFAULT 0.0, -- Estimated data accuracy
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profile Information Table (Extended)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    linkedin_url TEXT,
    twitter_handle TEXT,
    
    -- Investment Profile
    investment_goals TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['retirement', 'wealth_building', 'income', 'speculation']
    financial_situation TEXT, -- 'student', 'early_career', 'established', 'pre_retirement', 'retired'
    annual_income_range TEXT, -- 'under_50k', '50k_100k', '100k_200k', '200k_plus'
    net_worth_range TEXT, -- 'under_100k', '100k_500k', '500k_1m', '1m_plus'
    
    -- Experience and Knowledge
    years_trading_experience INTEGER DEFAULT 0,
    investment_knowledge_level TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced', 'expert'
    certifications TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['CFA', 'FRM', 'CFP', etc.]
    
    -- Platform Usage
    signup_source TEXT, -- 'organic', 'referral', 'advertisement', 'social_media'
    referral_code TEXT,
    referred_by_user_id UUID,
    
    -- Preferences and Settings
    timezone TEXT DEFAULT 'Pacific/Auckland',
    language_preference TEXT DEFAULT 'en',
    email_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'never'
    
    -- Privacy and Sharing
    profile_visibility TEXT DEFAULT 'private', -- 'public', 'followers', 'private'
    allow_performance_sharing BOOLEAN DEFAULT false,
    allow_strategy_sharing BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trading_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_step_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User onboarding progress policies
CREATE POLICY "Users can manage own onboarding progress" ON user_onboarding_progress
    FOR ALL USING (auth.uid() = user_id);

-- User trading preferences policies
CREATE POLICY "Users can manage own trading preferences" ON user_trading_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Onboarding step templates policies (public read)
CREATE POLICY "Anyone can view onboarding templates" ON onboarding_step_templates
    FOR SELECT USING (is_active = true);

-- User onboarding analytics policies
CREATE POLICY "Users can view own onboarding analytics" ON user_onboarding_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert onboarding analytics" ON user_onboarding_analytics
    FOR INSERT WITH CHECK (true);

-- User profiles policies
CREATE POLICY "Users can manage own profiles" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable" ON user_profiles
    FOR SELECT USING (profile_visibility = 'public' OR auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_onboarding_progress_user_id ON user_onboarding_progress(user_id);
CREATE INDEX idx_user_onboarding_progress_current_step ON user_onboarding_progress(current_step);
CREATE INDEX idx_user_onboarding_progress_is_complete ON user_onboarding_progress(is_complete);
CREATE INDEX idx_user_onboarding_progress_completion_percentage ON user_onboarding_progress(completion_percentage);

CREATE INDEX idx_user_trading_preferences_user_id ON user_trading_preferences(user_id);
CREATE INDEX idx_user_trading_preferences_trading_style ON user_trading_preferences(trading_style);
CREATE INDEX idx_user_trading_preferences_base_currency ON user_trading_preferences(base_currency);

CREATE INDEX idx_onboarding_step_templates_step_number ON onboarding_step_templates(step_number);
CREATE INDEX idx_onboarding_step_templates_is_active ON onboarding_step_templates(is_active);
CREATE INDEX idx_onboarding_step_templates_display_order ON onboarding_step_templates(display_order);

CREATE INDEX idx_user_onboarding_analytics_user_id ON user_onboarding_analytics(user_id);
CREATE INDEX idx_user_onboarding_analytics_step_number ON user_onboarding_analytics(step_number);
CREATE INDEX idx_user_onboarding_analytics_started_at ON user_onboarding_analytics(started_at);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX idx_user_profiles_profile_visibility ON user_profiles(profile_visibility);

-- Updated timestamp triggers
CREATE TRIGGER update_user_onboarding_progress_updated_at
    BEFORE UPDATE ON user_onboarding_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_trading_preferences_updated_at
    BEFORE UPDATE ON user_trading_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_step_templates_updated_at
    BEFORE UPDATE ON onboarding_step_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for onboarding management
CREATE OR REPLACE FUNCTION start_user_onboarding(
    p_user_id UUID,
    p_session_id TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_referral_source TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    progress_id UUID;
BEGIN
    INSERT INTO user_onboarding_progress (
        user_id, session_id, user_agent, ip_address, referral_source,
        current_step, welcome_viewed
    )
    VALUES (
        p_user_id, p_session_id, p_user_agent, p_ip_address, p_referral_source,
        1, false
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        session_id = EXCLUDED.session_id,
        last_active_at = NOW()
    RETURNING id INTO progress_id;
    
    RETURN progress_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_onboarding_step(
    p_user_id UUID,
    p_step_number INTEGER,
    p_step_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    current_step_num INTEGER;
    completion_pct DECIMAL(5,2);
BEGIN
    -- Get current step
    SELECT current_step INTO current_step_num
    FROM user_onboarding_progress
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User onboarding not found';
    END IF;
    
    -- Update step data based on step number
    CASE p_step_number
        WHEN 1 THEN
            UPDATE user_onboarding_progress
            SET welcome_viewed = true,
                welcome_viewed_at = NOW(),
                current_step = GREATEST(current_step, 2),
                completed_steps = array_append(completed_steps, 1),
                last_active_at = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 2 THEN
            UPDATE user_onboarding_progress
            SET trading_experience = p_step_data->>'tradingExperience',
                risk_tolerance = p_step_data->>'riskTolerance',
                investment_horizon = p_step_data->>'investmentHorizon',
                initial_investment = (p_step_data->>'initialInvestment')::DECIMAL,
                trading_frequency = p_step_data->>'tradingFrequency',
                preferred_markets = ARRAY(SELECT jsonb_array_elements_text(p_step_data->'preferredMarkets')),
                current_step = GREATEST(current_step, 3),
                completed_steps = array_append(completed_steps, 2),
                last_active_at = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 3 THEN
            UPDATE user_onboarding_progress
            SET full_name = p_step_data->>'fullName',
                first_name = p_step_data->>'firstName',
                last_name = p_step_data->>'lastName',
                phone_number = p_step_data->>'phoneNumber',
                preferred_currency = p_step_data->>'preferredCurrency',
                date_of_birth = (p_step_data->>'dateOfBirth')::DATE,
                current_step = GREATEST(current_step, 4),
                completed_steps = array_append(completed_steps, 3),
                last_active_at = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 4 THEN
            UPDATE user_onboarding_progress
            SET tax_residency = p_step_data->>'taxResidency',
                secondary_tax_residency = p_step_data->>'secondaryTaxResidency',
                tax_identification_number = p_step_data->>'taxIdentificationNumber',
                tax_file_number = p_step_data->>'taxFileNumber',
                employment_status = p_step_data->>'employmentStatus',
                tax_year_preference = p_step_data->>'taxYearPreference',
                tax_registered_business = (p_step_data->>'taxRegisteredBusiness')::BOOLEAN,
                current_step = GREATEST(current_step, 5),
                completed_steps = array_append(completed_steps, 4),
                last_active_at = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 5 THEN
            -- Final step - mark as complete
            UPDATE user_onboarding_progress
            SET terms_accepted = true,
                terms_accepted_at = NOW(),
                privacy_policy_accepted = true,
                privacy_policy_accepted_at = NOW(),
                is_complete = true,
                completed_at = NOW(),
                current_step = 5,
                completed_steps = array_append(completed_steps, 5),
                completion_percentage = 100.0,
                last_active_at = NOW()
            WHERE user_id = p_user_id;
            
    END CASE;
    
    -- Calculate completion percentage
    completion_pct := (array_length(
        (SELECT completed_steps FROM user_onboarding_progress WHERE user_id = p_user_id), 1
    ) * 100.0 / 5.0);
    
    UPDATE user_onboarding_progress
    SET completion_percentage = completion_pct
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_user_onboarding(
    p_user_id UUID,
    p_final_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    progress_record RECORD;
BEGIN
    -- Get onboarding progress
    SELECT * INTO progress_record
    FROM user_onboarding_progress
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User onboarding not found';
    END IF;
    
    -- Mark onboarding as complete
    UPDATE user_onboarding_progress
    SET is_complete = true,
        completed_at = NOW(),
        completion_percentage = 100.0,
        current_step = 5,
        terms_accepted = true,
        terms_accepted_at = NOW(),
        privacy_policy_accepted = true,
        privacy_policy_accepted_at = NOW(),
        last_active_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Create trading preferences record
    INSERT INTO user_trading_preferences (
        user_id,
        trading_style,
        base_currency,
        auto_rebalance_enabled,
        paper_trading_enabled
    )
    VALUES (
        p_user_id,
        CASE 
            WHEN progress_record.risk_tolerance = 'conservative' THEN 'conservative'
            WHEN progress_record.risk_tolerance = 'aggressive' THEN 'aggressive'
            ELSE 'balanced'
        END,
        COALESCE(progress_record.preferred_currency, 'NZD'),
        true,
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET
        trading_style = EXCLUDED.trading_style,
        base_currency = EXCLUDED.base_currency,
        updated_at = NOW();
    
    -- Create user profile record
    INSERT INTO user_profiles (
        user_id,
        display_name,
        investment_knowledge_level,
        base_currency,
        timezone
    )
    VALUES (
        p_user_id,
        progress_record.full_name,
        COALESCE(progress_record.trading_experience, 'beginner'),
        COALESCE(progress_record.preferred_currency, 'NZD'),
        CASE 
            WHEN progress_record.preferred_currency = 'AUD' THEN 'Australia/Sydney'
            WHEN progress_record.preferred_currency = 'USD' THEN 'America/New_York'
            ELSE 'Pacific/Auckland'
        END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        investment_knowledge_level = EXCLUDED.investment_knowledge_level,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_onboarding_analytics(
    p_user_id UUID
)
RETURNS TABLE (
    total_time_seconds INTEGER,
    steps_completed INTEGER,
    completion_rate DECIMAL(5,2),
    average_step_time DECIMAL(8,2),
    help_requests_total INTEGER,
    retry_count_total INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(time_spent_seconds), 0)::INTEGER as total_time_seconds,
        COUNT(DISTINCT step_number)::INTEGER as steps_completed,
        (COUNT(DISTINCT CASE WHEN completion_method = 'completed' THEN step_number END) * 100.0 / 5.0)::DECIMAL(5,2) as completion_rate,
        COALESCE(AVG(time_spent_seconds), 0)::DECIMAL(8,2) as average_step_time,
        COALESCE(SUM(help_requests), 0)::INTEGER as help_requests_total,
        COALESCE(SUM(retry_count), 0)::INTEGER as retry_count_total
    FROM user_onboarding_analytics
    WHERE user_onboarding_analytics.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default onboarding step templates
INSERT INTO onboarding_step_templates (
    step_number, step_name, step_title, step_description, 
    required_fields, optional_fields, component_name, display_order
) VALUES 
(1, 'welcome', 'Welcome to StackMotive', 'Get started with your trading journey', 
 ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'StepWelcome', 1),
 
(2, 'portfolio', 'Portfolio Preferences', 'Configure your trading style and risk tolerance',
 ARRAY['tradingExperience', 'riskTolerance', 'investmentHorizon']::TEXT[], 
 ARRAY['initialInvestment', 'tradingFrequency', 'preferredMarkets']::TEXT[], 
 'StepPortfolio', 2),
 
(3, 'personal', 'Personal Information', 'Tell us about yourself',
 ARRAY['fullName', 'preferredCurrency']::TEXT[], 
 ARRAY['phoneNumber', 'dateOfBirth']::TEXT[], 
 'StepPersonalInfo', 3),
 
(4, 'tax', 'Tax Information', 'Configure your tax settings',
 ARRAY['taxResidency', 'employmentStatus']::TEXT[], 
 ARRAY['taxIdentificationNumber', 'taxFileNumber', 'taxYearPreference']::TEXT[], 
 'StepTaxInfo', 4),
 
(5, 'summary', 'Review & Complete', 'Review your information and complete setup',
 ARRAY['termsAccepted']::TEXT[], 
 ARRAY[]::TEXT[], 
 'StepSummary', 5)

ON CONFLICT (step_number, version) DO NOTHING; 