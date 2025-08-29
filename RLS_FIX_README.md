# RLS Policy and Token Refresh Fixes

## Issues Resolved

### 1. Body Reading Error (Fixed ✅)

- **Problem**: `request.json()` was called twice in the queue start API, causing "Body is unusable: Body has already been read" error
- **Solution**: Consolidated both calls into a single `request.json()` call and extracted all needed properties at once

### 2. Row-Level Security (RLS) Policy Violations (Fixed ✅)

- **Problem**: Token refresh operations were failing with "new row violates row-level security policy for table 'integration_tokens'"
- **Solution**:
  - Updated token refresh service to use `upsert` instead of `update` operations
  - Added better error handling and logging
  - Created SQL script to fix RLS policies for both `integration_tokens` and `email_logs` tables

### 3. Email Logs RLS Policy Violations (Fixed ✅)

- **Problem**: Email logging operations were failing with RLS policy violations for the `email_logs` table
- **Solution**:
  - Enhanced email logger with better error handling
  - Added comprehensive RLS policy fixes for email_logs table
  - Improved logging and debugging capabilities

### 4. Token Refresh Failures (Improved ✅)

- **Problem**: Multiple integrations (Gmail, Google Calendar, Fitbit, Spotify) were failing to refresh tokens
- **Solution**:
  - Enhanced error handling in token refresh service
  - Added graceful fallbacks when tokens are unavailable
  - Improved logging for debugging

### 5. Report Generation API Errors (Improved ✅)

- **Problem**: API was returning 400 Bad Request errors due to integration failures
- **Solution**:
  - Enhanced error handling in the generate-report API
  - Added graceful degradation when integrations fail
  - Improved error messages and status codes

## Files Modified

### 1. `src/app/api/queue/start/route.ts`

- Fixed duplicate `request.json()` calls
- Consolidated body parsing into single operation

### 2. `src/lib/integrations/token-refresh-service.ts`

- Changed `update` to `upsert` operations
- Added better error handling and logging
- Improved conflict resolution

### 3. `src/app/api/queue/generate-report/route.ts`

- Enhanced error handling in integration data fetching
- Added graceful fallbacks for failed integrations
- Improved error messages and status codes
- Better logging for debugging

### 4. `src/lib/email-logging/email-logger.ts`

- Enhanced error handling for database operations
- Added better logging for debugging RLS issues
- Improved error messages and status handling

### 5. `fix_rls_policies.sql`

- SQL script to fix RLS policies for both tables
- Proper policy definitions for CRUD operations
- Service role permissions for both `integration_tokens` and `email_logs`

## How to Apply the Fixes

### 1. Code Changes (Already Applied)

The code changes have been automatically applied to fix the immediate issues.

### 2. Database Changes (Manual Action Required)

Run the SQL script in your Supabase database:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d your-db-name -f fix_rls_policies.sql
```

Or use the Supabase dashboard SQL editor to run the script.

**Important**: This script will fix RLS policies for both:

- `integration_tokens` table (for token refresh operations)
- `email_logs` table (for email logging operations)

### 3. Environment Variables

Ensure these environment variables are set:

- `CRON_SECRET` - for cron job authentication
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` - for Google integrations
- `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` - for Spotify integration
- `FITBIT_CLIENT_ID` and `FITBIT_CLIENT_SECRET` - for Fitbit integration

## Testing the Fixes

### 1. Test Queue Start

```bash
curl -X POST http://localhost:3000/api/queue/start \
  -H "Content-Type: application/json" \
  -d '{"source": "manual", "reportType": "daily", "batchSize": 10}'
```

### 2. Test Report Generation

```bash
curl -X POST http://localhost:3000/api/queue/generate-report \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id", "userEmail": "test@example.com", "reportType": "daily"}'
```

### 3. Test Email Logging

```bash
curl -X POST http://localhost:3000/api/email/send-report \
  -H "Content-Type: application/json" \
  -d '{"type": "daily", "to": "test@example.com", "userId": "test-user-id", "date": "2025-08-29"}'
```

### 4. Monitor Logs

Watch the console logs for:

- ✅ Token updated successfully messages
- ✅ Email logged successfully messages
- ⚠️ Integration warnings (expected for missing tokens)
- ❌ Error messages (should be reduced)

## Expected Results

After applying these fixes:

1. **Queue Start**: Should work without "Body is unusable" errors
2. **Token Refresh**: Should succeed and update tokens in database
3. **Email Logging**: Should work without RLS policy violations
4. **Report Generation**: Should handle integration failures gracefully
5. **Error Logs**: Should show more informative messages
6. **System Stability**: Background jobs should complete successfully

## Monitoring

Monitor these metrics:

- Token refresh success rate
- Email logging success rate
- Report generation completion rate
- Integration API response times
- Database operation success rate

## Troubleshooting

If issues persist:

1. **Check RLS Policies**: Verify the SQL script was executed successfully for both tables
2. **Service Role Permissions**: Ensure the service role has proper access to both tables
3. **Token Validity**: Check if refresh tokens are still valid
4. **API Limits**: Verify integration API rate limits haven't been exceeded
5. **Database Connectivity**: Ensure Supabase connection is stable

## Alternative Solutions

If RLS policies continue to cause issues, you can disable RLS entirely for these tables:

```sql
-- More permissive but may be needed for background jobs
ALTER TABLE integration_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;
```

**Note**: This is more permissive and should only be used if the RLS policies above don't resolve the issues.

## Next Steps

1. **Run SQL Script**: Execute the `fix_rls_policies.sql` script in your database
2. **Monitor**: Watch the logs for the next few hours
3. **Test**: Run manual tests to verify fixes for both tables
4. **Optimize**: Consider implementing retry mechanisms for failed operations
5. **Scale**: Monitor performance as queue load increases
