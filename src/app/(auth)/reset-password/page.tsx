"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
import {
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { LoadingOverlay } from "@/components/loading-overlay";
import { notifications } from "@/lib/notifications";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Please wait…");
  const [isValidSession, setIsValidSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const supabase = getBrowserSupabaseClient();

  // Check if we have a valid session for password reset
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session check error:", error);
          setIsValidSession(false);
        } else if (session) {
          setIsValidSession(true);
        } else {
          // Check if we have access token and refresh token in URL
          const accessToken = searchParams.get("access_token");
          const refreshToken = searchParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionError) {
              console.error("Set session error:", setSessionError);
              setIsValidSession(false);
            } else {
              setIsValidSession(true);
            }
          } else {
            setIsValidSession(false);
          }
        }
      } catch (error) {
        console.error("Unexpected error checking session:", error);
        setIsValidSession(false);
      } finally {
        setSessionChecked(true);
      }
    };

    checkSession();
  }, [supabase.auth, searchParams]);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid:
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar,
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();

    if (!passwordValidation.isValid) {
      notifications.error(
        "Invalid Password",
        "Please ensure your password meets all requirements."
      );
      return;
    }

    if (!passwordsMatch) {
      notifications.error(
        "Passwords Don't Match",
        "Please ensure both passwords are identical."
      );
      return;
    }

    setLoadingMessage("Updating password…");
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      setLoading(false);

      if (error) {
        notifications.error("Reset Failed", error.message);
      } else {
        setPasswordReset(true);
        notifications.success(
          "Password Updated",
          "Your password has been successfully updated."
        );

        // Sign out and redirect to login after a delay
        setTimeout(async () => {
          await supabase.auth.signOut();
          router.push("/login");
        }, 3000);
      }
    } catch (error) {
      setLoading(false);
      notifications.error(
        "Reset Failed",
        "An unexpected error occurred. Please try again."
      );
    }
  }

  // Show loading while checking session
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Card className="w-full max-w-md shadow-xl border-0 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
            <p className="text-center text-gray-600 mt-4">
              Verifying reset link...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if no valid session
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Left Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-500 to-red-700 items-center justify-center p-8">
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
            <h1 className="text-4xl font-bold mb-4">Invalid Link</h1>
            <p className="text-xl text-red-100 mb-6">
              This password reset link is invalid or has expired
            </p>
          </div>
        </div>

        {/* Right Side - Error Message */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <Card className="w-full max-w-md shadow-xl border-0 backdrop-blur-sm">
            <CardHeader className="space-y-2 pb-6">
              <div className="flex items-center justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-semibold text-center text-gray-900">
                Invalid Reset Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  This password reset link is either invalid or has expired.
                </p>
                <p className="text-sm text-gray-500">
                  Password reset links expire after 1 hour for security reasons.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Link href="/forgot-password">Request New Reset Link</Link>
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

  // Show success message after password reset
  if (passwordReset) {
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
            <h1 className="text-4xl font-bold mb-4">Password Updated!</h1>
            <p className="text-xl text-emerald-100 mb-6">
              Your password has been successfully reset
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
                Password Reset Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Your password has been successfully updated.
                </p>
                <p className="text-sm text-gray-500">
                  You will be automatically redirected to the login page in a
                  few seconds.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Link href="/login">Continue to Login</Link>
                </Button>
              </div>
            </CardContent>
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
          <h1 className="text-4xl font-bold mb-4">Set New Password</h1>
          <p className="text-xl text-emerald-100 mb-6">
            Choose a strong password for your account
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
              Create New Password
            </CardTitle>
            <p className="text-sm text-gray-600 text-center">
              Enter a strong password for your account
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
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

                {/* Password Requirements */}
                <div className="space-y-1 text-xs">
                  <div
                    className={`flex items-center gap-2 ${
                      passwordValidation.minLength
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        passwordValidation.minLength
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    At least 8 characters
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordValidation.hasUpperCase
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        passwordValidation.hasUpperCase
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    One uppercase letter
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordValidation.hasLowerCase
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        passwordValidation.hasLowerCase
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    One lowercase letter
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordValidation.hasNumbers
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        passwordValidation.hasNumbers
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    One number
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordValidation.hasSpecialChar
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        passwordValidation.hasSpecialChar
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    One special character
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 px-4 pr-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword.length > 0 && (
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      passwordsMatch ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        passwordsMatch ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    {passwordsMatch
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={
                  loading || !passwordValidation.isValid || !passwordsMatch
                }
                className="w-full bg-[#00885e] hover:bg-[#006649] text-white font-medium py-3 h-auto text-base shadow-md hover:shadow-lg transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Password
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
            Your password will be securely updated and you'll be signed out for
            security.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
