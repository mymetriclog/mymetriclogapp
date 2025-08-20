export type ReportItem = {
  id: string;
  date: string;
  kind: "daily" | "weekly";
  score: number;
  html: string;
  json: Record<string, unknown>;
};

export const mockReports: ReportItem[] = [
  {
    id: "r-2025-08-08-d",
    date: "2025-08-08",
    kind: "daily",
    score: 82,
    html: "<div><strong>Sleep:</strong> 7h 32m • <strong>HRV:</strong> 62 ms • <strong>Steps:</strong> 10,432<br/><em>Mood:</em> Positive • <em>Recovery:</em> Good</div>",
    json: {
      sleep: 7.53,
      hrv: 62,
      steps: 10432,
      mood: "positive",
      recovery: "good",
    },
  },
  {
    id: "r-2025-08-07-d",
    date: "2025-08-07",
    kind: "daily",
    score: 74,
    html: "<div><strong>Sleep:</strong> 6h 45m • <strong>HRV:</strong> 56 ms • <strong>Steps:</strong> 8,112<br/><em>Mood:</em> Neutral • <em>Recovery:</em> Moderate</div>",
    json: {
      sleep: 6.75,
      hrv: 56,
      steps: 8112,
      mood: "neutral",
      recovery: "moderate",
    },
  },
  {
    id: "r-2025-w32",
    date: "2025-W32",
    kind: "weekly",
    score: 78,
    html: "<div><strong>Weekly Summary:</strong> Avg Sleep 7h 05m • Avg HRV 60 ms • Avg Steps 9,450<br/><em>Trend:</em> ↑ HRV • ↔ Sleep • ↑ Steps</div>",
    json: {
      weekly: true,
      avgSleep: 7.08,
      avgHrv: 60,
      avgSteps: 9450,
      trend: { hrv: "up", sleep: "flat", steps: "up" },
    },
  },
  {
    id: "r-2025-08-06-d",
    date: "2025-08-06",
    kind: "daily",
    score: 71,
    html: "<div><strong>Sleep:</strong> 6h 30m • <strong>HRV:</strong> 54 ms</div>",
    json: { sleep: 6.5, hrv: 54 },
  },
  {
    id: "r-2025-08-05-d",
    date: "2025-08-05",
    kind: "daily",
    score: 84,
    html: "<div><strong>Sleep:</strong> 7h 45m • <strong>HRV:</strong> 64 ms</div>",
    json: { sleep: 7.75, hrv: 64 },
  },
  {
    id: "r-2025-08-04-d",
    date: "2025-08-04",
    kind: "daily",
    score: 76,
    html: "<div><strong>Sleep:</strong> 7h 00m • <strong>HRV:</strong> 58 ms</div>",
    json: { sleep: 7, hrv: 58 },
  },
];

export type IntegrationItem = {
  key: "spotify" | "fitbit" | "tryterra" | "google-calendar" | "gmail";
  name: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  created_at?: string;
  notes?: string;
};

export const mockIntegrations: IntegrationItem[] = [
  {
    key: "gmail",
    name: "Gmail",
    status: "connected",
    lastSync: "30 minutes ago",
    created_at: "2025-08-12 06:59:39",
    notes: "Processing emails and calendar invites",
  },
  {
    key: "google-calendar",
    name: "Google Calendar",
    status: "connected",
    lastSync: "15 minutes ago",
    created_at: "2025-08-12 07:15:22",
    notes: "Tracking events and schedule patterns",
  },
  {
    key: "spotify",
    name: "Spotify",
    status: "connected",
    lastSync: "2 hours ago",
    created_at: "2025-08-11 14:28:41",
  },
  {
    key: "fitbit",
    name: "Fitbit",
    status: "connected",
    lastSync: "2 hours ago",
    created_at: "2025-08-10 09:15:22",
  },
  {
    key: "tryterra",
    name: "TryTerra",
    status: "connected",
    lastSync: "2 hours ago",
    created_at: "2025-08-09 16:42:18",
  },
];
