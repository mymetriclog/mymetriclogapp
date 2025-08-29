# Weekly Report Cron Setup Guide

## 🕐 **Weekly Report Generation Schedule**

The weekly report system is designed to generate reports **once per week, every Sunday**, providing users with comprehensive weekly wellness insights.

## 📅 **Cron Job Configuration**

### **Option 1: Vercel Cron Jobs (Recommended)**

Add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly",
      "schedule": "0 9 * * 0"
    }
  ]
}
```

**Schedule Explanation:**

- `0` - At minute 0
- `9` - At 9:00 AM
- `*` - Every day of month
- `*` - Every month
- `0` - Every Sunday (0 = Sunday, 1 = Monday, etc.)

### **Option 2: External Cron Service (e.g., cron-job.org)**

**URL:** `https://your-domain.com/api/cron/weekly`
**Schedule:** `0 9 * * 0` (Every Sunday at 9:00 AM)
**HTTP Method:** POST
**Headers:**

```
Authorization: Bearer YOUR_CRON_SECRET
Content-Type: application/json
```

### **Option 3: GitHub Actions (Alternative)**

Create `.github/workflows/weekly-cron.yml`:

```yaml
name: Weekly Report Generation
on:
  schedule:
    - cron: "0 9 * * 0" # Every Sunday at 9:00 AM UTC

jobs:
  weekly-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Weekly Reports
        run: |
          curl -X POST https://your-domain.com/api/cron/weekly \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

## 🔧 **Environment Variables**

Ensure these are set in your environment:

```bash
CRON_SECRET=your-secure-cron-secret-here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📊 **Weekly Report Features**

### **What Gets Generated:**

- 📈 **Weekly Trends** - 7-day data aggregation
- 🎯 **Weekly Insights** - AI-powered weekly analysis
- 📅 **Date Range** - Monday to Sunday coverage
- 🌤️ **Weekly Weather Summary** - Environmental impact analysis
- 📊 **Integration Stats** - Weekly averages for all connected services

### **Report Timing:**

- **Generated:** Every Sunday
- **Data Coverage:** Previous Monday to Sunday
- **Email Sent:** Sunday after generation
- **Storage:** Saved to database with `report_type: "weekly"`

## 🧪 **Testing the Weekly Cron**

### **1. Test Endpoint (GET):**

```bash
curl https://your-domain.com/api/cron/weekly
```

**Response:**

```json
{
  "success": true,
  "cronType": "weekly",
  "currentDay": 0,
  "dayName": "Sunday",
  "isSunday": true,
  "nextRun": "Today"
}
```

### **2. Manual Trigger (POST):**

```bash
curl -X POST https://your-domain.com/api/cron/weekly \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### **3. Check Queue Status:**

```bash
curl https://your-domain.com/api/queue/status
```

## 📈 **Monitoring & Logs**

### **Expected Log Output:**

```
🕐 Weekly cron triggered at: 2025-08-31T09:00:00.000Z
📅 Today is Sunday - starting weekly report generation
✅ Weekly report queue started with 25 jobs
📊 Total users: 30
🔗 Users with integrations: 25
❌ Users without integrations: 5
```

### **Queue Processing Logs:**

```
🚀 ===== STARTING JOB PROCESSING =====
📋 Job ID: generate-user-report-1756445675361-4vg1de2ri
📋 Job Type: generate-user-report
📊 Report Type: weekly
👤 User: user@example.com (user-id)
📅 Date range: 2025-08-25 - 2025-08-31
```

## ⚠️ **Important Notes**

### **Sunday-Only Execution:**

- Weekly cron **only runs on Sundays**
- If triggered on other days, it will return a "skipped" message
- This prevents accidental weekly report generation

### **Data Aggregation:**

- Weekly reports aggregate data from the previous 7 days
- Date range: Monday (7 days ago) to Sunday (today)
- All integrations are queried for the full week period

### **Queue Management:**

- Weekly reports use the same queue system as daily reports
- Jobs are processed sequentially to avoid overwhelming the system
- Failed jobs are automatically retried up to 3 times

## 🔄 **Integration with Daily System**

### **Coexistence:**

- Daily and weekly reports can run simultaneously
- Same queue infrastructure handles both types
- Different email templates and data processing
- Separate database storage with type differentiation

### **Resource Management:**

- Weekly reports are more resource-intensive (7 days of data)
- Consider running weekly cron during off-peak hours
- Monitor system performance during weekly generation

## 🚀 **Deployment Checklist**

- [ ] Add cron job to `vercel.json` or external service
- [ ] Set `CRON_SECRET` environment variable
- [ ] Test weekly endpoint manually
- [ ] Verify queue processing for weekly reports
- [ ] Check email delivery for weekly reports
- [ ] Monitor system performance during weekly runs
- [ ] Set up logging and monitoring alerts

## 📞 **Troubleshooting**

### **Common Issues:**

1. **Cron Not Running:**

   - Check cron job configuration
   - Verify `CRON_SECRET` is set correctly
   - Check server logs for errors

2. **Weekly Reports Not Generating:**

   - Ensure it's Sunday (cron only runs on Sundays)
   - Check queue worker is running
   - Verify database connections

3. **Email Delivery Issues:**
   - Check email service configuration
   - Verify RLS policies are fixed
   - Check email logs for errors

### **Support:**

- Check application logs for detailed error messages
- Monitor queue status via `/api/queue/status`
- Verify cron endpoint health via GET request
