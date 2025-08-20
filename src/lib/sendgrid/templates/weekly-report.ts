export interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  averageScore: number;
  quality: string;
  weeklyStats: {
    totalSteps: number;
    totalCalories: number;
    totalDistance: number;
    averageSleep: string;
    averageHeartRate: number;
    totalActiveMinutes: number;
  };
  dailyScores: Array<{
    day: string;
    score: number;
    date: string;
  }>;
  emailStats: {
    totalEmails: number;
    totalUnread: number;
    totalSent: number;
    averageResponseTime: string;
  };
  fitnessStats: {
    averageSteps: number;
    totalCalories: number;
    totalDistance: number;
    averageSleep: string;
    averageRestingHR: number;
    activeDays: number;
  };
  insights: string[];
  improvements: string[];
}

export function generateWeeklyReportEmail(data: WeeklyReportData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Report - ${data.weekStart} to ${data.weekEnd}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      background: #f8fafc; 
      color: #1e293b;
      line-height: 1.6;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      min-height: 100vh;
      position: relative;
    }
    
    /* Header Section */
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
      border-radius: 0 0 20px 20px;
    }
    .header-icons { 
      display: flex; 
      justify-content: center; 
      gap: 15px; 
      margin-bottom: 20px; 
    }
    .icon-circle { 
      width: 50px; 
      height: 50px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 20px; 
      color: white; 
    }
    .icon-teal { background: #14b8a6; }
    .icon-purple { background: #a855f7; }
    .icon-pink { background: #ec4899; }
    .icon-yellow { background: #eab308; }
    .header h1 { 
      margin: 0; 
      font-size: 2rem; 
      font-weight: 700; 
      margin-bottom: 10px;
    }
    .header .date { 
      margin: 0; 
      font-size: 1rem; 
      opacity: 0.9; 
    }
    
    /* Overall Score Section */
    .score-section { 
      background: white; 
      padding: 30px 20px; 
      text-align: center; 
      border-bottom: 1px solid #e2e8f0; 
    }
    .overall-score { 
      font-size: 3.5rem; 
      font-weight: 700; 
      color: #f59e0b; 
      margin: 0; 
    }
    .score-label { 
      font-size: 1rem; 
      color: #64748b; 
      margin: 5px 0; 
    }
    .score-change { 
      display: inline-flex; 
      align-items: center; 
      gap: 8px; 
      padding: 8px 16px; 
      background: #fef3c7; 
      border-radius: 20px; 
      color: #92400e; 
      font-weight: 600; 
      margin: 15px 0;
    }
    .score-quality { 
      font-size: 1.3rem; 
      font-weight: 600; 
      color: #f59e0b; 
      margin: 10px 0; 
    }
    .week-range {
      font-size: 0.9rem;
      color: #64748b;
      margin-top: 10px;
    }
        .chart-section { 

      padding: 20px; 

      background: white; 

      border-bottom: 1px solid #e2e8f0;

    }

    .chart-title { 

      font-size: 1.1rem; 

      font-weight: 600; 

      margin-bottom: 15px; 

      color: #1e293b;

    }

    .chart-bars { 

      display: flex; 

      justify-content: space-between; 

      align-items: end; 

      height: 120px; 

      gap: 8px;

    }

    .chart-bar { 

      flex: 1; 

      background: #10b981; 

      border-radius: 4px 4px 0 0; 

      position: relative; 

      min-width: 30px;

    }

    .chart-bar.orange { background: #f59e0b; }

    .chart-bar .score { 

      position: absolute; 

      top: -25px; 

      left: 50%; 

      transform: translateX(-50%); 

      font-size: 0.8rem; 

      font-weight: 600; 

      color: #1e293b;

    }

    .chart-bar .day { 

      position: absolute; 

      bottom: -25px; 

      left: 50%; 

      transform: translateX(-50%); 

      font-size: 0.8rem; 

      color: #64748b;

    }
    
    /* Weekly Trend Chart */
    .chart-section { 
      padding: 20px; 
      background: white; 
      border-bottom: 1px solid #e2e8f0;
    }
    .chart-title { 
      font-size: 1.1rem; 
      font-weight: 600; 
      margin-bottom: 15px; 
      color: #1e293b;
    }
    .chart-bars { 
      display: flex; 
      justify-content: space-between; 
      align-items: end; 
      height: 120px; 
      gap: 8px;
    }
    .chart-bar { 
      flex: 1; 
      background: #10b981; 
      border-radius: 4px 4px 0 0; 
      position: relative; 
      min-width: 30px;
    }
    .chart-bar.orange { background: #f59e0b; }
    .chart-bar .score { 
      position: absolute; 
      top: -25px; 
      left: 50%; 
      transform: translateX(-50%); 
      font-size: 0.8rem; 
      font-weight: 600; 
      color: #1e293b;
    }
         .chart-bar .day { 
       position: absolute; 
       bottom: -25px; 
       left: 50%; 
       transform: translateX(-50%); 
       font-size: 0.8rem; 
       color: #64748b;
     }
     
     /* At a Glance Section */
     .glance-section { 
       padding: 25px; 
       background: #dbeafe; 
       margin: 20px; 
       border-radius: 16px;
       border: 1px solid #bfdbfe;
     }
     .glance-title { 
       font-size: 1.2rem; 
       font-weight: 600; 
       margin-bottom: 20px; 
       color: #1e293b;
     }
    
    /* Weekly Summary Section */
    .summary-section { 
      padding: 20px; 
      background: #dbeafe; 
      margin: 20px; 
      border-radius: 16px;
    }
    .summary-title { 
      font-size: 1.1rem; 
      font-weight: 600; 
      margin-bottom: 15px; 
      color: #1e293b;
    }
         .summary-metrics { 
       text-align: left;
     }
           .metric-item { 
        display: inline-block;
        width: calc(50% - 20px);
        height: 120px;
        margin: 0 10px 20px 0;
        text-align: center; 
        background: white;
        padding: 18px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        vertical-align: top;
        box-sizing: border-box;
      }
    .metric-value { 
      font-size: 1.2rem; 
      font-weight: 700; 
      color: #1e293b; 
      margin: 0; 
    }
    .metric-label { 
      color: #64748b; 
      margin: 5px 0; 
      font-size: 0.8rem; 
    }
    
    /* Integration Sections */
    .sections { padding: 20px; }
    .section { 
      margin-bottom: 20px; 
      padding: 20px; 
      border-radius: 16px; 
      background: #f8fafc; 
      border: 1px solid #e2e8f0; 
    }
    .section h3 { 
      margin: 0 0 15px 0; 
      font-size: 1.2rem; 
      color: #1e293b; 
      display: flex; 
      align-items: center; 
      gap: 10px; 
    }
         .section-content { 
       text-align: left;
     }
           .metric-card { 
        display: inline-block;
        width: calc(50% - 20px);
        height: 120px;
        margin: 0 10px 20px 0;
        text-align: center; 
        background: white; 
        padding: 18px; 
        border-radius: 12px; 
        border: 1px solid #e2e8f0; 
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        vertical-align: top;
        box-sizing: border-box;
      }
    .metric-value { 
      font-size: 1.5rem; 
      font-weight: 700; 
      color: #1e293b; 
      margin: 0; 
    }
    .metric-label { 
      color: #64748b; 
      margin: 5px 0; 
      font-size: 0.8rem; 
    }
    .insights { margin-top: 15px; }
    .insight-item { 
      background: white; 
      padding: 12px; 
      border-radius: 8px; 
      margin: 8px 0; 
      border-left: 4px solid #3b82f6; 
      font-size: 0.9rem;
    }
    .improvement-item { 
      background: white; 
      padding: 12px; 
      border-radius: 8px; 
      margin: 8px 0; 
      border-left: 4px solid #3b82f6; 
      font-size: 0.9rem;
    }
    
    /* Footer */
    .footer { 
      background: #1e293b; 
      color: white; 
      padding: 20px; 
      text-align: center; 
      margin-top: 20px;
    }
    .footer p { margin: 0; opacity: 0.8; font-size: 0.8rem; }
    
         /* Responsive */
     @media (max-width: 600px) {
       .summary-metrics { 
         text-align: center;
       }
               .metric-item { 
          width: calc(50% - 20px);
          height: 120px;
          margin: 0 10px 20px 10px;
        }
       .section-content { 
         text-align: center;
       }
               .metric-card { 
          width: calc(50% - 20px);
          height: 120px;
          margin: 0 10px 20px 10px;
        }
     }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header with Icons -->
    <div class="header">
      <div class="header-icons">
        <div class="icon-circle icon-teal">📈</div>
        <div class="icon-circle icon-purple">📅</div>
        <div class="icon-circle icon-pink">👤</div>
        <div class="icon-circle icon-yellow">😊</div>
      </div>
      <h1>MyMetricLog</h1>
      <p class="date">Weekly Report</p>
    </div>
    
    <!-- Overall Score -->
    <div class="score-section">
      <h2 class="overall-score">${data.averageScore}</h2>
      <p class="score-label">Weekly Average Score</p>
      <div class="score-change">
        <span>📊</span>
        <span>This Week's Performance</span>
      </div>
      <p class="score-quality">${data.quality}</p>
      <p class="week-range">${data.weekStart} - ${data.weekEnd}</p>
    </div>
    
    <!-- Weekly Trend Chart -->
    <div class="chart-section">
      <div class="chart-title">Daily Score Trend</div>
      <div class="chart-bars">
        ${data.dailyScores
          .map((day, index) => {
            const height = (day.score / 100) * 100;
            const isOrange = day.score < 75;
            return `
            <div class="chart-bar ${
              isOrange ? "orange" : ""
            }" style="height: ${height}%">
              <div class="score">${day.score}</div>
              <div class="day">${day.day}</div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
    
  <div class="chart-section">

      <div class="chart-title">Historical Score Trend</div>

      <div class="chart-bars">

        <div class="chart-bar" style="height: 82%">

          <div class="score">82</div>

          <div class="day">5d</div>

        </div>

        <div class="chart-bar" style="height: 87%">

          <div class="score">87</div>

          <div class="day">4d</div>

        </div>

        <div class="chart-bar" style="height: 90%">

          <div class="score">90</div>

          <div class="day">3d</div>

        </div>

        <div class="chart-bar orange" style="height: 70%">

          <div class="score">70</div>

          <div class="day">2d</div>

        </div>

        <div class="chart-bar" style="height: 85%">

          <div class="score">85</div>

          <div class="day">1d</div>

        </div>

        <div class="chart-bar orange" style="height: 71%">

          <div class="score">71</div>

          <div class="day">Today</div>

        </div>

      </div>

    </div>


    <!-- At a Glance Section -->
    <div class="glance-section">
      <div class="glance-title">At a Glance:</div>
      <div class="summary-metrics">
        <div class="metric-item">
          <div class="metric-value">0h 0m</div>
          <div class="metric-label">sleep</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">0</div>
          <div class="metric-label">steps</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">0</div>
          <div class="metric-label">cal</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">0 min</div>
          <div class="metric-label">active</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">0</div>
          <div class="metric-label">bpm</div>
        </div>
      </div>
    </div>
    
    <!-- Weekly Summary Section -->
    <div class="summary-section">
      <div class="summary-title">Weekly Summary:</div>
      <div class="summary-metrics">
        <div class="metric-item">
          <div class="metric-value">${data.weeklyStats.totalSteps.toLocaleString()}</div>
          <div class="metric-label">total steps</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${data.weeklyStats.totalCalories.toLocaleString()}</div>
          <div class="metric-label">calories burned</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${data.weeklyStats.averageSleep}</div>
          <div class="metric-label">avg sleep</div>
        </div>
      </div>
    </div>
    
    <!-- Integration Sections -->
    <div class="sections">
      <div class="section">
        <h3>📧 Email Summary</h3>
        <div class="section-content">
          <div class="metric-card">
            <h4 class="metric-value">${data.emailStats.totalEmails}</h4>
            <p class="metric-label">total</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.emailStats.totalUnread}</h4>
            <p class="metric-label">unread</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.emailStats.totalSent}</h4>
            <p class="metric-label">sent</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.emailStats.averageResponseTime}</h4>
            <p class="metric-label">avg response</p>
          </div>
        </div>
        <div class="insights">
          <div class="insight-item">Total emails processed: ${
            data.emailStats.totalEmails
          }</div>
          <div class="insight-item">Response rate: ${
            data.emailStats.totalEmails > 0
              ? Math.round(
                  (data.emailStats.totalSent / data.emailStats.totalEmails) *
                    100
                )
              : 0
          }%</div>
          <div class="insight-item">Average response time: ${
            data.emailStats.averageResponseTime
          }</div>
        </div>
      </div>
      
      <div class="section">
        <h3>🏃‍♂️ Fitness Summary</h3>
        <div class="section-content">
          <div class="metric-card">
            <h4 class="metric-value">${data.fitnessStats.averageSteps.toLocaleString()}</h4>
            <p class="metric-label">avg steps</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.fitnessStats.totalCalories.toLocaleString()}</h4>
            <p class="metric-label">total cal</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.fitnessStats.totalDistance.toLocaleString()}</h4>
            <p class="metric-label">total dist</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.fitnessStats.averageSleep}</h4>
            <p class="metric-label">avg sleep</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.fitnessStats.activeDays}/7</h4>
            <p class="metric-label">active days</p>
          </div>
        </div>
        <div class="insights">
          <div class="insight-item">Average daily steps: ${data.fitnessStats.averageSteps.toLocaleString()}</div>
          <div class="insight-item">Total calories burned: ${data.fitnessStats.totalCalories.toLocaleString()}</div>
          <div class="insight-item">Active days this week: ${
            data.fitnessStats.activeDays
          }/7</div>
          <div class="insight-item">Average sleep: ${
            data.fitnessStats.averageSleep
          }</div>
        </div>
      </div>
      
      <div class="section">
        <h3>💡 Weekly Insights</h3>
        ${data.insights
          .map((insight) => `<div class="insight-item">${insight}</div>`)
          .join("")}
      </div>
      
      <div class="section">
        <h3>🚀 Areas for Improvement</h3>
        ${data.improvements
          .map(
            (improvement) =>
              `<div class="improvement-item">${improvement}</div>`
          )
          .join("")}
      </div>
      
      <div class="section">
        <h3>🧘 Weekly Mantra</h3>
        <div class="insight-item" style="text-align: center; font-style: italic; font-size: 1.1rem;">
          "Consistency is the key to lasting change. Keep building healthy habits one day at a time."
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      <p>MyMetricLog - Your Personal Wellness Dashboard</p>
    </div>
  </div>
</body>
</html>`;
}
