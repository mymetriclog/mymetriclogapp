"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3rem";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

function SidebarProvider({
  defaultOpen = true,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const toggleSidebar = React.useCallback(() => setOpen((open) => !open), []);
  const state = open ? "expanded" : "collapsed";

  return (
    <SidebarContext.Provider value={{ state, open, setOpen, toggleSidebar }}>
      <div
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
          } as React.CSSProperties
        }
        className="flex min-h-screen w-full"
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = "left",
  collapsible = "icon",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  collapsible?: "icon" | "none";
}) {
  const { state, setOpen } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-64 flex-col border-r",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden",
          state === "expanded" ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />
      
      {/* Desktop spacer */}
      <div
        className={cn(
          "group peer text-sidebar-foreground hidden md:block",
          "relative bg-transparent transition-all duration-300 ease-in-out",
          state === "expanded" ? "w-64" : "w-16"
        )}
        data-state={state}
      />
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 z-10 h-screen transition-all duration-300 ease-in-out border-r bg-white shadow-lg",
          side === "left" ? "left-0" : "right-0",
          // Mobile: slide in/out from left
          "md:hidden",
          state === "expanded" ? "translate-x-0 w-64" : "-translate-x-full w-64",
          // Desktop: always visible, just collapse
          "md:translate-x-0 md:flex",
          state === "expanded" ? "md:w-64" : "md:w-16",
          className
        )}
        {...props}
      >
        <div className="flex h-full w-full flex-col overflow-hidden">{children}</div>
      </div>
    </>
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul className={cn("flex w-full flex-col gap-1 p-2", className)} {...props} />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("relative", className)} {...props} />;
}

function SidebarMenuButton({
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  isActive?: boolean;
}) {
  return (
    <button
      data-active={isActive}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm font-medium transition-all duration-200",
        "hover:bg-slate-100 hover:text-slate-900",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 data-[active=true]:font-semibold",
        "data-[active=true]:border data-[active=true]:border-blue-200",
        "[&>span:last-child]:truncate [&>svg]:size-5 [&>svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
};



