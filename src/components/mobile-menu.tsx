"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, X, Search, Bell, User, Settings, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { nameToColors, toInitials } from "@/lib/name-colors"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image";

type User = {
  name: string
  email: string
  role?: string
}

const mobileNavigationItems = [
  {
    href: "/dashboard",
    icon: "📊",
    label: "Dashboard",
  },
  {
    href: "/weathers",
    icon: "🌤️",
    label: "Weather",
  },
  {
    href: "/integrations",
    icon: "🔌",
    label: "Integrations",
  },
  {
    href: "/reports",
    icon: "📋",
    label: "Reports",
  },
  {
    href: "/queue",
    icon: "⚡",
    label: "Queue",
    adminOnly: true,
  },
  {
    href: "/settings",
    icon: "⚙️",
    label: "Settings",
  },
]

interface MobileMenuProps {
  user: User
  onLogout: () => void
}

export function MobileMenu({ user, onLogout }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const initials = toInitials(user.name, user.email)
  const { gradient, fg } = nameToColors(user.name || user.email)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-md flex items-center justify-center overflow-hidden">
                <Image
                  src="/MyMetricLog.png"
                  alt="MyMetricLog Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-lg">MyMetricLog</div>
                <div className="text-sm text-slate-500">Mobile Menu</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 size-4" />
              <Input
                placeholder="Search..."
                className="pl-10 bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {mobileNavigationItems.map((item) => {
                // Skip admin-only items for non-admin users
                if (item.adminOnly && user.role !== 'admin') {
                  return null
                }

                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Active
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User section */}
          <div className="p-4 border-t bg-slate-50">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="size-10 ring-1 ring-black/5">
                <AvatarFallback
                  className="font-medium"
                  style={{ backgroundImage: gradient, color: fg }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">{user.name}</div>
                <div className="text-sm text-slate-500 truncate">{user.email}</div>
                {user.role && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {user.role}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/settings" onClick={() => setOpen(false)}>
                  <User className="mr-2 size-4" />
                  Profile
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/settings" onClick={() => setOpen(false)}>
                  <Settings className="mr-2 size-4" />
                  Settings
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => {
                  setOpen(false)
                  onLogout()
                }}
              >
                <LogOut className="mr-2 size-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
