import { Card, CardContent } from "@/components/ui/card";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, MapPin, Thermometer, Droplets, Gauge, Eye, Navigation } from "lucide-react";
import { WeatherData } from "@/lib/weather/server-weather-service";

function getWeatherIcon(weatherMain: string, size: "sm" | "md" | "lg" = "md") {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

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
    
    default:
      return <Sun className={`${sizeClasses[size]} text-yellow-500`} />;
  }
}

function getWeatherDescription(weatherMain: string, description: string) {
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
}

interface ServerWeatherDisplayProps {
  weatherData: WeatherData;
}

export function ServerWeatherDisplay({ weatherData }: ServerWeatherDisplayProps) {
  // Add defensive checks for weather data
  if (!weatherData || !weatherData.main) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Weather data not available</p>
      </div>
    );
  }

  const temp = Math.round(weatherData.main.temp);
  const feelsLike = Math.round(weatherData.main.feels_like);
  const weatherMain = weatherData.weather[0]?.main || "Clear";
  const currentTime = new Date();

  return (
    <div className="space-y-6">
      {/* Main Weather Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Current Weather */}
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            {/* Location Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-lg font-semibold text-gray-800">
                    {weatherData.name}, {weatherData.sys.country}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              </div>
            </div>

            {/* Current Weather Display */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                {getWeatherIcon(weatherMain, "lg")}
                <div className="text-7xl font-bold text-gray-800 ml-4">{temp}°</div>
              </div>
              <div className="text-xl text-gray-600 capitalize mb-2">
                {getWeatherDescription(weatherMain, weatherData.weather[0]?.description || "")}
              </div>
              <div className="text-sm text-gray-500">
                Feels like {feelsLike}°
              </div>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Wind className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Wind</p>
                  <p className="text-sm font-semibold">{weatherData.forecast?.list[0]?.wind?.speed || 0} m/s SE</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Gauge className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Pressure</p>
                  <p className="text-sm font-semibold">{weatherData.main.pressure} hPa</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Droplets className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Humidity</p>
                  <p className="text-sm font-semibold">{weatherData.main.humidity}%</p>
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
          </CardContent>
        </Card>

        {/* Right Column - Forecast Preview */}
        <Card className="bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">5-Day Forecast</h3>
            {weatherData.forecast?.list ? (
              <div className="space-y-3">
                {weatherData.forecast.list
                  .filter((_, index) => index % 8 === 0) // Get one reading per day
                  .slice(0, 5) // Show 5 days
                  .map((forecast, index) => {
                    const date = new Date(forecast.dt * 1000);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const temp = Math.round(forecast.main.temp);
                    const weatherMain = forecast.weather[0]?.main || "Clear";
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-gray-600 w-12">{dayName}</div>
                          {getWeatherIcon(weatherMain, "sm")}
                          <div className="text-sm text-gray-600 capitalize">
                            {forecast.weather[0]?.description}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-800">
                          {temp}°
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Forecast data not available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weather Tips */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Weather Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Check the forecast before planning outdoor activities</li>
            <li>• Stay hydrated during hot weather</li>
            <li>• Dress appropriately for the conditions</li>
            <li>• Keep an eye on weather alerts</li>
          </ul>
        </div>
        
        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Location Info</h3>
          <p className="text-sm text-green-800">
            Your weather location is determined by your timezone setting in your profile. 
            Update your timezone in Settings to change your weather location.
          </p>
        </div>
        
        <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Data Source</h3>
          <p className="text-sm text-purple-800">
            Weather data is provided by OpenWeatherMap API. 
            Forecast data includes 5-day predictions with 3-hour intervals.
          </p>
        </div>
      </div>
    </div>
  );
}
