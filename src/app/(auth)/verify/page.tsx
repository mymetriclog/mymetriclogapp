"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { getBrowserSupabaseClient } from "@/lib/supabase/client"
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react'
import { LoadingOverlay } from "@/components/loading-overlay"

function VerifyEmailContent() {
  const supabase = getBrowserSupabaseClient()
  const params = useSearchParams()
  const router = useRouter()

  const initialEmail = useMemo(() => params.get("email") ?? "", [params])
  const [email, setEmail] = useState(initialEmail)
  const [isSending, setIsSending] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Please wait…")
  const [sent, setSent] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace("/dashboard")
      }
    }
    checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function resend() {
    if (!email) {
      alert("Please enter your email.")
      return
    }
    setLoadingMessage("Sending verification email…")
    setIsSending(true)
    const { error } = await supabase.auth.resend({ type: "signup", email })
    setIsSending(false)
    if (error) {
      alert(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <LoadingOverlay open={isSending} message={loadingMessage} />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We’ve sent a verification link to your email. Click the link to finish creating your account.
          </p>

          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                onClick={resend}
                disabled={isSending}
                className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-600/90"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 size-4" />
                    Resend
                  </>
                )}
              </Button>
            </div>
            {sent && (
              <div className="mt-1 flex items-center gap-2 text-emerald-600 text-sm">
                <CheckCircle2 className="size-4" />
                Verification email sent.
              </div>
            )}
          </div>

          <div className="relative py-2">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-2 text-xs text-muted-foreground">Tips</span>
            </div>
          </div>

          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>It may take a minute for the email to arrive.</li>
            <li>Check your spam folder if you don’t see it.</li>
            <li>Use the same device and browser to keep you signed in after clicking the link.</li>
          </ul>

          <div className="flex items-center justify-between">
            <Link href="/login" className="text-emerald-600 hover:underline text-sm">
              Back to login
            </Link>
            <a
              href="mailto:"
              className="text-muted-foreground hover:underline text-sm"
              title="Open email app"
            >
              Open email app
            </a>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Once you click the link in your email, you’ll be redirected to the dashboard automatically.
        </CardFooter>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid place-items-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please wait while we load the verification page.</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
