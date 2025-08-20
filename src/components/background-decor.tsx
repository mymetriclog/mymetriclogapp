"use client"

export function BackgroundDecor() {
  // Decorative layers: two larger, more subtle gradient blobs
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-48 -right-48 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-400/10 via-amber-300/10 to-rose-400/10 blur-3xl" />
      <div className="absolute -bottom-48 -left-48 h-96 w-96 rounded-full bg-gradient-to-tr from-rose-400/10 via-emerald-300/10 to-amber-300/10 blur-3xl" />
    </div>
  )
}
