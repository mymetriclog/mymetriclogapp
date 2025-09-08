"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Calendar } from "lucide-react";

interface ForecastData {
  list: Array<{
    dt: number;
    main: {
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    dt_txt: string;
  }>;
}

interface DailyForecast {
  date: string;
  day: string;
  temp_min: number;
  temp_max: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
}

function getWeatherIcon(weatherMain: string) {
  switch (weatherMain.toLowerCase()) {
    case "clear":
      return <Sun className="h-6 w-6 text-yellow-500" />;
    case "clouds":
      return <Cloud className="h-6 w-6 text-gray-500" />;
    case "rain":
    case "drizzle":
      return <CloudRain className="h-6 w-6 text-blue-500" />;
    case "snow":
      return <CloudSnow className="h-6 w-6 text-blue-300" />;
    case "mist":
    case "fog":
      return <Wind className="h-6 w-6 text-gray-400" />;
    default:
      return <Sun className="h-6 w-6 text-yellow-500" />;
  }
}

function processForecastData(forecastData: ForecastData): DailyForecast[] {
  const dailyData: { [key: string]: any[] } = {};
  
  // Group forecast data by day
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = [];
    }
    dailyData[dayKey].push(item);
  });
  
  // Process each day to get min/max temps and most common weather
  const processedForecasts: DailyForecast[] = Object.keys(dailyData).map(dayKey => {
    const dayItems = dailyData[dayKey];
    const date = new Date(dayKey);
    
    // Get min and max temperatures for the day
    const temps = dayItems.map(item => item.main.temp_min);
    const temp_min = Math.min(...temps);
    const temp_max = Math.max(...temps);
    
    // Get most common weather condition for the day
    const weatherCounts: { [key: string]: number } = {};
    dayItems.forEach(item => {
      const weatherMain = item.weather[0]?.main || "Clear";
      weatherCounts[weatherMain] = (weatherCounts[weatherMain] || 0) + 1;
    });
    
    const mostCommonWeather = Object.keys(weatherCounts).reduce((a, b) => 
      weatherCounts[a] > weatherCounts[b] ? a : b
    );
    
    const weatherItem = dayItems.find(item => item.weather[0]?.main === mostCommonWeather);
    
    return {
      date: dayKey,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      temp_min: Math.round(temp_min),
      temp_max: Math.round(temp_max),
      weather_main: mostCommonWeather,
      weather_description: weatherItem?.weather[0]?.description || "Clear",
      weather_icon: weatherItem?.weather[0]?.icon || "01d"
    };
  });
  
  // Return only the next 7 days
  return processedForecasts.slice(0, 7);
}

interface WeatherForecastCardProps {
  userTimezone?: string;
}

export function WeatherForecastCard({ userTimezone }: WeatherForecastCardProps = {}) {
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadForecastData = () => {
      const savedWeatherData = localStorage.getItem("weatherData");
      
      console.log('🔍 Weather Forecast Card - Checking localStorage...');
      console.log('🔍 Saved weather data exists:', !!savedWeatherData);
      
      if (savedWeatherData) {
        try {
          const weatherData = JSON.parse(savedWeatherData);
          console.log('🔍 Parsed weather data:', weatherData);
          console.log('🔍 Has forecast property:', !!weatherData.forecast);
          console.log('🔍 Forecast list exists:', !!weatherData.forecast?.list);
          console.log('🔍 Forecast list length:', weatherData.forecast?.list?.length || 0);
          
          if (weatherData.forecast && weatherData.forecast.list) {
            console.log('📅 Loading forecast data from localStorage');
            console.log('📅 Raw forecast data:', weatherData.forecast);
            const processedForecast = processForecastData(weatherData.forecast);
            console.log('📅 Processed forecast data:', processedForecast);
            setForecast(processedForecast);
            setLoading(false);
            setError(null);
          } else {
            console.log('❌ No forecast data available in weather data');
            setLoading(false);
            setError("No forecast data available");
          }
        } catch (err) {
          console.log('❌ Failed to parse saved weather data:', err);
          setLoading(false);
          setError("Failed to load forecast data");
        }
      } else {
        console.log('❌ No weather data found in localStorage');
        setLoading(false);
        setError("No weather data available");
      }
    };

    // Load data on mount
    loadForecastData();

    // Listen for weather data updates
    const handleWeatherUpdate = () => {
      loadForecastData();
    };

    window.addEventListener('weatherDataUpdated', handleWeatherUpdate);
    window.addEventListener('storage', handleWeatherUpdate);

    return () => {
      window.removeEventListener('weatherDataUpdated', handleWeatherUpdate);
      window.removeEventListener('storage', handleWeatherUpdate);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            7-Day Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            7-Day Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>{error}</p>
            <button
              onClick={async () => {
                console.log('🔄 Fetching forecast data for current location...');
                const savedWeatherData = localStorage.getItem("weatherData");
                if (savedWeatherData) {
                  try {
                    const weatherData = JSON.parse(savedWeatherData);
                    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
                    
                    if (weatherData.coord && API_KEY) {
                      const { lat, lon } = weatherData.coord;
                      console.log('📍 Fetching forecast for coordinates:', { lat, lon });
                      
                      const forecastResponse = await fetch(
                        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
                      );
                      
                      if (forecastResponse.ok) {
                        const forecastData = await forecastResponse.json();
                        console.log('📅 Forecast data received:', forecastData);
                        
                        // Combine with existing weather data
                        const combinedWeatherData = {
                          ...weatherData,
                          forecast: forecastData
                        };
                        
                        // Save to localStorage
                        localStorage.setItem("weatherData", JSON.stringify(combinedWeatherData));
                        localStorage.setItem("weatherDataUpdated", Date.now().toString());
                        
                        // Trigger update
                        window.dispatchEvent(new CustomEvent('weatherDataUpdated'));
                        
                        console.log('✅ Forecast data saved and updated');
                      } else {
                        console.log('❌ Failed to fetch forecast:', forecastResponse.status);
                      }
                    }
                  } catch (err) {
                    console.log('❌ Error fetching forecast:', err);
                  }
                }
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            >
              Load Forecast Data
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (forecast.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            7-Day Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Set your location to see the forecast</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          7-Day Forecast
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-fit justify-between">
            {forecast.map((day, index) => (
              <div key={index} className="text-center p-2 rounded-lg hover:bg-gray-50 transition-colors min-w-[80px] flex-shrink-0">
                <div className="flex flex-col items-center">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {day.day}
                </div>
                <div className="mb-2">
                  {getWeatherIcon(day.weather_main)}
                </div>
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  {day.weather_description}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {day.temp_max}°
                </div>
                <div className="text-xs text-gray-500">
                  {day.temp_min}°
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
