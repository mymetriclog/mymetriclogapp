"use client"

import { useRouter } from "next/navigation"
import { getBrowserSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { nameToColors, toInitials } from "@/lib/name-colors"
import { toast } from "sonner"

export function AccountCard({
  name = "User",
  email = "user@example.com",
}: {
  name?: string
  email?: string
}) {
  const supabase = getBrowserSupabaseClient()
  const router = useRouter()

  async function onLogout() {
    try {
      // Show loading toast
      const loadingToast = toast.loading("Signing out...", {
        description: "Please wait while we sign you out.",
      });
      
      await supabase.auth.signOut()
      
      // Show success toast
      toast.dismiss(loadingToast);
      toast.success("👋 Signed Out Successfully!", {
        description: "You have been signed out of your account.",
      });
      
      router.replace("/login")
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("❌ Logout Failed", {
        description: "There was an error signing you out. Please try again.",
      });
    }
  }

  const initials = toInitials(name, email)
  const { gradient, fg } = nameToColors(name || email)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 ring-1 ring-black/5 dark:ring-white/10">
            <AvatarFallback
              className="font-medium"
              style={{ backgroundImage: gradient, color: fg }}
              aria-label={name}
              title={name}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium leading-none">{name}</div>
            <div className="text-sm text-muted-foreground">{email}</div>
          </div>
        </div>
        <Button variant="outline" onClick={onLogout}>
          Logout
        </Button>
      </CardContent>
    </Card>
  )
}
