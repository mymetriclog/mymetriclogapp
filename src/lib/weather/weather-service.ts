import { getServerSupabaseClient } from "@/lib/supabase/server";

export interface WeatherData {
  summary: string;
  current: any;
  hourly: any[];
  daily: any[];
}

export class WeatherService {
  private apiKey = process.env.OPENWEATHER_API_KEY;
  private baseUrl = "https://api.openweathermap.org/data/2.5";

  async getDailyData(
    lat: number | undefined,
    lon: number | undefined,
    timezone: string,
    date: Date
  ): Promise<WeatherData> {
    try {
      if (!lat || !lon) {
        return this.getFallbackData();
      }

      const [currentWeather, hourlyForecast] = await Promise.all([
        this.fetchCurrentWeather(lat, lon),
        this.fetchHourlyForecast(lat, lon),
      ]);

      const summary = this.generateSummary(currentWeather, hourlyForecast);
      const hourly = this.processHourlyData(hourlyForecast, date);

      return {
        summary,
        current: currentWeather,
        hourly,
        daily: [],
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
      if (!lat || !lon) {
        return this.getFallbackData();
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
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
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

  private getFallbackData(): WeatherData {
    return {
      summary: "No weather data available",
      current: null,
      hourly: [],
      daily: [],
    };
  }
}
