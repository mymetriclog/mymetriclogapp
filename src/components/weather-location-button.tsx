"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

export function WeatherLocationButton() {
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(true);

  // Check if user has already set current location
  useEffect(() => {
    // Check if we should show the button
    const savedWeatherData = localStorage.getItem('weatherData');
    const savedCurrentLocationCoords = localStorage.getItem('currentLocationCoords');
    const savedCustomLocation = localStorage.getItem('customLocation');

    if (!savedWeatherData) {
      setShowButton(true);
      return;
    }

    try {
      const weatherData = JSON.parse(savedWeatherData);
      
      // Check if we have current location coordinates
      if (savedCurrentLocationCoords) {
        const currentCoords = JSON.parse(savedCurrentLocationCoords);
        
        // Check if current weather matches current location
        const coordMatch = weatherData.coord && 
          Math.abs(weatherData.coord.lat - currentCoords.lat) < 0.01 && 
          Math.abs(weatherData.coord.lon - currentCoords.lon) < 0.01;
        
        const isCurrentLocation = coordMatch;
        
        if (isCurrentLocation) {
          setShowButton(false);
        } else {
          setShowButton(true);
        }
      } else {
        setShowButton(true);
      }
    } catch (err) {
      setShowButton(true);
    }
  }, []);

  // Function to detect current location using GPS
  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    setError(null);
    
    // Show loading toast
    const loadingToast = toast.loading("Detecting your location...", {
      description: "Please allow location access when prompted.",
    });

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      toast.dismiss(loadingToast);
      toast.error("❌ Geolocation Not Supported", {
        description: "Your browser doesn't support location detection.",
      });
      setIsDetectingLocation(false);
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

      // Fetch weather data for current location
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      if (!API_KEY) {
        setError('No API key available for weather data');
        toast.dismiss(loadingToast);
        toast.error("❌ API Key Missing", {
          description: "Weather API key is not configured.",
        });
        setIsDetectingLocation(false);
        return;
      }
      
      // Get current weather data for current coordinates
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
      );

      if (currentResponse.ok) {
        const currentWeatherData = await currentResponse.json();
        
        // Get hourly forecast data
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
        );

        let forecastData = null;
        if (forecastResponse.ok) {
          forecastData = await forecastResponse.json();
        }

        // Combine current weather and forecast data
        const combinedWeatherData = {
          ...currentWeatherData,
          forecast: forecastData
        };
        
        // Save weather data to localStorage
        localStorage.setItem("weatherData", JSON.stringify(combinedWeatherData));
        localStorage.setItem("weatherDataUpdated", Date.now().toString());
        
        // Save current location coordinates for future reference
        localStorage.setItem("currentLocationCoords", JSON.stringify({ lat: latitude, lon: longitude }));
        
        // Clear any custom location data since we're using current location
        localStorage.removeItem("customLocationData");
        
        // Trigger update events for other components (like weather cards)
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
        
        // Show success toast
        toast.dismiss(loadingToast);
        toast.success("📍 Location Updated!", {
          description: `Weather data updated for ${currentWeatherData.name}, ${currentWeatherData.sys?.country}`,
        });
        
        // Hide the button after successful location detection
        setShowButton(false);
      } else {
        const errorText = await currentResponse.text();
        toast.dismiss(loadingToast);
        toast.error("❌ Weather API Error", {
          description: `Failed to fetch weather data (${currentResponse.status})`,
        });
        throw new Error(`Weather API error: ${currentResponse.status} - ${errorText}`);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied. Please allow location access and try again.");
            toast.error("❌ Location Permission Denied", {
              description: "Please allow location access and try again.",
            });
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information unavailable. Please try again.");
            toast.error("❌ Location Unavailable", {
              description: "Location information is currently unavailable.",
            });
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.");
            toast.error("❌ Location Timeout", {
              description: "Location request timed out. Please try again.",
            });
            break;
          default:
            setError("Failed to detect your location. Please try again.");
            toast.error("❌ Location Detection Failed", {
              description: "Failed to detect your location. Please try again.",
            });
        }
      } else {
        setError("Failed to get weather data. Please try again.");
        toast.error("❌ Weather Data Error", {
          description: "Failed to get weather data. Please try again.",
        });
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Function to reset location and show the button again
  const resetLocation = () => {
    localStorage.removeItem("weatherData");
    localStorage.removeItem("weatherDataUpdated");
    localStorage.removeItem("currentLocationCoords");
    localStorage.removeItem("customLocationData");
    setShowButton(true);
    
    // Show reset toast
    toast.success("🔄 Location Reset", {
      description: "Location data has been cleared. You can set a new location.",
    });
    
    // Trigger events to update other components
    const event = new CustomEvent('weatherDataUpdated', {
      detail: { weatherData: null }
    });
    window.dispatchEvent(event);
  };

  // Show reset button if weather data exists, otherwise show the main button
  if (!showButton) {
    return (
      <Button
        onClick={resetLocation}
        variant="outline"
        className="flex items-center gap-2"
      >
        <MapPin className="h-4 w-4" />
        <span className="hidden md:inline">Reset Location</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={() => {
        // Show immediate feedback toast
        toast.info("📍 Location Detection", {
          description: "Starting location detection process...",
          duration: 2000,
        });
        detectCurrentLocation();
      }}
      disabled={isDetectingLocation}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isDetectingLocation ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span className="hidden md:inline">Detecting...</span>
        </>
      ) : (
        <>
          <MapPin className="h-4 w-4" />
          <span className="hidden md:inline">Use Current Location</span>
        </>
      )}
    </Button>
  );
}
