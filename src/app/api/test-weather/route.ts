import { NextRequest, NextResponse } from "next/server";
import { WeatherService } from "@/lib/weather/weather-service";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 [Test Weather] Starting weather service test");

    // Check environment variables
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    console.log(
      "🌤️ [Test Weather] API Key status:",
      apiKey ? "Present" : "Missing"
    );

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "OpenWeather API key not found",
        message:
          "Please set NEXT_PUBLIC_OPENWEATHER_API_KEY in your environment variables",
      });
    }

    // Test weather service
    const weatherService = new WeatherService();
    const testDate = new Date();
    const weatherData = await weatherService.getDailyData(
      40.7128,
      -74.006,
      "UTC",
      testDate
    );

    console.log("🌤️ [Test Weather] Weather data received:", weatherData);

    return NextResponse.json({
      success: true,
      message: "Weather service test completed",
      weatherData: {
        summary: weatherData.summary,
        current: weatherData.current,
        hasHourlyData: weatherData.hourly.length > 0,
        hasYesterdayData: !!weatherData.yesterday,
        hasInsights: !!weatherData.insights,
      },
    });
  } catch (error) {
    console.error("❌ [Test Weather] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Weather service test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
