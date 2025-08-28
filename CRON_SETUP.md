# Vercel Cron Jobs Setup

## Overview

This project uses Vercel Cron Jobs to automatically trigger queue processing every day at 11:00 PM.

## Configuration

### 1. Environment Variables

Add this to your Vercel project environment variables:

```
Name: CRON_SECRET
Value: your-super-secret-cron-key-here
Environment: Production (and Preview if needed)
```

**Important**: Use a strong, random string as your secret!

### 2. Cron Schedule

- **Path**: `/api/cron`
- **Schedule**: `0 23 * * *` (Daily at 11:00 PM UTC)
- **Frequency**: Every day at 23:00 (11:00 PM)

### 3. Files Created

- `src/app/api/cron/route.ts` - Main cron endpoint
- `src/app/api/cron/test/route.ts` - Test endpoint
- `vercel.json` - Cron configuration

## How It Works

1. **11:00 PM Daily**: Vercel automatically calls `/api/cron`
2. **Authentication**: Verifies the `CRON_SECRET`
3. **Queue Start**: Calls `/api/queue/start` with cron source
4. **Processing**: Your queue system starts processing user reports
5. **Logging**: All actions are logged for monitoring

## Testing

### Test Cron Authentication

```bash
# Test with correct secret
curl -H "Authorization: Bearer your-secret-here" http://localhost:3000/api/cron/test

# Test without secret (should fail)
curl http://localhost:3000/api/cron/test
```

### Test Queue Start

```bash
curl -X POST -H "Authorization: Bearer your-secret-here" \
  -H "Content-Type: application/json" \
  -d '{"source":"cron","timestamp":"2024-01-01T00:00:00Z"}' \
  http://localhost:3000/api/queue/start
```

## Monitoring

- **Vercel Dashboard**: Functions → Cron Jobs to see execution history
- **Function Logs**: Check Vercel function logs for cron execution details
- **Queue Status**: Monitor your queue processing through your dashboard

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check `CRON_SECRET` environment variable
2. **500 Internal Error**: Verify your queue start API is working
3. **Cron Not Running**: Check Vercel Cron Jobs feature is enabled

### Debug Steps

1. Verify `CRON_SECRET` is set in Vercel
2. Test the test endpoint locally
3. Check Vercel function logs
4. Verify cron jobs are enabled in your project

## Security Notes

- Keep your `CRON_SECRET` secure and private
- Never commit the secret to version control
- Use different secrets for different environments
- Regularly rotate your secrets
