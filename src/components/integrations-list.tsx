"use client";

import { IntegrationCard } from "@/components/integration-card";
import { type IntegrationItem } from "@/app/data/mock";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface IntegrationsListProps {
  integrations: IntegrationItem[];
  isLoading?: boolean;
}

export function IntegrationsList({
  integrations,
  isLoading = false,
}: IntegrationsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <IntegrationSkeleton key={index} delay={index * 100} />
          ))}
        </div>
        <div className="text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce"></div>
            <div
              className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {integrations.map((intg, index) => (
        <div
          key={intg.key}
          className="animate-in fade-in-0 slide-in-from-bottom-4"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <IntegrationCard
            integration={{
              key: intg.key as any,
              name: intg.name,
              status: intg.status as any,
              lastSync: intg.lastSync,
              notes: intg.notes,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function IntegrationSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <Card
      className="h-full flex flex-col min-h-[200px] animate-in fade-in-0 slide-in-from-bottom-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </CardHeader>
      <CardContent className="text-sm flex-grow flex flex-col justify-between">
        <div className="flex-grow space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
