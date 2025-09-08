import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, BarChart3 } from "lucide-react";

export function InfoCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <FileText className="size-4 sm:size-5 text-blue-600 flex-shrink-0" />
            <span className="truncate">Email Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Track email volume, response rates, and productivity patterns from
            your Gmail integration.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="size-4 sm:size-5 text-green-600 flex-shrink-0" />
            <span className="truncate">Fitness Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Monitor steps, sleep, heart rate, and activity levels from your
            Fitbit device.
          </p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <BarChart3 className="size-4 sm:size-5 text-yellow-600 flex-shrink-0" />
            <span className="truncate">Music Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Analyze listening patterns, mood indicators, and audio features from
            Spotify.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
