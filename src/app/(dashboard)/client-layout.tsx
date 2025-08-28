"use client";

import React, { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  PanelLeft,
  Gauge,
  PlugZap,
  FileSpreadsheet,
  Settings,
  LogOut,
  X,
  Cloud,
  Activity,
  Search,
  Bell,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/user-nav";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { MobileMenu } from "@/components/mobile-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BackgroundDecor } from "@/components/background-decor";
import { CommandPalette } from "@/components/command-palette";
import {
  SidebarProvider,
  useSidebar,
  Sidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { notifications } from "@/lib/notifications";
import { nameToColors, toInitials } from "@/lib/name-colors";
import Image from "next/image";

type User = {
  name: string;
  email: string;
  role?: string;
};

// Navigation items configuration
const navigationItems = [
  {
    href: "/dashboard",
    icon: Gauge,
    label: "Dashboard",
    description: "Overview and analytics",
  },
  {
    href: "/weathers",
    icon: Cloud,
    label: "Weather",
    description: "Weather information",
  },
  {
    href: "/integrations",
    icon: PlugZap,
    label: "Integrations",
    description: "Connect your services",
  },
  {
    href: "/reports",
    icon: FileSpreadsheet,
    label: "Reports",
    description: "View and generate reports",
  },
  {
    href: "/queue",
    icon: Activity,
    label: "Queue",
    description: "Background tasks",
    adminOnly: true,
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    description: "Account and preferences",
  },
];

// This is the Client Component responsible for the interactive UI.
export default function DashboardClientLayout({
  children,
  user,
}: {
  children: ReactNode;
  user: User;
}) {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  async function onLogout() {
    try {
      // Show loading toast
      const loadingToast = notifications.loading(
        "Signing out...",
        "Please wait while we sign you out."
      );

      await supabase.auth.signOut();

      // Show success toast
      notifications.dismissById(loadingToast);
      notifications.success(
        "👋 Signed Out Successfully!",
        "You have been signed out of your account."
      );

      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      notifications.error(
        "❌ Logout Failed",
        "There was an error signing you out. Please try again."
      );
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardContent user={user} onLogout={onLogout}>
        {children}
      </DashboardContent>
    </SidebarProvider>
  );
}

function DashboardContent({
  user,
  onLogout,
  children,
}: {
  user: User;
  onLogout: () => void;
  children: ReactNode;
}) {
  const { state, setOpen } = useSidebar();
  const pathname = usePathname();

  // Close sidebar on mobile by default
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setOpen(false);
      }
    };

    // Set initial state immediately
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setOpen(false);
    }

    // Add event listener
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setOpen]);

  return (
    <div className="flex min-h-screen bg-slate-50 w-full overflow-x-hidden">
      <Sidebar
        collapsible="icon"
        side="left"
        className="bg-white/95 backdrop-blur-sm border-r border-slate-200/60 sidebar-smooth shadow-lg fixed top-0 left-0 h-full z-[200]"
      >
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm">
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              state === "collapsed" ? "justify-center" : ""
            }`}
          >
            <div
              className={`flex items-center transition-all duration-300 ${
                state === "collapsed" ? "justify-center" : "gap-3"
              }`}
            >
              <div className="size-8 rounded-md flex items-center justify-start shadow-sm overflow-hidden w-full h-full">
                <Image
                  src="/MyMetricLog.png"
                  alt="MyMetricLog Logo"
                  width={32}
                  height={32}
                  className={`h-full object-cover transition-all duration-300 ${
                    state === "collapsed" ? "w-full" : "w-[55%]"
                  }`}
                />
              </div>
            </div>
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="md:hidden h-8 w-8 hover:bg-slate-200"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="sticky top-0 pt-2 pb-6 z-10">
            <SidebarMenu>
              {navigationItems.map((item) => {
                // Skip admin-only items for non-admin users
                if (item.adminOnly && user.role !== "admin") {
                  return null;
                }

                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton isActive={isActive}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          // Close sidebar on mobile when clicking navigation
                          if (
                            typeof window !== "undefined" &&
                            window.innerWidth < 768
                          ) {
                            setOpen(false);
                          }
                        }}
                        className={`flex items-center w-full transition-all duration-300 ${
                          state === "collapsed" ? "justify-center" : "gap-3"
                        }`}
                      >
                        <Icon className="size-5 shrink-0" />
                        <span
                          className={`transition-all duration-300 ${
                            state === "collapsed"
                              ? "opacity-0 w-0 overflow-hidden"
                              : "opacity-100"
                          }`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        </div>

        {/* Footer with user info and logout */}
        <div className="p-4 border-t bg-slate-50/50">
          <div
            className={`mb-6 transition-opacity duration-300 ${
              state === "collapsed" ? "opacity-0 hidden" : "opacity-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-9 ring-1 ring-black/5 dark:ring-white/10">
                <AvatarFallback
                  className="font-medium"
                  style={{
                    backgroundImage: nameToColors(user.name || user.email)
                      .gradient,
                    color: nameToColors(user.name || user.email).fg,
                  }}
                  aria-label={user.name}
                  title={user.name}
                >
                  {toInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900 truncate">
                  {user.name}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </div>
          {/* Avatar for collapsed state */}
          <div
            className={`transition-opacity duration-300 ${
              state === "collapsed" ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            <div className="flex justify-center mb-5">
              <Avatar className="size-9 ring-1 ring-black/5 dark:ring-white/10">
                <AvatarFallback
                  className="font-medium"
                  style={{
                    backgroundImage: nameToColors(user.name || user.email)
                      .gradient,
                    color: nameToColors(user.name || user.email).fg,
                  }}
                  aria-label={user.name}
                  title={user.name}
                >
                  {toInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className={`w-full bg-white hover:bg-slate-100 transition-all duration-300 ${
              state === "collapsed" ? "justify-center" : ""
            }`}
          >
            <LogOut
              className={`size-4 shrink-0 transition-all duration-300 ${
                state === "collapsed" ? "mr-0" : "mr-2"
              }`}
            />
            <span
              className={`transition-all duration-300 ${
                state === "collapsed"
                  ? "opacity-0 w-0 overflow-hidden"
                  : "opacity-100"
              }`}
            >
              Logout
            </span>
          </Button>
        </div>
      </Sidebar>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          state === "collapsed" ? "ml-0 md:ml-0" : "ml-0 md:ml-0"
        }`}
      >
        {/* Enhanced header - Fixed */}
        <header
          className={`h-[66px] border-b bg-white/80 backdrop-blur-sm flex items-center px-4 sm:px-6 lg:px-8 flex-shrink-0 shadow-sm fixed top-0 right-0 z-50 transition-all duration-300 ${
            state === "collapsed" ? "left-0 md:left-16" : "left-0 md:left-64"
          }`}
        >
          <div className="flex items-center gap-4">
            <SidebarToggle />
            <MobileMenu user={user} onLogout={onLogout} />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-sm text-slate-600">
                Welcome back, {user.name}
              </p>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Notifications */}
            {/* <NotificationsDropdown /> */}

            {/* Command palette trigger */}
            {/* <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                <Search className="size-4" />
              </Button> */}

            {/* User navigation */}
            <UserNav name={user.name} email={user.email} />
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pt-20">
          <BackgroundDecor />
          <div className="z-10 p-4 sm:p-6 lg:p-8 xl:p-10 px-4 lg:px-0">
            <div className="space-y-4">{children}</div>
          </div>
        </main>
        <CommandPalette />
      </div>
    </div>
  );
}

function SidebarToggle() {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
      className="h-9 w-9"
    >
      <PanelLeft className="size-4" />
    </Button>
  );
}
