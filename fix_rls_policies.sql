-- Fix RLS policies for integration_tokens and email_logs tables
-- This script addresses the "new row violates row-level security policy" errors

-- ========================================
-- 1. FIX INTEGRATION_TOKENS TABLE
-- ========================================

-- First, let's check the current RLS policies for integration_tokens
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'integration_tokens';

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Users can view their own integration tokens" ON integration_tokens;
DROP POLICY IF EXISTS "Users can insert their own integration tokens" ON integration_tokens;
DROP POLICY IF EXISTS "Users can update their own integration tokens" ON integration_tokens;
DROP POLICY IF EXISTS "Users can delete their own integration tokens" ON integration_tokens;

-- Create new, more permissive policies for integration_tokens
-- Policy for SELECT operations
CREATE POLICY "Users can view their own integration tokens" ON integration_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT operations
CREATE POLICY "Users can insert their own integration tokens" ON integration_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE operations (including token refresh)
CREATE POLICY "Users can update their own integration tokens" ON integration_tokens
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE operations
CREATE POLICY "Users can delete their own integration tokens" ON integration_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 2. FIX EMAIL_LOGS TABLE
-- ========================================

-- Check the current RLS policies for email_logs
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'email_logs';

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Users can view their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can insert their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can update their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can delete their own email logs" ON email_logs;

-- Create new policies for email_logs
-- Policy for SELECT operations
CREATE POLICY "Users can view their own email logs" ON email_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT operations
CREATE POLICY "Users can insert their own email logs" ON email_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE operations
CREATE POLICY "Users can update their own email logs" ON email_logs
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE operations
CREATE POLICY "Users can delete their own email logs" ON email_logs
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 3. GRANT PERMISSIONS TO SERVICE ROLE
-- ========================================

-- Grant necessary permissions to the service role for both tables
GRANT ALL ON integration_tokens TO service_role;
GRANT ALL ON email_logs TO service_role;

-- ========================================
-- 4. VERIFY THE POLICIES ARE CREATED
-- ========================================

-- Verify integration_tokens policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'integration_tokens';

-- Verify email_logs policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'email_logs';

-- ========================================
-- 5. ALTERNATIVE: DISABLE RLS ENTIRELY (if needed)
-- ========================================

-- If you continue to have issues, you can disable RLS entirely for these tables
-- This is more permissive but may be needed for background jobs
-- Uncomment these lines if the policies above don't work:

-- ALTER TABLE integration_tokens DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. TEST THE POLICIES WORK
-- ========================================

-- Test the policies work (Run this as a test user to verify)
-- INSERT INTO integration_tokens (user_id, provider, access_token, refresh_token, expires_at) 
-- VALUES (auth.uid(), 'test', 'test_token', 'test_refresh', extract(epoch from now()) + 3600);

-- INSERT INTO email_logs (user_id, recipient_email, sender_email, email_type, subject, status) 
-- VALUES (auth.uid(), 'test@example.com', 'noreply@example.com', 'custom', 'Test Email', 'pending');
