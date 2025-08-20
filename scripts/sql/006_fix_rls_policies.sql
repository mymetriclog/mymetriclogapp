-- Fix RLS policies for integration_tokens and reports tables
-- This allows the service role to bypass RLS for internal operations

-- 1. Fix integration_tokens table RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own integration tokens" ON integration_tokens;
DROP POLICY IF EXISTS "Users can insert own integration tokens" ON integration_tokens;
DROP POLICY IF EXISTS "Users can update own integration tokens" ON integration_tokens;
DROP POLICY IF EXISTS "Users can delete own integration tokens" ON integration_tokens;

-- Create new policies that allow service role to bypass RLS
CREATE POLICY "Users can view own integration tokens" ON integration_tokens
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can insert own integration tokens" ON integration_tokens
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can update own integration tokens" ON integration_tokens
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    ) WITH CHECK (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can delete own integration tokens" ON integration_tokens
    FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

-- 2. Fix reports table RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;

-- Create new policies that allow service role to bypass RLS
CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can insert own reports" ON reports
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can update own reports" ON reports
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    ) WITH CHECK (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can delete own reports" ON reports
    FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

-- 3. Alternative approach: Disable RLS for service role operations
-- If the above policies don't work, you can temporarily disable RLS for service role
-- Uncomment the lines below if needed:

-- ALTER TABLE integration_tokens DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- 4. Grant necessary permissions to service role
GRANT ALL ON integration_tokens TO service_role;
GRANT ALL ON reports TO service_role;

-- 5. Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('integration_tokens', 'reports')
ORDER BY tablename, policyname;

-- 6. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('integration_tokens', 'reports');
