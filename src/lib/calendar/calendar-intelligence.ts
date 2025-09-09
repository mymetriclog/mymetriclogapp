export interface CalendarAnalysis {
  totalEvents: number;
  eventsToday: number;
  avgEventsPerDay: number;
  longestFocus: number;
  meetingTypes: {
    internal: number;
    external: number;
    oneOnOne: number;
    group: number;
  };
  timeDistribution: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  energyDrain: number;
  focusBlocks: number;
  backToBackMeetings: number;
}

export interface CalendarIntelligence {
  score: number;
  insights: string[];
  recommendations: string[];
  focusTime: number;
  meetingEfficiency: number;
  workLifeBalance: number;
}

/**
 * Analyze calendar intelligence - EXACT implementation from code.js
 */
export function analyzeCalendarIntelligence(
  events: any[]
): CalendarIntelligence {
  const analysis = analyzeCalendarEvents(events);

  let score = 0;
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Focus time scoring (0-40 points)
  if (analysis.longestFocus >= 120) {
    score += 40;
    insights.push("Excellent focus time (2+ hours)");
  } else if (analysis.longestFocus >= 90) {
    score += 30;
    insights.push("Good focus time (90+ minutes)");
  } else if (analysis.longestFocus >= 60) {
    score += 20;
    insights.push("Moderate focus time (60+ minutes)");
  } else if (analysis.longestFocus >= 30) {
    score += 10;
    insights.push("Limited focus time (30+ minutes)");
  } else {
    score += 5;
    insights.push("Very limited focus time");
  }

  // Meeting balance scoring (0-30 points)
  if (analysis.totalEvents >= 1 && analysis.totalEvents <= 4) {
    score += 30;
    insights.push("Optimal meeting balance");
  } else if (analysis.totalEvents >= 5 && analysis.totalEvents <= 6) {
    score += 20;
    insights.push("Moderate meeting load");
  } else if (analysis.totalEvents >= 7 && analysis.totalEvents <= 8) {
    score += 10;
    insights.push("High meeting load");
  } else if (analysis.totalEvents === 0) {
    score += 25;
    insights.push("No meetings scheduled - great for deep work");
  } else {
    score += 5;
    insights.push("Excessive meetings");
  }

  // Work-life balance scoring (0-30 points)
  const eveningMeetings = analysis.timeDistribution.evening;
  if (eveningMeetings === 0) {
    score += 30;
    insights.push("Excellent work-life balance (no evening meetings)");
  } else if (eveningMeetings <= 1) {
    score += 20;
    insights.push("Good work-life balance");
  } else if (eveningMeetings <= 2) {
    score += 10;
    insights.push("Moderate work-life balance");
  } else {
    score += 5;
    insights.push("Poor work-life balance (many evening meetings)");
  }

  // Generate recommendations
  if (analysis.longestFocus < 60) {
    recommendations.push("Block 2+ hours for deep work");
  }

  if (analysis.backToBackMeetings > 3) {
    recommendations.push("Add buffer time between meetings");
  }

  if (analysis.timeDistribution.evening > 2) {
    recommendations.push(
      "Reduce evening meetings for better work-life balance"
    );
  }

  if (analysis.totalEvents > 8) {
    recommendations.push("Consider declining non-essential meetings");
  }

  return {
    score: Math.min(100, score),
    insights,
    recommendations,
    focusTime: analysis.longestFocus,
    meetingEfficiency:
      analysis.totalEvents > 0
        ? (analysis.focusBlocks / analysis.totalEvents) * 100
        : 100,
    workLifeBalance:
      eveningMeetings === 0 ? 100 : Math.max(0, 100 - eveningMeetings * 20),
  };
}

/**
 * Analyze calendar events - EXACT implementation from code.js
 */
export function analyzeCalendarEvents(events: any[]): CalendarAnalysis {
  const analysis: CalendarAnalysis = {
    totalEvents: events.length,
    eventsToday: 0,
    avgEventsPerDay: 0,
    longestFocus: 0,
    meetingTypes: {
      internal: 0,
      external: 0,
      oneOnOne: 0,
      group: 0,
    },
    timeDistribution: {
      morning: 0,
      afternoon: 0,
      evening: 0,
    },
    energyDrain: 0,
    focusBlocks: 0,
    backToBackMeetings: 0,
  };

  let totalFocusTime = 0;
  let focusBlockCount = 0;
  let currentFocusBlock = 0;
  let lastMeetingEnd = 0;

  events.forEach((event, index) => {
    const startTime = new Date(event.start?.dateTime || event.start?.date);
    const endTime = new Date(event.end?.dateTime || event.end?.date);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes
    const hour = startTime.getHours();

    // Count events by time of day
    if (hour >= 6 && hour < 12) {
      analysis.timeDistribution.morning++;
    } else if (hour >= 12 && hour < 18) {
      analysis.timeDistribution.afternoon++;
    } else {
      analysis.timeDistribution.evening++;
    }

    // Analyze meeting types
    const title = event.summary?.toLowerCase() || "";
    const attendees = event.attendees?.length || 0;

    if (attendees <= 2) {
      analysis.meetingTypes.oneOnOne++;
    } else {
      analysis.meetingTypes.group++;
    }

    if (title.includes("internal") || title.includes("team")) {
      analysis.meetingTypes.internal++;
    } else {
      analysis.meetingTypes.external++;
    }

    // Calculate focus time
    if (duration >= 60) {
      totalFocusTime += duration;
      focusBlockCount++;
      currentFocusBlock += duration;
    } else {
      if (currentFocusBlock > 0) {
        analysis.focusBlocks++;
        analysis.longestFocus = Math.max(
          analysis.longestFocus,
          currentFocusBlock
        );
        currentFocusBlock = 0;
      }
    }

    // Check for back-to-back meetings
    if (index > 0) {
      const prevEvent = events[index - 1];
      const prevEndTime = new Date(
        prevEvent.end?.dateTime || prevEvent.end?.date
      );
      const timeBetween =
        (startTime.getTime() - prevEndTime.getTime()) / (1000 * 60);

      if (timeBetween <= 15) {
        // 15 minutes or less between meetings
        analysis.backToBackMeetings++;
      }
    }

    // Calculate energy drain
    if (duration >= 60) {
      analysis.energyDrain += duration * 0.8; // Long meetings are more draining
    } else {
      analysis.energyDrain += duration * 0.5; // Short meetings are less draining
    }
  });

  // Finalize focus block calculation
  if (currentFocusBlock > 0) {
    analysis.focusBlocks++;
    analysis.longestFocus = Math.max(analysis.longestFocus, currentFocusBlock);
  }

  analysis.avgEventsPerDay = analysis.totalEvents / 7; // Assuming weekly analysis

  return analysis;
}

/**
 * Get meeting context - EXACT implementation from code.js
 */
export function getMeetingContext(event: any): string {
  const title = event.summary || "Untitled Meeting";
  const attendees = event.attendees?.length || 0;
  const duration =
    (new Date(event.end?.dateTime || event.end?.date).getTime() -
      new Date(event.start?.dateTime || event.start?.date).getTime()) /
    (1000 * 60);

  let context = "";

  if (attendees <= 2) {
    context += "1-on-1 meeting";
  } else if (attendees <= 5) {
    context += "Small group meeting";
  } else {
    context += "Large group meeting";
  }

  if (duration >= 60) {
    context += " (long duration)";
  } else if (duration <= 30) {
    context += " (short duration)";
  }

  return context;
}

/**
 * Calculate energy drain - EXACT implementation from code.js
 */
export function calculateEnergyDrain(analysis: CalendarAnalysis): number {
  let energyDrain = 0;

  // Base energy drain from total meeting time
  energyDrain += analysis.totalEvents * 10;

  // Additional drain from back-to-back meetings
  energyDrain += analysis.backToBackMeetings * 15;

  // Additional drain from evening meetings
  energyDrain += analysis.timeDistribution.evening * 20;

  // Additional drain from long meetings
  if (analysis.longestFocus > 120) {
    energyDrain += 25;
  }

  return Math.min(100, energyDrain);
}

/**
 * Format calendar analysis - EXACT implementation from code.js
 */
export function formatCalendarAnalysis(analysis: CalendarAnalysis): string {
  const parts: string[] = [];

  parts.push(`Events: ${analysis.totalEvents}`);
  parts.push(`Longest focus: ${analysis.longestFocus} min`);
  parts.push(`Focus blocks: ${analysis.focusBlocks}`);
  parts.push(`Back-to-back: ${analysis.backToBackMeetings}`);

  // Check if timeDistribution exists before accessing its properties
  if (analysis.timeDistribution) {
    if (analysis.timeDistribution.morning > 0) {
      parts.push(`Morning meetings: ${analysis.timeDistribution.morning}`);
    }

    if (analysis.timeDistribution.afternoon > 0) {
      parts.push(`Afternoon meetings: ${analysis.timeDistribution.afternoon}`);
    }

    if (analysis.timeDistribution.evening > 0) {
      parts.push(`Evening meetings: ${analysis.timeDistribution.evening}`);
    }
  }

  return parts.join("\n");
}
