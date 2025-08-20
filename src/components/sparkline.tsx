"use client"

import { useEffect, useState } from "react"

function buildPath(values: number[], width: number, height: number, padding = 4) {
  if (values.length === 0) return ""
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = (width - padding * 2) / (values.length - 1)

  return values
    .map((v, i) => {
      const x = padding + i * step
      const y = padding + (1 - (v - min) / range) * (height - padding * 2)
      return `${i === 0 ? "M" : "L"} ${x},${y}`
    })
    .join(" ")
}

export function Sparkline({
  values = [2, 4, 3, 5, 6, 7, 6, 8],
  width = 160,
  height = 48,
  stroke = "hsl(142 76% 36%)",
  animate = true,
}: {
  values?: number[]
  width?: number
  height?: number
  stroke?: string
  animate?: boolean
}) {
  const [animatedPath, setAnimatedPath] = useState("")
  const fullPath = buildPath(values, width, height)

  useEffect(() => {
    if (!animate) {
      setAnimatedPath(fullPath)
      return
    }

    // Animate the path drawing
    const pathSegments = fullPath.split(/(?=[ML])/).filter(Boolean)
    let currentPath = ""
    let segmentIndex = 0

    const animatePath = () => {
      if (segmentIndex < pathSegments.length) {
        currentPath += pathSegments[segmentIndex]
        setAnimatedPath(currentPath)
        segmentIndex++
        setTimeout(animatePath, 50) // 50ms delay between segments
      }
    }

    // Start animation after a small delay
    setTimeout(animatePath, 100)
  }, [fullPath, animate])

  return (
    <svg width={width} height={height} aria-hidden>
      <path 
        d={animatedPath} 
        fill="none" 
        stroke={stroke} 
        strokeWidth="2"
        style={{
          transition: animate ? "none" : "stroke-dasharray 0.5s ease-in-out"
        }}
      />
    </svg>
  )
}
