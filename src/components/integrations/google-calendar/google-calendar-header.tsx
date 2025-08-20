import { Calendar, CalendarCheck, CalendarX } from "lucide-react";

interface GoogleCalendarHeaderProps {
  connected: boolean;
}

export function GoogleCalendarHeader({ connected }: GoogleCalendarHeaderProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-xl ${
            connected ? "bg-green-100" : "bg-gray-100"
          }`}
        >
          {connected ? (
            <CalendarCheck className="size-8 text-green-600" />
          ) : (
            <Calendar className="size-8 text-gray-600" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            Google Calendar Integration
          </h1>
          <p className="text-gray-600">
            {connected
              ? "Your Google Calendar is connected and syncing data"
              : "Connect your Google Calendar to view events and analytics"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm font-medium">Not Connected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
