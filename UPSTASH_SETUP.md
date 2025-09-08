# Upstash QStash Setup Guide

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Upstash QStash Configuration
QSTASH_TOKEN=your_qstash_token_here
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key

# App URL (for webhook endpoints)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## How to Get Upstash QStash Credentials

1. **Go to [Upstash Console](https://console.upstash.com/)**
2. **Create a new QStash project**
3. **Copy your QStash Token** from the dashboard
4. **Get your Signing Keys** from the QStash settings

## Environment Variables Explained

- **QSTASH_TOKEN**: Your main QStash API token for publishing messages
- **QSTASH_CURRENT_SIGNING_KEY**: Current signing key for webhook verification
- **QSTASH_NEXT_SIGNING_KEY**: Next signing key for webhook verification (for key rotation)
- **NEXT_PUBLIC_APP_URL**: Your app's public URL where QStash will send webhooks

## Testing the Setup

1. **Start your development server**: `npm run dev`
2. **Go to Queue Dashboard**: `http://localhost:3000/queue`
3. **Click "Add Jobs to Queue"** to test the integration

## Troubleshooting

- **"invalid token" error**: Check your QSTASH_TOKEN is correct
- **"client token is not set"**: Make sure QSTASH_TOKEN is in your .env.local file
- **Webhook errors**: Verify NEXT_PUBLIC_APP_URL is set correctly

## Benefits of Upstash QStash

- ✅ **Serverless**: No server management required
- ✅ **Auto-scaling**: Handles any number of jobs
- ✅ **Built-in retries**: Automatic failure handling
- ✅ **Global**: Processed from multiple regions
- ✅ **Event-driven**: Instant webhook processing
