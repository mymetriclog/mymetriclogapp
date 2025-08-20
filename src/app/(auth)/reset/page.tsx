"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getBrowserSupabaseClient } from "@/lib/supabase/client"
import { LoadingOverlay } from "@/components/loading-overlay"
import { useToast } from "@/hooks/use-toast"

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = getBrowserSupabaseClient()
  const { toast } = useToast()

  const [exchanged, setExchanged] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Please wait…")

  // Exchange code for session if present; do not show overlay here, per "request send only".
  useEffect(() => {
    async function exchange() {
      if (exchanged) return
      const search = new URLSearchParams(window.location.search)
      if (search.get("code")) {
        await supabase.auth.exchangeCodeForSession(search)
      }
      setExchanged(true)
    }
    exchange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast({ variant: "destructive", description: "Passwords do not match." })
      return
    }
    setLoadingMessage("Updating password…")
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      toast({ variant: "destructive", description: error.message })
    } else {
      toast({ description: "Password updated successfully. Please sign in." })
      router.replace("/login")
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <LoadingOverlay open={loading} message={loadingMessage} />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Set a new password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              Update password
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          After updating, sign in again with your new password.
        </CardFooter>
      </Card>
    </div>
  )
}
