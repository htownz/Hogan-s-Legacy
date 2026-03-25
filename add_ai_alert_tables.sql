-- Enhanced Database Schema for AI-Powered Legislative Alert System
-- This adds tables to support predictive analysis, sentiment tracking, and intelligent clustering

-- AI Alert Enhancement Table
CREATE TABLE IF NOT EXISTS ai_alert_enhancements (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(255) NOT NULL,
    impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
    personal_relevance INTEGER CHECK (personal_relevance >= 1 AND personal_relevance <= 10),
    action_priority VARCHAR(20) CHECK (action_priority IN ('low', 'medium', 'high', 'critical')),
    smart_summary TEXT,
    suggested_actions JSONB,
    related_topics JSONB,
    ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legislative Sentiment Analysis Table
CREATE TABLE IF NOT EXISTS legislative_sentiment_analysis (
    id SERIAL PRIMARY KEY,
    analysis_date DATE NOT NULL,
    overall_sentiment VARCHAR(20) CHECK (overall_sentiment IN ('positive', 'negative', 'neutral')),
    sentiment_score INTEGER CHECK (sentiment_score >= 1 AND sentiment_score <= 10),
    public_mood TEXT,
    engagement_level VARCHAR(20) CHECK (engagement_level IN ('low', 'medium', 'high')),
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    democratic_health VARCHAR(20) CHECK (democratic_health IN ('strong', 'moderate', 'concerning')),
    recommendations JSONB,
    data_sources JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Predictive Analysis Table
CREATE TABLE IF NOT EXISTS legislative_predictions (
    id SERIAL PRIMARY KEY,
    prediction_date DATE NOT NULL,
    predictions JSONB,
    hot_committees JSONB,
    advancing_bills JSONB,
    emerging_priorities JSONB,
    engagement_opportunities JSONB,
    confidence_level VARCHAR(20) CHECK (confidence_level IN ('low', 'medium', 'high')),
    accuracy_tracking JSONB, -- For tracking how accurate past predictions were
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP -- Predictions have expiration dates
);

-- Alert Clustering Table
CREATE TABLE IF NOT EXISTS alert_clusters (
    id SERIAL PRIMARY KEY,
    cluster_name VARCHAR(255) NOT NULL,
    theme VARCHAR(255),
    urgency VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    summary TEXT,
    action_items JSONB,
    alert_ids JSONB, -- Array of alert IDs in this cluster
    cluster_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Alert Preferences Table (for personalization)
CREATE TABLE IF NOT EXISTS user_alert_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255), -- References your user system
    interests JSONB,
    priority_topics JSONB,
    location VARCHAR(255),
    notification_frequency VARCHAR(50),
    impact_threshold INTEGER CHECK (impact_threshold >= 1 AND impact_threshold <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legislative Activity Tracking (for trend analysis)
CREATE TABLE IF NOT EXISTS legislative_activity_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    total_alerts INTEGER DEFAULT 0,
    committee_meetings INTEGER DEFAULT 0,
    bill_updates INTEGER DEFAULT 0,
    voting_activities INTEGER DEFAULT 0,
    emergency_alerts INTEGER DEFAULT 0,
    average_impact_score DECIMAL(3,2),
    most_active_committees JSONB,
    trending_topics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Model Performance Tracking
CREATE TABLE IF NOT EXISTS ai_model_performance (
    id SERIAL PRIMARY KEY,
    model_type VARCHAR(100), -- 'sentiment', 'prediction', 'clustering', etc.
    accuracy_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    input_size INTEGER,
    success_rate DECIMAL(3,2),
    error_details JSONB,
    model_version VARCHAR(50),
    test_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_ai_enhancements_alert_id ON ai_alert_enhancements(alert_id);
CREATE INDEX IF NOT EXISTS idx_ai_enhancements_impact_score ON ai_alert_enhancements(impact_score);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_date ON legislative_sentiment_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON legislative_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_predictions_confidence ON legislative_predictions(confidence_level);
CREATE INDEX IF NOT EXISTS idx_clusters_date ON alert_clusters(cluster_date);
CREATE INDEX IF NOT EXISTS idx_clusters_urgency ON alert_clusters(urgency);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_alert_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_metrics_date ON legislative_activity_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_model_performance_type ON ai_model_performance(model_type);
CREATE INDEX IF NOT EXISTS idx_model_performance_date ON ai_model_performance(test_date);

-- Add trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_enhancements_updated_at 
    BEFORE UPDATE ON ai_alert_enhancements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_alert_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for quick AI analytics
CREATE OR REPLACE VIEW ai_dashboard_summary AS
SELECT 
    (SELECT COUNT(*) FROM ai_alert_enhancements WHERE created_at > CURRENT_DATE - INTERVAL '7 days') as alerts_last_week,
    (SELECT AVG(impact_score) FROM ai_alert_enhancements WHERE created_at > CURRENT_DATE - INTERVAL '7 days') as avg_impact_score,
    (SELECT overall_sentiment FROM legislative_sentiment_analysis ORDER BY analysis_date DESC LIMIT 1) as current_sentiment,
    (SELECT confidence_level FROM legislative_predictions ORDER BY prediction_date DESC LIMIT 1) as latest_prediction_confidence,
    (SELECT COUNT(*) FROM alert_clusters WHERE cluster_date > CURRENT_DATE - INTERVAL '30 days') as clusters_last_month;

COMMENT ON TABLE ai_alert_enhancements IS 'Stores AI-enhanced data for each legislative alert including impact scores and smart summaries';
COMMENT ON TABLE legislative_sentiment_analysis IS 'Tracks sentiment analysis of legislative activity over time';
COMMENT ON TABLE legislative_predictions IS 'Stores AI predictions about future legislative developments';
COMMENT ON TABLE alert_clusters IS 'Groups related alerts using AI clustering algorithms';
COMMENT ON TABLE user_alert_preferences IS 'Stores user preferences for personalized alert generation';
COMMENT ON TABLE legislative_activity_metrics IS 'Tracks metrics about legislative activity for trend analysis';
COMMENT ON TABLE ai_model_performance IS 'Monitors the performance and accuracy of AI models';
COMMENT ON VIEW ai_dashboard_summary IS 'Provides quick overview of AI system performance and insights';