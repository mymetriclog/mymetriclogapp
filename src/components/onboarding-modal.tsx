"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimezoneSelect } from "@/components/timezone-select";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "@/app/(dashboard)/settings/actions";
import { useLocation } from "@/hooks/use-location";
import { Sparkles, MapPin, User, Clock } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  initialEmail: string;
  initialFullName?: string;
  initialTimezone?: string;
}

export function OnboardingModal({
  isOpen,
  onComplete,
  initialEmail,
  initialFullName = "",
  initialTimezone = "UTC",
}: OnboardingModalProps) {
  const { toast } = useToast();
  const { detectLocationFromTimezone } = useLocation();
  const [isPending, setIsPending] = useState(false);
  const [fullName, setFullName] = useState(initialFullName);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [detectedTimezone, setDetectedTimezone] = useState<string>("");
  const [isDetectingTimezone, setIsDetectingTimezone] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [selectedTimezoneTime, setSelectedTimezoneTime] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [isUpdatingWeather, setIsUpdatingWeather] = useState(false);

  // Auto-detect user's timezone on component mount
  useEffect(() => {
    const detectUserTimezone = async () => {
      setIsDetectingTimezone(true);
      try {
        // Method 1: Try to get timezone from browser
        let browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Method 2: If browser timezone is UTC, try to detect from current time offset
        if (browserTimezone === "UTC" || !browserTimezone) {
          const now = new Date();
          const utcOffset = now.getTimezoneOffset();
          const hoursOffset = Math.abs(utcOffset) / 60;

          // Map common UTC offsets to timezones
          const offsetToTimezone: Record<number, string> = {
            5: "Asia/Karachi", // Pakistan
            5.5: "Asia/Kolkata", // India
            4: "Asia/Dubai", // UAE
            8: "Asia/Shanghai", // China
            9: "Asia/Tokyo", // Japan
            1: "Europe/Paris", // France
            0: "Europe/London", // UK
            [-5]: "America/New_York", // US East
            [-8]: "America/Los_Angeles", // US West
            [-6]: "America/Chicago", // US Central
            [-7]: "America/Denver", // US Mountain
          };

          const detectedTz =
            offsetToTimezone[utcOffset > 0 ? -hoursOffset : hoursOffset];
          if (detectedTz) {
            browserTimezone = detectedTz;
          }
        }

        // Method 3: If still UTC, try to get from IP geolocation
        if (browserTimezone === "UTC" || !browserTimezone) {
          try {
            const response = await fetch("https://ipapi.co/json/");
            if (response.ok) {
              const data = await response.json();
              const timezone = data.timezone;

              if (timezone && timezone !== "UTC") {
                browserTimezone = timezone;
              } else if (data.country_code) {
                // Map country codes to timezones
                const countryToTimezone: Record<string, string> = {
                  PK: "Asia/Karachi", // Pakistan
                  IN: "Asia/Kolkata", // India
                  AE: "Asia/Dubai", // UAE
                  CN: "Asia/Shanghai", // China
                  JP: "Asia/Tokyo", // Japan
                  FR: "Europe/Paris", // France
                  GB: "Europe/London", // UK
                  DE: "Europe/Berlin", // Germany
                  US: "America/New_York", // US
                  CA: "America/Toronto", // Canada
                  AU: "Australia/Sydney", // Australia
                };

                const detectedTz = countryToTimezone[data.country_code];
                if (detectedTz) {
                  browserTimezone = detectedTz;
                }
              }
            }
          } catch (error) {
            // console.log("⚠️ Could not detect timezone from IP:", error);
          }
        }

        // Set the detected timezone
        if (browserTimezone && browserTimezone !== "UTC") {
          setDetectedTimezone(browserTimezone);
          setTimezone(browserTimezone);
          // console.log("✅ Auto-detected timezone:", browserTimezone);
        } else {
          // console.log("⚠️ Could not auto-detect timezone, using UTC");
        }
      } catch (error) {
        // console.log("❌ Error detecting timezone:", error);
      } finally {
        setIsDetectingTimezone(false);
      }
    };

    // Only detect if user hasn't set a timezone or if it's UTC
    if (initialTimezone === "UTC" || !initialTimezone) {
      detectUserTimezone();
    }
  }, [initialTimezone]);

  // Client-side effect to handle time updates
  useEffect(() => {
    setIsClient(true);

    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update selected timezone time when timezone changes
  useEffect(() => {
    if (timezone && timezone !== "UTC") {
      const updateSelectedTime = () => {
        try {
          const time = new Date().toLocaleTimeString('en-US', {
            timeZone: timezone,
            hour12: true,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
          });
          setSelectedTimezoneTime(time);
        } catch (error) {
          // console.log('Error getting time for timezone:', timezone);
          setSelectedTimezoneTime('Unable to get time');
        }
      };

      updateSelectedTime();
      const interval = setInterval(updateSelectedTime, 1000);
      return () => clearInterval(interval);
    } else {
      setSelectedTimezoneTime('');
    }
  }, [timezone]);

  // Update weather data when timezone changes (for preview)
  useEffect(() => {
    if (timezone && timezone !== "UTC") {
      setIsUpdatingWeather(true);
      
      // First get location from timezone, then fetch weather data
      detectLocationFromTimezone(timezone)
        .then(async () => {
          // Get the location that was just set
          const savedLocation = localStorage.getItem("userLocation");
          if (savedLocation) {
            const locationData = JSON.parse(savedLocation);
            // console.log('📍 Location set from timezone:', locationData);
            
            // Fetch weather data for this location
            const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
            if (API_KEY) {
              try {
                // Fetch current weather
                const currentResponse = await fetch(
                  `https://api.openweathermap.org/data/2.5/weather?lat=${locationData.lat}&lon=${locationData.lon}&units=metric&appid=${API_KEY}`
                );
                
                if (currentResponse.ok) {
                  const currentWeatherData = await currentResponse.json();
                  
                  // Fetch forecast
                  const forecastResponse = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${locationData.lat}&lon=${locationData.lon}&units=metric&appid=${API_KEY}`
                  );
                  
                  let forecastData = null;
                  if (forecastResponse.ok) {
                    forecastData = await forecastResponse.json();
                  }
                  
                  const combinedWeatherData = {
                    ...currentWeatherData,
                    forecast: forecastData
                  };
                  
                  // Save weather data to localStorage
                  localStorage.setItem("weatherData", JSON.stringify(combinedWeatherData));
                  localStorage.setItem("weatherDataUpdated", Date.now().toString());
                  
                  // Trigger update event for dashboard components
                  const event = new CustomEvent('weatherDataUpdated', {
                    detail: { weatherData: combinedWeatherData }
                  });
                  window.dispatchEvent(event);
                  
                  // console.log('✅ Weather data fetched and saved for timezone:', timezone);
                }
              } catch (error) {
                // console.log('❌ Error fetching weather data:', error);
              }
            }
          }
        })
        .catch((error) => {
          // console.log('Error updating weather for timezone:', error);
        })
        .finally(() => {
          setIsUpdatingWeather(false);
        });
    }
  }, [timezone, detectLocationFromTimezone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      // Create FormData for the profile update
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("timezone", timezone);
      formData.append("zip", ""); // Empty zip for now

      const result = await updateProfile(formData);
      
                     if (result.success) {
          // Update location and fetch weather data
          await detectLocationFromTimezone(timezone);

         // Force a weather data update event
         const event = new CustomEvent('weatherDataUpdated', {
           detail: { timezone: timezone }
         });
         window.dispatchEvent(event);

         toast({
           title: "🎉 Welcome to MatricLog!",
           description: "Your profile has been set up successfully. We've configured your weather location based on your timezone.",
         });

                 // Mark onboarding as complete in localStorage
        localStorage.setItem('onboardingCompleted', 'true');
        
        // Close the modal
        onComplete();
      } else {
        toast({
          title: "❌ Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleSkip = async () => {
    // Mark onboarding as complete in localStorage
    localStorage.setItem('onboardingCompleted', 'true');
    // console.log('✅ Onboarding status saved to localStorage');
    
    // Show current location weather data when skipping
    const detectCurrentLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              // console.log('📍 Current location detected:', { latitude, longitude });
              
              // Save current location coordinates
              localStorage.setItem("currentLocationCoords", JSON.stringify({ lat: latitude, lon: longitude }));
              
              // Fetch weather data for current location
              const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
              if (API_KEY) {
                const currentResponse = await fetch(
                  `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
                );
                
                if (currentResponse.ok) {
                  const currentWeatherData = await currentResponse.json();
                  
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
                  
                  // Save weather data
                  localStorage.setItem("weatherData", JSON.stringify(combinedWeatherData));
                  localStorage.setItem("weatherDataUpdated", Date.now().toString());
                  
                  // Trigger update events
                  const event = new CustomEvent('weatherDataUpdated', {
                    detail: { weatherData: combinedWeatherData }
                  });
                  window.dispatchEvent(event);
                  
                  // console.log('✅ Weather data saved for current location:', currentWeatherData.name);
                }
              }
            },
            (error) => {
              // console.log('❌ Error getting current location:', error);
            }
          );
        }
      } catch (error) {
        // console.log('❌ Error in current location detection:', error);
      }
    };
    
    detectCurrentLocation();
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
                 <DialogHeader className="text-center">
           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600">
             <Sparkles className="h-8 w-8 text-white" />
           </div>
           <DialogTitle className="text-2xl font-bold text-center pb-8 pt-5">Onboarding MatricLog! 🎉</DialogTitle>
           <DialogTitle className="text-2xl font-medium">Welcome <span className="text-gray-800 font-bold">{initialFullName || "Not set"}!!</span></DialogTitle>
         
           
                       {/* User Info Display */}
           
            
              
                  {/* <span className="text-gray-800">{initialEmail}</span> */}
             
         </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Section */}

          {/* Timezone Section */}
          <div className="space-y-3">
                         {/* Current timezone info */}
             <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
               <p className="text-xs text-emerald-700">
                 🕐 <strong>Your current timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone} 
               </p>
               <p className="text-xs text-emerald-600 mt-1">
                 Local time: {isClient ? currentTime : "Loading..."}
               </p>
              
              
                               {selectedTimezoneTime && timezone !== "UTC" && (
                  <p className="text-xs text-blue-600 mt-1">
                    🎯 <strong>Selected timezone time:</strong> {selectedTimezoneTime} ({timezone})
                  </p>
                )}
                {isUpdatingWeather && (
                  <p className="text-xs text-orange-600 mt-1">
                    🔄 <strong>Updating weather data...</strong>
                  </p>
                )}
             </div>

            {/* Auto-detection status */}
            {isDetectingTimezone && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-600">
                  Detecting your timezone...
                </span>
              </div>
            )}

            {detectedTimezone && initialTimezone === "UTC" && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  🌍 <strong>Auto-detected:</strong> {detectedTimezone}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  We detected your timezone automatically. You can change it below if needed.
                </p>
              </div>
            )}

            <TimezoneSelect value={timezone} onChange={setTimezone} />

          </div>

          {/* Benefits Section */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg">
            <h4 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              What you'll get:
            </h4>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>• 🌤️ Personalized weather data for your location</li>
              <li>• 📊 Accurate time-based analytics and reports</li>
              <li>• 🎯 Tailored insights and recommendations</li>
              <li>• ⚡ Faster, more relevant dashboard experience</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={isPending || !fullName.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-600/90"
            >
              {isPending ? "Setting up..." : "Complete Setup"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
