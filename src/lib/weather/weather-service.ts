interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    uv_index?: number;
    pressure: number;
    visibility: number;
  };
  daily?: Array<{
    dt: number;
    temp: {
      min: number;
      max: number;
      day: number;
      night: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    humidity: number;
    wind_speed: number;
    pop: number; // Probability of precipitation
  }>;
  hourly?: Array<{
    dt: number;
    temp: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    humidity?: number;
    wind_speed?: number;
    pop?: number;
  }>;
}

interface WeatherInsights {
  weatherImpact: string;
  environmentalFactors: {
    temperature: string;
    humidity: string;
    wind: string;
    uv: string;
    pressure: string;
  };
  recommendations: string[];
  moodInfluence: string;
  activitySuggestions: string[];
}

export class WeatherService {
  private static API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  // Use One Call 2.5 (free tier) instead of 3.0 (paid)
  private static BASE_URL = "https://api.openweathermap.org/data/2.5/onecall";

  /**
   * Get weather data for a specific location and date
   */
  static async getWeatherData(
    lat: number = 40.7128, // Default to NYC coordinates
    lon: number = -74.006,
    date?: Date
  ): Promise<WeatherData | null> {
    try {
      if (!this.API_KEY) {
        console.warn("⚠️ OpenWeather API key not configured");
        return null;
      }

      // Try One Call first
      const url = `${this.BASE_URL}?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric&exclude=minutely,alerts`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data && data.current) {
          return data as WeatherData;
        }
      }

      // Fallback: use current weather + 5-day/3h forecast
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`;

      const [currentRes, forecastRes] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl),
      ]);

      if (!currentRes.ok) {
        throw new Error(`Weather current API error: ${currentRes.status}`);
      }

      const currentJson: any = await currentRes.json();
      let hourly: WeatherData["hourly"] | undefined = undefined;

      if (forecastRes.ok) {
        const forecastJson: any = await forecastRes.json();
        if (forecastJson && Array.isArray(forecastJson.list)) {
          hourly = forecastJson.list.slice(0, 8).map((item: any) => ({
            dt: item.dt,
            temp: item.main?.temp,
            weather: item.weather || [],
            humidity: item.main?.humidity,
            wind_speed: item.wind?.speed,
            pop: item.pop,
          }));
        }
      }

      const synthesized: WeatherData = {
        current: {
          temp: currentJson.main?.temp,
          feels_like: currentJson.main?.feels_like,
          humidity: currentJson.main?.humidity,
          wind_speed: currentJson.wind?.speed,
          weather: currentJson.weather || [],
          pressure: currentJson.main?.pressure,
          visibility: currentJson.visibility,
          uv_index: 0, // Not available from this endpoint; default to 0
        },
        hourly,
        // daily not available in fallback; optional consumers handle undefined
      };

      return synthesized;
    } catch (error) {
      console.error("❌ Weather data fetch error:", error);
      return null;
    }
  }

  /**
   * Generate weather insights for reports
   */
  static generateWeatherInsights(weatherData: WeatherData): WeatherInsights {
    const current = weatherData.current;

    // Weather impact analysis
    let weatherImpact =
      "Weather conditions are favorable for your daily activities.";
    if (current.temp < 10) {
      weatherImpact =
        "Cold weather may affect your energy levels and outdoor activities.";
    } else if (current.temp > 30) {
      weatherImpact =
        "Hot weather may impact your hydration needs and outdoor exercise.";
    }

    // Environmental factors analysis
    const environmentalFactors = {
      temperature: this.analyzeTemperature(current.temp),
      humidity: this.analyzeHumidity(current.humidity),
      wind: this.analyzeWind(current.wind_speed),
      uv: this.analyzeUV(current.uv_index || 0),
      pressure: this.analyzePressure(current.pressure),
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      current,
      environmentalFactors
    );

    // Mood influence
    const moodInfluence = this.analyzeMoodInfluence(current);

    // Activity suggestions
    const activitySuggestions = this.generateActivitySuggestions(current);

    return {
      weatherImpact,
      environmentalFactors,
      recommendations,
      moodInfluence,
      activitySuggestions,
    };
  }

  /**
   * Analyze temperature impact
   */
  private static analyzeTemperature(temp: number): string {
    if (temp < 0) return "Very cold - Bundle up and stay warm";
    if (temp < 10) return "Cold - Wear warm clothing";
    if (temp < 20) return "Cool - Light jacket recommended";
    if (temp < 25) return "Mild - Comfortable outdoor conditions";
    if (temp < 30) return "Warm - Stay hydrated";
    return "Hot - Limit outdoor activities during peak hours";
  }

  /**
   * Analyze humidity impact
   */
  private static analyzeHumidity(humidity: number): string {
    if (humidity < 30) return "Low humidity - Stay hydrated";
    if (humidity < 50) return "Comfortable humidity levels";
    if (humidity < 70) return "Moderate humidity";
    return "High humidity - May feel warmer than actual temperature";
  }

  /**
   * Analyze wind impact
   */
  private static analyzeWind(windSpeed: number): string {
    if (windSpeed < 5) return "Light breeze - Perfect for outdoor activities";
    if (windSpeed < 15) return "Moderate wind - Good for ventilation";
    if (windSpeed < 25) return "Strong wind - Consider indoor alternatives";
    return "High winds - Avoid outdoor activities";
  }

  /**
   * Analyze UV index
   */
  private static analyzeUV(uvIndex: number): string {
    if (uvIndex < 3) return "Low UV - Minimal protection needed";
    if (uvIndex < 6) return "Moderate UV - Use sunscreen";
    if (uvIndex < 8) return "High UV - Limit sun exposure";
    if (uvIndex < 11) return "Very high UV - Avoid sun during peak hours";
    return "Extreme UV - Take all precautions";
  }

  /**
   * Analyze pressure impact
   */
  private static analyzePressure(pressure: number): string {
    if (pressure < 1000) return "Low pressure - May cause fatigue";
    if (pressure < 1013) return "Below average pressure";
    if (pressure < 1020) return "Normal pressure range";
    return "High pressure - Generally good for energy levels";
  }

  /**
   * Generate weather-based recommendations
   */
  private static generateRecommendations(
    current: WeatherData["current"],
    factors: any
  ): string[] {
    const recommendations: string[] = [];

    // Temperature-based recommendations
    if (current.temp < 10) {
      recommendations.push("Wear warm clothing and consider indoor workouts");
      recommendations.push("Stay hydrated even in cold weather");
    } else if (current.temp > 30) {
      recommendations.push("Exercise early morning or evening to avoid heat");
      recommendations.push("Increase water intake significantly");
    }

    // Humidity-based recommendations
    if (current.humidity > 70) {
      recommendations.push("High humidity - consider indoor activities");
      recommendations.push("Wear moisture-wicking clothing");
    }

    // UV-based recommendations
    if ((current.uv_index || 0) > 6) {
      recommendations.push("High UV - use sunscreen and protective clothing");
      recommendations.push(
        "Schedule outdoor activities before 10 AM or after 4 PM"
      );
    }

    // Wind-based recommendations
    if (current.wind_speed > 20) {
      recommendations.push("High winds - consider indoor alternatives");
      recommendations.push("Secure outdoor items");
    }

    return recommendations;
  }

  /**
   * Analyze weather's impact on mood
   */
  private static analyzeMoodInfluence(current: WeatherData["current"]): string {
    const temp = current.temp;
    const weather = current.weather[0]?.main.toLowerCase() || "";

    if (weather.includes("rain") || weather.includes("drizzle")) {
      return "Rainy weather may affect mood - consider indoor activities and mood-boosting music";
    } else if (weather.includes("cloud") || weather.includes("overcast")) {
      return "Cloudy conditions may impact energy - focus on indoor productivity";
    } else if (weather.includes("clear") || weather.includes("sun")) {
      if (temp >= 15 && temp <= 25) {
        return "Perfect weather for outdoor activities and mood improvement";
      } else if (temp > 25) {
        return "Sunny and warm - great for outdoor activities but stay hydrated";
      }
    }

    return "Weather conditions are neutral for mood - focus on your daily routine";
  }

  /**
   * Generate activity suggestions based on weather
   */
  private static generateActivitySuggestions(
    current: WeatherData["current"]
  ): string[] {
    const suggestions: string[] = [];
    const temp = current.temp;
    const weather = current.weather[0]?.main.toLowerCase() || "";

    if (weather.includes("rain") || weather.includes("drizzle")) {
      suggestions.push("Indoor yoga or stretching");
      suggestions.push("Home workout routines");
      suggestions.push("Reading or meditation");
    } else if (weather.includes("clear") || weather.includes("sun")) {
      if (temp >= 15 && temp <= 25) {
        suggestions.push("Outdoor walking or jogging");
        suggestions.push("Cycling or hiking");
        suggestions.push("Outdoor sports");
      } else if (temp > 25) {
        suggestions.push("Early morning outdoor activities");
        suggestions.push("Swimming if available");
        suggestions.push("Indoor air-conditioned workouts");
      } else if (temp < 15) {
        suggestions.push("Brisk walking with warm clothing");
        suggestions.push("Indoor cardio workouts");
        suggestions.push("Hot yoga or sauna sessions");
      }
    } else if (weather.includes("cloud") || weather.includes("overcast")) {
      suggestions.push("Moderate outdoor activities");
      suggestions.push("Indoor strength training");
      suggestions.push("Mindfulness practices");
    }

    return suggestions;
  }

  /**
   * Get hourly weather forecast for activity planning
   */
  static getHourlyForecast(weatherData: WeatherData): Array<{
    hour: string;
    temp: number;
    weather: string;
    activity: string;
  }> {
    if (!weatherData.hourly) return [];

    return weatherData.hourly.slice(0, 24).map((hour, index) => {
      const date = new Date(hour.dt * 1000);
      const hourStr = date.getHours();
      const timeLabel =
        hourStr === 0
          ? "12 AM"
          : hourStr > 12
          ? `${hourStr - 12} PM`
          : `${hourStr} AM`;

      let activity = "Rest";
      if (
        hour.temp >= 15 &&
        hour.temp <= 25 &&
        !hour.weather[0]?.main.toLowerCase().includes("rain")
      ) {
        activity = "Outdoor activities";
      } else if (hour.temp < 10 || hour.temp > 30) {
        activity = "Indoor activities";
      } else if (hour.weather[0]?.main.toLowerCase().includes("rain")) {
        activity = "Indoor workouts";
      }

      return {
        hour: timeLabel,
        temp: Math.round(hour.temp),
        weather: hour.weather[0]?.main || "Unknown",
        activity,
      };
    });
  }

  /**
   * Get weather summary for reports
   */
  static getWeatherSummary(weatherData: WeatherData): {
    current: string;
    forecast: string;
    impact: string;
  } {
    const current = weatherData.current;
    const currentWeather = current.weather[0]?.description || "Unknown";
    const temp = Math.round(current.temp);

    let forecast = "Stable weather conditions expected";
    if (weatherData.daily && weatherData.daily.length > 0) {
      const tomorrow = weatherData.daily[1];
      const tomorrowTemp = Math.round(tomorrow.temp.day);
      const tomorrowWeather = tomorrow.weather[0]?.main || "Unknown";
      forecast = `Tomorrow: ${tomorrowWeather}, ${tomorrowTemp}°C`;
    }

    let impact = "Weather conditions are favorable for your daily activities.";
    if (current.temp < 10 || current.temp > 30) {
      impact =
        "Extreme temperatures may affect your energy levels and outdoor activities.";
    } else if (current.weather[0]?.main.toLowerCase().includes("rain")) {
      impact =
        "Rainy weather may impact outdoor activities - consider indoor alternatives.";
    }

    return {
      current: `${currentWeather}, ${temp}°C`,
      forecast,
      impact,
    };
  }
}
