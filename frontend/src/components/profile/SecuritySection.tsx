"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Laptop, Smartphone, KeyRound, ShieldAlert, Monitor, HelpCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

export default function SecuritySection() {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [deviceInfo, setDeviceInfo] = useState({ browser: "Chrome", os: "Windows" });

  // Load client browser details
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      let browser = "Chrome";
      let os = "Windows PC";

      if (ua.includes("Chrome")) browser = "Google Chrome";
      else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Apple Safari";
      else if (ua.includes("Firefox")) browser = "Mozilla Firefox";
      else if (ua.includes("Edge")) browser = "Microsoft Edge";

      if (ua.includes("Windows")) os = "Windows PC";
      else if (ua.includes("Macintosh")) os = "macOS Device";
      else if (ua.includes("iPhone")) os = "Apple iPhone";
      else if (ua.includes("Android")) os = "Android Phone";

      setDeviceInfo({ browser, os });
    }
  }, []);

  // Password Update Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      const res = await api.put("/auth/change-password", data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Password changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update password.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    changePasswordMutation.mutate(passwordForm);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-6">
        <h2 className="font-serif text-2xl font-bold text-gray-900">Security & Credentials</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Change Password Form */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="font-serif text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
            <KeyRound size={16} className="text-primary" /> Update Password
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            {/* Current Password */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-primary bg-gray-50/50 focus:bg-white transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                New Password (Min 8 characters)
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-primary bg-gray-50/50 focus:bg-white transition"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-primary bg-gray-50/50 focus:bg-white transition"
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <Link
                href="/forgot-password"
                className="text-[11px] text-primary hover:underline font-bold font-sans"
              >
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="w-full bg-[#800020] text-white py-3.5 rounded-xl font-bold hover:bg-[#5C0013] transition mt-6 disabled:opacity-60 cursor-pointer shadow-md hover:shadow-lg shadow-[#800020]/25"
            >
              {changePasswordMutation.isPending ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Sessions & Devices */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
          <h3 className="font-serif text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
            <Laptop size={16} className="text-primary" /> Active Sessions
          </h3>

          <div className="space-y-4 text-xs">
            {/* Current Session */}
            <div className="flex gap-3.5 items-start bg-secondary/40 border border-secondary p-4 rounded-2xl relative">
              <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-100 shrink-0 text-primary">
                <Monitor size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-800 font-sans">{deviceInfo.os}</h4>
                  <span className="text-[8px] bg-primary/10 text-primary border border-primary/25 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90">
                    Active
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                  {deviceInfo.browser} • Current session
                </p>
                <p className="text-[10px] text-gray-400">Mumbai, India</p>
              </div>
            </div>

            {/* Simulated Second Device (iPhone) */}
            <div className="flex gap-3.5 items-start p-4 rounded-2xl border border-gray-100 bg-gray-50/20 opacity-70">
              <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-100 shrink-0 text-gray-400">
                <Smartphone size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-gray-700 font-sans">Apple iPhone 14 Pro</h4>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                  Kaumudi iOS App • 4 hours ago
                </p>
                <p className="text-[10px] text-gray-400">New Delhi, India</p>
                <button
                  type="button"
                  disabled
                  className="text-[9px] text-primary hover:underline font-bold mt-2 font-sans cursor-not-allowed"
                >
                  Revoke Device (Future)
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl text-[10px] text-gray-400 flex items-start gap-1.5 leading-relaxed">
              <HelpCircle size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <span>
                If you detect any suspicious activity or login attempts, we recommend updating your password and enabling OTP notifications.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
