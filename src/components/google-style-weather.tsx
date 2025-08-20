"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, MapPin, Thermometer, Droplets, Gauge, Eye, Sunrise, Sunset, Navigation, AlertTriangle, AlertCircle, Info, Search, X } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface WeatherData {
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

interface DailyForecast {
  date: string;
  day: string;
  temp_min: number;
  temp_max: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
}

function getWeatherIcon(weatherMain: string, size: "sm" | "md" | "lg" = "md") {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  // More detailed weather icon mapping like Google Weather
  switch (weatherMain.toLowerCase()) {
    case "clear":
    case "clear sky":
      return <Sun className={`${sizeClasses[size]} text-yellow-500`} />;
    
    case "clouds":
    case "scattered clouds":
      return <Cloud className={`${sizeClasses[size]} text-gray-400`} />;
    
    case "broken clouds":
    case "overcast clouds":
      return <Cloud className={`${sizeClasses[size]} text-gray-500`} />;
    
    case "rain":
    case "light rain":
    case "moderate rain":
      return <CloudRain className={`${sizeClasses[size]} text-blue-500`} />;
    
    case "heavy rain":
    case "very heavy rain":
      return <CloudRain className={`${sizeClasses[size]} text-blue-600`} />;
    
    case "drizzle":
    case "light drizzle":
      return <CloudRain className={`${sizeClasses[size]} text-blue-400`} />;
    
    case "snow":
    case "light snow":
      return <CloudSnow className={`${sizeClasses[size]} text-blue-300`} />;
    
    case "heavy snow":
      return <CloudSnow className={`${sizeClasses[size]} text-blue-400`} />;
    
    case "mist":
    case "fog":
    case "haze":
      return <Wind className={`${sizeClasses[size]} text-gray-400`} />;
    
    case "thunderstorm":
    case "thunderstorm with light rain":
    case "thunderstorm with rain":
    case "thunderstorm with heavy rain":
      return <CloudRain className={`${sizeClasses[size]} text-purple-500`} />;
    
    case "smoke":
    case "dust":
    case "sand":
    case "ash":
      return <Wind className={`${sizeClasses[size]} text-orange-500`} />;
    
    case "squall":
    case "tornado":
      return <Wind className={`${sizeClasses[size]} text-red-500`} />;
    
    default:
      return <Sun className={`${sizeClasses[size]} text-yellow-500`} />;
  }
}

function processForecastData(forecastData: any, currentWeather?: any): DailyForecast[] {
  const dailyData: { [key: string]: any[] } = {};
  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];
  
  // Group forecast data by day
  forecastData.list.forEach((item: any) => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toISOString().split('T')[0];
    
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = [];
    }
    dailyData[dayKey].push(item);
  });
  
  // Sort days to ensure proper order
  const sortedDays = Object.keys(dailyData).sort();
  
  // Process each day
  const processedForecasts: DailyForecast[] = sortedDays.map(dayKey => {
    const dayItems = dailyData[dayKey];
    const date = new Date(dayKey);
    const isToday = dayKey === todayKey;
    
    // If this is today, use actual current weather data
    if (isToday && currentWeather) {
      return {
        date: dayKey,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        temp_min: Math.round(currentWeather.main.temp),
        temp_max: Math.round(currentWeather.main.temp),
        weather_main: currentWeather.weather[0]?.main || "Clear",
        weather_description: currentWeather.weather[0]?.description || "Clear",
        weather_icon: currentWeather.weather[0]?.icon || "01d"
      };
    }
    
    const temps = dayItems.map((item: any) => item.main.temp);
    const temp_min = Math.min(...temps);
    const temp_max = Math.max(...temps);
    
    const weatherCounts: { [key: string]: number } = {};
    dayItems.forEach((item: any) => {
      const weatherMain = item.weather[0]?.main || "Clear";
      weatherCounts[weatherMain] = (weatherCounts[weatherMain] || 0) + 1;
    });
    
    const mostCommonWeather = Object.keys(weatherCounts).reduce((a, b) => 
      weatherCounts[a] > weatherCounts[b] ? a : b
    );
    
    const weatherItem = dayItems.find((item: any) => item.weather[0]?.main === mostCommonWeather);
    
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
  
  return processedForecasts.slice(0, 8);
}

function getHourlyData(forecastData: any, selectedDate?: string, currentTime?: Date) {
  if (!forecastData?.list) return [];
  
  const now = currentTime || new Date();
  let filteredData = forecastData.list;
  
  // If a specific day is selected, filter data for that day
  if (selectedDate) {
    const selectedDayStart = new Date(selectedDate);
    const selectedDayEnd = new Date(selectedDate);
    selectedDayEnd.setDate(selectedDayEnd.getDate() + 1);
    
    filteredData = forecastData.list.filter((item: any) => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate >= selectedDayStart && itemDate < selectedDayEnd;
    });
  } else {
    // Find the current time in the forecast data and get the next 8 data points
    const currentTimestamp = now.getTime() / 1000; // Convert to Unix timestamp
    
    // Find the index of the current or next forecast period
    let startIndex = 0;
    for (let i = 0; i < forecastData.list.length; i++) {
      if (forecastData.list[i].dt >= currentTimestamp) {
        startIndex = i;
        break;
      }
    }
    
    // Get the next 8 data points starting from the current time
    filteredData = forecastData.list.slice(startIndex, startIndex + 8);
  }
  
  // Always limit to exactly 8 data points
  filteredData = filteredData.slice(0, 8);
  
    // If we don't have enough data, pad with the last available data
  if (filteredData.length < 8) {
    const lastItem = filteredData[filteredData.length - 1] || forecastData.list[forecastData.list.length - 1];
    while (filteredData.length < 8) {
      filteredData.push(lastItem);
    }
  }
  
  const hourlyData = filteredData.map((item: any, index: number) => {
    // Use the actual timestamp from the API data
    const itemDate = new Date(item.dt * 1000);
    const timeString = itemDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true
      });
    
    return {
      time: timeString,
      temp: Math.round(item.main.temp),
      windSpeed: Math.round(item.wind?.speed || 0),
      precipitation: Math.round((item.pop || 0) * 100), // Convert probability to percentage
      weather: item.weather[0]?.main || "Clear",
      weatherIcon: getWeatherIcon(item.weather[0]?.main || "Clear", "sm"),
      humidity: Math.round(item.main.humidity || 50),
      pressure: Math.round(item.main.pressure || 1000)
    };
  });
  
  return hourlyData;
}

function getSelectedDayWeather(forecastData: any, selectedDate: string) {
  if (!forecastData?.list || !selectedDate) return null;
  
  const selectedDayStart = new Date(selectedDate);
  const selectedDayEnd = new Date(selectedDate);
  selectedDayEnd.setDate(selectedDayEnd.getDate() + 1);
  
  const dayData = forecastData.list.filter((item: any) => {
    const itemDate = new Date(item.dt * 1000);
    return itemDate >= selectedDayStart && itemDate < selectedDayEnd;
  });
  
  if (dayData.length === 0) return null;
  
  const temps = dayData.map((item: any) => item.main.temp);
  const temp_min = Math.min(...temps);
  const temp_max = Math.max(...temps);
  
  const weatherCounts: { [key: string]: number } = {};
  dayData.forEach((item: any) => {
    const weatherMain = item.weather[0]?.main || "Clear";
    weatherCounts[weatherMain] = (weatherCounts[weatherMain] || 0) + 1;
  });
  
  const mostCommonWeather = Object.keys(weatherCounts).reduce((a, b) => 
    weatherCounts[a] > weatherCounts[b] ? a : b
  );
  
  const weatherItem = dayData.find((item: any) => item.weather[0]?.main === mostCommonWeather);
  
  return {
    temp_min: Math.round(temp_min),
    temp_max: Math.round(temp_max),
    weather_main: mostCommonWeather,
    weather_description: weatherItem?.weather[0]?.description || "Clear",
    weather_icon: weatherItem?.weather[0]?.icon || "01d",
    day: selectedDayStart.toLocaleDateString('en-US', { weekday: 'long' }),
    date: selectedDate
  };
}

interface GoogleStyleWeatherProps {
  onLocationSelect?: (location: any) => void;
  onReturnToCurrentLocation?: () => void;
  isCustomLocation?: boolean;
  currentLocationCoords?: {lat: number, lon: number} | null;
  userTimezone?: string;
}

export function GoogleStyleWeather({ 
  onLocationSelect, 
  onReturnToCurrentLocation, 
  isCustomLocation: externalIsCustomLocation, 
  currentLocationCoords: externalCurrentLocationCoords,
  userTimezone
}: GoogleStyleWeatherProps = {}) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLocationButton, setShowLocationButton] = useState(true);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'temperature' | 'precipitation' | 'wind' | 'humidity'>('temperature');
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationTime, setLocationTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMapArea, setSelectedMapArea] = useState<string | null>(null);
  const [internalIsCustomLocation, setInternalIsCustomLocation] = useState(false);
  const [internalCurrentLocationCoords, setInternalCurrentLocationCoords] = useState<{lat: number, lon: number} | null>(null);
  
  // Use external state if provided, otherwise use internal state
  const isCustomLocation = externalIsCustomLocation !== undefined ? externalIsCustomLocation : internalIsCustomLocation;
  const currentLocationCoords = externalCurrentLocationCoords !== undefined ? externalCurrentLocationCoords : internalCurrentLocationCoords;
  
  const setIsCustomLocation = (value: boolean) => {
    if (externalIsCustomLocation === undefined) {
      setInternalIsCustomLocation(value);
    }
  };
  
  const setCurrentLocationCoords = (coords: {lat: number, lon: number} | null) => {
    if (externalCurrentLocationCoords === undefined) {
      setInternalCurrentLocationCoords(coords);
    }
  };

  // Initialize weather data on component mount
  useEffect(() => {
    const initializeWeather = async () => {
      try {
        console.log('🌤️ GoogleStyleWeather: Initializing weather data...');
        
        // Check for saved weather data first
        const savedWeatherData = localStorage.getItem('weatherData');
        const savedCurrentLocationCoords = localStorage.getItem('currentLocationCoords');
        const savedCustomLocation = localStorage.getItem('customLocation');

        console.log('🌤️ Saved weather data exists:', !!savedWeatherData);
        console.log('🌤️ Saved location coords exists:', !!savedCurrentLocationCoords);

        if (savedWeatherData) {
          try {
            const parsedData = JSON.parse(savedWeatherData);
            console.log('🌤️ Parsed weather data:', parsedData);
            
            // Use saved data regardless of age for now
            setWeather(parsedData);
            setLoading(false);
            console.log('🌤️ Using saved weather data');
            return;
          } catch (err) {
            console.error('🌤️ Error parsing saved weather data:', err);
          }
        }

        // Check for saved current location coordinates
        if (savedCurrentLocationCoords) {
          try {
            const coords = JSON.parse(savedCurrentLocationCoords);
            setCurrentLocationCoords(coords);
            console.log('🌤️ Using saved location coords:', coords);
          } catch (err) {
            console.error('🌤️ Error parsing saved location coords:', err);
          }
        }

        // Check for saved custom location
        if (savedCustomLocation) {
          try {
            const customLoc = JSON.parse(savedCustomLocation);
            setIsCustomLocation(true);
            setCurrentLocationCoords(customLoc.coords);
            console.log('🌤️ Using saved custom location:', customLoc);
          } catch (err) {
            console.error('🌤️ Error parsing saved custom location:', err);
          }
        }

        // If we have coordinates but no weather data, fetch weather
        if (currentLocationCoords && !savedWeatherData) {
          console.log('🌤️ Fetching weather for saved coordinates:', currentLocationCoords);
          await fetchWeatherData(currentLocationCoords.lat, currentLocationCoords.lon);
        } else if (!savedWeatherData) {
          // Auto-detect location if no saved data
          console.log('🌤️ No saved data, auto-detecting location...');
          await autoDetectLocation();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('🌤️ Error initializing weather:', error);
        setLoading(false);
        setError('Failed to initialize weather data');
      }
    };

    initializeWeather();
  }, [userTimezone, currentLocationCoords]);

  useEffect(() => {
    const handleWeatherUpdate = () => {
      // Refresh weather data when update event is received
      if (currentLocationCoords) {
        fetchWeatherData(currentLocationCoords.lat, currentLocationCoords.lon);
      }
    };

    window.addEventListener('weatherUpdate', handleWeatherUpdate);
    return () => window.removeEventListener('weatherUpdate', handleWeatherUpdate);
  }, [currentLocationCoords]);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      const coords = { lat: latitude, lon: longitude };
      
      setCurrentLocationCoords(coords);
      localStorage.setItem('currentLocationCoords', JSON.stringify(coords));
      
      await fetchWeatherData(latitude, longitude);
    } catch (error) {
      setError('Unable to detect your location');
      setLoading(false);
    }
  };

  // Fetch weather data for given coordinates
  const fetchWeatherData = async (latitude: number, longitude: number) => {
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    
    if (!API_KEY) {
      setLoading(false);
      setError('No API key available for weather data');
      setShowLocationButton(true);
      return;
    }

    try {
      // Get current weather
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
      );

      if (currentResponse.ok) {
        const currentWeatherData = await currentResponse.json();
        
        // Get forecast
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
        );

        let forecastData = null;
        if (forecastResponse.ok) {
          forecastData = await forecastResponse.json();
        }

        const combinedWeatherData = {
          ...currentWeatherData,
          forecast: forecastData
        };
        
        // Save to localStorage
        localStorage.setItem("weatherData", JSON.stringify(combinedWeatherData));
        localStorage.setItem("weatherDataUpdated", Date.now().toString());
        
        // If this is a custom location, save it for persistence
        if (isCustomLocation) {
          localStorage.setItem("customLocationData", JSON.stringify({
            coords: { lat: latitude, lon: longitude },
            name: currentWeatherData.name,
            country: currentWeatherData.sys?.country,
            timestamp: Date.now()
          }));
        }
        
        // Update state
        setWeather(combinedWeatherData);
        setShowLocationButton(false);
        setLoading(false);
        setError(null);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('weatherDataUpdated'));
        
      } else {
        throw new Error(`Weather API error: ${currentResponse.status}`);
      }
    } catch (err) {
      console.error('❌ Error fetching weather data:', err);
      setLoading(false);
      setError("Failed to fetch weather data. Please try again.");
      setShowLocationButton(true);
    }
  };

  // Timer to update current time and refresh weather data
  useEffect(() => {
    // Update time every second for more responsive display
    const timeTimer = setInterval(() => {
      const newTime = new Date();
      setCurrentTime(newTime);
    }, 1000); // Update every second

    // Refresh weather data every 5 minutes
    const weatherTimer = setInterval(() => {
      refreshWeatherData();
    }, 300000); // Update every 5 minutes

    return () => {
      clearInterval(timeTimer);
      clearInterval(weatherTimer);
    };
  }, []);

  const refreshWeatherData = async () => {
    if (!weather?.coord) return;
    
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!API_KEY) return;

    setIsRefreshing(true);
    
    try {
      // Fetch fresh current weather
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${weather.coord.lat}&lon=${weather.coord.lon}&units=metric&appid=${API_KEY}`
      );

      if (currentResponse.ok) {
        const currentWeatherData = await currentResponse.json();
        
        // Fetch fresh forecast
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${weather.coord.lat}&lon=${weather.coord.lon}&units=metric&appid=${API_KEY}`
        );

        let forecastData = null;
        if (forecastResponse.ok) {
          forecastData = await forecastResponse.json();
        }

        const combinedWeatherData = {
          ...currentWeatherData,
          forecast: forecastData
        };
        
        localStorage.setItem("weatherData", JSON.stringify(combinedWeatherData));
        localStorage.setItem("weatherDataUpdated", Date.now().toString());
        
        setWeather(combinedWeatherData);
      }
    } catch (err) {
      console.log('❌ Error refreshing weather data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-detect location on page load (without showing loading state)
  const autoDetectLocation = async () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    try {
      console.log('🌤️ Auto-detecting location...');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('🌤️ Auto-detected location:', { latitude, longitude });
      
      // Use the shared fetchWeatherData function
      await fetchWeatherData(latitude, longitude);
      
    } catch (err) {
      console.error('Auto location detection failed:', err);
      // Don't show error for auto-detection, just log it
    }
  };

  // Manual location detection (with loading state and error handling)
  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsDetectingLocation(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use the shared fetchWeatherData function
      await fetchWeatherData(latitude, longitude);
      
    } catch (err) {
      console.error('Location detection failed:', err);
      setError("Failed to detect your location. Please try again.");
    } finally {
      setIsDetectingLocation(false);
    }
  };



  const handleLocationSelect = async (location: any) => {
    // Mark as custom location
    setIsCustomLocation(true);
    
    // Call external function if provided
    if (onLocationSelect) {
      onLocationSelect(location);
    } else {
      // Fetch weather for selected location
      await fetchWeatherData(location.lat, location.lon);
    }
  };

  const returnToCurrentLocation = async () => {
    if (onReturnToCurrentLocation) {
      onReturnToCurrentLocation();
    } else {
      if (currentLocationCoords) {
        console.log('📍 Returning to current location:', currentLocationCoords);
        setIsCustomLocation(false);
        // Clear custom location data
        localStorage.removeItem("customLocationData");
        await fetchWeatherData(currentLocationCoords.lat, currentLocationCoords.lon);
      } else {
        console.log('📍 No saved current location, detecting again...');
                  await detectLocation();
      }
    }
  };

  // Watch for changes in currentLocationCoords and fetch weather data
  useEffect(() => {
    if (currentLocationCoords && !loading) {
      console.log('📍 Location coordinates changed, fetching weather data:', currentLocationCoords);
      fetchWeatherData(currentLocationCoords.lat, currentLocationCoords.lon);
    }
  }, [currentLocationCoords]);

  // Calculate location-specific time based on coordinates
  const getLocationTime = () => {
    if (!weather?.coord) return currentTime;
    
    // Calculate timezone offset based on longitude
    // Each 15 degrees of longitude = 1 hour time difference
    // UTC is at 0° longitude, so we calculate the offset from UTC
    const timezoneOffset = Math.round(weather.coord.lon / 15);
    
    // Create a new date with the timezone offset
    const utcTime = currentTime.getTime() + (currentTime.getTimezoneOffset() * 60 * 1000);
    const locationTime = new Date(utcTime + (timezoneOffset * 60 * 60 * 1000));
    
    return locationTime;
  };

  // Weather data processing (after early returns)
  // At this point, weather is guaranteed to be non-null due to early returns above
  if (!weather) {
    return null; // This should never happen due to early returns, but TypeScript needs this
  }
  
  const temp = Math.round(weather.main.temp);
  const feelsLike = Math.round(weather.main.feels_like);
  const weatherMain = weather.weather[0]?.main || "Clear";
  const hourlyData = getHourlyData(weather.forecast, selectedDay || undefined, currentTime);
  const dailyForecast = weather.forecast ? processForecastData(weather.forecast, weather) : [];
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  // Debug information
  console.log('🌤️ Current Weather Data:', {
    currentTime: currentTime.toISOString(),
    currentTemp: temp,
    forecastDataPoints: weather.forecast?.list?.length || 0,
    hourlyDataPoints: hourlyData.length,
    dailyForecastPoints: dailyForecast.length,
    firstForecastTime: weather.forecast?.list?.[0] ? new Date(weather.forecast.list[0].dt * 1000).toISOString() : 'N/A',
    lastForecastTime: weather.forecast?.list?.[weather.forecast?.list?.length - 1] ? new Date(weather.forecast.list[weather.forecast.list.length - 1].dt * 1000).toISOString() : 'N/A'
  });

  // Weather Alert System
  const getWeatherAlerts = () => {
    const alerts = [];
    
    // Temperature Alerts
    if (temp >= 40) {
      alerts.push({
        type: 'danger',
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Extreme Heat Warning',
        message: `Temperature is ${temp}°C. Stay hydrated and avoid prolonged sun exposure.`,
        color: 'bg-red-50 border-red-200 text-red-800'
      });
    } else if (temp >= 35) {
      alerts.push({
        type: 'warning',
        icon: <AlertCircle className="h-4 w-4" />,
        title: 'High Temperature Alert',
        message: `Temperature is ${temp}°C. Take precautions in the heat.`,
        color: 'bg-orange-50 border-orange-200 text-orange-800'
      });
    } else if (temp <= 0) {
      alerts.push({
        type: 'warning',
        icon: <AlertCircle className="h-4 w-4" />,
        title: 'Freezing Temperature Alert',
        message: `Temperature is ${temp}°C. Bundle up and be careful of ice.`,
        color: 'bg-blue-50 border-blue-200 text-blue-800'
      });
    } else if (temp <= 5) {
      alerts.push({
        type: 'info',
        icon: <Info className="h-4 w-4" />,
        title: 'Cold Weather Notice',
        message: `Temperature is ${temp}°C. Dress warmly.`,
        color: 'bg-blue-50 border-blue-200 text-blue-800'
      });
    }
    
    // Weather Condition Alerts
    const weatherMain = weather.weather[0]?.main?.toLowerCase();
    if (weatherMain === 'thunderstorm') {
      alerts.push({
        type: 'danger',
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Thunderstorm Warning',
        message: 'Thunderstorm detected. Seek shelter indoors immediately.',
        color: 'bg-red-50 border-red-200 text-red-800'
      });
    } else if (weatherMain === 'heavy rain' || weatherMain === 'very heavy rain') {
      alerts.push({
        type: 'warning',
        icon: <AlertCircle className="h-4 w-4" />,
        title: 'Heavy Rain Alert',
        message: 'Heavy rainfall expected. Be careful on roads.',
        color: 'bg-orange-50 border-orange-200 text-orange-800'
      });
    } else if (weatherMain === 'snow' || weatherMain === 'heavy snow') {
      alerts.push({
        type: 'warning',
        icon: <AlertCircle className="h-4 w-4" />,
        title: 'Snow Alert',
        message: 'Snow conditions. Drive carefully and dress warmly.',
        color: 'bg-blue-50 border-blue-200 text-blue-800'
      });
    }
    
    // Wind Alerts
    const windSpeed = weather.forecast?.list?.[0]?.wind?.speed || 0;
    if (windSpeed >= 20) {
      alerts.push({
        type: 'warning',
        icon: <AlertCircle className="h-4 w-4" />,
        title: 'High Wind Alert',
        message: `Wind speed is ${windSpeed} m/s. Secure loose objects.`,
        color: 'bg-orange-50 border-orange-200 text-orange-800'
      });
    }
    
    // UV Index Alerts
    const uvIndex = 8; // Mock value - you can get this from API
    if (uvIndex >= 10) {
      alerts.push({
        type: 'warning',
        icon: <AlertCircle className="h-4 w-4" />,
        title: 'High UV Index Alert',
        message: `UV Index is ${uvIndex}. Use sunscreen and limit sun exposure.`,
        color: 'bg-orange-50 border-orange-200 text-orange-800'
      });
    } else if (uvIndex >= 7) {
      alerts.push({
        type: 'info',
        icon: <Info className="h-4 w-4" />,
        title: 'Moderate UV Index',
        message: `UV Index is ${uvIndex}. Consider sunscreen.`,
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
      });
    }
    
    // Humidity Alerts
    if (weather.main.humidity >= 90) {
      alerts.push({
        type: 'info',
        icon: <Info className="h-4 w-4" />,
        title: 'High Humidity Notice',
        message: `Humidity is ${weather.main.humidity}%. Air may feel muggy.`,
        color: 'bg-blue-50 border-blue-200 text-blue-800'
      });
    }
    
    return alerts;
  };

  const weatherAlerts = getWeatherAlerts();
  
  // Map area data for precipitation zones
  const mapAreas = [
    {
      id: 'area-1',
      name: 'Northern Region',
      type: 'light',
      color: 'green',
      position: { top: '1/6', left: '1/6' },
      size: { width: 'w-20', height: 'h-16' },
      weather: {
        temp: 28,
        humidity: 65,
        windSpeed: 3.2,
        precipitation: 15,
        condition: 'Light Rain'
      }
    },
    {
      id: 'area-2',
      name: 'Eastern Plains',
      type: 'moderate',
      color: 'yellow',
      position: { top: '1/4', left: '1/2' },
      size: { width: 'w-12', height: 'h-10' },
      weather: {
        temp: 32,
        humidity: 78,
        windSpeed: 5.1,
        precipitation: 45,
        condition: 'Moderate Rain'
      }
    },
    {
      id: 'area-3',
      name: 'Southern Hills',
      type: 'heavy',
      color: 'orange',
      position: { top: '1/2', left: '1/4' },
      size: { width: 'w-8', height: 'h-6' },
      weather: {
        temp: 25,
        humidity: 85,
        windSpeed: 7.8,
        precipitation: 75,
        condition: 'Heavy Rain'
      }
    },
    {
      id: 'area-4',
      name: 'Western Valley',
      type: 'light',
      color: 'green',
      position: { top: '1/3', right: '1/4' },
      size: { width: 'w-16', height: 'h-12' },
      weather: {
        temp: 30,
        humidity: 70,
        windSpeed: 4.2,
        precipitation: 20,
        condition: 'Light Rain'
      }
    },
    {
      id: 'area-5',
      name: 'Central Plateau',
      type: 'moderate',
      color: 'yellow',
      position: { bottom: '1/3', right: '1/6' },
      size: { width: 'w-14', height: 'h-11' },
      weather: {
        temp: 29,
        humidity: 72,
        windSpeed: 6.5,
        precipitation: 55,
        condition: 'Moderate Rain'
      }
    },
    {
      id: 'area-6',
      name: 'Coastal Region',
      type: 'heavy',
      color: 'orange',
      position: { bottom: '1/4', right: '1/3' },
      size: { width: 'w-10', height: 'h-8' },
      weather: {
        temp: 27,
        humidity: 88,
        windSpeed: 9.2,
        precipitation: 85,
        condition: 'Heavy Rain'
      }
    },
    {
      id: 'area-7',
      name: 'Mountain Range',
      type: 'light',
      color: 'green',
      position: { bottom: '1/4', left: '1/3' },
      size: { width: 'w-18', height: 'h-14' },
      weather: {
        temp: 22,
        humidity: 60,
        windSpeed: 8.5,
        precipitation: 25,
        condition: 'Light Rain'
      }
    }
  ];
  
  // Get selected day weather data
  const selectedDayWeather = selectedDay ? getSelectedDayWeather(weather.forecast, selectedDay) : null;
  
  // Determine what to display - Always use actual current weather data for today
  const displayTemp = selectedDayWeather ? selectedDayWeather.temp_max : temp;
  const displayWeatherMain = selectedDayWeather ? selectedDayWeather.weather_main : weatherMain;
  const displayDescription = selectedDayWeather ? selectedDayWeather.weather_description : weather.weather[0]?.description;
  const displayDay = selectedDayWeather ? selectedDayWeather.day : currentDay;

  // Enhanced hourly data with more metrics
  const enhancedHourlyData = hourlyData.map((hour: any) => ({
    ...hour,
    humidity: Math.round(Math.random() * 30) + 50, // Mock humidity data
    pressure: Math.round(Math.random() * 20) + 1000, // Mock pressure data
    uvIndex: Math.round(Math.random() * 5) + 1, // Mock UV index
  }));

  // Weather condition distribution for pie chart
  const weatherDistribution = hourlyData.reduce((acc: any, hour: any) => {
    acc[hour.weather] = (acc[hour.weather] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(weatherDistribution).map(([weather, count]) => ({
    name: weather,
    value: count,
    color: weather === 'Clear' ? '#fbbf24' : 
           weather === 'Clouds' ? '#6b7280' : 
           weather === 'Rain' ? '#3b82f6' : '#10b981'
  }));
  
  // Get Google-style weather description
  const getWeatherDescription = (weatherMain: string, description: string) => {
    switch (weatherMain.toLowerCase()) {
      case "clear":
      case "clear sky":
        return "Clear";
      case "clouds":
      case "scattered clouds":
        return "Partly Cloudy";
      case "broken clouds":
        return "Cloudy";
      case "overcast clouds":
        return "Overcast";
      case "rain":
      case "light rain":
        return "Light Rain";
      case "moderate rain":
        return "Rain";
      case "heavy rain":
        return "Heavy Rain";
      case "drizzle":
      case "light drizzle":
        return "Drizzle";
      case "snow":
      case "light snow":
        return "Light Snow";
      case "heavy snow":
        return "Heavy Snow";
      case "mist":
      case "fog":
        return "Foggy";
      case "thunderstorm":
        return "Thunderstorm";
      default:
        return description || "Clear";
    }
  };

  // Show loading state if weather data is not available
  if (loading && !weather) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weather data...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error and no weather data
  if (error && !weather) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="p-4 rounded-lg border bg-red-50 border-red-200 text-red-800">
            <h4 className="font-semibold mb-2">Weather Data Error</h4>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 relative z-10">
      {/* Weather Alerts and Notifications */}
      <div className="space-y-3">
        {/* Location Error Notification */}
        {error && (
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200 text-blue-800 flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <Info className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Location Notice</h4>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2 opacity-75">
                You can search for a different location or allow location access in your browser settings.
              </p>
            </div>
          </div>
        )}
        
        {/* Weather Alerts */}
        {weatherAlerts.length > 0 && (
          <>
            {weatherAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${alert.color} flex items-start space-x-3`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {alert.icon}
                 </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{alert.title}</h4>
                  <p className="text-sm">{alert.message}</p>
             </div>
             </div>
            ))}
          </>
        )}
      </div>

      {/* Main Weather Layout - OpenWeatherMap Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Left Column - Current Weather */}
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4 sm:p-6">
                        {/* Location Header */}
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  
                  <span className="text-lg font-semibold text-gray-800">
                    {weather.name}, {weather.sys.country}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {getLocationTime().toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true 
                  })}
                </div>
              </div>
            </div>

            {/* Current Weather Display */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                {getWeatherIcon(displayWeatherMain, "lg")}
                <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-800 ml-2 sm:ml-4">{displayTemp}°</div>
              </div>
              <div className="text-xl text-gray-600 capitalize mb-2">
               {getWeatherDescription(displayWeatherMain, displayDescription || "")}
             </div>
              <div className="text-sm text-gray-500">
                Feels like {feelsLike}°
             </div>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Wind className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Wind</p>
                  <p className="text-sm font-semibold">{weather.forecast?.list[0]?.wind?.speed || 0} m/s SE</p>
           </div>
         </div>

              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Gauge className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Pressure</p>
                  <p className="text-sm font-semibold">{weather.main.pressure} hPa</p>
                </div>
          </div>
          
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Droplets className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Humidity</p>
                  <p className="text-sm font-semibold">{weather.main.humidity}%</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Eye className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-500">UV Index</p>
                  <p className="text-sm font-semibold">8</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Thermometer className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">Dew Point</p>
                  <p className="text-sm font-semibold">24°C</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Navigation className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Visibility</p>
                  <p className="text-sm font-semibold">10.0 km</p>
                </div>
              </div>
            </div>

            {/* Location Button */}
          {showLocationButton && (
              <div className="mt-3 sm:mt-4 text-center">
            <button
              onClick={detectCurrentLocation}
              disabled={isDetectingLocation}
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-xs sm:text-sm"
            >
              {isDetectingLocation ? "Detecting..." : "Use precise location"}
            </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Precipitation Map */}
        <Card className="bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Precipitation Map</h3>
            <div className="relative h-64 bg-gradient-to-b from-blue-50 to-green-50 rounded-lg border-2 border-gray-200 overflow-hidden">
              {/* Map Background - Geographical Style */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50">
                {/* Geographical Features */}
                <div className="absolute inset-0">
                  {/* Water Bodies */}
                  <div className="absolute top-1/4 left-1/4 w-16 h-8 bg-blue-200 rounded-full opacity-30"></div>
                  <div className="absolute bottom-1/3 right-1/4 w-12 h-6 bg-blue-200 rounded-full opacity-30"></div>
                  
                  {/* Roads/Highways */}
                  <div className="absolute top-1/3 left-0 w-full h-0.5 bg-gray-300 opacity-40"></div>
                  <div className="absolute top-2/3 left-0 w-full h-0.5 bg-gray-300 opacity-40"></div>
                  <div className="absolute top-0 left-1/3 w-0.5 h-full bg-gray-300 opacity-40"></div>
                  <div className="absolute top-0 left-2/3 w-0.5 h-full bg-gray-300 opacity-40"></div>
                  
                  {/* Administrative Boundaries */}
                  <div className="absolute top-1/4 left-0 w-full h-px bg-gray-400 opacity-20"></div>
                  <div className="absolute top-3/4 left-0 w-full h-px bg-gray-400 opacity-20"></div>
                </div>
        </div>

                            {/* Precipitation Overlay - Selectable Areas */}
              <div className="absolute inset-0">
                {mapAreas.map((area) => {
                  const isSelected = selectedMapArea === area.id;
                  const colorClasses = {
                    green: 'bg-green-400',
                    yellow: 'bg-yellow-400',
                    orange: 'bg-orange-400'
                  };
                  const opacityClasses = {
                    green: 'opacity-30',
                    yellow: 'opacity-40',
                    orange: 'opacity-50'
                  };
                  
                  return (
                    <div
                      key={area.id}
                      className={`absolute ${area.size.width} ${area.size.height} ${colorClasses[area.color as keyof typeof colorClasses]} ${opacityClasses[area.color as keyof typeof opacityClasses]} rounded-full cursor-pointer transition-all duration-200 hover:opacity-70 ${
                        isSelected ? 'ring-4 ring-blue-500 ring-opacity-70 opacity-80' : ''
                      }`}
                      style={{
                        top: area.position.top,
                        left: area.position.left,
                        right: area.position.right,
                        bottom: area.position.bottom
                      }}
                      onClick={() => setSelectedMapArea(selectedMapArea === area.id ? null : area.id)}
                    >
                      {/* Area Label */}
                      <div className={`absolute inset-0 flex items-center justify-center text-xs font-medium text-white ${
                        isSelected ? 'opacity-100' : 'opacity-0'
                      } transition-opacity duration-200`}>
                        {area.name}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* City Names and Markers */}
              <div className="absolute inset-0 p-2">
                {/* City Markers */}
                <div className="absolute top-1/6 left-1/4">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  <span className="absolute top-2 left-3 text-xs font-medium text-gray-700">City A</span>
                </div>
                <div className="absolute top-1/3 right-1/3">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  <span className="absolute top-2 left-3 text-xs font-medium text-gray-700">City B</span>
                </div>
                <div className="absolute bottom-1/4 left-1/2">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  <span className="absolute top-2 left-3 text-xs font-medium text-gray-700">City C</span>
                </div>
                <div className="absolute bottom-1/3 right-1/4">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  <span className="absolute top-2 left-3 text-xs font-medium text-gray-700">City D</span>
                </div>
              </div>
              
              {/* Current Location Marker */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                <span className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-600 bg-white px-1 rounded">
                  You
                </span>
              </div>
              
              {/* Precipitation Legend */}
              <div className="absolute bottom-2 left-2 bg-white bg-opacity-95 rounded-lg p-2 text-xs shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>Light</span>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span>Moderate</span>
                  <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                  <span>Heavy</span>
                </div>
              </div>
              
              {/* No Precipitation Label */}
              <div className="absolute bottom-2 right-2 bg-white bg-opacity-95 rounded-lg p-2 text-xs shadow-sm">
                <p className="text-gray-700 font-medium">No precipitation</p>
              </div>
              
              {/* Map Attribution */}
              <div className="absolute top-2 right-2 text-xs text-gray-500">
                © OpenStreetMap
              </div>
            </div>
            
            {/* Selected Area Data Card */}
            {selectedMapArea && (() => {
              const selectedArea = mapAreas.find(area => area.id === selectedMapArea);
              if (!selectedArea) return null;
              
              return (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-800">{selectedArea.name}</h4>
                    <button
                      onClick={() => setSelectedMapArea(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-gray-600">Temperature:</span>
                        <span className="text-sm font-semibold">{selectedArea.weather.temp}°C</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Humidity:</span>
                        <span className="text-sm font-semibold">{selectedArea.weather.humidity}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Wind className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">Wind Speed:</span>
                        <span className="text-sm font-semibold">{selectedArea.weather.windSpeed} m/s</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CloudRain className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Precipitation:</span>
                        <span className="text-sm font-semibold">{selectedArea.weather.precipitation}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Cloud className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Condition:</span>
                        <span className="text-sm font-semibold">{selectedArea.weather.condition}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full ${
                          selectedArea.color === 'green' ? 'bg-green-400' :
                          selectedArea.color === 'yellow' ? 'bg-yellow-400' :
                          'bg-orange-400'
                        }`}></div>
                        <span className="text-sm text-gray-600">Intensity:</span>
                        <span className="text-sm font-semibold capitalize">{selectedArea.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Precipitation Summary */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-xs font-medium text-green-800">Light Rain</p>
                <p className="text-sm font-bold text-green-600">
                  {mapAreas.filter(area => area.type === 'light').length} areas
                </p>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded-lg">
                <p className="text-xs font-medium text-yellow-800">Moderate</p>
                <p className="text-sm font-bold text-yellow-600">
                  {mapAreas.filter(area => area.type === 'moderate').length} areas
                </p>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded-lg">
                <p className="text-xs font-medium text-orange-800">Heavy</p>
                <p className="text-sm font-bold text-orange-600">
                  {mapAreas.filter(area => area.type === 'heavy').length} areas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Hourly and Daily Forecasts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Hourly Forecast */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Hourly Forecast</h3>
         {hourlyData.length > 0 ? (
              <div>
                {/* Temperature Chart */}
                <div className="h-48 mb-4">
               <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={enhancedHourlyData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                     <defs>
                       <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.1}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                     <XAxis 
                       dataKey="time" 
                       stroke="#6b7280"
                       fontSize={12}
                       tickLine={false}
                       axisLine={false}
                     />
                     <YAxis 
                       stroke="#6b7280"
                       fontSize={12}
                       tickLine={false}
                       axisLine={false}
                       tickFormatter={(value) => `${value}°`}
                     />
                     <Tooltip 
                       content={({ active, payload, label }) => {
                         if (active && payload && payload.length) {
                           return (
                             <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                               <p className="text-sm font-medium text-gray-800">{label}</p>
                               <p className="text-lg font-bold text-yellow-600">
                                 {payload[0].value}°C
                               </p>
                             </div>
                           );
                         }
                         return null;
                       }}
                     />
                     <Area 
                       type="monotone" 
                       dataKey="temp" 
                       stroke="#f59e0b" 
                       strokeWidth={3}
                       fill="url(#tempGradient)"
                     />
                   </AreaChart>
               </ResponsiveContainer>
             </div>

             {/* Weather Icons Row */}
                <div className="flex justify-between overflow-x-auto">
               {hourlyData.map((hour: any, index: number) => (
                 <div 
                   key={index} 
                      className="flex flex-col items-center flex-1 cursor-pointer transition-all duration-200 rounded-lg p-2 hover:bg-gray-50"
                    >
                      <div className="text-xs text-gray-600 mb-1">{hour.time}</div>
                   <div className="mb-1">
                     {hour.weatherIcon}
                   </div>
                   <div className="text-xs text-gray-600 font-medium">
                        {hour.temp}°
                   </div>
                      <div className="text-xs text-gray-500">
                        {hour.windSpeed} m/s
                     </div>
                 </div>
               ))}
             </div>
           </div>
         ) : (
              <div className="text-center text-gray-500 py-8">
             <p>Hourly forecast data not available</p>
           </div>
                    )}
          </CardContent>
        </Card>

        {/* Right - 8-Day Forecast */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">8-Day Forecast</h3>
         {dailyForecast.length > 0 ? (
           <div>
                {/* Selected Day Details */}
                {selectedDay && selectedDayWeather && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{selectedDayWeather.day}</h4>
                      <button
                        onClick={() => setSelectedDay(null)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Show current
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">High: {selectedDayWeather.temp_max}°</p>
                        <p className="text-gray-600">Low: {selectedDayWeather.temp_min}°</p>
                        <p className="text-gray-600">Precipitation: 2.58 mm (100%)</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Wind: 6.7 m/s ESE</p>
                        <p className="text-gray-600">Pressure: 1002 hPa</p>
                        <p className="text-gray-600">Humidity: 57%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Daily Forecast Grid */}
                <div className="grid grid-cols-4 gap-2">
               {dailyForecast.map((day, index) => {
                 const isToday = new Date().toDateString() === new Date(day.date).toDateString();
                 const isSelected = selectedDay === day.date;
                 
                 return (
                   <div 
                     key={index} 
                        className={`text-center cursor-pointer transition-all duration-200 rounded-lg p-2 ${
                       isSelected 
                         ? 'bg-blue-100 border-2 border-blue-300' 
                         : isToday && !selectedDay
                         ? 'bg-blue-100 border-2 border-blue-300'
                         : 'hover:bg-gray-100'
                     }`}
                     onClick={() => {
                       if (selectedDay === day.date) {
                            setSelectedDay(null);
                       } else {
                         setSelectedDay(day.date);
                       }
                     }}
                   >
                        <div className="text-xs font-medium text-gray-600 mb-1">{day.day}</div>
                     <div className="mb-1">
                       {getWeatherIcon(day.weather_main, "sm")}
                     </div>
                     <div className="text-sm font-semibold text-gray-800">
                       {isToday ? temp : day.temp_max}°
                     </div>
                     <div className="text-xs text-gray-500">
                       {isToday ? temp : day.temp_min}°
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
         ) : (
              <div className="text-center text-gray-500 py-8">
             <p>Daily forecast data not available</p>
           </div>
         )}
        </CardContent>
    </Card>
      </div>
    </div>
  );
}
