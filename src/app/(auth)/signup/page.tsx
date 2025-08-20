"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { getBrowserSupabaseClient } from "@/lib/supabase/client"
import { LoadingOverlay } from "@/components/loading-overlay"
import { notifications } from "@/lib/notifications"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const supabase = getBrowserSupabaseClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Please wait…")

  async function signUpWithGoogle() {
    setLoadingMessage("Redirecting to Google…")
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?returnTo=${encodeURIComponent("/dashboard")}`,
      },
    })
    if (error) {
      setLoading(false)
      notifications.error("Authentication Error", error.message)
    }
  }

  async function signUpWithEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoadingMessage("Creating your account…")
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?returnTo=${encodeURIComponent("/dashboard")}`,
      },
    })
    setLoading(false)
    if (error) {
      notifications.error("Signup Failed", error.message)
    } else {
      notifications.success("Account Created", "Please check your email to verify your account.")
      router.push("/login")
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <LoadingOverlay open={loading} message={loadingMessage} />
      
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 to-emerald-700 items-center justify-center p-8">
        <div className="text-center text-white max-w-md">
          <div className="mb-8">
            <Image 
              src="/placeholder-logo.svg" 
              alt="MyMetricLog Logo" 
              width={120} 
              height={120} 
              className="mx-auto mb-6"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          <h1 className="text-4xl font-bold mb-4">Join MyMetricLog</h1>
          <p className="text-xl text-emerald-100 mb-6">
            Start your journey to better wellness and productivity tracking
          </p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <Card className="w-full max-w-md shadow-xl border-0 backdrop-blur-sm">
          <div className="mt-4">
            <Image 
              src="/placeholder-logo.svg" 
              alt="MyMetricLog Logo" 
              width={150} 
              height={150} 
              className="mx-auto mb-1"
            />
          </div>
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              Create your account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={signUpWithGoogle}
              disabled={loading}
              className="w-full bg-[#f9fafb] hover:bg-[#f3f4f6] text-black font-medium py-3 h-auto text-base shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
            >
              <Image
                src="/googlebutton.png"
                alt="Google"
                width={24}
                height={24}
                className="mr-3"
              />
              Continue with Google
            </Button>

            <div className="flex items-center py-1">
              <Separator className="flex-1 bg-gray-500" />
              <span className="px-4 text-sm text-gray-500 font-medium">or</span>
              <Separator className="flex-1 bg-gray-500" />
            </div>

            <form onSubmit={signUpWithEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="Alex Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 px-4 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 px-4 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 px-4 pr-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-[#00885e] hover:bg-[#006649] text-white font-medium py-3 h-auto text-base shadow-md hover:shadow-lg transition-all duration-200 mt-6"
              >
                Create account
              </Button>
            </form>

            <span className="text-gray-600 text-center w-full block">
              Already have an account?{" "}
              <Link 
                className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors" 
                href="/login"
              >
                Sign in
              </Link>
            </span>
          </CardContent>
          <CardFooter className="text-xs text-gray-500 text-center pt-0 border-t border-gray-100">
            We'll send a confirmation email to verify your account.
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
