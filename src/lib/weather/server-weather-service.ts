// Server-side weather service for SSR
export interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  name: string;
  sys: {
    country: string;
  };
  coord?: {
    lat: number;
    lon: number;
  };
  forecast?: {
    list: Array<{
      dt: number;
      main: {
        temp: number;
        humidity: number;
        pressure?: number;
      };
      weather: Array<{
        main: string;
        description: string;
        icon: string;
      }>;
      dt_txt: string;
      pop?: number;
      wind?: {
        speed: number;
      };
    }>;
  };
}

export async function getWeatherData(latitude: number, longitude: number, userTimezone?: string) {
  try {
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    
    if (!API_KEY) {
      throw new Error('OpenWeather API key not configured');
    }

    // Get current weather
    const currentWeatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
    );

    if (!currentWeatherResponse.ok) {
      throw new Error(`Weather API error: ${currentWeatherResponse.status}`);
    }

    const currentWeatherData = await currentWeatherResponse.json();

    // Get hourly forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
    );

    if (!forecastResponse.ok) {
      throw new Error(`Forecast API error: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();

    // Combine and format the data
    const weatherData = {
      current: currentWeatherData,
      forecast: forecastData,
      timestamp: new Date().toISOString(),
    };

    return weatherData;
  } catch (error) {
    throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Default location (London) for fallback
export async function getDefaultWeatherData(): Promise<WeatherData | null> {
  try {
    const weatherData = await getWeatherData(51.5074, -0.1278);
    return weatherData;
  } catch (error) {
    console.error('❌ Server: Error getting default weather data:', error);
    // Return demo data if API fails
    return getDemoWeatherData();
  }
}

// Get weather data based on user's timezone or default location
export async function getInitialWeatherData(userTimezone?: string): Promise<WeatherData | null> {
  try {
    // If user has a timezone, get weather for that location
    if (userTimezone && userTimezone !== "UTC") {
      const location = getLocationFromTimezone(userTimezone);
      if (location) {
        try {
          const weatherData = await getWeatherData(location.lat, location.lon);
          return weatherData;
        } catch (error) {
          console.error('❌ Server: Error getting weather for timezone location:', error);
        }
      }
    }
    
    // Fallback to default location
    const weatherData = await getDefaultWeatherData();
    return weatherData;
  } catch (err) {
    console.error('❌ Server: Error getting initial weather data:', err);
    // Return demo data if API fails
    return getDemoWeatherData();
  }
}

// Get location coordinates from timezone
function getLocationFromTimezone(timezone: string): { lat: number; lon: number; city: string; country: string } | null {
  const TIMEZONE_LOCATIONS: Record<string, { lat: number; lon: number; city: string; country: string }> = {
    UTC: { lat: 51.5074, lon: -0.1278, city: "London", country: "GB" },
    "America/New_York": { lat: 40.7128, lon: -74.006, city: "New York", country: "US" },
    "America/Chicago": { lat: 41.8781, lon: -87.6298, city: "Chicago", country: "US" },
    "America/Denver": { lat: 39.7392, lon: -104.9903, city: "Denver", country: "US" },
    "America/Los_Angeles": { lat: 34.0522, lon: -118.2437, city: "Los Angeles", country: "US" },
    "America/Toronto": { lat: 43.6532, lon: -79.3832, city: "Toronto", country: "CA" },
    "Europe/London": { lat: 51.5074, lon: -0.1278, city: "London", country: "GB" },
    "Europe/Paris": { lat: 48.8566, lon: 2.3522, city: "Paris", country: "FR" },
    "Europe/Berlin": { lat: 52.52, lon: 13.405, city: "Berlin", country: "DE" },
    "Europe/Rome": { lat: 41.9028, lon: 12.4964, city: "Rome", country: "IT" },
    "Europe/Madrid": { lat: 40.4168, lon: -3.7038, city: "Madrid", country: "ES" },
    "Asia/Karachi": { lat: 24.8607, lon: 67.0011, city: "Karachi", country: "PK" },
    "Asia/Kolkata": { lat: 28.6139, lon: 77.209, city: "Mumbai", country: "IN" },
    "Asia/Dubai": { lat: 25.2048, lon: 55.2708, city: "Dubai", country: "AE" },
    "Asia/Singapore": { lat: 1.3521, lon: 103.8198, city: "Singapore", country: "SG" },
    "Asia/Tokyo": { lat: 35.6762, lon: 139.6503, city: "Tokyo", country: "JP" },
    "Asia/Shanghai": { lat: 31.2304, lon: 121.4737, city: "Shanghai", country: "CN" },
    "Australia/Sydney": { lat: -33.8688, lon: 151.2093, city: "Sydney", country: "AU" },
    "Pacific/Auckland": { lat: -36.8485, lon: 174.7633, city: "Auckland", country: "NZ" },
  };

  return TIMEZONE_LOCATIONS[timezone] || null;
}

// Demo weather data for when API is not available
function getDemoWeatherData(): WeatherData {
  return {
    main: {
      temp: 22,
      feels_like: 24,
      humidity: 65,
      pressure: 1013
    },
    weather: [
      {
        main: "Clouds",
        description: "scattered clouds",
        icon: "03d"
      }
    ],
    name: "London",
    sys: {
      country: "GB"
    },
    coord: {
      lat: 51.5074,
      lon: -0.1278
    },
    forecast: {
      list: [
        {
          dt: Math.floor(Date.now() / 1000),
          main: {
            temp: 22,
            humidity: 65,
            pressure: 1013
          },
          weather: [
            {
              main: "Clouds",
              description: "scattered clouds",
              icon: "03d"
            }
          ],
          dt_txt: new Date().toISOString(),
          pop: 0.1,
          wind: {
            speed: 3.2
          }
        }
      ]
    }
  };
}
