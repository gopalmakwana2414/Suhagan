"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, MailCheck, Lock, CheckCircle2, KeyRound } from "lucide-react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resendTimer, setResendTimer] = useState(60);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email });
      toast.success("OTP sent to your email.");
      setResendTimer(60);
      setStep(2);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/verify-forgot-otp", { email, otp });
      if (res.data.success) {
        setResetToken(res.data.resetToken);
        toast.success("OTP verified successfully.");
        setStep(3);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email });
      toast.success("A new verification OTP has been sent.");
      setResendTimer(60);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/auth/reset-password/${resetToken}`, { password });
      toast.success("Password reset successfully.");
      setStep(4);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 min-h-[85vh] flex items-center bg-[#faf9f6]">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-[#fff8e7] text-[#d4af37] rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound size={24} />
                </div>
                <h1 className="text-3xl font-bold text-[#1f1f1f]">Forgot Password?</h1>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  Enter your registered email below, and we will send you a 6-digit OTP to reset your password.
                </p>
              </div>

              <form onSubmit={handleRequestOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition bg-gray-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#d4af37] text-white py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition disabled:opacity-60 shadow-sm"
                >
                  {loading ? "Sending OTP..." : "Request Reset OTP"}
                </button>

                <p className="text-center text-sm text-gray-600">
                  <Link
                    href="/login"
                    className="text-[#b8860b] font-medium hover:underline inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} /> Back to Login
                  </Link>
                </p>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-[#fff8e7] text-[#d4af37] rounded-full flex items-center justify-center mx-auto mb-4">
                  <MailCheck size={24} />
                </div>
                <h1 className="text-3xl font-bold text-[#1f1f1f]">Enter OTP</h1>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  We sent a 6-digit verification code to <span className="font-semibold text-[#1f1f1f]">{email}</span>.
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    One-Time Password
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] text-xl font-bold border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition bg-gray-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#d4af37] text-white py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition disabled:opacity-60 shadow-sm"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-xs text-gray-400">
                      Resend code in <span className="font-semibold text-gray-600">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleResendOTP}
                      className="text-xs text-[#b8860b] font-semibold hover:underline"
                    >
                      Resend Verification OTP
                    </button>
                  )}
                </div>

                <p className="text-center text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[#b8860b] font-medium hover:underline inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} /> Change Email
                  </button>
                </p>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-[#fff8e7] text-[#d4af37] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} />
                </div>
                <h1 className="text-3xl font-bold text-[#1f1f1f]">New Password</h1>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  Enter your new password below. Ensure it is at least 8 characters.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition bg-gray-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#d4af37] text-white py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition disabled:opacity-60 shadow-sm"
                >
                  {loading ? "Resetting Password..." : "Update Password"}
                </button>
              </form>
            </>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={36} />
              </div>
              <h1 className="text-3xl font-bold text-[#1f1f1f]">Success!</h1>
              <p className="text-gray-500 mt-3 text-sm leading-relaxed">
                Your password has been reset successfully. You can now use your new credentials to access your account.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full bg-[#d4af37] text-white py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition mt-8 shadow-sm"
              >
                Go to Login
              </Link>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
