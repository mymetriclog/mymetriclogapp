import { Activity, CheckCircle, XCircle } from "lucide-react";

interface FitbitHeaderProps {
  connected: boolean;
}

export function FitbitHeader({ connected }: FitbitHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
            <Activity className="size-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fitbit</h1>
            <p className="text-gray-600">
              Connect your Fitbit account to track fitness, health metrics, and
              activity data.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full border border-green-200">
              <CheckCircle className="size-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Connected
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
              <XCircle className="size-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Not connected
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
