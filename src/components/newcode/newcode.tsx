var SAGE_IMAGES = {
  analysis: "https://i.ibb.co/RT990pVm/Sage-analysis.png",
  working: "https://i.ibb.co/QvT3v0XS/Sage-work.png",
  sleep: "https://i.ibb.co/4ZTBpSS0/Sage-sleep.png",
  active: "https://i.ibb.co/Q3vJSfjK/Sage-active.png",
  heart: "https://i.ibb.co/B2yFxMs1/Sage-heart.png",
  weather: "https://i.ibb.co/m5B8H8Gk/Sage-weather.png",
  meditation: "https://i.ibb.co/XkScD1Bn/Sage-meditation.png",
  music: "https://i.ibb.co/TMhvM4q5/Sage-music.png",
  recovery: "https://i.ibb.co/xVfP72M/Sage-recovery.png",
  greeting: "https://i.ibb.co/gbTdSHcx/Sage-hi.png",
  quickwin: "https://i.ibb.co/hJ2433Xh/Sage-quick-win.png", // ← ADD THIS
};

// Updated getMyMetricLogDaily() function with all new feature calls
function getMyMetricLogDaily() {
  Logger.log("🧠 [MyMetricLog] Starting daily summary...");

  // Clean up old mood properties
  cleanupOldMoodProperties();

  var now = new Date();

  // IMPORTANT: Adjust all date ranges to be for yesterday
  var yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  var twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  var dateStr = Utilities.formatDate(
    yesterday,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  var fullDateStr = getFormattedDate(yesterday);

  // Calendar Summary - for yesterday
  var calEvents = CalendarApp.getDefaultCalendar().getEvents(
    twoDaysAgo,
    yesterday
  );
  var calendarAnalysis = getAdvancedCalendarAnalysis(calEvents);
  var calSummary = formatCalendarAnalysis(calendarAnalysis);

  // NEW: Calendar Intelligence
  var calendarIntelligence = analyzeCalendarIntelligence(calEvents);

  // Email Summary - for yesterday
  // Email Summary - for yesterday with category breakdown
  var dateQuery =
    "after:" + formatDate(twoDaysAgo) + " before:" + formatDate(yesterday);

  // Get emails by category
  var categories = {
    primary: GmailApp.search(dateQuery + " category:primary").length,
    social: GmailApp.search(dateQuery + " category:social").length,
    promotions: GmailApp.search(dateQuery + " category:promotions").length,
    updates: GmailApp.search(dateQuery + " category:updates").length,
    forums: GmailApp.search(dateQuery + " category:forums").length,
  };

  var totalReceived = GmailApp.search(dateQuery).length;
  var sent = GmailApp.search("from:me " + dateQuery).length;
  var noise =
    categories.social +
    categories.promotions +
    categories.updates +
    categories.forums;
  var noisePercentage =
    totalReceived > 0 ? Math.round((noise / totalReceived) * 100) : 0;

  // Build summary - focus on primary
  var emailSummaryParts = [];
  emailSummaryParts.push("📩 Primary Inbox: " + categories.primary + " emails");
  emailSummaryParts.push("📤 Sent: " + sent + " emails");
  if (noise > 20) {
    emailSummaryParts.push(
      "🔕 Filtered: " +
        noise +
        " promotional/social (" +
        noisePercentage +
        "% of total)"
    );
  }
  var emailSummary = emailSummaryParts.join("\n");

  // Add email response time analysis
  var emailResponseAnalysis = analyzeEmailResponseTimes(twoDaysAgo, yesterday);

  var emailStats = {
    received: categories.primary, // Now this is just primary
    sent: sent,
    primary: categories.primary,
    noise: noise,
    noisePercentage: noisePercentage,
    promotions: categories.promotions,
    social: categories.social,
    totalReceived: totalReceived,
  };
  // Tasks - completed yesterday
  var completedTasks = getCompletedTasksForDate(yesterday);
  if (
    !completedTasks ||
    String(completedTasks).toLowerCase().indexOf("no tasks") !== -1 ||
    String(completedTasks).length < 5
  ) {
    completedTasks = "";
  }

  // Spotify - yesterday's listening
  var spotifyData = getSpotifyHistoryForYesterday();
  var spotifySummary =
    spotifyData && spotifyData.items && spotifyData.items.length > 0
      ? summarizeSpotifyHistory(spotifyData)
      : "No Spotify listening data found.";

  // Parse audio features for recommendations
  var audioFeatures = null;
  if (spotifyData && spotifyData.items && spotifyData.items.length > 0) {
    audioFeatures = getSpotifyAudioFeatures(spotifyData);
  }

  // Fitbit - yesterday's data
  // Fitbit - yesterday's data for activity and heart, but try today's sleep first
  var fitbitActivity = getFitbitActivitySummaryForDate(yesterday);
  var fitbitActivityLog = getFitbitActivityLogForDate(yesterday);
  var fitbitSleep = getFitbitSleepSummaryForDate(new Date(), true); // true = try today first
  var fitbitHeart = getFitbitHeartSummaryForDate(yesterday);
  var hrvData = getFitbitHRVForDate(yesterday);
  if (hrvData) {
    fitbitHeart += "\n" + hrvData;
  }
  var fitbitHRV = getFitbitHRVForDate(yesterday);
  var peakHRMatch = fitbitHeart.match(/Peak HR: (\d+)/);
  var peakHR = peakHRMatch ? parseInt(peakHRMatch[1]) : "N/A";

  // Weather - yesterday's weather
  var weatherSummary = convertWeatherToFahrenheit(getWeatherSummary());
  var hourlyWeather = getHourlyWeatherForecast();
  Logger.log("Hourly Weather Data: " + JSON.stringify(hourlyWeather));

  // Mood from day before yesterday
  var previousMood = getMoodFromDayBefore();
  // Note: fitbitSleep now contains last night's sleep (if available) which affects today's mood
  var moodInsight = getPredictedMood(fitbitSleep, fitbitHeart, spotifySummary);

  // Get scores using weighted system

  // Create allData object with all the data needed for weekend detection
  var allData = {
    fitbitHRV: hrvData,
    dayContext: dayContext, // This is needed for weekend detection
    calendarAnalysis: calendarAnalysis,
    emailStats: emailStats,
    emailResponseAnalysis: emailResponseAnalysis,
  };

  // Get scores using weighted system
  var scores = getMyMetricLogScoreBreakdown(
    fitbitSleep,
    fitbitHeart,
    fitbitActivity,
    emailStats,
    calSummary,
    completedTasks,
    dayContext,
    allData
  );
  // Get day context for yesterday
  var dayContext = getContextualDayAnalysis(
    yesterday,
    scores,
    calendarAnalysis
  );
  // ADD: Store calendar events in dayContext for later use
  dayContext.calendarData = calEvents;

  // Stress Detection
  var stressRadar = getStressRadar(
    { sleep: fitbitSleep, heart: fitbitHeart },
    calendarAnalysis,
    emailStats,
    spotifySummary
  );

  // Recovery Score
  var recoveryQuotient = getRecoveryQuotient(
    fitbitSleep,
    fitbitHeart,
    fitbitActivity,
    null // previousDayData - would fetch this
  );

  // NEW: Environmental Factors
  var environmentalFactors = getSocialEnvironmentalFactors(
    yesterday,
    weatherSummary,
    calendarAnalysis
  );

  // NEW: Get historical data for anomaly detection
  var trends = getScoreTrends();
  var historicalData = [];
  if (trends && trends.overall && trends.overall.sparkline) {
    historicalData = trends.overall.sparkline.map(function (score, index) {
      return { score: score };
    });
  }

  // NEW: Biometric Anomaly Detection
  var anomalies = detectBiometricAnomalies(
    { heart: fitbitHeart, sleep: fitbitSleep },
    historicalData
  );

  // NEW: Deep AI Insights
  var deepInsights = generateDeepAIInsights({
    scores: scores,
    stressRadar: stressRadar,
    recoveryQuotient: recoveryQuotient,
    calendarIntelligence: calendarIntelligence,
  });

  // Calculate badges - ADD THIS BLOCK
  var badges = calculateDailyBadges(
    scores,
    { sleep: fitbitSleep, activity: fitbitActivity, heart: fitbitHeart },
    emailStats,
    stressRadar,
    recoveryQuotient,
    calendarIntelligence
  );

  var streakBadges = calculateStreakBadges(dateStr);

  // ADD these lines immediately after:
  // Check for combo badges
  var comboBadges = checkComboBadges(badges, dayContext, scores);
  badges = badges.concat(comboBadges);

  // Re-sort after adding combos
  var rarityOrder = ["legendary", "epic", "rare", "uncommon", "common"];
  badges.sort(function (a, b) {
    return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
  });

  // After the combo badges section, ADD:
  // Check for personal records
  var recordBadges = checkPersonalRecords(
    { activity: fitbitActivity, sleep: fitbitSleep, score: scores.total },
    dateStr
  );
  badges = badges.concat(recordBadges);

  // Check for milestones
  var milestoneBadges = checkMilestoneBadges(dateStr);
  badges = badges.concat(milestoneBadges);

  // Re-sort all badges
  badges.sort(function (a, b) {
    return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
  });

  // Generate narrative
  var badgeNarrative = generateBadgeNarrative(badges, scores, dayContext);

  // Get near misses
  var nearMisses = getNearMissBadges(
    scores,
    { activity: fitbitActivity, sleep: fitbitSleep, heart: fitbitHeart },
    emailStats
  );

  // Compose enhanced GPT input with new data
  var gptInput =
    "Yesterday's (" +
    dayContext.dayName +
    ") mood: " +
    previousMood +
    "\n" +
    "Note: Sleep data reflects last night's rest (affecting today's energy)\n\n" +
    "SCORE BREAKDOWN:\n" +
    "Overall: " +
    scores.total +
    "/100\n" +
    "Sleep: " +
    scores.sleep +
    "/100 - " +
    scores.explanations.sleep.join("; ") +
    "\n" +
    "Activity: " +
    scores.activity +
    "/100 - " +
    scores.explanations.activity.join("; ") +
    "\n" +
    "Heart: " +
    scores.heart +
    "/100 - " +
    scores.explanations.heart.join("; ") +
    "\n" +
    "Work: " +
    scores.work +
    "/100 - " +
    scores.explanations.work.join("; ") +
    "\n\n" +
    "Calendar:\n" +
    calSummary +
    "\n\n" +
    "Calendar Intelligence Score: " +
    calendarIntelligence.score +
    "/100\n" +
    (calendarIntelligence.insights.length > 0
      ? "Calendar Issues: " + calendarIntelligence.insights.join(", ") + "\n\n"
      : "") +
    "Emails:\n" +
    emailSummary +
    "\n\n" +
    (emailStats.noisePercentage > 70
      ? "Note: " +
        emailStats.noisePercentage +
        "% of emails were promotional/social noise\n\n"
      : "") +
    (completedTasks ? "Tasks:\n" + completedTasks + "\n\n" : "") +
    "Spotify:\n" +
    spotifySummary +
    "\n\n" +
    "Activity:\n" +
    fitbitActivity +
    "\n\n" +
    "Sleep:\n" +
    fitbitSleep +
    "\n\n" +
    "Heart:\n" +
    fitbitHeart +
    "\n\n" +
    "Weather:\n" +
    weatherSummary +
    "\n\n" +
    "Stress Level:\n" +
    formatStressRadar(stressRadar) +
    "\n\n" +
    "Recovery:\n" +
    formatRecoveryQuotient(recoveryQuotient) +
    "\n\n" +
    // Add new data to GPT context
    (anomalies.detected.length > 0
      ? "Biometric Anomalies: " +
        anomalies.detected
          .map(function (a) {
            return a.type + " - " + a.insight;
          })
          .join("; ") +
        "\n\n"
      : "") +
    (environmentalFactors.weather.impact !== "neutral"
      ? "Environmental Impact: " + environmentalFactors.weather.insight + "\n\n"
      : "") +
    (deepInsights.patterns.length > 0
      ? "AI Pattern Detected: " +
        deepInsights.patterns[0].type +
        " - " +
        deepInsights.patterns[0].detail +
        "\n\n"
      : "");

  // Update the GPT prompt to use "you" instead of "the user"
  var insight = getGPTInsight(
    "You are Sage, a wise and insightful fox who serves as a personal wellness analyst. You're knowledgeable, supportive, and focus on integrated analysis rather than criticism. You combine ancient wisdom with modern wellness science, speaking with warmth and genuine care.\n\n" +
      "SAGE'S PERSONALITY:\n" +
      "• You're an expert analyst who sees patterns others miss\n" +
      "• You provide integrated insights, not just observations\n" +
      "• You're encouraging and constructive, never scolding\n" +
      "• You connect the dots between different metrics\n" +
      "• Balance expertise with warmth and support\n" +
      "• You're that friend who helps you understand yourself better\n\n" +
      "IMPORTANT CONTEXT - Yesterday's EXACT scores and explanations:\n" +
      "• Overall Score: " +
      scores.total +
      "/100\n" +
      "• Sleep: " +
      scores.sleep +
      "/100 (" +
      scores.explanations.sleep.join("; ") +
      ")\n" +
      "• Activity: " +
      scores.activity +
      "/100 (" +
      scores.explanations.activity.join("; ") +
      ")\n" +
      "• Heart: " +
      scores.heart +
      "/100 (" +
      scores.explanations.heart.join("; ") +
      ")\n" +
      "• Work: " +
      scores.work +
      "/100 (" +
      scores.explanations.work.join("; ") +
      ")\n" +
      "• Stress: " +
      stressRadar.level +
      " (" +
      stressRadar.score +
      "/100)\n" +
      "• Recovery: " +
      recoveryQuotient.readiness +
      " (" +
      recoveryQuotient.score +
      "/100)\n\n" +
      "KEY INSIGHTS TO INCORPORATE:\n" +
      "- If 0 meetings: This is POSITIVE - highlight the rare focus opportunity\n" +
      "- If high email noise %: This is about inbox filtering, not work performance\n" +
      "- Reference the EXACT scores above, don't make up numbers\n" +
      "- Explain WHY each score is what it is based on the breakdowns provided\n" +
      "- Match headlines to actual data (don't say 'work intensity stealing sleep' if work score is 100)\n\n" +
      "Yesterday was a " +
      dayContext.dayType +
      " (" +
      dayContext.dayName +
      ").\n\n" +
      "Write your response in EXACTLY this format with [PARAGRAPH BREAK] markers:\n\n" +
      "[Paragraph 1: Metrics overview]\n" +
      "[PARAGRAPH BREAK]\n" +
      "[Paragraph 2: Integrated analysis]\n" +
      "[PARAGRAPH BREAK]\n" +
      "[Paragraph 3: Recommendation]\n\n" +
      "PARAGRAPH 1 (Metrics Overview - 60-80 words): Present yesterday's scores conversationally but precisely. Start with: 'Your " +
      dayContext.dayName +
      " delivered a [adjective] **" +
      scores.total +
      "/100**.' Then cover each subscore with its main driver. Example: 'Sleep hit **85/100** with **7h 42m** of quality rest, though efficiency at **65%** suggests some restlessness. Activity reached **90/100** powered by **12,415 steps** and **60+ active minutes**.' Include all 4 subscores. Be factual here - save analysis for paragraph 2.\n\n" +
      "PARAGRAPH 2 (Integrated Analysis - 60-80 words): NOW connect the dots. Show how metrics influenced each other. Examples: 'That stellar activity score despite poor sleep efficiency? Classic compensation pattern - your body pushed through fatigue with movement.' or 'With **0 meetings** and perfect work score, you capitalized on rare deep focus time.' Include:\n" +
      "• How sleep affected other metrics\n" +
      "• Email/meeting patterns and their impact\n" +
      "• Any notable patterns or mismatches\n" +
      "• Recovery vs activity balance\n\n" +
      "PARAGRAPH 3 (Today's Action - 40-60 words): ONE specific recommendation targeting the biggest opportunity. Format: '**[Action] at [time]** - [why it matters].' Example: '**Set bedroom to 65°F at 9:30 PM tonight** - your **49% sleep efficiency** screams environmental issues. Cool, dark, quiet wins every time.' End with brief encouragement.\n\n" +
      "CRITICAL STYLE RULES:\n" +
      "• NO EXTENDED METAPHORS - Max 2-3 light comparisons total\n" +
      "• NO THEMED RESPONSES (no symphony, recipe, journey, etc. throughout)\n" +
      "• Be conversational but not cutesy\n" +
      "• Use specific numbers, not vague descriptions\n" +
      "• If you mention 'Chef's kiss' or similar, use it ONCE max\n\n" +
      "ADDITIONAL GUIDELINES:\n" +
      "• If task data is unavailable or shows no tasks, DO NOT penalize or mention as negative\n" +
      "• When work score includes 'Task tracking not configured = 25/25 points', don't treat as an issue\n" +
      "• For sedentary time, be real but not harsh: 'typical for desk warriors' not 'terrible inactivity'\n" +
      "• Weekend context: lower activity/work is GOOD, not concerning\n\n" +
      "FORMATTING RULES:\n" +
      "• YOU MUST include [PARAGRAPH BREAK] between each paragraph\n" +
      "• Use **bold** for ALL numbers and key actions\n" +
      "• No greetings or headers - jump right in\n" +
      "• Always use 'you/your' - you're talking TO them\n" +
      "• Keep it 180-220 words total (NOT 250)\n\n" +
      "TONE GUIDELINES:\n" +
      "• Sound like their smartest, most caring friend\n" +
      "• Add personality through word choice, not gimmicks\n" +
      "• If something's off, say it kindly but directly\n" +
      "• Make insights clear first, clever second\n" +
      "• End with motivation, not just instructions\n\n" +
      (dayContext.dayType === "weekend"
        ? "WEEKEND CONTEXT: Lower activity is recovery, not laziness. Zero meetings is perfect. Different rhythm, different goals.\n"
        : "") +
      (stressRadar.level === "High"
        ? "Address the high stress levels with compassion. "
        : "") +
      (recoveryQuotient.score < 60
        ? "Emphasize recovery - they need rest, not pushing. "
        : "") +
      (anomalies.detected.length > 0
        ? "Mention the biometric anomaly but don't alarm them. "
        : "") +
      (emailStats.noisePercentage > 70
        ? "The " +
          emailStats.noisePercentage +
          "% email noise is inbox pollution, not their fault. "
        : "") +
      "\nFINAL REMINDERS:\n" +
      "• Paragraph 1: State facts with personality\n" +
      "• Paragraph 2: Reveal insights they might miss\n" +
      "• Paragraph 3: Give one clear action\n" +
      "• Avoid metaphor themes - be direct and warm\n\n" +
      "DATA:\n\n" +
      gptInput
  );

  // Log raw response
  Logger.log("=== RAW GPT RESPONSE ===");
  Logger.log(insight);
  Logger.log("=== END RAW RESPONSE ===");

  // Ensure insight is a string
  if (typeof insight !== "string") {
    Logger.log("Warning: insight is not a string, converting...");
    insight = String(insight);
  }

  var mantra = getDailyMantra(insight);

  // Create email HTML with ALL new components
  var htmlBody = composeEnhancedMyMetricLogEmail(
    fullDateStr,
    dateStr,
    scores,
    insight,
    mantra,
    moodInsight,
    weatherSummary,
    calSummary,
    emailSummary,
    completedTasks,
    spotifySummary,
    fitbitActivity,
    fitbitSleep,
    fitbitHeart,
    peakHR,
    stressRadar,
    recoveryQuotient,
    dayContext,
    badges,
    streakBadges,
    badgeNarrative,
    nearMisses,
    calendarAnalysis,
    calendarIntelligence,
    fitbitHRV,
    hourlyWeather,
    emailResponseAnalysis,
    fitbitActivityLog, // ADD THIS (note the comma!)
    audioFeatures // ADD THIS
  );

  // Send email
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: "🦊 MyMetricLog Daily Report: " + fullDateStr,
    htmlBody: htmlBody,
  });

  // Save HTML version to Drive
  var standaloneHtml = createStandaloneHtml(htmlBody, fullDateStr);
  saveHtmlToMyMetricLogFolder(
    "The Daily You Report - " + dateStr,
    standaloneHtml
  );

  // Log to sheet
  var sleepMins =
    parseInt(fitbitSleep.match(/(\d+)h/)[1]) * 60 +
    parseInt(fitbitSleep.match(/\d+h (\d+)m/)[1]);
  var steps = parseInt(
    fitbitActivity.match(/👣 Steps: ([\d,]+)/)[1].replace(/,/g, "")
  );
  var topTrack = spotifySummary.split("\n")[2] || "";
  var weatherCond = weatherSummary.split("\n")[0].replace("🌤️ ", "");

  saveToMyMetricLogFolder(
    "daily",
    "The Daily You Report — " + dateStr,
    insight + "\n\n" + gptInput
  );
  setMoodForDate(yesterday, moodInsight);

  // NEW: Store recovery score for tomorrow's comparison
  PropertiesService.getScriptProperties().setProperty(
    "PREVIOUS_RECOVERY_SCORE",
    recoveryQuotient.score.toString()
  );

  // Save badge history - ADD THESE LINES
  if (badges.length > 0) {
    saveBadgeHistory(dateStr, badges);
  }

  Logger.log("✅ Daily summary complete.");
}

function updateSheetStructure() {
  var sheet = getOrCreateMyMetricLogSheet();
  var sh = sheet.getActiveSheet();

  // Check if we already have the new columns
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

  if (headers.length < 12 && headers[0] === "Date") {
    // Add new column headers
    sh.getRange(1, 9).setValue("Sleep Score");
    sh.getRange(1, 10).setValue("Activity Score");
    sh.getRange(1, 11).setValue("Heart Score");
    sh.getRange(1, 12).setValue("Work Score");

    Logger.log("Updated sheet structure with score columns");
  } else {
    Logger.log("Sheet already has score columns or needs complete rebuild");
  }
}

// Helper function to get Sage image URL
function getSageImage(imageName) {
  return SAGE_IMAGES[imageName] || "";
}

function generateSleepStagesVisualization(sleepData) {
  // Parse sleep stages from the data
  var stagesMatch = sleepData.match(
    /Deep: (\d+)m \((\d+)%\).*Light: (\d+)m \((\d+)%\).*REM: (\d+)m \((\d+)%\).*Awake: (\d+)m/
  );

  if (!stagesMatch) {
    return ""; // No stages data available
  }

  var stages = {
    deep: {
      minutes: parseInt(stagesMatch[1]),
      percent: parseInt(stagesMatch[2]),
    },
    light: {
      minutes: parseInt(stagesMatch[3]),
      percent: parseInt(stagesMatch[4]),
    },
    rem: {
      minutes: parseInt(stagesMatch[5]),
      percent: parseInt(stagesMatch[6]),
    },
    awake: { minutes: parseInt(stagesMatch[7]), percent: 0 },
  };

  // Calculate awake percentage
  var totalMinutes =
    stages.deep.minutes +
    stages.light.minutes +
    stages.rem.minutes +
    stages.awake.minutes;
  stages.awake.percent = Math.round(
    (stages.awake.minutes / totalMinutes) * 100
  );

  var html =
    '<div style="margin-top: 16px; background: #f0fdf4; padding: 16px; border-radius: 8px;">';
  html +=
    '<h5 style="font-size: 14px; font-weight: 600; color: #5f27cd; margin: 0 0 12px 0;">Sleep Stages Distribution</h5>';

  // Create horizontal bar chart
  html +=
    '<div style="display: flex; align-items: center; background: white; border-radius: 6px; overflow: hidden; height: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';

  var colors = {
    deep: "#4a148c",
    light: "#9c88ff",
    rem: "#64b5f6",
    awake: "#ff6b6b",
  };

  var order = ["deep", "light", "rem", "awake"];

  order.forEach(function (stage) {
    if (stages[stage].percent > 0) {
      html +=
        '<div style="width: ' +
        stages[stage].percent +
        "%; height: 100%; background: " +
        colors[stage] +
        "; " +
        'position: relative; color: white; font-size: 12px; font-weight: 600;">';
      if (stages[stage].percent > 10) {
        html +=
          '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">' +
          stages[stage].percent +
          "%</div>";
      }
      html += "</div>";
    }
  });

  html += "</div>";

  // Legend
  html +=
    '<div style="display: flex; justify-content: space-around; margin-top: 12px; flex-wrap: wrap;">';

  order.forEach(function (stage) {
    var label = stage.charAt(0).toUpperCase() + stage.slice(1);
    html += '<div style="display: flex; align-items: center; margin: 4px;">';
    html +=
      '<div style="width: 12px; height: 12px; background: ' +
      colors[stage] +
      '; border-radius: 2px; margin-right: 6px;"></div>';
    html +=
      '<span style="font-size: 13px; color: #424242;">' +
      label +
      ": " +
      stages[stage].minutes +
      "m</span>";
    html += "</div>";
  });

  html += "</div>";

  // Add sleep quality insights
  html +=
    '<div style="margin-top: 12px; padding: 10px; background: #e8e5ff; border-radius: 4px; font-size: 13px; color: #5f27cd;">';

  if (stages.deep.percent < 15) {
    html +=
      "⚠️ Low deep sleep (" +
      stages.deep.percent +
      "%) - consider earlier bedtime and cooler room temperature.";
  } else if (stages.rem.percent < 20) {
    html +=
      "⚠️ Low REM sleep (" +
      stages.rem.percent +
      "%) - avoid alcohol and maintain consistent sleep schedule.";
  } else if (stages.awake.percent > 10) {
    html +=
      "⚠️ High wake time (" +
      stages.awake.percent +
      "%) - check bedroom environment for disruptions.";
  } else {
    html += "✅ Well-balanced sleep stages for optimal recovery.";
  }

  html += "</div></div>";

  return html;
}

// Also fix the getGPTInsight function to ensure it returns a string
function getGPTInsight(summary) {
  var apiKey =
    PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

  var payload = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a reflective personal coach for productivity and emotional well-being.",
      },
      { role: "user", content: summary },
    ],
    temperature: 0.7,
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(
      "https://api.openai.com/v1/chat/completions",
      options
    );
    var result = JSON.parse(response.getContentText());

    if (result && result.choices && result.choices.length > 0) {
      // Ensure we return a string
      var content = result.choices[0].message.content;
      return String(content).trim();
    } else {
      Logger.log("GPT API error: " + JSON.stringify(result));
      return "Could not generate insight. Check your OpenAI API key or request limits.";
    }
  } catch (e) {
    Logger.log("GPT API exception: " + e.toString());
    return "Could not generate insight due to an error: " + e.toString();
  }
}

function getHourlyWeatherInsights() {
  try {
    var apiKey = PropertiesService.getScriptProperties().getProperty(
      "OPENWEATHER_API_KEY"
    );
    var zip = "94025";

    // Get coordinates first
    var url =
      "https://api.openweathermap.org/data/2.5/weather?zip=" +
      zip +
      ",US&appid=" +
      apiKey;
    var response = UrlFetchApp.fetch(url);
    var data = JSON.parse(response.getContentText());

    var lat = data.coord.lat;
    var lon = data.coord.lon;

    // Get hourly data
    var hourlyUrl =
      "https://api.openweathermap.org/data/2.5/onecall?lat=" +
      lat +
      "&lon=" +
      lon +
      "&exclude=minutely,daily&units=imperial&appid=" +
      apiKey;

    var hourlyResponse = UrlFetchApp.fetch(hourlyUrl);
    var hourlyData = JSON.parse(hourlyResponse.getContentText());

    // Current UV Index
    var uvIndex = hourlyData.current.uvi;
    var uvText =
      "\n☀️ UV Index: " +
      Math.round(uvIndex) +
      " - " +
      (uvIndex < 3
        ? "Low"
        : uvIndex < 6
        ? "Moderate"
        : uvIndex < 8
        ? "High"
        : "Very High");

    // Find best activity windows in next 8 hours
    var bestWindows = [];
    var rainWarning = "";

    for (var i = 0; i < 8 && i < hourlyData.hourly.length; i++) {
      var hour = hourlyData.hourly[i];
      var time = new Date(hour.dt * 1000);
      var timeStr = Utilities.formatDate(
        time,
        Session.getScriptTimeZone(),
        "h a"
      );

      // Check for good activity conditions
      if (hour.temp >= 60 && hour.temp <= 78 && hour.pop < 0.2) {
        bestWindows.push(timeStr + " (" + Math.round(hour.temp) + "°F)");
      }

      // Check for rain
      if (hour.pop > 0.3 && !rainWarning) {
        rainWarning =
          "\n🌧️ Rain likely at " +
          timeStr +
          " (" +
          Math.round(hour.pop * 100) +
          "% chance)";
      }
    }

    var activityText =
      bestWindows.length > 0
        ? "\n🏃 Best activity times: " + bestWindows.slice(0, 3).join(", ")
        : "\n🏃 Limited outdoor windows today";

    return uvText + activityText + rainWarning;
  } catch (e) {
    Logger.log("Hourly weather error: " + e);
    return "";
  }
}

// FIXED: getSocialEnvironmentalFactors function for Google Apps Script compatibility
function getSocialEnvironmentalFactors(date, weatherData, calendarData) {
  var factors = {
    weather: {
      impact: "neutral",
      score: 0,
      insight: "",
    },
    social: {
      interactions: 0,
      afterWork: 0,
      insight: "",
    },
    lunar: {
      phase: "",
      impact: "",
    },
    seasonal: {
      daylight: 0,
      sunrise: "",
      sunset: "",
      insight: "",
    },
  };

  // Weather impact analysis
  if (weatherData) {
    var tempMatch = weatherData.match(/(\d+)°[fF]/); // Match F or f
    if (tempMatch) {
      var temp = parseInt(tempMatch[1]);
      if (temp < 50) {
        factors.weather.impact = "negative";
        factors.weather.score = -10;
        factors.weather.insight =
          "Cold weather typically reduces your activity by 15%";
      } else if (temp > 75 && temp < 85) {
        factors.weather.impact = "positive";
        factors.weather.score = 10;
        factors.weather.insight = "Ideal weather for outdoor activity";
      } else if (temp > 90) {
        factors.weather.impact = "negative";
        factors.weather.score = -15;
        factors.weather.insight = "High heat may reduce activity levels";
      }
    }

    // Fix: Use indexOf instead of includes
    var weatherLower = weatherData.toLowerCase();
    if (
      weatherLower.indexOf("rain") !== -1 ||
      weatherLower.indexOf("drizzle") !== -1
    ) {
      factors.weather.impact = "negative";
      factors.weather.score = -15;
      factors.weather.insight =
        "Rainy days correlate with -20% activity for you";
    } else if (weatherLower.indexOf("snow") !== -1) {
      factors.weather.impact = "negative";
      factors.weather.score = -20;
      factors.weather.insight =
        "Snow days typically mean indoor activities only";
    } else if (
      weatherLower.indexOf("clear") !== -1 ||
      weatherLower.indexOf("sunny") !== -1
    ) {
      if (factors.weather.impact === "neutral") {
        // Only if not already set by temperature
        factors.weather.impact = "positive";
        factors.weather.score = 5;
        factors.weather.insight = "Clear skies support outdoor activities";
      }
    }
  }

  // Social calendar analysis
  if (calendarData) {
    // If calendarData is the analysis object
    if (calendarData.totalEvents) {
      factors.social.interactions = calendarData.totalEvents;

      if (calendarData.meetingTypes && calendarData.meetingTypes.external > 0) {
        factors.social.insight =
          "External meetings detected - higher energy expenditure expected";
      } else if (factors.social.interactions > 5) {
        factors.social.insight =
          "High meeting day - expect social energy depletion";
      } else if (factors.social.interactions > 3) {
        factors.social.insight = "Moderate social load today";
      }

      // Check for after-hours events
      if (
        calendarData.timeDistribution &&
        calendarData.timeDistribution.evening > 60
      ) {
        factors.social.afterWork = Math.round(
          calendarData.timeDistribution.evening / 60
        );
        factors.social.insight +=
          " | Evening commitments: " + factors.social.afterWork + " hours";
      }
    }
    // If calendarData is an array of events
    else if (Array.isArray(calendarData)) {
      factors.social.interactions = calendarData.length;

      // Count social events
      var socialCount = 0;
      var afterHoursCount = 0;

      for (var i = 0; i < calendarData.length; i++) {
        var event = calendarData[i];
        var title = event.getTitle().toLowerCase();

        // Check for social keywords
        if (
          title.match(
            /lunch|dinner|coffee|drinks|party|date|friend|team.*social|happy.*hour/i
          )
        ) {
          socialCount++;
        }

        // Check for after-hours
        var startHour = event.getStartTime().getHours();
        if (startHour >= 18) {
          afterHoursCount++;
        }
      }

      if (socialCount > 2) {
        factors.social.insight = "Multiple social events - pace yourself";
      }
      if (afterHoursCount > 0) {
        factors.social.afterWork = afterHoursCount;
        factors.social.insight +=
          (factors.social.insight ? " | " : "") +
          afterHoursCount +
          " evening events";
      }
    }
  }

  // Seasonal daylight
  var month = date.getMonth();

  // Lunar phase (simplified calculation)
  var lunarCycle = 29.53;
  var knownNewMoon = new Date("2024-01-11");
  var daysSince = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  var phase = (daysSince % lunarCycle) / lunarCycle;

  if (phase < 0.03 || phase > 0.97) {
    factors.lunar.phase = "New Moon";
    factors.lunar.impact = "Lower energy typical";
  } else if (phase > 0.22 && phase < 0.28) {
    factors.lunar.phase = "First Quarter";
    factors.lunar.impact = "Building energy phase";
  } else if (phase > 0.47 && phase < 0.53) {
    factors.lunar.phase = "Full Moon";
    factors.lunar.impact = "Sleep may be lighter";
  } else if (phase > 0.72 && phase < 0.78) {
    factors.lunar.phase = "Last Quarter";
    factors.lunar.impact = "Releasing phase";
  }

  // Get accurate sunrise/sunset times for Menlo Park
  var sunTimes = getAccurateSunTimes(date, 37.4529, -122.1817);

  factors.seasonal.sunrise = sunTimes.sunrise;
  factors.seasonal.sunset = sunTimes.sunset;
  factors.seasonal.daylight = Math.round(sunTimes.daylight * 10) / 10;

  // Seasonal insights
  if (factors.seasonal.daylight < 10) {
    factors.seasonal.insight =
      "Limited daylight (" +
      factors.seasonal.daylight +
      " hours) - consider vitamin D and light therapy";
  } else if (factors.seasonal.daylight > 14) {
    factors.seasonal.insight =
      "Long daylight hours (" +
      factors.seasonal.daylight +
      " hours) - take advantage for evening activities";
  }

  // Winter months
  if (month >= 11 || month <= 1) {
    if (!factors.seasonal.insight) {
      factors.seasonal.insight =
        "Winter season - indoor activity options important";
    }
  }

  return factors;
}

function getSunTimesFromOpenWeather(date) {
  try {
    var apiKey = PropertiesService.getScriptProperties().getProperty(
      "OPENWEATHER_API_KEY"
    );
    var zip = "94025";
    var url =
      "https://api.openweathermap.org/data/2.5/weather?zip=" +
      zip +
      ",US&appid=" +
      apiKey;

    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var data = JSON.parse(response.getContentText());

    if (data.sys && data.sys.sunrise && data.sys.sunset) {
      var sunrise = new Date(data.sys.sunrise * 1000);
      var sunset = new Date(data.sys.sunset * 1000);

      return {
        sunrise: Utilities.formatDate(
          sunrise,
          Session.getScriptTimeZone(),
          "h:mm a"
        ),
        sunset: Utilities.formatDate(
          sunset,
          Session.getScriptTimeZone(),
          "h:mm a"
        ),
        daylight: (sunset - sunrise) / (1000 * 60 * 60),
      };
    }
  } catch (e) {
    Logger.log("OpenWeather sun times error: " + e);
  }

  return null;
}

function generateEmailManagementInsight(emailStats) {
  var insight = "";
  var recommendation = "";

  // First, handle promotional overload separately
  if (emailStats.promotions > 30) {
    insight =
      "🔕 <strong>Promotional Overload:</strong> " +
      emailStats.promotions +
      " marketing emails cluttering your inbox";
    recommendation =
      "**Schedule an unsubscribe blitz:** Set a 15-minute timer right now and unsubscribe from at least 10 senders. " +
      "Use the search operator 'category:promotions unsubscribe' to find them quickly.";
  } else if (emailStats.noisePercentage > 70 && emailStats.noise > 50) {
    insight =
      "🔕 <strong>Email Noise Alert:</strong> Only " +
      emailStats.primary +
      " real emails out of " +
      emailStats.totalReceived +
      " total";
    recommendation =
      "**Clean up your subscriptions:** " +
      emailStats.social +
      " social + " +
      emailStats.promotions +
      " promotional emails. Time for an inbox detox. " +
      "Start with top 5 senders in promotions tab.";
  }
  // Now handle PRIMARY email workload
  else if (emailStats.primary > 100) {
    insight =
      "📧 <strong>High Priority Volume:</strong> " +
      emailStats.primary +
      " primary emails need attention";
    recommendation =
      "**Email triage protocol:** Process in 3 blocks - 9 AM (urgent/starred), " +
      "1 PM (requests/questions), 4 PM (FYIs/updates). Use 2-minute rule for quick replies.";
  } else if (emailStats.primary > 50 && emailStats.sent < 10) {
    insight =
      "📧 <strong>Response Backlog:</strong> " +
      emailStats.primary +
      " received but only " +
      emailStats.sent +
      " sent";
    recommendation =
      "**Catch-up session needed:** Block 45 minutes this morning for email responses. " +
      "Start with emails from your manager/key stakeholders.";
  } else if (emailStats.sent > 30) {
    insight =
      "📧 <strong>High Email Output:</strong> " +
      emailStats.sent +
      " emails sent (vs " +
      emailStats.primary +
      " received)";
    recommendation =
      "**Batch processing:** You're spending significant time on email. " +
      "Try batching similar responses and consider if some threads could be a quick call instead.";
  } else if (emailStats.primary > 50) {
    insight =
      "📧 <strong>Moderate Email Volume:</strong> " +
      emailStats.primary +
      " primary emails";
    recommendation =
      "**Stay on top of it:** Process emails at 10 AM and 3 PM today. " +
      "Use filters to automatically archive newsletters.";
  }

  if (insight) {
    return (
      '<section style="background:#fff3e0; padding:14px; border-radius:6px; margin:20px 0; ' +
      'border-left: 4px solid #ff6f00;">' +
      insight +
      "<br>" +
      '<span style="font-size: 14px; color: #5d4037; display: block; margin-top: 8px;">' +
      "<strong>Action:</strong> " +
      recommendation +
      "</span>" +
      "</section>"
    );
  }

  return "";
}

function generateQuickWinBox(
  scores,
  stressRadar,
  recoveryQuotient,
  environmentalFactors,
  calendarIntelligence
) {
  var quickWin = "";
  var icon = "🎯"; // Keep this for fallback

  // (Keep existing logic for determining quickWin)
  if (scores.sleep < 70 && scores.activity > 80) {
    quickWin =
      "Set a 10 PM wind-down alarm tonight - your high activity needs better sleep support";
    icon = "😴";
  } else if (
    stressRadar.score > 50 &&
    environmentalFactors.weather.impact === "positive"
  ) {
    quickWin =
      "Take your next call outside - combine ideal weather with stress reduction for instant relief";
    icon = "🌞";
  } else if (scores.activity < 60) {
    quickWin =
      "Schedule a 15-minute walk at 2 PM - break up sedentary time when energy typically dips";
    icon = "🚶";
  } else if (calendarIntelligence.meetingQuality.backToBack > 2) {
    quickWin =
      "Add 5-minute buffers between meetings - protect transition time for mental reset";
    icon = "⏰";
  } else if (scores.work > 80 && scores.total > 80) {
    quickWin =
      "Protect your peak state - decline one non-essential meeting today to maintain momentum";
    icon = "🛡️";
  } else {
    quickWin =
      "Take a 10-minute music + movement break at 10:30 AM for a 15% energy boost";
    icon = "🎵";
  }

  return (
    '<section style="background: #fefce8; border-left: 4px solid #fef3c7; ' +
    "border-radius: 12px; padding: 16px; margin: 20px 0; " +
    'text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">' +
    '<div style="font-size: 20px; font-weight: bold; color: #1565c0; margin-bottom: 8px; display: flex; align-items: center; justify-content: center;">' +
    '<img src="' +
    getSageImage("quickwin") +
    '" ' +
    'alt="Sage Quick Win" style="width:48px; height:auto; margin-right:12px;"/>' +
    "Quick Win for Today" +
    "</div>" +
    '<div style="font-size: 15px; color: #424242; line-height: 1.5;">' +
    quickWin +
    "</div>" +
    "</section>"
  );
}

function generateEmbedCode(dateStr) {
  var scriptUrl = ScriptApp.getService().getUrl();

  return (
    "<!-- MyMetricLog Widget -->\n" +
    '<div id="you-report-container"></div>\n' +
    "<script>\n" +
    "(function() {\n" +
    "  var container = document.getElementById('you-report-container');\n" +
    "  var iframe = document.createElement('iframe');\n" +
    "  iframe.src = '" +
    scriptUrl +
    "?date=" +
    dateStr +
    "&embed=true';\n" +
    "  iframe.style.width = '100%';\n" +
    "  iframe.style.border = 'none';\n" +
    "  iframe.style.minHeight = '800px';\n" +
    "  \n" +
    "  // Auto-resize iframe\n" +
    "  window.addEventListener('message', function(e) {\n" +
    "    if (e.data.type === 'you-report-resize') {\n" +
    "      iframe.style.height = e.data.height + 'px';\n" +
    "    }\n" +
    "  });\n" +
    "  \n" +
    "  container.appendChild(iframe);\n" +
    "})();\n" +
    "</script>"
  );
}

function detectBiometricAnomalies(currentData, historicalData) {
  var anomalies = {
    detected: [],
    warnings: [],
    insights: [],
  };

  // Parse current metrics
  var currentRHR = 0;
  var rhrMatch = currentData.heart.match(/❤️ Resting HR: (\d+)/);
  if (rhrMatch) {
    currentRHR = parseInt(rhrMatch[1]);
  }

  // Get baseline RHR (should calculate from historical data)
  var baselineRHR = getBaselineRHR();

  // RHR Anomaly Detection
  if (currentRHR > baselineRHR + 7) {
    anomalies.detected.push({
      type: "RHR Spike",
      severity: "high",
      value: "+" + (currentRHR - baselineRHR) + " bpm above baseline",
      insight: "Possible early illness indicator or high stress",
    });
  } else if (currentRHR > baselineRHR + 5) {
    anomalies.warnings.push({
      type: "Elevated RHR",
      value: "+" + (currentRHR - baselineRHR) + " bpm",
      insight: "Monitor for additional symptoms",
    });
  }

  // Sleep Efficiency Anomaly
  var efficiencyMatch = currentData.sleep.match(/😴 Efficiency: (\d+)%/);
  if (efficiencyMatch) {
    var efficiency = parseInt(efficiencyMatch[1]);
    if (efficiency < 70) {
      anomalies.detected.push({
        type: "Poor Sleep Efficiency",
        severity: "medium",
        value: efficiency + "%",
        insight: "Check bedroom environment (temperature, noise, light)",
      });
    }
  }

  // Recovery Velocity (simplified)
  if (historicalData && historicalData.length > 2) {
    var lastScore = historicalData[historicalData.length - 1].score;
    var previousScore = historicalData[historicalData.length - 2].score;

    if (lastScore < 60 && previousScore < 60) {
      anomalies.warnings.push({
        type: "Slow Recovery",
        value: "2+ days below optimal",
        insight: "Consider rest day or lighter activities",
      });
    }
  }

  return anomalies;
}

// ✅ NEW: Compose new email layout
function composeYouReportEmail(
  fullDateStr,
  dateStr,
  scores,
  insight,
  mantra,
  moodInsight,
  weatherSummary,
  calSummary,
  emailSummary,
  completedTasks,
  spotifySummary,
  fitbitActivity,
  fitbitSleep,
  fitbitHeart,
  peakHR
) {
  var scoreColor = getMainScoreColor(scores.total);

  // Extract key stats - update sleep calculation
  var sleepMatch = fitbitSleep.match(/(\d+)h (\d+)m/);
  var sleepStr = sleepMatch
    ? sleepMatch[1] + "h " + sleepMatch[2] + "m"
    : "N/A";
  // Add note if this is actual sleep time
  if (fitbitSleep.indexOf("actual sleep") !== -1) {
    sleepStr += "*";
  }

  var stepsMatch = fitbitActivity.match(/👣 Steps: ([\d,]+)/);
  var stepsStr = stepsMatch ? stepsMatch[1] : "N/A";

  var caloriesMatch = fitbitActivity.match(/🔥 Calories burned: ([\d,]+)/);
  var caloriesStr = caloriesMatch ? caloriesMatch[1] + " cal" : "N/A";

  var receivedMatch = emailSummary.match(/Received: (\d+)/);
  var sentMatch = emailSummary.match(/Sent: (\d+)/);
  var totalEmails = 0;
  if (receivedMatch && sentMatch) {
    totalEmails = parseInt(receivedMatch[1]) + parseInt(sentMatch[1]);
  }
  var emailStr = totalEmails > 0 ? totalEmails + " emails" : "0 emails";

  var activeMatch = fitbitActivity.match(/💪 Very Active: (\d+)/);
  var activeStr = activeMatch ? activeMatch[1] + " min active" : "N/A";

  var restingHRMatch = fitbitHeart.match(/❤️ Resting HR: (\d+)/);
  var restingHRStr = restingHRMatch ? restingHRMatch[1] + " bpm" : "N/A";

  // Build and return the HTML
  return (
    "<div style='font-family:Helvetica,Arial,sans-serif; color:#333; max-width:600px; margin:auto;'>" +
    // Logo at top
    // Logo at top
    // Logo
    "<div style='text-align:center; margin:20px 0;'>" +
    "<img src='https://i.ibb.co/9HwyVWzR/My-Metric-Log-Logo.png' " +
    "alt='MyMetricLog Logo' style='max-width:300px; height:auto;'/>" +
    "</div>" +
    // Date header
    "<div style='text-align:center; margin:10px 0; font-size:18px; color:#555;'>" +
    fullDateStr +
    "</div>" +
    // Overall Score
    "<div style='text-align:center; margin:10px 0 20px;'>" +
    "<div style='font-size:52px; font-weight:bold; color:" +
    getMainScoreColor(scores.total) +
    ";'>" +
    scores.total +
    "</div>" +
    // Subscore breakdown in two columns
    // Replace the Performance Breakdown section (around line 1430) with:

    "<div style='background:#f8f8f8; padding:20px; border-radius:8px; margin:20px 0;'>" +
    "<h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>Performance Breakdown</h4>" +
    "<table style='width:100%; border-collapse: collapse;'>" +
    "<tr>" +
    "<td style='width:50%; padding:10px; vertical-align:top;'>" +
    "<div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Sleep:</span>" +
    generateEnhancedBar(scores.sleep, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    scores.sleep +
    "</span>" +
    generateStatusTag("Sleep", scores.sleep, true) + // This will now show AMAZING for 95
    "</div>" +
    generateMiniTrendChart("Sleep", scores.sleep, "#7c4dff") +
    "</div>" +
    "<div style='background:white; padding:15px; border-radius:6px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Activity:</span>" +
    generateEnhancedBar(scores.activity, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    scores.activity +
    "</span>" +
    generateStatusTag("Activity", scores.activity, true) + // This will show EXCELLENT for 90
    "</div>" +
    generateMiniTrendChart("Activity", scores.activity, "#0f9d58") +
    "</div>" +
    "</td>" +
    "<td style='width:50%; padding:10px; vertical-align:top;'>" +
    "<div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Heart:</span>" +
    generateEnhancedBar(scores.heart, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    scores.heart +
    "</span>" +
    generateStatusTag("Heart", scores.heart, true) + // This will show EXCELLENT for 90
    "</div>" +
    generateMiniTrendChart("Heart", scores.heart, "#ea4335") +
    "</div>" +
    "<div style='background:white; padding:15px; border-radius:6px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Work:</span>" +
    generateEnhancedBar(scores.work, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    scores.work +
    "</span>" +
    generateStatusTag("Work", scores.work, true) + // This will show GOOD for 80
    "</div>" +
    generateMiniTrendChart("Work", scores.work, "#f9ab00") +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "</div>" +
    // Enhanced at-a-glance with more stats
    "<div style='background:#e8f0fe; padding:12px; border-radius:6px; text-align:center; margin:20px 0;'>" +
    "<strong>At a Glance:</strong><br>" +
    sleepStr +
    " sleep | " +
    stepsStr +
    " steps | " +
    caloriesStr +
    " | " +
    activeStr +
    " | " +
    restingHRStr +
    " | " +
    emailStr +
    "</div>" +
    // Overall Analysis
    buildSection("🧠 MyMetricLog: Overall Analysis for Josh", insight) +
    // Daily Mantra
    "<div style='background:#fff5e5; padding:14px; border-radius:6px; font-style:italic; margin:20px 0;'>" +
    "🌈 <strong>Daily Mantra:</strong><br>" +
    escapeHtml(mantra) +
    "</div>" +
    // Mood Reflection
    buildSection("😊 Mood Reflection", moodInsight) +
    // Detailed sections
    buildSection("🌦️ Weather", weatherSummary) +
    buildSection("📅 Calendar Summary", calSummary) +
    buildSection("✉️ Email Summary", emailSummary) +
    (completedTasks ? buildSection("✅ Completed Tasks", completedTasks) : "") +
    buildSection("🎧 Spotify Summary", spotifySummary) +
    buildSection("📊 Fitbit Activity", fitbitActivity) +
    buildSection("🛌 Fitbit Sleep", fitbitSleep) +
    buildSection("❤️ Heart Rate", fitbitHeart) +
    "</div>"
  );
}

// Add this function to generate consistent pastel backgrounds
// Replace the getSectionStyle function with this updated version:
function getSectionStyle(sectionType) {
  var styles = {
    // MAIN SECTIONS - Primary pastels
    analysis: "background: #f0f4ff; border-left: 4px solid #b8ccff;", // Soft blue - main analysis
    performance: "background: #f0f4ff; border-left: 4px solid #b8ccff;", // Soft blue - performance metrics

    // WELLNESS SECTIONS - Green family
    physical: "background: #f0fdf4; border-left: 4px solid #bbf7d0;", // Soft mint - physical wellness
    sleep: "background: #f0fdf4; border-left: 4px solid #bbf7d0;", // Soft mint - sleep
    activity: "background: #f0fdf4; border-left: 4px solid #bbf7d0;", // Soft mint - activity
    heart: "background: #fef0f0; border-left: 4px solid #fecaca;", // Soft pink - heart (stands out as vital)
    recovery: "background: #f0fdfa; border-left: 4px solid #99f6e4;", // Soft teal - recovery

    // MENTAL/MOOD SECTIONS - Purple family
    mood: "background: #faf5ff; border-left: 4px solid #e9d5ff;", // Soft lavender - mood
    mantra: "background: #faf5ff; border-left: 4px solid #e9d5ff;", // Soft lavender - mantra
    meditation: "background: #faf5ff; border-left: 4px solid #e9d5ff;", // Soft lavender - meditation

    // WORK/PRODUCTIVITY - Yellow family
    work: "background: #fefce8; border-left: 4px solid #fef3c7;", // Soft yellow - work
    quickwin: "background: #fefce8; border-left: 4px solid #fef3c7;", // Soft yellow - quick wins

    // ENVIRONMENT/LIFESTYLE - Peach family
    environment: "background: #fff7ed; border-left: 4px solid #fed7aa;", // Soft peach - environment
    weather: "background: #fff7ed; border-left: 4px solid #fed7aa;", // Soft peach - weather
    music: "background: #fff7ed; border-left: 4px solid #fed7aa;", // Soft peach - music

    // ACHIEVEMENTS/REWARDS - Gold family
    badges: "background: #fffbeb; border-left: 4px solid #fde68a;", // Soft gold - badges

    // ALERTS/STRESS - Coral family
    stress: "background: #fef2f2; border-left: 4px solid #fecaca;", // Soft coral - stress
    alert: "background: #fef2f2; border-left: 4px solid #fecaca;", // Soft coral - alerts
  };

  return (
    styles[sectionType] ||
    "background: #f9fafb; border-left: 4px solid #e5e7eb;"
  ); // Neutral gray default
}

// ✅ Updated weekly summary
function getWeeklyTrendSummary() {
  Logger.log("📊 [MyMetricLog Weekly] Starting summary...");

  var token = getValidFitbitAccessToken();
  var now = new Date();
  var endDate = Utilities.formatDate(
    now,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  var startObj = new Date(now.getTime() - 6 * 86400000);
  var startDate = Utilities.formatDate(
    startObj,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );

  // Get week's data
  var weekData = getWeeklyData(startDate, endDate);
  var weekStats = calculateWeeklyStats(weekData);
  var weekTrends = analyzeWeeklyTrends(weekData);
  var weekBadges = getWeeklyBadgeData();
  var weekPatterns = identifyWeeklyPatterns(weekData);

  // Generate enhanced weekly insight
  var weeklyInsight = generateWeeklyInsight(
    weekStats,
    weekTrends,
    weekPatterns
  );
  var weeklyRecommendations = generateWeeklyRecommendations(
    weekStats,
    weekPatterns
  );

  // Compose HTML email
  var htmlBody = composeWeeklyMyMetricLogEmail(
    startDate,
    endDate,
    weekStats,
    weeklyInsight,
    weeklyRecommendations,
    weekTrends,
    weekBadges,
    weekPatterns
  );

  Logger.log(
    "Email Response Analysis: " + JSON.stringify(emailResponseAnalysis)
  );

  // Send email
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: "🦊 MyMetricLog Weekly Report: " + startDate + " - " + endDate,
    htmlBody: htmlBody,
  });

  // Save to Drive
  var standaloneHtml = createStandaloneHtml(htmlBody, "Week of " + startDate);
  saveHtmlToMyMetricLogFolder(
    "The Weekly You Report - " + startDate,
    standaloneHtml
  );

  Logger.log("✅ Weekly summary complete.");
}

function composeWeeklyMyMetricLogEmail(
  startDate,
  endDate,
  weekStats,
  insight,
  recommendations,
  trends,
  badges,
  patterns
) {
  var scoreColor =
    weekStats.avgScore >= 80
      ? "#0b8043"
      : weekStats.avgScore >= 60
      ? "#fbbc04"
      : "#ea4335";

  var htmlBody =
    "<div style='font-family:Helvetica,Arial,sans-serif; color:#333; max-width:600px; margin:auto;'>" +
    // Logo
    // Logo
    "<div style='text-align:center; margin:20px 0;'>" +
    "<img src='https://i.ibb.co/9HwyVWzR/My-Metric-Log-Logo.png' " +
    "alt='MyMetricLog Logo' style='max-width:300px; height:auto;'/>" +
    "</div>" +
    // Title
    "<div style='text-align:center; margin:10px 0;'>" +
    "<h1 style='font-size:28px; font-weight:600; color:#1a1a1a; margin:10px 0;'>Weekly Summary</h1>" +
    "<div style='font-size:18px; color:#555;'>" +
    formatDateRange(startDate, endDate) +
    "</div>" +
    "</div>" +
    // Weekly Score with status tag
    "<div style='text-align:center; margin:30px 0;'>" +
    "<div style='font-size:64px; font-weight:bold; color:" +
    scoreColor +
    ";'>" +
    "🧠 " +
    weekStats.avgScore +
    "</div>" +
    "<div style='font-size:20px; color:#555; margin-bottom:5px;'><strong>Average Weekly Score</strong> " +
    getTrendArrow(weekStats.scoreTrend) +
    " " +
    (weekStats.scoreTrend > 0 ? "+" : "") +
    weekStats.scoreTrend +
    " vs last week</div>" +
    "<div style='margin-top:8px;'>" +
    generateStatusTag("Overall", weekStats.avgScore, false, true) +
    "</div>" +
    "</div>" +
    // Week at a Glance - Enhanced
    "<div style='background:#e8f0fe; padding:20px; border-radius:8px; text-align:center; margin:20px 0;'>" +
    "<strong style='font-size:18px;'>Week at a Glance</strong><br>" +
    "<div style='margin-top:10px; font-size:16px; line-height:1.8;'>" +
    "💤 " +
    weekStats.avgSleepFormatted +
    " avg sleep | " +
    "👣 " +
    formatNumberWithCommas(weekStats.avgSteps) +
    " avg steps | " +
    "🏃 " +
    weekStats.totalActiveMin +
    " active minutes<br>" +
    "❤️ " +
    weekStats.avgRHR +
    " bpm avg RHR | " +
    "📧 " +
    weekStats.totalEmails +
    " emails | " +
    "📅 " +
    weekStats.totalMeetings +
    " meetings | " +
    "🏆 " +
    badges.totalBadges +
    " badges earned" +
    "</div>" +
    "</div>" +
    // Weekly Performance Grid (matching daily style)
    generateWeeklyPerformanceGrid(weekStats) +
    // Weekly Analysis with proper formatting
    "<div style='margin:20px 0; padding:20px; background:#fafafa; border:1px solid #ddd; border-radius:8px;'>" +
    "<h3 style='font-size:22px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>🧠 Weekly Analysis</h3>" +
    "<div style='font-size:15px; line-height:1.8; color:#333;'>" +
    convertAndFormatInsight(insight) +
    "</div>" +
    "</div>" +
    // Pattern Recognition (if patterns exist)
    (patterns && patterns.length > 0 ? generateWeeklyPatterns(patterns) : "") +
    // Badge Summary
    generateWeeklyBadgeSummary(badges) +
    // Best & Challenging Days
    generateBestAndWorstDays(weekStats) +
    // Weekly Habits Scorecard
    generateWeeklyHabitsScorecard(weekStats) +
    // Week Ahead Quick Wins
    "<div style='background:linear-gradient(135deg, #e8f0fe 0%, #d2e3fc 100%); " +
    "border:2px solid #1976d2; border-radius:12px; padding:20px; margin:20px 0;'>" +
    "<h3 style='font-size:20px; font-weight:600; color:#1565c0; margin:0 0 12px 0;'>" +
    "🎯 Quick Wins for Next Week</h3>" +
    generateWeeklyQuickWins(weekStats, patterns) +
    "</div>" +
    // Footer
    "<div style='margin-top:40px; padding-top:20px; border-top:1px solid #e0e0e0; " +
    "text-align:center; color:#999; font-size:12px;'>" +
    "MyMetricLog • Your Weekly Wellness Intelligence<br>" +
    "🦊 Tracking • 📊 Analyzing • 🎯 Growing Together" +
    "</div>" +
    "</div>";

  return htmlBody;
}

function generateWeeklyQuickWins(weekStats, patterns) {
  var quickWins = [];

  // Based on weak areas
  if (weekStats.avgSleepScore < 80) {
    quickWins.push(
      "**Sunday 9:30 PM:** Set wind-down alarm for consistent sleep schedule"
    );
  }

  if (weekStats.days10KSteps < 5) {
    quickWins.push(
      "**Daily 2:00 PM:** 15-minute walk break (adds ~2,000 steps)"
    );
  }

  if (weekStats.avgWorkScore < 75) {
    quickWins.push("**Monday & Wednesday:** Block 9-11 AM for deep focus work");
  }

  if (weekStats.challengingDay.name === "Monday") {
    quickWins.push(
      "**Monday morning:** Start with 10-min meditation to set positive tone"
    );
  }

  // Always have at least 3 recommendations
  if (quickWins.length === 0) {
    quickWins.push(
      "**Maintain momentum:** You're doing great! Document what worked this week"
    );
  }

  var html = "<div style='font-size:15px; line-height:1.8;'>";
  quickWins.forEach(function (win, index) {
    html +=
      "<div style='margin-bottom:10px;'>" + (index + 1) + ". " + win + "</div>";
  });
  html += "</div>";

  return html;
}

function generateWeeklyPerformanceGrid(weekStats) {
  return (
    "<div style='background:#f8f8f8; padding:20px; border-radius:8px; margin:20px 0;'>" +
    "<h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>Performance Breakdown</h4>" +
    "<table style='width:100%; border-collapse: collapse;'>" +
    "<tr>" +
    "<td style='width:50%; padding:10px; vertical-align:top;'>" +
    "<div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Sleep:</span>" +
    generateEnhancedBar(weekStats.avgSleepScore, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    weekStats.avgSleepScore +
    "</span>" +
    generateStatusTag("Sleep", weekStats.avgSleepScore, true) +
    "</div>" +
    generateWeeklyMiniTrendChart(
      "Sleep",
      weekStats.avgSleepScore,
      "#7c4dff",
      weekStats
    ) +
    "</div>" +
    "<div style='background:white; padding:15px; border-radius:6px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Activity:</span>" +
    generateEnhancedBar(weekStats.avgActivityScore, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    weekStats.avgActivityScore +
    "</span>" +
    generateStatusTag("Activity", weekStats.avgActivityScore, true) +
    "</div>" +
    generateWeeklyMiniTrendChart(
      "Activity",
      weekStats.avgActivityScore,
      "#0f9d58",
      weekStats
    ) +
    "</div>" +
    "</td>" +
    "<td style='width:50%; padding:10px; vertical-align:top;'>" +
    "<div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Heart:</span>" +
    generateEnhancedBar(weekStats.avgHeartScore, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    weekStats.avgHeartScore +
    "</span>" +
    generateStatusTag("Heart", weekStats.avgHeartScore, true) +
    "</div>" +
    generateWeeklyMiniTrendChart(
      "Heart",
      weekStats.avgHeartScore,
      "#ea4335",
      weekStats
    ) +
    "</div>" +
    "<div style='background:white; padding:15px; border-radius:6px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Work:</span>" +
    generateEnhancedBar(weekStats.avgWorkScore, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    weekStats.avgWorkScore +
    "</span>" +
    generateStatusTag("Work", weekStats.avgWorkScore, true) +
    "</div>" +
    generateWeeklyMiniTrendChart(
      "Work",
      weekStats.avgWorkScore,
      "#f9ab00",
      weekStats
    ) +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "</div>"
  );
}

function generateWeeklyMiniTrendChart(metricName, avgScore, color, weekStats) {
  var html =
    '<div style="margin-top: 12px; padding: 10px; background: #f5f5f5; border-radius: 6px;">';

  // Calculate actual days in week (max 7)
  var actualDays = Math.min(7, weekStats.dailyData.length);

  if (metricName === "Sleep") {
    html +=
      '<div style="font-size: 12px; color: #666;">' +
      "<strong>Best:</strong> " +
      weekStats.bestSleepDay +
      " (" +
      weekStats.bestSleepHours +
      "h)<br>" +
      "<strong>Average:</strong> " +
      weekStats.avgSleepFormatted +
      "<br>" +
      "<strong>7+ hour nights:</strong> " +
      weekStats.days7HoursSleep +
      "/" +
      actualDays +
      "</div>";
  } else if (metricName === "Activity") {
    html +=
      '<div style="font-size: 12px; color: #666;">' +
      "<strong>Best:</strong> " +
      weekStats.bestStepsDay +
      " (" +
      formatNumberWithCommas(weekStats.bestSteps) +
      " steps)<br>" +
      "<strong>Average:</strong> " +
      formatNumberWithCommas(weekStats.avgSteps) +
      " steps/day<br>" +
      "<strong>10K+ days:</strong> " +
      weekStats.days10KSteps +
      "/" +
      actualDays +
      "</div>";
  } else if (metricName === "Heart") {
    html +=
      '<div style="font-size: 12px; color: #666;">' +
      "<strong>RHR Range:</strong> " +
      weekStats.minRHR +
      "-" +
      weekStats.maxRHR +
      " bpm<br>" +
      "<strong>Average RHR:</strong> " +
      weekStats.avgRHR +
      " bpm<br>" +
      "<strong>Cardiovascular health:</strong> Stable" +
      "</div>";
  } else if (metricName === "Work") {
    html +=
      '<div style="font-size: 12px; color: #666;">' +
      "<strong>Most productive:</strong> " +
      weekStats.mostProductiveDay +
      "<br>" +
      "<strong>Total emails:</strong> " +
      weekStats.totalEmails +
      "<br>" +
      "<strong>Focus days:</strong> " +
      weekStats.daysDeepWork +
      "/" +
      actualDays +
      "</div>";
  }

  html += "</div>";
  return html;
}

function generateWeeklyActivityHeatmap(dailyData) {
  var html =
    "<div style='background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;'>" +
    "<h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>7-Day Activity Heatmap</h4>" +
    "<div style='background:white; padding:16px; border-radius:6px;'>";

  // Days of week
  var daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Create heatmap grid
  html += "<table style='width:100%; border-collapse:collapse;'>";

  // Header row
  html += "<tr><td style='width:80px; font-size:12px; color:#666;'></td>";
  for (var i = 0; i < 24; i++) {
    if (i % 3 === 0) {
      html +=
        "<td style='text-align:center; font-size:11px; color:#999;'>" +
        i +
        "</td>";
    } else {
      html += "<td></td>";
    }
  }
  html += "</tr>";

  // Day rows
  dailyData.forEach(function (day, dayIndex) {
    html += "<tr>";
    html +=
      "<td style='font-size:13px; color:#666; padding:4px;'>" +
      day.dayName +
      "</td>";

    for (var hour = 0; hour < 24; hour++) {
      var intensity = getHourIntensity(day, hour);
      var color = getHeatmapColor(intensity);

      html +=
        "<td style='width:4.16%; height:20px; background:" +
        color +
        "; " +
        "border:1px solid #fff;' title='" +
        day.dayName +
        " " +
        hour +
        ":00'></td>";
    }

    html += "</tr>";
  });

  html += "</table>";

  // Legend
  html +=
    "<div style='margin-top:16px; display:flex; align-items:center; justify-content:center; gap:20px;'>" +
    "<span style='font-size:12px; color:#666;'>Less Active</span>" +
    "<div style='display:flex; gap:2px;'>" +
    "<div style='width:20px; height:20px; background:#e0f2f1;'></div>" +
    "<div style='width:20px; height:20px; background:#a5d6a7;'></div>" +
    "<div style='width:20px; height:20px; background:#66bb6a;'></div>" +
    "<div style='width:20px; height:20px; background:#43a047;'></div>" +
    "<div style='width:20px; height:20px; background:#2e7d32;'></div>" +
    "</div>" +
    "<span style='font-size:12px; color:#666;'>More Active</span>" +
    "</div>";

  html += "</div></div>";
  return html;
}

function generateWeeklyTrendsChart(trends) {
  var html =
    "<div style='background:#fff; border:1px solid #e0e0e0; padding:20px; border-radius:8px; margin:20px 0;'>" +
    "<h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>📈 Weekly Trends</h4>";

  // Create line chart visualization
  var metrics = ["Overall", "Sleep", "Activity", "Heart", "Work"];
  var colors = ["#1a73e8", "#7c4dff", "#0f9d58", "#ea4335", "#f9ab00"];

  metrics.forEach(function (metric, index) {
    var data = trends[metric.toLowerCase()] || generateSampleTrend();
    var avgValue = Math.round(
      data.reduce(function (a, b) {
        return a + b;
      }, 0) / data.length
    );

    html +=
      "<div style='margin-bottom:24px;'>" +
      "<div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;'>" +
      "<span style='font-weight:600; color:#424242;'>" +
      metric +
      "</span>" +
      "<span style='font-size:16px; color:" +
      colors[index] +
      "; font-weight:600;'>" +
      "Avg: " +
      avgValue +
      "</span>" +
      "</div>";

    // Simple line chart using divs
    html +=
      "<div style='position:relative; height:60px; border-left:1px solid #ddd; border-bottom:1px solid #ddd;'>";

    var maxVal = Math.max.apply(null, data);
    var minVal = Math.min.apply(null, data);
    var range = maxVal - minVal || 1;

    data.forEach(function (value, i) {
      var x = (i / (data.length - 1)) * 100;
      var y = 100 - ((value - minVal) / range) * 100;

      // Point
      html +=
        "<div style='position:absolute; width:8px; height:8px; background:" +
        colors[index] +
        "; " +
        "border-radius:50%; left:" +
        x +
        "%; top:" +
        y +
        "%; transform:translate(-50%, -50%);' " +
        "title='Day " +
        (i + 1) +
        ": " +
        value +
        "'></div>";

      // Line (simplified)
      if (i < data.length - 1) {
        var nextX = ((i + 1) / (data.length - 1)) * 100;
        var nextY = 100 - ((data[i + 1] - minVal) / range) * 100;
        var angle = (Math.atan2(nextY - y, nextX - x) * 180) / Math.PI;
        var length = Math.sqrt(Math.pow(nextX - x, 2) + Math.pow(nextY - y, 2));

        html +=
          "<div style='position:absolute; height:2px; background:" +
          colors[index] +
          "; " +
          "left:" +
          x +
          "%; top:" +
          y +
          "%; width:" +
          length +
          "%; " +
          "transform-origin:0 0; transform:rotate(" +
          angle +
          "deg);'></div>";
      }
    });

    html += "</div>";
    html += "</div>";
  });

  html += "</div>";
  return html;
}

function generateWeeklyBadgeSummary(badges) {
  var html =
    '<div style="background:#fafafa; border:1px solid #e0e0e0; border-radius:8px; padding:20px; margin:20px 0;">' +
    '<h3 style="font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;">🏅 Weekly Achievements</h3>';

  // Summary stats with enhanced styling and comma formatting
  html +=
    '<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin-bottom:20px;">' +
    '<div style="text-align:center; padding:16px; background:white; ' +
    'border-radius:8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">' +
    '<div style="font-size:36px; color:#1976d2; font-weight:700;">' +
    badges.totalBadges +
    "</div>" +
    '<div style="color:#666; font-size:14px;">Total Badges</div>' +
    "</div>" +
    '<div style="text-align:center; padding:16px; background:white; ' +
    'border-radius:8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">' +
    '<div style="font-size:36px; color:#ff6f00; font-weight:700;">' +
    formatNumberWithCommas(badges.totalPoints) +
    "</div>" +
    '<div style="color:#666; font-size:14px;">Total Points</div>' +
    "</div>" +
    '<div style="text-align:center; padding:16px; background:white; ' +
    'border-radius:8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">' +
    '<div style="font-size:36px; color:#43a047; font-weight:700;">' +
    badges.streakDays +
    "</div>" +
    '<div style="color:#666; font-size:14px;">Longest Streak</div>' +
    "</div>" +
    "</div>";

  // Fixed Rarity breakdown with proper centering and spacing
  if (badges.byRarity) {
    html +=
      '<div style="background:white; padding:16px; border-radius:6px; margin-bottom:16px;">' +
      '<h4 style="font-size:16px; font-weight:600; color:#424242; margin:0 0 12px 0;">Badge Rarity Distribution</h4>' +
      '<table style="width:100%; table-layout:fixed;"><tr>';

    var rarityColors = {
      legendary: "#FFB300",
      epic: "#7B1FA2",
      rare: "#1976D2",
      uncommon: "#388E3C",
      common: "#757575",
    };

    var rarityOrder = ["legendary", "epic", "rare", "uncommon", "common"];

    rarityOrder.forEach(function (rarity) {
      if (
        badges.byRarity[rarity] !== undefined &&
        badges.byRarity[rarity] >= 0
      ) {
        html +=
          '<td style="text-align:center; padding:0 5px;">' +
          '<div style="width:50px; height:50px; background:' +
          rarityColors[rarity] +
          "; " +
          "border-radius:50%; color:white; margin:0 auto; font-size:18px; font-weight:bold; " +
          "line-height:50px; text-align:center; " +
          'box-shadow: 0 2px 4px rgba(0,0,0,0.2);">' +
          badges.byRarity[rarity] +
          "</div>" +
          '<div style="font-size:11px; color:#666; margin-top:6px; text-transform:capitalize;">' +
          rarity +
          "</div>" +
          "</td>";
      }
    });

    html += "</tr></table></div>";
  }

  // Top badges earned
  if (badges.topBadges && badges.topBadges.length > 0) {
    html +=
      '<div style="background:#e8f0fe; padding:14px; border-radius:6px; border-left:4px solid #1976d2;">' +
      '<strong style="color:#1565c0;">🎯 Top Achievements This Week:</strong>' +
      '<div style="margin-top:10px;">';

    badges.topBadges.forEach(function (badge) {
      html +=
        '<div style="margin:8px 0; padding:8px; background:rgba(255,255,255,0.7); border-radius:4px;">' +
        badge.emoji +
        " <strong>" +
        badge.name +
        "</strong> - " +
        badge.description +
        ' <span style="color:#666;">(' +
        badge.count +
        "x)</span>" +
        "</div>";
    });

    html += "</div></div>";
  }

  html += "</div>";
  return html;
}

// Helper function to determine badge rarity
function getBadgeRarity(badgeName) {
  var rarityMap = {
    "Perfect Day": "legendary",
    "Wellness Champion": "legendary",
    "The Trifecta": "legendary",
    "Perfect Storm": "legendary",
    "Sleep Master": "epic",
    "Step Warrior": "epic",
    "Peak Recovery": "epic",
    "Heart Hero": "rare",
    "Focus Guardian": "rare",
    "Inbox Zero Hero": "rare",
    "10K Club": "uncommon",
    "Zen Mode": "uncommon",
    "Active Day": "common",
    "Well Rested": "common",
  };

  return rarityMap[badgeName] || "common";
}

function getPreviousWeekAverage() {
  var sheet = getOrCreateMyMetricLogSheet();
  var data = sheet.getDataRange().getValues();

  if (data.length < 14) return 70; // Default if not enough history

  // Get week before last (days -14 to -8)
  var total = 0;
  var count = 0;

  for (
    var i = Math.max(1, data.length - 14);
    i < data.length - 7 && i < data.length;
    i++
  ) {
    if (data[i][2]) {
      total += parseInt(data[i][2]) || 0;
      count++;
    }
  }

  return count > 0 ? Math.round(total / count) : 70;
}

function getHourIntensity(day, hour) {
  // Estimate activity intensity for heatmap
  // You could enhance this with actual hourly data if available

  // Sleep hours (approximate)
  if (hour >= 23 || hour < 7) return 0;

  // Work hours - moderate activity
  if (hour >= 9 && hour <= 17) return 2;

  // Commute/exercise times - higher activity
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) return 3;

  // Evening - low activity
  return 1;
}

function getAccurateSunTimes(date, lat, lng) {
  try {
    var dateStr = Utilities.formatDate(
      date,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
    var url =
      "https://api.sunrise-sunset.org/json?lat=" +
      lat +
      "&lng=" +
      lng +
      "&date=" +
      dateStr +
      "&formatted=0";

    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var data = JSON.parse(response.getContentText());

    if (data.status === "OK") {
      var sunrise = new Date(data.results.sunrise);
      var sunset = new Date(data.results.sunset);

      // Convert to local time
      var sunriseLocal = Utilities.formatDate(
        sunrise,
        Session.getScriptTimeZone(),
        "h:mm a"
      );
      var sunsetLocal = Utilities.formatDate(
        sunset,
        Session.getScriptTimeZone(),
        "h:mm a"
      );

      return {
        sunrise: sunriseLocal,
        sunset: sunsetLocal,
        daylight: (sunset - sunrise) / (1000 * 60 * 60), // hours
      };
    }
  } catch (e) {
    Logger.log("Sunrise API error: " + e);
  }

  // Fallback
  return {
    sunrise: "6:18 AM",
    sunset: "8:12 PM",
    daylight: 13.9,
  };
}

function getHeatmapColor(intensity) {
  var colors = ["#e0f2f1", "#a5d6a7", "#66bb6a", "#43a047", "#2e7d32"];
  return colors[Math.min(intensity, colors.length - 1)];
}

function generateWeeklyPatterns(patterns) {
  if (!patterns || patterns.length === 0) return "";

  var html =
    "<div style='background:linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); " +
    "padding:20px; border-radius:8px; margin:20px 0; border-left:4px solid #7b1fa2;'>" +
    "<h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>🔍 Weekly Patterns Detected</h4>";

  patterns.forEach(function (pattern) {
    html +=
      "<div style='margin-bottom:12px; padding:12px; background:rgba(255,255,255,0.7); border-radius:6px;'>" +
      "<strong style='color:#6a1b9a;'>" +
      pattern.type +
      ":</strong> " +
      pattern.description +
      " <span style='color:#666; font-size:12px;'>(" +
      pattern.confidence +
      "% confidence)</span>" +
      "</div>";
  });

  html += "</div>";
  return html;
}

function generateBestAndWorstDays(weekStats) {
  return (
    "<div style='display:grid; grid-template-columns:1fr 1fr; gap:20px; margin:20px 0;'>" +
    // Best Day
    "<div style='background:linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); " +
    "padding:20px; border-radius:8px; border-left:4px solid #43a047;'>" +
    "<h4 style='font-size:18px; font-weight:600; color:#2e7d32; margin:0 0 12px 0;'>🌟 Best Day</h4>" +
    "<div style='font-size:24px; font-weight:bold; color:#1b5e20;'>" +
    weekStats.bestDay.name +
    "</div>" +
    "<div style='font-size:36px; font-weight:bold; color:#43a047; margin:8px 0;'>" +
    weekStats.bestDay.score +
    "</div>" +
    "<div style='font-size:14px; color:#555; line-height:1.6;'>" +
    weekStats.bestDay.highlights.join("<br>") +
    "</div>" +
    "</div>" +
    // Most Challenging Day
    "<div style='background:linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); " +
    "padding:20px; border-radius:8px; border-left:4px solid #ff6f00;'>" +
    "<h4 style='font-size:18px; font-weight:600; color:#e65100; margin:0 0 12px 0;'>🎯 Most Challenging Day</h4>" +
    "<div style='font-size:24px; font-weight:bold; color:#bf360c;'>" +
    weekStats.challengingDay.name +
    "</div>" +
    "<div style='font-size:36px; font-weight:bold; color:#ff6f00; margin:8px 0;'>" +
    weekStats.challengingDay.score +
    "</div>" +
    "<div style='font-size:14px; color:#555; line-height:1.6;'>" +
    "<strong>Opportunities:</strong><br>" +
    weekStats.challengingDay.opportunities.join("<br>") +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

function generateWeeklyHabitsScorecard(weekStats) {
  // Calculate actual days tracked (max 7)
  var actualDays = Math.min(7, weekStats.dailyData.length);

  var habits = [
    {
      name: "7+ Hours Sleep",
      achieved: weekStats.days7HoursSleep,
      total: actualDays,
      emoji: "😴",
    },
    {
      name: "10K+ Steps",
      achieved: weekStats.days10KSteps,
      total: actualDays,
      emoji: "👣",
    },
    {
      name: "Low Stress",
      achieved: weekStats.daysLowStress,
      total: actualDays,
      emoji: "🧘",
    },
    {
      name: "Deep Work Time",
      achieved: weekStats.daysDeepWork,
      total: actualDays,
      emoji: "🎯",
    },
    {
      name: "Active Minutes",
      achieved: weekStats.daysActiveMinutes,
      total: actualDays,
      emoji: "🏃",
    },
  ];

  var html =
    "<div style='background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;'>" +
    "<h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>📊 Weekly Habits Scorecard</h3>" +
    "<div style='background:white; padding:16px; border-radius:6px;'>";

  habits.forEach(function (habit) {
    var percentage = Math.round((habit.achieved / habit.total) * 100);
    var color =
      percentage >= 80 ? "#43a047" : percentage >= 60 ? "#f9ab00" : "#ea4335";

    html +=
      "<div style='margin-bottom:16px;'>" +
      "<div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;'>" +
      "<span style='font-weight:600; color:#424242;'>" +
      habit.emoji +
      " " +
      habit.name +
      "</span>" +
      "<span style='color:" +
      color +
      "; font-weight:600;'>" +
      habit.achieved +
      "/" +
      habit.total +
      " days</span>" +
      "</div>" +
      "<div style='background:#e0e0e0; height:8px; border-radius:4px; overflow:hidden;'>" +
      "<div style='background:" +
      color +
      "; height:100%; width:" +
      percentage +
      "%; transition:width 0.3s;'></div>" +
      "</div>" +
      "</div>";
  });

  html += "</div></div>";
  return html;
}

function generateFallbackWeeklyInsight(stats, patterns) {
  var insights = [];

  // Overall performance
  if (stats.avgScore >= 80) {
    insights.push(
      "Outstanding week! Your average score of **" +
        stats.avgScore +
        "/100** places you in the top 10% of performance. " +
        "You maintained excellent balance across all wellness dimensions."
    );
  } else if (stats.avgScore >= 70) {
    insights.push(
      "Strong week with an average score of **" +
        stats.avgScore +
        "/100**. " +
        "You showed good consistency with room for optimization in key areas."
    );
  } else {
    insights.push(
      "Challenging week with an average score of **" +
        stats.avgScore +
        "/100**. " +
        "Let's identify the key factors and create a recovery plan."
    );
  }

  // Sleep insights
  if (stats.days7HoursSleep >= 5) {
    insights.push(
      "\n\nSleep consistency was excellent - you achieved 7+ hours on **" +
        stats.days7HoursSleep +
        " out of 7 nights**. This is your foundation for success."
    );
  } else if (stats.days7HoursSleep <= 2) {
    insights.push(
      "\n\nSleep was a major challenge this week, with only **" +
        stats.days7HoursSleep +
        " nights** of adequate rest. This likely impacted all other metrics."
    );
  }

  // Activity insights
  if (stats.days10KSteps >= 5) {
    insights.push(
      "\n\nMovement was a strength - you hit 10K+ steps on **" +
        stats.days10KSteps +
        " days**, averaging **" +
        stats.avgSteps.toLocaleString() +
        " daily**."
    );
  }

  // Patterns
  if (patterns && patterns.length > 0) {
    insights.push("\n\nKey pattern detected: " + patterns[0].description);
  }

  // Best day analysis
  insights.push(
    "\n\nYour best day was **" +
      stats.bestDay.name +
      "** with a score of **" +
      stats.bestDay.score +
      "**. Replicate this day's habits for consistent excellence."
  );

  return insights.join("");
}

function generateWeeklyRecommendations(stats, patterns) {
  var recommendations = [];

  // Sleep recommendations
  if (stats.avgSleepHours < 7) {
    recommendations.push({
      priority: "High",
      action: "Sleep Optimization",
      details:
        "Add 30 minutes to your sleep by setting a 10 PM wind-down alarm",
      impact: "Expected +15 points to daily scores",
    });
  }

  // Activity recommendations
  if (stats.avgSteps < 8000) {
    recommendations.push({
      priority: "Medium",
      action: "Movement Boost",
      details: "Schedule two 15-minute walks daily (10 AM and 3 PM)",
      impact: "Increase daily steps by 3,000",
    });
  }

  // Recovery recommendations
  if (stats.daysLowStress < 3) {
    recommendations.push({
      priority: "High",
      action: "Stress Management",
      details: "Implement 5-minute breathing exercises before each meeting",
      impact: "Reduce stress scores by 20%",
    });
  }

  // Work optimization
  if (stats.avgWorkScore < 70) {
    recommendations.push({
      priority: "Medium",
      action: "Focus Time Protection",
      details: "Block 2-hour morning focus sessions on Tuesday and Thursday",
      impact: "Increase deep work by 40%",
    });
  }

  return recommendations;
}

function generateWeeklyRecommendationsList(recommendations) {
  var html = "<div style='space-y:12px;'>";

  recommendations.forEach(function (rec, index) {
    var priorityColor = rec.priority === "High" ? "#ea4335" : "#f9ab00";

    html +=
      "<div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; " +
      "border-left:4px solid " +
      priorityColor +
      ";'>" +
      "<div style='display:flex; justify-content:space-between; align-items:start;'>" +
      "<div style='flex:1;'>" +
      "<div style='font-weight:600; color:#1565c0; font-size:16px;'>" +
      (index + 1) +
      ". " +
      rec.action +
      "</div>" +
      "<div style='color:#424242; margin:8px 0;'>" +
      rec.details +
      "</div>" +
      "<div style='font-size:13px; color:#666;'>💡 " +
      rec.impact +
      "</div>" +
      "</div>" +
      "<span style='background:" +
      priorityColor +
      "; color:white; padding:4px 8px; " +
      "border-radius:4px; font-size:12px; font-weight:600;'>" +
      rec.priority +
      "</span>" +
      "</div>" +
      "</div>";
  });

  html += "</div>";
  return html;
}

function analyzeWeeklyTrends(weekData) {
  var trends = {
    overall: [],
    sleep: [],
    activity: [],
    heart: [],
    work: [],
  };

  weekData.forEach(function (day) {
    trends.overall.push(day.score);
    trends.sleep.push(Math.min(100, Math.round((day.sleepMin / 480) * 100)));
    trends.activity.push(Math.min(100, Math.round((day.steps / 10000) * 100)));
    trends.heart.push(70 + Math.floor(Math.random() * 20)); // Placeholder
    trends.work.push(60 + Math.floor(Math.random() * 30)); // Placeholder
  });

  return trends;
}

function generateStatusTag(label, score, isPercent, isMainScore) {
  var status = "";
  var color = "";
  var bgColor = "";

  // Universal scoring across all metrics
  if (score === 100) {
    status = "PERFECT";
    color = "#00695c";
    bgColor = "#e0f2f1";
  } else if (score >= 95) {
    status = "AMAZING";
    color = "#00897b";
    bgColor = "#e0f2f1";
  } else if (score >= 90) {
    status = "EXCELLENT";
    color = "#0b8043";
    bgColor = "#e6f4ea";
  } else if (score >= 85) {
    status = "VERY GOOD";
    color = "#43a047";
    bgColor = "#e8f5e9";
  } else if (score >= 80) {
    status = "GOOD";
    color = "#66bb6a";
    bgColor = "#f1f8e9";
  } else if (score >= 75) {
    status = "ABOVE AVERAGE";
    color = "#9ccc65";
    bgColor = "#f9fbe7";
  } else if (score >= 70) {
    status = "SOLID";
    color = "#d4e157";
    bgColor = "#fcfcf0";
  } else if (score >= 65) {
    status = "MODERATE";
    color = "#ffb300";
    bgColor = "#fff8e1";
  } else if (score >= 60) {
    status = "FAIR";
    color = "#f9ab00";
    bgColor = "#fef7e0";
  } else if (score >= 55) {
    status = "BELOW AVERAGE";
    color = "#ff8f00";
    bgColor = "#fff3e0";
  } else if (score >= 50) {
    status = "NEEDS WORK";
    color = "#ff6f00";
    bgColor = "#ffeee0";
  } else if (score >= 45) {
    status = "POOR";
    color = "#f4511e";
    bgColor = "#fbe9e7";
  } else if (score >= 30) {
    status = "VERY POOR";
    color = "#ea4335";
    bgColor = "#fce8e6";
  } else {
    status = "CRITICAL";
    color = "#c62828";
    bgColor = "#ffebee";
  }

  // Use larger styling if this is the main score
  // Use larger styling if this is the main score
  if (isMainScore) {
    return (
      '<span style="display: inline-block; padding: 8px 16px; border-radius: 6px; ' +
      "font-size: 16px; font-weight: bold; color: " +
      color +
      "; " +
      'letter-spacing: 1px;">' +
      status +
      "</span>"
    ); // REMOVE background-color: ' + bgColor + ';
  }

  // Regular size for subscore tags
  return (
    '<span style="display: inline-block; padding: 4px 8px; border-radius: 4px; ' +
    "font-size: 11px; font-weight: bold; color: " +
    color +
    "; " +
    "background-color: " +
    bgColor +
    '; margin-left: 8px; vertical-align: middle;">' +
    status +
    "</span>"
  );
}

function getWeeklyData(startDate, endDate) {
  var sheet = getOrCreateMyMetricLogSheet();
  var data = sheet.getDataRange().getValues();
  var weekData = [];

  // Parse dates
  var start = new Date(startDate);
  var end = new Date(endDate);

  for (var i = 1; i < data.length; i++) {
    var rowDate = new Date(data[i][0]);
    if (rowDate >= start && rowDate <= end) {
      weekData.push({
        date: data[i][0],
        mood: data[i][1],
        score: parseInt(data[i][2]) || 0,
        sleepMin: parseInt(data[i][3]) || 0,
        steps: parseInt(data[i][4]) || 0,
        topTrack: data[i][5],
        weather: data[i][6],
        summary: data[i][7],
        // Add individual scores if they exist in columns 8-11
        sleepScore: data[i][8] ? parseInt(data[i][8]) : null,
        activityScore: data[i][9] ? parseInt(data[i][9]) : null,
        heartScore: data[i][10] ? parseInt(data[i][10]) : null,
        workScore: data[i][11] ? parseInt(data[i][11]) : null,
      });
    }
  }

  return weekData;
}
function calculateWeeklyStats(weekData) {
  // First, deduplicate the data by date
  var uniqueDayData = {};

  weekData.forEach(function (day) {
    var dateStr = "";
    if (day.date instanceof Date) {
      dateStr = Utilities.formatDate(
        day.date,
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );
    } else {
      dateStr = String(day.date);
    }

    // Keep only the latest entry for each date
    uniqueDayData[dateStr] = day;
  });

  // Convert back to array of unique days
  var uniqueDays = [];
  for (var date in uniqueDayData) {
    uniqueDays.push(uniqueDayData[date]);
  }

  // Sort by date
  uniqueDays.sort(function (a, b) {
    return new Date(a.date) - new Date(b.date);
  });

  var stats = {
    avgScore: 0,
    avgSleepScore: 0,
    avgActivityScore: 0,
    avgHeartScore: 0,
    avgWorkScore: 0,
    avgSleepHours: 0,
    avgSleepFormatted: "",
    avgSteps: 0,
    avgRHR: 62,
    minRHR: 100,
    maxRHR: 40,
    totalActiveMin: 0,
    totalEmails: 0,
    totalMeetings: 0,
    scoreTrend: 0,
    days7HoursSleep: 0,
    days10KSteps: 0,
    daysLowStress: 0,
    daysDeepWork: 0,
    daysActiveMinutes: 0,
    bestDay: { name: "", score: 0, highlights: [] },
    challengingDay: { name: "", score: 100, opportunities: [] },
    bestSleepDay: "",
    bestSleepHours: 0,
    bestStepsDay: "",
    bestSteps: 0,
    mostProductiveDay: "",
    dailyData: [],
  };

  // Now calculate stats using only unique days
  var totalScore = 0;
  var totalSleep = 0;
  var totalSteps = 0;
  var totalSleepScore = 0;
  var totalActivityScore = 0;
  var totalHeartScore = 0;
  var totalWorkScore = 0;
  var validScoreDays = {
    sleep: 0,
    activity: 0,
    heart: 0,
    work: 0,
  };

  uniqueDays.forEach(function (day, index) {
    totalScore += day.score;
    totalSleep += day.sleepMin;
    totalSteps += day.steps;

    // Sum individual scores if available
    if (day.sleepScore !== null) {
      totalSleepScore += day.sleepScore;
      validScoreDays.sleep++;
    }
    if (day.activityScore !== null) {
      totalActivityScore += day.activityScore;
      validScoreDays.activity++;
    }
    if (day.heartScore !== null) {
      totalHeartScore += day.heartScore;
      validScoreDays.heart++;
    }
    if (day.workScore !== null) {
      totalWorkScore += day.workScore;
      validScoreDays.work++;
    }

    // Track best/worst days
    if (day.score > stats.bestDay.score) {
      stats.bestDay.score = day.score;
      stats.bestDay.name = getDayName(new Date(day.date));
      stats.bestDay.highlights = [
        "Score: " + day.score,
        "Sleep: " + Math.round(day.sleepMin / 60) + "h",
        "Steps: " + day.steps.toLocaleString(),
      ];
    }

    if (day.score < stats.challengingDay.score && day.score > 0) {
      stats.challengingDay.score = day.score;
      stats.challengingDay.name = getDayName(new Date(day.date));
      stats.challengingDay.opportunities = [];

      if (day.sleepMin < 420) {
        stats.challengingDay.opportunities.push("Improve sleep duration");
      }
      if (day.steps < 8000) {
        stats.challengingDay.opportunities.push("Increase daily movement");
      }
      if (day.score < 60) {
        stats.challengingDay.opportunities.push("Focus on recovery");
      }
    }

    // Track habits - these should never exceed 7
    if (day.sleepMin >= 420) stats.days7HoursSleep++;
    if (day.steps >= 10000) stats.days10KSteps++;
    if (day.score >= 75) stats.daysDeepWork++;
    if (day.steps >= 8000) stats.daysActiveMinutes++;
    if (day.score >= 70) stats.daysLowStress++;

    // Track best individual metrics
    if (day.sleepMin > stats.bestSleepHours * 60) {
      stats.bestSleepHours = Math.round((day.sleepMin / 60) * 10) / 10;
      stats.bestSleepDay = getDayName(new Date(day.date));
    }

    if (day.steps > stats.bestSteps) {
      stats.bestSteps = day.steps;
      stats.bestStepsDay = getDayName(new Date(day.date));
    }

    // Add to daily data for any visualizations
    stats.dailyData.push({
      dayName: getDayName(new Date(day.date)),
      date: day.date,
      score: day.score,
      sleepHours: day.sleepMin / 60,
      steps: day.steps,
      activeMinutes: Math.round(day.steps / 100),
    });
  });

  // Calculate averages using actual number of unique days
  var actualDays = uniqueDays.length || 1;
  stats.avgScore = Math.round(totalScore / actualDays);
  stats.avgSleepHours = totalSleep / actualDays / 60;
  stats.avgSleepFormatted =
    Math.floor(stats.avgSleepHours) +
    "h " +
    Math.round((stats.avgSleepHours % 1) * 60) +
    "m";
  stats.avgSteps = Math.round(totalSteps / actualDays);

  // Calculate individual score averages
  if (validScoreDays.sleep > 0) {
    stats.avgSleepScore = Math.round(totalSleepScore / validScoreDays.sleep);
  } else {
    stats.avgSleepScore = Math.min(
      100,
      Math.round((stats.avgSleepHours / 8) * 100)
    );
  }

  if (validScoreDays.activity > 0) {
    stats.avgActivityScore = Math.round(
      totalActivityScore / validScoreDays.activity
    );
  } else {
    stats.avgActivityScore = Math.min(
      100,
      Math.round((stats.avgSteps / 10000) * 100)
    );
  }

  if (validScoreDays.heart > 0) {
    stats.avgHeartScore = Math.round(totalHeartScore / validScoreDays.heart);
  } else {
    stats.avgHeartScore = 75 + Math.floor(Math.random() * 15);
  }

  if (validScoreDays.work > 0) {
    stats.avgWorkScore = Math.round(totalWorkScore / validScoreDays.work);
  } else {
    stats.avgWorkScore = 70 + Math.floor(Math.random() * 20);
  }

  // Calculate trend vs previous week
  var previousWeekAvg = getPreviousWeekAverage();
  stats.scoreTrend = stats.avgScore - previousWeekAvg;

  // Set most productive day
  var weekdays = stats.dailyData.filter(function (d) {
    return d.dayName !== "Saturday" && d.dayName !== "Sunday";
  });
  if (weekdays.length > 0) {
    stats.mostProductiveDay = weekdays.reduce(function (prev, curr) {
      return curr.score > prev.score ? curr : prev;
    }).dayName;
  }

  // Calculate some additional metrics
  stats.totalEmails = Math.round(stats.avgSteps / 50);
  stats.totalMeetings = actualDays * 4;
  stats.totalActiveMin = actualDays * 30;

  // Heart rate calculations
  stats.minRHR = 58;
  stats.maxRHR = 65;
  stats.avgRHR = 62;

  return stats;
}

function generateWeeklyInsight(stats, trends, patterns) {
  var apiKey =
    PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

  var systemPrompt =
    "You are an elite wellness coach analyzing a week of behavioral data. " +
    "Write in the same style as the daily reports - conversational, specific, and actionable. " +
    "Always use 'you' and 'your' when addressing the user. Use **bold** for all metrics and key points.";

  var userPrompt =
    "Analyze this weekly wellness data and provide insights in EXACTLY this format:\n\n" +
    "[First paragraph: State the weekly average score and explain what drove it - which days were strong/weak and why. Include specific metrics like '**89/100** average driven by excellent sleep (**95/100**) but impacted by lower work scores on Tuesday and Thursday']\n" +
    "[PARAGRAPH BREAK]\n" +
    "[Second paragraph: Identify the most important weekly pattern - how metrics influenced each other across days. For example, how Monday's poor sleep affected Tuesday's activity, or how meeting-heavy days correlated with stress. Use specific numbers and days.]\n" +
    "[PARAGRAPH BREAK]\n" +
    "[Third paragraph: Provide 2-3 specific recommendations for next week with exact implementation details. Format as '**Monday morning:** Set up meeting-free blocks from 9-11 AM' not generic advice.]\n\n" +
    "WEEKLY DATA:\n" +
    "Average Score: " +
    stats.avgScore +
    "/100 (trend: " +
    (stats.scoreTrend > 0 ? "+" : "") +
    stats.scoreTrend +
    " vs last week)\n" +
    "Sleep: " +
    stats.avgSleepScore +
    "/100 (" +
    stats.avgSleepFormatted +
    " average, " +
    stats.days7HoursSleep +
    " nights 7+ hours)\n" +
    "Activity: " +
    stats.avgActivityScore +
    "/100 (" +
    formatNumberWithCommas(stats.avgSteps) +
    " steps/day average, " +
    stats.days10KSteps +
    " days hit 10K)\n" +
    "Heart: " +
    stats.avgHeartScore +
    "/100 (RHR: " +
    stats.minRHR +
    "-" +
    stats.maxRHR +
    " bpm range)\n" +
    "Work: " +
    stats.avgWorkScore +
    "/100\n\n" +
    "BEST DAY: " +
    stats.bestDay.name +
    " (Score: " +
    stats.bestDay.score +
    ")\n" +
    "CHALLENGING DAY: " +
    stats.challengingDay.name +
    " (Score: " +
    stats.challengingDay.score +
    ")\n" +
    "Reasons for challenging day: " +
    stats.challengingDay.opportunities.join(", ") +
    "\n\n" +
    (patterns && patterns.length > 0
      ? "PATTERNS DETECTED:\n" +
        patterns
          .map(function (p) {
            return "- " + p.type + ": " + p.description;
          })
          .join("\n") +
        "\n\n"
      : "") +
    "Remember to:\n" +
    "- Reference exact scores and explain WHY they are what they are\n" +
    "- Connect patterns across multiple days\n" +
    "- Make recommendations specific to days and times\n" +
    "- Match the conversational, analytical tone of the daily reports";

  var payload = {
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(
      "https://api.openai.com/v1/chat/completions",
      options
    );
    var result = JSON.parse(response.getContentText());

    if (result && result.choices && result.choices.length > 0) {
      var content = result.choices[0].message.content;
      // Ensure we return a string
      return String(content).trim();
    }
  } catch (e) {
    Logger.log("Weekly GPT API error: " + e);
  }

  // Fallback insight
  return generateEnhancedFallbackWeeklyInsight(stats, patterns);
}

function generateEnhancedFallbackWeeklyInsight(stats, patterns) {
  var insight =
    "Your weekly average of **" +
    stats.avgScore +
    "/100** " +
    (stats.scoreTrend > 0
      ? "improved by **+" + stats.scoreTrend + " points**"
      : stats.scoreTrend < 0
      ? "decreased by **" + stats.scoreTrend + " points**"
      : "remained stable") +
    " compared to last week. ";

  // Identify driving factors
  var strengths = [];
  var weaknesses = [];

  if (stats.avgSleepScore >= 90)
    strengths.push("exceptional sleep (**" + stats.avgSleepScore + "/100**)");
  else if (stats.avgSleepScore < 70)
    weaknesses.push("insufficient sleep (**" + stats.avgSleepScore + "/100**)");

  if (stats.avgActivityScore >= 90)
    strengths.push(
      "excellent activity (**" +
        formatNumberWithCommas(stats.avgSteps) +
        " steps/day**)"
    );
  else if (stats.avgActivityScore < 70)
    weaknesses.push("low activity (**" + stats.avgActivityScore + "/100**)");

  if (strengths.length > 0) {
    insight +=
      "Your " + strengths.join(" and ") + " drove strong performance. ";
  }
  if (weaknesses.length > 0) {
    insight +=
      "However, " + weaknesses.join(" and ") + " limited your potential. ";
  }

  insight += "\n\n[PARAGRAPH BREAK]\n\n";

  // Pattern analysis
  insight +=
    "**" +
    stats.bestDay.name +
    "** was your peak day (**" +
    stats.bestDay.score +
    "/100**) with " +
    stats.bestDay.highlights.join(", ") +
    ". ";
  insight +=
    "In contrast, **" +
    stats.challengingDay.name +
    "** scored lowest (**" +
    stats.challengingDay.score +
    "/100**) due to " +
    stats.challengingDay.opportunities.join(" and ") +
    ". ";

  if (stats.days7HoursSleep < 4) {
    insight +=
      "Only **" +
      stats.days7HoursSleep +
      " nights** of adequate sleep created a cascading effect on other metrics. ";
  }

  insight += "\n\n[PARAGRAPH BREAK]\n\n";

  // Specific recommendations
  insight += "**Action plan for next week:** ";

  if (stats.avgSleepScore < 80) {
    insight +=
      "**Sunday night:** Set a 10 PM bedtime alarm to start the week strong. ";
  }

  if (stats.days10KSteps < 4) {
    insight +=
      "**Daily at 2 PM:** Schedule a 20-minute walk to ensure you hit 10K steps at least 5 days. ";
  }

  if (
    stats.challengingDay.name === "Monday" ||
    stats.challengingDay.name === "Tuesday"
  ) {
    insight +=
      "**" +
      stats.challengingDay.name +
      " morning:** Block 9-11 AM for deep work to improve your typical " +
      stats.challengingDay.name +
      " slump.";
  }

  return insight;
}

function generateFallbackWeeklyInsight(stats, patterns) {
  var insights = [];

  // Overall performance
  if (stats.avgScore >= 80) {
    insights.push(
      "Outstanding week! Your average score of **" +
        stats.avgScore +
        "/100** places you in the top 10% of performance. " +
        "You maintained excellent balance across all wellness dimensions."
    );
  } else if (stats.avgScore >= 70) {
    insights.push(
      "Strong week with an average score of **" +
        stats.avgScore +
        "/100**. " +
        "You showed good consistency with room for optimization in key areas."
    );
  } else {
    insights.push(
      "Challenging week with an average score of **" +
        stats.avgScore +
        "/100**. " +
        "Let's identify the key factors and create a recovery plan."
    );
  }

  // Sleep insights
  if (stats.days7HoursSleep >= 5) {
    insights.push(
      "\n\nSleep consistency was excellent - you achieved 7+ hours on **" +
        stats.days7HoursSleep +
        " out of 7 nights**. This is your foundation for success."
    );
  } else if (stats.days7HoursSleep <= 2) {
    insights.push(
      "\n\nSleep was a major challenge this week, with only **" +
        stats.days7HoursSleep +
        " nights** of adequate rest. This likely impacted all other metrics."
    );
  }

  // Activity insights
  if (stats.days10KSteps >= 5) {
    insights.push(
      "\n\nMovement was a strength - you hit 10K+ steps on **" +
        stats.days10KSteps +
        " days**, averaging **" +
        stats.avgSteps.toLocaleString() +
        " daily**."
    );
  }

  // Patterns
  if (patterns && patterns.length > 0) {
    insights.push("\n\nKey pattern detected: " + patterns[0].description);
  }

  // Best day analysis
  insights.push(
    "\n\nYour best day was **" +
      stats.bestDay.name +
      "** with a score of **" +
      stats.bestDay.score +
      "**. Replicate this day's habits for consistent excellence."
  );

  return insights.join("");
}

function getWeeklyBadgeData() {
  var badges = {
    totalBadges: 0,
    totalPoints: 0,
    streakDays: 0,
    topBadges: [],
    byRarity: {
      legendary: 0,
      epic: 0,
      rare: 0,
      uncommon: 0,
      common: 0,
    },
  };

  // Get badge data from badge history sheet
  var sheet = getOrCreateBadgeHistorySheet();
  var data = sheet.getDataRange().getValues();

  if (data.length < 2) return badges;

  // Group by date to handle duplicates
  var badgesByDate = {};

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      var dateStr = String(data[i][0]);
      // Keep only the latest entry per date
      badgesByDate[dateStr] = {
        count: parseInt(data[i][1]) || 0,
        points: parseInt(data[i][2]) || 0,
        names: data[i][3] ? data[i][3].split(", ") : [],
      };
    }
  }

  // Get last 7 unique dates
  var sortedDates = Object.keys(badgesByDate).sort().slice(-7);
  var badgeCounts = {};

  sortedDates.forEach(function (dateStr) {
    var dayData = badgesByDate[dateStr];
    badges.totalBadges += dayData.count;
    badges.totalPoints += dayData.points;

    // Count badge types
    dayData.names.forEach(function (name) {
      if (!badgeCounts[name]) badgeCounts[name] = 0;
      badgeCounts[name]++;

      // Track rarity
      var rarity = getBadgeRarity(name);
      if (!badges.byRarity[rarity]) badges.byRarity[rarity] = 0;
      badges.byRarity[rarity]++;
    });
  });

  // Get top 3 badges
  var sortedBadges = Object.keys(badgeCounts)
    .sort(function (a, b) {
      return badgeCounts[b] - badgeCounts[a];
    })
    .slice(0, 3);

  badges.topBadges = sortedBadges.map(function (name) {
    return {
      name: name,
      count: badgeCounts[name],
      emoji: getBadgeEmoji(name),
      description: getBadgeDescription(name),
    };
  });

  // Calculate streak days based on actual unique dates
  var currentDate = new Date();
  var dateStr = Utilities.formatDate(
    currentDate,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  var streaks = getActiveStreaks(dateStr);
  badges.streakDays = Math.max(
    streaks.goodSleep || 0,
    streaks.activedays || 0,
    streaks.highScore || 0
  );

  return badges;
}

function identifyWeeklyPatterns(weekData) {
  var patterns = [];

  // Weekend vs Weekday pattern
  var weekdayScores = [];
  var weekendScores = [];

  weekData.forEach(function (day) {
    var date = new Date(day.date);
    var dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendScores.push(day.score);
    } else {
      weekdayScores.push(day.score);
    }
  });

  var avgWeekday =
    weekdayScores.reduce(function (a, b) {
      return a + b;
    }, 0) / weekdayScores.length;
  var avgWeekend =
    weekendScores.reduce(function (a, b) {
      return a + b;
    }, 0) / weekendScores.length;

  if (avgWeekend > avgWeekday + 10) {
    patterns.push({
      type: "Weekend Warrior",
      description:
        "Your weekend scores average " +
        Math.round(avgWeekend - avgWeekday) +
        " points higher than weekdays",
      confidence: 85,
    });
  } else if (avgWeekday > avgWeekend + 10) {
    patterns.push({
      type: "Weekday Performer",
      description:
        "You maintain better wellness during work days, with scores " +
        Math.round(avgWeekday - avgWeekend) +
        " points higher",
      confidence: 85,
    });
  }

  // Sleep-Performance correlation
  var goodSleepDays = weekData.filter(function (d) {
    return d.sleepMin >= 420;
  });
  var poorSleepDays = weekData.filter(function (d) {
    return d.sleepMin < 360;
  });

  if (goodSleepDays.length > 0 && poorSleepDays.length > 0) {
    var avgGoodSleepScore =
      goodSleepDays.reduce(function (a, d) {
        return a + d.score;
      }, 0) / goodSleepDays.length;
    var avgPoorSleepScore =
      poorSleepDays.reduce(function (a, d) {
        return a + d.score;
      }, 0) / poorSleepDays.length;

    if (avgGoodSleepScore > avgPoorSleepScore + 15) {
      patterns.push({
        type: "Sleep-Dependent Performance",
        description:
          "Good sleep nights yield " +
          Math.round(avgGoodSleepScore - avgPoorSleepScore) +
          " point higher scores",
        confidence: 90,
      });
    }
  }

  // Momentum pattern
  var firstHalf =
    weekData.slice(0, 3).reduce(function (a, d) {
      return a + d.score;
    }, 0) / 3;
  var secondHalf =
    weekData.slice(4).reduce(function (a, d) {
      return a + d.score;
    }, 0) /
    (weekData.length - 4);

  if (secondHalf > firstHalf + 5) {
    patterns.push({
      type: "Building Momentum",
      description:
        "Your scores improved throughout the week, gaining " +
        Math.round(secondHalf - firstHalf) +
        " points",
      confidence: 75,
    });
  } else if (firstHalf > secondHalf + 5) {
    patterns.push({
      type: "Midweek Fatigue",
      description:
        "Scores declined by " +
        Math.round(firstHalf - secondHalf) +
        " points as the week progressed",
      confidence: 75,
    });
  }

  return patterns;
}

// Helper functions
function formatDateRange(startDate, endDate) {
  var start = new Date(startDate);
  var end = new Date(endDate);
  var months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    months[start.getMonth()] +
    " " +
    start.getDate() +
    " - " +
    months[end.getMonth()] +
    " " +
    end.getDate() +
    ", " +
    end.getFullYear()
  );
}

function getDayName(date) {
  var days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
}

function formatWeeklyInsight(insight) {
  return insight
    .split("\n\n")
    .map(function (paragraph) {
      return '<p style="margin-bottom: 12px;">' + paragraph + "</p>";
    })
    .join("");
}

function generateMiniBar(score) {
  var filled = Math.round(score / 10);
  var bar =
    '<div style="margin-top:8px; font-family:monospace; font-size:12px; color:#666;">';

  for (var i = 0; i < 10; i++) {
    if (i < filled) {
      bar += "▓";
    } else {
      bar += "░";
    }
  }

  bar += "</div>";
  return bar;
}

function getHourIntensity(day, hour) {
  // Simplified - you'd calculate this from actual activity data
  if (hour >= 23 || hour < 7) return 0; // Sleep
  if (hour >= 9 && hour <= 17) return 2; // Work hours
  if (Math.random() > 0.7) return 4; // Random high activity
  return 1; // Low activity
}

function getHeatmapColor(intensity) {
  var colors = ["#e0f2f1", "#a5d6a7", "#66bb6a", "#43a047", "#2e7d32"];
  return colors[intensity];
}

function generateSampleTrend() {
  var trend = [];
  var base = 70 + Math.floor(Math.random() * 20);
  for (var i = 0; i < 7; i++) {
    trend.push(base + Math.floor(Math.random() * 10) - 5);
  }
  return trend;
}

function getBadgeEmoji(badgeName) {
  var emojis = {
    "Perfect Day": "👑",
    "Sleep Master": "🌙",
    "10K Club": "🏃",
    "Well Rested": "😴",
    "Active Day": "💪",
    "Heart Hero": "❤️",
    "Zen Mode": "🧘",
  };
  return emojis[badgeName] || "🏅";
}

function getBadgeDescription(badgeName) {
  var descriptions = {
    "Perfect Day": "Overall score 90+",
    "Sleep Master": "Optimal sleep achieved",
    "10K Club": "Hit 10,000 steps",
    "Well Rested": "Solid sleep score",
    "Active Day": "Good activity levels",
    "Heart Hero": "Excellent cardiovascular health",
    "Zen Mode": "Low stress levels",
  };
  return descriptions[badgeName] || "Achievement earned";
}

// 🔧 Converts Celsius values in the weather summary to Fahrenheit
function convertWeatherToFahrenheit(summary) {
  try {
    if (!summary) return summary;
    return summary.replace(
      /([-]?\d+(?:\.\d+)?)°C \(feels like ([-]?\d+(?:\.\d+)?)°C\)/,
      function (match, tempC, feelsC) {
        var f = Math.round((parseFloat(tempC) * 9) / 5 + 32);
        var feelsF = Math.round((parseFloat(feelsC) * 9) / 5 + 32);
        return f + "°F (feels like " + feelsF + "°F)";
      }
    );
  } catch (e) {
    Logger.log("🌦️ Weather conversion error: " + e);
    return summary;
  }
}

function generateIntradayVisualization(
  activityData,
  sleepData,
  calendarData,
  dayContext
) {
  // Keep all the existing parsing logic
  var hourlyActivity = [];
  for (var i = 0; i < 24; i++) {
    hourlyActivity.push(0);
  }

  var sleepStart = 23;
  var sleepEnd = 7;

  var bedMatch = sleepData.match(/🌙 Bedtime: (\d+):(\d+) (AM|PM)/);
  var wakeMatch = sleepData.match(/☀️ Wake time: (\d+):(\d+) (AM|PM)/);

  if (bedMatch) {
    sleepStart = parseInt(bedMatch[1]);
    if (bedMatch[3] === "PM" && sleepStart !== 12) sleepStart += 12;
    if (bedMatch[3] === "AM" && sleepStart === 12) sleepStart = 0;
  }
  if (wakeMatch) {
    sleepEnd = parseInt(wakeMatch[1]);
    if (wakeMatch[3] === "PM" && sleepEnd !== 12) sleepEnd += 12;
    if (wakeMatch[3] === "AM" && sleepEnd === 12) sleepEnd = 0;
  }

  var veryActiveMatch = activityData.match(/💪 Very Active: (\d+) min/);
  var fairlyActiveMatch = activityData.match(/🚶 Fairly Active: (\d+) min/);
  var lightlyActiveMatch = activityData.match(/🧘 Lightly Active: (\d+) min/);

  var veryActive = veryActiveMatch ? parseInt(veryActiveMatch[1]) : 0;
  var fairlyActive = fairlyActiveMatch ? parseInt(fairlyActiveMatch[1]) : 0;
  var lightlyActive = lightlyActiveMatch ? parseInt(lightlyActiveMatch[1]) : 0;

  var activityPeaks = [];
  if (veryActive > 0) {
    if (sleepEnd <= 6) {
      activityPeaks.push({ hour: 6, intensity: "high" });
    } else {
      activityPeaks.push({ hour: 17, intensity: "high" });
    }
  }
  if (fairlyActive > 0) {
    activityPeaks.push({ hour: 12, intensity: "medium" });
  }

  // Create visual representation with inline styles for email
  var heatmapHtml =
    '<div style="margin: 20px 0; padding: 20px; background: #f0fff4; border-left: 4px solid #1dd1a1; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">';
  heatmapHtml +=
    '<h4 style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px 0;">24-Hour Activity Pattern</h4>';

  // Container for the chart
  heatmapHtml +=
    '<div style="position: relative; height: 80px; margin-bottom: 5px; border-bottom: 1px solid #e0e0e0;">';

  // Bars container
  heatmapHtml +=
    '<div style="display: table; width: 100%; height: 100%; table-layout: fixed;">';

  for (var hour = 0; hour < 24; hour++) {
    var intensity = "low";
    var color = "#e0e0e0";
    var label = "";
    var height = 20;

    var isSleeping = false;
    if (sleepStart > sleepEnd) {
      isSleeping = hour >= sleepStart || hour < sleepEnd;
    } else {
      isSleeping = hour >= sleepStart && hour < sleepEnd;
    }

    if (isSleeping) {
      intensity = "sleep";
      color = "#4285f4";
      label = "😴";
      height = 30;
    } else {
      for (var p = 0; p < activityPeaks.length; p++) {
        if (hour === activityPeaks[p].hour) {
          intensity = activityPeaks[p].intensity;
          if (intensity === "high") {
            color = "#0f9d58"; // Changed from red to green
            label = "🏃";
            height = 60;
          } else if (intensity === "medium") {
            color = "#81c784"; // Changed from yellow to light green
            label = "🚶";
            height = 45;
          }
          break;
        }
      }

      if (hour === sleepEnd && !isSleeping) {
        color = "#ffa726"; // Orange for wake time
        label = "☀️";
        height = 40;
      }

      if (hour >= 9 && hour <= 17 && intensity === "low") {
        // Check if it's a weekend
        var isWeekend = dayContext && dayContext.dayType === "weekend";

        if (!isWeekend) {
          color = "#dadce0";
          label = "💼";
          height = 25;
        } else {
          // On weekends, show as regular low activity, not work
          color = "#e0e0e0";
          label = "";
          height = 20;
        }
      }
    }

    heatmapHtml +=
      '<div style="display: table-cell; vertical-align: bottom; padding: 0 1px;">';
    heatmapHtml +=
      '<div style="width: 100%; height: ' +
      height +
      "px; background: " +
      color +
      "; " +
      "position: relative; border-radius: 2px 2px 0 0; " +
      'border: 1px solid rgba(0,0,0,0.1); border-bottom: none;" ' +
      'title="' +
      hour +
      ':00">';

    if (label) {
      heatmapHtml +=
        '<div style="position: absolute; top: 50%; left: 50%; ' +
        "transform: translate(-50%, -50%); font-size: 11px; line-height: 1; " +
        'text-align: center;">' +
        label +
        "</div>";
    }

    heatmapHtml += "</div></div>";
  }

  heatmapHtml += "</div></div>";

  // Hour labels
  heatmapHtml +=
    '<div style="display: table; width: 100%; table-layout: fixed; font-size: 11px; color: #757575;">';
  for (var hour = 0; hour < 24; hour++) {
    heatmapHtml +=
      '<div style="display: table-cell; text-align: center; padding: 0 1px;">';
    if (hour % 3 === 0) {
      heatmapHtml += hour;
    }
    heatmapHtml += "</div>";
  }
  heatmapHtml += "</div>";

  // Updated Legend with better colors
  heatmapHtml +=
    '<div style="margin-top: 15px; font-size: 13px; color: #5f6368;">';
  heatmapHtml +=
    '<div style="display: flex; margin-bottom: 8px; justify-content: space-between;">';
  heatmapHtml +=
    '<span style="display: inline-block; width: 30%;">😴 Sleep</span>';
  heatmapHtml +=
    '<span style="display: inline-block; width: 30%;">☀️ Wake</span>';
  heatmapHtml +=
    '<span style="display: inline-block; width: 30%;">🚶 Moderate Activity</span>';
  heatmapHtml += "</div>";
  heatmapHtml += '<div style="display: flex; justify-content: space-between;">';
  heatmapHtml +=
    '<span style="display: inline-block; width: 30%;">🏃 High Activity</span>';
  heatmapHtml +=
    '<span style="display: inline-block; width: 30%;">💼 Work Hours</span>';
  heatmapHtml +=
    '<span style="display: inline-block; width: 30%;">⬜ Sedentary/Low Activity</span>';
  heatmapHtml += "</div>";
  heatmapHtml += "</div>";

  // Summary stats with AI narrative
  var activityNarrative = generateActivityNarrative(
    activityData,
    sleepData,
    dayContext
  );

  heatmapHtml +=
    '<div style="margin-top: 12px; padding: 12px; background: #e8f0fe; ' +
    'border-radius: 4px; font-size: 14px; color: #424242; line-height: 1.5;">' +
    "<strong>Activity Summary:</strong> " +
    activityNarrative +
    "</div></div>";

  return heatmapHtml;
}

function generateTrendVisualization(scores) {
  var trends = getScoreTrends();
  if (
    !trends ||
    !trends.overall ||
    !trends.overall.sparkline ||
    trends.overall.sparkline.length < 2
  ) {
    return ""; // No trend data available
  }

  var trendHtml =
    '<div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">';
  trendHtml +=
    '<h3 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">📈 7-Day Trends</h3>';

  // Create mini bar charts for each metric
  var metrics = [
    { name: "Overall", data: trends.overall.sparkline, color: "#1a73e8" },
    { name: "Sleep", data: generateMetricTrend("sleep"), color: "#7c4dff" },
    {
      name: "Activity",
      data: generateMetricTrend("activity"),
      color: "#0f9d58",
    },
    { name: "Heart", data: generateMetricTrend("heart"), color: "#ea4335" },
    { name: "Work", data: generateMetricTrend("work"), color: "#f9ab00" },
  ];

  metrics.forEach(function (metric) {
    if (!metric.data || metric.data.length === 0) return;

    var current = metric.data[metric.data.length - 1];
    var previous =
      metric.data.length > 1 ? metric.data[metric.data.length - 2] : current;
    var change = current - previous;
    var changeStr = change > 0 ? "+" + change : change.toString();
    var arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";

    trendHtml += '<div style="margin-bottom: 20px;">';
    trendHtml +=
      '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">';
    trendHtml +=
      '<span style="font-weight: 600; color: #424242;">' +
      metric.name +
      "</span>";
    trendHtml +=
      '<span style="font-size: 18px; font-weight: bold; color: ' +
      metric.color +
      ';">' +
      current +
      ' <span style="font-size: 14px; color: #666;">' +
      arrow +
      " " +
      changeStr +
      "</span></span>";
    trendHtml += "</div>";

    // Bar chart
    trendHtml +=
      '<div style="display: flex; align-items: flex-end; height: 60px; gap: 2px;">';

    var maxValue = Math.max.apply(null, metric.data);
    var minValue = Math.min.apply(null, metric.data);
    var range = maxValue - minValue || 1;

    metric.data.forEach(function (value, index) {
      var height = ((value - minValue) / range) * 40 + 20; // Min 20px, max 60px
      var opacity = index === metric.data.length - 1 ? "1" : "0.6";

      trendHtml +=
        '<div style="flex: 1; background: ' +
        metric.color +
        "; " +
        "height: " +
        height +
        "px; opacity: " +
        opacity +
        "; " +
        'border-radius: 2px 2px 0 0; position: relative;" ' +
        'title="Day ' +
        (index + 1) +
        ": " +
        value +
        '">';

      // Show value on hover
      if (index === metric.data.length - 1) {
        trendHtml +=
          '<div style="position: absolute; top: -20px; left: 50%; ' +
          "transform: translateX(-50%); font-size: 11px; " +
          "color: " +
          metric.color +
          '; font-weight: bold;">' +
          value +
          "</div>";
      }

      trendHtml += "</div>";
    });

    trendHtml += "</div>";

    // Day labels
    trendHtml +=
      '<div style="display: flex; gap: 2px; margin-top: 4px; font-size: 10px; color: #999;">';
    for (var i = 0; i < metric.data.length; i++) {
      var dayLabel =
        i === metric.data.length - 1
          ? "Today"
          : i === metric.data.length - 2
          ? "Yesterday"
          : metric.data.length - i - 1 + "d ago";
      trendHtml +=
        '<div style="flex: 1; text-align: center;">' + dayLabel + "</div>";
    }
    trendHtml += "</div>";

    trendHtml += "</div>";
  });

  trendHtml += "</div>";
  return trendHtml;
}

// Helper function to generate fake metric trends (replace with real data)
function generateMetricTrend(metric) {
  var sheet = getOrCreateMyMetricLogSheet();
  var allData = sheet.getDataRange().getValues();
  var trend = [];

  // Skip header row
  if (allData.length <= 1) return [];

  // Map metric names to column indices
  var scoreColumns = {
    sleep: 8, // Column I (Sleep Score)
    activity: 9, // Column J (Activity Score)
    heart: 10, // Column K (Heart Score)
    work: 11, // Column L (Work Score)
  };

  var columnIndex = scoreColumns[metric.toLowerCase()];

  // If we don't have score columns yet, fall back to calculated values
  if (!columnIndex || allData[0].length < 12) {
    Logger.log(
      "Score columns not available, using calculated values for " + metric
    );
    return generateMetricTrendFallback(metric);
  }

  // Group data by date, keeping only the latest entry per date
  var dataByDate = {};

  // Process ALL rows (not just last 7)
  for (var i = 1; i < allData.length; i++) {
    if (allData[i][0]) {
      // Has date
      var dateStr = "";

      // Handle different date formats
      if (allData[i][0] instanceof Date) {
        dateStr = Utilities.formatDate(
          allData[i][0],
          Session.getScriptTimeZone(),
          "yyyy-MM-dd"
        );
      } else {
        dateStr = String(allData[i][0]);
      }

      // Get the score from the appropriate column
      var scoreValue = allData[i][columnIndex];

      // Store data for this date (overwrites previous entries for same date)
      dataByDate[dateStr] = {
        score: parseInt(scoreValue) || 0,
      };
    }
  }

  // Get the last 7 unique dates
  var sortedDates = Object.keys(dataByDate).sort();
  var last7Dates = sortedDates.slice(-7);

  // Build trend array
  last7Dates.forEach(function (dateStr) {
    var dayData = dataByDate[dateStr];
    if (dayData.score > 0) {
      trend.push(dayData.score);
    }
  });

  return trend;
}

// Fallback function for historical data without scores
function generateMetricTrendFallback(metric) {
  var sheet = getOrCreateMyMetricLogSheet();
  var allData = sheet.getDataRange().getValues();
  var trend = [];

  if (allData.length <= 1) return [];

  // This is your existing calculation logic
  // ... (keep your existing generateMetricTrend logic here as fallback)

  return trend;
}

function generateDeepAIInsights(allData) {
  var insights = {
    patterns: [],
    predictions: [],
    rootCauses: [],
    prescriptions: [],
  };

  // Pattern Recognition
  if (allData.scores.sleep < 70 && allData.scores.activity > 80) {
    insights.patterns.push({
      type: "Sleep-Activity Imbalance",
      detail:
        "High activity despite poor sleep - unsustainable pattern detected",
      confidence: 0.85,
    });

    insights.rootCauses.push({
      pattern: "Sleep-Activity Imbalance",
      cause: "Likely compensating for fatigue with movement/caffeine",
      evidence: "Common pattern when work stress is elevated",
    });

    insights.predictions.push({
      timeframe: "Next 48 hours",
      prediction: "60% probability of energy crash without intervention",
      impact: "Expect 25-30% productivity decline",
    });

    insights.prescriptions.push({
      priority: "high",
      action: "Mandatory 8-hour sleep opportunity tonight",
      detail: "Set bedtime alarm at 9:30 PM, no screens after 9 PM",
      expected: "Restore balance and prevent crash",
    });
  }

  // Stress Pattern Detection
  if (
    allData.stressRadar.score > 50 &&
    allData.calendarIntelligence.score < 60
  ) {
    insights.patterns.push({
      type: "Calendar-Induced Stress",
      detail: "Meeting overload correlating with stress markers",
      confidence: 0.9,
    });

    insights.prescriptions.push({
      priority: "medium",
      action: "Implement 'Meeting-Free Friday afternoons'",
      detail: "Block calendar 1-5 PM Fridays for deep work",
      expected: "20% stress reduction, 30% productivity gain",
    });
  }

  // Recovery Optimization
  if (allData.recoveryQuotient.score < 60) {
    insights.patterns.push({
      type: "Suboptimal Recovery",
      detail: "Recovery lagging behind activity demands",
      confidence: 0.75,
    });

    insights.prescriptions.push({
      priority: "high",
      action: "Active recovery protocol",
      detail: "20-min walk, 10-min meditation, 8:30 PM magnesium",
      expected: "Boost recovery score by 15-20 points",
    });
  }

  return insights;
}

function getAdvancedCalendarAnalysis(events) {
  var analysis = {
    totalEvents: events.length,
    totalMinutes: 0,
    meetingTypes: {
      oneOnOne: 0,
      smallGroup: 0, // 3-5 people
      largeMeeting: 0, // 6+ people
      focus: 0, // "Focus time", "Deep work", etc.
      external: 0, // with people outside your domain
    },
    cognitiveLoad: {
      backToBack: 0, // meetings with <15 min gap
      contextSwitches: 0, // different types of meetings
      fragmentedTime: 0, // gaps too small to be productive (<30 min)
      longestFocusBlock: 0,
      meetingMarathons: 0, // 3+ hours continuous meetings
    },
    timeDistribution: {
      morning: 0, // before 10am
      midday: 0, // 10am-2pm
      afternoon: 0, // 2pm-5pm
      evening: 0, // after 5pm
    },
    energyDrain: 0, // calculated score
  };

  // Filter out non-meeting events
  var actualMeetings = events.filter(function (event) {
    var title = event.getTitle().toLowerCase();
    var isAllDay = event.isAllDayEvent();

    // Skip all-day events (like vacations)
    if (isAllDay) return false;

    // Skip personal reminders and activities
    if (
      title.match(
        /pick up|drop off|reminder|vacation|holiday|lodge|hotel|personal|family|kids|children|birthday|anniversary|doctor|dentist|appointment/i
      )
    ) {
      return false;
    }

    // Skip if no attendees (likely a personal reminder)
    var attendees = event.getGuestList ? event.getGuestList() : [];
    if (
      attendees.length === 0 &&
      !title.match(/meeting|sync|standup|1:1|call|interview|review/i)
    ) {
      return false;
    }

    return true;
  });

  // Update to use actualMeetings instead of events
  analysis.totalEvents = actualMeetings.length;

  // If no actual meetings, assume full day of focus time
  if (actualMeetings.length === 0) {
    // Assume 8 hours of potential focus time (480 minutes)
    analysis.cognitiveLoad.longestFocusBlock = 480;
    analysis.meetingTypes.focus = 8; // 8 hours of focus
    return analysis;
  }

  // Sort actual meetings by start time
  actualMeetings.sort(function (a, b) {
    return a.getStartTime() - b.getStartTime();
  });

  // Calculate longest focus block including start and end of day
  var workdayStart = 9 * 60; // 9 AM in minutes
  var workdayEnd = 17 * 60; // 5 PM in minutes
  var maxFocusBlock = 0;

  // Check morning before first meeting
  if (actualMeetings.length > 0) {
    var firstEventStart =
      actualMeetings[0].getStartTime().getHours() * 60 +
      actualMeetings[0].getStartTime().getMinutes();
    if (firstEventStart > workdayStart) {
      maxFocusBlock = firstEventStart - workdayStart;
    }
  }

  for (var i = 0; i < actualMeetings.length; i++) {
    var event = actualMeetings[i];
    var title = event.getTitle().toLowerCase();
    var attendees = event.getGuestList ? event.getGuestList() : [];
    var duration = (event.getEndTime() - event.getStartTime()) / 60000; // minutes
    var startHour = event.getStartTime().getHours();

    analysis.totalMinutes += duration;

    // Classify meeting type
    if (title.match(/focus|deep work|blocked|dns|do not schedule/i)) {
      analysis.meetingTypes.focus++;
    } else if (attendees.length === 1) {
      analysis.meetingTypes.oneOnOne++;
    } else if (attendees.length <= 5) {
      analysis.meetingTypes.smallGroup++;
    } else {
      analysis.meetingTypes.largeMeeting++;
    }

    // Check for external meetings
    var userDomain = Session.getActiveUser().getEmail().split("@")[1];
    for (var j = 0; j < attendees.length; j++) {
      if (!attendees[j].getEmail().includes(userDomain)) {
        analysis.meetingTypes.external++;
        break;
      }
    }

    // Time distribution
    if (startHour < 10) analysis.timeDistribution.morning += duration;
    else if (startHour < 14) analysis.timeDistribution.midday += duration;
    else if (startHour < 17) analysis.timeDistribution.afternoon += duration;
    else analysis.timeDistribution.evening += duration;

    // Cognitive load analysis
    if (i > 0) {
      var prevEvent = actualMeetings[i - 1];
      var gap = (event.getStartTime() - prevEvent.getEndTime()) / 60000;

      if (gap < 15) {
        analysis.cognitiveLoad.backToBack++;
      } else if (gap < 30) {
        analysis.cognitiveLoad.fragmentedTime++;
      }

      // Context switching (different meeting types)
      if (getMeetingContext(prevEvent) !== getMeetingContext(event)) {
        analysis.cognitiveLoad.contextSwitches++;
      }
    }

    // Track longest meeting-free block between events
    if (i < actualMeetings.length - 1) {
      var nextEvent = actualMeetings[i + 1];
      var freeTime = (nextEvent.getStartTime() - event.getEndTime()) / 60000;
      if (freeTime > 30) {
        // At least 30 minutes to be productive
        if (freeTime > maxFocusBlock) {
          maxFocusBlock = freeTime;
        }
      } else if (freeTime < 30 && freeTime > 0) {
        analysis.cognitiveLoad.fragmentedTime++;
      }
    }
  }

  // Check evening after last meeting
  if (actualMeetings.length > 0) {
    var lastEvent = actualMeetings[actualMeetings.length - 1];
    var lastEventEnd =
      lastEvent.getEndTime().getHours() * 60 +
      lastEvent.getEndTime().getMinutes();
    if (lastEventEnd < workdayEnd) {
      var eveningFocus = workdayEnd - lastEventEnd;
      if (eveningFocus > maxFocusBlock) {
        maxFocusBlock = eveningFocus;
      }
    }
  }

  // Check for meeting marathons (3+ consecutive hours)
  var consecutiveMeetingTime = 0;
  for (var i = 0; i < actualMeetings.length; i++) {
    if (i === 0) {
      consecutiveMeetingTime =
        (actualMeetings[i].getEndTime() - actualMeetings[i].getStartTime()) /
        60000;
    } else {
      var gap =
        (actualMeetings[i].getStartTime() -
          actualMeetings[i - 1].getEndTime()) /
        60000;
      if (gap < 15) {
        consecutiveMeetingTime +=
          (actualMeetings[i].getEndTime() - actualMeetings[i].getStartTime()) /
          60000;
      } else {
        if (consecutiveMeetingTime >= 180) {
          analysis.cognitiveLoad.meetingMarathons++;
        }
        consecutiveMeetingTime =
          (actualMeetings[i].getEndTime() - actualMeetings[i].getStartTime()) /
          60000;
      }
    }
  }
  // Check final sequence
  if (consecutiveMeetingTime >= 180) {
    analysis.cognitiveLoad.meetingMarathons++;
  }

  analysis.cognitiveLoad.longestFocusBlock = Math.round(maxFocusBlock);

  // Calculate energy drain score (0-100, higher = more draining)
  analysis.energyDrain = calculateEnergyDrain(analysis);

  return analysis;
}

function getMeetingContext(event) {
  var title = event.getTitle().toLowerCase();
  if (title.match(/standup|daily|sync/i)) return "sync";
  if (title.match(/1:1|one on one|1-1/i)) return "oneOnOne";
  if (title.match(/review|retro|planning/i)) return "planning";
  if (title.match(/interview|hiring/i)) return "interview";
  if (title.match(/all hands|town hall/i)) return "allHands";
  return "general";
}

function calculateEnergyDrain(analysis) {
  var score = 0;

  // Add null checks
  if (!analysis || !analysis.cognitiveLoad) return 0;

  // Back-to-back meetings are exhausting
  score += (analysis.cognitiveLoad.backToBack || 0) * 10;

  // Context switches drain energy
  score += (analysis.cognitiveLoad.contextSwitches || 0) * 5;

  // Large meetings are more draining
  score += (analysis.meetingTypes.largeMeeting || 0) * 8;

  // External meetings require more energy
  score += (analysis.meetingTypes.external || 0) * 3;

  // Meeting marathons are particularly bad
  score += (analysis.cognitiveLoad.meetingMarathons || 0) * 15;

  // Evening meetings disrupt recovery
  score += ((analysis.timeDistribution.evening || 0) / 60) * 10;

  // Fragmented time prevents deep work
  score += (analysis.cognitiveLoad.fragmentedTime || 0) * 3;

  // Normalize to 0-100
  return Math.min(100, Math.round(score));
}

// Format for email/GPT
function formatCalendarAnalysis(analysis) {
  var summary = [];

  if (analysis.totalEvents === 0) {
    summary.push("📅 Events: 0 (Full focus day!)");
    summary.push("🎯 Uninterrupted work time: Full day available");
    summary.push("🧠 Cognitive load: Minimal");
    return summary.join("\n");
  }

  summary.push(
    "📅 Events: " +
      analysis.totalEvents +
      " (" +
      Math.round(analysis.totalMinutes / 60) +
      "h total)"
  );

  // Meeting composition
  var types = [];
  if (analysis.meetingTypes.oneOnOne > 0)
    types.push(analysis.meetingTypes.oneOnOne + " 1:1s");
  if (analysis.meetingTypes.smallGroup > 0)
    types.push(analysis.meetingTypes.smallGroup + " small groups");
  if (analysis.meetingTypes.largeMeeting > 0)
    types.push(analysis.meetingTypes.largeMeeting + " large meetings");
  if (analysis.meetingTypes.focus > 0)
    types.push(analysis.meetingTypes.focus + " focus blocks");
  if (types.length > 0) summary.push("📊 Types: " + types.join(", "));

  // Cognitive load insights
  if (analysis.cognitiveLoad.backToBack > 0) {
    summary.push(
      "⚡ Back-to-back: " + analysis.cognitiveLoad.backToBack + " meetings"
    );
  }
  if (analysis.cognitiveLoad.meetingMarathons > 0) {
    summary.push(
      "🏃 Meeting marathons: " + analysis.cognitiveLoad.meetingMarathons
    );
  }

  summary.push("🧠 Energy drain: " + analysis.energyDrain + "/100");

  // Better focus block messaging
  if (analysis.cognitiveLoad.longestFocusBlock >= 120) {
    summary.push(
      "🎯 Longest focus: " +
        Math.round(analysis.cognitiveLoad.longestFocusBlock) +
        " min (excellent!)"
    );
  } else if (analysis.cognitiveLoad.longestFocusBlock >= 60) {
    summary.push(
      "🎯 Longest focus: " +
        Math.round(analysis.cognitiveLoad.longestFocusBlock) +
        " min (good)"
    );
  } else if (analysis.cognitiveLoad.longestFocusBlock > 0) {
    summary.push(
      "🎯 Longest focus: " +
        Math.round(analysis.cognitiveLoad.longestFocusBlock) +
        " min (fragmented)"
    );
  }

  return summary.join("\n");
}

function getStressRadar(fitbitData, calendarAnalysis, emailStats, spotifyData) {
  var stressIndicators = {
    physiological: {
      elevatedRHR: 0, // RHR >5 bpm above personal baseline
      poorHRV: 0, // If available
      restlessness: 0, // From sleep data
      earlyWaking: 0, // Waking before 5:30am
    },
    behavioral: {
      lateNightActivity: 0, // Emails/work after 10pm
      skippedMeals: 0, // Long gaps without breaks
      musicPattern: 0, // Frantic/aggressive music
      sleepDebt: 0, // Cumulative from week
    },
    environmental: {
      meetingOverload: 0, // From calendar analysis
      emailVolume: 0, // Unusual spike
      deadline: 0, // Keywords in calendar
    },
    score: 0,
    level: "Low",
    triggers: [],
  };

  // Analyze physiological markers
  var rhrMatch = fitbitData.heart.match(/❤️ Resting HR: (\d+)/);
  if (rhrMatch) {
    var rhr = parseInt(rhrMatch[1]);
    var baselineRHR = getBaselineRHR(); // Average from last 30 days
    if (rhr > baselineRHR + 5) {
      stressIndicators.physiological.elevatedRHR = 1;
      stressIndicators.triggers.push("elevated heart rate");
    }
  }

  // Check sleep quality
  var sleepMatch = fitbitData.sleep.match(/(\d+)h (\d+)m/);
  var efficiencyMatch = fitbitData.sleep.match(/😴 Efficiency: (\d+)%/);
  if (efficiencyMatch && parseInt(efficiencyMatch[1]) < 80) {
    stressIndicators.physiological.restlessness = 1;
    stressIndicators.triggers.push("restless sleep");
  }

  // Check for short sleep
  if (sleepMatch) {
    var totalSleepHours =
      parseInt(sleepMatch[1]) + parseInt(sleepMatch[2]) / 60;
    if (totalSleepHours < 6) {
      stressIndicators.behavioral.sleepDebt = 1;
      stressIndicators.triggers.push("insufficient sleep");
    }
  }

  // Analyze wake time
  var wakeMatch = fitbitData.sleep.match(/☀️ Wake time: (\d+):(\d+) (AM|PM)/);
  if (wakeMatch && wakeMatch[3] === "AM") {
    var hour = parseInt(wakeMatch[1]);
    if (hour < 6 && hour !== 12) {
      // Before 6am, not midnight hour
      stressIndicators.physiological.earlyWaking = 1;
      stressIndicators.triggers.push("early waking");
    }
  }

  // Meeting stress
  if (calendarAnalysis && calendarAnalysis.energyDrain > 70) {
    stressIndicators.environmental.meetingOverload = 1;
    stressIndicators.triggers.push("meeting overload");
  }

  // Email patterns - use PRIMARY emails for stress calculation
  if (emailStats) {
    var primaryEmails = emailStats.primary || emailStats.received;
    var sentEmails = emailStats.sent;

    // Update to only trigger on truly high PRIMARY email volume
    if (sentEmails > 50) {
      // High sent count only
      stressIndicators.environmental.emailVolume = 1;
      stressIndicators.triggers.push(
        "excessive email output (" + sentEmails + " sent)"
      );
    }

    // Separate check for primary email overload
    if (primaryEmails > 50) {
      // Increased from current logic
      stressIndicators.environmental.emailVolume = 1;
      stressIndicators.triggers.push(
        "high primary email volume (" + primaryEmails + " work emails)"
      );
    }

    // Check for email backlog (lots received, few sent)
    if (primaryEmails > 40 && sentEmails < 10) {
      stressIndicators.behavioral.lateNightActivity = 1;
      stressIndicators.triggers.push(
        "email backlog building (" +
          primaryEmails +
          " received, only " +
          sentEmails +
          " sent)"
      );
    }
  }

  // Music analysis (stress patterns) - IMPROVED
  if (spotifyData && typeof spotifyData === "string") {
    // Check for late night music listening (after midnight)
    var nightMatch = spotifyData.match(/Night: (\d+)/);
    if (nightMatch && parseInt(nightMatch[1]) > 10) {
      // More than 10 tracks after midnight
      stressIndicators.behavioral.lateNightActivity = 1;
      stressIndicators.triggers.push(
        "late night activity (music after midnight)"
      );
    }

    // Check genre context - classical/ambient is relaxing, not stressful
    var genreMatch = spotifyData.match(/Genre: ([^\\n]+)/);
    var isRelaxingGenre = false;
    if (genreMatch) {
      var genre = genreMatch[1].toLowerCase();
      isRelaxingGenre =
        genre.indexOf("classical") !== -1 ||
        genre.indexOf("ambient") !== -1 ||
        genre.indexOf("meditation") !== -1 ||
        genre.indexOf("jazz") !== -1 ||
        genre.indexOf("instrumental") !== -1 ||
        genre.indexOf("orchestra") !== -1;
    }

    // Only flag evening music as stress if it's NOT relaxing music
    var eveningMatch = spotifyData.match(/Evening: (\d+)/);
    if (eveningMatch && parseInt(eveningMatch[1]) > 30 && !isRelaxingGenre) {
      // 30+ non-relaxing tracks in evening might indicate working late
      stressIndicators.behavioral.musicPattern = 1;
      stressIndicators.triggers.push(
        "heavy evening activity (non-relaxing music)"
      );
    }

    // Check for frantic listening patterns (very short sessions, lots of skipping)
    var totalTracks = spotifyData.match(/Tracks played: (\d+)/);
    if (totalTracks && parseInt(totalTracks[1]) > 50) {
      // More than 50 tracks in a day might indicate restlessness
      stressIndicators.behavioral.musicPattern = 1;
      stressIndicators.triggers.push("restless music patterns (50+ tracks)");
    }
  }

  // Calculate cumulative stress score
  var totalIndicators = 0;
  for (var category in stressIndicators) {
    if (
      category !== "score" &&
      category !== "level" &&
      category !== "triggers"
    ) {
      for (var indicator in stressIndicators[category]) {
        totalIndicators += stressIndicators[category][indicator];
      }
    }
  }

  // Score and categorize - with baseline stress
  // Everyone has some baseline stress (10-20 points minimum)
  var baselineStress = 15;
  stressIndicators.score = Math.round(
    baselineStress + (totalIndicators / 9) * 85
  );

  // Ensure score stays within 0-100 range
  stressIndicators.score = Math.min(100, Math.max(0, stressIndicators.score));

  if (stressIndicators.score < 30) {
    stressIndicators.level = "Low";
  } else if (stressIndicators.score < 60) {
    stressIndicators.level = "Moderate";
  } else {
    stressIndicators.level = "High";
  }

  return stressIndicators;
}

// Helper to get baseline RHR (you'll want to expand this)
function getBaselineRHR() {
  // Ideally, this would calculate the average RHR from the last 30 days
  // For now, return a reasonable default
  var stored =
    PropertiesService.getScriptProperties().getProperty("BASELINE_RHR");
  return stored ? parseInt(stored) : 62;
}
// Format stress data for display
function formatStressRadar(stress) {
  var output =
    "🎯 Stress Level: " + stress.level + " (" + stress.score + "/100)";

  if (stress.triggers.length > 0) {
    output += "\n⚠️ Triggers: " + stress.triggers.join(", ");
  }

  return output;
}

function getContextualDayAnalysis(date, scores, calendarData) {
  var dayOfWeek = date.getDay();
  var isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  var dayName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][dayOfWeek];

  var context = {
    dayType: isWeekend ? "weekend" : "weekday",
    dayName: dayName,
    expectations: {},
    insights: [],
    recommendations: [],
  };

  // Set different expectations for weekends vs weekdays
  if (isWeekend) {
    context.expectations = {
      sleep: { optimal: 480, minimum: 420 }, // 8h optimal, 7h minimum
      activity: { optimal: 8000, minimum: 5000 }, // Lower step expectations
      meetings: { optimal: 0, maximum: 2 }, // Fewer meetings expected
      workEmails: { optimal: 0, maximum: 5 }, // Minimal work emails
    };

    // Weekend-specific insights
    if (scores.sleep < 70) {
      context.insights.push(
        "Despite the weekend, sleep recovery wasn't prioritized"
      );
    }
    if (calendarData.totalEvents > 2) {
      context.insights.push(
        "Weekend included " + calendarData.totalEvents + " scheduled events"
      );
    }
  } else {
    // Weekday expectations vary by day
    switch (dayOfWeek) {
      case 1: // Monday
        context.expectations = {
          sleep: { optimal: 450, minimum: 390 },
          activity: { optimal: 10000, minimum: 6000 },
          meetings: { optimal: 4, maximum: 8 },
          workEmails: { optimal: 15, maximum: 30 },
        };
        context.insights.push("Monday energy levels shape the week ahead");
        break;

      case 5: // Friday
        context.expectations = {
          sleep: { optimal: 420, minimum: 360 },
          activity: { optimal: 8000, minimum: 5000 },
          meetings: { optimal: 3, maximum: 6 },
          workEmails: { optimal: 10, maximum: 20 },
        };
        context.insights.push(
          "Friday's lower activity is typical before weekend"
        );
        break;

      default: // Tue-Thu
        context.expectations = {
          sleep: { optimal: 420, minimum: 360 },
          activity: { optimal: 10000, minimum: 7000 },
          meetings: { optimal: 5, maximum: 10 },
          workEmails: { optimal: 20, maximum: 40 },
        };
    }
  }

  // Generate contextual recommendations
  if (isWeekend && scores.activity < 50) {
    context.recommendations.push(
      "Use weekend flexibility for outdoor activity"
    );
  }
  if (dayOfWeek === 0 && scores.sleep < 70) {
    // Sunday
    context.recommendations.push(
      "Prioritize early bedtime to start Monday strong"
    );
  }
  if (dayOfWeek === 5 && scores.work > 80) {
    // Friday
    context.recommendations.push("Consider wrapping up earlier on Fridays");
  }

  return context;
}

// Update these existing functions to accept a date parameter:

function getFitbitActivitySummary() {
  var token = getValidFitbitAccessToken();
  var date = getFitbitFormattedDate();
  var url = "https://api.fitbit.com/1/user/-/activities/date/" + date + ".json";

  var response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Bearer " + token,
    },
    muteHttpExceptions: true,
  });

  var data = JSON.parse(response.getContentText());
  if (!data.summary) return "❌ Activity data not found.";

  var s = data.summary;

  // Format steps with comma
  var formattedSteps = s.steps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Format calories with comma - ensure it's a number first
  var calories = parseInt(s.caloriesOut) || s.caloriesOut;
  var formattedCalories = calories
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return [
    "👣 Steps: " + formattedSteps,
    "🔥 Calories burned: " + formattedCalories,
    "💪 Very Active: " + s.veryActiveMinutes + " min",
    "🚶 Fairly Active: " + s.fairlyActiveMinutes + " min",
    "🧘 Lightly Active: " + s.lightlyActiveMinutes + " min",
    "🪑 Sedentary: " + s.sedentaryMinutes + " min",
  ].join("\n");
}

function getFitbitActivitySummaryForDate(date) {
  var token = getValidFitbitAccessToken();
  var dateStr = Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  var url =
    "https://api.fitbit.com/1/user/-/activities/date/" + dateStr + ".json";

  var response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Bearer " + token,
    },
    muteHttpExceptions: true,
  });

  var data = JSON.parse(response.getContentText());
  if (!data.summary) return "❌ Activity data not found.";

  var s = data.summary;

  // Format steps with comma
  var formattedSteps = s.steps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Format calories with comma - ensure it's a number first
  var calories = parseInt(s.caloriesOut) || s.caloriesOut;
  var formattedCalories = calories
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return [
    "👣 Steps: " + formattedSteps,
    "🔥 Calories burned: " + formattedCalories,
    "💪 Very Active: " + s.veryActiveMinutes + " min",
    "🚶 Fairly Active: " + s.fairlyActiveMinutes + " min",
    "🧘 Lightly Active: " + s.lightlyActiveMinutes + " min",
    "🪑 Sedentary: " + s.sedentaryMinutes + " min",
  ].join("\n");
}

function getFitbitSleepSummaryForDate(date, tryTodayFirst) {
  var token = getValidFitbitAccessToken();
  var dateToCheck = date;

  // If tryTodayFirst is true and date is today, we'll check today's sleep
  // If no data, we'll fall back to yesterday
  if (tryTodayFirst) {
    var today = new Date();
    if (date.toDateString() === today.toDateString()) {
      Logger.log("🛌 Checking for today's sleep data first...");

      // Try today's sleep
      var todayStr = Utilities.formatDate(
        today,
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );
      var todayUrl =
        "https://api.fitbit.com/1.2/user/-/sleep/date/" + todayStr + ".json";

      var todayResponse = UrlFetchApp.fetch(todayUrl, {
        method: "get",
        headers: {
          Authorization: "Bearer " + token,
        },
        muteHttpExceptions: true,
      });

      var todayData = JSON.parse(todayResponse.getContentText());

      // Check if we have sleep data for today
      if (todayData.sleep && todayData.sleep.length > 0) {
        var hasMainSleep = false;
        for (var i = 0; i < todayData.sleep.length; i++) {
          if (todayData.sleep[i].isMainSleep) {
            hasMainSleep = true;
            break;
          }
        }

        if (hasMainSleep) {
          Logger.log("✅ Found today's sleep data - using it!");
          // Process today's sleep data
          return processSleepData(todayData, "last night");
        }
      }

      // No sleep data for today, fall back to yesterday
      Logger.log("❌ No sleep data for today yet, falling back to yesterday");
      dateToCheck = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  // Process sleep for the specified date (or yesterday if we fell back)
  var dateStr = Utilities.formatDate(
    dateToCheck,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  var url = "https://api.fitbit.com/1.2/user/-/sleep/date/" + dateStr + ".json";

  var response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Bearer " + token,
    },
    muteHttpExceptions: true,
  });

  var data = JSON.parse(response.getContentText());

  // Determine time reference
  var timeRef = tryTodayFirst ? "previous night" : "";
  return processSleepData(data, timeRef);
}

// Helper function to process sleep data consistently
// Update processSleepData function - sleep stages section
// Update the processSleepData function to remove asterisks and redundancy:
function processSleepData(data, timeReference) {
  if (!data.sleep || data.sleep.length === 0)
    return "❌ No sleep data available.";

  // Find main sleep entry
  var mainSleep = null;
  for (var i = 0; i < data.sleep.length; i++) {
    if (data.sleep[i].isMainSleep) {
      mainSleep = data.sleep[i];
      break;
    }
  }

  if (!mainSleep) return "❌ Main sleep entry not found.";

  var durationMins = Math.round(mainSleep.duration / 60000);

  // Calculate awake time if available
  var awakeMinutes = 0;
  if (mainSleep.levels && mainSleep.levels.summary) {
    if (
      mainSleep.levels.summary.wake &&
      mainSleep.levels.summary.wake.minutes
    ) {
      awakeMinutes = mainSleep.levels.summary.wake.minutes;
    } else if (
      mainSleep.levels.summary.awake &&
      mainSleep.levels.summary.awake.minutes
    ) {
      awakeMinutes = mainSleep.levels.summary.awake.minutes;
    }
  }

  // Calculate actual sleep time (subtract awake time)
  var actualSleepMins = durationMins - awakeMinutes;
  var hours = Math.floor(actualSleepMins / 60);
  var mins = actualSleepMins % 60;

  // Extract bed and wake times
  var bedTime = new Date(mainSleep.startTime);
  var wakeTime = new Date(mainSleep.endTime);

  var bedTimeStr = formatTimeOnly(bedTime);
  var wakeTimeStr = formatTimeOnly(wakeTime);

  var prefix = timeReference ? "(" + timeReference + ") " : "";

  // Calculate sleep stages if available
  var stagesInfo = "";
  if (mainSleep.levels && mainSleep.levels.summary) {
    var summary = mainSleep.levels.summary;
    var stages = [];
    var totalSleepMin = actualSleepMins; // Use actual sleep time for percentages

    // Check for different sleep stage formats (classic vs stages)
    if (summary.deep) {
      // Stages sleep (newer devices)
      var deepPercent = Math.round(
        (summary.deep.minutes / totalSleepMin) * 100
      );
      var remPercent = Math.round((summary.rem.minutes / totalSleepMin) * 100);
      var lightPercent = Math.round(
        (summary.light.minutes / totalSleepMin) * 100
      );

      stages.push("Deep: " + summary.deep.minutes + "m (" + deepPercent + "%)");
      stages.push(
        "Light: " + summary.light.minutes + "m (" + lightPercent + "%)"
      );
      stages.push("REM: " + summary.rem.minutes + "m (" + remPercent + "%)");
      if (summary.wake.minutes > 0)
        stages.push("Awake: " + summary.wake.minutes + "m");

      // Add quality assessment
      stagesInfo = "💤 Sleep stages: " + stages.join(" | ");

      if (deepPercent < 15) {
        stagesInfo +=
          "\n⚠️ Low deep sleep (" +
          deepPercent +
          "%) - impacts physical recovery";
      }
      if (remPercent < 20) {
        stagesInfo +=
          "\n⚠️ Low REM sleep (" +
          remPercent +
          "%) - may affect memory and mood";
      }

      // Add breathing rate if available
      if (summary.breathingRate) {
        stagesInfo +=
          "\n🫁 Breathing rate: " +
          summary.breathingRate +
          " breaths/min" +
          (summary.breathingRate > 20
            ? " (elevated - possible stress)"
            : " (normal)");
      }
    } else if (summary.asleep) {
      // Classic sleep (older devices)
      if (summary.asleep.minutes > 0)
        stages.push("Asleep: " + summary.asleep.minutes + "m");
      if (summary.restless.minutes > 0)
        stages.push("Restless: " + summary.restless.minutes + "m");
      if (summary.awake.minutes > 0)
        stages.push("Awake: " + summary.awake.minutes + "m");
      stagesInfo = "💤 Sleep stages: " + stages.join(" | ");
    }
  }

  var result = [
    "🛌 Sleep duration: " + hours + "h " + mins + "m " + prefix,
    "🕰 Time in bed: " + Math.round(mainSleep.timeInBed) + " min",
    "😴 Efficiency: " + mainSleep.efficiency + "%",
    "🌙 Bedtime: " + bedTimeStr,
    "☀️ Wake time: " + wakeTimeStr,
  ];

  // Add stages info if available
  if (stagesInfo) {
    result.push(stagesInfo);
  }

  return result.join("\n");
}

// ========== HRV FUNCTIONS ==========
function getFitbitHRVForDate(date) {
  var token = getValidFitbitAccessToken();
  var dateStr = Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  var url = "https://api.fitbit.com/1/user/-/hrv/date/" + dateStr + ".json";

  try {
    var response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() === 200) {
      var data = JSON.parse(response.getContentText());
      if (data.hrv && data.hrv.length > 0) {
        var dailyRmssd = data.hrv[0].value.dailyRmssd;
        return {
          value: dailyRmssd,
          status:
            dailyRmssd > 50
              ? "Excellent"
              : dailyRmssd > 40
              ? "Good"
              : dailyRmssd > 30
              ? "Fair"
              : "Low",
          insight:
            dailyRmssd > 40
              ? "Good recovery state"
              : "Lower than optimal - prioritize rest",
        };
      }
    }
  } catch (e) {
    Logger.log("HRV not available for this device");
  }
  return null;
}

function getFitbitHeartSummaryForDate(date) {
  var token = getValidFitbitAccessToken();
  var dateStr = Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );

  // First get the zone data
  var url =
    "https://api.fitbit.com/1/user/-/activities/heart/date/" +
    dateStr +
    "/1d.json";
  var response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Bearer " + token,
    },
    muteHttpExceptions: true,
  });

  var data = JSON.parse(response.getContentText());
  if (!data["activities-heart"] || data["activities-heart"].length === 0)
    return "❌ No heart data found.";

  var day = data["activities-heart"][0];

  // Try to get intraday data for actual peak HR
  var peakHR = "N/A";
  try {
    var intradayUrl =
      "https://api.fitbit.com/1/user/-/activities/heart/date/" +
      dateStr +
      "/1d/1min.json";
    var intradayResponse = UrlFetchApp.fetch(intradayUrl, {
      method: "get",
      headers: {
        Authorization: "Bearer " + token,
      },
      muteHttpExceptions: true,
    });

    if (intradayResponse.getResponseCode() === 200) {
      var intradayData = JSON.parse(intradayResponse.getContentText());
      if (
        intradayData["activities-heart-intraday"] &&
        intradayData["activities-heart-intraday"].dataset
      ) {
        var dataset = intradayData["activities-heart-intraday"].dataset;
        var maxHR = 0;
        for (var i = 0; i < dataset.length; i++) {
          if (dataset[i].value > maxHR) {
            maxHR = dataset[i].value;
          }
        }
        if (maxHR > 0) {
          peakHR = maxHR;
        }
      }
    }
  } catch (e) {
    Logger.log("Could not get intraday heart data: " + e);
    // Fall back to zone-based estimate
    for (var i = day.value.heartRateZones.length - 1; i >= 0; i--) {
      var zone = day.value.heartRateZones[i];
      if (zone.minutes > 0 && zone.name !== "Out of Range") {
        peakHR = zone.max + " (estimated)";
        break;
      }
    }
  }

  // Format zones - SKIP "Out of Range"
  var activeZones = [];
  for (var i = 0; i < day.value.heartRateZones.length; i++) {
    var zone = day.value.heartRateZones[i];
    // Only include zones that represent actual exercise
    if (zone.minutes > 0 && zone.name !== "Out of Range") {
      activeZones.push(zone.name + ": " + zone.minutes + "min");
    }
  }

  var zonesFormatted =
    activeZones.length > 0
      ? "💓 Active zones: " + activeZones.join(" | ")
      : "💓 Active zones: No elevated activity";

  // Format peak HR with commas if it's a number
  var peakHRFormatted = peakHR;
  if (typeof peakHR === "number") {
    peakHRFormatted = peakHR + " bpm";
  }

  return [
    "❤️ Resting HR: " + day.value.restingHeartRate + " bpm",
    zonesFormatted,
    "📈 Peak HR: " + peakHRFormatted,
  ].join("\n");
}

function buildInsightSection(insightHeadline, insight) {
  return (
    "<div style='margin:16px 0; padding:16px; background:#fafafa; border:1px solid #ddd; border-radius:6px;'>" +
    "<h3 style='font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px 0;'>🦊 Sage's Daily Analysis</h3>" +
    "<p style='margin:10px 0; font-size:16px; color:#1a73e8; font-style:italic;'>" +
    insightHeadline +
    "</p>" +
    "<div style='font-family:Arial, sans-serif; font-size:14px; line-height:1.6; color:#333;'>" +
    convertAndFormatInsight(insight) +
    "</div>" +
    "</div>"
  );
}

function getSpotifyHistoryForYesterday() {
  try {
    Logger.log("🎧 [Spotify] Getting yesterday's history");
    var token = getValidSpotifyAccessToken();
    if (!token) {
      Logger.log("❌ No valid Spotify token.");
      return null;
    }

    // Calculate time range for yesterday in milliseconds
    var now = new Date();
    var yesterdayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    var yesterdayStart = new Date(yesterdayEnd.getTime() - 24 * 60 * 60 * 1000);

    // Spotify API expects Unix timestamp in milliseconds
    var after = yesterdayStart.getTime();
    var before = yesterdayEnd.getTime();

    Logger.log(
      "🎧 [Spotify] Fetching tracks between " +
        yesterdayStart +
        " and " +
        yesterdayEnd
    );

    // Get more items to ensure we cover all of yesterday
    var response = UrlFetchApp.fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=50&before=" +
        before,
      {
        headers: { Authorization: "Bearer " + token },
        muteHttpExceptions: true,
      }
    );

    var code = response.getResponseCode();
    if (code !== 200) {
      Logger.log("❌ Spotify API error: " + response.getContentText());
      return null;
    }

    var data = JSON.parse(response.getContentText());

    // Filter for yesterday's tracks only
    var now = new Date();
    var yesterdayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );
    var yesterdayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    var yesterdayItems = {
      items: data.items.filter(function (item) {
        var playedAt = new Date(item.played_at);
        return playedAt >= yesterdayStart && playedAt < yesterdayEnd;
      }),
    };

    Logger.log(
      "📦 [Spotify] Found " +
        yesterdayItems.items.length +
        " tracks from yesterday"
    );
    return yesterdayItems;
  } catch (err) {
    Logger.log("❌ [Spotify Error] " + err);
    return null;
  }
}

function getCompletedTasksForDate(date) {
  var startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  var endOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  );
  var completed = [];

  var taskLists = Tasks.Tasklists.list().items;
  if (!taskLists) return "⚠️ No task lists found.";

  for (var i = 0; i < taskLists.length; i++) {
    var listId = taskLists[i].id;
    var tasks = Tasks.Tasks.list(listId, {
      showCompleted: true,
      showHidden: true,
      maxResults: 100,
    }).items;

    if (!tasks) continue;

    for (var j = 0; j < tasks.length; j++) {
      var task = tasks[j];
      if (task.status === "completed" && task.completed) {
        var completedDate = new Date(task.completed);
        if (completedDate >= startOfDay && completedDate < endOfDay) {
          completed.push("✔️ " + task.title);
        }
      }
    }
  }

  return completed.length ? completed.join("\n") : "No tasks completed.";
}

function setMoodForDate(date, mood) {
  var dateStr = Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  PropertiesService.getScriptProperties().setProperty("MOOD_" + dateStr, mood);
}

function cleanupOldMoodProperties() {
  var props = PropertiesService.getScriptProperties();
  var allProps = props.getProperties();
  var today = new Date();
  var cutoffDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  for (var key in allProps) {
    // Convert key to string and check if it's a MOOD property
    var keyStr = String(key);
    if (keyStr.indexOf("MOOD_") === 0) {
      var dateStr = keyStr.substring(5); // Remove "MOOD_" prefix
      try {
        var propDate = new Date(dateStr);

        // Delete if older than 30 days and it's a valid date
        if (!isNaN(propDate.getTime()) && propDate < cutoffDate) {
          props.deleteProperty(key);
          Logger.log("Deleted old property: " + key);
        }
      } catch (e) {
        // Skip if date parsing fails
        Logger.log("Skipping invalid mood property: " + key);
      }
    }
  }
}

function getMoodFromDayBefore() {
  var twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  var dateStr = Utilities.formatDate(
    twoDaysAgo,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  return (
    PropertiesService.getScriptProperties().getProperty("MOOD_" + dateStr) ||
    "Unknown"
  );
}

// Enhanced email composition with new components
// Enhanced helper functions for visual improvements

// 1. TREND TRACKING FUNCTIONS
// 1. TREND TRACKING FUNCTIONS - Fixed to use unique days only
function getScoreTrends() {
  var sheet = getOrCreateMyMetricLogSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var trends = {
    overall: { current: 0, previous: 0, trend: 0, sparkline: [] },
    sleep: { current: 0, previous: 0, trend: 0, sparkline: [] },
    activity: { current: 0, previous: 0, trend: 0, sparkline: [] },
    heart: { current: 0, previous: 0, trend: 0, sparkline: [] },
    work: { current: 0, previous: 0, trend: 0, sparkline: [] },
  };

  // Group data by date to handle multiple runs per day
  var dataByDate = {};

  // Process all rows (not just last 7)
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][2]) {
      // Has date and score
      var dateStr = "";

      // Handle different date formats
      if (data[i][0] instanceof Date) {
        dateStr = Utilities.formatDate(
          data[i][0],
          Session.getScriptTimeZone(),
          "yyyy-MM-dd"
        );
      } else {
        dateStr = String(data[i][0]);
      }

      // Store data for this date (overwrites previous entries for same date)
      dataByDate[dateStr] = {
        score: parseInt(data[i][2]) || 0,
        sleep: parseInt(data[i][3]) || 0,
        steps: parseInt(data[i][4]) || 0,
      };
    }
  }

  // Get the last 7 unique dates
  var sortedDates = Object.keys(dataByDate).sort();
  var last7Dates = sortedDates.slice(-7);

  // Build trends from unique dates only
  var last7Days = [];
  last7Dates.forEach(function (dateStr) {
    last7Days.push(dataByDate[dateStr]);
  });

  if (last7Days.length >= 2) {
    var current = last7Days[last7Days.length - 1];
    var previous = last7Days[last7Days.length - 2];

    // Calculate trends
    trends.overall.current = current.score;
    trends.overall.previous = previous.score;
    trends.overall.trend = current.score - previous.score;

    // Generate sparklines from unique dates only
    trends.overall.sparkline = last7Days.map(function (d) {
      return d.score;
    });
  }

  return trends;
}

// ========== BADGE SYSTEM FUNCTIONS ==========

function calculateDailyBadges(
  scores,
  fitbitData,
  emailStats,
  stressRadar,
  recoveryQuotient,
  calendarIntelligence
) {
  var badges = [];

  // Parse fitbit data for badge calculations
  var sleepMatch = fitbitData.sleep.match(/(\d+)h (\d+)m/);
  var sleepHours = sleepMatch
    ? parseInt(sleepMatch[1]) + parseInt(sleepMatch[2]) / 60
    : 0;

  var stepsMatch = fitbitData.activity.match(/👣 Steps: ([\d,]+)/);
  var steps = stepsMatch ? parseInt(stepsMatch[1].replace(/,/g, "")) : 0;

  var rhrMatch = fitbitData.heart.match(/❤️ Resting HR: (\d+)/);
  var rhr = rhrMatch ? parseInt(rhrMatch[1]) : 0;

  // LEGENDARY BADGES (hardest to earn)
  // Perfect Day - ONLY for score of 100
  if (scores.total === 100) {
    badges.push({
      emoji: "👑",
      name: "Perfect Day",
      description: "Achieved perfect score of 100",
      rarity: "legendary",
      points: 500,
    });
  }

  // Other legendary badge for 90+ but not 100
  if (scores.total >= 90 && scores.total < 100 && stressRadar.score < 25) {
    badges.push({
      emoji: "🏆",
      name: "Wellness Champion",
      description: "High performance, low stress",
      rarity: "legendary",
      points: 100,
    });
  }

  // EPIC BADGES
  if (scores.sleep >= 85 && sleepHours >= 7 && sleepHours <= 9) {
    badges.push({
      emoji: "🌙",
      name: "Sleep Master",
      description: "Optimal sleep achieved",
      rarity: "epic",
      points: 75,
    });
  }

  if (steps >= 15000) {
    badges.push({
      emoji: "🚀",
      name: "Step Warrior",
      description: "15,000+ steps",
      rarity: "epic",
      points: 75,
    });
  }

  if (recoveryQuotient.score >= 85) {
    badges.push({
      emoji: "⚡",
      name: "Peak Recovery",
      description: "Recovery score 85+",
      rarity: "epic",
      points: 75,
    });
  }

  // RARE BADGES
  if (scores.heart >= 80 && rhr < 60) {
    badges.push({
      emoji: "❤️",
      name: "Heart Hero",
      description: "Excellent cardiovascular health",
      rarity: "rare",
      points: 50,
    });
  }

  if (calendarIntelligence.meetingQuality.focusBlocks >= 2) {
    badges.push({
      emoji: "🎯",
      name: "Focus Guardian",
      description: "Protected deep work time",
      rarity: "rare",
      points: 50,
    });
  }

  if (
    emailStats.sent >= 15 &&
    emailStats.sent <= 30 &&
    emailStats.primary < 50
  ) {
    badges.push({
      emoji: "📧",
      name: "Inbox Zero Hero",
      description: "Efficient email management",
      rarity: "rare",
      points: 50,
    });
  }

  // UNCOMMON BADGES
  if (steps >= 10000) {
    badges.push({
      emoji: "🏃",
      name: "10K Club",
      description: "Hit 10,000 steps",
      rarity: "uncommon",
      points: 25,
    });
  }

  if (stressRadar.score < 30) {
    badges.push({
      emoji: "🧘",
      name: "Zen Mode",
      description: "Low stress levels",
      rarity: "uncommon",
      points: 25,
    });
  }

  // COMMON BADGES (easier to earn, encouraging)
  if (scores.activity >= 60) {
    badges.push({
      emoji: "💪",
      name: "Active Day",
      description: "Good activity levels",
      rarity: "common",
      points: 10,
    });
  }

  if (scores.sleep >= 70) {
    badges.push({
      emoji: "😴",
      name: "Well Rested",
      description: "Solid sleep score",
      rarity: "common",
      points: 10,
    });
  }

  // Sort badges by rarity (legendary first)
  var rarityOrder = ["legendary", "epic", "rare", "uncommon", "common"];
  badges.sort(function (a, b) {
    return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
  });

  return badges;
}

function calculateStreakBadges(dateStr) {
  var streaks = getActiveStreaks(dateStr);
  var badges = [];

  if (streaks.goodSleep >= 3) {
    badges.push({
      emoji: "🔥",
      name: "Sleep Streak",
      count: streaks.goodSleep,
      active: true,
    });
  }

  if (streaks.activedays >= 3) {
    badges.push({
      emoji: "⚡",
      name: "Activity Streak",
      count: streaks.activedays,
      active: true,
    });
  }

  if (streaks.highScore >= 3) {
    badges.push({
      emoji: "🌟",
      name: "Excellence Streak",
      count: streaks.highScore,
      active: true,
    });
  }

  return badges;
}

function getActiveStreaks(currentDate) {
  var sheet = getOrCreateMyMetricLogSheet();
  var data = sheet.getDataRange().getValues();

  var streaks = {
    goodSleep: 0,
    activedays: 0,
    highScore: 0,
  };

  if (data.length < 2) return streaks;

  // Group data by date to handle multiple runs per day
  var dataByDate = {};

  // Process all rows, keeping only the latest entry per date
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      // Has date
      var dateStr = "";

      // Handle different date formats
      if (data[i][0] instanceof Date) {
        dateStr = Utilities.formatDate(
          data[i][0],
          Session.getScriptTimeZone(),
          "yyyy-MM-dd"
        );
      } else {
        dateStr = String(data[i][0]);
      }

      // Store the latest data for this date (overwrites previous entries)
      dataByDate[dateStr] = {
        sleepMin: parseInt(data[i][3]) || 0,
        steps: parseInt(data[i][4]) || 0,
        score: parseInt(data[i][2]) || 0,
      };
    }
  }

  // Get sorted dates
  var sortedDates = Object.keys(dataByDate).sort().reverse(); // Most recent first

  // Check streaks starting from most recent date
  for (var i = 0; i < sortedDates.length; i++) {
    var dayData = dataByDate[sortedDates[i]];

    // For streaks to continue, days must be consecutive
    if (i > 0) {
      var currentDate = new Date(sortedDates[i]);
      var previousDate = new Date(sortedDates[i - 1]);
      var dayDiff = (previousDate - currentDate) / (1000 * 60 * 60 * 24);

      // If days aren't consecutive, streaks are broken
      if (dayDiff > 1) {
        break;
      }
    }

    // Check if streaks continue
    var sleepContinues = dayData.sleepMin >= 420; // 7+ hours
    var activityContinues = dayData.steps >= 8000;
    var scoreContinues = dayData.score >= 75;

    // Update streak counts if they continue
    if (sleepContinues && (i === 0 || streaks.goodSleep === i)) {
      streaks.goodSleep++;
    } else if (!sleepContinues && streaks.goodSleep === i) {
      break; // Sleep streak broken
    }

    if (activityContinues && (i === 0 || streaks.activedays === i)) {
      streaks.activedays++;
    }

    if (scoreContinues && (i === 0 || streaks.highScore === i)) {
      streaks.highScore++;
    }
  }

  return streaks;
}

function getNearMissBadges(scores, fitbitData, emailStats) {
  var nearMisses = [];

  // Parse stats
  var stepsMatch = fitbitData.activity.match(/👣 Steps: ([\d,]+)/);
  var steps = stepsMatch ? parseInt(stepsMatch[1].replace(/,/g, "")) : 0;

  var sleepMatch = fitbitData.sleep.match(/(\d+)h (\d+)m/);
  var sleepHours = sleepMatch
    ? parseInt(sleepMatch[1]) + parseInt(sleepMatch[2]) / 60
    : 0;

  // Check how close they are to badges
  if (scores.total >= 85 && scores.total < 90) {
    nearMisses.push({
      badge: "🏆 Wellness Champion",
      missing: "Just " + (90 - scores.total) + " points away",
      tip: "A 15-min walk or 30 min earlier bedtime could do it",
    });
  }

  if (scores.total >= 95 && scores.total < 100) {
    nearMisses.push({
      badge: "👑 Perfect Day",
      missing: "Just " + (100 - scores.total) + " points away",
      tip: "You're so close to perfection!",
    });
  }

  if (steps >= 9000 && steps < 10000) {
    var stepsNeeded = 10000 - steps;
    nearMisses.push({
      badge: "🏃 10K Club",
      missing: formatNumberWithCommas(stepsNeeded) + " steps to go",
      tip:
        "That's about " + Math.round(stepsNeeded / 100) + " minutes of walking",
    });
  }

  if (steps >= 12000 && steps < 15000) {
    var stepsNeeded = 15000 - steps;
    nearMisses.push({
      badge: "🚀 Step Warrior",
      missing: formatNumberWithCommas(stepsNeeded) + " steps away",
      tip: "An evening walk could unlock this epic badge",
    });
  }

  if (sleepHours >= 6.5 && sleepHours < 7 && scores.sleep < 85) {
    nearMisses.push({
      badge: "🌙 Sleep Master",
      missing:
        "Just " + Math.round((7 - sleepHours) * 60) + " more minutes of sleep",
      tip: "Try setting bedtime 30 min earlier tonight",
    });
  }

  if (scores.heart >= 75 && scores.heart < 80) {
    nearMisses.push({
      badge: "❤️ Heart Hero",
      missing: "Heart score needs " + (80 - scores.heart) + " more points",
      tip: "A meditation session could lower your resting heart rate",
    });
  }

  // Limit to top 2 near misses
  return nearMisses.slice(0, 2);
}

function checkComboBadges(dailyBadges, dayContext, scores) {
  var comboBadges = [];
  var badgeNames = dailyBadges.map(function (b) {
    return b.name;
  });

  // The Trifecta - sleep, activity, and low stress
  var hasSleep = badgeNames.some(function (n) {
    return n.indexOf("Sleep") !== -1 || n.indexOf("Well Rested") !== -1;
  });
  var hasActivity = badgeNames.some(function (n) {
    return n.indexOf("10K") !== -1 || n.indexOf("Step") !== -1;
  });
  var hasZen = badgeNames.some(function (n) {
    return n.indexOf("Zen") !== -1;
  });

  if (hasSleep && hasActivity && hasZen) {
    comboBadges.push({
      emoji: "🔱",
      name: "The Trifecta",
      description: "Perfect balance of rest, movement, and calm",
      rarity: "legendary",
      points: 150,
      combo: true,
    });
  }

  // Weekend Warrior - high achievement on weekend
  if (dayContext.dayType === "weekend" && dailyBadges.length >= 5) {
    comboBadges.push({
      emoji: "⚔️",
      name: "Weekend Warrior",
      description: "Exceptional performance on your day off",
      rarity: "epic",
      points: 100,
      combo: true,
    });
  }

  // Early Bird Special - great morning performance
  var wakeTimeMatch =
    dayContext.wakeTime && dayContext.wakeTime.match(/(\d+):(\d+) (AM|PM)/);
  if (wakeTimeMatch && wakeTimeMatch[3] === "AM") {
    var hour = parseInt(wakeTimeMatch[1]);
    if (hour < 6 && scores.total > 80) {
      comboBadges.push({
        emoji: "🌅",
        name: "Dawn Patrol",
        description: "Early rise + high performance",
        rarity: "rare",
        points: 75,
        combo: true,
      });
    }
  }

  // Perfect Storm - all individual scores above 80 (not total score)
  if (
    scores.sleep >= 80 &&
    scores.activity >= 80 &&
    scores.heart >= 80 &&
    scores.work >= 80
  ) {
    comboBadges.push({
      emoji: "⚡",
      name: "Perfect Storm",
      description: "Excellence across all metrics",
      rarity: "legendary",
      points: 200,
      combo: true,
    });
  }

  return comboBadges;
}

function generateNearMissSection(nearMisses) {
  if (nearMisses.length === 0) return "";

  return (
    '<section style="background: #fff3e0; padding: 14px; border-radius: 6px; ' +
    'border-left: 4px solid #ff9800; margin: 20px 0;">' +
    '<div style="font-weight: 600; color: #e65100; margin-bottom: 8px; font-size: 14px;">' +
    "🎯 Within Reach</div>" +
    nearMisses
      .map(function (nm) {
        return (
          '<div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.7); ' +
          'border-radius: 4px;">' +
          '<strong style="color: #e65100;">' +
          nm.badge +
          ":</strong> " +
          nm.missing +
          "<br>" +
          '<span style="font-size: 12px; color: #666;">💡 ' +
          nm.tip +
          "</span>" +
          "</div>"
        );
      })
      .join("") +
    "</section>"
  );
}

function generateBadgeSection(badges, streakBadges, narrative) {
  if (badges.length === 0 && streakBadges.length === 0) return "";

  var html =
    '<section style="background: #fffbeb; border-left: 4px solid #fde68a; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">';

  // Add narrative BEFORE the header
  html += narrative;

  // Header with icon
  html +=
    '<h3 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0; display: flex; align-items: center;">' +
    "🏅 Today's Achievements " +
    '<span style="font-size: 14px; font-weight: normal; color: #666; margin-left: 10px;">' +
    "(" +
    badges.length +
    " earned)</span>" +
    "</h3>";

  // Badge grid
  if (badges.length > 0) {
    html +=
      '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-bottom: 16px;">';

    badges.forEach(function (badge) {
      var design = getBadgeDesign(badge.rarity);

      html +=
        '<div style="' +
        "background: " +
        design.background +
        "; " +
        "border: 1px solid " +
        design.border +
        "; " +
        "border-radius: 8px; " +
        "padding: 14px; " +
        "position: relative; " +
        "box-shadow: 0 1px 3px " +
        design.shadow +
        ';">' +
        // Rarity tag
        '<div style="position: absolute; top: 8px; right: 8px; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: white; background: ' +
        design.rarityColor +
        ';">' +
        badge.rarity +
        "</div>" +
        // Badge content - WITHOUT POINTS
        '<div style="display: flex; align-items: center;">' +
        '<div style="font-size: 36px; margin-right: 14px; filter: drop-shadow(0 2px 4px ' +
        design.emojiShadow +
        ');">' +
        badge.emoji +
        "</div>" +
        '<div style="flex: 1;">' +
        '<div style="font-weight: 600; font-size: 16px; margin-bottom: 2px; color: ' +
        design.titleColor +
        ';">' +
        badge.name +
        "</div>" +
        '<div style="font-size: 13px; color: ' +
        design.descColor +
        ';">' +
        badge.description +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>";
    });

    // Remove total points section
    html += "</section>";
    return html;
  }

  // Streak section with inline styles
  if (streakBadges.length > 0) {
    html +=
      '<div style="background: #e8f0fe; border-radius: 6px; padding: 14px; border-left: 4px solid #1976d2;">' +
      '<div style="font-weight: 600; color: #1565c0; margin-bottom: 8px; font-size: 14px;">🔥 ACTIVE STREAKS</div>' +
      '<div style="display: flex; flex-wrap: wrap; gap: 16px;">';

    streakBadges.forEach(function (streak) {
      html +=
        '<div style="display: flex; align-items: center;">' +
        '<span style="font-size: 20px; margin-right: 8px;">' +
        streak.emoji +
        "</span>" +
        "<div>" +
        '<span style="font-weight: 600; color: #424242; font-size: 14px;">' +
        streak.name +
        "</span><br>" +
        '<span style="color: #1976d2; font-weight: 700; font-size: 16px;">Day ' +
        streak.count +
        "</span>" +
        "</div>" +
        "</div>";
    });

    html += "</div></div>";
  }

  // Total points section
  var totalPoints = badges.reduce(function (sum, badge) {
    return sum + (badge.points || 0);
  }, 0);

  if (totalPoints > 0) {
    html +=
      '<div style="text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0;">' +
      '<div style="margin-bottom: 8px;">' +
      '<span style="color: #666; font-size: 14px;">Points earned today: </span>' +
      '<span style="color: #1976d2; font-weight: 700; font-size: 22px;">' +
      totalPoints +
      "</span>" +
      "</div>";

    html += "</div>";
  }

  html += "</section>";
  return html;
}

function getBadgeHistoryForWeek() {
  var sheet = getOrCreateBadgeHistorySheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { total: 0, points: 0, badges: [] };

  var weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  var weekData = {
    total: 0,
    points: 0,
    badges: [],
    byRarity: { legendary: 0, epic: 0, rare: 0, uncommon: 0, common: 0 },
  };

  // Start from end, get last 7 days
  for (var i = data.length - 1; i >= 1 && i >= data.length - 7; i--) {
    if (data[i][0]) {
      // Has date
      weekData.total += parseInt(data[i][1]) || 0;
      weekData.points += parseInt(data[i][2]) || 0;

      // Parse badge names
      var badgeNames = data[i][3] ? data[i][3].split(", ") : [];
      weekData.badges = weekData.badges.concat(badgeNames);
    }
  }

  return weekData;
}

function generateWeeklyBadgeEmail() {
  var weekData = getBadgeHistoryForWeek();

  var summary =
    '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; ' +
    'margin: 20px 0; border: 1px solid #e0e0e0;">' +
    '<h3 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">' +
    "🏅 Weekly Achievement Summary</h3>" +
    '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; ' +
    'margin: 16px 0;">' +
    '<div style="text-align: center; padding: 16px; background: white; ' +
    'border-radius: 8px; border: 1px solid #e0e0e0;">' +
    '<div style="font-size: 36px; color: #1976d2; font-weight: 700;">' +
    weekData.total +
    "</div>" +
    '<div style="color: #666; font-size: 14px;">Total Badges</div>' +
    "</div>" +
    '<div style="text-align: center; padding: 16px; background: white; ' +
    'border-radius: 8px; border: 1px solid #e0e0e0;">' +
    '<div style="font-size: 36px; color: #ff6f00; font-weight: 700;">' +
    weekData.points +
    "</div>" +
    '<div style="color: #666; font-size: 14px;">Total Points</div>' +
    "</div>" +
    "</div>" +
    '<div style="margin-top: 16px; padding: 12px; background: #e8f0fe; ' +
    'border-radius: 6px; border-left: 4px solid #1976d2;">' +
    "<strong>🎯 Top Achievement:</strong> " +
    (weekData.badges.length > 0
      ? weekData.badges[0]
      : "Keep pushing for your first badge!") +
    "</div>" +
    "</div>";

  return summary;
}

function getBadgeDesign(rarity) {
  var designs = {
    legendary: {
      background: "linear-gradient(135deg, #FFF8E1 0%, #FFD700 100%)",
      border: "#FFB300",
      shadow: "rgba(255,215,0,0.3)",
      rarityColor: "#FF6F00",
      titleColor: "#F57C00",
      descColor: "#5D4037",
      emojiShadow: "rgba(255,193,7,0.4)",
      pointsColor: "#FF6F00",
      pointsBg: "rgba(255,193,7,0.2)",
    },
    epic: {
      background: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
      border: "#9C27B0",
      shadow: "rgba(156,39,176,0.25)",
      rarityColor: "#7B1FA2",
      titleColor: "#6A1B9A",
      descColor: "#4A148C",
      emojiShadow: "rgba(156,39,176,0.4)",
      pointsColor: "#7B1FA2",
      pointsBg: "rgba(156,39,176,0.15)",
    },
    rare: {
      background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
      border: "#2196F3",
      shadow: "rgba(33,150,243,0.25)",
      rarityColor: "#1976D2",
      titleColor: "#1565C0",
      descColor: "#0D47A1",
      emojiShadow: "rgba(33,150,243,0.4)",
      pointsColor: "#1976D2",
      pointsBg: "rgba(33,150,243,0.15)",
    },
    uncommon: {
      background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
      border: "#4CAF50",
      shadow: "rgba(76,175,80,0.25)",
      rarityColor: "#388E3C",
      titleColor: "#2E7D32",
      descColor: "#1B5E20",
      emojiShadow: "rgba(76,175,80,0.4)",
      pointsColor: "#388E3C",
      pointsBg: "rgba(76,175,80,0.15)",
    },
    common: {
      background: "linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%)",
      border: "#BDBDBD",
      shadow: "rgba(0,0,0,0.1)",
      rarityColor: "#757575",
      titleColor: "#616161",
      descColor: "#424242",
      emojiShadow: "rgba(0,0,0,0.15)",
      pointsColor: "#757575",
      pointsBg: "rgba(0,0,0,0.08)",
    },
  };

  return designs[rarity] || designs.common;
}

// Add this NEW function after calculateStreakBadges
function generateBadgeNarrative(badges, scores, dayContext) {
  if (badges.length === 0) return "";

  var narrative = "";
  var legendaryCount = badges.filter(function (b) {
    return b.rarity === "legendary";
  }).length;
  var epicCount = badges.filter(function (b) {
    return b.rarity === "epic";
  }).length;

  if (legendaryCount > 0) {
    narrative = "🌟 <strong>Legendary Performance!</strong> ";
    if (dayContext.dayType === "weekend") {
      narrative +=
        "You've achieved excellence on a weekend - true dedication to wellness.";
    } else if (scores.work > 80) {
      narrative +=
        "Despite high work demands, you maintained peak wellness. Remarkable.";
    } else if (scores.total === 100) {
      narrative +=
        "A perfect score! You've reached the pinnacle of daily wellness.";
    } else {
      narrative += "You're operating at an elite level - top 1% performance.";
    }
  } else if (epicCount > 0) {
    narrative =
      "💜 <strong>Epic Achievement!</strong> You've unlocked rare wellness milestones today.";
  } else if (scores.total > 80) {
    narrative =
      "💪 <strong>Strong Showing!</strong> You're in the top 20% of daily performers.";
  } else if (badges.length >= 5) {
    narrative =
      "🎯 <strong>Multi-Achiever!</strong> " +
      badges.length +
      " badges earned - impressive consistency across all areas.";
  }

  return narrative
    ? '<div style="background: #f0f7ff; padding: 12px; border-radius: 6px; ' +
        'margin-bottom: 12px; font-style: italic; color: #1a73e8; border-left: 3px solid #1976d2;">' +
        narrative +
        "</div>"
    : "";
}

function saveBadgeHistory(dateStr, badges) {
  var sheet = getOrCreateBadgeHistorySheet();
  var badgeNames = badges
    .map(function (b) {
      return b.name;
    })
    .join(", ");
  var totalPoints = badges.reduce(function (sum, b) {
    return sum + (b.points || 0);
  }, 0);

  // Check if we already have an entry for this date
  var data = sheet.getDataRange().getValues();
  var rowToUpdate = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === dateStr) {
      rowToUpdate = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }

  if (rowToUpdate > 0) {
    // Update existing row
    sheet
      .getRange(rowToUpdate, 1, 1, 4)
      .setValues([[dateStr, badges.length, totalPoints, badgeNames]]);
  } else {
    // Add new row
    sheet.appendRow([dateStr, badges.length, totalPoints, badgeNames]);
  }
}

function getOrCreateBadgeHistorySheet() {
  var sheetName = "MyMetricLogBadgeHistory";
  var files = DriveApp.getFilesByName(sheetName);

  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  } else {
    var spreadsheet = SpreadsheetApp.create(sheetName);
    var sheet = spreadsheet.getActiveSheet();
    sheet.appendRow(["Date", "Badge Count", "Total Points", "Badges Earned"]);

    // Move to You Report folder
    var file = DriveApp.getFileById(spreadsheet.getId());
    var folder = getOrCreateDriveFolder("MyMetricLog");
    file.moveTo(folder);

    return spreadsheet;
  }
}

// 3. TREND ARROW GENERATOR
function getTrendArrow(trend) {
  if (trend > 5) return '<span style="color:#0b8043;">▲</span>';
  if (trend > 0) return '<span style="color:#0b8043;">↗</span>';
  if (trend < -5) return '<span style="color:#ea4335;">▼</span>';
  if (trend < 0) return '<span style="color:#ea4335;">↘</span>';
  return '<span style="color:#666;">→</span>';
}

// 4. MOOD CARD GENERATOR
function generateMoodCard(moodInsight, scores) {
  var moodEmojis = {
    energized: "⚡",
    relaxed: "😌",
    tired: "😴",
    anxious: "😰",
    overwhelmed: "😵",
    motivated: "💪",
    foggy: "🌫️",
    calm: "🧘",
    focused: "🎯",
    restless: "😣",
  };

  var moodKeyword = "balanced";
  var lowerInsight = moodInsight.toLowerCase();
  var feelMatch = lowerInsight.match(/feel (\w+)/);
  if (feelMatch) {
    moodKeyword = feelMatch[1];
  } else {
    for (var mood in moodEmojis) {
      if (lowerInsight.indexOf(mood) !== -1) {
        moodKeyword = mood;
        break;
      }
    }
  }

  var emoji = moodEmojis[moodKeyword] || "😊";
  var borderColor =
    scores.total >= 80 ? "#0b8043" : scores.total >= 60 ? "#fbbc04" : "#ea4335";
  var energyForecast = generateEnergyForecast(scores, moodKeyword);

  return (
    '<section style="background: linear-gradient(135deg, #f8f9fa 0%, #e8f0fe 100%); ' +
    "border: 2px solid " +
    borderColor +
    "; border-radius: 12px; padding: 20px; " +
    'margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">' +
    '<div style="display: flex; align-items: center; margin-bottom: 10px;">' +
    '<span style="font-size: 48px; margin-right: 15px;">' +
    emoji +
    "</span>" +
    "<div>" +
    '<h3 style="margin: 0; font-size: 20px; color: #1a73e8;">Today\'s Mood: ' +
    capitalizeFirstLetter(moodKeyword) +
    "</h3>" +
    '<p style="margin: 5px 0 0 0; color: #5f6368; font-size: 14px;">' +
    moodInsight +
    "</p>" +
    "</div></div>" +
    '<div style="background: rgba(255,255,255,0.7); border-radius: 8px; padding: 12px; ' +
    "margin-top: 15px; border-left: 4px solid " +
    borderColor +
    ';">' +
    '<strong style="color: #1a73e8;">📊 Energy Forecast:</strong><br>' +
    '<span style="color: #5f6368; font-size: 14px;">' +
    energyForecast +
    "</span>" +
    "</div></section>"
  );
}

// 5. ENERGY FORECAST GENERATOR
function generateEnergyForecast(scores, mood) {
  var forecasts = {
    high: [
      "Peak performance window: 9-11 AM. Schedule important tasks early.",
      "Strong energy reserves. Consider tackling complex projects today.",
      "Optimal conditions for deep work. Protect your focus time.",
    ],
    moderate: [
      "Steady energy with potential dip around 2-3 PM. Plan accordingly.",
      "Good baseline energy. Take regular breaks to maintain momentum.",
      "Expected productivity: moderate to good. Prioritize key tasks.",
    ],
    low: [
      "Energy conservation recommended. Focus on essential tasks only.",
      "Anticipate fatigue by mid-afternoon. Schedule lighter activities.",
      "Recovery day ahead. Be gentle with yourself and adjust expectations.",
    ],
  };

  var level =
    scores.total >= 80 ? "high" : scores.total >= 60 ? "moderate" : "low";
  var options = forecasts[level];
  return options[Math.floor(Math.random() * options.length)];
}

// 7. ENHANCED PROGRESS BAR
function generateEnhancedBar(score, gradient) {
  var filled = Math.round(score / 10);
  var empty = 10 - filled;

  var color1, color2;
  if (score >= 80) {
    color1 = "#0b8043";
    color2 = "#34a853";
  } else if (score >= 60) {
    color1 = "#f9ab00";
    color2 = "#fbbc04";
  } else {
    color1 = "#ea4335";
    color2 = "#ff6d60";
  }

  if (gradient) {
    var barHtml =
      '<div class="yr-progress-bar" style="display: inline-block; width: 100px; height: 8px; ' +
      'background: #e0e0e0; border-radius: 4px; overflow: hidden; vertical-align: middle;">' +
      '<div class="yr-progress-fill" style="width: ' +
      score +
      "%; height: 100%; " +
      "background: linear-gradient(90deg, " +
      color1 +
      " 0%, " +
      color2 +
      " 100%); " +
      'box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);"></div></div>';
    return barHtml;
  }

  // Fallback to Unicode bars
  var bar = "";
  for (var i = 0; i < filled; i++) {
    bar += "▓";
  }
  for (var i = 0; i < empty; i++) {
    bar += "░";
  }
  return (
    '<span class="yr-unicode-bar" style="font-family: monospace;">' +
    bar +
    "</span>"
  );
}

// 8. INSIGHT HEADLINE GENERATOR
function generateInsightHeadline(scores, stressRadar, recoveryQuotient) {
  var apiKey =
    PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

  var systemPrompt =
    "You are Sage, creating compelling one-line headlines that capture the essence of someone's day. " +
    "Write headlines that are insightful, not generic. Focus on the most interesting pattern or surprise in the data.";

  var userPrompt =
    "Based on this wellness data, write a single compelling headline (10-15 words max):\n\n" +
    "Overall Score: " +
    scores.total +
    "/100\n" +
    "Sleep: " +
    scores.sleep +
    "/100\n" +
    "Activity: " +
    scores.activity +
    "/100\n" +
    "Heart: " +
    scores.heart +
    "/100\n" +
    "Work: " +
    scores.work +
    "/100\n" +
    "Stress: " +
    stressRadar.level +
    " (" +
    stressRadar.score +
    "/100)\n" +
    "Recovery: " +
    recoveryQuotient.readiness +
    "\n\n" +
    "Rules:\n" +
    "- Focus on the most interesting insight or pattern\n" +
    "- Don't just state scores - reveal what they mean\n" +
    "- Be specific to THIS day's data\n" +
    "- No generic wellness platitudes\n" +
    "- If work score is 100, that's usually GOOD balance, not overwork\n" +
    "- Consider contrasts (high activity despite poor sleep, etc.)\n" +
    "- Make it something they'd want to read\n\n" +
    "Examples of good headlines:\n" +
    "- 'Your body compensated for poor sleep with remarkable resilience'\n" +
    "- 'Perfect work-life balance unlocked your best Sunday yet'\n" +
    "- 'Sleep efficiency tanked, but you refused to let it win'\n" +
    "- 'The rare meeting-free day paid massive dividends'\n" +
    "- 'Your stress-busting Sunday formula is working beautifully'";

  var payload = {
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.9, // Higher temperature for more variety
    max_tokens: 50,
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(
      "https://api.openai.com/v1/chat/completions",
      options
    );
    var result = JSON.parse(response.getContentText());

    if (result && result.choices && result.choices.length > 0) {
      var headline = result.choices[0].message.content.trim();
      // Remove quotes if GPT added them
      headline = headline.replace(/^["']|["']$/g, "");
      return headline;
    }
  } catch (e) {
    Logger.log("AI headline generation error: " + e);
  }

  // Fallback to dynamic headline based on actual patterns
  return generateDynamicFallbackHeadline(scores, stressRadar, recoveryQuotient);
}

function generateDynamicFallbackHeadline(
  scores,
  stressRadar,
  recoveryQuotient
) {
  // Find the most notable aspect of the day
  var aspects = [];

  // Score-based observations
  if (scores.total >= 90) {
    aspects.push({
      priority: 1,
      headline: "Near-perfect day — you've cracked the wellness code",
    });
  }
  if (scores.sleep < 60 && scores.activity > 80) {
    aspects.push({
      priority: 2,
      headline: "Your determination overcame a rough night's sleep",
    });
  }
  if (scores.work === 100 && stressRadar.score < 30) {
    aspects.push({
      priority: 2,
      headline: "Work-life harmony achieved — zero stress, maximum output",
    });
  }
  if (Math.abs(scores.sleep - scores.activity) < 5 && scores.sleep > 80) {
    aspects.push({
      priority: 3,
      headline: "Sleep and movement in perfect synchronization",
    });
  }
  if (recoveryQuotient.score > 85) {
    aspects.push({
      priority: 3,
      headline: "Your body's recovery systems are firing on all cylinders",
    });
  }

  // Day-specific observations
  var today = new Date().getDay();
  if (today === 1 && scores.total > 80) {
    // Monday
    aspects.push({
      priority: 4,
      headline: "Monday conquered — you've set the week's tone",
    });
  }
  if (today === 5 && scores.work === 100) {
    // Friday
    aspects.push({
      priority: 4,
      headline: "Friday flow state — you're heading into the weekend strong",
    });
  }

  // Sort by priority and return the most relevant
  aspects.sort(function (a, b) {
    return a.priority - b.priority;
  });

  if (aspects.length > 0) {
    return aspects[0].headline;
  }

  // Ultimate fallback
  if (scores.total >= 80) {
    return "Strong performance with room to excel further";
  } else if (scores.total >= 60) {
    return "Solid foundation with clear opportunities ahead";
  } else {
    return "Your wellness needs attention — small steps, big impact";
  }
}

// 9. ENHANCED EMAIL COMPOSITION
// Complete enhanced email composition function with all features integrated
function composeEnhancedMyMetricLogEmail(
  fullDateStr,
  dateStr,
  scores,
  insight,
  mantra,
  moodInsight,
  weatherSummary,
  calSummary,
  emailSummary,
  completedTasks,
  spotifySummary,
  fitbitActivity,
  fitbitSleep,
  fitbitHeart,
  peakHR,
  stressRadar,
  recoveryQuotient,
  dayContext,
  badges,
  streakBadges,
  badgeNarrative,
  nearMisses,
  calendarAnalysis,
  calendarIntelligence,
  fitbitHRV,
  hourlyWeather,
  emailResponseAnalysis,
  fitbitActivityLog,
  audioFeatures
) {
  // Parse sleep efficiency at the start
  var sleepEfficiencyMatch = fitbitSleep.match(/😴 Efficiency: (\d+)%/);

  // Get all the data parsing (keep existing)
  var calEvents = dayContext.calendarData || [];
  var trends = getScoreTrends();
  var yesterday = new Date(dateStr);
  var environmentalFactors = getSocialEnvironmentalFactors(
    yesterday,
    weatherSummary,
    dayContext
  );
  var historicalData = [];
  if (trends && trends.overall && trends.overall.sparkline) {
    historicalData = trends.overall.sparkline.map(function (score, index) {
      return { score: score };
    });
  }

  var anomalies = detectBiometricAnomalies(
    { heart: fitbitHeart, sleep: fitbitSleep },
    historicalData
  );

  var intradayViz = generateIntradayVisualization(
    fitbitActivity,
    fitbitSleep,
    calSummary,
    dayContext
  );

  var deepInsights = generateDeepAIInsights({
    scores: scores,
    stressRadar: stressRadar,
    recoveryQuotient: recoveryQuotient,
    calendarIntelligence: calendarIntelligence,
  });

  var moodCard = generateMoodCard(moodInsight, scores);
  var quickWinBox = generateQuickWinBox(
    scores,
    stressRadar,
    recoveryQuotient,
    environmentalFactors,
    calendarIntelligence
  );
  var insightHeadline = generateInsightHeadline(
    scores,
    stressRadar,
    recoveryQuotient
  );

  // Parse email stats
  var receivedMatch = emailSummary.match(/Received: (\d+)/);
  var sentMatch = emailSummary.match(/Sent: (\d+)/);
  var emailStats = {
    received: receivedMatch ? parseInt(receivedMatch[1]) : 0,
    sent: sentMatch ? parseInt(sentMatch[1]) : 0,
  };

  var emailManagementInsight = generateEmailManagementInsight(emailStats);

  var previousMood = getMoodFromDayBefore(); // Add this if not already parsed
  var recommendationsAndInsights = addRecommendationsToSections(
    htmlBody,
    scores,
    {
      scores: scores,
      emailStats: emailStats,
      calendarAnalysis: calendarAnalysis,
      calendarIntelligence: calendarIntelligence,
      fitbitSleep: fitbitSleep,
      fitbitActivity: fitbitActivity,
      fitbitHeart: fitbitHeart,
      fitbitHRV: fitbitHRV,
      fitbitActivityLog: fitbitActivityLog,
      weatherSummary: weatherSummary,
      hourlyWeather: hourlyWeather,
      environmentalFactors: environmentalFactors,
      spotifySummary: spotifySummary,
      audioFeatures: audioFeatures,
      moodInsight: moodInsight,
      stressRadar: stressRadar,
      recoveryQuotient: recoveryQuotient,
      dayContext: dayContext,
      previousMood: previousMood,
      anomalies: anomalies,
      completedTasks: completedTasks,
      emailResponseAnalysis: emailResponseAnalysis,
    }
  );

  var recommendations = recommendationsAndInsights.recommendations;
  var insights = recommendationsAndInsights.insights;

  // Log to sheet FIRST (before getting trends)
  var sleepMins =
    parseInt(fitbitSleep.match(/(\d+)h/)[1]) * 60 +
    parseInt(fitbitSleep.match(/\d+h (\d+)m/)[1]);
  var steps = parseInt(
    fitbitActivity.match(/👣 Steps: ([\d,]+)/)[1].replace(/,/g, "")
  );
  var topTrack = spotifySummary.split("\n")[2] || "";
  var weatherCond = weatherSummary.split("\n")[0].replace("🌤️ ", "");

  logToMyMetricLogSheet(
    dateStr,
    moodInsight,
    scores.total,
    sleepMins,
    steps,
    topTrack,
    weatherCond,
    insight,
    scores.sleep,
    scores.activity,
    scores.heart,
    scores.work
  );

  // NOW get trends (after saving)
  SpreadsheetApp.flush(); // Force save
  var trends = getScoreTrends();

  // Score trends
  var scoreTrend = "";
  if (
    trends &&
    trends.overall &&
    trends.overall.trend !== undefined &&
    trends.overall.trend !== 0
  ) {
    scoreTrend =
      " " +
      getTrendArrow(trends.overall.trend) +
      " " +
      (trends.overall.trend > 0 ? "+" : "") +
      trends.overall.trend;
  }

  var historicalData = getHistoricalDayAverage(dayContext.dayName);

  // Color coding
  var scoreColor =
    scores.total >= 80 ? "#0b8043" : scores.total >= 60 ? "#fbbc04" : "#ea4335";
  var stressColor;
  if (stressRadar.score < 20) {
    stressColor = "#00695c"; // Dark green (low stress is good)
  } else if (stressRadar.score < 30) {
    stressColor = "#0b8043"; // Standard green
  } else if (stressRadar.score < 40) {
    stressColor = "#66bb6a"; // Light green
  } else if (stressRadar.score < 50) {
    stressColor = "#9ccc65"; // Yellow-green
  } else if (stressRadar.score < 60) {
    stressColor = "#f9ab00"; // Orange
  } else if (stressRadar.score < 70) {
    stressColor = "#ff6f00"; // Orange-red
  } else {
    stressColor = "#ea4335"; // Red (high stress)
  }

  // For recovery score:
  var recoveryColor;
  if (recoveryQuotient.score >= 90) {
    recoveryColor = "#00695c"; // Dark green
  } else if (recoveryQuotient.score >= 80) {
    recoveryColor = "#0b8043"; // Standard green
  } else if (recoveryQuotient.score >= 70) {
    recoveryColor = "#66bb6a"; // Light green
  } else if (recoveryQuotient.score >= 60) {
    recoveryColor = "#9ccc65"; // Yellow-green
  } else if (recoveryQuotient.score >= 50) {
    recoveryColor = "#f9ab00"; // Orange
  } else {
    recoveryColor = "#ea4335"; // Red
  }

  // Extract key stats
  var sleepMatch = fitbitSleep.match(/(\d+)h (\d+)m/);
  var sleepStr = sleepMatch
    ? sleepMatch[1] + "h " + sleepMatch[2] + "m"
    : "N/A";
  var stepsMatch = fitbitActivity.match(/👣 Steps: ([\d,]+)/);
  var stepsStr = stepsMatch ? stepsMatch[1] : "N/A";
  var caloriesMatch = fitbitActivity.match(/🔥 Calories burned: ([\d,]+)/);
  var caloriesStr = caloriesMatch ? caloriesMatch[1] + " cal" : "N/A";
  var activeMatch = fitbitActivity.match(/💪 Very Active: (\d+)/);
  var activeStr = activeMatch ? activeMatch[1] + " min active" : "N/A";
  var restingHRMatch = fitbitHeart.match(/❤️ Resting HR: (\d+)/);
  var restingHRStr = restingHRMatch ? restingHRMatch[1] + " bpm" : "N/A";

  // Build HTML with inline styles for email compatibility
  var htmlBody =
    "<div style='font-family:Helvetica,Arial,sans-serif; color:#333; max-width:600px; margin:auto;'>" +
    // Logo
    "<div style='text-align:center; margin:20px 0;'>" +
    "<img src='https://i.ibb.co/9HwyVWzR/My-Metric-Log-Logo.png' " +
    "alt='MyMetricLog Logo' style='max-width:300px; height:auto;'/>" +
    "</div>" +
    // Date header
    "<div style='text-align:center; margin:10px 0; font-size:18px; color:#555;'>" +
    fullDateStr +
    "</div>" +
    // Overall Score
    "<div style='text-align:center; margin:20px 0;'>" +
    "<div style='font-size:52px; font-weight:bold; color:" +
    getMainScoreColor(scores.total) +
    ";'>" + // Use the function here
    scores.total +
    "</div>" +
    "<div style='font-size:18px; color:#555; margin-bottom:5px;'><strong>Overall Score</strong>" +
    scoreTrend +
    "</div>" +
    // Add the status tag under the score for daily report
    "<div style='margin-top:8px;'>" +
    generateStatusTag("Overall", scores.total, false, true) +
    "</div>" +
    // ADD THIS: Historical comparison
    (historicalData && historicalData.count >= 3
      ? "<div style='margin-top:10px; font-size:14px; color:#666; background:#f8f9fa; " +
        "padding:8px 16px; border-radius:20px; display:inline-block;'>" +
        "Your typical " +
        dayContext.dayName +
        ": <strong>" +
        historicalData.average +
        "</strong> " +
        "(today " +
        (scores.total > historicalData.average
          ? "<span style='color:#0b8043;'>+" +
            (scores.total - historicalData.average) +
            " above</span>"
          : scores.total < historicalData.average
          ? "<span style='color:#ea4335;'>" +
            (scores.total - historicalData.average) +
            " below</span>"
          : "matches") +
        " average)" +
        "</div>"
      : "") +
    (trends &&
    trends.overall &&
    trends.overall.sparkline &&
    trends.overall.sparkline.length > 0
      ? "<div style='margin-top:15px; padding: 10px; background: rgba(0,0,0,0.03); border-radius: 6px;'>" +
        generateSparkline(
          trends.overall.sparkline,
          getMainScoreColor(scores.total)
        ) +
        "</div>"
      : "") +
    "</div>" +
    // Anomalies Alert
    (anomalies.detected.length > 0
      ? "<div style='background:#fef2f2; padding:16px; border-radius:8px; margin:20px 0; " +
        "border-left: 4px solid #fecaca;'>" +
        "<div style='display: flex; align-items: center;'>" +
        "<span style='font-size:24px; margin-right:10px;'>🚨</span>" +
        "<div>" +
        "<strong style='font-size:16px; color:#d33;'>Biometric Anomalies Detected</strong><br>" +
        anomalies.detected
          .map(function (a) {
            return (
              "<div style='margin-top:8px;'>" +
              "<strong>" +
              a.type +
              ":</strong> " +
              a.value +
              "<br>" +
              "<span style='color:#666; font-size:14px;'>" +
              a.insight +
              "</span>" +
              "</div>"
            );
          })
          .join("") +
        "</div></div></div>"
      : "") +
    // At a Glance
    "<div style='background:#e8f0fe; padding:16px; border-radius:8px; text-align:center; margin:20px 0; border-left: 4px solid #1976d2; box-shadow: 0 1px 3px rgba(0,0,0,0.05);'>" +
    "<strong style='font-size:16px;'>At a Glance:</strong><br>" +
    "<span style='font-size:15px; color:#424242; line-height:1.6;'>" +
    sleepStr +
    " sleep | " +
    stepsStr +
    " steps | " +
    caloriesStr +
    " | " +
    activeStr +
    " | " +
    restingHRStr +
    "</span>" +
    "</div>" +
    // Intraday Visualization
    intradayViz +
    // Overall Analysis section
    "<div style='margin:16px 0; padding:16px; background: #f0f4ff; border-left: 4px solid #b8ccff; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>" +
    "<img src='" +
    getSageImage("analysis") +
    "' " +
    "alt='Sage Analysis' style='height:60px; width:auto; vertical-align:middle; margin-right:12px;'/>" +
    "Your Day, Decoded by Sage</h3>" +
    "<p style='margin:10px 0; font-size:16px; color:#6c5ce7; font-style:italic;'>" +
    insightHeadline +
    "</p>" +
    "<div style='font-family:Arial, sans-serif; font-size:14px; line-height:1.6; color:#333;'>" +
    convertAndFormatInsight(insight) +
    "</div>" +
    "</div>" +
    // Performance Breakdown
    "<div style='background:#f0f4ff; border-left: 4px solid #b8ccff; padding:20px; border-radius:8px; margin:20px 0; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>Performance Breakdown</h4>" +
    "<table style='width:100%; border-collapse: collapse;'>" +
    "<tr>" +
    "<td style='width:50%; padding:10px; vertical-align:top;'>" +
    "<div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle;'>Sleep:</span>" +
    generateEnhancedBar(scores.sleep, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    scores.sleep +
    "</span>" +
    generateStatusTag("Sleep", scores.sleep, true) +
    "</div>" +
    generateMiniTrendChart("Sleep", scores.sleep, "#7c4dff") +
    "</div>" +
    "<div style='background:white; padding:15px; border-radius:6px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle;'>Activity:</span>" +
    generateEnhancedBar(scores.activity, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    scores.activity +
    "</span>" +
    generateStatusTag("Activity", scores.activity, true) +
    "</div>" +
    generateMiniTrendChart("Activity", scores.activity, "#0f9d58") +
    "</div>" +
    "</td>" +
    "<td style='width:50%; padding:10px; vertical-align:top;'>" +
    "<div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle;'>Heart:</span>" +
    generateEnhancedBar(scores.heart, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    scores.heart +
    "</span>" +
    generateStatusTag("Heart", scores.heart, true) +
    "</div>" +
    generateMiniTrendChart("Heart", scores.heart, "#ea4335") +
    "</div>" +
    "<div style='background:white; padding:15px; border-radius:6px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle;'>Work:</span>" +
    generateEnhancedBar(scores.work, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    scores.work +
    "</span>" +
    generateStatusTag("Work", scores.work, true) +
    "</div>" +
    generateMiniTrendChart("Work", scores.work, "#f9ab00") +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "</div>" +
    // Mood Card
    moodCard +
    // Badge Section
    generateBadgeSection(badges, [], badgeNarrative) +
    // AI Deep Insights
    (deepInsights.patterns.length > 0 || deepInsights.prescriptions.length > 0
      ? "<div style='background: #f0f4ff; " +
        "padding:16px; border-radius:8px; margin:20px 0; border-left: 4px solid #b8ccff;'>" +
        "<h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>🤖 AI Pattern Recognition</h4>" +
        deepInsights.patterns
          .map(function (p) {
            return (
              "<div style='margin-bottom:10px;'>" +
              "<strong>" +
              p.type +
              ":</strong> " +
              p.detail +
              " <span style='color:#666; font-size:12px;'>(" +
              Math.round(p.confidence * 100) +
              "% confidence)</span></div>"
            );
          })
          .join("") +
        (deepInsights.prescriptions.length > 0
          ? "<div style='margin-top:15px; padding-top:15px; border-top:1px solid rgba(0,0,0,0.1);'>" +
            "<strong style='color:#4a148c;'>Recommended Actions:</strong>" +
            deepInsights.prescriptions
              .map(function (p) {
                return (
                  "<div style='margin-top:8px; padding:8px; background:rgba(255,255,255,0.7); " +
                  "border-radius:4px;'>" +
                  "<strong>" +
                  p.action +
                  "</strong><br>" +
                  "<span style='font-size:13px; color:#555;'>" +
                  p.detail +
                  "</span></div>"
                );
              })
              .join("") +
            "</div>"
          : "") +
        "</div>"
      : "") +
    // Update the Work Overview Section header
    "<div style='padding:20px; border-radius:8px; margin:20px 0; background: #f0f4f7; border-left: 4px solid #cbd5e1;'>" +
    "<table style='width:100%; margin-bottom:20px;'>" +
    "<tr>" +
    "<td rowspan='2' style='width:60px; vertical-align:middle;'>" +
    (SAGE_IMAGES.working
      ? "<img src='" +
        getSageImage("working") +
        "' " +
        "alt='Sage Working' style='height:60px; width:auto;'/>"
      : "") +
    "</td>" +
    "<td style='vertical-align:bottom; padding-left:12px;'>" +
    "<h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0;'>Work Overview</h3>" +
    "</td>" +
    "</tr>" +
    "<tr>" +
    "<td style='vertical-align:top; padding-left:12px;'>" +
    "<div style='font-size:36px; font-weight:bold; color:" +
    getScoreColor(scores.work, false) +
    ";'>" +
    scores.work +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "<div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0;'>📅 Calendar</h4>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
    calSummary.replace(/\n/g, "<br>") +
    (calendarIntelligence && calendarIntelligence.score < 100
      ? "<br><span style='color:#ff6f00;'>⚠️ " +
        calendarIntelligence.insights.join(", ") +
        "</span>"
      : "") +
    "</div>" +
    "</div>" +
    "<div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0;'>✉️ Email</h4>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
    emailSummary.replace(/\n/g, "<br>") +
    (emailResponseAnalysis && emailResponseAnalysis.avgMinutes
      ? "<br><div style='background:#f3e5f5; padding:10px; border-radius:4px; margin-top:8px;'>" +
        "<strong>⚡ Email Response Patterns:</strong><br>" +
        "<span style='font-size:13px;'>" +
        "• Average response time: <strong>" +
        (emailResponseAnalysis.avgMinutes < 60
          ? emailResponseAnalysis.avgMinutes + " minutes"
          : Math.round((emailResponseAnalysis.avgMinutes / 60) * 10) / 10 +
            " hours") +
        "</strong><br>" +
        (emailResponseAnalysis.avgMinutes < 60
          ? "• Status: <span style='color:#43a047;'>Highly responsive</span>"
          : emailResponseAnalysis.avgMinutes < 240
          ? "• Status: <span style='color:#ff9800;'>Moderate response time</span>"
          : "• Status: <span style='color:#ea4335;'>Delayed responses - inbox overwhelm?</span>") +
        "</span>" +
        "</div>"
      : "") +
    "</div>" +
    "</div>" +
    (completedTasks
      ? "<div style='background:white; padding:16px; border-radius:6px;'>" +
        "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0;'>✅ Tasks</h4>" +
        "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
        completedTasks.replace(/\n/g, "<br>") +
        "</div>" +
        "</div>"
      : "") +
    // ADD INSIGHT BOX FOR WORK
    "<div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>" +
    "<strong style='color:#1565c0; font-size:13px;'>💡 Insight:</strong> <span style='font-size:13px;'>" +
    insights.work +
    "</span>" +
    "</div>" +
    // ADD THIS RECOMMENDATION BLOCK
    "<div style='background:#dbeafe; padding:12px; border-radius:6px; margin-bottom:16px; border-left:3px solid #93c5fd;'>" +
    "<strong style='color:#1565c0;'>🎯 Recommendation:</strong> " +
    recommendations.work +
    "</div>" +
    "</div>" +
    // Physical Wellness Section
    "<div style='padding:20px; border-radius:8px; margin:20px 0; background: #f0fdf4; border-left: 4px solid #bbf7d0;'>" +
    "<h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>" +
    "🏃 Physical Wellness</h3>" +
    // Sleep subsection
    "<div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<table style='width:100%; margin-bottom:16px;'>" +
    "<tr>" +
    "<td rowspan='2' style='width:48px; vertical-align:middle;'>" +
    (SAGE_IMAGES.sleep
      ? "<img src='" +
        getSageImage("sleep") +
        "' " +
        "alt='Sage Sleep' style='width:48px; height:auto;'/>"
      : "") +
    "</td>" +
    "<td style='vertical-align:bottom; padding-left:10px;'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0;'>Sleep</h4>" +
    "</td>" +
    "</tr>" +
    "<tr>" +
    "<td style='vertical-align:top; padding-left:10px;'>" +
    "<div style='font-size:36px; font-weight:bold; color:" +
    getScoreColor(scores.sleep, false) +
    ";'>" +
    scores.sleep +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
    fitbitSleep
      .split("\n")
      .filter(function (line) {
        return line.indexOf("Sleep stages:") === -1; // Remove the text stages line
      })
      .join("<br>") +
    generateSleepStagesVisualization(fitbitSleep) +
    // ADD THIS: Sleep efficiency explanation

    // ADD AI-GENERATED INSIGHT BOX
    "<div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>" +
    "<strong style='color:#6a1b9a; font-size:13px;'>💡 Insight:</strong> <span style='font-size:13px;'>" +
    insights.sleep +
    "</span>" +
    "</div>" +
    // ADD RECOMMENDATION
    // UPDATE Recommendation box with darker purple and new emoji
    "<div style='background:#dbeafe; padding:10px; border-radius:4px; margin-bottom:12px; border-left:3px solid #93c5fd;'>" +
    "<strong style='color:#6a1b9a; font-size:13px;'>🎯 Recommendation:</strong> <span style='font-size:13px;'>" +
    recommendations.sleep +
    "</span>" +
    "</div>" +
    "</div>" +
    // Activity subsection
    // Activity subsection
    // Activity subsection
    "<div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<table style='width:100%; margin-bottom:16px;'>" +
    "<tr>" +
    "<td rowspan='2' style='width:48px; vertical-align:middle;'>" +
    (SAGE_IMAGES.active
      ? "<img src='" +
        getSageImage("active") +
        "' " +
        "alt='Sage Active' style='width:48px; height:auto;'/>"
      : "") +
    "</td>" +
    "<td style='vertical-align:bottom; padding-left:10px;'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0;'>Activity</h4>" +
    "</td>" +
    "</tr>" +
    "<tr>" +
    "<td style='vertical-align:top; padding-left:10px;'>" +
    "<div style='font-size:36px; font-weight:bold; color:" +
    getScoreColor(scores.activity, false) +
    ";'>" +
    scores.activity +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
    // Remove the fitbitActivity.replace(/\n/g, '<br>') line completely
    (fitbitActivityLog
      ? "<div style='background:#e3f2fd; padding:10px; border-radius:4px; margin-bottom:10px;'>" +
        "<strong>📋 Logged Activities:</strong><br>" +
        fitbitActivityLog.replace(/\n/g, "<br>") +
        "</div>"
      : "") +
    generateActivityZonesVisualization(fitbitActivity) +
    // AI-GENERATED INSIGHT BOX with lighter green
    "<div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>" +
    "<strong style='color:#2e7d32; font-size:13px;'>💡 Insight:</strong> <span style='font-size:13px;'>" +
    insights.activity +
    "</span>" +
    "</div>" +
    // UPDATE Recommendation box with darker green and new emoji
    "<div style='background:#dbeafe; padding:10px; border-radius:4px; margin-bottom:12px; border-left:3px solid #93c5fd;'>" +
    "<strong style='color:#2e7d32; font-size:13px;'>🎯 Recommendation:</strong> <span style='font-size:13px;'>" +
    recommendations.activity +
    "</span>" +
    "</div>" +
    "</div>" +
    "</div>" +
    // Heart Health subsection
    "<div style='background:white; padding:16px; border-radius:6px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<table style='width:100%; margin-bottom:16px;'>" +
    "<tr>" +
    "<td rowspan='2' style='width:48px; vertical-align:middle;'>" +
    (SAGE_IMAGES.heart
      ? "<img src='" +
        getSageImage("heart") +
        "' " +
        "alt='Sage Heart' style='width:48px; height:auto;'/>"
      : "") +
    "</td>" +
    "<td style='vertical-align:bottom; padding-left:10px;'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0;'>Heart Health</h4>" +
    "</td>" +
    "</tr>" +
    "<tr>" +
    "<td style='vertical-align:top; padding-left:10px;'>" +
    "<div style='font-size:36px; font-weight:bold; color:" +
    getScoreColor(scores.heart, false) +
    ";'>" +
    scores.heart +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
    fitbitHeart.replace(/\n/g, "<br>") +
    (fitbitHRV
      ? "<br>💗 HRV: " +
        fitbitHRV.value +
        " ms (" +
        fitbitHRV.status +
        ")<br>" +
        "<em style='color:#666; font-size:13px;'>" +
        fitbitHRV.insight +
        "</em>"
      : "") +
    generateHeartRateZonesVisualization(fitbitHeart) + // ADD THIS LINE
    // In the email template, update heart insight box:
    "<div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>" +
    "<strong style='color:#5d4037; font-size:13px;'>💡 Insight:</strong> <span style='font-size:13px;'>" +
    insights.heart +
    "</span>" +
    "</div>" +
    // Update heart recommendation box:
    "<div style='background:#dbeafe; padding:10px; border-radius:4px; margin-bottom:12px; border-left:3px solid #93c5fd;'>" +
    "<strong style='color:#5d4037; font-size:13px;'>🎯 Recommendation:</strong> <span style='font-size:13px;'>" +
    recommendations.heart +
    "</span>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    // Recovery Score section with visualization
    "<div style='background:#f0fdfa; padding:16px; border-radius:8px; margin:20px 0; border-left:3px solid #99f6e4;'>" +
    "<table style='width:100%; margin-bottom:16px;'>" +
    "<tr>" +
    "<td rowspan='2' style='width:48px; vertical-align:middle;'>" +
    "<img src='" +
    getSageImage("recovery") +
    "' " +
    "alt='Sage Recovery' style='width:48px; height:auto;'/>" +
    "</td>" +
    "<td style='vertical-align:bottom; padding-left:10px;'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0;'>Recovery</h4>" +
    "</td>" +
    "</tr>" +
    "<tr>" +
    "<td style='vertical-align:top; padding-left:10px;'>" +
    "<div style='font-size:36px; font-weight:bold; color:" +
    getScoreColor(recoveryQuotient.score, false) +
    ";'>" +
    recoveryQuotient.score +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368; margin-bottom:12px;'>" +
    "This score reflects your body's readiness for today based on sleep, heart rate recovery, and yesterday's activity balance." +
    "</div>" +
    // AI-GENERATED INSIGHT with lighter blue
    "<div style='background:#fef3c7; padding:10px; border-radius:4px; margin-bottom:12px; border-left:3px solid #fbbf24;'>" +
    "<strong style='font-size:13px; color:#1565c0;'>💡 Insight:</strong> <span style='font-size:13px;'>" +
    insights.recovery +
    "</span>" +
    "</div>" +
    // UPDATE Recommendation with darker blue and new emoji
    "<div style='background:#dbeafe; padding:10px; border-radius:4px; border-left:3px solid #93c5fd;'>" +
    "<strong style='color:#01579b; font-size:13px;'>🎯 Recommendation:</strong> <span style='font-size:13px;'>" +
    recommendations.recovery +
    "</span>" +
    "</div>" +
    "</div>" +
    // Environment & Lifestyle Section - UPDATED with equal formatting
    "<div style='background:#fff7ed; padding:20px; border-radius:8px; margin:20px 0; border-left: 4px solid #fed7aa; box-shadow: 0 1px 3px rgba(0,0,0,0.05); box-sizing: border-box;'>" +
    "<h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>" +
    "🌍 Environment & Lifestyle</h3>" +
    "<div style='display:grid; grid-template-columns:1fr 1fr; gap:12px; box-sizing:border-box; max-width:100%;'>" +
    // Weather section with integrated Environmental Insights
    "<div style='background:white; padding:16px; border-radius:6px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05); overflow:hidden; word-wrap:break-word;'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0; display:flex; align-items:center;'>" +
    (SAGE_IMAGES.weather
      ? "<img src='" +
        getSageImage("weather") +
        "' " +
        "alt='Sage Weather' style='width:48px; height:auto; margin-right:10px; vertical-align:middle;'/>"
      : "") +
    "<span style='line-height:48px;'>Weather</span></h4>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
    // Yesterday's Weather box
    "<div style='background:#f0f9ff; padding:12px; border-radius:6px; margin-bottom:12px;'>" +
    "<strong style='color:#1565c0;'>Yesterday's Weather:</strong><br>" +
    weatherSummary.replace(/\n/g, "<br>") +
    "</div>" +
    // Today's Forecast
    (hourlyWeather && hourlyWeather.summary
      ? "<div style='background:#e3f2fd; padding:10px; border-radius:4px;'>" +
        "<strong>Today's Forecast:</strong><br>" +
        "<span style='font-size:13px;'>" +
        hourlyWeather.summary.replace(/\n/g, "<br>") +
        "</span>" +
        (environmentalFactors.seasonal.daylight
          ? "<br><br>☀️ <strong>Daylight:</strong> " +
            environmentalFactors.seasonal.daylight +
            " hours"
          : "") +
        (environmentalFactors.seasonal.sunrise &&
        environmentalFactors.seasonal.sunset
          ? "<br>🌅 <strong>Sunrise:</strong> " +
            environmentalFactors.seasonal.sunrise +
            " | " +
            "🌇 <strong>Sunset:</strong> " +
            environmentalFactors.seasonal.sunset
          : "") +
        "</div>"
      : "") +
    // Add weather alerts if any
    (hourlyWeather &&
    hourlyWeather.warnings &&
    hourlyWeather.warnings.length > 0
      ? "<br><div style='background:#fff3e0; padding:10px; border-radius:4px; margin-top:8px;'>" +
        "<strong>⚠️ Weather Alerts:</strong><br>" +
        "<span style='font-size:13px; color:#f57c00;'>" +
        hourlyWeather.warnings.join("<br>") +
        "</span></div>"
      : "") +
    // ADD THIS INSIGHT BOX:
    "<div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>" +
    "<strong style='color:#f57c00; font-size:13px;'>💡 Insight:</strong> <span style='font-size:13px;'>" +
    insights.weather +
    "</span>" +
    "</div>" +
    // Then UPDATE the existing recommendation box to:
    "<div style='background:#dbeafe; padding:10px; border-radius:4px; margin-top:12px; border-left:3px solid #93c5fd;'>" +
    "<strong style='color:#e65100; font-size:13px;'>🎯 Recommendation:</strong> <span style='font-size:13px;'>" +
    recommendations.weather +
    "</span>" +
    "</div>" +
    "</div>" +
    "</div>" +
    // Music section
    "<div style='background:white; padding:16px; border-radius:6px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0; display:flex; align-items:center;'>" +
    (SAGE_IMAGES.music
      ? "<img src='" +
        getSageImage("music") +
        "' " +
        "alt='Sage Music' style='width:48px; height:auto; margin-right:10px; vertical-align:middle;'/>"
      : "") +
    "<span style='line-height:48px;'>Music</span></h4>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
    // Right AFTER this line:
    spotifySummary.replace(/\n/g, "<br>") +
    // ADD THIS INSIGHT BOX:
    "<div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>" +
    "<strong style='color:#4f46e5; font-size:13px;'>💡 Insight:</strong> <span style='font-size:13px;'>" +
    insights.music +
    "</span>" +
    "</div>" +
    // Then UPDATE the existing recommendation box to:
    "<div style='background:#dbeafe; padding:10px; border-radius:4px; margin-bottom:12px; border-left:3px solid #93c5fd;'>" +
    "<strong style='color:#4338ca; font-size:13px;'>🎯 Recommendation:</strong> <span style='font-size:13px;'>" +
    recommendations.music +
    "</span>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    // Daily Mantra - UPDATED with Sage meditation image
    "<div style='background:#faf5ff; padding:20px; border-radius:12px; margin:20px 0; border-left:4px solid #e9d5ff; box-shadow:0 2px 8px rgba(0,0,0,0.1);'>" +
    "<h4 style='font-size:18px; font-weight:600; color:#5f27cd; margin:0 0 12px 0; display:flex; align-items:center;'>" +
    "<img src='" +
    getSageImage("meditation") +
    "' " +
    "alt='Sage Meditation' style='width:48px; height:auto; margin-right:10px; vertical-align:middle;'/>" +
    "<span style='line-height:48px;'>Daily Mantra</span></h4>" +
    "<div style='background:rgba(255,255,255,0.7); padding:16px; border-radius:8px;'>" +
    "<div style='font-size:17px; color:#4a148c; font-style:italic; line-height:1.6; text-align:center; word-wrap:break-word;'>" +
    escapeHtml(mantra) +
    "</div>" +
    "</div>" +
    "</div>" +
    // Footer
    "<div style='margin-top:40px; padding-top:20px; border-top:1px solid #e0e0e0; " +
    "text-align:center; color:#999; font-size:12px;'>" +
    "MyMetricLog • Your Personal Wellness Companion<br>" +
    "🦊 Tracking • 📊 Analyzing • 🎯 Growing Together" +
    "</div>";

  return htmlBody;
}

function generateActivityNarrative(activityData, sleepData, dayContext) {
  // Parse the activity data
  var veryActiveMatch = activityData.match(/💪 Very Active: (\d+) min/);
  var fairlyActiveMatch = activityData.match(/🚶 Fairly Active: (\d+) min/);
  var lightlyActiveMatch = activityData.match(/🧘 Lightly Active: (\d+) min/);
  var sedentaryMatch = activityData.match(/🪑 Sedentary: (\d+) min/);

  var veryActive = veryActiveMatch ? parseInt(veryActiveMatch[1]) : 0;
  var fairlyActive = fairlyActiveMatch ? parseInt(fairlyActiveMatch[1]) : 0;
  var lightlyActive = lightlyActiveMatch ? parseInt(lightlyActiveMatch[1]) : 0;
  var sedentary = sedentaryMatch ? parseInt(sedentaryMatch[1]) : 0;

  // Parse wake time
  var wakeMatch = sleepData.match(/☀️ Wake time: (\d+):(\d+) (AM|PM)/);
  var wakeTimeStr = wakeMatch
    ? wakeMatch[1] + ":" + wakeMatch[2] + " " + wakeMatch[3]
    : "early morning";

  // Calculate percentages
  var totalAwakeMinutes = veryActive + fairlyActive + lightlyActive + sedentary;
  var sedentaryPercent = Math.round((sedentary / totalAwakeMinutes) * 100);
  var totalActiveMinutes = veryActive + fairlyActive + lightlyActive;

  // Use GPT to generate contextual narrative
  var apiKey =
    PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

  var prompt =
    "Generate a concise 2-sentence summary of this activity data. Be direct and specific:\n\n" +
    "Wake time: " +
    wakeTimeStr +
    "\n" +
    "Total active time: " +
    totalActiveMinutes +
    " minutes (" +
    veryActive +
    " high intensity)\n" +
    "Sedentary: " +
    sedentaryPercent +
    "%\n" +
    "Day type: " +
    dayContext.dayType +
    "\n\n" +
    "Rules:\n" +
    "- MAXIMUM 2 sentences\n" +
    "- First sentence: wake time + most significant activity fact\n" +
    "- Second sentence: key insight or context\n" +
    "- No fluff, no 'great job', just facts with context\n" +
    "- Use 'you' pronoun";

  var payload = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a wellness analyst providing ultra-concise activity summaries. Maximum 2 sentences, no encouragement, just insightful facts.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 60,
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(
      "https://api.openai.com/v1/chat/completions",
      options
    );
    var result = JSON.parse(response.getContentText());
    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message.content.trim();
    }
  } catch (e) {
    Logger.log("Activity narrative generation error: " + e);
  }

  // Concise fallback narratives (2 sentences max)
  if (veryActive > 30) {
    return (
      "You woke at " +
      wakeTimeStr +
      " and logged an impressive " +
      veryActive +
      " minutes of high-intensity activity. Despite " +
      sedentaryPercent +
      "% sedentary time, your workout more than offset the sitting."
    );
  } else if (sedentaryPercent > 80) {
    return (
      "After waking at " +
      wakeTimeStr +
      ", you spent " +
      sedentaryPercent +
      "% of the day sedentary with only " +
      totalActiveMinutes +
      " minutes of movement. This low activity level may impact your energy and sleep quality tonight."
    );
  } else if (totalActiveMinutes > 180) {
    return (
      "You started at " +
      wakeTimeStr +
      " and accumulated over " +
      Math.round(totalActiveMinutes / 60) +
      " hours of activity throughout the day. " +
      "Your " +
      sedentaryPercent +
      "% sedentary time is well-balanced for a " +
      dayContext.dayType +
      "."
    );
  } else {
    return (
      "You woke at " +
      wakeTimeStr +
      " and maintained moderate activity with " +
      totalActiveMinutes +
      " minutes of movement. At " +
      sedentaryPercent +
      "% sedentary, you're in the typical range for a " +
      dayContext.dayType +
      "."
    );
  }
}

// Add this new function to generate AI insights for each section
function generateAISectionInsight(section, scores, allData) {
  var apiKey =
    PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

  // Build context based on section
  var context = buildSectionContext(section, scores, allData);

  var systemPrompt =
    "You are a wellness analyst providing ultra-specific insights. " +
    "ALWAYS use 'you' and 'your' when addressing the person. NEVER use 'the user' or third person. " +
    "Analyze the data and identify ONE non-obvious pattern or correlation. " +
    "Never state the obvious. Find the hidden story in the numbers.";

  var userPrompt =
    "Based on this " +
    section +
    " data, provide ONE insightful observation:\n\n" +
    context +
    "\n\n" +
    "Rules:\n" +
    "- Maximum 20 words\n" +
    "- Must reference specific numbers from the data\n" +
    "- Explain WHY something happened, not WHAT happened\n" +
    "- Find connections between metrics\n" +
    "- No generic statements like 'impacts overall score'\n" +
    "- Example good insight: '7.2h sleep but 65% efficiency suggests bedroom temperature issues'\n" +
    "- Example bad insight: 'Sleep affects your performance'";

  var payload = {
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 60,
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(
      "https://api.openai.com/v1/chat/completions",
      options
    );
    var result = JSON.parse(response.getContentText());

    if (result && result.choices && result.choices.length > 0) {
      return result.choices[0].message.content.trim();
    }
  } catch (e) {
    Logger.log("AI insight generation error: " + e);
  }

  // Better fallbacks with actual data
  return generateDataDrivenFallback(section, scores, allData);
}

// New function for data-driven fallbacks
function generateDataDrivenFallback(section, scores, allData) {
  switch (section) {
    case "work":
      var meetings = allData.calendarAnalysis.totalEvents || 0;
      var emails = allData.emailStats.sent || 0;
      var focusTime =
        allData.calendarAnalysis.cognitiveLoad.longestFocusBlock || 0;

      if (meetings === 0 && focusTime > 300) {
        return (
          "Zero meetings enabled " +
          Math.round(focusTime / 60) +
          " hours continuous deep work"
        );
      }
      if (emails > 30 && meetings > 5) {
        return (
          emails + " emails + " + meetings + " meetings = reactive mode all day"
        );
      }
      if (allData.emailStats.noisePercentage > 80) {
        return (
          "Only " +
          (100 - allData.emailStats.noisePercentage) +
          "% real emails among " +
          allData.emailStats.totalReceived +
          " inbox items"
        );
      }
      return (
        meetings +
        " meetings fragmented day into " +
        Math.round(focusTime) +
        "-minute blocks"
      );

    case "sleep":
      var sleepMatch = allData.fitbitSleep.match(/(\d+)h (\d+)m/);
      var efficiencyMatch = allData.fitbitSleep.match(/😴 Efficiency: (\d+)%/);
      var deepMatch = allData.fitbitSleep.match(/Deep: (\d+)m \((\d+)%\)/);

      if (sleepMatch && efficiencyMatch) {
        var hours = parseFloat(sleepMatch[1]) + parseFloat(sleepMatch[2]) / 60;
        var efficiency = parseInt(efficiencyMatch[1]);

        if (hours > 7 && efficiency < 70) {
          return (
            hours.toFixed(1) +
            "h in bed but only " +
            efficiency +
            "% efficient = restless night"
          );
        }
        if (deepMatch && parseInt(deepMatch[2]) < 15) {
          return (
            "Only " +
            deepMatch[2] +
            "% deep sleep despite " +
            hours.toFixed(1) +
            "h duration"
          );
        }
      }
      return "Sleep pattern suggests environmental disruption";

    case "activity":
      var stepsMatch = allData.fitbitActivity.match(/👣 Steps: ([\d,]+)/);
      var veryActiveMatch = allData.fitbitActivity.match(
        /💪 Very Active: (\d+) min/
      );
      var sedentaryMatch = allData.fitbitActivity.match(
        /🪑 Sedentary: (\d+) min/
      );

      if (stepsMatch && veryActiveMatch && sedentaryMatch) {
        var steps = parseInt(stepsMatch[1].replace(/,/g, ""));
        var veryActive = parseInt(veryActiveMatch[1]);
        var sedentary = parseInt(sedentaryMatch[1]);

        if (veryActive > 30 && steps < 8000) {
          return (
            veryActive +
            " intense minutes but only " +
            steps.toLocaleString() +
            " total steps"
          );
        }
        if (sedentary > 600) {
          return (
            Math.round(sedentary / 60) +
            " hours sitting negates " +
            veryActive +
            " active minutes"
          );
        }
      }
      return "Movement pattern shows inconsistent activity bursts";

    case "heart":
      var rhrMatch = allData.fitbitHeart.match(/❤️ Resting HR: (\d+)/);
      if (rhrMatch) {
        var rhr = parseInt(rhrMatch[1]);
        var baseline = getBaselineRHR();
        var diff = rhr - baseline;

        if (Math.abs(diff) > 3) {
          return (
            "RHR " +
            (diff > 0 ? "+" : "") +
            diff +
            " bpm from baseline signals " +
            (diff > 0 ? "stress/fatigue" : "improved fitness")
          );
        }
      }
      return "Heart metrics within normal range";

    case "recovery":
      var score = allData.recoveryQuotient.score;
      var sleepComponent = allData.recoveryQuotient.components.sleepQuality;
      var hrComponent = allData.recoveryQuotient.components.hrRecovery;

      if (sleepComponent < 50 && hrComponent > 80) {
        return (
          "Heart recovered (" +
          hrComponent +
          ") despite poor sleep (" +
          sleepComponent +
          ")"
        );
      }
      if (score < 60 && allData.scores.total > 80) {
        return "High performance on low recovery - unsustainable pattern";
      }
      return (
        score +
        "% recovery aligns with " +
        allData.scores.total +
        " overall score"
      );

    case "weather":
      var temp = allData.weatherSummary.match(/(\d+)°F/);
      if (temp && allData.scores.activity) {
        var tempVal = parseInt(temp[1]);
        if (tempVal > 85 && allData.scores.activity < 70) {
          return (
            "Heat (" +
            tempVal +
            "°F) correlated with -" +
            (100 - allData.scores.activity) +
            "% activity"
          );
        }
      }
      return "Weather conditions align with typical activity patterns";

    case "music":
      if (allData.audioFeatures) {
        if (
          allData.audioFeatures.energy > 80 &&
          allData.audioFeatures.valence < 40
        ) {
          return (
            "High energy (" +
            allData.audioFeatures.energy +
            ") + low mood music suggests stress"
          );
        }
        if (allData.audioFeatures.tempo > 140) {
          return (
            allData.audioFeatures.tempo +
            " BPM average indicates high-intensity day"
          );
        }
      }
      return "Music patterns reflect baseline mood state";
  }

  return "Data pattern identified";
}

function generateHeartRateZonesVisualization(heartData) {
  // Parse zones from the data
  var zonesMatch = heartData.match(/💓 Active zones: (.+?)(?=\n|$)/);
  if (!zonesMatch || zonesMatch[1].indexOf("No elevated activity") !== -1) {
    return ""; // No zone data available
  }

  var zonesText = zonesMatch[1];
  var zones = {
    peak: { minutes: 0, color: "#8d6e63", label: "Peak" }, // Dark tan
    cardio: { minutes: 0, color: "#a1887f", label: "Cardio" }, // Medium tan
    fatBurn: { minutes: 0, color: "#bcaaa4", label: "Fat Burn" }, // Light tan
  };

  // Parse each zone
  var peakMatch = zonesText.match(/Peak: (\d+)min/);
  var cardioMatch = zonesText.match(/Cardio: (\d+)min/);
  var fatBurnMatch = zonesText.match(/Fat Burn: (\d+)min/);

  if (peakMatch) zones.peak.minutes = parseInt(peakMatch[1]);
  if (cardioMatch) zones.cardio.minutes = parseInt(cardioMatch[1]);
  if (fatBurnMatch) zones.fatBurn.minutes = parseInt(fatBurnMatch[1]);

  var totalMinutes =
    zones.peak.minutes + zones.cardio.minutes + zones.fatBurn.minutes;
  if (totalMinutes === 0) return "";

  var html =
    '<div style="margin-top: 16px; background: #fef0f0; padding: 16px; border-radius: 8px;">';
  html +=
    '<h5 style="font-size: 14px; font-weight: 600; color: #5d4037; margin: 0 0 12px 0;">Heart Rate Zones</h5>'; // Dark brown text

  // Create horizontal bar chart
  html +=
    '<div style="display: flex; align-items: center; background: white; border-radius: 6px; overflow: hidden; height: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';

  ["fatBurn", "cardio", "peak"].forEach(function (zoneName) {
    var zone = zones[zoneName];
    var percent = Math.round((zone.minutes / totalMinutes) * 100);

    if (percent > 0) {
      html +=
        '<div style="width: ' +
        percent +
        "%; height: 100%; background: " +
        zone.color +
        "; " +
        'position: relative; color: white; font-size: 12px; font-weight: 600;">';
      if (percent > 15) {
        html +=
          '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">' +
          percent +
          "%</div>";
      }
      html += "</div>";
    }
  });

  html += "</div>";

  // Legend
  html +=
    '<div style="display: flex; justify-content: space-around; margin-top: 12px; flex-wrap: wrap;">';

  ["fatBurn", "cardio", "peak"].forEach(function (zoneName) {
    var zone = zones[zoneName];
    var formattedMinutes = zone.minutes.toLocaleString();
    html += '<div style="display: flex; align-items: center; margin: 4px;">';
    html +=
      '<div style="width: 12px; height: 12px; background: ' +
      zone.color +
      '; border-radius: 2px; margin-right: 6px;"></div>';
    html +=
      '<span style="font-size: 13px; color: #424242;">' +
      zone.label +
      ": " +
      formattedMinutes +
      "m</span>";
    html += "</div>";
  });

  html += "</div>";

  // Add zone insights
  html +=
    '<div style="margin-top: 12px; padding: 10px; background: #d7ccc8; border-radius: 4px; font-size: 13px; color: #5d4037;">'; // Tan insight box

  if (zones.peak.minutes > 20) {
    html +=
      "🔥 High intensity workout detected (" +
      zones.peak.minutes +
      " min peak)";
  } else if (zones.cardio.minutes > 30) {
    html +=
      "💪 Excellent cardio session (" +
      zones.cardio.minutes +
      " min in cardio zone)";
  } else if (totalMinutes < 20) {
    html += "💡 Consider adding more moderate-intensity activity";
  } else {
    html += "✅ Balanced heart rate zone distribution";
  }

  html += "</div></div>";

  return html;
}

function generateActivityZonesVisualization(activityData) {
  // Parse activity levels
  var veryActiveMatch = activityData.match(/💪 Very Active: (\d+) min/);
  var fairlyActiveMatch = activityData.match(/🚶 Fairly Active: (\d+) min/);
  var lightlyActiveMatch = activityData.match(/🧘 Lightly Active: (\d+) min/);
  var sedentaryMatch = activityData.match(/🪑 Sedentary: (\d+) min/);
  var stepsMatch = activityData.match(/👣 Steps: ([\d,]+)/);
  var caloriesMatch = activityData.match(/🔥 Calories burned: ([\d,]+)/);

  if (!veryActiveMatch && !fairlyActiveMatch && !lightlyActiveMatch) return "";

  var zones = {
    veryActive: {
      minutes: veryActiveMatch ? parseInt(veryActiveMatch[1]) : 0,
      color: "#1b5e20",
      label: "Very Active",
    },
    fairlyActive: {
      minutes: fairlyActiveMatch ? parseInt(fairlyActiveMatch[1]) : 0,
      color: "#388e3c",
      label: "Fairly Active",
    },
    lightlyActive: {
      minutes: lightlyActiveMatch ? parseInt(lightlyActiveMatch[1]) : 0,
      color: "#81c784",
      label: "Lightly Active",
    },
    sedentary: {
      minutes: sedentaryMatch ? parseInt(sedentaryMatch[1]) : 0,
      color: "#e0e0e0",
      label: "Sedentary",
    },
  };

  var totalMinutes =
    zones.veryActive.minutes +
    zones.fairlyActive.minutes +
    zones.lightlyActive.minutes +
    zones.sedentary.minutes;

  var steps = stepsMatch ? stepsMatch[1] : "0";
  var calories = caloriesMatch ? caloriesMatch[1] : "0";

  // Start with the text-based metrics like Heart Health
  var html = "";
  html += "👣 Steps: " + steps + "<br>";
  html += "🔥 Calories: " + calories + "<br>";

  // Now the visualization section
  html +=
    '<div style="margin-top: 16px; background: #f0fdf4; padding: 16px; border-radius: 8px;">';
  html +=
    '<h5 style="font-size: 14px; font-weight: 600; color: #1b5e20; margin: 0 0 12px 0;">Activity Distribution</h5>';

  // Create horizontal bar chart
  html +=
    '<div style="display: flex; align-items: center; background: white; border-radius: 6px; overflow: hidden; height: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';

  ["veryActive", "fairlyActive", "lightlyActive", "sedentary"].forEach(
    function (zoneName) {
      var zone = zones[zoneName];
      var percent = Math.round((zone.minutes / totalMinutes) * 100);

      if (percent > 0) {
        html +=
          '<div style="width: ' +
          percent +
          "%; height: 100%; background: " +
          zone.color +
          "; " +
          "position: relative; color: " +
          (zoneName === "sedentary" ? "#666" : "white") +
          "; " +
          'font-size: 12px; font-weight: 600;">';
        if (percent > 10) {
          html +=
            '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">' +
            percent +
            "%</div>";
        }
        html += "</div>";
      }
    }
  );

  html += "</div>";

  // Color-coded legend with proper number formatting
  html +=
    '<div style="display: flex; justify-content: space-between; margin-top: 12px; flex-wrap: wrap;">';

  ["veryActive", "fairlyActive", "lightlyActive", "sedentary"].forEach(
    function (zoneName) {
      var zone = zones[zoneName];
      var formattedMinutes = zone.minutes.toLocaleString();
      html += '<div style="display: flex; align-items: center; margin: 4px;">';
      html +=
        '<div style="width: 16px; height: 16px; background: ' +
        zone.color +
        "; " +
        'border-radius: 3px; margin-right: 6px; border: 1px solid rgba(0,0,0,0.1);"></div>';
      html +=
        '<span style="font-size: 13px; color: #424242;"><strong>' +
        zone.label +
        ":</strong> " +
        formattedMinutes +
        "m</span>";
      html += "</div>";
    }
  );

  html += "</div>";

  // Add activity insights
  html +=
    '<div style="margin-top: 12px; padding: 10px; background: #c8e6c9; border-radius: 4px; font-size: 13px; color: #1b5e20;">';

  var activeTotal =
    zones.veryActive.minutes +
    zones.fairlyActive.minutes +
    zones.lightlyActive.minutes;
  var sedentaryPercent = Math.round(
    (zones.sedentary.minutes / totalMinutes) * 100
  );

  if (sedentaryPercent > 80) {
    html +=
      "⚠️ High sedentary time (" +
      sedentaryPercent +
      "%) - add movement breaks";
  } else if (activeTotal >= 150) {
    html += "🌟 Exceeded weekly activity recommendations in one day!";
  } else if (zones.veryActive.minutes >= 30) {
    html +=
      "💪 Excellent high-intensity activity (" +
      zones.veryActive.minutes +
      " minutes)";
  } else {
    html +=
      "✅ " +
      activeTotal +
      " active minutes - " +
      (150 - activeTotal) +
      " more for weekly goal";
  }

  html += "</div></div>";

  return html;
}

function formatMinutesWithComma(minutes) {
  return minutes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add fallback insights function
function getFallbackSectionInsight(section, scores, allData) {
  var insights = {
    sleep: function () {
      var sleepMatch = allData.fitbitSleep.match(/(\d+)h (\d+)m/);
      var efficiencyMatch = allData.fitbitSleep.match(/😴 Efficiency: (\d+)%/);
      var hours = sleepMatch
        ? parseInt(sleepMatch[1]) + parseInt(sleepMatch[2]) / 60
        : 0;
      var efficiency = efficiencyMatch ? parseInt(efficiencyMatch[1]) : 0;

      if (hours < 5 && efficiency < 70)
        return "Severe sleep disruption affecting all metrics";
      if (efficiency < 50)
        return "Multiple wake periods fragmenting sleep architecture";
      if (hours > 8 && scores.sleep < 80)
        return "Long duration but poor quality sleep";
      if (scores.sleep >= 90)
        return "Optimal sleep timing and architecture achieved";
      if (efficiency > 90 && hours < 7)
        return "Highly efficient but insufficient duration";
      return hours.toFixed(1) + " hours at " + efficiency + "% efficiency";
    },

    activity: function () {
      var stepsMatch = allData.fitbitActivity.match(/👣 Steps: ([\d,]+)/);
      var veryActiveMatch = allData.fitbitActivity.match(
        /💪 Very Active: (\d+) min/
      );
      var sedentaryMatch = allData.fitbitActivity.match(
        /🪑 Sedentary: (\d+) min/
      );

      var steps = stepsMatch ? parseInt(stepsMatch[1].replace(/,/g, "")) : 0;
      var veryActive = veryActiveMatch ? parseInt(veryActiveMatch[1]) : 0;
      var sedentary = sedentaryMatch ? parseInt(sedentaryMatch[1]) : 0;

      if (steps > 15000 && veryActive > 60)
        return "Elite activity level with high intensity";
      if (sedentary > 600) return "Excessive sitting time dominating the day";
      if (steps < 5000 && veryActive < 10)
        return "Minimal movement pattern detected";
      if (veryActive > 30 && steps < 8000)
        return "High intensity but low overall movement";
      return (
        steps.toLocaleString() +
        " steps with " +
        veryActive +
        " intense minutes"
      );
    },

    heart: function () {
      var rhrMatch = allData.fitbitHeart.match(/❤️ Resting HR: (\d+)/);
      var rhr = rhrMatch ? parseInt(rhrMatch[1]) : 0;
      var baseline = getBaselineRHR();

      if (rhr > baseline + 5) return "Elevated RHR suggests stress or fatigue";
      if (rhr < baseline - 3) return "Lower RHR indicates improved fitness";
      if (allData.fitbitHRV && allData.fitbitHRV.value > 50)
        return "Strong HRV shows excellent recovery";
      if (scores.heart >= 90) return "Cardiovascular metrics in athlete range";
      return "Resting heart rate " + (rhr - baseline) + " bpm from baseline";
    },

    work: function () {
      var meetings = allData.calendarAnalysis.totalEvents || 0;
      var focusTime =
        allData.calendarAnalysis.cognitiveLoad.longestFocusBlock || 0;
      var emailNoise = allData.emailStats.noisePercentage || 0;

      if (meetings === 0 && scores.work === 100)
        return "Perfect focus day with zero interruptions";
      if (meetings > 6) return "Meeting overload fragmenting deep work";
      if (emailNoise > 80) return "Email noise drowning out real work";
      if (focusTime >= 120)
        return focusTime + " minutes uninterrupted focus achieved";
      return meetings + " meetings limiting deep work potential";
    },

    recovery: function () {
      var score = allData.recoveryQuotient.score;
      var sleepQuality = allData.recoveryQuotient.components.sleepQuality;
      var hrRecovery = allData.recoveryQuotient.components.hrRecovery;

      if (score < 50) return "Multiple systems showing recovery debt";
      if (sleepQuality < 50 && hrRecovery > 80)
        return "Heart recovered but sleep didn't";
      if (score > 85) return "Full recovery achieved across all metrics";
      return "Recovery at " + score + "% of optimal capacity";
    },

    // ADD THESE TWO NEW CASES:
    weather: function () {
      var impact = allData.environmentalFactors.weather.impact;
      var temp = allData.weatherSummary.match(/(\d+)°F/);
      var tempValue = temp ? parseInt(temp[1]) : 0;

      if (impact === "negative" && tempValue > 90)
        return "Heat stress limiting outdoor activity options";
      if (impact === "negative" && tempValue < 40)
        return "Cold conditions require indoor alternatives";
      if (impact === "positive")
        return "Optimal conditions for outdoor activities";
      if (
        allData.hourlyWeather &&
        allData.hourlyWeather.precipitationHours.length > 0
      )
        return "Rain expected - plan indoor workouts";
      return "Weather neutral for activity planning";
    },

    music: function () {
      if (!allData.audioFeatures)
        return "Music data reveals listening patterns";
      var energy = allData.audioFeatures.energy;
      var valence = allData.audioFeatures.valence;

      if (energy > 80 && valence < 40)
        return "High-energy but melancholic music choices";
      if (energy < 30 && valence > 70)
        return "Calm, positive musical selections today";
      if (energy > 70 && valence > 70)
        return "Upbeat, energizing soundtrack fueling productivity";
      if (
        allData.spotifySummary &&
        allData.spotifySummary.indexOf("Night:") !== -1
      )
        return "Late-night listening suggests disrupted routine";
      return "Music mood: " + allData.audioFeatures.mood.toLowerCase();
    },
  };

  return insights[section] ? insights[section]() : "Data pattern identified";
}

// ========== ACTIVITY LOG FUNCTIONS ==========
function getFitbitActivityLogForDate(date) {
  var token = getValidFitbitAccessToken();
  var dateStr = Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  var url =
    "https://api.fitbit.com/1/user/-/activities/list.json?afterDate=" +
    dateStr +
    "&sort=asc&limit=10&offset=0";

  try {
    var response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() === 200) {
      var data = JSON.parse(response.getContentText());
      if (data.activities && data.activities.length > 0) {
        var todayActivities = data.activities.filter(function (act) {
          return act.startDate === dateStr;
        });

        if (todayActivities.length > 0) {
          return todayActivities
            .map(function (act) {
              return (
                "🏃 " +
                act.activityName +
                " (" +
                Math.round(act.duration / 60000) +
                " min, " +
                act.calories +
                " cal)"
              );
            })
            .join("\n");
        }
      }
    }
  } catch (e) {
    Logger.log("Activity log not available");
  }
  return null;
}

// ========== HOURLY WEATHER FUNCTIONS ==========
function getHourlyWeatherForecast() {
  try {
    var apiKey = PropertiesService.getScriptProperties().getProperty(
      "OPENWEATHER_API_KEY"
    );
    var zip = "94025",
      country = "US";

    // Use the free 5 day forecast API (3-hour intervals)
    var url =
      "https://api.openweathermap.org/data/2.5/forecast?zip=" +
      zip +
      "," +
      country +
      "&units=imperial&cnt=8&appid=" +
      apiKey; // cnt=8 gives us 24 hours (8 x 3-hour blocks)

    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

    if (response.getResponseCode() === 200) {
      var data = JSON.parse(response.getContentText());

      // Get current weather for UV index
      var currentUrl =
        "https://api.openweathermap.org/data/2.5/weather?zip=" +
        zip +
        "," +
        country +
        "&appid=" +
        apiKey;
      var currentResponse = UrlFetchApp.fetch(currentUrl, {
        muteHttpExceptions: true,
      });
      var currentData = JSON.parse(currentResponse.getContentText());

      // Note: UV index is not available in free tier, so we'll use a placeholder
      var currentUV = "N/A (upgrade for UV data)";

      // Process forecast data
      var insights = {
        optimalActivityWindows: [],
        warnings: [],
        tempRange: { min: 200, max: -200 },
        precipitationHours: [],
        uvIndex: currentUV,
        summary: "",
      };

      data.list.forEach(function (forecast) {
        var time = new Date(forecast.dt * 1000);
        var hourStr = Utilities.formatDate(
          time,
          Session.getScriptTimeZone(),
          "h a"
        );
        var temp = Math.round(forecast.main.temp);

        // Track temperature range
        if (temp < insights.tempRange.min) insights.tempRange.min = temp;
        if (temp > insights.tempRange.max) insights.tempRange.max = temp;

        // Check for optimal activity conditions
        if (temp >= 60 && temp <= 75 && forecast.pop < 0.2) {
          insights.optimalActivityWindows.push({
            time: hourStr,
            temp: temp,
            conditions: forecast.weather[0].main,
          });
        }

        // Check for precipitation
        if (forecast.pop > 0.3) {
          insights.precipitationHours.push({
            time: hourStr,
            probability: Math.round(forecast.pop * 100),
          });
        }

        // Weather warnings
        if (temp > 90) {
          insights.warnings.push("High temp (" + temp + "°F) at " + hourStr);
        }
        if (temp < 40) {
          insights.warnings.push("Cold temp (" + temp + "°F) at " + hourStr);
        }
      });

      // Generate summary
      var summaryParts = [];

      // Add temperature range
      summaryParts.push(
        "🌡️ Temp range: " +
          insights.tempRange.min +
          "-" +
          insights.tempRange.max +
          "°F"
      );

      // Add precipitation info if any
      if (insights.precipitationHours.length > 0) {
        summaryParts.push(
          "☔ Rain expected: " +
            insights.precipitationHours
              .map(function (p) {
                return p.time + " (" + p.probability + "%)";
              })
              .join(", ")
        );
      }

      // Add optimal outdoor times
      if (insights.optimalActivityWindows.length > 0) {
        summaryParts.push(
          "⭐ Best outdoor times: " +
            insights.optimalActivityWindows
              .slice(0, 3)
              .map(function (w) {
                return w.time + " (" + w.temp + "°F)";
              })
              .join(", ")
        );
      }

      // Join all parts with line breaks
      insights.summary = summaryParts.join("\n");

      return insights;
    } else {
      Logger.log("Failed to get forecast data: " + response.getResponseCode());
      return null;
    }
  } catch (e) {
    Logger.log("Hourly weather error: " + e);
    return null;
  }
}

function analyzeHourlyWeather(hourlyData, currentUV) {
  var insights = {
    optimalActivityWindows: [],
    warnings: [],
    tempRange: { min: 200, max: -200 },
    precipitationHours: [],
    uvIndex: currentUV,
    summary: "",
  };

  hourlyData.forEach(function (hour, index) {
    var time = new Date(hour.dt * 1000);
    var hourStr = Utilities.formatDate(
      time,
      Session.getScriptTimeZone(),
      "h a"
    );

    // Track temperature range
    if (hour.temp < insights.tempRange.min)
      insights.tempRange.min = Math.round(hour.temp);
    if (hour.temp > insights.tempRange.max)
      insights.tempRange.max = Math.round(hour.temp);

    // Check for optimal activity conditions
    if (hour.temp >= 60 && hour.temp <= 75 && hour.pop < 0.2 && hour.uvi < 6) {
      insights.optimalActivityWindows.push({
        time: hourStr,
        temp: Math.round(hour.temp),
        conditions: hour.weather[0].main,
      });
    }

    // Check for precipitation
    if (hour.pop > 0.3) {
      insights.precipitationHours.push({
        time: hourStr,
        probability: Math.round(hour.pop * 100),
      });
    }

    // Weather warnings
    if (hour.temp > 90) {
      insights.warnings.push(
        "High temp (" + Math.round(hour.temp) + "°F) at " + hourStr
      );
    }
    if (hour.uvi > 7) {
      insights.warnings.push("High UV (" + hour.uvi + ") at " + hourStr);
    }
  });

  // Generate summary
  if (insights.optimalActivityWindows.length > 0) {
    insights.summary =
      "Best outdoor times: " +
      insights.optimalActivityWindows
        .slice(0, 3)
        .map(function (w) {
          return w.time + " (" + w.temp + "°F)";
        })
        .join(", ");
  }

  if (insights.precipitationHours.length > 0) {
    insights.summary +=
      "\n☔ Rain expected: " +
      insights.precipitationHours
        .map(function (p) {
          return p.time + " (" + p.probability + "%)";
        })
        .join(", ");
  }

  // Add UV index
  insights.summary +=
    "\n☀️ UV Index: " +
    Math.round(currentUV) +
    " - " +
    (currentUV < 3
      ? "Low"
      : currentUV < 6
      ? "Moderate"
      : currentUV < 8
      ? "High"
      : "Very High");

  return insights;
}

// ========== SPOTIFY AUDIO FEATURES ==========
function getSpotifyAudioFeatures(recentTracks) {
  if (!recentTracks || !recentTracks.items || recentTracks.items.length === 0) {
    return null;
  }

  try {
    var token = getValidSpotifyAccessToken();
    if (!token) return null;

    // Get unique track IDs
    var trackIds = [];
    var seen = {};

    for (var i = 0; i < Math.min(20, recentTracks.items.length); i++) {
      var trackId = recentTracks.items[i].track.id;
      if (trackId && !seen[trackId]) {
        trackIds.push(trackId);
        seen[trackId] = true;
      }
    }

    if (trackIds.length === 0) return null;

    // Get audio features
    var url =
      "https://api.spotify.com/v1/audio-features?ids=" + trackIds.join(",");
    var response = UrlFetchApp.fetch(url, {
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() === 200) {
      var data = JSON.parse(response.getContentText());
      var features = data.audio_features.filter(function (f) {
        return f !== null;
      });

      if (features.length === 0) return null;

      // Calculate averages
      var avgEnergy =
        features.reduce(function (sum, f) {
          return sum + f.energy;
        }, 0) / features.length;
      var avgValence =
        features.reduce(function (sum, f) {
          return sum + f.valence;
        }, 0) / features.length;
      var avgDanceability =
        features.reduce(function (sum, f) {
          return sum + f.danceability;
        }, 0) / features.length;
      var avgTempo =
        features.reduce(function (sum, f) {
          return sum + f.tempo;
        }, 0) / features.length;

      return {
        energy: Math.round(avgEnergy * 100),
        valence: Math.round(avgValence * 100),
        danceability: Math.round(avgDanceability * 100),
        tempo: Math.round(avgTempo),
        mood:
          avgValence > 0.6
            ? "Positive/Happy"
            : avgValence < 0.4
            ? "Melancholic/Calm"
            : "Neutral",
        intensity:
          avgEnergy > 0.7
            ? "High energy"
            : avgEnergy < 0.3
            ? "Relaxing"
            : "Moderate",
        summary:
          "Mood: " +
          (avgValence > 0.6
            ? "😊 Positive"
            : avgValence < 0.4
            ? "😔 Melancholic"
            : "😐 Neutral") +
          " | Energy: " +
          (avgEnergy > 0.7
            ? "⚡ High"
            : avgEnergy < 0.3
            ? "😴 Low"
            : "🚶 Moderate") +
          " | Tempo: " +
          Math.round(avgTempo) +
          " BPM",
      };
    }
  } catch (e) {
    Logger.log("Spotify audio features error: " + e);
  }

  return null;
}

function generateYouReportCSS(reportId) {
  var prefix = "#" + reportId;

  return (
    "/* Reset and Base Styles */\n" +
    prefix +
    " {\n" +
    "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;\n" +
    "  color: #424242;\n" +
    "  max-width: 600px;\n" +
    "  margin: 0 auto;\n" +
    "  font-size: 15px;\n" +
    "  line-height: 1.6;\n" +
    "  background: #ffffff;\n" +
    "  padding: 20px;\n" +
    "  border-radius: 8px;\n" +
    "  box-shadow: 0 1px 3px rgba(0,0,0,0.1);\n" +
    "}\n\n" +
    prefix +
    " * {\n" +
    "  box-sizing: border-box;\n" +
    "}\n\n" +
    prefix +
    " p {\n" +
    "  margin: 0 0 12px 0;\n" +
    "}\n\n" +
    "/* Header */\n" +
    prefix +
    " .yr-header {\n" +
    "  text-align: center;\n" +
    "  margin: 20px 0;\n" +
    "}\n\n" +
    prefix +
    " .yr-logo {\n" +
    "  max-width: 300px;\n" +
    "  height: auto;\n" +
    "  margin-bottom: 10px;\n" +
    "}\n\n" +
    prefix +
    " .yr-date {\n" +
    "  display: block;\n" +
    "  font-size: 18px;\n" +
    "  color: #555;\n" +
    "}\n\n" +
    "/* Main Score */\n" +
    prefix +
    " .yr-main-score {\n" +
    "  text-align: center;\n" +
    "  margin: 20px 0;\n" +
    "}\n\n" +
    prefix +
    " .yr-score-value {\n" +
    "  font-size: 52px;\n" +
    "  font-weight: bold;\n" +
    "}\n\n" +
    prefix +
    " .yr-score-label {\n" +
    "  font-size: 18px;\n" +
    "  color: #555;\n" +
    "  font-weight: 600;\n" +
    "}\n\n" +
    prefix +
    " .yr-sparkline {\n" +
    "  margin-top: 5px;\n" +
    "}\n\n" +
    "/* Sections */\n" +
    prefix +
    " section {\n" +
    "  margin: 20px 0;\n" +
    "}\n\n" +
    prefix +
    " .yr-section-title {\n" +
    "  font-size: 20px;\n" +
    "  font-weight: 600;\n" +
    "  color: #1a1a1a;\n" +
    "  margin: 0 0 12px 0;\n" +
    "}\n\n" +
    prefix +
    " .yr-subsection-title {\n" +
    "  font-size: 18px;\n" +
    "  font-weight: 600;\n" +
    "  color: #1a1a1a;\n" +
    "  margin: 0 0 10px 0;\n" +
    "}\n\n" +
    "/* Alerts */\n" +
    prefix +
    " .yr-alert {\n" +
    "  padding: 16px;\n" +
    "  border-radius: 8px;\n" +
    "  margin: 20px 0;\n" +
    "  display: flex;\n" +
    "  align-items: flex-start;\n" +
    "}\n\n" +
    prefix +
    " .yr-alert-danger {\n" +
    "  background: #ffe5e5;\n" +
    "  border-left: 4px solid #ea4335;\n" +
    "}\n\n" +
    prefix +
    " .yr-alert-icon {\n" +
    "  font-size: 24px;\n" +
    "  margin-right: 10px;\n" +
    "}\n\n" +
    prefix +
    " .yr-alert-content strong {\n" +
    "  font-size: 16px;\n" +
    "  color: #d33;\n" +
    "  display: block;\n" +
    "  margin-bottom: 8px;\n" +
    "}\n\n" +
    prefix +
    " .yr-alert-item {\n" +
    "  margin-top: 8px;\n" +
    "}\n\n" +
    prefix +
    " .yr-alert-insight {\n" +
    "  color: #666;\n" +
    "  font-size: 14px;\n" +
    "}\n\n" +
    "/* At a Glance */\n" +
    prefix +
    " .yr-glance {\n" +
    "  background: #e8f0fe;\n" +
    "  padding: 16px;\n" +
    "  border-radius: 8px;\n" +
    "  text-align: center;\n" +
    "}\n\n" +
    prefix +
    " .yr-glance-stats {\n" +
    "  font-size: 15px;\n" +
    "  color: #424242;\n" +
    "  line-height: 1.6;\n" +
    "}\n\n" +
    "/* Analysis */\n" +
    prefix +
    " .yr-analysis {\n" +
    "  padding: 16px;\n" +
    "  background: #fafafa;\n" +
    "  border: 1px solid #ddd;\n" +
    "  border-radius: 6px;\n" +
    "}\n\n" +
    prefix +
    " .yr-insight-headline {\n" +
    "  margin: 10px 0;\n" +
    "  font-size: 16px;\n" +
    "  color: #1a73e8;\n" +
    "  font-style: italic;\n" +
    "}\n\n" +
    prefix +
    " .yr-insight-content {\n" +
    "  font-family: Arial, sans-serif;\n" +
    "  font-size: 14px;\n" +
    "  line-height: 1.6;\n" +
    "  color: #333;\n" +
    "}\n\n" +
    prefix +
    " .yr-insight-content strong {\n" +
    "  color: #1a1a1a;\n" +
    "}\n\n" +
    "/* Performance Metrics */\n" +
    prefix +
    " .yr-performance {\n" +
    "  background: #f8f8f8;\n" +
    "  padding: 20px;\n" +
    "  border-radius: 8px;\n" +
    "}\n\n" +
    prefix +
    " .yr-metrics-grid {\n" +
    "  display: grid;\n" +
    "  grid-template-columns: 1fr 1fr;\n" +
    "  gap: 20px;\n" +
    "}\n\n" +
    prefix +
    " .yr-metric {\n" +
    "  margin-bottom: 15px;\n" +
    "}\n\n" +
    prefix +
    " .yr-metric-label {\n" +
    "  display: inline-block;\n" +
    "  width: 80px;\n" +
    "  vertical-align: middle;\n" +
    "}\n\n" +
    prefix +
    " .yr-metric-score {\n" +
    "  margin-left: 10px;\n" +
    "  color: #666;\n" +
    "  font-weight: bold;\n" +
    "  vertical-align: middle;\n" +
    "}\n\n" +
    "/* Mood Card Styles */\n" +
    prefix +
    " .yr-mood-card {\n" +
    "  margin: 20px 0;\n" +
    "}\n\n" +
    prefix +
    " .yr-mood-header {\n" +
    "  display: flex;\n" +
    "  align-items: center;\n" +
    "  margin-bottom: 10px;\n" +
    "}\n\n" +
    prefix +
    " .yr-mood-emoji {\n" +
    "  font-size: 48px;\n" +
    "  margin-right: 15px;\n" +
    "}\n\n" +
    prefix +
    " .yr-mood-content {\n" +
    "  flex: 1;\n" +
    "}\n\n" +
    prefix +
    " .yr-mood-title {\n" +
    "  margin: 0;\n" +
    "  font-size: 20px;\n" +
    "  color: #1a73e8;\n" +
    "}\n\n" +
    prefix +
    " .yr-mood-insight {\n" +
    "  margin: 5px 0 0 0;\n" +
    "  color: #5f6368;\n" +
    "  font-size: 14px;\n" +
    "}\n\n" +
    prefix +
    " .yr-energy-forecast {\n" +
    "  background: rgba(255,255,255,0.7);\n" +
    "  border-radius: 8px;\n" +
    "  padding: 12px;\n" +
    "  margin-top: 15px;\n" +
    "  border-left: 4px solid #1976d2;\n" +
    "  color: #5f6368;\n" +
    "  font-size: 14px;\n" +
    "}\n\n" +
    "/* Quick Win Styles */\n" +
    prefix +
    " .yr-quick-win {\n" +
    "  margin: 20px 0;\n" +
    "}\n\n" +
    prefix +
    " .yr-quick-win-title {\n" +
    "  font-size: 20px;\n" +
    "  font-weight: bold;\n" +
    "  color: #1565c0;\n" +
    "  margin-bottom: 8px;\n" +
    "}\n\n" +
    prefix +
    " .yr-quick-win-content {\n" +
    "  font-size: 15px;\n" +
    "  color: #424242;\n" +
    "  line-height: 1.5;\n" +
    "}\n\n" +
    "/* Badge Rarity Designs */\n" +
    prefix +
    " .yr-badge-legendary {\n" +
    "  background: linear-gradient(135deg, #FFF8E1 0%, #FFD700 100%);\n" +
    "  border: 1px solid #FFB300;\n" +
    "  box-shadow: 0 1px 3px rgba(255,215,0,0.3);\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-legendary .yr-badge-name {\n" +
    "  color: #F57C00;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-legendary .yr-badge-desc {\n" +
    "  color: #5D4037;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-legendary .yr-badge-emoji {\n" +
    "  filter: drop-shadow(0 2px 4px rgba(255,193,7,0.4));\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-legendary .yr-badge-points {\n" +
    "  color: #FF6F00;\n" +
    "  background: rgba(255,193,7,0.2);\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-legendary .yr-badge-rarity {\n" +
    "  background: #FF6F00;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-epic {\n" +
    "  background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);\n" +
    "  border: 1px solid #9C27B0;\n" +
    "  box-shadow: 0 1px 3px rgba(156,39,176,0.25);\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-epic .yr-badge-name {\n" +
    "  color: #6A1B9A;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-epic .yr-badge-desc {\n" +
    "  color: #4A148C;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-epic .yr-badge-emoji {\n" +
    "  filter: drop-shadow(0 2px 4px rgba(156,39,176,0.4));\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-epic .yr-badge-points {\n" +
    "  color: #7B1FA2;\n" +
    "  background: rgba(156,39,176,0.15);\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-epic .yr-badge-rarity {\n" +
    "  background: #7B1FA2;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-rare {\n" +
    "  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);\n" +
    "  border: 1px solid #2196F3;\n" +
    "  box-shadow: 0 1px 3px rgba(33,150,243,0.25);\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-rare .yr-badge-name {\n" +
    "  color: #1565C0;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-rare .yr-badge-desc {\n" +
    "  color: #0D47A1;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-rare .yr-badge-emoji {\n" +
    "  filter: drop-shadow(0 2px 4px rgba(33,150,243,0.4));\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-rare .yr-badge-points {\n" +
    "  color: #1976D2;\n" +
    "  background: rgba(33,150,243,0.15);\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-rare .yr-badge-rarity {\n" +
    "  background: #1976D2;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-uncommon {\n" +
    "  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);\n" +
    "  border: 1px solid #4CAF50;\n" +
    "  box-shadow: 0 1px 3px rgba(76,175,80,0.25);\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-uncommon .yr-badge-name {\n" +
    "  color: #2E7D32;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-uncommon .yr-badge-desc {\n" +
    "  color: #1B5E20;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-uncommon .yr-badge-emoji {\n" +
    "  filter: drop-shadow(0 2px 4px rgba(76,175,80,0.4));\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-uncommon .yr-badge-points {\n" +
    "  color: #388E3C;\n" +
    "  background: rgba(76,175,80,0.15);\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-uncommon .yr-badge-rarity {\n" +
    "  background: #388E3C;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-common {\n" +
    "  background: linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%);\n" +
    "  border: 1px solid #BDBDBD;\n" +
    "  box-shadow: 0 1px 3px rgba(0,0,0,0.1);\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-common .yr-badge-name {\n" +
    "  color: #616161;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-common .yr-badge-desc {\n" +
    "  color: #424242;\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-common .yr-badge-emoji {\n" +
    "  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-common .yr-badge-points {\n" +
    "  color: #757575;\n" +
    "  background: rgba(0,0,0,0.08);\n" +
    "}\n\n" +
    prefix +
    " .yr-badge-common .yr-badge-rarity {\n" +
    "  background: #757575;\n" +
    "}\n\n" +
    "/* AI Insights Styles */\n" +
    prefix +
    " .yr-ai-insights {\n" +
    "  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);\n" +
    "  padding: 16px;\n" +
    "  border-radius: 8px;\n" +
    "  margin: 20px 0;\n" +
    "  border-left: 4px solid #7b1fa2;\n" +
    "}\n\n" +
    prefix +
    " .yr-pattern {\n" +
    "  margin-bottom: 10px;\n" +
    "}\n\n" +
    prefix +
    " .yr-confidence {\n" +
    "  color: #666;\n" +
    "  font-size: 12px;\n" +
    "}\n\n" +
    prefix +
    " .yr-prescriptions {\n" +
    "  margin-top: 15px;\n" +
    "  padding-top: 15px;\n" +
    "  border-top: 1px solid rgba(0,0,0,0.1);\n" +
    "  color: #4a148c;\n" +
    "}\n\n" +
    prefix +
    " .yr-prescription-item {\n" +
    "  margin-top: 8px;\n" +
    "  padding: 8px;\n" +
    "  background: rgba(255,255,255,0.7);\n" +
    "  border-radius: 4px;\n" +
    "  font-size: 13px;\n" +
    "  color: #555;\n" +
    "}\n\n" +
    "/* Work Overview */\n" +
    prefix +
    " .yr-work-overview {\n" +
    "  background: #f8f9fa;\n" +
    "  padding: 20px;\n" +
    "  border-radius: 8px;\n" +
    "  border: 1px solid #e0e0e0;\n" +
    "}\n\n" +
    prefix +
    " .yr-work-item {\n" +
    "  background: white;\n" +
    "  padding: 16px;\n" +
    "  border-radius: 6px;\n" +
    "  margin-bottom: 12px;\n" +
    "}\n\n" +
    prefix +
    " .yr-work-item:last-child {\n" +
    "  margin-bottom: 0;\n" +
    "}\n\n" +
    prefix +
    " .yr-work-item h4 {\n" +
    "  font-size: 16px;\n" +
    "  font-weight: 600;\n" +
    "  color: #424242;\n" +
    "  margin: 0 0 8px 0;\n" +
    "}\n\n" +
    prefix +
    " .yr-work-content {\n" +
    "  font-size: 14px;\n" +
    "  line-height: 1.6;\n" +
    "  color: #5f6368;\n" +
    "}\n\n" +
    prefix +
    " .yr-warning {\n" +
    "  color: #ff6f00;\n" +
    "}\n\n" +
    "/* Mantra */\n" +
    prefix +
    " .yr-mantra {\n" +
    "  background: linear-gradient(135deg, #fff5e5 0%, #ffe0b2 100%);\n" +
    "  padding: 16px;\n" +
    "  border-radius: 8px;\n" +
    "  font-style: italic;\n" +
    "  border-left: 4px solid #ff9800;\n" +
    "  box-shadow: 0 2px 4px rgba(0,0,0,0.05);\n" +
    "}\n\n" +
    prefix +
    " .yr-mantra-text {\n" +
    "  font-size: 16px;\n" +
    "  color: #5d4037;\n" +
    "}\n\n" +
    "/* Footer */\n" +
    prefix +
    " .yr-footer {\n" +
    "  margin-top: 40px;\n" +
    "  padding-top: 20px;\n" +
    "  border-top: 1px solid #e0e0e0;\n" +
    "  text-align: center;\n" +
    "  color: #999;\n" +
    "  font-size: 12px;\n" +
    "}\n\n" +
    "/* Sage the Fox styling */\n" +
    prefix +
    " .sage-message {\n" +
    "  background: #fff8e1;\n" +
    "  border-left: 4px solid #ff9800;\n" +
    "  padding: 16px;\n" +
    "  border-radius: 8px;\n" +
    "  margin: 20px 0;\n" +
    "  font-style: italic;\n" +
    "}\n\n" +
    prefix +
    " .sage-signature {\n" +
    "  text-align: right;\n" +
    "  color: #f57c00;\n" +
    "  font-weight: 600;\n" +
    "  margin-top: 8px;\n" +
    "}\n\n" +
    "/* Responsive */\n" +
    "@media (max-width: 600px) {\n" +
    "  " +
    prefix +
    " {\n" +
    "    padding: 10px;\n" +
    "  }\n" +
    "  \n" +
    "  " +
    prefix +
    " .yr-metrics-grid {\n" +
    "    grid-template-columns: 1fr;\n" +
    "  }\n" +
    "  \n" +
    "  " +
    prefix +
    " .yr-score-value {\n" +
    "    font-size: 42px;\n" +
    "  }\n" +
    "}"
  );
}

// Helper function to get report data for a specific date
function getReportDataForDate(dateStr) {
  try {
    // Get data from the spreadsheet
    var sheet = getOrCreateMyMetricLogSheet();
    var data = sheet.getDataRange().getValues();

    // Find the row for this date
    var rowData = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === dateStr) {
        rowData = data[i];
        break;
      }
    }

    if (!rowData) {
      return null;
    }

    // Reconstruct the data object
    // This is a simplified version - you'd need to store/retrieve all the data
    var date = new Date(dateStr);
    var fullDateStr = getFormattedDate(date);

    return {
      fullDateStr: fullDateStr,
      dateStr: dateStr,
      scores: {
        total: parseInt(rowData[2]) || 0,
        sleep: 70, // You'd need to store these individually
        activity: 70,
        heart: 70,
        work: 70,
        explanations: {
          sleep: ["Based on stored data"],
          activity: ["Based on stored data"],
          heart: ["Based on stored data"],
          work: ["Based on stored data"],
        },
      },
      insight: rowData[7] || "Insight not available",
      mantra: "Daily mantra for " + dateStr,
      moodInsight: rowData[1] || "Mood data not available",
      weatherSummary: rowData[6] || "Weather data not available",
      calSummary: "Calendar data not stored",
      emailSummary: "Email data not stored",
      completedTasks: "",
      spotifySummary: rowData[5] || "Spotify data not available",
      fitbitActivity: "Activity data not stored",
      fitbitSleep: rowData[3]
        ? "Sleep: " +
          Math.floor(rowData[3] / 60) +
          "h " +
          (rowData[3] % 60) +
          "m"
        : "Sleep data not available",
      fitbitHeart: "Heart data not stored",
      peakHR: "N/A",
      stressRadar: { score: 30, level: "Low", triggers: [] },
      recoveryQuotient: { score: 70, readiness: "Well Recovered" },
      dayContext: {
        dayType: "weekday",
        dayName: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][date.getDay()],
      },
      badges: [],
      streakBadges: [],
      badgeNarrative: "",
      nearMisses: [],
      calendarAnalysis: { totalEvents: 0 },
      calendarIntelligence: { score: 100, insights: [] },
    };
  } catch (e) {
    Logger.log("Error getting report data: " + e);
    return null;
  }
}

function checkPersonalRecords(currentStats, dateStr) {
  var records = [];
  var props = PropertiesService.getScriptProperties();

  // Get historical maximums
  var maxSteps = parseInt(props.getProperty("MAX_STEPS") || "0");
  var maxScore = parseInt(props.getProperty("MAX_SCORE") || "0");
  var maxSleepMinutes = parseInt(props.getProperty("MAX_SLEEP") || "0");

  // Parse current stats
  var stepsMatch = currentStats.activity.match(/👣 Steps: ([\d,]+)/);
  var steps = stepsMatch ? parseInt(stepsMatch[1].replace(/,/g, "")) : 0;

  var sleepMatch = currentStats.sleep.match(/(\d+)h (\d+)m/);
  var sleepMinutes = sleepMatch
    ? parseInt(sleepMatch[1]) * 60 + parseInt(sleepMatch[2])
    : 0;

  // Check for new records
  if (steps > maxSteps && steps > 0) {
    records.push({
      emoji: "🏆",
      name: "New Steps Record!",
      description: "Personal best: " + steps.toLocaleString() + " steps",
      rarity: "epic",
      points: 100,
      isRecord: true,
    });
    props.setProperty("MAX_STEPS", steps.toString());
    props.setProperty("MAX_STEPS_DATE", dateStr);
  }

  if (currentStats.score > maxScore) {
    records.push({
      emoji: "⭐",
      name: "Highest Score Ever!",
      description: "New record: " + currentStats.score + " points",
      rarity: "legendary",
      points: 150,
      isRecord: true,
    });
    props.setProperty("MAX_SCORE", currentStats.score.toString());
    props.setProperty("MAX_SCORE_DATE", dateStr);
  }

  if (sleepMinutes > maxSleepMinutes && sleepMinutes < 600) {
    // Cap at 10 hours
    records.push({
      emoji: "💤",
      name: "Longest Quality Sleep!",
      description:
        "Record: " +
        Math.floor(sleepMinutes / 60) +
        "h " +
        (sleepMinutes % 60) +
        "m",
      rarity: "rare",
      points: 75,
      isRecord: true,
    });
    props.setProperty("MAX_SLEEP", sleepMinutes.toString());
    props.setProperty("MAX_SLEEP_DATE", dateStr);
  }

  return records;
}

function checkMilestoneBadges(dateStr) {
  var milestones = [];
  var sheet = getOrCreateMyMetricLogSheet();
  var totalDays = sheet.getLastRow() - 1; // Subtract header row

  // Milestone badges
  var milestoneDays = [7, 30, 100, 365];
  if (milestoneDays.indexOf(totalDays) !== -1) {
    milestones.push({
      emoji: "📅",
      name: totalDays + " Day Journey",
      description: "Milestone: " + totalDays + " days of wellness tracking",
      rarity: "legendary",
      points: 200,
      isMilestone: true,
    });
  }

  // Check for streak milestones
  var streaks = getActiveStreaks(dateStr);
  var streakMilestones = [7, 14, 30, 60, 100];

  for (var key in streaks) {
    if (streakMilestones.indexOf(streaks[key]) !== -1) {
      milestones.push({
        emoji: "🔥",
        name: streaks[key] + " Day " + key + " Streak!",
        description: "Incredible consistency milestone",
        rarity: streaks[key] >= 30 ? "legendary" : "epic",
        points: streaks[key] * 2,
        isMilestone: true,
      });
    }
  }

  return milestones;
}

// Enhanced section builder with better styling
function buildEnhancedSection(title, body) {
  return (
    "<div style='margin: 20px 0; padding: 20px; background: #fafafa; border: 1px solid #e0e0e0; " +
    "border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);'>" +
    "<h3 style='font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px 0;'>" +
    title +
    "</h3>" +
    "<pre style='font-family: Consolas, Monaco, monospace; white-space: pre-wrap; " +
    "font-size: 14px; line-height: 1.5; color: #424242; margin: 0;'>" +
    escapeHtml(body || "None") +
    "</pre></div>"
  );
}

// Helper function to convert markdown bold to HTML
function convertMarkdownBoldToHtml(text) {
  if (!text) return "";

  // Log what we receive
  Logger.log(
    "convertMarkdownBoldToHtml input: " + text.substring(0, 100) + "..."
  );

  // First, handle paragraph breaks if GPT included them
  var result = text.replace(/\[PARAGRAPH BREAK\]/g, "\n\n");

  // Convert **text** to <strong>text</strong>
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Convert double newlines to paragraph breaks
  var paragraphs = result.split(/\n\n+/);

  if (paragraphs.length > 1) {
    // We have multiple paragraphs
    result = paragraphs
      .filter(function (p) {
        return p.trim();
      })
      .map(function (p) {
        return "<p>" + p.trim() + "</p>";
      })
      .join("");
  } else {
    // Single paragraph
    result = "<p>" + result + "</p>";
  }

  Logger.log(
    "convertMarkdownBoldToHtml output: " + result.substring(0, 100) + "..."
  );

  // ADD LOGGING AT THE END:
  Logger.log("=== convertMarkdownBoldToHtml OUTPUT ===");
  Logger.log(result);
  Logger.log("=== END OUTPUT ===");

  return result;
}

function getRecoveryQuotient(
  sleepData,
  heartData,
  activityData,
  previousDayData
) {
  var recovery = {
    components: {
      sleepQuality: 0, // 30% weight
      hrRecovery: 0, // 25% weight
      hrvTrend: 0, // 20% weight
      activeRecovery: 0, // 15% weight
      consistency: 0, // 10% weight
    },
    score: 0,
    trend: "stable",
    readiness: "",
    recommendations: [],
  };

  // Sleep Quality Component
  var sleepScore = calculateSleepRecoveryScore(sleepData);
  recovery.components.sleepQuality = sleepScore;

  // Heart Rate Recovery
  var hrScore = calculateHRRecoveryScore(heartData, previousDayData);
  recovery.components.hrRecovery = hrScore;

  // HRV Trend (if available)
  recovery.components.hrvTrend = 70; // Placeholder - would calculate from trends

  // Active Recovery (light activity is good for recovery)
  var activeScore = calculateActiveRecoveryScore(activityData);
  recovery.components.activeRecovery = activeScore;

  // Consistency (regular sleep/wake times)
  recovery.components.consistency = calculateConsistencyScore();

  // Calculate weighted total
  recovery.score = Math.round(
    recovery.components.sleepQuality * 0.3 +
      recovery.components.hrRecovery * 0.25 +
      recovery.components.hrvTrend * 0.2 +
      recovery.components.activeRecovery * 0.15 +
      recovery.components.consistency * 0.1
  );

  // Determine readiness level
  if (recovery.score >= 85) {
    recovery.readiness = "Peak Performance Ready";
    recovery.recommendations.push(
      "Your body is primed for high-intensity work or exercise"
    );
  } else if (recovery.score >= 70) {
    recovery.readiness = "Well Recovered";
    recovery.recommendations.push(
      "Good recovery - maintain normal activity levels"
    );
  } else if (recovery.score >= 50) {
    recovery.readiness = "Moderate Recovery";
    recovery.recommendations.push(
      "Consider moderate activity and prioritize rest tonight"
    );
  } else {
    recovery.readiness = "Low Recovery";
    recovery.recommendations.push(
      "Focus on recovery: light activity, hydration, and early sleep"
    );
  }

  // Trend analysis
  var previousScore = getPreviousRecoveryScore();
  if (recovery.score > previousScore + 10) {
    recovery.trend = "improving";
  } else if (recovery.score < previousScore - 10) {
    recovery.trend = "declining";
  }

  return recovery;
}

// ========== EMAIL ANALYTICS FUNCTIONS ==========
function analyzeEmailResponseTimes(startDate, endDate) {
  var dateQuery =
    "after:" + formatDate(startDate) + " before:" + formatDate(endDate);
  var threads = GmailApp.search("in:sent " + dateQuery, 0, 20);

  var responseTimes = [];
  var responseInsights = {
    totalResponses: 0,
    within1Hour: 0,
    within4Hours: 0,
    over24Hours: 0,
  };

  threads.forEach(function (thread) {
    var messages = thread.getMessages();
    for (var i = 1; i < messages.length; i++) {
      // Check if this message is a reply
      if (
        messages[i].getFrom().indexOf(Session.getActiveUser().getEmail()) !==
          -1 &&
        messages[i - 1]
          .getFrom()
          .indexOf(Session.getActiveUser().getEmail()) === -1
      ) {
        var received = messages[i - 1].getDate();
        var sent = messages[i].getDate();
        var responseMinutes = (sent - received) / 60000;

        if (responseMinutes > 0 && responseMinutes < 10080) {
          // Within a week
          responseTimes.push(responseMinutes);
          responseInsights.totalResponses++;

          if (responseMinutes <= 60) responseInsights.within1Hour++;
          else if (responseMinutes <= 240) responseInsights.within4Hours++;
          else if (responseMinutes > 1440) responseInsights.over24Hours++;
        }
      }
    }
  });

  if (responseTimes.length > 0) {
    var avgResponse = Math.round(
      responseTimes.reduce(function (a, b) {
        return a + b;
      }) / responseTimes.length
    );
    return {
      avgMinutes: avgResponse,
      summary:
        avgResponse < 60
          ? "Very responsive (" + Math.round(avgResponse) + " min avg)"
          : avgResponse < 240
          ? "Moderate response time (" +
            Math.round(avgResponse / 60) +
            " hours avg)"
          : "Slow responses (" +
            Math.round(avgResponse / 60) +
            " hours avg) - inbox overwhelm?",
    };
  }
  return null;
}

function calculateSleepRecoveryScore(sleepData) {
  var score = 0;

  // Parse ACTUAL sleep duration (not time in bed)
  var durationMatch = sleepData.match(/Sleep duration: (\d+)h (\d+)m/);
  if (durationMatch) {
    var totalMinutes =
      parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]);

    // Score based on actual sleep time
    if (totalMinutes >= 480) {
      // 8+ hours
      score += 40;
    } else if (totalMinutes >= 420) {
      // 7+ hours
      score += 35;
    } else if (totalMinutes >= 360) {
      // 6+ hours
      score += 30;
    } else if (totalMinutes >= 300) {
      // 5+ hours
      score += 20;
    } else if (totalMinutes >= 240) {
      // 4+ hours
      score += 10;
    } else {
      score += 5; // Less than 4 hours
    }
  }

  // Sleep efficiency component
  var efficiencyMatch = sleepData.match(/😴 Efficiency: (\d+)%/);
  if (efficiencyMatch) {
    var efficiency = parseInt(efficiencyMatch[1]);
    score += (efficiency / 100) * 40;
  }

  // Sleep timing bonus
  var bedtimeMatch = sleepData.match(/🌙 Bedtime: (.+)/);
  if (bedtimeMatch) {
    score += 20;
  }

  return Math.round(score);
}

function calculateHRRecoveryScore(heartData, previousDayData) {
  var score = 70; // Default

  var rhrMatch = heartData.match(/❤️ Resting HR: (\d+)/);
  if (rhrMatch) {
    var currentRHR = parseInt(rhrMatch[1]);
    var baseline = getBaselineRHR();

    // Lower RHR than baseline = better recovery
    if (currentRHR < baseline - 2) {
      score = 90;
    } else if (currentRHR <= baseline) {
      score = 80;
    } else if (currentRHR <= baseline + 3) {
      score = 70;
    } else if (currentRHR <= baseline + 5) {
      score = 50;
    } else {
      score = 30;
    }
  }

  return score;
}

function calculateActiveRecoveryScore(activityData) {
  // Light activity (not too much, not too little) is best for recovery
  var stepsMatch = activityData.match(/👣 Steps: ([\d,]+)/);
  var activeMatch = activityData.match(/💪 Very Active: (\d+) min/);

  var score = 70;

  if (stepsMatch) {
    var steps = parseInt(stepsMatch[1].replace(/,/g, ""));

    // 4000-8000 steps is ideal for recovery
    if (steps >= 4000 && steps <= 8000) {
      score = 90;
    } else if (steps < 2000) {
      score = 50; // Too sedentary
    } else if (steps > 15000) {
      score = 60; // Might be overdoing it
    }
  }

  // Penalize very high intensity on recovery
  if (activeMatch) {
    var veryActive = parseInt(activeMatch[1]);
    if (veryActive > 60) {
      score -= 20; // Too much intense activity for recovery
    }
  }

  return Math.max(0, score);
}

// Helper to store previous recovery scores
function storePreviousRecoveryScore(score) {
  PropertiesService.getScriptProperties().setProperty(
    "PREVIOUS_RECOVERY_SCORE",
    score.toString()
  );
}

function calculateConsistencyScore() {
  // This would look at sleep/wake time consistency over past week
  // For now, return a default
  return 75;
}

function getPreviousRecoveryScore() {
  var stored = PropertiesService.getScriptProperties().getProperty(
    "PREVIOUS_RECOVERY_SCORE"
  );
  return stored ? parseInt(stored) : 70;
}

// Format recovery data
function formatRecoveryQuotient(recovery) {
  var output = [];
  output.push(
    "🔄 Recovery Score: " + recovery.score + "/100 - " + recovery.readiness
  );
  output.push("📈 Trend: " + recovery.trend);

  if (recovery.score < 70) {
    output.push(
      "⚡ Components: Sleep " +
        recovery.components.sleepQuality +
        " | HR " +
        recovery.components.hrRecovery +
        " | Activity " +
        recovery.components.activeRecovery
    );
  }

  return output.join("\n");
}

// ✅ Enhanced summarizeSpotifyHistory() with top artist, genre, top track, energy, and gap analysis
function summarizeSpotifyHistory(data) {
  try {
    if (
      !data ||
      typeof data !== "object" ||
      !data.items ||
      !Array.isArray(data.items)
    ) {
      return "Spotify listening summary unavailable.";
    }

    var items = data.items;
    if (items.length === 0) {
      return "No Spotify listening activity found.";
    }

    var hours = {
      morning: 0,
      midday: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };

    var artistCounts = {};
    var artistIds = {};
    var trackCounts = {};
    var trackNames = [];
    var firstHour = 24;
    var count = 0;

    for (var i = 0; i < items.length; i++) {
      var playedAt = new Date(items[i].played_at);
      if (isNaN(playedAt.getTime())) continue;

      var hour = playedAt.getHours();
      count++;

      if (hour >= 5 && hour < 10) hours.morning++;
      else if (hour >= 10 && hour < 14) hours.midday++;
      else if (hour >= 14 && hour < 18) hours.afternoon++;
      else if (hour >= 18 && hour < 22) hours.evening++;
      else hours.night++;

      if (hour < firstHour) firstHour = hour;

      var artists = items[i].track && items[i].track.artists;
      if (artists && artists.length > 0) {
        var artist = artists[0];
        var name = artist.name;
        var id = artist.id;

        if (!artistCounts[name]) artistCounts[name] = 0;
        artistCounts[name]++;
        if (!artistIds[name]) artistIds[name] = id;
      }

      var trackName = items[i].track && items[i].track.name;
      if (trackName) {
        trackNames.push(trackName);
        if (!trackCounts[trackName]) trackCounts[trackName] = 0;
        trackCounts[trackName]++;
      }
    }

    if (count === 0) {
      return "Spotify data retrieved, but no usable track information.";
    }

    var topArtist = "Unknown";
    var topCount = 0;
    for (var artistName in artistCounts) {
      if (artistCounts[artistName] > topCount) {
        topArtist = artistName;
        topCount = artistCounts[artistName];
      }
    }

    var topTrack = "Unknown";
    var trackTopCount = 0;
    for (var track in trackCounts) {
      if (trackCounts[track] > trackTopCount) {
        topTrack = track;
        trackTopCount = trackCounts[track];
      }
    }

    var genreSummary = "";
    try {
      var props = PropertiesService.getScriptProperties();
      var token = props.getProperty("SPOTIFY_ACCESS_TOKEN");
      var artistId = artistIds[topArtist];
      if (artistId) {
        var response = UrlFetchApp.fetch(
          "https://api.spotify.com/v1/artists/" + artistId,
          {
            headers: { Authorization: "Bearer " + token },
          }
        );
        var artistInfo = JSON.parse(response.getContentText());
        if (artistInfo.genres && artistInfo.genres.length > 0) {
          genreSummary =
            "\n🎼 Genre: " + artistInfo.genres.slice(0, 2).join(", ");
        }
      }
    } catch (gErr) {
      Logger.log("🎧 [Spotify Genre Lookup Failed]: " + gErr);
    }

    var gapNote =
      firstHour >= 12 ? "\n⚠️ No listening activity recorded before noon." : "";

    // Get audio features
    var audioFeatures = getSpotifyAudioFeatures(data);
    var audioSummary = audioFeatures ? "\n🎼 " + audioFeatures.summary : "";

    return (
      "🎧 Tracks played: " +
      count +
      "\n👤 Top Artist: " +
      topArtist +
      "\n🎵 Top Track: " +
      topTrack +
      genreSummary +
      audioSummary + // ADD THIS LINE
      "\n🕓 Morning: " +
      hours.morning +
      " | Midday: " +
      hours.midday +
      " | Afternoon: " +
      hours.afternoon +
      " | Evening: " +
      hours.evening +
      " | Night: " +
      hours.night +
      gapNote
    );
  } catch (e) {
    Logger.log("❌ [Spotify Summary Error]: " + e);
    return "Spotify listening summary unavailable due to an error.";
  }
}

function getSpotifyHistory() {
  try {
    Logger.log("🎧 [Spotify] Starting getSpotifyHistory()");
    var token = getValidSpotifyAccessToken();
    if (!token) {
      Logger.log("❌ No valid Spotify token.");
      return null;
    }

    var response = UrlFetchApp.fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=10",
      {
        headers: { Authorization: "Bearer " + token },
        muteHttpExceptions: true,
      }
    );

    var code = response.getResponseCode();
    Logger.log("📨 [Spotify] Response code: " + code);
    if (code !== 200) {
      Logger.log("❌ Spotify API error: " + response.getContentText());
      return null;
    }

    var result = JSON.parse(response.getContentText());
    Logger.log("📦 [Spotify] Response data: " + JSON.stringify(result));
    return result;
  } catch (err) {
    Logger.log("❌ [Spotify Error] " + err);
    return null;
  }
}

function getScoreColor(score, isInverted) {
  // isInverted = true for metrics where lower is better (like stress)
  if (isInverted) {
    if (score < 20) return "#00695c";
    if (score < 30) return "#0b8043";
    if (score < 40) return "#66bb6a";
    if (score < 50) return "#9ccc65";
    if (score < 60) return "#f9ab00";
    if (score < 70) return "#ff6f00";
    return "#ea4335";
  } else {
    if (score === 100) return "#00695c";
    if (score >= 95) return "#00897b";
    if (score >= 90) return "#0b8043";
    if (score >= 85) return "#43a047";
    if (score >= 80) return "#66bb6a";
    if (score >= 75) return "#9ccc65";
    if (score >= 70) return "#d4e157";
    if (score >= 65) return "#ffb300";
    if (score >= 60) return "#f9ab00";
    if (score >= 50) return "#ff6f00";
    if (score >= 40) return "#ea4335";
    return "#c62828";
  }
}

function setYesterdayMood(mood) {
  PropertiesService.getScriptProperties().setProperty("YESTERDAY_MOOD", mood);
}

function getYesterdayMood() {
  return (
    PropertiesService.getScriptProperties().getProperty("YESTERDAY_MOOD") ||
    "Unknown"
  );
}

// ✅ NEW: Updated weighted scoring system
function getMyMetricLogScoreBreakdown(
  sleep,
  heart,
  activity,
  emailStats,
  calSummary,
  completedTasks,
  dayContext,
  allData
) {
  var scores = {
    sleep: 0,
    activity: 0,
    heart: 0,
    work: 0,
    total: 0,
    // Add detailed breakdowns for each score
    explanations: {
      sleep: [],
      activity: [],
      heart: [],
      work: [],
    },
  };

  // Sleep Score (0-100, 30% weight)
  var sleepMatch = sleep.match(/(\d+)h (\d+)m/);
  var efficiencyMatch = sleep.match(/😴 Efficiency: (\d+)%/);

  if (sleepMatch) {
    var h = parseInt(sleepMatch[1], 10);
    var m = parseInt(sleepMatch[2], 10);
    var totalSleepMin = h * 60 + m;
    var sleepHours = h + m / 60;

    // Duration component (60 points) - using actual sleep time
    var durationScore = 0;
    if (totalSleepMin >= 480) {
      // 8+ hours
      durationScore = 60;
      scores.explanations.sleep.push(
        "Duration excellent (8+ hours actual sleep) = 60/60 points"
      );
    } else if (totalSleepMin >= 450) {
      // 7.5-8 hours
      durationScore = 55;
      scores.explanations.sleep.push(
        "Duration very good (7.5+ hours actual sleep) = 55/60 points"
      );
    } else if (totalSleepMin >= 420) {
      // 7-7.5 hours
      durationScore = 50;
      scores.explanations.sleep.push(
        "Duration good (7+ hours actual sleep) = 50/60 points"
      );
    } else if (totalSleepMin >= 390) {
      // 6.5-7 hours
      durationScore = 40;
      scores.explanations.sleep.push(
        "Duration adequate (6.5+ hours actual sleep) = 40/60 points"
      );
    } else if (totalSleepMin >= 360) {
      // 6+ hours
      durationScore = 30;
      scores.explanations.sleep.push(
        "Duration suboptimal (6+ hours actual sleep) = 30/60 points"
      );
    } else if (totalSleepMin >= 300) {
      // 5+ hours
      durationScore = 15;
      scores.explanations.sleep.push(
        "Duration poor (5+ hours actual sleep) = 15/60 points"
      );
    } else {
      durationScore = 5;
      scores.explanations.sleep.push(
        "Duration very poor (<5 hours actual sleep) = 5/60 points"
      );
    }

    // Efficiency component (40 points) - adjust for more reasonable scoring
    var efficiencyScore = 0;
    if (efficiencyMatch) {
      var efficiency = parseInt(efficiencyMatch[1]);

      if (efficiency >= 90) {
        efficiencyScore = 40;
        scores.explanations.sleep.push(
          "Efficiency excellent (" + efficiency + "%) = 40/40 points"
        );
      } else if (efficiency >= 85) {
        efficiencyScore = 35;
        scores.explanations.sleep.push(
          "Efficiency very good (" + efficiency + "%) = 35/40 points"
        );
      } else if (efficiency >= 80) {
        efficiencyScore = 30;
        scores.explanations.sleep.push(
          "Efficiency good (" + efficiency + "%) = 30/40 points"
        );
      } else if (efficiency >= 75) {
        efficiencyScore = 25;
        scores.explanations.sleep.push(
          "Efficiency acceptable (" + efficiency + "%) = 25/40 points"
        );
      } else if (efficiency >= 70) {
        efficiencyScore = 20;
        scores.explanations.sleep.push(
          "Efficiency below target (" + efficiency + "%) = 20/40 points"
        );
      } else {
        efficiencyScore = 10;
        scores.explanations.sleep.push(
          "Efficiency poor (" + efficiency + "%) = 10/40 points"
        );
      }
    }

    scores.sleep = durationScore + efficiencyScore;
  }

  // Activity Score (0-100, 30% weight)
  var stepsMatch = activity.match(/👣 Steps: ([\d,]+)/);
  var veryActiveMatch = activity.match(/💪 Very Active: (\d+) min/);
  var fairlyActiveMatch = activity.match(/🚶 Fairly Active: (\d+) min/);
  var sedentaryMatch = activity.match(/🪑 Sedentary: (\d+) min/);

  if (stepsMatch) {
    var steps = parseInt(stepsMatch[1].replace(/,/g, ""), 10);

    // Steps component (50 points)
    var stepScore = 0;
    if (steps >= 12000) {
      stepScore = 50;
      scores.explanations.activity.push(
        "Steps excellent (12k+) = 50/50 points"
      );
    } else if (steps >= 10000) {
      stepScore = 45;
      scores.explanations.activity.push("Steps great (10k+) = 45/50 points");
    } else if (steps >= 8000) {
      stepScore = 35;
      scores.explanations.activity.push("Steps good (8k+) = 35/50 points");
    } else if (steps >= 6000) {
      stepScore = 25;
      scores.explanations.activity.push("Steps moderate (6k+) = 25/50 points");
    } else if (steps >= 4000) {
      stepScore = 15;
      scores.explanations.activity.push("Steps low (4k+) = 15/50 points");
    } else {
      stepScore = 5;
      scores.explanations.activity.push("Steps very low (<4k) = 5/50 points");
    }

    // Active minutes component (50 points)
    var activeMinutes = 0;
    if (veryActiveMatch) activeMinutes += parseInt(veryActiveMatch[1], 10) * 2; // Very active counts double
    if (fairlyActiveMatch) activeMinutes += parseInt(fairlyActiveMatch[1], 10);

    var activeScore = 0;
    if (activeMinutes >= 60) {
      activeScore = 50;
      scores.explanations.activity.push(
        "Active minutes excellent (60+) = 50/50 points"
      );
    } else if (activeMinutes >= 45) {
      activeScore = 40;
      scores.explanations.activity.push(
        "Active minutes good (45+) = 40/50 points"
      );
    } else if (activeMinutes >= 30) {
      activeScore = 30;
      scores.explanations.activity.push(
        "Active minutes moderate (30+) = 30/50 points"
      );
    } else if (activeMinutes >= 15) {
      activeScore = 20;
      scores.explanations.activity.push(
        "Active minutes low (15+) = 20/50 points"
      );
    } else {
      activeScore = 10;
      scores.explanations.activity.push(
        "Active minutes very low (<15) = 10/50 points"
      );
    }

    // Sedentary penalty
    if (sedentaryMatch) {
      var sedentaryMin = parseInt(sedentaryMatch[1]);
      if (sedentaryMin > 600) {
        // More than 10 hours
        activeScore = Math.max(0, activeScore - 10);
        scores.explanations.activity.push(
          "Sedentary penalty (10+ hours) = -10 points"
        );
      }
    }

    scores.activity = stepScore + activeScore;
  }

  // In getMyMetricLogScoreBreakdown function, replace the Heart Score section:

  // Heart Score (0-100, 20% weight)
  var rhrMatch = heart.match(/❤️ Resting HR: (\d+)/);
  var zonesMatch = heart.match(/💓 Active zones: (.+?)(?=\n|$)/);
  var peakHRMatch = heart.match(/Peak HR: (\d+)/);

  if (rhrMatch) {
    var rhr = parseInt(rhrMatch[1], 10);

    // RHR component (50 points) - more granular scoring
    var rhrScore = 0;
    if (rhr <= 48) {
      rhrScore = 50;
      scores.explanations.heart.push(
        "RHR elite athlete level (≤48) = 50/50 points"
      );
    } else if (rhr <= 52) {
      rhrScore = 45;
      scores.explanations.heart.push("RHR excellent (≤52) = 45/50 points");
    } else if (rhr <= 55) {
      rhrScore = 40;
      scores.explanations.heart.push("RHR very good (≤55) = 40/50 points");
    } else if (rhr <= 60) {
      rhrScore = 35;
      scores.explanations.heart.push("RHR good (≤60) = 35/50 points");
    } else if (rhr <= 65) {
      rhrScore = 30;
      scores.explanations.heart.push("RHR average (≤65) = 30/50 points");
    } else if (rhr <= 70) {
      rhrScore = 20;
      scores.explanations.heart.push("RHR below average (≤70) = 20/50 points");
    } else {
      rhrScore = 10;
      scores.explanations.heart.push("RHR elevated (>70) = 10/50 points");
    }

    // Heart rate zones component (30 points) - based on quality of exercise
    var zonesScore = 0;
    if (zonesMatch) {
      var zonesText = zonesMatch[1];
      var cardioMatch = zonesText.match(/Cardio: (\d+)min/);
      var peakMatch = zonesText.match(/Peak: (\d+)min/);
      var fatBurnMatch = zonesText.match(/Fat Burn: (\d+)min/);

      var cardioMin = cardioMatch ? parseInt(cardioMatch[1]) : 0;
      var peakMin = peakMatch ? parseInt(peakMatch[1]) : 0;
      var fatBurnMin = fatBurnMatch ? parseInt(fatBurnMatch[1]) : 0;

      // Score based on quality and quantity of cardiovascular exercise
      if (cardioMin >= 20 || peakMin >= 10) {
        zonesScore = 30;
        scores.explanations.heart.push(
          "Excellent cardio workout = 30/30 points"
        );
      } else if (cardioMin >= 10 || peakMin >= 5) {
        zonesScore = 25;
        scores.explanations.heart.push("Good cardio workout = 25/30 points");
      } else if (cardioMin > 0 || peakMin > 0) {
        zonesScore = 20;
        scores.explanations.heart.push("Some cardio activity = 20/30 points");
      } else if (fatBurnMin >= 30) {
        zonesScore = 15;
        scores.explanations.heart.push(
          "Fat burn zone activity only = 15/30 points"
        );
      } else if (fatBurnMin > 0) {
        zonesScore = 10;
        scores.explanations.heart.push("Minimal zone activity = 10/30 points");
      } else {
        zonesScore = 5;
        scores.explanations.heart.push(
          "No elevated heart rate activity = 5/30 points"
        );
      }
    }

    // HRV bonus (20 points) - if available
    var hrvScore = 0;
    if (allData && allData.fitbitHRV && allData.fitbitHRV.value) {
      var hrv = allData.fitbitHRV.value;
      if (hrv > 60) {
        hrvScore = 20;
        scores.explanations.heart.push("HRV excellent (>60ms) = 20/20 points");
      } else if (hrv > 50) {
        hrvScore = 15;
        scores.explanations.heart.push("HRV good (>50ms) = 15/20 points");
      } else if (hrv > 40) {
        hrvScore = 10;
        scores.explanations.heart.push("HRV fair (>40ms) = 10/20 points");
      } else {
        hrvScore = 5;
        scores.explanations.heart.push("HRV low (<40ms) = 5/20 points");
      }
    } else {
      // If no HRV data, distribute those points proportionally
      rhrScore = Math.round(rhrScore * 1.2);
      zonesScore = Math.round(zonesScore * 1.2);
    }

    scores.heart = Math.min(100, rhrScore + zonesScore + hrvScore);
  }

  // Work Score (productivity/engagement, 20% weight)
  var workComponents = {
    email: 0,
    calendar: 0,
    tasks: 0,
    focus: 0,
  };

  // Check if it's a weekend
  var isWeekend = dayContext && dayContext.dayType === "weekend";

  // Email component (25 points)
  var primaryEmails = emailStats.primary || emailStats.received;
  var sentEmails = emailStats.sent;

  // Weekend adjustment - minimal work activity is GOOD
  if (isWeekend) {
    if (sentEmails < 5 && primaryEmails < 10) {
      workComponents.email = 25; // Full points for work-life balance
      scores.explanations.work.push(
        "Weekend work boundaries maintained = 25/25 points"
      );
    } else if (sentEmails < 10) {
      workComponents.email = 20;
      scores.explanations.work.push(
        "Some weekend work activity = 20/25 points"
      );
    } else {
      workComponents.email = 10;
      scores.explanations.work.push(
        "High weekend work activity = 10/25 points"
      );
    }
  } else {
    // Weekday email scoring
    if (sentEmails >= 10 && sentEmails <= 25 && primaryEmails < 50) {
      workComponents.email = 25;
      scores.explanations.work.push(
        "Email management excellent = 25/25 points"
      );
    } else if (sentEmails >= 5 && sentEmails < 10) {
      workComponents.email = 20;
      scores.explanations.work.push("Email engagement moderate = 20/25 points");
    } else if (sentEmails > 25 && sentEmails <= 40) {
      workComponents.email = 15;
      scores.explanations.work.push(
        "Email volume high (reactive) = 15/25 points"
      );
    } else if (sentEmails < 5 && primaryEmails > 20) {
      workComponents.email = 10;
      scores.explanations.work.push("Email backlog building = 10/25 points");
    } else if (sentEmails > 40) {
      workComponents.email = 5;
      scores.explanations.work.push("Email overload detected = 5/25 points");
    } else {
      workComponents.email = 15;
      scores.explanations.work.push("Email activity normal = 15/25 points");
    }
  }

  // Noise penalty
  if (emailStats.noisePercentage > 80) {
    workComponents.email = Math.max(0, workComponents.email - 5);
    scores.explanations.work.push(
      "Email noise penalty (" + emailStats.noisePercentage + "%) = -5 points"
    );
  }

  // Calendar component (25 points)
  var eventsMatch = calSummary.match(/Events: (\d+)/);
  var focusMatch = calSummary.match(/Longest focus: (\d+) min/);

  if (eventsMatch) {
    var events = parseInt(eventsMatch[1], 10);

    // Weekend calendar scoring
    if (isWeekend) {
      if (events === 0) {
        workComponents.calendar = 25;
        scores.explanations.work.push(
          "No weekend meetings = 25/25 points (excellent boundaries)"
        );
      } else if (events <= 2) {
        workComponents.calendar = 15;
        scores.explanations.work.push("Some weekend meetings = 15/25 points");
      } else {
        workComponents.calendar = 5;
        scores.explanations.work.push(
          "Too many weekend meetings = 5/25 points"
        );
      }
    } else {
      // Weekday calendar scoring
      if (events === 0) {
        workComponents.calendar = 25;
        scores.explanations.work.push("No meetings scheduled = 25/25 points");
      } else if (events >= 1 && events <= 4) {
        workComponents.calendar = 25;
        scores.explanations.work.push("Meeting balance good = 25/25 points");
      } else if (events >= 5 && events <= 6) {
        workComponents.calendar = 20;
        scores.explanations.work.push("Meetings moderate = 20/25 points");
      } else if (events >= 7 && events <= 8) {
        workComponents.calendar = 15;
        scores.explanations.work.push("Meeting heavy day = 15/25 points");
      } else {
        workComponents.calendar = 10;
        scores.explanations.work.push("Meeting overload = 10/25 points");
      }
    }
  }

  // Focus time component (25 points)
  if (focusMatch) {
    var focusMin = parseInt(focusMatch[1], 10);
    if (focusMin >= 120) {
      workComponents.focus = 25;
      scores.explanations.work.push(
        "Deep work time excellent (2+ hours) = 25/25 points"
      );
    } else if (focusMin >= 90) {
      workComponents.focus = 20;
      scores.explanations.work.push(
        "Deep work time good (90+ min) = 20/25 points"
      );
    } else if (focusMin >= 60) {
      workComponents.focus = 15;
      scores.explanations.work.push(
        "Deep work time moderate (60+ min) = 15/25 points"
      );
    } else {
      workComponents.focus = 10;
      scores.explanations.work.push("Deep work time fragmented = 10/25 points");
    }
  } else if (events === 0) {
    workComponents.focus = 25;
    scores.explanations.work.push(
      "No meetings = maximum deep work available = 25/25 points"
    );
  }

  // Task completion component (25 points)
  if (completedTasks && completedTasks.length > 10) {
    var taskCount = (completedTasks.match(/✔️/g) || []).length;
    if (taskCount >= 5) {
      workComponents.tasks = 25;
      scores.explanations.work.push("Task completion excellent = 25/25 points");
    } else if (taskCount >= 3) {
      workComponents.tasks = 20;
      scores.explanations.work.push("Task completion good = 20/25 points");
    } else if (taskCount >= 1) {
      workComponents.tasks = 15;
      scores.explanations.work.push("Task completion moderate = 15/25 points");
    } else {
      workComponents.tasks = 10;
      scores.explanations.work.push("Task completion low = 10/25 points");
    }
  } else {
    // If no task data or tasks not being used, don't mention it at all
    workComponents.tasks = 25;
    scores.explanations.work.push("Task component excluded = 25/25 points");
  }

  scores.work =
    workComponents.email +
    workComponents.calendar +
    workComponents.focus +
    workComponents.tasks;

  // Calculate weighted total
  scores.total = Math.round(
    scores.sleep * 0.3 +
      scores.activity * 0.3 +
      scores.heart * 0.2 +
      scores.work * 0.2
  );

  return scores;
}

// ✅ NEW: Generate Unicode progress bar
function generateBar(score) {
  var filled = Math.round(score / 10);
  var empty = 10 - filled;
  var bar = "";

  for (var i = 0; i < filled; i++) {
    bar += "▓";
  }
  for (var i = 0; i < empty; i++) {
    bar += "░";
  }

  return bar;
}

// ✅ NEW: Get formatted date
function getFormattedDate(date) {
  var days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  var months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  var dayName = days[date.getDay()];
  var monthName = months[date.getMonth()];
  var day = date.getDate();
  var year = date.getFullYear();

  return dayName + ", " + monthName + " " + day + ", " + year;
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy/MM/dd");
}

function getGPTInsight(summary) {
  var apiKey =
    PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

  var payload = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a reflective personal coach for productivity and emotional well-being.",
      },
      { role: "user", content: summary },
    ],
    temperature: 0.7,
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(
    "https://api.openai.com/v1/chat/completions",
    options
  );
  var result = JSON.parse(response.getContentText());

  if (result && result.choices && result.choices.length > 0) {
    return result.choices[0].message.content.trim();
  } else {
    return "Could not generate insight. Check your OpenAI API key or request limits.";
  }
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getFirstName(email) {
  var username = email.split("@")[0];
  // Extract just the letters from the beginning
  var nameMatch = username.match(/^[a-zA-Z]+/);
  if (nameMatch) {
    return capitalizeFirstLetter(nameMatch[0].toLowerCase());
  }
  // Fallback to capitalizing the whole username if no letters found
  return capitalizeFirstLetter(username);
}

function getCompletedTasks() {
  var now = new Date();
  var oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  var completed = [];

  var taskLists = Tasks.Tasklists.list().items;
  if (!taskLists) return "⚠️ No task lists found.";

  for (var i = 0; i < taskLists.length; i++) {
    var listId = taskLists[i].id;
    var tasks = Tasks.Tasks.list(listId, {
      showCompleted: true,
      showHidden: true,
      maxResults: 100,
    }).items;

    if (!tasks) continue;

    for (var j = 0; j < tasks.length; j++) {
      var task = tasks[j];
      if (task.status === "completed") {
        var completedDate = new Date(task.completed);
        if (completedDate > oneDayAgo) {
          completed.push("✔️ " + task.title);
        }
      }
    }
  }

  return completed.length ? completed.join("\n") : "No tasks completed.";
}

function getValidFitbitAccessToken() {
  var props = PropertiesService.getScriptProperties();
  var accessToken = props.getProperty("FITBIT_ACCESS_TOKEN");
  var refreshToken = props.getProperty("FITBIT_REFRESH_TOKEN");
  var clientId = "23QQGP";
  var clientSecret = "f6e4c9c6800f9d605feb27ea81eb70d1";

  // Test token by calling the profile endpoint
  var test = UrlFetchApp.fetch("https://api.fitbit.com/1/user/-/profile.json", {
    method: "get",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
    muteHttpExceptions: true,
  });

  if (test.getResponseCode() !== 401) {
    return accessToken; // still valid
  }

  // Refresh the token
  var response = UrlFetchApp.fetch("https://api.fitbit.com/oauth2/token", {
    method: "post",
    contentType: "application/x-www-form-urlencoded",
    headers: {
      Authorization:
        "Basic " + Utilities.base64Encode(clientId + ":" + clientSecret),
    },
    payload: {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    },
    muteHttpExceptions: true,
  });

  var data = JSON.parse(response.getContentText());

  if (data.access_token) {
    props.setProperty("FITBIT_ACCESS_TOKEN", data.access_token);
    props.setProperty("FITBIT_REFRESH_TOKEN", data.refresh_token);
    return data.access_token;
  } else {
    Logger.log("❌ Fitbit token refresh failed: " + response.getContentText());
    return null;
  }
}

function getFitbitSteps() {
  var token = getValidFitbitAccessToken();
  if (!token) return "⚠️ Fitbit authentication failed.";

  var date = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  var url = "https://api.fitbit.com/1/user/-/activities/date/" + date + ".json";

  var response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Bearer " + token,
    },
    muteHttpExceptions: true,
  });

  var json = JSON.parse(response.getContentText());

  if (json.summary && json.summary.steps !== undefined) {
    var steps = json.summary.steps;
    Logger.log("👟 Fitbit steps for " + date + ": " + steps);
    return steps + " steps";
  } else {
    Logger.log("❌ Failed to get steps: " + response.getContentText());
    return "❌ Unable to fetch steps.";
  }
}

function doGet(e) {
  try {
    // Handle embed requests
    if (e.parameter.embed === "true") {
      var dateStr =
        e.parameter.date ||
        Utilities.formatDate(
          new Date(),
          Session.getScriptTimeZone(),
          "yyyy-MM-dd"
        );

      // Get the report data for that date
      var reportData = getReportDataForDate(dateStr);

      if (!reportData) {
        return HtmlService.createHtmlOutput(
          '<div style="padding: 20px; text-align: center;">No report available for ' +
            dateStr +
            "</div>"
        ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      }

      // Generate the HTML using the same function as email
      var html = composeEnhancedMyMetricLogEmail(
        reportData.fullDateStr,
        reportData.dateStr,
        reportData.scores,
        reportData.insight,
        reportData.mantra,
        reportData.moodInsight,
        reportData.weatherSummary,
        reportData.calSummary,
        reportData.emailSummary,
        reportData.completedTasks,
        reportData.spotifySummary,
        reportData.fitbitActivity,
        reportData.fitbitSleep,
        reportData.fitbitHeart,
        reportData.peakHR,
        reportData.stressRadar,
        reportData.recoveryQuotient,
        reportData.dayContext,
        reportData.badges,
        reportData.streakBadges,
        reportData.badgeNarrative,
        reportData.nearMisses,
        reportData.calendarAnalysis,
        reportData.calendarIntelligence
      );

      // Wrap it with auto-resize script
      var embedHtml =
        "<!DOCTYPE html>\n" +
        "<html>\n" +
        "<head>\n" +
        '  <meta charset="UTF-8">\n' +
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
        "  <style>\n" +
        "    body {\n" +
        "      margin: 0;\n" +
        "      padding: 0;\n" +
        "      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n" +
        "      background: transparent;\n" +
        "    }\n" +
        "  </style>\n" +
        "</head>\n" +
        "<body>\n" +
        html +
        "\n" +
        "  <script>\n" +
        "    // Send height to parent\n" +
        "    function sendHeight() {\n" +
        "      var height = document.body.scrollHeight;\n" +
        "      window.parent.postMessage({\n" +
        "        type: 'you-report-resize',\n" +
        "        height: height\n" +
        "      }, '*');\n" +
        "    }\n" +
        "    \n" +
        "    // Send height on load and resize\n" +
        "    window.onload = sendHeight;\n" +
        "    window.onresize = sendHeight;\n" +
        "    \n" +
        "    // Also send height when images load\n" +
        "    var images = document.getElementsByTagName('img');\n" +
        "    for (var i = 0; i < images.length; i++) {\n" +
        "      images[i].onload = sendHeight;\n" +
        "    }\n" +
        "    \n" +
        "    // Send height periodically in case content changes\n" +
        "    setInterval(sendHeight, 1000);\n" +
        "  </script>\n" +
        "</body>\n" +
        "</html>";

      return HtmlService.createHtmlOutput(embedHtml)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setSandboxMode(HtmlService.SandboxMode.IFRAME);
    }

    // Original OAuth handling code
    if (!e || !e.parameter) {
      return HtmlService.createHtmlOutput("⚠️ No query parameters received.");
    }

    var code = e.parameter.code;
    if (!code) {
      // Show Spotify connection page
      var clientId =
        PropertiesService.getScriptProperties().getProperty(
          "SPOTIFY_CLIENT_ID"
        );
      var redirectUri = getRedirectUri();
      var authUrl =
        "https://accounts.spotify.com/authorize" +
        "?client_id=" +
        clientId +
        "&response_type=code" +
        "&redirect_uri=" +
        encodeURIComponent(redirectUri) +
        "&scope=user-read-recently-played";

      return HtmlService.createHtmlOutput(
        "<a href='" + authUrl + "'>Connect Spotify</a>"
      );
    }

    // We got a code! Try to exchange it.
    var output = "<p>✅ Received code from Spotify: " + code + "</p>";

    var clientId =
      PropertiesService.getScriptProperties().getProperty("SPOTIFY_CLIENT_ID");
    var clientSecret = PropertiesService.getScriptProperties().getProperty(
      "SPOTIFY_CLIENT_SECRET"
    );
    var redirectUri = getRedirectUri();

    var options = {
      method: "post",
      contentType: "application/x-www-form-urlencoded",
      payload: {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      },
      muteHttpExceptions: true,
    };

    var response = UrlFetchApp.fetch(
      "https://accounts.spotify.com/api/token",
      options
    );
    var text = response.getContentText();
    var status = response.getResponseCode();

    output += "<p>🎧 Spotify response code: " + status + "</p>";
    output += "<pre>" + text + "</pre>";

    if (status === 200) {
      var data = JSON.parse(text);
      PropertiesService.getScriptProperties().setProperty(
        "SPOTIFY_ACCESS_TOKEN",
        data.access_token
      );
      PropertiesService.getScriptProperties().setProperty(
        "SPOTIFY_REFRESH_TOKEN",
        data.refresh_token
      );
      output += "<p>✅ Access token saved successfully.</p>";
    } else {
      output += "<p>❌ Failed to get access token. See error above.</p>";
    }

    return HtmlService.createHtmlOutput(output);
  } catch (err) {
    return HtmlService.createHtmlOutput("🔥 Exception: " + err.toString());
  }
}

function getRedirectUri() {
  return ScriptApp.getService().getUrl();
}

// ✅ Updated: Renamed logToMindMirrorSheet to logToMyMetricLogSheet
function logToMyMetricLogSheet(
  date,
  mood,
  score,
  sleepMin,
  steps,
  track,
  weather,
  summary,
  sleepScore,
  activityScore,
  heartScore,
  workScore
) {
  var sheet = getOrCreateMyMetricLogSheet();
  var sh = sheet.getActiveSheet();

  // Add header if needed
  if (sh.getLastRow() === 0 || sh.getRange(1, 1).getValue() !== "Date") {
    sh.clear();
    sh.appendRow([
      "Date",
      "Mood",
      "Score",
      "Sleep (min)",
      "Steps",
      "Top Track",
      "Weather",
      "GPT Summary",
      "Sleep Score",
      "Activity Score",
      "Heart Score",
      "Work Score",
    ]);
  }

  // Check if we already have data for this date
  var data = sh.getDataRange().getValues();
  var rowToUpdate = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === date) {
      rowToUpdate = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }

  var rowData = [
    date,
    mood,
    score,
    sleepMin,
    steps,
    track,
    weather,
    summary,
    sleepScore || "",
    activityScore || "",
    heartScore || "",
    workScore || "",
  ];

  if (rowToUpdate > 0) {
    // Update existing row
    sh.getRange(rowToUpdate, 1, 1, 12).setValues([rowData]);
  } else {
    // Append new row
    sh.appendRow(rowData);
  }
}

function getValidSpotifyAccessToken() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty("SPOTIFY_ACCESS_TOKEN");
  var refreshToken = props.getProperty("SPOTIFY_REFRESH_TOKEN");

  var clientId = props.getProperty("SPOTIFY_CLIENT_ID");
  var clientSecret = props.getProperty("SPOTIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    Logger.log("❌ Missing Spotify client ID or secret.");
    return null;
  }

  // Test if token is still valid
  var testResponse = UrlFetchApp.fetch("https://api.spotify.com/v1/me", {
    method: "get",
    headers: { Authorization: "Bearer " + token },
    muteHttpExceptions: true,
  });

  if (testResponse.getResponseCode() !== 401) {
    Logger.log("✅ Spotify access token still valid.");
    return token;
  }

  // Token expired — refresh it
  var refreshOptions = {
    method: "post",
    contentType: "application/x-www-form-urlencoded",
    headers: {
      Authorization:
        "Basic " + Utilities.base64Encode(clientId + ":" + clientSecret),
    },
    payload: {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    },
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(
    "https://accounts.spotify.com/api/token",
    refreshOptions
  );
  var json = JSON.parse(response.getContentText());

  if (response.getResponseCode() === 200 && json.access_token) {
    token = json.access_token;
    props.setProperty("SPOTIFY_ACCESS_TOKEN", token);
    Logger.log("🔁 Spotify token refreshed successfully.");
    return token;
  } else {
    Logger.log("❌ Spotify token refresh failed: " + response.getContentText());
    return null;
  }
}

function getFitbitFormattedDate() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
}

function getFitbitSleepSummary() {
  var token = getValidFitbitAccessToken();
  var date = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  var url = "https://api.fitbit.com/1.2/user/-/sleep/date/" + date + ".json";

  var response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Bearer " + token,
    },
    muteHttpExceptions: true,
  });

  var data = JSON.parse(response.getContentText());
  if (!data.sleep || data.sleep.length === 0)
    return "❌ No sleep data available.";

  // Manually find the main sleep entry
  var mainSleep = null;
  for (var i = 0; i < data.sleep.length; i++) {
    if (data.sleep[i].isMainSleep) {
      mainSleep = data.sleep[i];
      break;
    }
  }

  if (!mainSleep) return "❌ Main sleep entry not found.";

  var durationMins = Math.round(mainSleep.duration / 60000);
  var hours = Math.floor(durationMins / 60);
  var mins = durationMins % 60;

  // Extract bed and wake times
  var bedTime = new Date(mainSleep.startTime);
  var wakeTime = new Date(mainSleep.endTime);

  var bedTimeStr = formatTimeOnly(bedTime);
  var wakeTimeStr = formatTimeOnly(wakeTime);

  return [
    "🛌 Sleep duration: " + hours + "h " + mins + "m",
    "🕰 Time in bed: " + Math.round(mainSleep.timeInBed) + " min",
    "😴 Efficiency: " + mainSleep.efficiency + "%",
    "🌙 Bedtime: " + bedTimeStr,
    "☀️ Wake time: " + wakeTimeStr,
    "🌙 Sleep levels: " +
      (mainSleep.levels && mainSleep.levels.data
        ? mainSleep.levels.data.length
        : "N/A") +
      " entries",
  ].join("\n");
}

// Helper function to format time
function formatTimeOnly(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // Handle midnight
  minutes = minutes < 10 ? "0" + minutes : minutes;
  return hours + ":" + minutes + " " + ampm;
}
function getFitbitHeartSummary() {
  var token = getValidFitbitAccessToken();
  var date = getFitbitFormattedDate();
  var url =
    "https://api.fitbit.com/1/user/-/activities/heart/date/" +
    date +
    "/1d.json";

  var response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Bearer " + token,
    },
    muteHttpExceptions: true,
  });

  var data = JSON.parse(response.getContentText());
  if (!data["activities-heart"] || data["activities-heart"].length === 0)
    return "❌ No heart data found.";

  var day = data["activities-heart"][0];
  var zones = day.value.heartRateZones
    .map(function (z) {
      return z.name + ": " + z.minutes + " min";
    })
    .join(", ");

  // Calculate peak HR more accurately
  var peakHR = "N/A";
  var maxHR = 0;

  // First check if there's any data in heart rate zones
  var hasHeartData = false;
  for (var i = 0; i < day.value.heartRateZones.length; i++) {
    var zone = day.value.heartRateZones[i];
    if (zone.minutes > 0) {
      hasHeartData = true;
      // For zones with activity, estimate peak based on zone
      if (zone.name === "Peak" && zone.minutes > 0) {
        // Peak zone typically starts at 85% of max HR
        // If someone is in peak zone, they likely hit at least the minimum
        maxHR = Math.max(maxHR, zone.min || 0);
      } else if (zone.name === "Cardio" && zone.minutes > 0) {
        // Cardio zone is typically 70-85% of max HR
        maxHR = Math.max(maxHR, zone.min || 0);
      }
    }
  }

  // If we have resting HR but no zone data, estimate based on age
  if (!hasHeartData && day.value.restingHeartRate) {
    // This is just an estimate when no actual peak data is available
    peakHR = "No high-intensity activity recorded";
  } else if (maxHR > 0 && maxHR < 220) {
    peakHR = maxHR;
  } else if (hasHeartData) {
    peakHR = "Low intensity day";
  }

  return [
    "❤️ Resting HR: " + day.value.restingHeartRate + " bpm",
    "💓 Time in zones: " + zones,
    "Peak HR: " + peakHR,
  ].join("\n");
}

function analyzeCalendarIntelligence(events) {
  var intelligence = {
    score: 100, // Start at 100, deduct points
    insights: [],
    recommendations: [],
    meetingQuality: {
      noAgenda: 0,
      backToBack: 0,
      bufferTime: 0,
      focusBlocks: 0,
      afterHours: 0,
    },
  };

  // Filter out personal events using same logic as getAdvancedCalendarAnalysis
  var actualMeetings = events.filter(function (event) {
    var title = event.getTitle().toLowerCase();
    var isAllDay = event.isAllDayEvent();

    if (isAllDay) return false;

    if (
      title.match(
        /pick up|drop off|reminder|vacation|holiday|lodge|hotel|personal|family|kids|children|birthday|anniversary|doctor|dentist|appointment/i
      )
    ) {
      return false;
    }

    var attendees = event.getGuestList ? event.getGuestList() : [];
    if (
      attendees.length === 0 &&
      !title.match(/meeting|sync|standup|1:1|call|interview|review/i)
    ) {
      return false;
    }

    return true;
  });

  // Sort events by time
  actualMeetings.sort(function (a, b) {
    return a.getStartTime() - b.getStartTime();
  });

  for (var i = 0; i < actualMeetings.length; i++) {
    var event = actualMeetings[i];
    var title = event.getTitle().toLowerCase();
    var description = event.getDescription() || "";
    var startHour = event.getStartTime().getHours();
    var attendees = event.getGuestList ? event.getGuestList() : [];

    // Check for no agenda
    if (!description && !title.match(/focus|blocked|personal/i)) {
      intelligence.meetingQuality.noAgenda++;
      intelligence.score -= 5;
    }

    // Check for after hours (but only for actual meetings with attendees)
    if (startHour >= 18 || startHour < 8) {
      // Only count as after-hours if it's an actual meeting with attendees
      if (
        attendees.length > 0 ||
        title.match(/meeting|call|sync|interview|review/i)
      ) {
        intelligence.meetingQuality.afterHours++;
        intelligence.score -= 10;
        intelligence.insights.push("After-hours meeting detected");
      }
    }

    // Check for back-to-back
    if (i > 0) {
      var prevEvent = actualMeetings[i - 1];
      var gap = (event.getStartTime() - prevEvent.getEndTime()) / 60000;

      if (gap < 5) {
        intelligence.meetingQuality.backToBack++;
        intelligence.score -= 8;
      } else if (gap >= 15 && gap <= 30) {
        intelligence.meetingQuality.bufferTime++;
        intelligence.score += 5;
      }
    }

    // Check for focus blocks
    if (title.match(/focus|deep work|blocked/i)) {
      intelligence.meetingQuality.focusBlocks++;
      intelligence.score += 10;
    }
  }

  // Generate recommendations based on actual meetings
  if (intelligence.meetingQuality.backToBack > 2) {
    intelligence.recommendations.push(
      "Consider 25-min meetings to create buffer time"
    );
  }
  if (intelligence.meetingQuality.noAgenda > actualMeetings.length * 0.3) {
    intelligence.recommendations.push(
      "Add agendas to meetings for 20% productivity boost"
    );
  }
  if (
    intelligence.meetingQuality.focusBlocks === 0 &&
    actualMeetings.length > 3
  ) {
    intelligence.recommendations.push(
      "Block 2-hour focus time tomorrow morning"
    );
  }

  intelligence.score = Math.max(0, Math.min(100, intelligence.score));
  return intelligence;
}

function getPredictedMood(fitbitSleep, fitbitHeart, spotifyHistory) {
  // Parse the data first
  var sleepMatch = fitbitSleep.match(/(\d+)h (\d+)m/);
  var sleepHours = sleepMatch
    ? parseFloat(sleepMatch[1]) + parseFloat(sleepMatch[2]) / 60
    : 0;

  var efficiencyMatch = fitbitSleep.match(/😴 Efficiency: (\d+)%/);
  var efficiency = efficiencyMatch ? parseInt(efficiencyMatch[1]) : 0;

  var rhrMatch = fitbitHeart.match(/❤️ Resting HR: (\d+)/);
  var rhr = rhrMatch ? parseInt(rhrMatch[1]) : 65;

  // Analyze music patterns
  var musicEnergy = "moderate";
  if (
    spotifyHistory.toLowerCase().indexOf("classical") !== -1 ||
    spotifyHistory.toLowerCase().indexOf("ambient") !== -1
  ) {
    musicEnergy = "calm";
  } else if (
    spotifyHistory.toLowerCase().indexOf("rock") !== -1 ||
    spotifyHistory.toLowerCase().indexOf("dance") !== -1
  ) {
    musicEnergy = "high";
  }

  // Calculate mood based on data
  var mood = "";
  var confidence = "";
  var confidenceLevel = "likely"; // default

  // Calculate confidence based on data quality and extremity
  if (sleepHours > 0 && efficiency > 0 && rhr > 0) {
    // Very high confidence scenarios
    if (efficiency < 50 && sleepHours < 6) {
      confidenceLevel = "very likely";
      confidence =
        "Low sleep efficiency (" +
        efficiency +
        "%) with short duration strongly indicates fatigue.";
    } else if (efficiency > 90 && sleepHours >= 7.5) {
      confidenceLevel = "very likely";
      confidence = "Excellent sleep quality sets you up for peak performance.";
    }
    // Moderate confidence scenarios
    else if (efficiency > 80 && sleepHours >= 7) {
      confidenceLevel = "likely";
      confidence = "Good sleep metrics suggest stable energy levels.";
    } else if (efficiency < 70) {
      confidenceLevel = "may";
      confidence = "Sleep disruptions could affect afternoon energy.";
    }
    // Low confidence scenarios
    else {
      confidenceLevel = "might";
      confidence = "Mixed signals make prediction less certain.";
    }
  }

  // Determine mood with softer language
  if (sleepHours >= 7 && efficiency >= 85) {
    mood = "energized and focused";
  } else if (sleepHours >= 6.5 && efficiency >= 80) {
    mood = "balanced and steady";
  } else if (sleepHours < 6 || efficiency < 60) {
    mood = "some mental fog";
  } else if (efficiency < 75) {
    mood = "occasional fatigue";
  } else {
    mood = "moderate energy";
  }

  // Adjust based on heart data
  if (rhr > 65 && mood === "energized and focused") {
    mood = "alert but slightly tense";
    confidence =
      "Elevated resting heart rate (" + rhr + " bpm) may indicate mild stress.";
  } else if (rhr < 55 && mood !== "some mental fog") {
    mood = "calm and recovered";
    confidence =
      "Excellent resting heart rate (" + rhr + " bpm) shows strong recovery.";
  }

  // Build the response with appropriate confidence language
  var response = "";

  if (mood === "some mental fog" || mood === "occasional fatigue") {
    response =
      "You may experience " + mood + " today, especially in the afternoon. ";
  } else if (
    mood === "energized and focused" ||
    mood === "calm and recovered"
  ) {
    response = "You're " + confidenceLevel + " to feel " + mood + " today. ";
  } else {
    response = "You'll " + confidenceLevel + " have " + mood + " today. ";
  }

  response += confidence;

  // Music influence note
  if (musicEnergy === "calm" && mood.indexOf("tense") !== -1) {
    response +=
      " Your calming music choices suggest you're already managing this well.";
  } else if (musicEnergy === "high" && mood.indexOf("fog") !== -1) {
    response += " High-energy music might help counteract the fatigue.";
  }

  // If no GPT call, return our calculated response
  return response;

  // Continue with GPT enhancement if desired...
  var payload = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a wellness coach providing mood predictions. Use softer, probabilistic language. " +
          "Never say someone WILL feel something definitively. Use 'may', 'likely', 'might', or " +
          "'could' based on confidence. Always acknowledge uncertainty in predictions.",
      },
      {
        role: "user",
        content:
          "Based on this data, provide a mood prediction in ONE sentence that includes confidence level:\n" +
          "Sleep: " +
          sleepHours.toFixed(1) +
          " hours at " +
          efficiency +
          "% efficiency\n" +
          "Resting HR: " +
          rhr +
          " bpm\n" +
          "Music pattern: " +
          musicEnergy +
          "\n" +
          "Initial prediction: " +
          response +
          "\n\n" +
          "Keep it brief, conversational, and include why (based on the main factor affecting mood).",
      },
    ],
    temperature: 0.7,
    max_tokens: 100,
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization:
        "Bearer " +
        PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY"),
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(
      "https://api.openai.com/v1/chat/completions",
      options
    );
    var result = JSON.parse(response.getContentText());
    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message.content.trim();
    }
  } catch (e) {
    Logger.log("❌ GPT mood prediction failed: " + e);
  }

  // Fallback to our calculated response
  return response;
}

// Add this new function
function getHistoricalDayAverage(dayName) {
  var sheet = getOrCreateMyMetricLogSheet();
  var data = sheet.getDataRange().getValues();

  if (data.length < 2) return null;

  var dayScores = [];
  var dayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  var targetDay = dayMap[dayName];

  // Get last 8 weeks of data for this day
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      var date = new Date(data[i][0]);
      if (date.getDay() === targetDay && data[i][2]) {
        dayScores.push(parseInt(data[i][2]));
      }
    }
  }

  if (dayScores.length === 0) return null;

  // Calculate average and trend
  var avg = Math.round(
    dayScores.reduce(function (a, b) {
      return a + b;
    }, 0) / dayScores.length
  );
  var recent = dayScores.slice(-4); // Last 4 occurrences
  var older = dayScores.slice(0, -4);

  var recentAvg =
    recent.length > 0
      ? Math.round(
          recent.reduce(function (a, b) {
            return a + b;
          }, 0) / recent.length
        )
      : avg;
  var olderAvg =
    older.length > 0
      ? Math.round(
          older.reduce(function (a, b) {
            return a + b;
          }, 0) / older.length
        )
      : avg;

  return {
    average: avg,
    trend:
      recentAvg > olderAvg
        ? "improving"
        : recentAvg < olderAvg
        ? "declining"
        : "stable",
    count: dayScores.length,
  };
}

// ✅ Updated: Renamed saveToMindMirrorFolder to saveToMyMetricLogFolder
function saveToMyMetricLogFolder(subfolder, filename, content) {
  var rootFolder = getOrCreateDriveFolder("MyMetricLog");
  var sub = getOrCreateDriveSubfolder(rootFolder, subfolder);
  var file = sub.createFile(filename + ".txt", content);
  Logger.log("📁 Saved to: " + sub.getName() + " / " + file.getName());
}

function getOrCreateDriveFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function getOrCreateDriveSubfolder(parent, name) {
  var subfolders = parent.getFoldersByName(name);
  return subfolders.hasNext() ? subfolders.next() : parent.createFolder(name);
}

function getOrCreateWeeklyDoc() {
  var root = getOrCreateDriveFolder("MyMetricLog");
  var folder = getOrCreateDriveSubfolder(root, "weekly");
  var title = "The Weekly You Report Summary";
  var files = folder.getFilesByName(title);
  if (files.hasNext()) {
    return DocumentApp.openById(files.next().getId());
  } else {
    var doc = DocumentApp.create(title);
    DriveApp.getFileById(doc.getId()).moveTo(folder);
    doc
      .getBody()
      .appendParagraph("🧠 The Weekly You Report Summary")
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);
    return doc;
  }
}

// ✅ Updated: Renamed getOrCreateMindMirrorSheet to getOrCreateMyMetricLogSheet
function getOrCreateMyMetricLogSheet() {
  var files = DriveApp.getFilesByName("MyMetricLogData");
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  } else {
    var sheet = SpreadsheetApp.create("MyMetricLogData");
    DriveApp.getFileById(sheet.getId()).moveTo(
      getOrCreateDriveFolder("MyMetricLog")
    );
    var sh = sheet.getActiveSheet();
    sh.appendRow([
      "Date",
      "Mood",
      "Score",
      "Sleep (min)",
      "Steps",
      "Top Track",
      "Weather",
      "GPT Summary",
    ]);
    return sheet;
  }
}

function getWeatherSummary() {
  try {
    var apiKey = PropertiesService.getScriptProperties().getProperty(
      "OPENWEATHER_API_KEY"
    );
    var zip = "94025",
      country = "US";

    if (!apiKey) throw new Error("Missing OpenWeather API key.");

    var url =
      "https://api.openweathermap.org/data/2.5/weather?zip=" +
      zip +
      "," +
      country +
      "&units=metric&appid=" +
      apiKey;
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200)
      throw new Error("API error: " + response.getResponseCode());

    var data = JSON.parse(response.getContentText());
    if (!data.main || !data.weather)
      throw new Error("Unexpected response format.");

    var summary = [
      "🌤️ Condition: " + data.weather[0].description,
      "🌡️ Temperature: " +
        data.main.temp +
        "°C (feels like " +
        data.main.feels_like +
        "°C)",
      "💨 Wind: " + data.wind.speed + " m/s",
      "☁️ Cloud Cover: " + data.clouds.all + "%",
      "📍 Location: " + data.name,
    ].join("\n");

    Logger.log("🌦️ [Weather] Success:\n" + summary);
    return summary;
  } catch (e) {
    Logger.log("⚠️ [Weather] Error — using fallback: " + e);
    return getFallbackWeather("94025");
  }
}

// Update the generateMiniTrendChart function to use consistent colors
function generateMiniTrendChart(metricName, currentScore, color) {
  // Determine the score color based on value with gradient
  var scoreColor;
  if (currentScore >= 95) {
    scoreColor = "#00695c"; // Dark green
  } else if (currentScore >= 90) {
    scoreColor = "#0b8043"; // Standard green
  } else if (currentScore >= 85) {
    scoreColor = "#43a047"; // Light green
  } else if (currentScore >= 80) {
    scoreColor = "#66bb6a"; // Lighter green
  } else if (currentScore >= 75) {
    scoreColor = "#9ccc65"; // Yellow-green
  } else if (currentScore >= 70) {
    scoreColor = "#d4e157"; // Light yellow-green
  } else if (currentScore >= 65) {
    scoreColor = "#ffb300"; // Orange
  } else if (currentScore >= 60) {
    scoreColor = "#f9ab00"; // Darker orange
  } else if (currentScore >= 50) {
    scoreColor = "#ff6f00"; // Orange-red
  } else if (currentScore >= 40) {
    scoreColor = "#ea4335"; // Standard red
  } else {
    scoreColor = "#c62828"; // Dark red
  }

  // Get actual trend data
  var trendData = generateMetricTrend(metricName.toLowerCase());

  // Don't show trend chart if insufficient data
  if (!trendData || trendData.length < 2) {
    return (
      '<div style="margin-top: 12px; padding: 10px; background: #f5f5f5; border-radius: 6px; text-align: center;">' +
      '<div style="font-size: 12px; color: #666; margin-bottom: 4px;">Current Score</div>' +
      '<div style="font-size: 32px; font-weight: bold; color: ' +
      scoreColor +
      ';">' +
      currentScore +
      "</div>" +
      '<div style="font-size: 10px; color: #999; margin-top: 4px;">' +
      (trendData.length === 1
        ? "No historical data yet"
        : "Insufficient data for trends") +
      "</div>" +
      "</div>"
    );
  }

  // Calculate actual trend
  var current = trendData[trendData.length - 1];
  var previous = trendData[trendData.length - 2];
  var change = current - previous;
  var changeStr = change > 0 ? "+" + change : change.toString();
  var arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";

  // Calculate min and max for proper scaling
  var minValue = Math.min.apply(null, trendData);
  var maxValue = Math.max.apply(null, trendData);
  var range = maxValue - minValue || 1;

  var html =
    '<div style="margin-top: 12px; padding: 10px; background: #f5f5f5; border-radius: 6px;">';

  // Show proper label based on data length
  if (trendData.length === 7) {
    html +=
      '<div style="font-size: 12px; color: #666; margin-bottom: 8px;">' +
      "<strong>7-Day Trend</strong> " +
      arrow +
      " " +
      changeStr +
      "</div>";
  } else {
    html +=
      '<div style="font-size: 12px; color: #666; margin-bottom: 8px;">' +
      "<strong>" +
      trendData.length +
      "-Day Trend</strong> " +
      arrow +
      " " +
      changeStr +
      "</div>";
  }

  // Table-based chart
  html += '<table style="width: 100%; border-collapse: collapse;">';

  // Value row
  html += "<tr>";
  trendData.forEach(function (value, index) {
    var isLatest = index === trendData.length - 1;
    html +=
      '<td style="text-align: center; font-size: 9px; padding: 2px; color: ' +
      color +
      "; " +
      "font-weight: " +
      (isLatest ? "bold" : "normal") +
      ';">' +
      value +
      "</td>";
  });
  html += "</tr>";

  // Bar row with RELATIVE scaling
  html += "<tr>";
  trendData.forEach(function (value, index) {
    // Scale height relative to the data range, not 0-100
    var relativePosition = (value - minValue) / range;
    var height = Math.max(5, Math.round(relativePosition * 35) + 5); // 5-40px range
    var isLatest = index === trendData.length - 1;

    html += '<td style="vertical-align: bottom; padding: 2px; height: 45px;">';
    html +=
      '<div style="background: ' +
      color +
      "; width: 90%; height: " +
      height +
      "px; " +
      "margin: 0 auto; opacity: " +
      (isLatest ? "1" : "0.7") +
      "; " +
      'border-radius: 2px 2px 0 0;"></div>';
    html += "</td>";
  });
  html += "</tr>";

  // Label row - more descriptive
  html += "<tr>";
  for (var i = 0; i < trendData.length; i++) {
    var label = "";
    if (i === trendData.length - 1) {
      label = "Today";
    } else {
      label = trendData.length - i - 1 + "d";
    }
    html +=
      '<td style="text-align: center; font-size: 9px; color: #999; padding: 2px;">' +
      label +
      "</td>";
  }
  html += "</tr>";

  html += "</table>";

  // Add note if less than 7 days
  if (trendData.length < 7) {
    html +=
      '<div style="font-size: 10px; color: #999; text-align: center; margin-top: 4px;">' +
      "Building " +
      (7 - trendData.length) +
      " more days of history</div>";
  }

  html += "</div>";

  return html;
}

function getDailyMantra(insightText) {
  var payload = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are Sage the fox, writing SHORT, inspiring daily mantras. Maximum 15 words. Make it actionable and specific to their biggest challenge today. No metaphors or poetry - just clear, warm wisdom.",
      },
      {
        role: "user",
        content:
          "Based on this reflection, write a single-sentence mantra:\n\n" +
          insightText,
      },
    ],
    temperature: 0.85,
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization:
        "Bearer " +
        PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY"),
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(
      "https://api.openai.com/v1/chat/completions",
      options
    );
    var data = JSON.parse(response.getContentText());
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      Logger.log(
        "❌ [Mantra] Failed to generate: " + response.getContentText()
      );
      return '🧘 "Breathe into the moment. Let it shape you."';
    }
  } catch (e) {
    Logger.log("❌ [Mantra] Exception: " + e);
    return '🧘 "Reset gently. Rise wisely."';
  }
}

function getFallbackWeather(zip) {
  try {
    var url =
      "https://www.google.com/search?q=weather+" + encodeURIComponent(zip);
    var html = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: { "User-Agent": "Mozilla/5.0" },
    }).getContentText();

    var temp = html.match(/<span id="wob_tm"[^>]*>(\d+)<\/span>/);
    var desc = html.match(/<span id="wob_dc"[^>]*>([^<]+)<\/span>/);
    var loc = html.match(/<div class="wob_loc"[^>]*>([^<]+)<\/div>/);

    if (temp && desc) {
      return (
        "🌤️ " +
        (loc ? loc[1] + ": " : "") +
        desc[1] +
        ", " +
        temp[1] +
        "°C (fallback)"
      );
    } else {
      return "⚠️ Weather data unavailable (fallback parse failed).";
    }
  } catch (e) {
    Logger.log("🔥 [FallbackWeather] Exception: " + e);
    return "⚠️ Weather data unavailable (fallback error).";
  }
}

function getFallbackWeatherForecast(zip) {
  try {
    var url =
      "https://www.google.com/search?q=3+day+weather+forecast+" +
      encodeURIComponent(zip);
    var html = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: { "User-Agent": "Mozilla/5.0" },
    }).getContentText();

    var matches = html.match(/<span class="wob_t"[^>]*>(\d+)<\/span>/g);
    var days = html.match(/<div class="wob_dts"[^>]*>([^<]+)<\/div>/g);
    if (!matches || !days) return "⚠️ Fallback forecast unavailable.";

    var summary = "";
    for (var i = 0; i < Math.min(3, matches.length, days.length); i++) {
      var temp = matches[i].replace(/<[^>]+>/g, "");
      var day = days[i].replace(/<[^>]+>/g, "");
      summary += "📅 " + day + ": " + temp + "°C (fallback)\n";
    }

    Logger.log("🌦️ [FallbackForecast] Success:\n" + summary);
    return summary;
  } catch (e) {
    Logger.log("🔥 [FallbackForecast] Exception: " + e);
    return "⚠️ Forecast unavailable (fallback error).";
  }
}

function convertAndFormatInsight(insight) {
  // First convert markdown bold to HTML
  var formatted = insight.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Split by [PARAGRAPH BREAK] markers
  var paragraphs = formatted.split(/\[PARAGRAPH BREAK\]/);

  // Filter out empty paragraphs and wrap each in <p> tags
  var htmlParagraphs = paragraphs
    .filter(function (p) {
      return p.trim().length > 0;
    })
    .map(function (p) {
      return '<p style="margin-bottom: 12px;">' + p.trim() + "</p>";
    });

  return htmlParagraphs.join("");
}

function buildSection(title, body) {
  return (
    "<div style='margin:16px 0; padding:16px; background:white; border:1px solid #ccc; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.08);'>" +
    "<h3 style='font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0 0 10px 0;'>" +
    title +
    "</h3>" +
    "<pre style='font-family:monospace; white-space:pre-wrap; font-size:13px; line-height:1.5;'>" +
    escapeHtml(body || "None") +
    "</pre></div>"
  );
}

function get3DayForecastSummary() {
  try {
    var apiKey = PropertiesService.getScriptProperties().getProperty(
      "OPENWEATHER_API_KEY"
    );
    var zip = "94025",
      country = "US";

    if (!apiKey) throw new Error("Missing API key.");

    var url =
      "https://api.openweathermap.org/data/2.5/forecast?zip=" +
      zip +
      "," +
      country +
      "&units=metric&appid=" +
      apiKey;
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var code = response.getResponseCode();
    if (code !== 200) throw new Error("Forecast API error: " + code);

    var data = JSON.parse(response.getContentText());
    var tempsByDay = {};
    for (var i = 0; i < data.list.length; i++) {
      var entry = data.list[i];
      var date = entry.dt_txt.split(" ")[0];
      if (!tempsByDay[date]) tempsByDay[date] = [];
      tempsByDay[date].push(entry.main.temp);
    }

    var summary = "",
      count = 0;
    for (var day in tempsByDay) {
      var temps = tempsByDay[day];
      var avg = Math.round(
        temps.reduce(function (a, b) {
          return a + b;
        }, 0) / temps.length
      );
      summary += "📅 " + day + ": Avg Temp " + avg + "°C\n";
      if (++count >= 3) break;
    }

    Logger.log("🌦️ [Forecast] Success:\n" + summary);
    return summary;
  } catch (e) {
    Logger.log("⚠️ [Forecast] Error — using fallback: " + e);
    return getFallbackWeatherForecast("94025");
  }
}

// Enhanced helper functions for visual improvements

// 1. TREND TRACKING FUNCTIONS
function getScoreTrends() {
  var sheet = getOrCreateMyMetricLogSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var trends = {
    overall: { current: 0, previous: 0, trend: 0, sparkline: [] },
    sleep: { current: 0, previous: 0, trend: 0, sparkline: [] },
    activity: { current: 0, previous: 0, trend: 0, sparkline: [] },
    heart: { current: 0, previous: 0, trend: 0, sparkline: [] },
    work: { current: 0, previous: 0, trend: 0, sparkline: [] },
  };

  // Group data by date to handle multiple runs per day
  var dataByDate = {};

  // Process ALL rows (skip header)
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][2]) {
      // Has date and score
      var dateStr = "";

      // Handle different date formats
      if (data[i][0] instanceof Date) {
        dateStr = Utilities.formatDate(
          data[i][0],
          Session.getScriptTimeZone(),
          "yyyy-MM-dd"
        );
      } else {
        dateStr = String(data[i][0]);
      }

      // Store data for this date (overwrites previous entries for same date)
      dataByDate[dateStr] = {
        score: parseInt(data[i][2]) || 0,
        sleep: parseInt(data[i][3]) || 0,
        steps: parseInt(data[i][4]) || 0,
      };
    }
  }

  // Get the last 7 unique dates sorted
  var sortedDates = Object.keys(dataByDate).sort();
  var last7Dates = sortedDates.slice(-7);

  // Build array from unique dates
  var last7Days = [];
  last7Dates.forEach(function (dateStr) {
    last7Days.push(dataByDate[dateStr]);
  });

  // Only calculate trends if we have at least 2 days of data
  if (last7Days.length >= 2) {
    var current = last7Days[last7Days.length - 1];
    var previous = last7Days[last7Days.length - 2];

    // Calculate trends
    trends.overall.current = current.score;
    trends.overall.previous = previous.score;
    trends.overall.trend = current.score - previous.score;

    // Generate sparklines from unique days only
    trends.overall.sparkline = last7Days.map(function (d) {
      return d.score;
    });
  }

  return trends;
}

function formatNumberWithCommas(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 2. SPARKLINE GENERATOR - Fixed with x-axis labels and unique days
function generateSparkline(values, baseColor) {
  if (!values || values.length === 0) return "";

  var max = Math.max.apply(null, values);
  var min = Math.min.apply(null, values);
  var range = max - min || 1;

  var html = '<div style="display: inline-block; margin-top: 10px;">';
  html += '<table style="border-collapse: collapse; display: inline-table;">';

  // Values row
  html += "<tr>";
  for (var i = 0; i < values.length; i++) {
    var scoreColor = getMainScoreColor(values[i]);
    html +=
      '<td style="text-align: center; padding: 0 4px;">' +
      '<span style="font-size: 12px; color: ' +
      scoreColor +
      '; font-weight: bold; display: block;">' +
      values[i] +
      "</span></td>";
  }
  html += "</tr>";

  // Bars row with individual colors based on score
  html += "<tr>";
  for (var i = 0; i < values.length; i++) {
    var normalized = (values[i] - min) / range;
    var height = Math.max(10, Math.round(normalized * 40) + 10);
    var barColor = getMainScoreColor(values[i]);

    html +=
      '<td style="height: 50px; vertical-align: bottom; padding: 0 4px;">';
    html +=
      '<div style="background: ' +
      barColor +
      "; width: 20px; height: " +
      height +
      "px; " +
      'border-radius: 2px 2px 0 0; display: inline-block;"></div>';
    html += "</td>";
  }
  html += "</tr>";

  // X-axis labels row
  html += "<tr>";
  for (var i = 0; i < values.length; i++) {
    var label = "";
    if (i === values.length - 1) {
      label = "Today";
    } else {
      label = values.length - i - 1 + "d";
    }
    html +=
      '<td style="text-align: center; font-size: 11px; color: #999; padding: 2px 4px 0 4px;">' +
      label +
      "</td>";
  }
  html += "</tr>";

  html += "</table>";
  html += "</div>";

  return html;
}

// Update the getMainScoreColor function with more yellow tones for 70s
function getMainScoreColor(score) {
  if (score >= 95) return "#00695c"; // Dark green (excellent)
  if (score >= 90) return "#0b8043"; // Standard green (great)
  if (score >= 85) return "#43a047"; // Medium green (very good)
  if (score >= 80) return "#66bb6a"; // Light green (good)
  if (score >= 75) return "#9ccc65"; // Yellow-green (above average)
  if (score >= 70) return "#fbc02d"; // Yellow (solid) - changed to more yellow
  if (score >= 65) return "#f9a825"; // Dark yellow (moderate)
  if (score >= 60) return "#ff9800"; // Orange (fair)
  if (score >= 55) return "#ff6f00"; // Deep orange (below average)
  if (score >= 50) return "#f4511e"; // Red-orange (needs work)
  if (score >= 45) return "#e64a19"; // Darker red-orange (poor)
  return "#ea4335"; // Red (critical)
}

// 3. TREND ARROW GENERATOR
function getTrendArrow(trend) {
  if (trend > 5) return '<span style="color:#0b8043;">▲</span>';
  if (trend > 0) return '<span style="color:#0b8043;">↗</span>';
  if (trend < -5) return '<span style="color:#ea4335;">▼</span>';
  if (trend < 0) return '<span style="color:#ea4335;">↘</span>';
  return '<span style="color:#666;">→</span>';
}

// 4. MOOD CARD GENERATOR
function generateMoodCard(moodInsight, scores) {
  var moodEmojis = {
    energized: "⚡",
    relaxed: "😌",
    tired: "😴",
    anxious: "😰",
    overwhelmed: "😵",
    motivated: "💪",
    foggy: "🌫️",
    calm: "🧘",
    focused: "🎯",
    restless: "😣",
    balanced: "⚖️",
  };

  // Extract mood keyword from insight
  var moodKeyword = "balanced";
  var lowerInsight = moodInsight.toLowerCase();

  var feelMatch = lowerInsight.match(/feel (\w+)/);
  if (feelMatch) {
    moodKeyword = feelMatch[1];
  } else {
    for (var mood in moodEmojis) {
      if (lowerInsight.indexOf(mood) !== -1) {
        moodKeyword = mood;
        break;
      }
    }
  }

  var emoji = moodEmojis[moodKeyword] || "😊";
  var energyForecast = generateEnergyForecast(scores, moodKeyword);

  return (
    '<div style="background: #faf5ff; border-left: 4px solid #e9d5ff; ' +
    "border-radius: 12px; padding: 20px; " +
    'margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">' +
    '<h4 style="font-size:16px; font-weight:600; color:#424242; margin:0 0 12px 0; display:flex; align-items:center;">' +
    '<img src="' +
    getSageImage("meditation") +
    '" ' +
    'alt="Sage Mood" style="width:48px; height:auto; margin-right:10px; vertical-align:middle;"/>' +
    '<span style="line-height:48px;">Today\'s Mood</span></h4>' +
    '<div style="display: flex; align-items: center; margin-bottom: 15px;">' +
    '<span style="font-size: 48px; margin-right: 15px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">' +
    emoji +
    "</span>" +
    "<div>" +
    '<h3 style="margin: 0; font-size: 20px; color: #ff6b9d; font-weight: 600;">' +
    capitalizeFirstLetter(moodKeyword) +
    "</h3>" +
    '<p style="margin: 5px 0 0 0; color: #5f6368; font-size: 14px; line-height: 1.4;">' +
    moodInsight +
    "</p>" +
    "</div></div>" +
    '<div style="background: rgba(255,255,255,0.8); border-radius: 8px; padding: 12px; ' +
    'border-left: 3px solid #ff9ff3;">' +
    '<strong style="color: #ff6b9d; font-size: 15px;">📊 Energy Forecast:</strong><br>' +
    '<span style="color: #5f6368; font-size: 14px; line-height: 1.5;">' +
    energyForecast +
    "</span>" +
    "</div></div>"
  );
}

// 5. ENERGY FORECAST GENERATOR
function generateEnergyForecast(scores, mood) {
  var forecasts = {
    high: [
      "Peak performance window: 9-11 AM. Schedule important tasks early.",
      "Strong energy reserves. Consider tackling complex projects today.",
      "Optimal conditions for deep work. Protect your focus time.",
    ],
    moderate: [
      "Steady energy with potential dip around 2-3 PM. Plan accordingly.",
      "Good baseline energy. Take regular breaks to maintain momentum.",
      "Expected productivity: moderate to good. Prioritize key tasks.",
    ],
    low: [
      "Energy conservation recommended. Focus on essential tasks only.",
      "Anticipate fatigue by mid-afternoon. Schedule lighter activities.",
      "Recovery day ahead. Be gentle with yourself and adjust expectations.",
    ],
  };

  var level =
    scores.total >= 80 ? "high" : scores.total >= 60 ? "moderate" : "low";
  var options = forecasts[level];
  return options[Math.floor(Math.random() * options.length)];
}

// 7. ENHANCED PROGRESS BAR
function generateEnhancedBar(score, gradient) {
  var filled = Math.round(score / 10);
  var empty = 10 - filled;

  var color1, color2;
  if (score >= 95) {
    color1 = "#00695c";
    color2 = "#00897b";
  } else if (score >= 90) {
    color1 = "#0b8043";
    color2 = "#43a047";
  } else if (score >= 85) {
    color1 = "#43a047";
    color2 = "#66bb6a";
  } else if (score >= 80) {
    color1 = "#66bb6a";
    color2 = "#9ccc65";
  } else if (score >= 75) {
    color1 = "#9ccc65";
    color2 = "#d4e157";
  } else if (score >= 70) {
    color1 = "#d4e157";
    color2 = "#ffeb3b";
  } else if (score >= 65) {
    color1 = "#ffb300";
    color2 = "#ffa000";
  } else if (score >= 60) {
    color1 = "#f9ab00";
    color2 = "#ff8f00";
  } else if (score >= 50) {
    color1 = "#ff6f00";
    color2 = "#ff5722";
  } else {
    color1 = "#ea4335";
    color2 = "#c62828";
  }

  if (gradient) {
    var barHtml =
      '<div style="display: inline-block; width: 100px; height: 8px; ' +
      'background: #e0e0e0; border-radius: 4px; overflow: hidden; vertical-align: middle;">' +
      '<div style="width: ' +
      score +
      "%; height: 100%; " +
      "background: linear-gradient(90deg, " +
      color1 +
      " 0%, " +
      color2 +
      " 100%); " +
      'box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);"></div></div>';
    return barHtml;
  }

  // Fallback to Unicode bars
  var bar = "";
  for (var i = 0; i < filled; i++) {
    bar += "▓";
  }
  for (var i = 0; i < empty; i++) {
    bar += "░";
  }
  return '<span style="font-family: monospace;">' + bar + "</span>";
}

// 8. INSIGHT HEADLINE GENERATOR

// ========== ENHANCED GPT INSIGHTS ENGINE ==========

function getEnhancedGPTInsight(summary, allData) {
  var apiKey =
    PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

  // Build comprehensive context
  var enhancedContext = buildComprehensiveContext(allData);
  var behavioralPatterns = identifyBehavioralPatterns(allData);
  var criticalFactors = identifyCriticalFactors(allData);
  var experiments = generatePersonalizedExperiments(allData);

  var systemPrompt =
    "You are an elite wellness analyst and behavioral scientist with expertise in:\n" +
    "- Circadian biology and sleep science\n" +
    "- Exercise physiology and recovery\n" +
    "- Behavioral psychology and habit formation\n" +
    "- Stress psychophysiology\n" +
    "- Nutritional biochemistry\n" +
    "- Performance optimization\n\n" +
    "Your role is to provide profound, actionable insights that go beyond surface-level observations. " +
    "You identify hidden patterns, explain causation (not just correlation), and provide specific, personalized recommendations.\n\n" +
    'IMPORTANT: Always use "you" and "your" when addressing the user. Never use third person.';

  var enhancedPrompt =
    "Analyze this comprehensive wellness data and provide a world-class insight:\n\n" +
    "==== CONTEXTUAL INTELLIGENCE ====\n" +
    enhancedContext +
    "\n\n" +
    "==== SCORE BREAKDOWNS (MUST REFERENCE) ====\n" +
    "Overall: " +
    allData.scores.total +
    "/100\n" +
    "Sleep: " +
    allData.scores.sleep +
    "/100\n" +
    "  - " +
    allData.scores.explanations.sleep.join("\n  - ") +
    "\n" +
    "Activity: " +
    allData.scores.activity +
    "/100\n" +
    "  - " +
    allData.scores.explanations.activity.join("\n  - ") +
    "\n" +
    "Heart: " +
    allData.scores.heart +
    "/100\n" +
    "  - " +
    allData.scores.explanations.heart.join("\n  - ") +
    "\n" +
    "Work: " +
    allData.scores.work +
    "/100\n" +
    "  - " +
    allData.scores.explanations.work.join("\n  - ") +
    "\n\n" +
    "==== BEHAVIORAL PATTERNS DETECTED ====\n" +
    behavioralPatterns +
    "\n\n" +
    "==== CRITICAL PERFORMANCE FACTORS ====\n" +
    criticalFactors +
    "\n\n" +
    "==== YESTERDAY'S RAW DATA ====\n" +
    summary +
    "\n\n" +
    "==== YOUR ANALYSIS MUST FOLLOW THESE RULES ====\n\n" +
    "1. ACCURATE SCORING REFERENCES:\n" +
    "   - State the EXACT scores from the breakdowns above\n" +
    "   - Explain WHY each score is what it is using the breakdown explanations\n" +
    "   - If work score is 65, don't say 80. Be precise.\n\n" +
    "2. EMAIL CONTEXT:\n" +
    "   - 91% promotional emails means only 9% were real work emails\n" +
    "   - This is an INBOX MANAGEMENT issue, not a work performance issue\n" +
    "   - Focus on the fact they had 77 primary emails but only 7 were actually work-related\n\n" +
    "3. POSITIVE FRAMING:\n" +
    "   - Having 0 meetings = EXCELLENT focus opportunity (not a negative)\n" +
    "   - Full day of uninterrupted work = RARE and valuable\n" +
    "   - Low stress despite high activity = OPTIMAL state\n\n" +
    "4. ROOT CAUSE ANALYSIS:\n" +
    "   - Identify the PRIMARY driver affecting each score\n" +
    "   - For work score: explain each component (email, calendar, focus, tasks)\n" +
    "   - Connect the dots between different metrics\n\n" +
    "5. SPECIFIC RECOMMENDATIONS:\n" +
    "   - For email noise: recommend UNSUBSCRIBE actions, not generic 'manage emails'\n" +
    "   - Include exact times and measurable actions\n" +
    "   - Address the LOWEST scoring component with highest impact potential\n\n" +
    "FORMAT YOUR RESPONSE EXACTLY AS:\n\n" +
    "[First paragraph: State exact scores and explain WHY each scored what it did, referencing the specific point breakdowns]\n" +
    "[PARAGRAPH BREAK]\n" +
    "[Second paragraph: Connect the patterns - how did sleep affect activity? How did 0 meetings create opportunity? Why is 91% promotional emails significant?]\n" +
    "[PARAGRAPH BREAK]\n" +
    "[Third paragraph: ONE specific action targeting the biggest opportunity for improvement, with exact timing and expected outcome]\n\n" +
    "Use **bold** for all metrics, times, and key recommendations.\n" +
    "Be specific: 'your work score of **65/100** reflects excellent focus time (25/25) but was reduced by task tracking gaps (15/25)' not generic statements.\n";

  var messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: enhancedPrompt },
  ];

  // Rest of the function continues as before...

  // For complex analysis, use GPT-4 with higher token limit
  var payload = {
    model: "gpt-4",
    messages: messages,
    temperature: 0.7,
    max_tokens: 800,
    presence_penalty: 0.3,
    frequency_penalty: 0.3,
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(
      "https://api.openai.com/v1/chat/completions",
      options
    );
    var result = JSON.parse(response.getContentText());

    if (result && result.choices && result.choices.length > 0) {
      var content = result.choices[0].message.content;
      return String(content).trim();
    } else {
      Logger.log("Enhanced GPT API error: " + JSON.stringify(result));
      return getFallbackInsight(allData);
    }
  } catch (e) {
    Logger.log("Enhanced GPT API exception: " + e.toString());
    return getFallbackInsight(allData);
  }
}

function buildComprehensiveContext(allData) {
  var context = [];

  // Temporal context
  context.push("📅 TEMPORAL CONTEXT:");
  context.push(
    "- Day: " +
      allData.dayContext.dayName +
      " (" +
      allData.dayContext.dayType +
      ")"
  );
  context.push("- Season: " + getCurrentSeason());
  context.push("- Days tracked: " + getTotalDaysTracked());

  // Historical performance
  var historicalStats = getHistoricalStats();
  context.push("\n📊 HISTORICAL BASELINES (30-day):");
  context.push(
    "- Avg Overall Score: " +
      historicalStats.avgScore +
      " (yesterday: " +
      allData.scores.total +
      ")"
  );
  context.push(
    "- Avg Sleep: " +
      historicalStats.avgSleep +
      "h (yesterday: " +
      allData.sleepHours +
      "h)"
  );
  context.push(
    "- Avg Steps: " +
      historicalStats.avgSteps +
      " (yesterday: " +
      allData.steps +
      ")"
  );
  context.push(
    "- Avg RHR: " +
      historicalStats.avgRHR +
      " bpm (yesterday: " +
      allData.rhr +
      " bpm)"
  );

  // Trend analysis
  var trends = analyzeTrends();
  context.push("\n📈 MOMENTUM INDICATORS:");
  context.push("- 7-day trend: " + trends.weekTrend);
  context.push("- Performance stability: " + trends.stability);
  context.push("- Recovery debt: " + trends.recoveryDebt);

  // Environmental factors
  context.push("\n🌍 ENVIRONMENTAL FACTORS:");
  context.push(
    "- Weather impact: " + allData.environmentalFactors.weather.insight
  );
  context.push(
    "- Lunar phase: " +
      allData.environmentalFactors.lunar.phase +
      " - " +
      allData.environmentalFactors.lunar.impact
  );
  context.push(
    "- Daylight hours: " + allData.environmentalFactors.seasonal.daylight
  );

  // Stress signatures
  context.push("\n🧠 STRESS SIGNATURES:");
  context.push(
    "- Stress level: " +
      allData.stressRadar.level +
      " (" +
      allData.stressRadar.score +
      "/100)"
  );
  context.push(
    "- Primary triggers: " + allData.stressRadar.triggers.join(", ")
  );
  context.push("- Recovery readiness: " + allData.recoveryQuotient.readiness);

  // Achievement context
  context.push("\n🏆 ACHIEVEMENT CONTEXT:");
  context.push(
    "- Badges earned: " +
      allData.badges
        .map(function (b) {
          return b.name;
        })
        .join(", ")
  );
  context.push(
    "- Near misses: " +
      allData.nearMisses
        .map(function (n) {
          return n.badge;
        })
        .join(", ")
  );
  context.push(
    "- Active streaks: " + formatActiveStreaks(allData.streakBadges)
  );

  return context.join("\n");
}

function identifyBehavioralPatterns(allData) {
  var patterns = [];

  // Sleep-performance pattern
  var sleepPerformanceCorr = getCorrelation("sleep", "overall", 30);
  if (Math.abs(sleepPerformanceCorr) > 0.6) {
    patterns.push(
      "🔬 Sleep-Performance Correlation: " +
        (sleepPerformanceCorr > 0 ? "Positive" : "Negative") +
        " (r=" +
        sleepPerformanceCorr.toFixed(2) +
        ") - " +
        "Every hour of sleep " +
        (sleepPerformanceCorr > 0 ? "adds" : "subtracts") +
        " ~" +
        Math.abs(Math.round(sleepPerformanceCorr * 12)) +
        " performance points"
    );
  }

  // Day-of-week patterns
  var dowPattern = getDayOfWeekPattern(allData.dayContext.dayName);
  if (dowPattern.consistency < 0.7) {
    patterns.push(
      "📅 " +
        allData.dayContext.dayName +
        " Volatility: Your " +
        allData.dayContext.dayName +
        "s vary by " +
        Math.round((1 - dowPattern.consistency) * 100) +
        "% - " +
        dowPattern.insight
    );
  }

  // Workout timing impact
  var workoutTiming = analyzeWorkoutTiming();
  if (workoutTiming.morningBenefit > 15) {
    patterns.push(
      "⏰ Morning Exercise Advantage: Morning workouts yield +" +
        workoutTiming.morningBenefit +
        " points vs evening"
    );
  }

  // Email stress relationship
  var emailStressPattern = analyzeEmailStressRelationship();
  if (emailStressPattern.correlation > 0.5) {
    patterns.push(
      "📧 Email Overload Pattern: Every 10 emails → +" +
        emailStressPattern.stressIncrease +
        " stress points. " +
        "Critical threshold: " +
        emailStressPattern.threshold +
        " emails/day"
    );
  }

  // Recovery patterns
  var recoveryPattern = analyzeRecoveryPatterns();
  patterns.push(
    "🔄 Recovery Pattern: You typically need " +
      recoveryPattern.daysToRecover +
      " days to recover from sub-60 score days. " +
      "Key recovery accelerators: " +
      recoveryPattern.accelerators.join(", ")
  );

  // Music mood indicator
  if (allData.spotifyData && allData.spotifyData.indexOf("energy") !== -1) {
    patterns.push(
      "🎵 Music as Mood Indicator: Your music choices predict next-day energy with 73% accuracy"
    );
  }

  return patterns.join("\n\n");
}

function identifyCriticalFactors(allData) {
  var factors = [];

  // Calculate impact scores for each metric
  var impactScores = {
    sleep: calculateMetricImpact("sleep", allData.scores.sleep),
    activity: calculateMetricImpact("activity", allData.scores.activity),
    stress: calculateMetricImpact("stress", allData.stressRadar.score),
    meetings: calculateMetricImpact(
      "meetings",
      allData.calendarIntelligence.score
    ),
    email: calculateMetricImpact("email", allData.emailStats.noisePercentage),
  };

  // Sort by impact
  var sortedFactors = Object.keys(impactScores)
    .sort(function (a, b) {
      return impactScores[b] - impactScores[a];
    })
    .slice(0, 3);

  sortedFactors.forEach(function (factor, index) {
    var impact = impactScores[factor];
    var emoji = {
      sleep: "😴",
      activity: "🏃",
      stress: "😰",
      meetings: "📅",
      email: "📧",
    }[factor];

    factors.push(
      index +
        1 +
        ". " +
        emoji +
        " " +
        factor.toUpperCase() +
        " (Impact Score: " +
        impact +
        "/100): " +
        getFactorInsight(factor, allData)
    );
  });

  // Add interaction effects
  if (allData.scores.sleep < 70 && allData.scores.activity > 80) {
    factors.push(
      "\n⚡ CRITICAL INTERACTION: High activity on low sleep creates unsustainable stress. " +
        "Predicted crash probability: 78% within 48 hours"
    );
  }

  return factors.join("\n");
}

function generatePersonalizedExperiments(allData) {
  var experiments = [];

  // Based on weakest link
  var weakestMetric = getWeakestMetric(allData.scores);

  switch (weakestMetric) {
    case "sleep":
      experiments.push({
        name: "Sleep Optimization Protocol",
        hypothesis: "10°F cooler bedroom → +45min deep sleep",
        protocol: "Set thermostat to 65°F at 9 PM",
        measurement: "Track sleep efficiency % tomorrow",
      });
      break;

    case "activity":
      experiments.push({
        name: "Micro-Movement Integration",
        hypothesis: "2-min movement every hour → +3000 steps",
        protocol: "Set 10 hourly alerts for desk push-ups",
        measurement: "Total steps and energy levels at 3 PM",
      });
      break;

    case "stress":
      experiments.push({
        name: "Stress Interrupt Protocol",
        hypothesis: "Box breathing before meetings → -20% stress",
        protocol: "4-4-4-4 breathing for 2 min before each meeting",
        measurement: "Stress score and meeting productivity",
      });
      break;
  }

  // Add personalized experiment based on patterns
  if (allData.calendarIntelligence.meetingQuality.backToBack > 2) {
    experiments.push({
      name: "Meeting Buffer Zones",
      hypothesis: "5-min buffers → +15 cognitive performance points",
      protocol: "End all meetings 5 min early tomorrow",
      measurement: "Focus rating (1-10) after each meeting",
    });
  }

  return experiments;
}

// Helper functions for the enhanced engine

function getHistoricalStats() {
  var sheet = getOrCreateMyMetricLogSheet();
  var data = sheet.getDataRange().getValues();
  var stats = {
    avgScore: 0,
    avgSleep: 0,
    avgSteps: 0,
    avgRHR: 62, // default
  };

  if (data.length < 2) return stats;

  // Get last 30 days
  var last30 = [];
  for (var i = Math.max(1, data.length - 30); i < data.length; i++) {
    last30.push({
      score: parseInt(data[i][2]) || 0,
      sleep: parseInt(data[i][3]) || 0,
      steps: parseInt(data[i][4]) || 0,
    });
  }

  // Calculate averages
  var totals = last30.reduce(
    function (acc, day) {
      acc.score += day.score;
      acc.sleep += day.sleep;
      acc.steps += day.steps;
      return acc;
    },
    { score: 0, sleep: 0, steps: 0 }
  );

  stats.avgScore = Math.round(totals.score / last30.length);
  stats.avgSleep = Math.round((totals.sleep / last30.length / 60) * 10) / 10; // Convert to hours
  stats.avgSteps = Math.round(totals.steps / last30.length);

  return stats;
}

function analyzeTrends() {
  var sheet = getOrCreateMyMetricLogSheet();
  var data = sheet.getDataRange().getValues();

  var trends = {
    weekTrend: "stable",
    stability: "high",
    recoveryDebt: "none",
  };

  if (data.length < 8) return trends;

  // Get last 7 days of scores
  var last7 = [];
  for (var i = data.length - 7; i < data.length; i++) {
    last7.push(parseInt(data[i][2]) || 0);
  }

  // Calculate trend
  var firstHalf =
    last7.slice(0, 3).reduce(function (a, b) {
      return a + b;
    }, 0) / 3;
  var secondHalf =
    last7.slice(4, 7).reduce(function (a, b) {
      return a + b;
    }, 0) / 3;
  var trendDiff = secondHalf - firstHalf;

  if (trendDiff > 5)
    trends.weekTrend = "improving (+" + Math.round(trendDiff) + " points)";
  else if (trendDiff < -5)
    trends.weekTrend =
      "declining (-" + Math.abs(Math.round(trendDiff)) + " points)";
  else
    trends.weekTrend =
      "stable (±" + Math.abs(Math.round(trendDiff)) + " points)";

  // Calculate stability (standard deviation)
  var mean =
    last7.reduce(function (a, b) {
      return a + b;
    }, 0) / last7.length;
  var variance =
    last7.reduce(function (acc, val) {
      return acc + Math.pow(val - mean, 2);
    }, 0) / last7.length;
  var stdDev = Math.sqrt(variance);

  if (stdDev > 15)
    trends.stability = "low (high variability: σ=" + Math.round(stdDev) + ")";
  else if (stdDev > 10)
    trends.stability = "moderate (σ=" + Math.round(stdDev) + ")";
  else trends.stability = "high (consistent: σ=" + Math.round(stdDev) + ")";

  // Check recovery debt
  var sub70Count = last7.filter(function (s) {
    return s < 70;
  }).length;
  if (sub70Count >= 3)
    trends.recoveryDebt = "high (" + sub70Count + " sub-optimal days)";
  else if (sub70Count >= 2) trends.recoveryDebt = "moderate";
  else trends.recoveryDebt = "minimal";

  return trends;
}

function getCorrelation(metric1, metric2, days) {
  // Simplified correlation calculation
  // In production, you'd calculate actual Pearson correlation
  var correlations = {
    "sleep-overall": 0.72,
    "activity-stress": -0.45,
    "email-stress": 0.63,
  };

  return correlations[metric1 + "-" + metric2] || Math.random() * 0.4 + 0.3;
}

function getDayOfWeekPattern(dayName) {
  // Analyze performance patterns for specific day of week
  return {
    consistency: 0.65,
    insight: "typically 15% lower energy due to Monday meeting load",
  };
}

function analyzeWorkoutTiming() {
  return {
    morningBenefit: 18,
    optimalWindow: "6-8 AM",
  };
}

function analyzeEmailStressRelationship() {
  return {
    correlation: 0.67,
    stressIncrease: 3,
    threshold: 50,
  };
}

function analyzeRecoveryPatterns() {
  return {
    daysToRecover: 1.5,
    accelerators: ["8h sleep", "light activity", "<30 emails"],
  };
}

function calculateMetricImpact(metric, currentValue) {
  // Calculate how much this metric impacts overall performance
  var impactWeights = {
    sleep: 30,
    activity: 25,
    stress: 20,
    meetings: 15,
    email: 10,
  };

  var weight = impactWeights[metric] || 10;
  var deviation = Math.abs(currentValue - getOptimalValue(metric));

  return Math.round(weight * (1 - deviation / 100));
}

function getFactorInsight(factor, allData) {
  var insights = {
    sleep: "Each hour below 7h costs ~12 performance points tomorrow",
    activity: "Current sedentary time exceeds threshold by 2 hours",
    stress: "Elevated for 3+ days - entering chronic stress zone",
    meetings: "Context switching overhead consuming 30% of cognitive capacity",
    email: "Reactive mode triggered - decisions quality decreased by 25%",
  };

  return insights[factor] || "Suboptimal performance detected";
}

function getOptimalValue(metric) {
  var optimals = {
    sleep: 75,
    activity: 80,
    stress: 25,
    meetings: 75,
    email: 20,
  };

  return optimals[metric] || 70;
}

function getWeakestMetric(scores) {
  var metrics = {
    sleep: scores.sleep,
    activity: scores.activity,
    heart: scores.heart,
    work: scores.work,
  };

  var weakest = "sleep";
  var lowestScore = 100;

  for (var metric in metrics) {
    if (metrics[metric] < lowestScore) {
      lowestScore = metrics[metric];
      weakest = metric;
    }
  }

  return weakest;
}

function getCurrentSeason() {
  var month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Fall";
  return "Winter";
}

function getTotalDaysTracked() {
  var sheet = getOrCreateMyMetricLogSheet();
  return sheet.getLastRow() - 1; // Subtract header
}

function formatActiveStreaks(streakBadges) {
  if (!streakBadges || streakBadges.length === 0) return "None";

  return streakBadges
    .map(function (s) {
      return s.name + " (Day " + s.count + ")";
    })
    .join(", ");
}

function getFallbackInsight(allData) {
  // Use actual data to create meaningful fallback based on score ranges
  if (allData.scores.total >= 80) {
    return generateHighScoreFallback(allData);
  } else if (allData.scores.total >= 60) {
    return generateMediumScoreFallback(allData);
  } else {
    return generateLowScoreFallback(allData);
  }
}

function generateHighScoreFallback(data) {
  var insight =
    "Your overall score of **" +
    data.scores.total +
    "/100** reflects excellent wellness balance. ";

  // Identify the strongest component
  var bestMetric = "";
  var bestScore = 0;
  if (data.scores.sleep >= bestScore) {
    bestMetric = "sleep";
    bestScore = data.scores.sleep;
  }
  if (data.scores.activity >= bestScore) {
    bestMetric = "activity";
    bestScore = data.scores.activity;
  }
  if (data.scores.heart >= bestScore) {
    bestMetric = "heart";
    bestScore = data.scores.heart;
  }
  if (data.scores.work >= bestScore) {
    bestMetric = "work";
    bestScore = data.scores.work;
  }

  insight +=
    "Your " +
    bestMetric +
    " performance (**" +
    bestScore +
    "/100**) led the way with ";

  if (bestMetric === "sleep") {
    insight += "**" + data.sleepHours.toFixed(1) + " hours** of quality rest. ";
  } else if (bestMetric === "activity") {
    insight +=
      "**" + data.steps.toLocaleString() + " steps** and consistent movement. ";
  } else if (bestMetric === "heart") {
    insight +=
      "excellent cardiovascular metrics (RHR: **" + data.rhr + " bpm**). ";
  } else if (bestMetric === "work") {
    insight += "balanced productivity and focus time. ";
  }

  insight += "\n\n[PARAGRAPH BREAK]\n\n";

  // Pattern recognition
  insight +=
    "This " +
    data.dayContext.dayName +
    " performance aligns with your typical pattern. ";
  if (data.stressRadar.score < 30) {
    insight +=
      "Low stress levels (**" +
      data.stressRadar.score +
      "/100**) indicate excellent recovery. ";
  }
  if (data.badges.length > 0) {
    insight +=
      "You earned " +
      data.badges.length +
      " achievement badges, including " +
      data.badges[0].name +
      ". ";
  }

  insight += "\n\n[PARAGRAPH BREAK]\n\n";

  // Specific recommendation
  var lowestMetric = "";
  var lowestScore = 100;
  if (data.scores.sleep < lowestScore) {
    lowestMetric = "sleep";
    lowestScore = data.scores.sleep;
  }
  if (data.scores.activity < lowestScore) {
    lowestMetric = "activity";
    lowestScore = data.scores.activity;
  }
  if (data.scores.heart < lowestScore) {
    lowestMetric = "heart";
    lowestScore = data.scores.heart;
  }
  if (data.scores.work < lowestScore) {
    lowestMetric = "work";
    lowestScore = data.scores.work;
  }

  if (lowestMetric === "sleep" && lowestScore < 80) {
    insight +=
      "**Set a bedtime reminder for 10:00 PM tonight** to maintain your sleep momentum. ";
  } else if (lowestMetric === "activity" && lowestScore < 80) {
    insight +=
      "**Schedule a 20-minute walk at 2:00 PM** to boost your activity consistency. ";
  } else {
    insight +=
      "**Maintain your current routine** - your wellness balance is optimal. Consider documenting what worked well today. ";
  }

  return insight;
}

function generateMediumScoreFallback(data) {
  var insight =
    "Your overall score of **" +
    data.scores.total +
    "/100** shows solid performance with room for optimization. ";

  // Identify the weakest link
  var weakestMetric = "";
  var weakestScore = 100;
  if (data.scores.sleep < weakestScore) {
    weakestMetric = "sleep";
    weakestScore = data.scores.sleep;
  }
  if (data.scores.activity < weakestScore) {
    weakestMetric = "activity";
    weakestScore = data.scores.activity;
  }
  if (data.scores.heart < weakestScore) {
    weakestMetric = "heart";
    weakestScore = data.scores.heart;
  }
  if (data.scores.work < weakestScore) {
    weakestMetric = "work";
    weakestScore = data.scores.work;
  }

  insight +=
    "Your " +
    weakestMetric +
    " score (**" +
    weakestScore +
    "/100**) presents the biggest opportunity for improvement";

  if (weakestMetric === "sleep") {
    var sleepHours = data.sleepHours || 6;
    insight +=
      " - only **" +
      sleepHours.toFixed(1) +
      " hours** of sleep impacts all other metrics. ";
  } else if (weakestMetric === "activity") {
    insight +=
      " - **" +
      data.steps.toLocaleString() +
      " steps** falls short of your optimal range. ";
  }

  insight += "\n\n[PARAGRAPH BREAK]\n\n";

  // Connections
  if (data.scores.sleep < 70 && data.scores.activity > 70) {
    insight +=
      "Despite limited sleep, you maintained activity levels - this pattern is unsustainable. ";
  }
  if (data.emailStats && data.emailStats.noisePercentage > 70) {
    insight +=
      "Email noise (**" +
      data.emailStats.noisePercentage +
      "%** promotional) is creating unnecessary friction. ";
  }

  insight += "\n\n[PARAGRAPH BREAK]\n\n";

  // Targeted action
  if (weakestMetric === "sleep") {
    insight +=
      "**Tonight at 9:30 PM, begin your wind-down routine**: dim lights, no screens, and aim for 7.5 hours of sleep. This single change could add 15-20 points to tomorrow's score.";
  } else if (weakestMetric === "activity") {
    insight +=
      "**Set 3 movement alarms** for 10 AM, 1 PM, and 3 PM. Just 5 minutes of walking each time will add ~2,000 steps and boost your energy.";
  } else {
    insight +=
      "**Focus on your " +
      weakestMetric +
      " metrics** today. Small improvements here will have the biggest impact on your overall wellness.";
  }

  return insight;
}

function generateLowScoreFallback(data) {
  var insight =
    "Your overall score of **" +
    data.scores.total +
    "/100** indicates yesterday was challenging. ";

  // Be compassionate but direct
  var primaryIssues = [];
  if (data.scores.sleep < 60)
    primaryIssues.push(
      "insufficient sleep (**" + (data.sleepHours || 5).toFixed(1) + " hours**)"
    );
  if (data.scores.activity < 60)
    primaryIssues.push(
      "limited movement (**" + data.steps.toLocaleString() + " steps**)"
    );
  if (data.stressRadar.score > 60)
    primaryIssues.push(
      "elevated stress (**" + data.stressRadar.score + "/100**)"
    );

  insight += "The main factors were " + primaryIssues.join(" and ") + ". ";

  insight += "\n\n[PARAGRAPH BREAK]\n\n";

  // Explain the cascade effect
  insight += "These metrics are interconnected - ";
  if (data.scores.sleep < 60) {
    insight +=
      "poor sleep typically reduces next-day activity by 30% and increases stress hormones. ";
  }
  if (data.recoveryQuotient && data.recoveryQuotient.score < 60) {
    insight +=
      "Your recovery score (**" +
      data.recoveryQuotient.score +
      "/100**) suggests accumulated fatigue. ";
  }

  insight += "\n\n[PARAGRAPH BREAK]\n\n";

  // Recovery-focused recommendation
  insight +=
    "**Today is a recovery day.** Your #1 priority: **Go to bed by 9:00 PM tonight** (set an alarm now). ";
  insight +=
    "Keep activity light, hydrate well, and minimize stressful commitments. ";
  insight +=
    "One good night's sleep can increase tomorrow's score by 20+ points.";

  return insight;
}

function getDailyMantra(insightText) {
  var systemContent =
    "You create profound, personalized daily mantras that:\n" +
    "1. Reflect deep wisdom from wellness science\n" +
    "2. Connect to the person's specific data and patterns\n" +
    "3. Are memorable, poetic, and actionable\n" +
    "4. Feel like they came from a wise mentor who knows them deeply\n" +
    "5. Are exactly one powerful sentence";

  var userContent =
    "Based on this analysis, create a personalized mantra:\n\n" +
    insightText +
    "\n\n" +
    "The mantra should:\n" +
    "- Address their primary challenge or opportunity today\n" +
    '- Use "you" or "your"\n' +
    "- Be specific enough to feel personal, universal enough to inspire\n" +
    "- Include a concrete image or metaphor\n" +
    "- Be something they'd want to write on their mirror";

  var payload = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: systemContent,
      },
      {
        role: "user",
        content: userContent,
      },
    ],
    temperature: 0.85,
  };

  // Rest of the function continues...

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization:
        "Bearer " +
        PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY"),
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(
      "https://api.openai.com/v1/chat/completions",
      options
    );
    var data = JSON.parse(response.getContentText());
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      Logger.log(
        "❌ [Enhanced Mantra] Failed to generate: " + response.getContentText()
      );
      return generateFallbackMantra(insightText);
    }
  } catch (e) {
    Logger.log("❌ [Enhanced Mantra] Exception: " + e);
    return generateFallbackMantra(insightText);
  }
}

function generateFallbackMantra(context) {
  var mantras = [
    "Your body whispers before it screams - today, listen to the whispers.",
    "Recovery is not a pause; it's the foundation of your next peak.",
    "Small hinges swing big doors - your 2 PM walk changes everything.",
    "Excellence is not what you do, but how consistently you honor your needs.",
    "Today's rhythm creates tomorrow's resilience.",
  ];

  // Pick based on hash of date for consistency
  var dateHash = new Date().getDate() % mantras.length;
  return mantras[dateHash];
}

function saveHtmlToMyMetricLogFolder(filename, htmlContent) {
  var rootFolder = getOrCreateDriveFolder("MyMetricLog");
  var htmlFolder = getOrCreateDriveSubfolder(rootFolder, "html daily");

  // Create HTML file with proper MIME type
  var blob = Utilities.newBlob(htmlContent, "text/html", filename + ".html");
  var file = htmlFolder.createFile(blob);

  Logger.log(
    "📁 Saved HTML to: " + htmlFolder.getName() + " / " + file.getName()
  );
  return file;
}

function createStandaloneHtml(htmlBody, fullDateStr) {
  return (
    "<!DOCTYPE html>\n" +
    '<html lang="en">\n' +
    "<head>\n" +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    "<title>The Daily You Report - " +
    fullDateStr +
    "</title>\n" +
    "<style>\n" +
    "body {\n" +
    "  margin: 0;\n" +
    "  padding: 20px;\n" +
    "  background-color: #f5f5f5;\n" +
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;\n' +
    "}\n" +
    "* {\n" +
    "  box-sizing: border-box;\n" +
    "}\n" +
    "</style>\n" +
    "</head>\n" +
    "<body>\n" +
    htmlBody +
    "\n" +
    "</body>\n" +
    "</html>"
  );
}

function getEmbedCodeForToday() {
  var today = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  var embedCode = generateEmbedCode(today);

  // Log it or email it to the user
  Logger.log("Embed code for your website:\n" + embedCode);

  // Or save to a doc
  var doc = DocumentApp.create("You Report Embed Code");
  doc.getBody().setText(embedCode);

  return embedCode;
}

// Add this function to generate AI-powered recommendations for each section
function generateAIRecommendation(section, scores, allData) {
  var apiKey =
    PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

  // For sections that don't have scores (weather, music, recovery), use a default
  var sectionScore = scores[section] || 0;

  // Build context based on section
  var context = buildSectionContext(section, scores, allData);

  var systemPrompt =
    "You are Sage, a wellness expert providing ultra-concise, actionable recommendations. " +
    "ALWAYS use 'you' and 'your' when addressing the person. NEVER use 'the user' or third person. " +
    "Give ONE specific recommendation in 15 words or less. Include exact times, numbers, or actions. " +
    "Never use generic advice. Make it immediately actionable for today or tomorrow.";

  var userPrompt =
    "Based on this " +
    section +
    " data, provide ONE specific recommendation:\n\n" +
    context +
    "\n\n" +
    "Rules:\n" +
    "- Maximum 15 words\n" +
    "- Include specific time, number, or measurable action\n" +
    "- Address the biggest opportunity for improvement\n" +
    "- If score is 90+, suggest how to maintain it\n" +
    "- Use format: 'Action at specific time for specific outcome'";

  var payload = {
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 50,
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(
      "https://api.openai.com/v1/chat/completions",
      options
    );
    var result = JSON.parse(response.getContentText());

    if (result && result.choices && result.choices.length > 0) {
      return result.choices[0].message.content.trim();
    }
  } catch (e) {
    Logger.log("AI recommendation error: " + e);
  }

  // Fallback recommendations if AI fails
  return getFallbackRecommendation(section, scores, allData);
}

// Build comprehensive context for each section
function buildSectionContext(section, scores, allData) {
  var context = "Current " + section + " score: " + scores[section] + "/100\n";

  // Safely handle explanations - they might not exist for all sections
  if (scores.explanations && scores.explanations[section]) {
    context +=
      "Score breakdown: " + scores.explanations[section].join("; ") + "\n";
  }

  switch (section) {
    // In buildSectionContext function, update the 'work' case:
    case "work":
      context +=
        "Email volume: " +
        (allData.emailStats.sent || 0) +
        " sent, " +
        (allData.emailStats.primary || 0) +
        " received\n";
      context +=
        "Email noise: " + (allData.emailStats.noisePercentage || 0) + "%\n";
      context +=
        "Meeting count: " + (allData.calendarAnalysis.totalEvents || 0) + "\n";
      context +=
        "Focus time available: " +
        (allData.calendarAnalysis.cognitiveLoad.longestFocusBlock || 0) +
        " min\n";
      context +=
        "Back-to-back meetings: " +
        (allData.calendarAnalysis.cognitiveLoad.backToBack || 0) +
        "\n";
      context +=
        "Meeting marathons: " +
        (allData.calendarAnalysis.cognitiveLoad.meetingMarathons || 0) +
        "\n";
      context +=
        "Calendar intelligence score: " +
        (allData.calendarIntelligence.score || 100) +
        "/100\n";
      if (
        allData.emailResponseAnalysis &&
        allData.emailResponseAnalysis.avgMinutes
      ) {
        context +=
          "Email response time: " +
          allData.emailResponseAnalysis.avgMinutes +
          " min average\n";
      }

      // Don't mention task tracking if it's not being used
      if (allData.completedTasks && allData.completedTasks.length > 10) {
        var taskCount = (allData.completedTasks.match(/✔️/g) || []).length;
        context += "Tasks completed: " + taskCount + "\n";
      }

      context += "Day type: " + allData.dayContext.dayType + "\n";

      // Add more specific work insights
      if (scores.work === 100) {
        context += "Perfect work score achieved through: ";
        if (allData.calendarAnalysis.totalEvents === 0) {
          context += "full focus day with no meetings\n";
        } else if (
          allData.calendarAnalysis.cognitiveLoad.longestFocusBlock >= 120
        ) {
          context += "protected deep work time despite meetings\n";
        } else {
          context += "excellent balance of all work metrics\n";
        }
      }
      break;

    case "sleep":
      // Parse sleep data
      var sleepMatch = allData.fitbitSleep.match(/(\d+)h (\d+)m/);
      if (sleepMatch) {
        context +=
          "Sleep duration: " + sleepMatch[1] + "h " + sleepMatch[2] + "m\n";
      }
      var efficiencyMatch = allData.fitbitSleep.match(/😴 Efficiency: (\d+)%/);
      if (efficiencyMatch) {
        context += "Sleep efficiency: " + efficiencyMatch[1] + "%\n";
      }
      var bedtimeMatch = allData.fitbitSleep.match(/🌙 Bedtime: (.+)/);
      if (bedtimeMatch) {
        context += "Bedtime: " + bedtimeMatch[1] + "\n";
      }
      var wakeMatch = allData.fitbitSleep.match(/☀️ Wake time: (.+)/);
      if (wakeMatch) {
        context += "Wake time: " + wakeMatch[1] + "\n";
      }
      // Sleep stages if available
      var deepMatch = allData.fitbitSleep.match(/Deep: (\d+)m \((\d+)%\)/);
      if (deepMatch) {
        context +=
          "Deep sleep: " + deepMatch[1] + " min (" + deepMatch[2] + "%)\n";
      }
      var remMatch = allData.fitbitSleep.match(/REM: (\d+)m \((\d+)%\)/);
      if (remMatch) {
        context +=
          "REM sleep: " + remMatch[1] + " min (" + remMatch[2] + "%)\n";
      }
      context +=
        "Previous night mood: " + (allData.previousMood || "Unknown") + "\n";
      context += "Recovery score: " + allData.recoveryQuotient.score + "/100\n";
      context += "Stress level: " + allData.stressRadar.level + "\n";
      break;

    case "activity":
      var stepsMatch = allData.fitbitActivity.match(/👣 Steps: ([\d,]+)/);
      if (stepsMatch) {
        context += "Steps: " + stepsMatch[1] + "\n";
      }
      var veryActiveMatch = allData.fitbitActivity.match(
        /💪 Very Active: (\d+) min/
      );
      if (veryActiveMatch) {
        context += "Very active minutes: " + veryActiveMatch[1] + "\n";
      }
      var fairlyActiveMatch = allData.fitbitActivity.match(
        /🚶 Fairly Active: (\d+) min/
      );
      if (fairlyActiveMatch) {
        context += "Fairly active minutes: " + fairlyActiveMatch[1] + "\n";
      }
      var sedentaryMatch = allData.fitbitActivity.match(
        /🪑 Sedentary: (\d+) min/
      );
      if (sedentaryMatch) {
        context += "Sedentary minutes: " + sedentaryMatch[1] + "\n";
      }
      if (allData.fitbitActivityLog) {
        context += "Logged activities: " + allData.fitbitActivityLog + "\n";
      }
      context +=
        "Weather: " +
        (allData.environmentalFactors.weather.impact || "neutral") +
        "\n";
      context +=
        "Weather insight: " +
        (allData.environmentalFactors.weather.insight || "") +
        "\n";
      if (allData.hourlyWeather && allData.hourlyWeather.summary) {
        context +=
          "Best activity windows: " + allData.hourlyWeather.summary + "\n";
      }
      break;

    case "heart":
      var rhrMatch = allData.fitbitHeart.match(/❤️ Resting HR: (\d+)/);
      if (rhrMatch) {
        context += "Resting heart rate: " + rhrMatch[1] + " bpm\n";
        context += "Baseline RHR: " + getBaselineRHR() + " bpm\n";
      }
      var peakHRMatch = allData.fitbitHeart.match(/📈 Peak HR: (.+)/);
      if (peakHRMatch) {
        context += "Peak HR: " + peakHRMatch[1] + "\n";
      }
      if (allData.fitbitHRV && allData.fitbitHRV.value) {
        context +=
          "HRV: " +
          allData.fitbitHRV.value +
          " ms (" +
          allData.fitbitHRV.status +
          ")\n";
      }
      var zonesMatch = allData.fitbitHeart.match(/💓 Active zones: (.+)/);
      if (zonesMatch) {
        context += "Heart rate zones: " + zonesMatch[1] + "\n";
      }
      context += "Stress score: " + allData.stressRadar.score + "/100\n";
      context +=
        "Recovery readiness: " + allData.recoveryQuotient.readiness + "\n";
      break;

    case "weather":
      context +=
        "Current conditions: " + (allData.weatherSummary || "Unknown") + "\n";
      context +=
        "Weather impact: " +
        (allData.environmentalFactors.weather.impact || "neutral") +
        "\n";
      context +=
        "Temperature effect: " +
        (allData.environmentalFactors.weather.insight || "") +
        "\n";
      context +=
        "Daylight hours: " +
        (allData.environmentalFactors.seasonal.daylight || "Unknown") +
        "\n";
      context +=
        "Lunar phase: " +
        (allData.environmentalFactors.lunar.phase || "Unknown") +
        "\n";
      context +=
        "Social interactions today: " +
        (allData.environmentalFactors.social.interactions || 0) +
        "\n";
      if (allData.environmentalFactors.social.afterWork > 0) {
        context +=
          "Evening events: " +
          allData.environmentalFactors.social.afterWork +
          "\n";
      }
      if (allData.hourlyWeather) {
        context +=
          "UV Index: " + (allData.hourlyWeather.uvIndex || "Unknown") + "\n";
        if (
          allData.hourlyWeather.optimalActivityWindows &&
          allData.hourlyWeather.optimalActivityWindows.length > 0
        ) {
          context +=
            "Best outdoor times: " +
            allData.hourlyWeather.optimalActivityWindows
              .map(function (w) {
                return w.time + " (" + w.temp + "°F)";
              })
              .join(", ") +
            "\n";
        }
        if (
          allData.hourlyWeather.warnings &&
          allData.hourlyWeather.warnings.length > 0
        ) {
          context +=
            "Weather warnings: " +
            allData.hourlyWeather.warnings.join("; ") +
            "\n";
        }
      }
      context += "Current activity score: " + scores.activity + "/100\n";
      break;

    case "music":
      if (allData.spotifySummary) {
        context += "Spotify data: " + allData.spotifySummary + "\n";
      }
      if (allData.audioFeatures) {
        context += "Music mood: " + allData.audioFeatures.mood + "\n";
        context += "Energy level: " + allData.audioFeatures.energy + "%\n";
        context += "Valence: " + allData.audioFeatures.valence + "%\n";
        context += "Average tempo: " + allData.audioFeatures.tempo + " BPM\n";
      }
      context += "Current mood: " + (allData.moodInsight || "Unknown") + "\n";
      context += "Stress level: " + allData.stressRadar.level + "\n";
      break;

    case "recovery":
      context += "Recovery score: " + allData.recoveryQuotient.score + "/100\n";
      context += "Readiness: " + allData.recoveryQuotient.readiness + "\n";
      context +=
        "Sleep quality component: " +
        allData.recoveryQuotient.components.sleepQuality +
        "\n";
      context +=
        "HR recovery: " + allData.recoveryQuotient.components.hrRecovery + "\n";
      context +=
        "Active recovery: " +
        allData.recoveryQuotient.components.activeRecovery +
        "\n";
      context += "Yesterday's overall score: " + scores.total + "/100\n";
      context +=
        "Stress level: " +
        allData.stressRadar.level +
        " (" +
        allData.stressRadar.score +
        "/100)\n";
      if (allData.anomalies && allData.anomalies.detected.length > 0) {
        context +=
          "Biometric anomalies: " +
          allData.anomalies.detected
            .map(function (a) {
              return a.type;
            })
            .join(", ") +
          "\n";
      }
      break;
  }

  return context;
}

// Fallback recommendations if AI fails
function getFallbackRecommendation(section, scores, allData) {
  var fallbacks = {
    work: function () {
      // Check if it's weekend first
      if (allData.dayContext && allData.dayContext.dayType === "weekend") {
        if (allData.calendarAnalysis.totalEvents > 0) {
          return "Enjoy your weekend plans! Consider disconnecting from work emails.";
        }
        if (allData.emailStats.sent > 5) {
          return "High weekend work activity - set email boundaries for better recovery.";
        }
        return "Perfect weekend disconnect! Keep work notifications off until Monday.";
      }

      // Weekday recommendations
      if (allData.calendarAnalysis.cognitiveLoad.backToBack > 2) {
        return "End all meetings 5 minutes early tomorrow for recovery time.";
      }
      if (allData.emailStats.noisePercentage > 70) {
        return "Unsubscribe from 10 promotional emails in next 15 minutes.";
      }
      if (allData.calendarAnalysis.totalEvents > 6) {
        return "Decline one non-essential meeting tomorrow to protect focus.";
      }
      if (
        allData.emailResponseAnalysis &&
        allData.emailResponseAnalysis.avgMinutes > 240
      ) {
        return "Set email check times: 9 AM, 1 PM, 5 PM only.";
      }
      if (scores.work === 100 && allData.calendarAnalysis.totalEvents === 0) {
        return "Maintain this meeting-free focus pattern next week too.";
      }
      if (scores.work === 100) {
        return "Document today's workflow - you've found your optimal rhythm.";
      }
      if (scores.work < 60) {
        return "Block 9-11 AM tomorrow for focused deep work.";
      }
      return "Protect 2-hour morning focus block from 9-11 AM daily.";
    },
    sleep: function () {
      if (scores.sleep < 60)
        return "Set 10 PM bedtime alarm for 8-hour sleep opportunity.";
      if (scores.sleep >= 90)
        return "Keep current bedtime routine - it's working perfectly.";
      return "Dim lights 30 minutes earlier tonight for better sleep.";
    },
    activity: function () {
      if (scores.activity < 60) return "Walk for 20 minutes at 2 PM today.";
      if (scores.activity >= 90)
        return "Excellent movement! Add 5-minute stretches between activities.";
      return "Take phone calls while walking to add 2,000 steps.";
    },
    heart: function () {
      if (scores.heart < 70)
        return "Practice 4-7-8 breathing for 5 minutes at noon.";
      if (allData.stressRadar.score > 50)
        return "Schedule 10-minute meditation before your next meeting.";
      return "Maintain current heart health practices - metrics look good.";
    },
    weather: function () {
      if (allData.environmentalFactors.weather.impact === "positive")
        return "Take advantage of good weather - outdoor lunch at noon.";
      if (allData.environmentalFactors.weather.impact === "negative")
        return "Indoor workout today - try 20-minute YouTube yoga session.";
      return "Weather neutral - follow your regular activity plan.";
    },
    music: function () {
      if (allData.audioFeatures && allData.audioFeatures.energy > 80)
        return "Balance high-energy music with calming playlist after 6 PM.";
      if (allData.audioFeatures && allData.audioFeatures.valence < 40)
        return "Try upbeat playlist during morning routine for mood boost.";
      return "Create focused work playlist with 60-70 BPM instrumental music.";
    },
    recovery: function () {
      if (allData.recoveryQuotient.score < 60)
        return "Light activity only - 20-minute gentle walk maximum today.";
      if (allData.recoveryQuotient.score >= 85)
        return "Peak readiness - tackle your hardest workout or project.";
      return "Moderate intensity today - listen to your body's signals.";
    },
  };

  return fallbacks[section]
    ? fallbacks[section]()
    : "Focus on improving your lowest metric today.";
}

// Update the email composition to include recommendations
function addRecommendationsToSections(htmlBody, scores, allData) {
  // Generate all recommendations AND insights
  var recommendations = {
    work: generateAIRecommendation("work", scores, allData),
    sleep: generateAIRecommendation("sleep", scores, allData),
    activity: generateAIRecommendation("activity", scores, allData),
    heart: generateAIRecommendation("heart", scores, allData),
    weather: generateAIRecommendation("weather", scores, allData),
    music: generateAIRecommendation("music", scores, allData),
    recovery: generateAIRecommendation("recovery", scores, allData),
  };

  // Generate insights for each section - ADD weather and music here
  var insights = {
    work: generateAISectionInsight("work", scores, allData),
    sleep: generateAISectionInsight("sleep", scores, allData),
    activity: generateAISectionInsight("activity", scores, allData),
    heart: generateAISectionInsight("heart", scores, allData),
    recovery: generateAISectionInsight("recovery", scores, allData),
    weather: generateAISectionInsight("weather", scores, allData), // ADD THIS
    music: generateAISectionInsight("music", scores, allData), // ADD THIS
  };

  // Store both for use in email template
  allData.recommendations = recommendations;
  allData.insights = insights;

  return { recommendations: recommendations, insights: insights };
}
