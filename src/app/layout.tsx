import type React from "react";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner";

// Initialize queue worker (only on server side)
if (typeof window === "undefined") {
  import("@/lib/queue");
}

export const metadata = {
  title: "MyMetricLog",
  description:
    "Personal wellness and productivity dashboard for daily & weekly insights",
  generator: "v0.dev",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforcing light theme by adding the 'light' class and removing ThemeProvider
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
