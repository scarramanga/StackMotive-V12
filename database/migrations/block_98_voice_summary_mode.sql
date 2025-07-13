-- Block 98: Voice Summary Mode - Database Migration
-- Voice Synthesis, Text-to-Speech, and Audio Generation Tables

-- Voice Summary Modes - Main configuration table
CREATE TABLE voice_summary_modes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mode_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuration
    voice_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    audio_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    summary_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    accessibility_features JSONB NOT NULL DEFAULT '{}'::jsonb,
    synthesis_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    playback_controls JSONB NOT NULL DEFAULT '{}'::jsonb,
    integration_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_voice_modes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Voice Profiles - Available voice configurations
CREATE TABLE voice_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Voice identification
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    
    -- Voice characteristics
    gender VARCHAR(20) NOT NULL,
    age VARCHAR(20) NOT NULL,
    accent VARCHAR(50) NOT NULL,
    language VARCHAR(20) NOT NULL,
    
    -- Technical specifications
    sample_rate INTEGER NOT NULL,
    bit_rate INTEGER NOT NULL,
    audio_quality VARCHAR(20) NOT NULL,
    
    -- Capabilities
    capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Pricing and availability
    pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
    availability JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Samples and metadata
    sample_audio JSONB NOT NULL DEFAULT '[]'::jsonb,
    license VARCHAR(100) NOT NULL,
    
    -- Status
    is_available BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_voice_gender CHECK (gender IN ('male', 'female', 'neutral', 'child')),
    CONSTRAINT check_voice_age CHECK (age IN ('child', 'young_adult', 'adult', 'elderly')),
    CONSTRAINT check_voice_quality CHECK (audio_quality IN ('low', 'medium', 'high', 'highest', 'lossless'))
);

-- Custom Voice Profiles - User-created voice profiles
CREATE TABLE custom_voice_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mode_id UUID,
    
    -- Voice identification
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Voice characteristics
    voice_characteristics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Training data
    training_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Model information
    model_information JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Quality metrics
    quality_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Usage and licensing
    usage_permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    licensing JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Custom parameters
    custom_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Validation
    validation_status JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_custom_voices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_custom_voices_mode FOREIGN KEY (mode_id) REFERENCES voice_summary_modes(id) ON DELETE SET NULL
);

-- Audio Instances - Generated audio files and metadata
CREATE TABLE audio_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mode_id UUID NOT NULL,
    generation_id VARCHAR(255) NOT NULL,
    
    -- Content
    input_text TEXT NOT NULL,
    input_length INTEGER NOT NULL,
    
    -- Audio details
    audio_url TEXT,
    audio_blob_id VARCHAR(255),
    duration DECIMAL(10,3) NOT NULL,
    file_size BIGINT NOT NULL,
    audio_format VARCHAR(20) NOT NULL,
    
    -- Generation details
    voice_used VARCHAR(255) NOT NULL,
    voice_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    generation_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Quality metrics
    quality_score DECIMAL(4,3) NOT NULL,
    bit_rate INTEGER NOT NULL,
    sample_rate INTEGER NOT NULL,
    
    -- Transcript and bookmarks
    transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
    bookmarks JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Usage statistics
    play_count INTEGER DEFAULT 0,
    last_played TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    
    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_audio_instances_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_audio_instances_mode FOREIGN KEY (mode_id) REFERENCES voice_summary_modes(id) ON DELETE CASCADE,
    CONSTRAINT check_audio_status CHECK (status IN ('generating', 'completed', 'failed', 'expired')),
    CONSTRAINT check_audio_format CHECK (audio_format IN ('mp3', 'wav', 'ogg', 'flac', 'aac', 'webm'))
);

-- Content Templates - Reusable content templates
CREATE TABLE content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mode_id UUID,
    
    -- Template identification
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    
    -- Template structure
    template_structure JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    dynamic_content JSONB NOT NULL DEFAULT '[]'::jsonb,
    conditional_logic JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Personalization
    personalization_tokens JSONB NOT NULL DEFAULT '[]'::jsonb,
    voice_instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
    timing_controls JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Template variables
    template_variables JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Usage statistics
    usage_statistics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_templates_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_templates_mode FOREIGN KEY (mode_id) REFERENCES voice_summary_modes(id) ON DELETE SET NULL
);

-- Audio Generation History - Track generation requests and results
CREATE TABLE audio_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mode_id UUID NOT NULL,
    audio_id UUID,
    
    -- Generation metadata
    generation_id VARCHAR(255) NOT NULL,
    generation_type VARCHAR(100) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    
    -- Input details
    input_text TEXT NOT NULL,
    input_length INTEGER NOT NULL,
    template_used UUID,
    
    -- Generation parameters
    voice_used VARCHAR(255) NOT NULL,
    settings_used JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Output details
    output_duration DECIMAL(10,3),
    output_size BIGINT,
    output_format VARCHAR(20),
    output_quality DECIMAL(4,3),
    
    -- Performance metrics
    generation_time INTEGER NOT NULL, -- milliseconds
    processing_time INTEGER NOT NULL, -- milliseconds
    
    -- Quality assessment
    quality_score DECIMAL(4,3),
    quality_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- User feedback
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    
    -- Error information
    errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    
    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_generation_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_generation_history_mode FOREIGN KEY (mode_id) REFERENCES voice_summary_modes(id) ON DELETE CASCADE,
    CONSTRAINT fk_generation_history_audio FOREIGN KEY (audio_id) REFERENCES audio_instances(id) ON DELETE SET NULL,
    CONSTRAINT fk_generation_history_template FOREIGN KEY (template_used) REFERENCES content_templates(id) ON DELETE SET NULL,
    CONSTRAINT check_generation_type CHECK (generation_type IN ('text_to_speech', 'summary', 'report', 'alert', 'notification')),
    CONSTRAINT check_generation_status CHECK (status IN ('generating', 'completed', 'failed', 'cancelled'))
);

-- Audio Queue - Manage audio playback queue
CREATE TABLE audio_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mode_id UUID NOT NULL,
    audio_id UUID NOT NULL,
    
    -- Queue details
    position INTEGER NOT NULL,
    auto_play BOOLEAN DEFAULT true,
    repeat_mode BOOLEAN DEFAULT false,
    cross_fade BOOLEAN DEFAULT false,
    
    -- Queue metadata
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    played_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    
    -- Indexes
    CONSTRAINT fk_queue_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_queue_mode FOREIGN KEY (mode_id) REFERENCES voice_summary_modes(id) ON DELETE CASCADE,
    CONSTRAINT fk_queue_audio FOREIGN KEY (audio_id) REFERENCES audio_instances(id) ON DELETE CASCADE,
    CONSTRAINT check_queue_status CHECK (status IN ('queued', 'playing', 'played', 'skipped', 'removed'))
);

-- Voice Synthesis Settings - Detailed voice configuration
CREATE TABLE voice_synthesis_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode_id UUID NOT NULL,
    
    -- TTS Engine configuration
    tts_engine VARCHAR(100) NOT NULL,
    engine_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Voice parameters
    speech_rate DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    speech_pitch DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    speech_volume DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    
    -- Pronunciation settings
    pronunciation_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_phonetics JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Audio processing
    audio_quality VARCHAR(20) NOT NULL DEFAULT 'high',
    compression_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Multi-language support
    multi_language_support JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Voice switching rules
    voice_switching_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Neural voice settings
    neural_voice_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Emotion and prosody
    emotion_synthesis JSONB NOT NULL DEFAULT '{}'::jsonb,
    prosody_control JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- SSML support
    ssml_support JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Real-time synthesis
    real_time_synthesis JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Batch processing
    batch_processing JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_synthesis_settings_mode FOREIGN KEY (mode_id) REFERENCES voice_summary_modes(id) ON DELETE CASCADE,
    CONSTRAINT check_tts_engine CHECK (tts_engine IN ('native', 'azure', 'google', 'amazon', 'elevenlabs', 'custom'))
);

-- Audio Processing Settings - Audio enhancement and effects
CREATE TABLE audio_processing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode_id UUID NOT NULL,
    
    -- Audio format settings
    audio_format VARCHAR(20) NOT NULL DEFAULT 'mp3',
    sample_rate INTEGER NOT NULL DEFAULT 44100,
    bit_rate INTEGER NOT NULL DEFAULT 128,
    channels INTEGER NOT NULL DEFAULT 1,
    
    -- Audio processing
    audio_processing JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Background audio
    background_audio JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audio effects
    audio_effects JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Noise reduction
    noise_reduction JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Dynamic range
    dynamic_range JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Spatial audio
    spatial_audio JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Cross-fade settings
    cross_fade_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_audio_processing_mode FOREIGN KEY (mode_id) REFERENCES voice_summary_modes(id) ON DELETE CASCADE,
    CONSTRAINT check_audio_format CHECK (audio_format IN ('mp3', 'wav', 'ogg', 'flac', 'aac', 'webm'))
);

-- Accessibility Features - Accessibility and inclusion settings
CREATE TABLE accessibility_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode_id UUID NOT NULL,
    
    -- Screen reader support
    screen_reader_support JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Hearing impairment support
    hearing_impairment_support JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Visual impairment support
    visual_impairment_support JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Motor impairment support
    motor_impairment_support JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Cognitive support
    cognitive_support JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Keyboard navigation
    keyboard_navigation JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Voice commands
    voice_commands JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Gesture control
    gesture_control JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Closed captions
    closed_captions JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Language translation
    language_translation JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_accessibility_mode FOREIGN KEY (mode_id) REFERENCES voice_summary_modes(id) ON DELETE CASCADE
);

-- Playback Controls - Playback management and control settings
CREATE TABLE playback_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mode_id UUID NOT NULL,
    
    -- Basic controls
    play_enabled BOOLEAN DEFAULT true,
    pause_enabled BOOLEAN DEFAULT true,
    stop_enabled BOOLEAN DEFAULT true,
    
    -- Navigation controls
    skip_forward_seconds INTEGER DEFAULT 10,
    skip_backward_seconds INTEGER DEFAULT 10,
    
    -- Speed and volume
    playback_speed DECIMAL(4,2) DEFAULT 1.0,
    master_volume DECIMAL(4,2) DEFAULT 1.0,
    
    -- Repeat and shuffle
    repeat_mode VARCHAR(20) DEFAULT 'none',
    shuffle_mode BOOLEAN DEFAULT false,
    
    -- Smart controls
    smart_controls JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Gesture controls
    gesture_controls JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Voice controls
    voice_controls JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Playlist controls
    playlist_controls JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_playback_controls_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_playback_controls_mode FOREIGN KEY (mode_id) REFERENCES voice_summary_modes(id) ON DELETE CASCADE,
    CONSTRAINT check_repeat_mode CHECK (repeat_mode IN ('none', 'single', 'all'))
);

-- Performance Metrics - Performance tracking and analytics
CREATE TABLE voice_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mode_id UUID,
    
    -- Time period
    measurement_date DATE NOT NULL,
    measurement_hour INTEGER,
    
    -- Generation metrics
    total_generations INTEGER DEFAULT 0,
    average_generation_time DECIMAL(10,3),
    generation_success_rate DECIMAL(5,4),
    
    -- Playback metrics
    total_playbacks INTEGER DEFAULT 0,
    average_playback_latency DECIMAL(10,3),
    playback_success_rate DECIMAL(5,4),
    
    -- Cache metrics
    cache_hit_rate DECIMAL(5,4),
    cache_size_mb DECIMAL(10,2),
    cache_efficiency DECIMAL(5,4),
    
    -- Quality metrics
    average_audio_quality DECIMAL(4,3),
    user_satisfaction DECIMAL(4,3),
    
    -- Error metrics
    error_rate DECIMAL(5,4),
    error_count INTEGER DEFAULT 0,
    
    -- Usage metrics
    total_audio_duration DECIMAL(15,3),
    unique_voices_used INTEGER DEFAULT 0,
    templates_used INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_performance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_performance_mode FOREIGN KEY (mode_id) REFERENCES voice_summary_modes(id) ON DELETE CASCADE
);

-- Export Results - Track audio and settings exports
CREATE TABLE voice_export_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mode_id UUID,
    audio_id UUID,
    
    -- Export identification
    export_id VARCHAR(255) NOT NULL UNIQUE,
    export_type VARCHAR(100) NOT NULL,
    export_format VARCHAR(50) NOT NULL,
    
    -- Export details
    file_url TEXT,
    file_size BIGINT,
    
    -- Export content
    export_data JSONB,
    
    -- Status and access
    download_count INTEGER DEFAULT 0,
    last_downloaded TIMESTAMP WITH TIME ZONE,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    exported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_export_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_export_mode FOREIGN KEY (mode_id) REFERENCES voice_summary_modes(id) ON DELETE SET NULL,
    CONSTRAINT fk_export_audio FOREIGN KEY (audio_id) REFERENCES audio_instances(id) ON DELETE SET NULL,
    CONSTRAINT check_export_format CHECK (export_format IN ('mp3', 'wav', 'json', 'transcript', 'settings'))
);

-- Create indexes for performance
CREATE INDEX idx_voice_modes_user_id ON voice_summary_modes(user_id);
CREATE INDEX idx_voice_modes_active ON voice_summary_modes(is_active);
CREATE INDEX idx_voice_modes_last_used ON voice_summary_modes(last_used);

CREATE INDEX idx_voice_profiles_provider ON voice_profiles(provider);
CREATE INDEX idx_voice_profiles_language ON voice_profiles(language);
CREATE INDEX idx_voice_profiles_gender ON voice_profiles(gender);
CREATE INDEX idx_voice_profiles_available ON voice_profiles(is_available);

CREATE INDEX idx_custom_voices_user_id ON custom_voice_profiles(user_id);
CREATE INDEX idx_custom_voices_mode_id ON custom_voice_profiles(mode_id);
CREATE INDEX idx_custom_voices_active ON custom_voice_profiles(is_active);

CREATE INDEX idx_audio_instances_user_id ON audio_instances(user_id);
CREATE INDEX idx_audio_instances_mode_id ON audio_instances(mode_id);
CREATE INDEX idx_audio_instances_generated ON audio_instances(generated_at);
CREATE INDEX idx_audio_instances_status ON audio_instances(status);
CREATE INDEX idx_audio_instances_voice ON audio_instances(voice_used);

CREATE INDEX idx_templates_user_id ON content_templates(user_id);
CREATE INDEX idx_templates_mode_id ON content_templates(mode_id);
CREATE INDEX idx_templates_category ON content_templates(category);
CREATE INDEX idx_templates_active ON content_templates(is_active);

CREATE INDEX idx_generation_history_user_id ON audio_generation_history(user_id);
CREATE INDEX idx_generation_history_mode_id ON audio_generation_history(mode_id);
CREATE INDEX idx_generation_history_generated ON audio_generation_history(generated_at);
CREATE INDEX idx_generation_history_type ON audio_generation_history(generation_type);

CREATE INDEX idx_audio_queue_user_id ON audio_queue(user_id);
CREATE INDEX idx_audio_queue_mode_id ON audio_queue(mode_id);
CREATE INDEX idx_audio_queue_position ON audio_queue(position);
CREATE INDEX idx_audio_queue_status ON audio_queue(status);

CREATE INDEX idx_synthesis_settings_mode_id ON voice_synthesis_settings(mode_id);
CREATE INDEX idx_audio_processing_mode_id ON audio_processing_settings(mode_id);
CREATE INDEX idx_accessibility_mode_id ON accessibility_features(mode_id);
CREATE INDEX idx_playback_controls_user_id ON playback_controls(user_id);
CREATE INDEX idx_playback_controls_mode_id ON playback_controls(mode_id);

CREATE INDEX idx_performance_user_id ON voice_performance_metrics(user_id);
CREATE INDEX idx_performance_mode_id ON voice_performance_metrics(mode_id);
CREATE INDEX idx_performance_date ON voice_performance_metrics(measurement_date);

CREATE INDEX idx_export_user_id ON voice_export_results(user_id);
CREATE INDEX idx_export_exported ON voice_export_results(exported_at);
CREATE INDEX idx_export_expires ON voice_export_results(expires_at);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_voice_mode_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_voice_mode_timestamp
    BEFORE UPDATE ON voice_summary_modes
    FOR EACH ROW
    EXECUTE FUNCTION update_voice_mode_timestamp();

CREATE OR REPLACE FUNCTION update_voice_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_voice_profile_timestamp
    BEFORE UPDATE ON voice_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_voice_profile_timestamp();

CREATE OR REPLACE FUNCTION update_custom_voice_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_voice_timestamp
    BEFORE UPDATE ON custom_voice_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_voice_timestamp();

CREATE OR REPLACE FUNCTION update_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_timestamp
    BEFORE UPDATE ON content_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_template_timestamp();

-- Create views for common queries
CREATE VIEW voice_mode_summary AS
SELECT 
    vsm.id,
    vsm.user_id,
    vsm.mode_name,
    vsm.description,
    vsm.is_active,
    vsm.created_at,
    vsm.last_used,
    COUNT(DISTINCT ai.id) as audio_count,
    COUNT(DISTINCT ct.id) as template_count,
    COUNT(DISTINCT cvp.id) as custom_voice_count,
    COALESCE(SUM(ai.duration), 0) as total_audio_duration,
    COALESCE(AVG(ai.quality_score), 0) as average_quality,
    MAX(ai.generated_at) as last_audio_generated
FROM voice_summary_modes vsm
LEFT JOIN audio_instances ai ON vsm.id = ai.mode_id
LEFT JOIN content_templates ct ON vsm.id = ct.mode_id AND ct.is_active = true
LEFT JOIN custom_voice_profiles cvp ON vsm.id = cvp.mode_id AND cvp.is_active = true
GROUP BY vsm.id, vsm.user_id, vsm.mode_name, vsm.description, 
         vsm.is_active, vsm.created_at, vsm.last_used;

CREATE VIEW voice_usage_analytics AS
SELECT 
    vsm.user_id,
    vsm.id as mode_id,
    vsm.mode_name,
    COUNT(DISTINCT agh.id) as total_generations,
    COUNT(DISTINCT CASE WHEN agh.generated_at::date = CURRENT_DATE THEN agh.id END) as generations_today,
    AVG(agh.generation_time) as avg_generation_time,
    AVG(agh.quality_score) as avg_quality_score,
    SUM(agh.output_duration) as total_duration_generated,
    COUNT(DISTINCT agh.voice_used) as unique_voices_used,
    MAX(agh.generated_at) as last_generation
FROM voice_summary_modes vsm
LEFT JOIN audio_generation_history agh ON vsm.id = agh.mode_id
WHERE vsm.is_active = true
GROUP BY vsm.user_id, vsm.id, vsm.mode_name;

CREATE VIEW voice_performance_summary AS
SELECT 
    user_id,
    mode_id,
    DATE(measurement_date) as date,
    SUM(total_generations) as daily_generations,
    AVG(average_generation_time) as avg_generation_time,
    AVG(generation_success_rate) as success_rate,
    SUM(total_playbacks) as daily_playbacks,
    AVG(average_playback_latency) as avg_playback_latency,
    AVG(cache_hit_rate) as avg_cache_hit_rate,
    AVG(average_audio_quality) as avg_audio_quality,
    AVG(user_satisfaction) as avg_user_satisfaction,
    AVG(error_rate) as avg_error_rate
FROM voice_performance_metrics
GROUP BY user_id, mode_id, DATE(measurement_date);

-- Insert sample data for testing
INSERT INTO voice_profiles (voice_id, name, display_name, provider, version, gender, age, accent, language, sample_rate, bit_rate, audio_quality, capabilities, pricing, availability, license)
VALUES 
    ('native-female-au', 'Native Female AU', 'Emma (Australian Female)', 'native', '1.0.0', 'female', 'adult', 'australian', 'en-AU', 22050, 128, 'medium', 
     '{"neuralVoice": false, "emotionSynthesis": false, "ssmlSupport": false, "realTimeGeneration": true}'::jsonb,
     '{"model": "free", "cost": 0, "currency": "USD", "unit": "character"}'::jsonb,
     '{"regions": ["global"], "platforms": ["web"], "isAvailable": true}'::jsonb, 'free'),
    ('azure-female-au', 'Azure Female AU', 'Sarah (Australian Female)', 'azure', '2.0.0', 'female', 'adult', 'australian', 'en-AU', 44100, 192, 'high',
     '{"neuralVoice": true, "emotionSynthesis": true, "ssmlSupport": true, "realTimeGeneration": true}'::jsonb,
     '{"model": "pay_per_use", "cost": 0.000016, "currency": "USD", "unit": "character"}'::jsonb,
     '{"regions": ["au-east", "au-southeast"], "platforms": ["web", "mobile", "api"], "isAvailable": true}'::jsonb, 'commercial'),
    ('elevenlabs-male-nz', 'ElevenLabs Male NZ', 'James (New Zealand Male)', 'elevenlabs', '3.0.0', 'male', 'adult', 'new_zealand', 'en-NZ', 44100, 320, 'highest',
     '{"neuralVoice": true, "emotionSynthesis": true, "ssmlSupport": true, "voiceCloning": true, "customTraining": true}'::jsonb,
     '{"model": "subscription", "cost": 22, "currency": "USD", "unit": "month"}'::jsonb,
     '{"regions": ["global"], "platforms": ["web", "mobile", "api"], "isAvailable": true}'::jsonb, 'commercial');

INSERT INTO voice_summary_modes (user_id, mode_name, description, voice_config, is_active)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Default Voice Mode', 'Default voice synthesis mode for portfolio summaries',
     '{"selectedVoice": {"id": "azure-female-au"}, "speechRate": 1.0, "speechPitch": 1.0, "speechVolume": 0.8}'::jsonb, true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Executive Briefing Mode', 'Professional voice mode for executive briefings',
     '{"selectedVoice": {"id": "elevenlabs-male-nz"}, "speechRate": 0.9, "speechPitch": 1.1, "speechVolume": 0.9}'::jsonb, true);

-- Comment on tables and columns
COMMENT ON TABLE voice_summary_modes IS 'Main configuration table for voice synthesis modes';
COMMENT ON TABLE voice_profiles IS 'Available voice profiles from various TTS providers';
COMMENT ON TABLE custom_voice_profiles IS 'User-created custom voice profiles with training data';
COMMENT ON TABLE audio_instances IS 'Generated audio files with metadata and playback statistics';
COMMENT ON TABLE content_templates IS 'Reusable content templates for voice synthesis';
COMMENT ON TABLE audio_generation_history IS 'Historical record of all audio generation requests';
COMMENT ON TABLE audio_queue IS 'Audio playback queue management';
COMMENT ON TABLE voice_synthesis_settings IS 'Detailed voice synthesis configuration and parameters';
COMMENT ON TABLE audio_processing_settings IS 'Audio enhancement and post-processing settings';
COMMENT ON TABLE accessibility_features IS 'Accessibility features and inclusive design settings';
COMMENT ON TABLE playback_controls IS 'Playback controls and user interface preferences';
COMMENT ON TABLE voice_performance_metrics IS 'Performance analytics and system metrics';
COMMENT ON TABLE voice_export_results IS 'Audio and settings export tracking';

COMMENT ON COLUMN voice_summary_modes.voice_config IS 'JSON configuration for voice selection, speech parameters, and synthesis settings';
COMMENT ON COLUMN voice_profiles.capabilities IS 'Voice capabilities including neural synthesis, emotion support, and SSML';
COMMENT ON COLUMN audio_instances.transcript IS 'Time-aligned transcript with word-level timestamps and confidence scores';
COMMENT ON COLUMN content_templates.template_structure IS 'Template structure with sections, variables, and conditional logic';
COMMENT ON COLUMN audio_generation_history.quality_metrics IS 'Detailed quality assessment including naturalness and intelligibility';
COMMENT ON COLUMN voice_synthesis_settings.pronunciation_rules IS 'Custom pronunciation rules and phonetic mappings';
COMMENT ON COLUMN accessibility_features.screen_reader_support IS 'Screen reader compatibility and ARIA label support';
COMMENT ON COLUMN voice_performance_metrics.cache_hit_rate IS 'Audio cache efficiency for improved performance'; 