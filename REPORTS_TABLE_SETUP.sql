-- =====================================================
-- COMPLETE REPORTS TABLE SETUP FOR SUPABASE
-- Run this entire script in your Supabase SQL Editor
-- =====================================================

-- 1. Create the reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly')),
  report_date DATE NOT NULL,
  report_data JSONB NOT NULL,
  ai_insights JSONB,
  scores JSONB,
  html_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(report_date);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_user_date ON reports(user_id, report_date);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- 3. Enable Row Level Security (RLS) - CRITICAL FOR PRIVACY
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for complete privacy
-- Users can ONLY see their own reports
CREATE POLICY "Users can view own reports only" ON reports
  FOR SELECT USING (auth.uid() = user_id);

-- Users can ONLY insert their own reports
CREATE POLICY "Users can insert own reports only" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can ONLY update their own reports
CREATE POLICY "Users can update own reports only" ON reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can ONLY delete their own reports
CREATE POLICY "Users can delete own reports only" ON reports
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger to automatically update updated_at
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Create a secure view for easier querying (users still only see their own data)
CREATE OR REPLACE VIEW user_reports AS
SELECT 
  r.id,
  r.report_type,
  r.report_date,
  r.report_data,
  r.ai_insights,
  r.scores,
  r.html_content,
  r.created_at,
  r.updated_at
FROM reports r
WHERE r.user_id = auth.uid(); -- This ensures users only see their own reports

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON reports TO authenticated;
GRANT SELECT ON user_reports TO authenticated;

-- 9. Create additional security constraints
-- Ensure user_id cannot be null
ALTER TABLE reports ALTER COLUMN user_id SET NOT NULL;

-- Add constraint to prevent future dates
ALTER TABLE reports ADD CONSTRAINT check_report_date 
  CHECK (report_date <= CURRENT_DATE);

-- Add constraint to ensure report_data is not empty
ALTER TABLE reports ADD CONSTRAINT check_report_data 
  CHECK (jsonb_typeof(report_data) = 'object' AND report_data != '{}');

-- 10. Create function to get user's report count
CREATE OR REPLACE FUNCTION get_user_report_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM reports 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to get user's latest report
CREATE OR REPLACE FUNCTION get_user_latest_report()
RETURNS TABLE(
  id UUID,
  report_type VARCHAR(20),
  report_date DATE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.report_type, r.report_date, r.created_at
  FROM reports r
  WHERE r.user_id = auth.uid()
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_report_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_latest_report() TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES (Run these to test setup)
-- =====================================================

-- Check if table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables 
--   WHERE table_schema = 'public' 
--   AND table_name = 'reports'
-- );

-- Check RLS is enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename = 'reports';

-- Check policies exist
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'reports';

-- =====================================================
-- SAMPLE DATA STRUCTURE (for reference)
-- =====================================================
/*
report_data: {
  "gmailData": {
    "profile": {...},
    "stats": {...}
  },
  "fitbitData": {
    "profile": {...},
    "stats": {...}
  },
  "spotifyData": {
    "profile": {...},
    "stats": {...}
  },
  "date": "2024-01-15",
  "reportType": "daily"
}

ai_insights: {
  "insight": "Your daily wellness report shows excellent balance...",
  "mantra": "Every step forward is progress, no matter how small.",
  "moodInsight": "Your mood reflects your overall wellness balance.",
  "recommendations": [
    "Prioritize 7-9 hours of quality sleep",
    "Aim for 10,000 steps daily"
  ],
  "trends": {},
  "patterns": []
}

scores: {
  "total": 85,
  "sleep": 90,
  "activity": 80,
  "heart": 85,
  "work": 85
}

html_content: "<!DOCTYPE html>... complete HTML report ..."
*/

-- =====================================================
-- SECURITY FEATURES IMPLEMENTED:
-- =====================================================
-- ✅ Row Level Security (RLS) enabled
-- ✅ Users can ONLY access their own reports
-- ✅ No cross-user data leakage possible
-- ✅ Automatic timestamp updates
-- ✅ Input validation constraints
-- ✅ Secure functions with SECURITY DEFINER
-- ✅ Proper permissions and grants
-- ✅ Indexes for performance
-- ✅ Cascading deletes when user is deleted
-- ✅ Date validation (no future reports)
-- ✅ JSON data validation
