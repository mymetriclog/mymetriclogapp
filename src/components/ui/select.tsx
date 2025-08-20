"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  open: boolean
  setOpen: (open: boolean) => void
  value: string
  onValueChange: (value: string) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

function useSelect() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("Select components must be used within a Select")
  }
  return context
}

function Select({
  children,
  value,
  onValueChange,
  ...props
}: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [internalValue, setInternalValue] = React.useState("")
  const [open, setOpen] = React.useState(false)
  
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue
  const setCurrentValue = isControlled ? onValueChange : setInternalValue

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-select]')) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <SelectContext.Provider
      value={{
        open,
        setOpen,
        value: currentValue,
        onValueChange: setCurrentValue || (() => {}),
      }}
    >
      <div data-select className="relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

function SelectTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useSelect()

  return (
    <button
      onClick={() => setOpen(!open)}
      className={cn("select-trigger", className)}
      {...props}
    >
      {children}
      <ChevronsUpDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

function SelectContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useSelect()

  if (!open) return null

  return (
    <div
      className={cn(
        "select-content animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function SelectItem({
  children,
  className,
  value,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { value: selectedValue, onValueChange, setOpen } = useSelect()

  const handleClick = () => {
    onValueChange(value)
    setOpen(false)
  }

  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {selectedValue === value && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
}

function SelectValue({
  placeholder,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }) {
  const { value } = useSelect()

  return (
    <span {...props}>
      {value || placeholder}
    </span>
  )
}

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
}
