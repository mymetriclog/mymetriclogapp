"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getBrowserSupabaseClient } from "@/lib/supabase/client"
import { LoadingOverlay } from "@/components/loading-overlay"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const supabase = getBrowserSupabaseClient()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Please wait…")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoadingMessage("Sending reset link…")
    setIsSending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    })
    setIsSending(false)
    if (error) {
      toast({ variant: "destructive", description: error.message })
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <LoadingOverlay open={isSending} message={loadingMessage} />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-sm">
              If an account exists for <strong>{email}</strong>, a reset link has been sent.
              <div className="mt-2">
                <Link href="/login" className="text-emerald-600 hover:underline">
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isSending} className="w-full">
                Send reset link
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          You’ll receive an email with a link to reset your password.
        </CardFooter>
      </Card>
    </div>
  )
}
