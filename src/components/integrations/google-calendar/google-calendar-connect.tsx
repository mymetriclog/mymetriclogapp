import { Calendar, CalendarCheck, CalendarX, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleCalendarConnectProps {
  connected: boolean;
}

export function GoogleCalendarConnect({
  connected,
}: GoogleCalendarConnectProps) {
  const handleConnect = () => {
    window.location.href = "/api/integrations/google-calendar/connect";
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch("/api/integrations/google-calendar/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  if (connected) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CalendarCheck className="size-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Google Calendar Connected
              </h3>
              <p className="text-gray-600">
                Your calendar is syncing and data is being collected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() =>
                window.open("https://calendar.google.com", "_blank")
              }
              className="flex items-center gap-2"
            >
              <ExternalLink className="size-4" />
              Open Calendar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="flex items-center gap-2"
            >
              <CalendarX className="size-4" />
              Disconnect
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Calendar className="size-8 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Connect Google Calendar
            </h3>
            <p className="text-gray-600">
              Connect your Google Calendar to view events, analytics, and
              insights
            </p>
          </div>
        </div>
        <Button
          onClick={handleConnect}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <CalendarCheck className="size-4" />
          Connect Calendar
        </Button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• View upcoming events and calendar analytics</li>
          <li>• Track event patterns and busy periods</li>
          <li>• Integration with wellness reports</li>
          <li>• Secure OAuth connection (read-only access)</li>
        </ul>
      </div>
    </div>
  );
}
