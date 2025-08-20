"use client";

import { useState } from "react";
import { Activity, Link, Unlink, Loader2 } from "lucide-react";

interface FitbitConnectProps {
  connected: boolean;
}

export function FitbitConnect({ connected }: FitbitConnectProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);
    window.location.href = "/api/integrations/fitbit/connect";
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/integrations/fitbit/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error disconnecting Fitbit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Activity className="size-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Fitbit Integration</h3>
            <p className="text-sm text-gray-600">
              {connected
                ? "Your Fitbit account is connected and syncing data."
                : "Connect your Fitbit account to start tracking your fitness metrics."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {connected ? (
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Unlink className="size-4" />
              )}
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Link className="size-4" />
              )}
              Connect Fitbit
            </button>
          )}
        </div>
      </div>
      {!connected && (
        <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-800">
            <strong>What you'll get:</strong> Step count, calories burned, heart
            rate, sleep data, distance tracking, and more health metrics from
            your Fitbit device.
          </p>
        </div>
      )}
    </div>
  );
}
