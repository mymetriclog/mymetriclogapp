"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, Play, Pause, RefreshCw, Headphones } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SpotifyStats {
  tracksPlayed: number;
  topTracks: string[];
  topArtists: string[];
  listeningTime: number;
  mood: string;
  topGenre: string;
  trackAnalysis: any;
}

interface SpotifyMusicCardProps {
  userTimezone?: string;
}

export function SpotifyMusicCard({ userTimezone }: SpotifyMusicCardProps) {
  const [stats, setStats] = useState<SpotifyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpotifyStats();
  }, []);

  const fetchSpotifyStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/integrations/spotify/stats");
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setError(null);
      } else if (response.status === 400) {
        setError("Spotify not connected");
      } else {
        setError("Failed to fetch music data");
      }
    } catch (err) {
      setError("Failed to load music data");
    } finally {
      setLoading(false);
    }
  };

  const getMoodColor = (mood: string) => {
    if (mood?.toLowerCase().includes("positive") || mood?.toLowerCase().includes("happy")) return "text-green-600";
    if (mood?.toLowerCase().includes("energetic") || mood?.toLowerCase().includes("upbeat")) return "text-blue-600";
    if (mood?.toLowerCase().includes("calm") || mood?.toLowerCase().includes("relaxed")) return "text-purple-600";
    if (mood?.toLowerCase().includes("sad") || mood?.toLowerCase().includes("melancholy")) return "text-gray-600";
    return "text-yellow-600";
  };

  const getMoodEmoji = (mood: string) => {
    if (mood?.toLowerCase().includes("positive") || mood?.toLowerCase().includes("happy")) return "😊";
    if (mood?.toLowerCase().includes("energetic") || mood?.toLowerCase().includes("upbeat")) return "⚡";
    if (mood?.toLowerCase().includes("calm") || mood?.toLowerCase().includes("relaxed")) return "😌";
    if (mood?.toLowerCase().includes("sad") || mood?.toLowerCase().includes("melancholy")) return "😢";
    return "🎵";
  };

  const formatListeningTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg">Music</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = "/integrations"}
            >
              Connect Spotify
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">Music</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-600">
            {stats.tracksPlayed} tracks
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.tracksPlayed}
            </div>
            <div className="text-xs text-green-600">Tracks Played</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {formatListeningTime(stats.listeningTime)}
            </div>
            <div className="text-xs text-purple-600">Listening Time</div>
          </div>
        </div>

        {/* Top Track */}
        {stats.topTracks && stats.topTracks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Top Track</h4>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Play className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium truncate">
                {stats.topTracks[0]}
              </span>
            </div>
          </div>
        )}

        {/* Top Artist */}
        {stats.topArtists && stats.topArtists.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Top Artist</h4>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Headphones className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium truncate">
                {stats.topArtists[0]}
              </span>
            </div>
          </div>
        )}

        {/* Mood & Genre */}
        <div className="flex items-center justify-between">
          {stats.mood && stats.mood !== "Unknown" && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getMoodEmoji(stats.mood)}</span>
              <div>
                <div className={`text-sm font-medium ${getMoodColor(stats.mood)}`}>
                  {stats.mood}
                </div>
                <div className="text-xs text-gray-500">Mood</div>
              </div>
            </div>
          )}
          {stats.topGenre && stats.topGenre !== "Unknown" && (
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">
                {stats.topGenre}
              </div>
              <div className="text-xs text-gray-500">Genre</div>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchSpotifyStats}
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Music
        </Button>
      </CardContent>
    </Card>
  );
}
