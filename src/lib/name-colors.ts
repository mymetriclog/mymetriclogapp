export function nameToColors(seedRaw: string | undefined) {
  const seed = (seedRaw || "user").toLowerCase().trim()

  // Simple string hash
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const hue1 = Math.abs(hash) % 360
  const hue2 = (hue1 + 40) % 360
  const sat = 70
  const light = 50

  const c1 = `hsl(${hue1} ${sat}% ${light}%)`
  const c2 = `hsl(${hue2} ${sat}% ${Math.max(38, light - 8)}%)`
  const gradient = `linear-gradient(135deg, ${c1}, ${c2})`

  // Always white text on these mid-sat hues
  const fg = "#ffffff"

  return { gradient, fg }
}

export function toInitials(name?: string, fallbackEmail?: string) {
  const src = (name && name.trim()) || fallbackEmail || "User"
  const parts = src.replace(/\s+/g, " ").trim().split(" ")
  if (parts.length === 1) {
    const token = parts[0].includes("@") ? parts[0].split("@")[0] : parts[0]
    return token.slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
