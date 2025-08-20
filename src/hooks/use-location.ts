"use client";

import { useState, useEffect, useCallback } from "react";

interface Location {
  lat: number;
  lon: number;
  city: string;
  country: string;
}

interface UseLocationReturn {
  location: Location;
  loading: boolean;
  error: string | null;
  detectLocationFromTimezone: (timezone?: string) => Promise<void>;
  setCustomLocation: (city: string) => Promise<void>;
}

// Timezone to location mapping for common timezones
const TIMEZONE_LOCATIONS: Record<string, Location> = {
  "UTC": { lat: 51.5074, lon: -0.1278, city: "London", country: "GB" },
  "America/New_York": { lat: 40.7128, lon: -74.0060, city: "New York", country: "US" },
  "America/Chicago": { lat: 41.8781, lon: -87.6298, city: "Chicago", country: "US" },
  "America/Denver": { lat: 39.7392, lon: -104.9903, city: "Denver", country: "US" },
  "America/Los_Angeles": { lat: 34.0522, lon: -118.2437, city: "Los Angeles", country: "US" },
  "America/Toronto": { lat: 43.6532, lon: -79.3832, city: "Toronto", country: "CA" },
  "Europe/London": { lat: 51.5074, lon: -0.1278, city: "London", country: "GB" },
  "Europe/Paris": { lat: 48.8566, lon: 2.3522, city: "Paris", country: "FR" },
  "Europe/Berlin": { lat: 52.5200, lon: 13.4050, city: "Berlin", country: "DE" },
  "Europe/Rome": { lat: 41.9028, lon: 12.4964, city: "Rome", country: "IT" },
  "Europe/Madrid": { lat: 40.4168, lon: -3.7038, city: "Madrid", country: "ES" },
  "Asia/Singapore": { lat: 1.3521, lon: 103.8198, city: "Singapore", country: "SG" },
  "Asia/Tokyo": { lat: 35.6762, lon: 139.6503, city: "Tokyo", country: "JP" },
  "Asia/Shanghai": { lat: 31.2304, lon: 121.4737, city: "Shanghai", country: "CN" },
  "Asia/Dubai": { lat: 25.2048, lon: 55.2708, city: "Dubai", country: "AE" },
  "Asia/Kolkata": { lat: 28.6139, lon: 77.2090, city: "Mumbai", country: "IN" },
  "Australia/Sydney": { lat: -33.8688, lon: 151.2093, city: "Sydney", country: "AU" },
  "Pacific/Auckland": { lat: -36.8485, lon: 174.7633, city: "Auckland", country: "NZ" },
};

const DEFAULT_LOCATION: Location = {
  lat: 51.5074,
  lon: -0.1278,
  city: "London",
  country: "GB"
};

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      try {
        setLocation(JSON.parse(savedLocation));
      } catch (err) {
        console.error("Failed to parse saved location:", err);
      }
    }
    setLoading(false);
  }, []);

  // Save location to localStorage whenever it changes
  useEffect(() => {
    if (location) {
      localStorage.setItem("userLocation", JSON.stringify(location));
    }
  }, [location]);

  const detectLocationFromTimezone = useCallback(async (timezone?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Use provided timezone or fall back to browser timezone
      const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Check if we have a mapping for this timezone
      if (TIMEZONE_LOCATIONS[userTimezone]) {
        const newLocation = TIMEZONE_LOCATIONS[userTimezone];
        setLocation(newLocation);
      } else {
        // Try to get location from timezone using a timezone API
        const response = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(userTimezone.split('/').pop() || '')}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            const newLocation: Location = {
              lat: data[0].lat,
              lon: data[0].lon,
              city: data[0].name,
              country: data[0].country
            };
            setLocation(newLocation);
          } else {
            // Fallback to default location
            setLocation(DEFAULT_LOCATION);
            setError("Could not determine location from timezone. Using default location.");
          }
        } else {
          setLocation(DEFAULT_LOCATION);
          setError("Could not determine location from timezone. Using default location.");
        }
      }
    } catch (err) {
      console.error("Timezone-based location detection failed:", err);
      setError("Failed to detect location from timezone. Using default location.");
      setLocation(DEFAULT_LOCATION);
    } finally {
      setLoading(false);
    }
  }, []);

  const setCustomLocation = useCallback(async (city: string) => {
    setLoading(true);
    setError(null);

    try {
      // Geocode city name to get coordinates
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const newLocation: Location = {
            lat: data[0].lat,
            lon: data[0].lon,
            city: data[0].name,
            country: data[0].country
          };
          setLocation(newLocation);
        } else {
          setError("City not found. Please check the spelling.");
        }
      } else {
        setError("Failed to find city coordinates.");
      }
    } catch (err) {
      console.error("City geocoding failed:", err);
      setError("Failed to set custom location.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    location: location || DEFAULT_LOCATION,
    loading,
    error,
    detectLocationFromTimezone,
    setCustomLocation
  };
}
