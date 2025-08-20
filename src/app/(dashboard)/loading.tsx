import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  // Instant loading states improve perceived performance with the App Router [^1][^3].
  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-8 w-80" />
            <Skeleton className="mt-2 h-4 w-64" />
            <div className="mt-6 flex gap-2">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-7 w-28" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="mt-2 h-4 w-56" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-6 w-28" />
              <Skeleton className="mt-2 h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
