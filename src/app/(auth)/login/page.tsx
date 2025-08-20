"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { LogIn, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { LoadingOverlay } from "@/components/loading-overlay";
import { notifications } from "@/lib/notifications";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  // Remove returnTo logic since we're not using it anymore
  // const returnTo = params.get("returnTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Please wait…");

  const supabase = getBrowserSupabaseClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          router.push('/dashboard');
        }
      } catch (error) {
        // Session check failed, continue with login
      }
    };

    checkSession();
  }, [router, supabase.auth]);

  async function signInWithGoogle() {
    setLoadingMessage("Redirecting to Google…");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setLoading(false);
      notifications.error("Authentication Error", error.message);
    }
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoadingMessage("Signing in…");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      notifications.error("Login Failed", error.message);
    } else {
      notifications.success("Login Successful", "Welcome back!");
      // Always redirect to dashboard after successful login
      router.replace("/dashboard");
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
              style={{ width: "auto", height: "auto" }}
            />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome to MyMetricLog</h1>
          <p className="text-xl text-emerald-100 mb-6">
            Your personal wellness and productivity dashboard for daily & weekly
            insights
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
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
              Sign in to MyMetricLog
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full bg-[#f9fafb] hover:bg-[#f3f4f6] text-black font-medium py-3 h-auto text-base shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
            >
              <Image
                src="/googlebutton.png"
                alt="Google"
                width={24} // bigger width
                height={24} // bigger height
                className="mr-3"
              />
              Continue with Google
            </Button>

            <div className="flex items-center py-1">
              <Separator className="flex-1 bg-gray-500" />
              <span className="px-4 text-sm text-gray-500 font-medium">or</span>
              <Separator className="flex-1 bg-gray-500" />
            </div>

            <form onSubmit={signInWithEmail} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
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
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
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
                Sign in with Email
              </Button>
            </form>

            <div className="flex items-center justify-between text-sm pt-0">
              <Link
                className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
                href="/forgot"
              >
                Forgot password?
              </Link>
            </div>
            <span className="text-gray-600 text-center w-full block">
              Don't have an account?{" "}
              <Link
                className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
                href="/signup"
              >
                Sign up
              </Link>
            </span>
          </CardContent>
          <CardFooter className="text-xs text-gray-500 text-center pt-0 border-t border-gray-100">
            By continuing, you agree to our Terms.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
