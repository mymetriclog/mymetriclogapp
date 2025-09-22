"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  Bot,
  Mail,
  Gauge,
  CalendarDays,
  Music2,
} from "lucide-react";

export default function Page() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session) {
          router.replace("/dashboard");
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsChecking(false);
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, [router, supabase.auth]);

  if (isChecking) {
    return null;
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-background dark:to-background">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-120px] h-[320px] w-[640px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-300/25 via-sky-300/25 to-emerald-300/25 blur-3xl" />
        <div className="absolute right-[-120px] bottom-[-120px] h-[260px] w-[260px] rounded-full bg-gradient-to-tr from-fuchsia-300/25 to-rose-300/25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="flex flex-col items-center text-center gap-6">
          <Image
            src="/MyMetricLog.png"
            alt="MyMetricLog"
            width={220}
            height={60}
            priority
          />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
            <Bot className="h-3.5 w-3.5" />
            New: AI mood & energy forecast
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              Your daily wellness and productivity, clarified
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Connect Fitbit, Gmail, Calendar, Spotify, Google Tasks and Weather.
            Get AI‑powered daily and weekly reports delivered to your inbox.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center rounded-md bg-foreground text-background px-5 py-2.5 text-sm font-medium shadow hover:opacity-90 transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-md border border-foreground/20 px-5 py-2.5 text-sm font-medium hover:bg-foreground/5 transition"
            >
              Create account
            </Link>
          </div>

          {/* Integrations strip */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <Badge>Fitbit</Badge>
            <Badge>Gmail</Badge>
            <Badge>Google Calendar</Badge>
            <Badge>Spotify</Badge>
            <Badge>Google Tasks</Badge>
            <Badge>Weather</Badge>
          </div>

          {/* Feature grid */}
          <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            <FeatureCard
              icon={<Mail className="h-4 w-4" />}
              title="Automated reports"
              desc="Daily & weekly summaries, sent automatically."
            />
            <FeatureCard
              icon={<Gauge className="h-4 w-4" />}
              title="Actionable scoring"
              desc="Sleep, Activity, Heart, Work—clear scores with reasons."
            />
            <FeatureCard
              icon={<CalendarDays className="h-4 w-4" />}
              title="Calendar intelligence"
              desc="Focus blocks, meeting load, and balance insights."
            />
          </div>

          {/* Mini reassurance row */}
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> No
              credit card required
            </div>
            <span>•</span>
            <div className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> OAuth
              via Google + Supabase
            </div>
            <span>•</span>
            <div className="inline-flex items-center gap-1">
              <Music2 className="h-3.5 w-3.5 text-emerald-600" /> Spotify mood
              awareness
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-foreground/10 bg-white/70 px-2.5 py-1 shadow-sm backdrop-blur">
      {children}
    </span>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4 text-left bg-white/60 backdrop-blur shadow-sm">
      <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground/10 text-foreground">
        {icon}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
