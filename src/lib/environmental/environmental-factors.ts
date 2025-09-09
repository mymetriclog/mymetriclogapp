export interface EnvironmentalFactors {
  weather: {
    impact: "positive" | "negative" | "neutral";
    insight: string;
    temperature: number;
    condition: string;
    uvIndex: number;
  };
  seasonal: {
    sunrise: string;
    sunset: string;
    daylight: number;
    insight?: string;
  };
  lunar: {
    phase: string;
    impact: string;
  };
  social: {
    weekend: boolean;
    holiday: boolean;
    impact: string;
  };
}

/**
 * Get social and environmental factors - EXACT implementation from code.js
 */
export function getSocialEnvironmentalFactors(
  date: Date,
  weatherData: any,
  calendarAnalysis: any
): EnvironmentalFactors {
  const factors: EnvironmentalFactors = {
    weather: {
      impact: "neutral",
      insight: "",
      temperature: 0,
      condition: "",
      uvIndex: 0,
    },
    seasonal: {
      sunrise: "",
      sunset: "",
      daylight: 0,
    },
    lunar: {
      phase: "",
      impact: "",
    },
    social: {
      weekend: false,
      holiday: false,
      impact: "",
    },
  };

  // Weather analysis
  if (weatherData) {
    factors.weather.temperature = weatherData.temperature || 0;
    factors.weather.condition = weatherData.condition || "";
    factors.weather.uvIndex = weatherData.uvIndex || 0;

    // Determine weather impact
    if (
      weatherData.condition?.toLowerCase().includes("sunny") ||
      weatherData.condition?.toLowerCase().includes("clear")
    ) {
      factors.weather.impact = "positive";
      factors.weather.insight = "Sunny weather boosts mood and energy";
    } else if (
      weatherData.condition?.toLowerCase().includes("rain") ||
      weatherData.condition?.toLowerCase().includes("storm")
    ) {
      factors.weather.impact = "negative";
      factors.weather.insight =
        "Rainy weather may affect mood and outdoor activity";
    } else {
      factors.weather.impact = "neutral";
      factors.weather.insight = "Weather conditions are neutral";
    }

    // UV Index impact
    if (weatherData.uvIndex > 8) {
      factors.weather.insight += " High UV - consider sun protection";
    } else if (weatherData.uvIndex < 3) {
      factors.weather.insight += " Low UV - consider vitamin D supplement";
    }
  }

  // Seasonal daylight analysis
  const month = date.getMonth();
  const sunTimes = getAccurateSunTimes(date, 37.4529, -122.1817); // Menlo Park coordinates

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

  // Lunar phase analysis
  const lunarCycle = 29.53;
  const knownNewMoon = new Date("2024-01-11");
  const daysSince =
    (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const phase = (daysSince % lunarCycle) / lunarCycle;

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

  // Social factors
  const dayOfWeek = date.getDay();
  factors.social.weekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Check for holidays (simplified)
  const isHoliday = checkForHoliday(date);
  factors.social.holiday = isHoliday;

  if (factors.social.weekend) {
    factors.social.impact = "Weekend - different rhythm and goals";
  } else if (isHoliday) {
    factors.social.impact = "Holiday - reduced work expectations";
  } else {
    factors.social.impact = "Regular weekday";
  }

  return factors;
}

/**
 * Get accurate sun times - EXACT implementation from code.js
 */
export function getAccurateSunTimes(
  date: Date,
  lat: number,
  lng: number
): {
  sunrise: string;
  sunset: string;
  daylight: number;
} {
  // Simplified sun calculation (in real implementation, use proper astronomical calculations)
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const declination = 23.45 * Math.sin(((284 + dayOfYear) * Math.PI) / 180);
  const hourAngle = Math.acos(
    -Math.tan((lat * Math.PI) / 180) * Math.tan((declination * Math.PI) / 180)
  );

  const sunriseHour = 12 - (hourAngle * 12) / Math.PI;
  const sunsetHour = 12 + (hourAngle * 12) / Math.PI;

  const sunrise = new Date(date);
  sunrise.setHours(Math.floor(sunriseHour), (sunriseHour % 1) * 60, 0, 0);

  const sunset = new Date(date);
  sunset.setHours(Math.floor(sunsetHour), (sunsetHour % 1) * 60, 0, 0);

  const daylight = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60);

  return {
    sunrise: sunrise.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    sunset: sunset.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    daylight: Math.round(daylight * 10) / 10,
  };
}

/**
 * Check for holiday - simplified implementation
 */
function checkForHoliday(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();

  // Major US holidays (simplified)
  if (month === 0 && day === 1) return true; // New Year's Day
  if (month === 6 && day === 4) return true; // Independence Day
  if (month === 10 && day === 11) return true; // Veterans Day
  if (month === 11 && day === 25) return true; // Christmas Day

  return false;
}

/**
 * Generate environmental insights - EXACT implementation from code.js
 */
export function generateEnvironmentalInsights(
  factors: EnvironmentalFactors
): string {
  const insights: string[] = [];

  if (factors.weather.impact === "positive") {
    insights.push(`☀️ ${factors.weather.insight}`);
  } else if (factors.weather.impact === "negative") {
    insights.push(`🌧️ ${factors.weather.insight}`);
  }

  if (factors.seasonal.insight) {
    insights.push(`🌅 ${factors.seasonal.insight}`);
  }

  if (factors.lunar.impact) {
    insights.push(`🌙 ${factors.lunar.phase}: ${factors.lunar.impact}`);
  }

  if (factors.social.weekend) {
    insights.push(`🏖️ ${factors.social.impact}`);
  } else if (factors.social.holiday) {
    insights.push(`🎉 ${factors.social.impact}`);
  }

  return insights.join("\n");
}

/**
 * Get environmental impact score - EXACT implementation from code.js
 */
export function getEnvironmentalImpactScore(
  factors: EnvironmentalFactors
): number {
  let score = 50; // Neutral baseline

  // Weather impact
  if (factors.weather.impact === "positive") {
    score += 20;
  } else if (factors.weather.impact === "negative") {
    score -= 15;
  }

  // Daylight impact
  if (factors.seasonal.daylight >= 12) {
    score += 10;
  } else if (factors.seasonal.daylight < 8) {
    score -= 10;
  }

  // Lunar impact
  if (factors.lunar.phase === "Full Moon") {
    score -= 5;
  } else if (factors.lunar.phase === "New Moon") {
    score -= 3;
  }

  // Social impact
  if (factors.social.weekend) {
    score += 5; // Weekend is generally positive for wellness
  }

  if (factors.social.holiday) {
    score += 10; // Holidays are positive
  }

  return Math.max(0, Math.min(100, score));
}
