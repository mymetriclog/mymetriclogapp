"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextType | null>(null)

function useTooltip() {
  const context = React.useContext(TooltipContext)
  if (!context) {
    throw new Error("Tooltip components must be used within a Tooltip")
  }
  return context
}

function TooltipProvider({
  children,
  ...props
}: {
  children: React.ReactNode
}) {
  return (
    <div {...props}>
      {children}
    </div>
  )
}

function Tooltip({
  children,
  ...props
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative" {...props}>
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

function TooltipTrigger({
  children,
  className,
  asChild = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  const { setOpen } = useTooltip()

  const Comp = asChild ? React.Children.only(children) : "div"

  const tooltipProps = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    className: cn("", className),
    ...props,
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, tooltipProps)
  }

  return (
    <Comp {...tooltipProps}>
      {children}
    </Comp>
  )
}

function TooltipContent({
  children,
  className,
  side = "top",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { side?: "top" | "right" | "bottom" | "left" }) {
  const { open } = useTooltip()

  if (!open) return null

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 -translate-y-2",
    bottom: "top-full left-1/2 -translate-x-1/2 translate-y-2",
    left: "right-full top-1/2 -translate-x-2 -translate-y-1/2",
    right: "left-full top-1/2 translate-x-2 -translate-y-1/2",
  }

  return (
    <div
      className={cn(
        "tooltip-content animate-in fade-in-0 zoom-in-95 z-[60]",
        sideClasses[side],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
