import { getServerSession } from "@/lib/supabase/server";
import { getInitialWeatherData } from "@/lib/weather/server-weather-service";
import { WeatherClientWrapper } from "@/components/weather-client-wrapper";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function WeathersPage() {
  const session = await getServerSession();
  const userTimezone = session?.user?.user_metadata?.timezone || "UTC";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-0 space-y-6">
      
      
        <WeatherClientWrapper 
          userTimezone={userTimezone}
        />
      </div>
    </div>
  );
}
