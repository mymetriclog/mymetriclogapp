# Enhanced Report Generation Integration Guide

This guide explains how to integrate all the new advanced features from code.js into your Next.js MyMetricLog application.

## 🚀 New Features Implemented

### 1. Advanced Scoring System (`src/lib/scoring/advanced-wellness-scoring.ts`)

- **4-component weighted scoring**: Sleep (30%), Activity (30%), Heart (20%), Work (20%)
- **Detailed explanations**: Point-by-point breakdown for each score
- **Weekend adjustments**: Different scoring logic for weekends vs weekdays
- **HRV integration**: Heart Rate Variability scoring when available

### 2. Comprehensive Badge System (`src/lib/badges/advanced-badge-system.ts`)

- **20+ badge types**: Sleep Master, Step Warrior, Heart Hero, etc.
- **5-tier rarity system**: Common, Uncommon, Rare, Epic, Legendary
- **Combo badges**: Multiple metric combinations
- **Personal records**: Milestone tracking
- **Streak badges**: Consecutive achievements

### 3. Advanced Email Analysis (`src/lib/email/advanced-email-analysis.ts`)

- **Email category breakdown**: Primary, Social, Promotions, Updates, Forums
- **Noise percentage calculation**: Spam/promotional email filtering
- **Response time analysis**: Email response patterns
- **Management insights**: Specific recommendations for inbox optimization

### 4. Calendar Intelligence (`src/lib/calendar/calendar-intelligence.ts`)

- **Meeting analysis**: Focus time calculation
- **Energy drain assessment**: Meeting impact on productivity
- **Calendar intelligence score**: 0-100 scoring system
- **Contextual recommendations**: Time-based suggestions

### 5. Environmental Factors (`src/lib/environmental/environmental-factors.ts`)

- **Lunar phase tracking**: Moon cycle impact analysis
- **Seasonal daylight analysis**: Sunrise/sunset impact
- **Weather impact assessment**: Environmental factor scoring
- **Social context analysis**: Weekend vs weekday adjustments

### 6. Stress & Recovery Systems

- **Stress Radar** (`src/lib/stress/stress-radar.ts`): Multi-factor stress assessment
- **Recovery Quotient** (`src/lib/recovery/recovery-quotient.ts`): Comprehensive recovery scoring

### 7. Data Visualizations (`src/lib/visualizations/data-visualizations.ts`)

- **Sleep stages visualization**: Interactive bar charts with color coding
- **Heart rate zones visualization**: Zone distribution charts
- **Activity zones visualization**: Exercise intensity mapping
- **Trend charts**: Mini trend visualizations for each metric

### 8. Enhanced Report Generation (`src/lib/reports/enhanced-report-generator.ts`)

- **Integrated data processing**: Combines all systems
- **GPT insight generation**: Exact prompts from code.js
- **Comprehensive reporting**: All features in one system

## 🔧 How to Use

### 1. Update Your API Routes

Replace your existing report generation with:

```typescript
import { generateEnhancedDailyReport } from "@/lib/reports/enhanced-report-generator";
import { generateEnhancedDailyEmailTemplate } from "@/lib/sendgrid/templates/enhanced-daily-email-template";

export async function POST(request: Request) {
  const data = await request.json();

  // Generate enhanced report
  const reportData = await generateEnhancedDailyReport(
    data.fitbitSleep,
    data.fitbitActivity,
    data.fitbitHeart,
    data.fitbitHRV,
    data.gmailData,
    data.calendarData,
    data.spotifyData,
    data.weatherData,
    data.completedTasks,
    new Date(data.date)
  );

  // Generate email template
  const emailHtml = generateEnhancedDailyEmailTemplate(reportData);

  // Send email
  // ... email sending logic

  return Response.json({ success: true, reportData });
}
```

### 2. Update Your Components

Use the new scoring system in your dashboard:

```typescript
import { calculateWellnessScores } from "@/lib/scoring/advanced-wellness-scoring";
import { calculateDailyBadges } from "@/lib/badges/advanced-badge-system";

// In your component
const scores = calculateWellnessScores(
  sleepData,
  heartData,
  activityData,
  emailStats,
  calendarSummary,
  completedTasks,
  dayContext,
  allData
);

const badges = calculateDailyBadges(
  scores,
  fitbitData,
  emailStats,
  stressRadar,
  recoveryQuotient,
  calendarIntelligence
);
```

### 3. Add Visualizations

Use the new visualization components:

```typescript
import {
  generateSleepStagesVisualization,
  generateHeartRateZonesVisualization,
  generateActivityZonesVisualization,
} from "@/lib/visualizations/data-visualizations";

// In your component
const sleepViz = generateSleepStagesVisualization(sleepData);
const heartViz = generateHeartRateZonesVisualization(heartData);
const activityViz = generateActivityZonesVisualization(activityData);
```

## 📊 Data Flow

```
Raw Data (Fitbit, Gmail, Calendar, Spotify, Weather)
    ↓
Enhanced Report Generator
    ↓
Advanced Scoring System
    ↓
Badge System
    ↓
Stress & Recovery Analysis
    ↓
Environmental Factors
    ↓
Calendar Intelligence
    ↓
Email Analysis
    ↓
Data Visualizations
    ↓
GPT Insight Generation
    ↓
Enhanced Email Template
    ↓
Final Report
```

## 🎯 Key Benefits

1. **Exact Code.js Functionality**: All features from the original Google Apps Script
2. **Modular Architecture**: Each system can be used independently
3. **Type Safety**: Full TypeScript support
4. **Performance**: Optimized for Next.js
5. **Scalability**: Easy to extend and modify

## 🔄 Migration Steps

1. **Install Dependencies**: No new dependencies required
2. **Update Imports**: Replace old scoring with new advanced scoring
3. **Update API Routes**: Use enhanced report generator
4. **Update Components**: Use new badge and visualization systems
5. **Test Thoroughly**: Verify all features work as expected

## 🐛 Troubleshooting

- **Import Errors**: Make sure all file paths are correct
- **Type Errors**: Check that all interfaces match your data structure
- **Runtime Errors**: Verify that all required data is being passed to functions

## 📈 Next Steps

1. **Spotify Audio Features**: Implement audio analysis (pending)
2. **Historical Data**: Add trend analysis and pattern recognition
3. **Personal Records**: Implement milestone tracking
4. **Streak Tracking**: Add consecutive achievement tracking
5. **Advanced Visualizations**: Add more chart types and interactions

Your Next.js application now has all the advanced functionality from the code.js file! 🎉
