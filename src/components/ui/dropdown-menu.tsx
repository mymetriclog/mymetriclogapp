"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropdownMenuContextType {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | null>(null)

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error("DropdownMenu components must be used within a DropdownMenu")
  }
  return context
}

function DropdownMenu({
  children,
  open,
  onOpenChange,
  ...props
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setIsOpen?.(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, setIsOpen])

  return (
    <DropdownMenuContext.Provider
      value={{
        open: isOpen,
        setOpen: setIsOpen || (() => {}),
        triggerRef,
        contentRef,
      }}
    >
      <div className="relative" {...props}>{children}</div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen, triggerRef } = useDropdownMenu()

  return (
    <button
      ref={triggerRef}
      onClick={() => setOpen(true)}
      className={cn("", className)}
      {...props}
    >
      {children}
    </button>
  )
}

function DropdownMenuContent({
  children,
  className,
  sideOffset = 4,
  align = "center",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { 
  sideOffset?: number
  align?: "start" | "center" | "end"
}) {
  const { open, setOpen, triggerRef, contentRef } = useDropdownMenu()

  if (!open) return null

  const getAlignmentStyle = () => {
    switch (align) {
      case "start":
        return { left: 0 }
      case "end":
        return { right: 0 }
      case "center":
      default:
        return { left: "50%", transform: "translateX(-50%)" }
    }
  }

  return (
    <div
      ref={contentRef}
      className={cn(
        "dropdown-menu-content animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={{
        position: "absolute",
        top: triggerRef.current ? triggerRef.current.offsetHeight + sideOffset : 0,
        zIndex: 50,
        minWidth: "8rem",
        ...getAlignmentStyle(),
      }}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  onClick,
  asChild = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  inset?: boolean
  variant?: "default" | "destructive"
  asChild?: boolean
}) {
  const { setOpen } = useDropdownMenu()

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e)
    setOpen(false)
  }

  const Comp = asChild ? "span" : "div"

  return (
    <Comp
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        variant === "destructive" && "text-destructive focus:bg-destructive/10 focus:text-destructive",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  onCheckedChange,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  const { setOpen } = useDropdownMenu()

  const handleClick = () => {
    onCheckedChange?.(!checked)
    setOpen(false)
  }

  return (
    <div
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <CheckIcon className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  value,
  onSelect,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value: string
  onSelect?: (value: string) => void
}) {
  const { setOpen } = useDropdownMenu()

  const handleClick = () => {
    onSelect?.(value)
    setOpen(false)
  }

  return (
    <div
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <CircleIcon className="h-2 w-2 fill-current" />
      </span>
      {children}
    </div>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props} />
  )
}

// Placeholder components for compatibility
const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuSubTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuSubContent = ({ children }: { children: React.ReactNode }) => <>{children}</>

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
