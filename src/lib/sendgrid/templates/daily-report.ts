export interface DailyReportData {
  date: string;
  score: number;
  quality: string;
  sleep: string;
  steps: number;
  calories: number;
  activeMinutes: number;
  heartRate: number;
  emailStats: {
    total: number;
    unread: number;
    sent: number;
    primary: number;
  };
  fitnessStats: {
    steps: number;
    calories: number;
    distance: number;
    sleep: string;
    restingHR: number;
  };
  insights: string[];
}

export function generateDailyReportEmail(data: DailyReportData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Report - ${data.date}</title>
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
      margin-bottom: 0;
    }
    .header-icons { 
      margin: 25px auto 20px auto;
      width: 60%;
      max-width: 300px;
      text-align: center;
    }
    .header-icons-table {
      width: 100%;
      border-collapse: collapse;
    }
    .header-icons-table td {
      text-align: center;
      padding: 0 10px;
    }
    .icon-circle { 
      width: 50px; 
      height: 50px; 
      border-radius: 50%; 
      display: inline-block;
      text-align: center;
      line-height: 50px;
      font-size: 20px; 
      color: white; 
      vertical-align: middle;
    }
    .icon-teal { background: #14b8a6; }
    .icon-purple { background: #a855f7; }
    .icon-pink { background: #ec4899; }
    .icon-yellow { background: #eab308; }
    .header h1 { 
      margin: 0; 
      font-size: 2.2rem; 
      font-weight: 700; 
      margin-bottom: 10px;
    }
    .header .date { 
      margin: 0; 
      font-size: 1.1rem; 
      opacity: 0.9; 
    }
    
    /* Overall Score Section */
    .score-section { 
      background: white; 
      padding: 30px 20px; 
      text-align: center; 
      border-bottom: 1px solid #e2e8f0; 
      margin-bottom: 0;
    }
    .overall-score { 
      font-size: 4rem; 
      font-weight: 700; 
      color: #f59e0b; 
      margin: 0; 
      line-height: 1;
    }
    .score-label { 
      font-size: 1.1rem; 
      color: #64748b; 
      margin: 8px 0; 
    }
    .score-change { 
      display: inline-block;
      padding: 10px 18px; 
      background: #fef3c7; 
      border-radius: 25px; 
      color: #92400e; 
      font-weight: 600; 
      margin: 20px 0; 
      font-size: 0.9rem;
    }
      .score-change-icon{
        margin-right: 10px;
      }
    .score-quality { 
      font-size: 1.5rem; 
      font-weight: 600; 
      color: #f59e0b; 
      margin: 15px 0; 
    }
    .context-note { 
      background: #f1f5f9; 
      padding: 18px; 
      border-radius: 12px; 
      margin: 20px 0; 
      color: #64748b; 
      font-size: 0.95rem; 
      border: 1px solid #e2e8f0;
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
    .glance-metrics { 
      text-align: left;
    }
    .metric-item { 
      display: inline-block;
      width: calc(50% - 20px);
      height: 120px;
      margin: 0 10px 20px 0;
      text-align: center; 
      min-width: 90px;
      vertical-align: top;
      background: white;
      padding: 18px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      box-sizing: border-box;
    }
    .metric-value { 
      font-size: 1.4rem; 
      font-weight: 700; 
      color: #1e293b; 
      margin: 0; 
      line-height: 1.2;
    }
    .metric-label { 
      color: #64748b; 
      margin: 8px 0; 
      font-size: 0.85rem; 
      text-transform: lowercase;
      font-weight: 500;
    }
      .section-custom img{
      margin-top: 3px;
      margin-right: 10px;
      }
    
    /* Activity Pattern Section */
    .activity-section { 
      padding: 25px; 
      background: #dcfce7; 
      margin: 20px; 
      border-radius: 16px;
      border: 1px solid #bbf7d0;
    }
    .activity-title { 
      font-size: 1.2rem; 
      font-weight: 600; 
      margin-bottom: 20px; 
      color: #1e293b;
    }
    .activity-chart { 
      margin-top: 15px;
      width: 100%;
      padding: 0 10px;
      height: 100px;
    }
    .activity-chart-table {
      width: 100%;
      border-collapse: collapse;
      height: 100px;
    }
    .activity-chart-table td {
      text-align: center;
      vertical-align: bottom;
      padding: 0 4px;
    }
    .activity-bar { 
      flex: 1; 
      background: #10b981; 
      border-radius: 3px; 
      position: relative; 
      min-width: 30px;
      max-width: 60px;
      transition: height 0.3s ease;
    }
    .activity-bar.orange { background: #f59e0b; }
    .activity-bar.brown { background: #a16207; }
    .activity-bar .hour { 
      position: absolute; 
      bottom: -25px; 
      left: 50%; 
      transform: translateX(-50%); 
      font-size: 0.75rem; 
      color: #64748b;
      font-weight: 500;
      white-space: nowrap;
    }
    .activity-bar .icon { 
      position: absolute; 
      top: -25px; 
      left: 50%; 
      transform: translateX(-50%); 
      font-size: 0.9rem; 
    }
    
    /* Integration Sections */
    .sections { padding: 20px; }
    .section { 
      margin-bottom: 25px; 
      padding: 25px; 
      border-radius: 16px; 
      background: #f8fafc; 
      border: 1px solid #e2e8f0; 
    }
    .section h3 { 
      margin: 0 0 20px 0; 
      font-size: 1.3rem; 
      color: #1e293b; 
      font-weight: 600;
    }
    .section h3 img {
      margin-right: 12px;
      vertical-align: middle;
    }
    .section-content { 
      text-align: left;
      margin-bottom: 20px;
      width: 100%;
    }
    .metric-card { 
      display: inline-block;
      width: calc(50% - 20px);
      height: 120px;
      margin: 0 10px 20px 0;
      vertical-align: top;
      background: white; 
      padding: 18px; 
      border-radius: 12px; 
      text-align: center; 
      border: 1px solid #e2e8f0; 
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      box-sizing: border-box;
    }
    .metric-card .metric-value { 
      font-size: 1.6rem; 
      font-weight: 700; 
      color: #1e293b; 
      margin: 0; 
      line-height: 1.2;
    }
    .metric-card .metric-label { 
      color: #64748b; 
      margin: 8px 0; 
      font-size: 0.85rem; 
      font-weight: 500;
      text-transform: lowercase;
    }
    .insights { margin-top: 20px; }
    .insight-item { 
      background: white; 
      padding: 15px; 
      border-radius: 10px; 
      margin: 10px 0; 
      border-left: 7px solid #3b82f6; 
      font-size: 0.9rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
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
    /* Footer */
    .footer { 
      background: #1e293b; 
      color: white; 
      padding: 25px; 
      text-align: center; 
      margin-top: 30px;
      border-radius:0px;
    }
    .footer p { margin: 0; opacity: 0.8; font-size: 0.85rem; line-height: 1.6; }
    
    /* Responsive Design */
    @media (max-width: 480px) {
      .container { max-width: 100%; }
      .header { padding: 25px 15px; }
      .header h1 { font-size: 1.8rem; }
             .header-icons { 
         width: 80%; 
         margin: 20px auto 15px auto;
         max-width: 250px;
       }
       .header-icons-table td {
         padding: 0 5px;
       }
      .icon-circle { 
        width: 40px; 
        height: 40px; 
        font-size: 16px;
      }
      .overall-score { font-size: 3rem; }
      .glance-metrics { gap: 15px; }
      .metric-item { min-width: 70px; }
      .activity-chart { 
        gap: 4px; 
        padding: 0 5px;
        height: 80px;
      }
      .activity-bar { 
        min-width: 25px; 
        max-width: 50px;
      }
      .activity-bar .hour { 
        font-size: 0.7rem; 
        bottom: -20px;
      }
      .activity-bar .icon { 
        font-size: 0.8rem; 
        top: -20px;
      }
      .section { padding: 20px; }
      .metric-card { 
        width: calc(50% - 20px);
        margin: 0 10px 20px 0;
      }
      .metric-item { 
        width: calc(50% - 20px);
        margin: 0 10px 20px 0;
      }
    }
    
    @media (max-width: 768px) and (min-width: 481px) {
             .header-icons { 
         width: 60%; 
         margin: 22px auto 18px auto;
         max-width: 280px;
       }
       .header-icons-table td {
         padding: 0 8px;
       }
      .icon-circle { 
        width: 45px; 
        height: 45px; 
        font-size: 18px;
      }
                           .metric-card { 
          width: calc(50% - 20px);
          margin: 0 10px 20px 0;
        }
        .metric-item { 
          width: calc(50% - 20px);
          margin: 0 10px 20px 0;
        }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header with Icons -->
    <div class="header">
      <div class="header-icons">
        <table class="header-icons-table">
          <tr>
            <td><div class="icon-circle icon-teal">📈</div></td>
            <td><div class="icon-circle icon-purple">📅</div></td>
            <td><div class="icon-circle icon-pink">👤</div></td>
            <td><div class="icon-circle icon-yellow">😊</div></td>
          </tr>
        </table>
      </div>
      <h1>MyMetricLog</h1>
      <p class="date">${data.date}</p>
    </div>
    
    <!-- Overall Score -->
    <div class="score-section">
      <h2 class="overall-score">${data.score}</h2>
      <p class="score-label">Overall Score</p>
      <div class="score-change">
        <span class="score-change-icon">📊</span>
        <span>Today's Performance</span>
      </div>
      <p class="score-quality">${data.quality}</p>
      <div class="context-note">
        Your typical day: ${data.score} (today matches average)
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
             <div class="glance-metrics">
               <div class="metric-item">
                 <div class="metric-value">${data.sleep}</div>
                 <div class="metric-label">sleep</div>
               </div>
               <div class="metric-item">
                 <div class="metric-value">${data.steps.toLocaleString()}</div>
                 <div class="metric-label">steps</div>
               </div>
               <div class="metric-item">
                 <div class="metric-value">${data.calories.toLocaleString()}</div>
                 <div class="metric-label">cal</div>
               </div>
               <div class="metric-item">
                 <div class="metric-value">${data.activeMinutes} min</div>
                 <div class="metric-label">active</div>
               </div>
               <div class="metric-item">
                 <div class="metric-value">${data.heartRate}</div>
                 <div class="metric-label">bpm</div>
               </div>
             </div>
    </div>
    
    <!-- 24-Hour Activity Pattern -->
    <div class="activity-section">
      <div class="activity-title">24-Hour Activity Pattern</div>
             <div class="activity-chart">
         <table class="activity-chart-table">
           <tr>
             <td>
               <div class="activity-bar orange" style="height: 30%">
                 <div class="icon">😴</div>
                 <div class="hour">0</div>
               </div>
             </td>
             <td>
               <div class="activity-bar brown" style="height: 15%">
                 <div class="hour">3</div>
               </div>
             </td>
             <td>
               <div class="activity-bar" style="height: 80%">
                 <div class="icon">⚡</div>
                 <div class="hour">6</div>
               </div>
             </td>
             <td>
               <div class="activity-bar brown" style="height: 20%">
                 <div class="hour">9</div>
               </div>
             </td>
             <td>
               <div class="activity-bar" style="height: 60%">
                 <div class="icon">⚡</div>
                 <div class="hour">12</div>
               </div>
             </td>
             <td>
               <div class="activity-bar brown" style="height: 25%">
                 <div class="hour">15</div>
               </div>
             </td>
             <td>
               <div class="activity-bar brown" style="height: 30%">
                 <div class="hour">18</div>
               </div>
             </td>
             <td>
               <div class="activity-bar orange" style="height: 40%">
                 <div class="icon">😴</div>
                 <div class="hour">21</div>
               </div>
             </td>
           </tr>
         </table>
       </div>
    </div>
    
    <!-- Integration Sections -->
    <div class="sections">
      <div class="section section-custom">
        <h3>📧 Email Summary</h3>
                 <div class="section-content">
          <div class="metric-card">
            <h4 class="metric-value">${data.emailStats.total}</h4>
            <p class="metric-label">total</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.emailStats.unread}</h4>
            <p class="metric-label">unread</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.emailStats.sent}</h4>
            <p class="metric-label">sent</p>
          </div>
                    <div class="metric-card">
            <h4 class="metric-value">${data.emailStats.primary}</h4>
            <p class="metric-label">primary</p>
          </div>
         </div>
        <div class="insights">
          <div class="insight-item">Primary inbox: ${
            data.emailStats.primary
          } emails</div>
          <div class="insight-item">Unread: ${
            data.emailStats.unread
          } emails</div>
          <div class="insight-item">Response rate: ${
            data.emailStats.total > 0
              ? Math.round((data.emailStats.sent / data.emailStats.total) * 100)
              : 0
          }%</div>
        </div>
      </div>
      
      <div class="section">
        <h3>🏃‍♂️ Fitness Summary</h3>
                 <div class="section-content">
          <div class="metric-card">
            <h4 class="metric-value">${data.fitnessStats.steps.toLocaleString()}</h4>
            <p class="metric-label">steps</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.fitnessStats.calories.toLocaleString()}</h4>
            <p class="metric-label">calories</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.fitnessStats.distance.toLocaleString()}</h4>
            <p class="metric-label">distance</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.fitnessStats.sleep}</h4>
            <p class="metric-label">sleep</p>
          </div>
          <div class="metric-card">
            <h4 class="metric-value">${data.fitnessStats.restingHR}</h4>
            <p class="metric-label">restingHR</p>
          </div>
        </div>
        <div class="insights">
          <div class="insight-item">Steps: ${data.fitnessStats.steps.toLocaleString()}</div>
          <div class="insight-item">Calories burned: ${data.fitnessStats.calories.toLocaleString()}</div>
          <div class="insight-item">Sleep: ${data.fitnessStats.sleep}</div>
          <div class="insight-item">Resting HR: ${
            data.fitnessStats.restingHR
          } bpm</div>
        </div>
      </div>
      
      <div class="section">
        <h3>💡 Daily Insights</h3>
        ${Array.isArray(data.insights) 
          ? data.insights.map((insight) => `<div class="insight-item">${insight}</div>`).join("")
          : `<div class="insight-item">Great job maintaining consistent activity levels today!</div>
             <div class="insight-item">Your sleep quality has improved compared to yesterday.</div>
             <div class="insight-item">Consider taking a short walk during your lunch break for better energy.</div>`
        }
      </div>
      
<div class="section">
  <h3>🧘 Daily Mantra</h3>
  <div class="insight-item" style="border-color:transparent;">
    <p style="box-sizing: border-box;
              background: white;
              padding: 15px;
              border-radius: 10px;
              margin: 10px 0;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05);
              text-align: center;
              font-style: italic;
              font-size: 1.3rem;
              border-left: 5px solid #3b82f6;
              border-top-left-radius: 15px;
              border-bottom-left-radius: 15px;">
      "Every step forward is progress, no matter how small."
    </p>
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
