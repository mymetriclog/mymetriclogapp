"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, User, Bell, Shield, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { nameToColors, toInitials } from "@/lib/name-colors";
import { toast } from "sonner";

export function UserNav({
  name: defaultName = "Guest",
  email: defaultEmail = "guest@example.com",
}: {
  name?: string;
  email?: string;
}) {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [userRole, setUserRole] = useState<string | undefined>();

  const initials = toInitials(name, email);
  const { gradient, fg } = nameToColors(name || email);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!ignore && user) {
        setEmail(user.email ?? defaultEmail);
        setName(
          (user.user_metadata?.full_name as string) ||
            (user.identities?.[0]?.identity_data?.name as string) ||
            user.email?.split("@")[0] ||
            defaultName
        );
        setUserRole(user.user_metadata?.role as string);
      }
    }
    load();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogout() {
    try {
      await supabase.auth.signOut();

      toast.success("👋 Signed Out Successfully!", {
        description: "You have been signed out of your account.",
      });

      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("❌ Logout Failed", {
        description: "There was an error signing you out. Please try again.",
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative size-9 rounded-full p-0 hover:bg-slate-100 inline-flex items-center justify-center whitespace-nowrap  text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground">
        <Avatar className="size-9 ring-1 ring-black/5 dark:ring-white/10">
          {/* We intentionally avoid AvatarImage to ensure our gradient shows */}
          <AvatarFallback
            className="font-medium"
            style={{ backgroundImage: gradient, color: fg }}
            aria-label={name}
            title={name}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="sr-only">{"Open user menu"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 ring-1 ring-black/5 dark:ring-white/10">
              <AvatarFallback
                className="font-medium"
                style={{ backgroundImage: gradient, color: fg }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900 truncate">{name}</div>
              <div className="text-sm text-slate-500 truncate">{email}</div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <User className="size-4" />
            <div>
              <div className="font-medium">Profile</div>
              <div className="text-xs text-slate-500">Manage your account</div>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="size-4" />
            <div>
              <div className="font-medium">Settings</div>
              <div className="text-xs text-slate-500">Preferences and configuration</div>
            </div>
          </Link>
        </DropdownMenuItem> */}
        {/* {userRole === 'admin' && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center gap-2">
              <Shield className="size-4" />
              <div>
                <div className="font-medium">Admin Panel</div>
                <div className="text-xs text-slate-500">System administration</div>
              </div>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator /> */}
        {/* <DropdownMenuItem asChild>
          <Link href="/help" className="flex items-center gap-2">
            <HelpCircle className="size-4" />
            <div>
              <div className="font-medium">Help & Support</div>
              <div className="text-xs text-slate-500">Get help and documentation</div>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator /> */}
        <DropdownMenuItem
          className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer justify-center items-center flex"
          onClick={onLogout}
        >
          <LogOut className="mr-2 size-4" />
          <div>
            <div className="font-medium">Sign out</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
