"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { LoadingOverlay } from "@/components/loading-overlay";
import { notifications } from "@/lib/notifications";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Please wait…");
  const [emailSent, setEmailSent] = useState(false);

  const supabase = getBrowserSupabaseClient();

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      notifications.error("Email Required", "Please enter your email address.");
      return;
    }

    setLoadingMessage("Sending reset email…");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      setLoading(false);

      if (error) {
        notifications.error("Reset Failed", error.message);
      } else {
        setEmailSent(true);
        notifications.success(
          "Reset Email Sent",
          "Please check your email for the password reset link."
        );
      }
    } catch (error) {
      setLoading(false);
      notifications.error(
        "Reset Failed",
        "An unexpected error occurred. Please try again."
      );
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Left Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 to-emerald-700 items-center justify-center p-8">
          <div className="text-center text-white max-w-md">
            <div className="mb-8">
              <Image
                src="/MyMetricLog.png"
                alt="MyMetricLog Logo"
                width={120}
                height={120}
                className="mx-auto mb-6"
                style={{ width: "55%", height: "auto" }}
              />
            </div>
            <h1 className="text-4xl font-bold mb-4">Check Your Email</h1>
            <p className="text-xl text-emerald-100 mb-6">
              We've sent you a password reset link
            </p>
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <Card className="w-full max-w-md shadow-xl border-0 backdrop-blur-sm">
            <CardHeader className="space-y-2 pb-6">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-semibold text-center text-gray-900">
                Reset Email Sent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  We've sent a password reset link to:
                </p>
                <p className="font-medium text-gray-900">{email}</p>
                <p className="text-sm text-gray-500">
                  Please check your email and click the link to reset your
                  password.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>Check your spam folder if you don't see the email</span>
                </div>
                <div className="text-sm text-gray-500">
                  The reset link will expire in 1 hour for security reasons.
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Send Another Email
                </Button>
              </div>
            </CardContent>
            <CardFooter className="text-center pt-0 border-t border-gray-100">
              <Link
                href="/login"
                className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors text-sm"
              >
                <ArrowLeft className="inline h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <LoadingOverlay open={loading} message={loadingMessage} />

      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 to-emerald-700 items-center justify-center p-8">
        <div className="text-center text-white max-w-md">
          <div className="mb-8">
            <Image
              src="/MyMetricLog.png"
              alt="MyMetricLog Logo"
              width={120}
              height={120}
              className="mx-auto mb-6"
              style={{ width: "55%", height: "auto" }}
            />
          </div>
          <h1 className="text-4xl font-bold mb-4">Forgot Password?</h1>
          <p className="text-xl text-emerald-100 mb-6">
            No worries, we'll send you reset instructions
          </p>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <Card className="w-full max-w-md shadow-xl border-0 backdrop-blur-sm">
          <div className="mt-4">
            <Image
              src="/MyMetricLog.png"
              alt="MyMetricLog Logo"
              width={150}
              height={150}
              className="mx-auto mb-1"
            />
          </div>
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              Reset Your Password
            </CardTitle>
            <p className="text-sm text-gray-600 text-center">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={resetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
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
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00885e] hover:bg-[#006649] text-white font-medium py-3 h-auto text-base shadow-md hover:shadow-lg transition-all duration-200 mt-6"
              >
                Send Reset Link
              </Button>
            </form>

            <div className="relative py-2">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-2 text-xs text-muted-foreground">
                  Remember your password?
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors text-sm"
              >
                <ArrowLeft className="inline h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-gray-500 text-center pt-0 border-t border-gray-100">
            We'll send you a secure link to reset your password.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
