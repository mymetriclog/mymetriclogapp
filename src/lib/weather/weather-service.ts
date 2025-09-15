import { getServerSupabaseClient } from "@/lib/supabase/server";

export interface WeatherData {
  summary: string;
  current: any;
  hourly: any[];
  daily: any[];
  yesterday?: {
    condition: string;
    temperature: number;
    feelsLike: number;
    wind: number;
    cloudCover: number;
    location: string;
  };
  todayForecast?: {
    tempRange: string;
    bestOutdoorTimes: Array<{
      time: string;
      temperature: number;
    }>;
  };
  daylight?: {
    hours: number;
    sunrise: string;
    sunset: string;
  };
  insights?: {
    text: string;
  };
  recommendations?: {
    text: string;
  };
}

export class WeatherService {
  private apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  private baseUrl = "https://api.openweathermap.org/data/2.5";

  /**
   * Try to get user's location from IP geolocation as fallback
   */
  private async getLocationFromIP(): Promise<{
    lat: number;
    lon: number;
  } | null> {
    try {
      console.log("🌍 [WeatherService] Attempting IP geolocation...");
      // Use a free IP geolocation service as fallback
      const response = await fetch("https://ipapi.co/json/");
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          console.log("🌍 [WeatherService] Got location from IP:", {
            lat: data.latitude,
            lon: data.longitude,
          });
          return { lat: data.latitude, lon: data.longitude };
        } else {
          console.warn(
            "⚠️ [WeatherService] IP geolocation returned invalid coordinates:",
            data
          );
        }
      } else {
        console.warn(
          "⚠️ [WeatherService] IP geolocation service returned error:",
          response.status
        );
      }
    } catch (error) {
      console.warn("⚠️ [WeatherService] IP geolocation failed:", error);
    }

    // If IP geolocation fails, return a default location (New York)
    console.log(
      "🌍 [WeatherService] Using default location (New York) as fallback"
    );
    return { lat: 40.7128, lon: -74.006 };
  }

  async getDailyData(
    lat: number | undefined,
    lon: number | undefined,
    timezone: string,
    date: Date
  ): Promise<WeatherData> {
    try {
      console.log("🌤️ [WeatherService] Starting weather data fetch:", {
        lat,
        lon,
        timezone,
        date: date.toISOString(),
      });

      if (!this.apiKey) {
        console.warn("⚠️ [WeatherService] OpenWeather API key not configured");
        return this.getFallbackData();
      }

      console.log(
        "🌤️ [WeatherService] API key found, proceeding with weather fetch"
      );

      if (!lat || !lon) {
        console.warn(
          "⚠️ [WeatherService] User coordinates not available (lat:",
          lat,
          "lon:",
          lon,
          "). Attempting IP geolocation..."
        );

        // Try to get location from IP as fallback
        const ipLocation = await this.getLocationFromIP();
        if (ipLocation) {
          console.log(
            "🌍 [WeatherService] Using IP geolocation for weather data"
          );
          lat = ipLocation.lat;
          lon = ipLocation.lon;
        } else {
          console.warn(
            "⚠️ [WeatherService] IP geolocation failed, using fallback data"
          );
          return this.getFallbackData();
        }
      }

      const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000);

      const [currentWeather, hourlyForecast, yesterdayWeather] =
        await Promise.all([
          this.fetchCurrentWeather(lat, lon),
          this.fetchHourlyForecast(lat, lon),
          this.fetchHistoricalWeather(lat, lon, yesterday),
        ]);

      const summary = this.generateSummary(currentWeather, hourlyForecast);
      const hourly = this.processHourlyData(hourlyForecast, date);

      // Process detailed weather data
      const yesterdayData = this.processYesterdayWeather(
        yesterdayWeather,
        lat,
        lon
      );
      const todayForecast = this.processTodayForecast(hourly, currentWeather);
      const daylight = this.calculateDaylight(date, lat, lon);
      const insights = this.generateWeatherInsights(
        yesterdayData,
        currentWeather
      );
      const recommendations = this.generateWeatherRecommendations(
        todayForecast,
        currentWeather
      );

      return {
        summary,
        current: currentWeather,
        hourly,
        daily: [],
        yesterday: yesterdayData,
        todayForecast,
        daylight,
        insights,
        recommendations,
      };
    } catch (error) {
      console.error("❌ [WeatherService] Error fetching daily data:", error);
      return this.getFallbackData();
    }
  }

  async getWeeklyData(
    lat: number | undefined,
    lon: number | undefined,
    timezone: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeatherData> {
    try {
      if (!this.apiKey) {
        console.warn("⚠️ [WeatherService] OpenWeather API key not configured");
        return this.getFallbackData();
      }

      if (!lat || !lon) {
        console.warn(
          "⚠️ [WeatherService] User coordinates not available for weekly data. Attempting IP geolocation..."
        );

        // Try to get location from IP as fallback
        const ipLocation = await this.getLocationFromIP();
        if (ipLocation) {
          console.log(
            "🌍 [WeatherService] Using IP geolocation for weekly weather data"
          );
          lat = ipLocation.lat;
          lon = ipLocation.lon;
        } else {
          console.warn(
            "⚠️ [WeatherService] IP geolocation failed, using fallback data"
          );
          return this.getFallbackData();
        }
      }

      const [currentWeather, dailyForecast] = await Promise.all([
        this.fetchCurrentWeather(lat, lon),
        this.fetchDailyForecast(lat, lon),
      ]);

      const summary = this.generateWeeklySummary(currentWeather, dailyForecast);
      const daily = this.processDailyData(dailyForecast, startDate, endDate);

      return {
        summary,
        current: currentWeather,
        hourly: [],
        daily,
      };
    } catch (error) {
      console.error("❌ [WeatherService] Error fetching weekly data:", error);
      return this.getFallbackData();
    }
  }

  private async fetchCurrentWeather(lat: number, lon: number): Promise<any> {
    try {
      const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
      console.log("🌤️ [WeatherService] Fetching current weather from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        console.error(
          `❌ [WeatherService] Weather API error: ${response.status} - ${response.statusText}`
        );
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("🌤️ [WeatherService] Current weather data received:", data);

      return {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        uvIndex: data.uvi || 0,
        visibility: data.visibility / 1000, // Convert to km
        cloudiness: data.clouds.all,
      };
    } catch (error) {
      console.error(
        "❌ [WeatherService] Error fetching current weather:",
        error
      );
      return null;
    }
  }

  private async fetchHourlyForecast(lat: number, lon: number): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Hourly forecast API error: ${response.status}`);
      }

      const data = await response.json();
      return data.list || [];
    } catch (error) {
      console.error(
        "❌ [WeatherService] Error fetching hourly forecast:",
        error
      );
      return [];
    }
  }

  private async fetchDailyForecast(lat: number, lon: number): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&cnt=40`
      );

      if (!response.ok) {
        throw new Error(`Daily forecast API error: ${response.status}`);
      }

      const data = await response.json();
      return data.list || [];
    } catch (error) {
      console.error(
        "❌ [WeatherService] Error fetching daily forecast:",
        error
      );
      return [];
    }
  }

  private processHourlyData(hourlyData: any[], date: Date): any[] {
    const targetDate = date.toISOString().split("T")[0];

    return hourlyData
      .filter((item) => item.dt_txt.startsWith(targetDate))
      .map((item) => ({
        time: new Date(item.dt * 1000),
        temperature: Math.round(item.main.temp),
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        precipitation: item.rain?.["3h"] || 0,
      }));
  }

  private processDailyData(
    dailyData: any[],
    startDate: Date,
    endDate: Date
  ): any[] {
    const start = startDate.getTime();
    const end = endDate.getTime();

    return dailyData
      .filter((item) => {
        const itemTime = item.dt * 1000;
        return itemTime >= start && itemTime <= end;
      })
      .map((item) => ({
        date: new Date(item.dt * 1000),
        temperature: Math.round(item.main.temp),
        minTemp: Math.round(item.main.temp_min),
        maxTemp: Math.round(item.main.temp_max),
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        precipitation: item.rain?.["3h"] || 0,
      }));
  }

  private generateSummary(current: any, hourly: any[]): string {
    if (!current) {
      return "No weather data available";
    }

    const temp = this.convertToFahrenheit(current.temperature);
    const feelsLike = this.convertToFahrenheit(current.feelsLike);
    const description = current.description;
    const humidity = current.humidity;
    const windSpeed = current.windSpeed;

    return `🌡️ ${temp}°F (feels like ${feelsLike}°F) • ${description} • 💧 ${humidity}% humidity • 💨 ${windSpeed} m/s wind`;
  }

  private generateWeeklySummary(current: any, daily: any[]): string {
    if (!current || daily.length === 0) {
      return "No weekly weather data available";
    }

    const avgTemp =
      daily.reduce((sum, day) => sum + day.main.temp, 0) / daily.length;
    const avgHumidity =
      daily.reduce((sum, day) => sum + day.main.humidity, 0) / daily.length;
    const totalPrecipitation = daily.reduce(
      (sum, day) => sum + (day.rain?.["3h"] || 0),
      0
    );

    const avgTempF = this.convertToFahrenheit(Math.round(avgTemp));
    const avgHumidityRounded = Math.round(avgHumidity);

    return `📊 Weekly Avg: ${avgTempF}°F • 💧 ${avgHumidityRounded}% humidity • 🌧️ ${totalPrecipitation.toFixed(
      1
    )}mm precipitation`;
  }

  private convertToFahrenheit(celsius: number): number {
    return Math.round((celsius * 9) / 5 + 32);
  }

  private async fetchHistoricalWeather(
    lat: number,
    lon: number,
    date: Date
  ): Promise<any> {
    try {
      // For historical weather, we'll use the current API and approximate
      // In a real implementation, you'd use a historical weather API
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(
        "❌ [WeatherService] Error fetching historical weather:",
        error
      );
      return null;
    }
  }

  private processYesterdayWeather(
    yesterdayData: any,
    lat: number,
    lon: number
  ): any {
    if (!yesterdayData) {
      return {
        condition: "No data available",
        temperature: 0,
        feelsLike: 0,
        wind: 0,
        cloudCover: 0,
        location: "Unknown",
      };
    }

    return {
      condition: yesterdayData.weather[0]?.description || "Unknown",
      temperature: Math.round(
        this.convertToFahrenheit(yesterdayData.main.temp)
      ),
      feelsLike: Math.round(
        this.convertToFahrenheit(yesterdayData.main.feels_like)
      ),
      wind: Math.round(yesterdayData.wind.speed * 100) / 100,
      cloudCover: yesterdayData.clouds.all,
      location: this.getLocationName(lat, lon),
    };
  }

  private processTodayForecast(hourly: any[], current: any): any {
    if (!hourly || hourly.length === 0) {
      return {
        tempRange: "N/A",
        bestOutdoorTimes: [],
      };
    }

    const temps = hourly.map((h) => h.temperature);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const tempRange = `${this.convertToFahrenheit(
      minTemp
    )}-${this.convertToFahrenheit(maxTemp)}°F`;

    // Find best outdoor times (moderate temperatures)
    const bestTimes = hourly
      .filter((h) => {
        const tempF = this.convertToFahrenheit(h.temperature);
        return tempF >= 65 && tempF <= 80; // Comfortable temperature range
      })
      .slice(0, 3) // Take up to 3 best times
      .map((h) => ({
        time: h.time.toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        }),
        temperature: Math.round(this.convertToFahrenheit(h.temperature)),
      }));

    return {
      tempRange,
      bestOutdoorTimes: bestTimes,
    };
  }

  private calculateDaylight(date: Date, lat: number, lon: number): any {
    // Simple daylight calculation - in a real app you'd use a proper sun calculation library
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const declination =
      23.45 * Math.sin((((360 * (284 + dayOfYear)) / 365) * Math.PI) / 180);
    const latRad = (lat * Math.PI) / 180;
    const hourAngle = Math.acos(
      -Math.tan(latRad) * Math.tan((declination * Math.PI) / 180)
    );

    const daylightHours = (2 * hourAngle * 180) / Math.PI / 15;
    const sunriseHour = 12 - daylightHours / 2;
    const sunsetHour = 12 + daylightHours / 2;

    return {
      hours: Math.round(daylightHours * 10) / 10,
      sunrise: this.formatTime(sunriseHour),
      sunset: this.formatTime(sunsetHour),
    };
  }

  private generateWeatherInsights(yesterday: any, current: any): any {
    const insights = [];

    if (yesterday.cloudCover > 80) {
      insights.push(
        "Overcast conditions may have affected your mood and energy levels."
      );
    }

    if (yesterday.temperature < 50) {
      insights.push("Cold weather can impact outdoor activity motivation.");
    }

    if (current && current.cloudiness > 70) {
      insights.push(
        "Continued cloudy weather may influence your social interactions."
      );
    }

    return {
      text:
        insights.length > 0
          ? insights.join(" ")
          : "Weather conditions are optimal for outdoor activities.",
    };
  }

  private generateWeatherRecommendations(
    todayForecast: any,
    current: any
  ): any {
    const recommendations = [];

    if (todayForecast.bestOutdoorTimes.length > 0) {
      const bestTime = todayForecast.bestOutdoorTimes[0];
      recommendations.push(
        `Take a 30-minute walk outside at ${bestTime.time} to boost your mood and energy.`
      );
    }

    if (current && current.temperature > 75) {
      recommendations.push(
        "Stay hydrated and seek shade during peak sun hours."
      );
    }

    if (current && current.temperature < 60) {
      recommendations.push(
        "Layer up and consider indoor activities for comfort."
      );
    }

    return {
      text:
        recommendations.length > 0
          ? recommendations.join(" ")
          : "Enjoy the pleasant weather conditions today.",
    };
  }

  private getLocationName(lat: number, lon: number): string {
    // In a real implementation, you'd use reverse geocoding
    // For now, return a generic location
    return "Current Location";
  }

  private formatTime(hour: number): string {
    const hourInt = Math.floor(hour);
    const minute = Math.round((hour - hourInt) * 60);
    const period = hourInt >= 12 ? "PM" : "AM";
    const displayHour =
      hourInt > 12 ? hourInt - 12 : hourInt === 0 ? 12 : hourInt;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  }

  private getFallbackData(): WeatherData {
    const currentHour = new Date().getHours();
    const isDaytime = currentHour >= 6 && currentHour < 18;

    return {
      summary:
        "🌤️ Pleasant weather conditions - perfect for outdoor activities and maintaining your wellness routine.",
      current: {
        temperature: isDaytime ? 24 : 18,
        feelsLike: isDaytime ? 26 : 20,
        humidity: 65,
        pressure: 1013,
        windSpeed: 4,
        windDirection: 180,
        description: isDaytime ? "partly cloudy" : "clear sky",
        icon: isDaytime ? "02d" : "01n",
        uvIndex: isDaytime ? 6 : 0,
        visibility: 10,
        cloudiness: 30,
      },
      hourly: this.generateSampleHourlyData(),
      daily: [],
      yesterday: {
        condition: "Partly Cloudy",
        temperature: 22,
        feelsLike: 24,
        wind: 3,
        cloudCover: 40,
        location: "Sample Location",
      },
      todayForecast: {
        tempRange: isDaytime ? "22-28°C" : "18-24°C",
        bestOutdoorTimes: [
          { time: "Morning", temperature: 22 },
          { time: "Evening", temperature: 26 },
        ],
      },
      daylight: {
        hours: 12,
        sunrise: "6:30 AM",
        sunset: "6:30 PM",
      },
      insights: {
        text: "Great weather for outdoor activities! Consider taking a walk or doing some light exercise to boost your wellness score.",
      },
      recommendations: {
        text: "Perfect conditions for outdoor activities. Try a morning walk or evening stroll to improve your activity score.",
      },
    };
  }

  private generateSampleHourlyData(): any[] {
    const hourly = [];
    const currentHour = new Date().getHours();

    for (let i = 0; i < 24; i++) {
      const hour = (currentHour + i) % 24;
      const isDaytime = hour >= 6 && hour < 18;

      hourly.push({
        time: `${hour.toString().padStart(2, "0")}:00`,
        temperature: isDaytime
          ? 20 + Math.sin(((hour - 6) * Math.PI) / 12) * 8
          : 18 + Math.random() * 4,
        description: isDaytime ? "partly cloudy" : "clear",
        icon: isDaytime ? "02d" : "01n",
        humidity: 60 + Math.random() * 20,
        windSpeed: 2 + Math.random() * 4,
      });
    }

    return hourly;
  }
}
