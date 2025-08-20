"use client";

import { useState, useEffect } from "react";
import { GoogleStyleWeather } from "@/components/google-style-weather";
import { WeatherSearch } from "@/components/weather-search";

interface WeatherClientWrapperProps {
  userTimezone?: string;
}

export function WeatherClientWrapper({ userTimezone }: WeatherClientWrapperProps) {
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [currentLocationCoords, setCurrentLocationCoords] = useState<{lat: number, lon: number} | null>(null);
  const [weatherKey, setWeatherKey] = useState(0);
  const [showInteractiveWeather, setShowInteractiveWeather] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showLocationButton, setShowLocationButton] = useState(true);

  // Show interactive weather immediately
  useEffect(() => {
    setShowInteractiveWeather(true);
  }, []);

  const handleLocationSelect = async (location: any) => {
    setIsCustomLocation(true);
    setCurrentLocationCoords({ lat: location.lat, lon: location.lon });
    setShowInteractiveWeather(true); // Switch to interactive mode when user searches
  };

  const handleReturnToCurrentLocation = () => {
    setIsCustomLocation(false);
    setCurrentLocationCoords(null);
    setWeatherKey(Date.now());
    setShowInteractiveWeather(true); // Switch to interactive mode when user uses current location
  };



  // Show interactive weather component
  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 relative z-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Weather</h1>
          <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
            Current conditions and 7-day forecast for your location
          </p>
        </div>
        
        {/* Search Bar */}
        <WeatherSearch 
          onLocationSelect={handleLocationSelect}
          onReturnToCurrentLocation={handleReturnToCurrentLocation}
          isCustomLocation={isCustomLocation}
          currentLocationCoords={currentLocationCoords}
        />
      </div>

      {/* Interactive Google Style Weather */}
      <GoogleStyleWeather 
        key={weatherKey}
        onLocationSelect={handleLocationSelect}
        onReturnToCurrentLocation={handleReturnToCurrentLocation}
        isCustomLocation={isCustomLocation}
        currentLocationCoords={currentLocationCoords}
        userTimezone={userTimezone}
      />
    </div>
  );
}
