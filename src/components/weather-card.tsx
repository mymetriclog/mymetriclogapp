"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Thermometer, MapPin } from "lucide-react";
import { useLocation } from "@/hooks/use-location";

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
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
  forecast?: {
    list: Array<{
      dt: number;
      main: {
        temp: number;
        humidity: number;
      };
      weather: Array<{
        main: string;
        description: string;
        icon: string;
      }>;
      dt_txt: string;
    }>;
  };
}

// Use environment variable or fallback to demo mode
const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

// Debug: Log the API key (remove this in production)
console.log('API Key loaded:', API_KEY ? 'Yes' : 'No');

function getWeatherIcon(weatherMain: string) {
  switch (weatherMain.toLowerCase()) {
    case "clear":
      return <Sun className="h-8 w-8 text-yellow-500" />;
    case "clouds":
      return <Cloud className="h-8 w-8 text-gray-500" />;
    case "rain":
    case "drizzle":
      return <CloudRain className="h-8 w-8 text-blue-500" />;
    case "snow":
      return <CloudSnow className="h-8 w-8 text-blue-300" />;
    case "mist":
    case "fog":
      return <Wind className="h-8 w-8 text-gray-400" />;
    default:
      return <Sun className="h-8 w-8 text-yellow-500" />;
  }
}

interface WeatherCardProps {
  userTimezone?: string;
  initialWeatherData?: any;
}

export function WeatherCard({ userTimezone }: WeatherCardProps = {}) {
  const { location, detectLocationFromTimezone } = useLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFreshData, setIsFreshData] = useState(false);
  const [showLocationButton, setShowLocationButton] = useState(true);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Debug: Log current localStorage state on component mount
  useEffect(() => {
    console.log('🔍 Weather Card Component Mounted');
    console.log('🔍 Current localStorage state:');
    console.log('  - weatherData:', localStorage.getItem("weatherData"));
    console.log('  - weatherLocation:', localStorage.getItem("weatherLocation"));
    console.log('  - weatherDataUpdated:', localStorage.getItem("weatherDataUpdated"));
    console.log('  - userLocation:', localStorage.getItem("userLocation"));
    console.log('  - userTimezone:', localStorage.getItem("userTimezone"));
    
    // Check if we should show the location button
    const savedWeatherData = localStorage.getItem("weatherData");
    if (!savedWeatherData) {
      console.log('🔍 No weather data found, showing location button');
      setShowLocationButton(true);
    } else {
      console.log('🔍 Weather data exists, checking if it was set by current location');
      try {
        const weatherData = JSON.parse(savedWeatherData);
        console.log('🔍 Weather data structure:', {
          hasCoord: !!weatherData.coord,
          coord: weatherData.coord,
          hasForecast: !!weatherData.forecast,
          forecastList: weatherData.forecast?.list?.length || 0
        });
        
        // Check if this weather data came from current location (GPS) or timezone
        const hasCoordinates = weatherData.coord && weatherData.coord.lat && weatherData.coord.lon;
        const hasForecast = weatherData.forecast && weatherData.forecast.list && weatherData.forecast.list.length > 0;
        
        console.log('🔍 Analysis:', { hasCoordinates, hasForecast });
        
        // Show "Use Current Location" button if:
        // 1. No coordinates (timezone-based weather) OR
        // 2. Has coordinates but no forecast (incomplete GPS data)
        if (!hasCoordinates || (hasCoordinates && !hasForecast)) {
          console.log('🔍 Weather data is timezone-based or incomplete, showing "Use Current Location" button');
          setShowLocationButton(true);
        } else {
          console.log('🔍 Weather data is from current location (GPS), hiding location button');
          setShowLocationButton(false);
        }
      } catch (err) {
        console.log('🔍 Error parsing weather data, showing location button');
        setShowLocationButton(true);
      }
    }
  }, []);

  // Listen for weather data updates to hide location button when current location is used
  useEffect(() => {
    const handleWeatherUpdate = () => {
      const savedWeatherData = localStorage.getItem("weatherData");
      if (savedWeatherData) {
        try {
          const weatherData = JSON.parse(savedWeatherData);
          // Check if this is complete current location data (has both coordinates and forecast)
          const hasCoordinates = weatherData.coord && weatherData.coord.lat && weatherData.coord.lon;
          const hasForecast = weatherData.forecast && weatherData.forecast.list;
          
          if (hasCoordinates && hasForecast) {
            console.log('🔍 Weather updated with complete current location data, hiding location button');
            setShowLocationButton(false);
          } else if (hasCoordinates && !hasForecast) {
            console.log('🔍 Weather updated with coordinates but no forecast, keeping location button visible');
            setShowLocationButton(true);
          } else {
            console.log('🔍 Weather updated without coordinates (timezone-based), keeping location button visible');
            setShowLocationButton(true);
          }
        } catch (err) {
          console.log('🔍 Error parsing weather data in update handler');
        }
      }
    };

    window.addEventListener('weatherDataUpdated', handleWeatherUpdate);
    return () => window.removeEventListener('weatherDataUpdated', handleWeatherUpdate);
  }, []);

  // Listen for weather data updates from profile form and localStorage changes
  useEffect(() => {
    console.log('🌤️ Weather card setting up event listeners...');
    
    const handleWeatherUpdate = (event: any) => {
      console.log('🌤️ Weather card received update event!');
      console.log('🌤️ Event detail:', event.detail);
      
      if (event.detail && event.detail.weatherData) {
        const newWeatherData = event.detail.weatherData;
        console.log('🌤️ Setting weather data from event:', newWeatherData);
        setWeather(newWeatherData);
        setLoading(false);
        setError(null);
        
        // Show success message and set fresh data indicator
        const temp = Math.round(newWeatherData.main.temp);
        const city = newWeatherData.name;
        const country = newWeatherData.sys.country;
        console.log(`✅ Weather updated: ${temp}°C in ${city}, ${country}`);
        
        setIsFreshData(true);
        // Remove fresh data indicator after 3 seconds
        setTimeout(() => setIsFreshData(false), 3000);
      } else {
        console.log('❌ Invalid event detail received');
      }
    };

    // Listen for localStorage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'weatherData' && event.newValue) {
        console.log('🌤️ Weather card detected localStorage change');
        try {
          const weatherData = JSON.parse(event.newValue);
          console.log('🌤️ Setting weather data from localStorage change:', weatherData);
          setWeather(weatherData);
          setLoading(false);
          setError(null);
          
          const temp = Math.round(weatherData.main.temp);
          const city = weatherData.name;
          const country = weatherData.sys.country;
          console.log(`✅ Weather updated from storage: ${temp}°C in ${city}, ${country}`);
          
          setIsFreshData(true);
          setTimeout(() => setIsFreshData(false), 3000);
        } catch (err) {
          console.log('❌ Failed to parse weather data from storage:', err);
        }
      }
    };

    window.addEventListener('weatherDataUpdated', handleWeatherUpdate);
    window.addEventListener('storage', handleStorageChange);
    console.log('🌤️ Weather card event listeners added');
    
    return () => {
      window.removeEventListener('weatherDataUpdated', handleWeatherUpdate);
      window.removeEventListener('storage', handleStorageChange);
      console.log('🌤️ Weather card event listeners removed');
    };
  }, []); // Remove weather dependency to prevent re-adding listeners

  // Load saved weather data on mount and check for updates
  useEffect(() => {
    const loadWeatherData = () => {
      const savedWeatherData = localStorage.getItem("weatherData");
      const savedWeatherLocation = localStorage.getItem("weatherLocation");
      const weatherDataUpdated = localStorage.getItem("weatherDataUpdated");
      
      console.log('🔍 Weather Card - Checking localStorage...');
      console.log('🔍 Saved weather data exists:', !!savedWeatherData);
      console.log('🔍 Weather data updated flag:', weatherDataUpdated);
      
      if (savedWeatherData) {
        try {
          const weatherData = JSON.parse(savedWeatherData);
          console.log('🔍 Current Weather Card - Parsed weather data:', weatherData);
          console.log('🔍 Has forecast property:', !!weatherData.forecast);
          console.log('🔍 Current weather info:', {
            temp: weatherData.main?.temp,
            city: weatherData.name,
            country: weatherData.sys?.country,
            description: weatherData.weather?.[0]?.description
          });
          
          const currentWeatherString = weather ? JSON.stringify(weather) : null;
          const newWeatherString = JSON.stringify(weatherData);
          
          // Check if weather data was recently updated or if data is different
          const shouldUpdate = weatherDataUpdated || newWeatherString !== currentWeatherString;
          
          if (shouldUpdate) {
            console.log('🌤️ Loading new weather data from localStorage:', weatherData);
            setWeather(weatherData);
            setLoading(false);
            setError(null);
            setIsFreshData(true);
            setTimeout(() => setIsFreshData(false), 3000);
            
            // Hide location button if weather data is available
            setShowLocationButton(false);
            
            // Clear the update flag
            if (weatherDataUpdated) {
              localStorage.removeItem("weatherDataUpdated");
              console.log('✅ Weather data updated successfully');
            }
          }
        } catch (err) {
          console.log('❌ Failed to parse saved weather data:', err);
        }
      }
      
      if (savedWeatherLocation) {
        try {
          const locationData = JSON.parse(savedWeatherLocation);
          console.log('📍 Loading saved location data:', locationData);
          // Update the location in localStorage for the useLocation hook
          localStorage.setItem("userLocation", JSON.stringify(locationData));
        } catch (err) {
          console.log('Failed to parse saved location data');
        }
      }
    };

    // Load data on mount
    loadWeatherData();

    // Check for updates every 2 seconds
    const interval = setInterval(loadWeatherData, 2000);

    return () => clearInterval(interval);
  }, [weather]);

  // Auto-detect location from timezone on first load if no saved location
  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (!savedLocation) {
      // Use the prop userTimezone if provided, otherwise fall back to localStorage or browser timezone
      const timezoneToUse = userTimezone || localStorage.getItem("userTimezone") || undefined;
      if (timezoneToUse) {
        detectLocationFromTimezone(timezoneToUse).catch(() => {
          console.log("Auto timezone-based location detection failed, using default");
        });
      } else {
        // If no timezone is set, use browser timezone
        detectLocationFromTimezone().catch(() => {
          console.log("Browser timezone detection failed, using default");
        });
      }
    }
  }, [detectLocationFromTimezone, userTimezone]);

  // Function to detect current location using GPS
  const detectCurrentLocation = async () => {
    console.log('🔍 Starting current location detection...');
    setIsDetectingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      console.log('❌ Geolocation not supported');
      setError("Geolocation is not supported by your browser");
      setIsDetectingLocation(false);
      return;
    }

    try {
      console.log('🔍 Requesting GPS permission...');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('📍 Current location detected:', { latitude, longitude });
      console.log('📍 Location accuracy:', position.coords.accuracy, 'meters');

      // Fetch weather data for current location
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      if (!API_KEY) {
        console.log('❌ No API key available');
        setError('No API key available for weather data');
        setIsDetectingLocation(false);
        return;
      }

      console.log('🔍 Fetching weather data for coordinates:', { lat: latitude, lon: longitude });
      
      // Get current weather data for current coordinates
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
      );

      console.log('🔍 Current weather API response status:', currentResponse.status);

      if (currentResponse.ok) {
        const currentWeatherData = await currentResponse.json();
        console.log('🌤️ Current weather data for current location:', currentWeatherData);
        console.log('🌤️ Location from API:', currentWeatherData.name + ', ' + currentWeatherData.sys?.country);
        
        // Get hourly forecast data
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
        );

        let forecastData = null;
        if (forecastResponse.ok) {
          forecastData = await forecastResponse.json();
          console.log('📅 Hourly forecast data:', forecastData);
        }

        // Combine current weather and forecast data
        const combinedWeatherData = {
          ...currentWeatherData,
          forecast: forecastData
        };
        
        // Save weather data to localStorage
        localStorage.setItem("weatherData", JSON.stringify(combinedWeatherData));
        localStorage.setItem("weatherDataUpdated", Date.now().toString());
        
        // Set weather state
        setWeather(combinedWeatherData);
        setLoading(false);
        setError(null);
        setIsFreshData(true);
        setTimeout(() => setIsFreshData(false), 3000);
        
        // Hide the location button permanently
        console.log('🔍 Hiding location button - setting showLocationButton to false');
        setShowLocationButton(false);
        
        // Trigger update events for other components (like forecast card)
        const event = new CustomEvent('weatherDataUpdated', {
          detail: { weatherData: combinedWeatherData }
        });
        window.dispatchEvent(event);
        
        // Also trigger a storage event for cross-tab communication
        const storageEvent = new StorageEvent('storage', {
          key: 'weatherData',
          newValue: JSON.stringify(combinedWeatherData),
          oldValue: null,
          storageArea: localStorage
        });
        window.dispatchEvent(storageEvent);
        
        console.log('✅ Current location weather updated successfully');
        console.log('🔍 Button should now be hidden. showLocationButton state:', false);
      } else {
        const errorText = await currentResponse.text();
        console.log('❌ Weather API error:', currentResponse.status, errorText);
        throw new Error(`Weather API error: ${currentResponse.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Location detection failed:', err);
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied. Please allow location access and try again.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information unavailable. Please try again.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("Failed to detect your location. Please try again.");
        }
      } else {
        setError("Failed to get weather data. Please try again.");
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  useEffect(() => {
    async function fetchWeather() {
      // If no API key is provided, show demo data immediately
      if (!API_KEY) {
        console.log('No API key provided, showing demo weather data');
        setError('No API key - showing demo data');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching weather data for location:', location.city);
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('Weather data received:', data);
          setWeather(data);
        } else if (response.status === 401) {
          console.error('OpenWeatherMap API key is invalid or expired');
          setError('API key invalid - showing demo data');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.error('Weather API error:', err);
        setError('Unable to fetch weather data');
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [API_KEY, location.lat, location.lon, location.city]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-pulse bg-gray-200 rounded-full h-8 w-8"></div>
            <div className="space-y-2">
              <div className="animate-pulse bg-gray-200 rounded h-4 w-20"></div>
              <div className="animate-pulse bg-gray-200 rounded h-6 w-16"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    // Show clean fallback weather data when API fails
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sun className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-sm text-muted-foreground">Weather</div>
                <div className="text-2xl font-semibold">22°C</div>
                <div className="text-sm text-muted-foreground">
                  Feels like 24°C
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {location.city}, {location.country}
              </div>
              <div className="text-sm text-muted-foreground capitalize">
                Partly cloudy
              </div>
              <div className="flex items-center justify-end mt-1">
                <Thermometer className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm text-muted-foreground">
                  65%
                </span>
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700">
                Set your timezone in Settings to see real weather data
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const temp = Math.round(weather.main.temp);
  const feelsLike = Math.round(weather.main.feels_like);
  const weatherMain = weather.weather[0]?.main || "Clear";

    return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getWeatherIcon(weatherMain)}
            <div>
              <div className="text-sm text-muted-foreground">Weather</div>
              <div className="text-2xl font-semibold">{temp}°C</div>
              <div className="text-sm text-muted-foreground">
                Feels like {feelsLike}°C
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {weather.name}, {weather.sys.country}
            </div>
            <div className="text-sm text-muted-foreground capitalize">
              {weather.weather[0]?.description}
            </div>
            <div className="flex items-center justify-end mt-1">
              <Thermometer className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-sm text-muted-foreground">
                {weather.main.humidity}%
              </span>
            </div>
          </div>
        </div>
        

        

        

        
        {/* Success indicator */}
        {isFreshData && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-700">
              ✅ Weather updated successfully
            </p>
          </div>
        )}
        
        {/* Error display */}
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
