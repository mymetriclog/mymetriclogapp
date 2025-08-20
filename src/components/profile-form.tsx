"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TimezoneSelect } from "@/components/timezone-select";
import {
  updateProfile,
  type UpdateProfileResult,
} from "@/app/(dashboard)/settings/actions";
import { useLocation } from "@/hooks/use-location";
import { toast } from "sonner";

type Props = {
  initialEmail?: string;
  initialFullName?: string;
  initialZip?: string;
  initialTimezone?: string;
};

export function ProfileForm({
  initialEmail = "",
  initialFullName = "",
  initialZip = "",
  initialTimezone = "UTC",
}: Props) {
  const { detectLocationFromTimezone } = useLocation();
  const [isPending, setIsPending] = React.useState(false);
  const [detectedTimezone, setDetectedTimezone] = React.useState<string>("");
  const [isDetectingTimezone, setIsDetectingTimezone] = React.useState(false);
  const [detectedLocation, setDetectedLocation] = React.useState<{
    country: string;
    city: string;
    timezone: string;
  } | null>(null);
  const [currentTime, setCurrentTime] = React.useState<string>("");
  const [isClient, setIsClient] = React.useState(false);

  // Auto-detect user's timezone on component mount
  React.useEffect(() => {
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
            console.log("🕐 Detected timezone from offset:", detectedTz);

            // Store location information based on timezone
            const timezoneToLocation: Record<
              string,
              { country: string; city: string }
            > = {
              "Asia/Karachi": { country: "Pakistan", city: "Karachi" },
              "Asia/Kolkata": { country: "India", city: "Mumbai" },
              "Asia/Dubai": { country: "UAE", city: "Dubai" },
              "Asia/Shanghai": { country: "China", city: "Shanghai" },
              "Asia/Tokyo": { country: "Japan", city: "Tokyo" },
              "Europe/Paris": { country: "France", city: "Paris" },
              "Europe/London": { country: "UK", city: "London" },
              "America/New_York": { country: "USA", city: "New York" },
              "America/Los_Angeles": { country: "USA", city: "Los Angeles" },
              "America/Chicago": { country: "USA", city: "Chicago" },
              "America/Denver": { country: "USA", city: "Denver" },
            };

            const location = timezoneToLocation[detectedTz];
            if (location) {
              setDetectedLocation({
                country: location.country,
                city: location.city,
                timezone: detectedTz,
              });
            }
          }
        }

        // Method 3: If still UTC, try to get from IP geolocation
        if (browserTimezone === "UTC" || !browserTimezone) {
          try {
            const response = await fetch("https://ipapi.co/json/");
            if (response.ok) {
              const data = await response.json();
              const countryCode = data.country_code;
              const timezone = data.timezone;

              if (timezone && timezone !== "UTC") {
                browserTimezone = timezone;
                console.log(
                  "🌍 Detected timezone from IP:",
                  timezone,
                  "Country:",
                  data.country_name
                );

                // Store location information
                setDetectedLocation({
                  country: data.country_name || "Unknown",
                  city: data.city || "Unknown",
                  timezone: timezone,
                });
              } else if (countryCode) {
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

                const detectedTz = countryToTimezone[countryCode];
                if (detectedTz) {
                  browserTimezone = detectedTz;
                  console.log("🌍 Detected timezone from country:", detectedTz);

                  // Store location information
                  setDetectedLocation({
                    country: data.country_name || "Unknown",
                    city: data.city || "Unknown",
                    timezone: detectedTz,
                  });
                }
              }
            }
          } catch (error) {
            console.log("⚠️ Could not detect timezone from IP:", error);
          }
        }

        // Set the detected timezone
        if (browserTimezone && browserTimezone !== "UTC") {
          setDetectedTimezone(browserTimezone);
          console.log("✅ Auto-detected timezone:", browserTimezone);

          // Auto-save to localStorage
          localStorage.setItem("userTimezone", browserTimezone);

          // Show success message
          toast.success("🌍 Timezone Detected!", {
            description: `We detected your timezone as ${browserTimezone}. You can change this in the dropdown below.`,
            duration: 5000,
          });
        } else {
          console.log("⚠️ Could not auto-detect timezone, using UTC");
        }
      } catch (error) {
        console.log("❌ Error detecting timezone:", error);
      } finally {
        setIsDetectingTimezone(false);
      }
    };

    // Only detect if user hasn't set a timezone or if it's UTC
    if (initialTimezone === "UTC" || !initialTimezone) {
      detectUserTimezone();
    }
  }, [initialTimezone, toast]);

  // Client-side effect to handle time updates and prevent hydration issues
  React.useEffect(() => {
    setIsClient(true);

    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };

    // Update time immediately
    updateTime();

    // Update time every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Helper function to get current timezone offset
  const getCurrentTimezoneOffset = () => {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset();
    const hoursOffset = Math.abs(utcOffset) / 60;
    const sign = utcOffset > 0 ? "-" : "+";
    return `UTC${sign}${hoursOffset}`;
  };

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    
    // Show loading toast
    const loadingToast = toast.loading("Saving your changes...", {
      description: "Please wait while we update your profile and weather settings.",
    });
    
    try {
      // If user has a detected timezone but hasn't manually selected one, use the detected one
      const timezone = formData.get("timezone") as string;
      const finalTimezone =
        timezone === "UTC" && detectedTimezone ? detectedTimezone : timezone;

      // Update the form data with the final timezone
      if (finalTimezone !== timezone) {
        formData.set("timezone", finalTimezone);
      }

      const result = await updateProfile(formData);
      if (result.success) {
        // Get the timezone and postal code from form data
        const postalCode = formData.get("zip") as string;

        console.log("=== Profile Save Results ===");
        console.log("Timezone:", finalTimezone);
        console.log("Postal Code:", postalCode);

        if (finalTimezone) {
          // Save timezone to localStorage for future use
          localStorage.setItem("userTimezone", finalTimezone);

          // Update location and fetch weather data
          await detectLocationFromTimezone(finalTimezone);

          // Fetch and log weather data
          await fetchAndLogWeatherData(finalTimezone, postalCode);

          toast.success("✅ Profile Updated Successfully!", {
            description: `Your profile and weather location have been updated based on your timezone (${finalTimezone}).`,
          });
        } else {
          toast.success("✅ Profile Updated Successfully!", {
            description: "Your profile has been updated successfully.",
          });
        }
      } else {
        toast.error("❌ Error", {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error("❌ Error", {
        description: "An unexpected error occurred",
      });
            } finally {
          // Dismiss loading toast
          toast.dismiss(loadingToast);
          setIsPending(false);
        }
  };

  // Function to fetch and log weather data
  const fetchAndLogWeatherData = async (
    timezone: string,
    postalCode?: string
  ) => {
    try {
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

      if (!API_KEY) {
        console.log("❌ No API key available for weather data");
        return;
      }

      // Get location from timezone mapping
      const TIMEZONE_LOCATIONS: Record<
        string,
        { lat: number; lon: number; city: string; country: string }
      > = {
        UTC: { lat: 51.5074, lon: -0.1278, city: "London", country: "GB" },
        "America/New_York": {
          lat: 40.7128,
          lon: -74.006,
          city: "New York",
          country: "US",
        },
        "America/Chicago": {
          lat: 41.8781,
          lon: -87.6298,
          city: "Chicago",
          country: "US",
        },
        "America/Denver": {
          lat: 39.7392,
          lon: -104.9903,
          city: "Denver",
          country: "US",
        },
        "America/Los_Angeles": {
          lat: 34.0522,
          lon: -118.2437,
          city: "Los Angeles",
          country: "US",
        },
        "America/Toronto": {
          lat: 43.6532,
          lon: -79.3832,
          city: "Toronto",
          country: "CA",
        },
        "Europe/London": {
          lat: 51.5074,
          lon: -0.1278,
          city: "London",
          country: "GB",
        },
        "Europe/Paris": {
          lat: 48.8566,
          lon: 2.3522,
          city: "Paris",
          country: "FR",
        },
        "Europe/Berlin": {
          lat: 52.52,
          lon: 13.405,
          city: "Berlin",
          country: "DE",
        },
        "Europe/Rome": {
          lat: 41.9028,
          lon: 12.4964,
          city: "Rome",
          country: "IT",
        },
        "Europe/Madrid": {
          lat: 40.4168,
          lon: -3.7038,
          city: "Madrid",
          country: "ES",
        },
        "Asia/Karachi": {
          lat: 24.8607,
          lon: 67.0011,
          city: "Karachi",
          country: "PK",
        }, // Pakistan
        "Asia/Kolkata": {
          lat: 28.6139,
          lon: 77.209,
          city: "Mumbai",
          country: "IN",
        },
        "Asia/Dubai": {
          lat: 25.2048,
          lon: 55.2708,
          city: "Dubai",
          country: "AE",
        },
        "Asia/Singapore": {
          lat: 1.3521,
          lon: 103.8198,
          city: "Singapore",
          country: "SG",
        },
        "Asia/Tokyo": {
          lat: 35.6762,
          lon: 139.6503,
          city: "Tokyo",
          country: "JP",
        },
        "Asia/Shanghai": {
          lat: 31.2304,
          lon: 121.4737,
          city: "Shanghai",
          country: "CN",
        },
        "Australia/Sydney": {
          lat: -33.8688,
          lon: 151.2093,
          city: "Sydney",
          country: "AU",
        },
        "Pacific/Auckland": {
          lat: -36.8485,
          lon: 174.7633,
          city: "Auckland",
          country: "NZ",
        },
      };

      const location = TIMEZONE_LOCATIONS[timezone];

      if (!location) {
        console.log("❌ No location mapping found for timezone:", timezone);
        return;
      }

      console.log("📍 Location from timezone:", location);

      // Fetch current weather data
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${API_KEY}`
      );

      if (currentResponse.ok) {
        const currentWeatherData = await currentResponse.json();
        console.log(
          "🌤️ Current Weather Data for",
          location.city + ":",
          currentWeatherData
        );

        // Fetch hourly forecast data
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${API_KEY}`
        );

        let forecastData = null;
        if (forecastResponse.ok) {
          forecastData = await forecastResponse.json();
          console.log(
            "📅 Hourly Forecast Data for",
            location.city + ":",
            forecastData
          );
        }

        // Combine current weather and forecast data
        const combinedWeatherData = {
          ...currentWeatherData,
          forecast: forecastData,
        };

        // Log key weather information
        console.log("📊 Weather Summary:");
        console.log("  Temperature:", combinedWeatherData.main?.temp + "°C");
        console.log(
          "  Feels like:",
          combinedWeatherData.main?.feels_like + "°C"
        );
        console.log("  Humidity:", combinedWeatherData.main?.humidity + "%");
        console.log(
          "  Description:",
          combinedWeatherData.weather?.[0]?.description
        );
        console.log("  City:", combinedWeatherData.name);
        console.log("  Country:", combinedWeatherData.sys?.country);
        console.log("  Has Forecast:", !!forecastData);

        if (postalCode) {
          console.log("📮 Postal Code provided:", postalCode);
        }

        // Save weather data to localStorage so weather card can use it
        localStorage.setItem(
          "weatherData",
          JSON.stringify(combinedWeatherData)
        );
        localStorage.setItem("weatherLocation", JSON.stringify(location));

        console.log("📡 Dispatching weather update event...");

        // Trigger a custom event to notify weather card
        const event = new CustomEvent("weatherDataUpdated", {
          detail: { weatherData: combinedWeatherData, location },
        });
        window.dispatchEvent(event);

        // Also trigger a storage event for cross-tab communication
        const storageEvent = new StorageEvent("storage", {
          key: "weatherData",
          newValue: JSON.stringify(combinedWeatherData),
          oldValue: null,
          storageArea: localStorage,
        });
        window.dispatchEvent(storageEvent);

        // Set a flag to indicate weather data was just updated
        localStorage.setItem("weatherDataUpdated", Date.now().toString());

        console.log("📡 Weather update events dispatched successfully");
      } else {
        console.log(
          "❌ Weather API Error:",
          currentResponse.status,
          currentResponse.statusText
        );
        const errorText = await currentResponse.text();
        console.log("Error details:", errorText);
      }
    } catch (error) {
      console.log("❌ Error fetching weather data:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={initialEmail} readOnly aria-readonly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={initialFullName}
              placeholder="Your name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="zip">Zip / Postal Code</Label>
            <Input
              id="zip"
              name="zip"
              defaultValue={initialZip}
              placeholder="e.g., 98101"
            />
          </div>
          <div className="grid gap-2">
            <Label>Timezone</Label>

            {/* Current timezone info */}
            <div className="p-2 bg-gray-50 border border-gray-200 rounded">
              <p className="text-xs text-gray-600">
                🕐 <strong>Your current timezone:</strong>{" "}
                {getCurrentTimezoneOffset()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Local time: {isClient ? currentTime : "Loading..."}
              </p>
              {detectedLocation && (
                <p className="text-xs text-gray-600 mt-1">
                  📍 <strong>Detected location:</strong> {detectedLocation.city}
                  , {detectedLocation.country}
                </p>
              )}
            </div>

            {/* Auto-detection status */}
            {isDetectingTimezone && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-600">
                  Detecting your timezone...
                </span>
              </div>
            )}

            {detectedTimezone && initialTimezone === "UTC" && (
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-700">
                  🌍 <strong>Auto-detected:</strong> {detectedTimezone}
                  {detectedLocation && (
                    <span className="text-green-600">
                      {" "}
                      for {detectedLocation.city}, {detectedLocation.country}
                    </span>
                  )}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  We detected your timezone automatically. Select it from the
                  dropdown below.
                </p>
              </div>
            )}

            {/* Keep TimezoneSelect as a controlled input bridge via hidden input */}
            <TimezoneWithHidden
              name="timezone"
              defaultValue={detectedTimezone || initialTimezone}
            />

            {/* Manual detection button */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetectedTimezone("");
                  setIsDetectingTimezone(true);
                  // Re-run detection
                  const detectUserTimezone = async () => {
                    try {
                      let browserTimezone =
                        Intl.DateTimeFormat().resolvedOptions().timeZone;

                      if (browserTimezone === "UTC" || !browserTimezone) {
                        const now = new Date();
                        const utcOffset = now.getTimezoneOffset();
                        const hoursOffset = Math.abs(utcOffset) / 60;

                        const offsetToTimezone: Record<number, string> = {
                          5: "Asia/Karachi",
                          5.5: "Asia/Kolkata",
                          4: "Asia/Dubai",
                          8: "Asia/Shanghai",
                          9: "Asia/Tokyo",
                          1: "Europe/Paris",
                          0: "Europe/London",
                          [-5]: "America/New_York",
                          [-8]: "America/Los_Angeles",
                          [-6]: "America/Chicago",
                          [-7]: "America/Denver",
                        };

                        const detectedTz =
                          offsetToTimezone[
                            utcOffset > 0 ? -hoursOffset : hoursOffset
                          ];
                        if (detectedTz) {
                          browserTimezone = detectedTz;
                        }
                      }

                      if (browserTimezone && browserTimezone !== "UTC") {
                        setDetectedTimezone(browserTimezone);
                        localStorage.setItem("userTimezone", browserTimezone);
                        toast.success("🌍 Timezone Detected!", {
                          description: `Detected: ${browserTimezone}`,
                          duration: 3000,
                        });
                      } else {
                        toast.error("⚠️ Detection Failed", {
                          description:
                            "Could not auto-detect timezone. Please select manually.",
                          duration: 3000,
                        });
                      }
                    } catch (error) {
                      toast.error("❌ Error", {
                        description: "Failed to detect timezone",
                        duration: 3000,
                      });
                    } finally {
                      setIsDetectingTimezone(false);
                    }
                  };
                  detectUserTimezone();
                }}
                disabled={isDetectingTimezone}
                className="text-xs"
              >
                {isDetectingTimezone
                  ? "Detecting..."
                  : "🔍 Auto-detect Timezone"}
              </Button>

              <span className="text-xs text-muted-foreground">
                Click to automatically detect your timezone
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Your timezone setting determines your weather location on the
              dashboard
            </p>
          </div>

          <CardFooter className="px-0">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-600/90"
            >
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

function TimezoneWithHidden({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const [value, setValue] = React.useState(defaultValue);
  const { detectLocationFromTimezone } = useLocation();

  // Update value when defaultValue changes (e.g., when timezone is detected)
  React.useEffect(() => {
    if (defaultValue && defaultValue !== "UTC") {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  const handleTimezoneChange = (newTimezone: string) => {
    setValue(newTimezone);
    console.log("🔄 Timezone changed to:", newTimezone);

    // Save timezone to localStorage
    localStorage.setItem("userTimezone", newTimezone);

    // Automatically update location when timezone changes
    detectLocationFromTimezone(newTimezone).catch(() => {
      console.log("Failed to update location from timezone change");
    });
  };

  return (
    <>
      <TimezoneSelect value={value} onChange={handleTimezoneChange} />
      <input type="hidden" name={name} value={value} />
    </>
  );
}
