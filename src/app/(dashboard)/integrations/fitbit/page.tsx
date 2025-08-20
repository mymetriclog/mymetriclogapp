"use client";

import { FitbitHeader } from "@/components/integrations/fitbit/fitbit-header";
import { FitbitConnect } from "@/components/integrations/fitbit/fitbit-connect";
import { useState, useEffect } from "react";
import {
  Activity,
  Heart,
  Bed,
  Footprints,
  Flame,
  Target,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Types for Fitbit data
type FitbitAccount = {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  lastSync: string;
};

type FitbitStats = {
  today: {
    steps: number;
    calories: number;
    distance: number;
    activeMinutes: number;
    heartRate: {
      resting: number;
      current: number;
    };
    sleep: {
      duration: number;
      efficiency: number;
      stages: {
        light: number;
        deep: number;
        rem: number;
        wake: number;
      };
    };
  };
  weekly: {
    steps: number[];
    calories: number[];
    distance: number[];
    activeMinutes: number[];
  };
  goals: {
    steps: number;
    calories: number;
    distance: number;
    activeMinutes: number;
  };
};

type FitbitData = {
  account: FitbitAccount | null;
  stats: FitbitStats;
};

export default function FitbitIntegrationPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [fitbitData, setFitbitData] = useState<FitbitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFitbitData() {
      try {
        setLoading(true);
        setError(null);

        // Check connection status by trying to fetch data
        const dataRes = await fetch("/api/integrations/fitbit/stats");
        if (dataRes.ok) {
          const data = await dataRes.json();
          setFitbitData(data);
          setIsConnected(true);
        } else {
          const errorData = await dataRes.json();
          if (dataRes.status === 400 && errorData.error === "No access token") {
            setIsConnected(false);
          } else {
            setError("fetch_failed");
          }
        }
      } catch (error) {
        setIsConnected(false);
        setError("fetch_failed");
      } finally {
        setLoading(false);
      }
    }

    fetchFitbitData();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {/* Full Page Loading Spinner */}
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="size-12 text-orange-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Loading Fitbit Integration
          </h2>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Please wait while we check your connection status and fetch fitness
            data...
          </p>

          {/* Loading Progress Indicators */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span>Checking connection status...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Verifying Fitbit permissions...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Fetching fitness data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show general error
  if (error === "fetch_failed") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 space-y-6">
          <FitbitHeader connected={true} />
          <FitbitConnect connected={true} />

          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="size-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unable to Fetch Fitbit Data
            </h3>
            <p className="text-gray-600 mb-6">
              We encountered an issue while trying to fetch your Fitbit account
              information.
            </p>

            <div className="space-y-3">
              <button
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                onClick={handleRefresh}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-0 space-y-6">
        {/* Header */}
        <FitbitHeader connected={isConnected} />

        {/* Connect/Disconnect */}
        <FitbitConnect connected={isConnected} />

        {/* Main Content */}
        {fitbitData ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Footprints className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Steps Today</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {fitbitData.stats.today.steps.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      Goal: {fitbitData.stats.goals.steps.toLocaleString()}
                    </span>
                    <span>
                      {Math.round(
                        (fitbitData.stats.today.steps /
                          fitbitData.stats.goals.steps) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (fitbitData.stats.today.steps /
                            fitbitData.stats.goals.steps) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Flame className="size-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Calories Burned</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {fitbitData.stats.today.calories.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      Goal: {fitbitData.stats.goals.calories.toLocaleString()}
                    </span>
                    <span>
                      {Math.round(
                        (fitbitData.stats.today.calories /
                          fitbitData.stats.goals.calories) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (fitbitData.stats.today.calories /
                            fitbitData.stats.goals.calories) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="size-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Distance</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {fitbitData.stats.today.distance.toFixed(2)} km
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Goal: {fitbitData.stats.goals.distance} km</span>
                    <span>
                      {Math.round(
                        (fitbitData.stats.today.distance /
                          fitbitData.stats.goals.distance) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (fitbitData.stats.today.distance /
                            fitbitData.stats.goals.distance) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Heart className="size-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Resting HR</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {fitbitData.stats.today.heartRate.resting} bpm
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-500">
                    <span>Last updated today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Overview */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Target className="size-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Account Overview
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    {fitbitData.account?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Sync</p>
                  <p className="font-medium text-gray-900">
                    {fitbitData.account?.lastSync
                      ? new Date(fitbitData.account.lastSync).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">User ID</p>
                  <p className="font-medium text-gray-900">
                    {fitbitData.account?.userId}
                  </p>
                </div>
              </div>
            </div>

            {/* Sleep Analysis */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Bed className="size-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Sleep Analysis
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600">Total Sleep</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.floor(fitbitData.stats.today.sleep.duration / 60)}h{" "}
                    {fitbitData.stats.today.sleep.duration % 60}m
                  </p>
                  <p className="text-sm text-gray-500">
                    Sleep Efficiency: {fitbitData.stats.today.sleep.efficiency}%
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Light Sleep</span>
                    <span className="text-sm font-medium">
                      {Math.floor(
                        fitbitData.stats.today.sleep.stages.light / 60
                      )}
                      h {fitbitData.stats.today.sleep.stages.light % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Deep Sleep</span>
                    <span className="text-sm font-medium">
                      {Math.floor(
                        fitbitData.stats.today.sleep.stages.deep / 60
                      )}
                      h {fitbitData.stats.today.sleep.stages.deep % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">REM Sleep</span>
                    <span className="text-sm font-medium">
                      {Math.floor(fitbitData.stats.today.sleep.stages.rem / 60)}
                      h {fitbitData.stats.today.sleep.stages.rem % 60}m
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="size-5 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Weekly Progress
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Steps This Week
                  </h4>
                  <div className="space-y-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (day, index) => (
                        <div
                          key={day}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-600">{day}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    ((fitbitData.stats.weekly.steps[index] ||
                                      0) /
                                      fitbitData.stats.goals.steps) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-16 text-right">
                              {fitbitData.stats.weekly.steps[
                                index
                              ]?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Calories This Week
                  </h4>
                  <div className="space-y-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (day, index) => (
                        <div
                          key={day}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-600">{day}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    ((fitbitData.stats.weekly.calories[index] ||
                                      0) /
                                      fitbitData.stats.goals.calories) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-16 text-right">
                              {fitbitData.stats.weekly.calories[
                                index
                              ]?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : isConnected ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="size-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading Fitbit Data
            </h3>
            <p className="text-gray-500">
              Please wait while we fetch your fitness information...
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="size-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Connect Your Fitbit Account
            </h3>
            <p className="text-gray-500 mb-6">
              Connect your Fitbit account to see your fitness analytics and
              health metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
