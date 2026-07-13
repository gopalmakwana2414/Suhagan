"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  UserCheck, 
  KeyRound 
} from "lucide-react";
import { z } from "zod";

import api from "@/lib/api";
import Logo from "@/components/ui/Logo";
import { useAuthStore } from "@/store/authStore";

// Frontend Validation Schemas
const customerSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  captchaText: z.string().trim().length(6, "CAPTCHA must be exactly 6 characters"),
});

const adminSendOtpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const adminLoginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  otp: z.string().trim().length(6, "OTP must be exactly 6 digits"),
});

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  // Layout Tab State: "customer" | "admin"
  const [activeTab, setActiveTab] = useState<"customer" | "admin">("customer");

  // Form Fields State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // CAPTCHA State (Customer tab)
  const [captchaData, setCaptchaData] = useState<{ captchaId: string; captchaSvg: string } | null>(null);
  const [captchaText, setCaptchaText] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // OTP State (Admin tab)
  const [adminStep, setAdminStep] = useState<1 | 2>(1); // Step 1: Credentials; Step 2: OTP Entry
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch new CAPTCHA
  const fetchCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const res = await api.get("/auth/captcha");
      setCaptchaData(res.data);
      setCaptchaText("");
    } catch (err: any) {
      toast.error("Failed to load CAPTCHA challenge. Please refresh.");
    } finally {
      setCaptchaLoading(false);
    }
  };

  // Run countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendTimer]);

  // Load CAPTCHA initially
  useEffect(() => {
    if (activeTab === "customer") {
      fetchCaptcha();
    }
  }, [activeTab]);

  // Handle Customer Form Submit
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation
    const check = customerSchema.safeParse({ email, password, captchaText });
    if (!check.success) {
      const errorMsg = check.error.issues[0].message;
      toast.error(errorMsg);
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email,
        password,
        captchaId: captchaData?.captchaId,
        captchaText,
      });

      const { user, token } = res.data;
      login(
        {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token
      );

      toast.success(`Welcome back, ${user.name}!`);
      router.push("/");
    } catch (err: any) {
      // Regisiter failure, reload captcha challenge
      fetchCaptcha();
      const message = err?.response?.data?.message || "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Send OTP request
  const handleAdminSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const check = adminSendOtpSchema.safeParse({ email, password });
    if (!check.success) {
      const errorMsg = check.error.issues[0].message;
      toast.error(errorMsg);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/admin/send-otp", { email, password });
      toast.success(res.data.message || "OTP sent successfully!");
      setAdminStep(2);
      setResendTimer(60); // Start 60s cooldown
    } catch (err: any) {
      const message = err?.response?.data?.message || "Verification failed. Check credentials.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Login submission with OTP
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const check = adminLoginSchema.safeParse({ email, password, otp });
    if (!check.success) {
      const errorMsg = check.error.issues[0].message;
      toast.error(errorMsg);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/admin/login", { email, password, otp });

      const { user, token } = res.data;
      login(
        {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token
      );

      toast.success(`Welcome, Admin ${user.name}!`);
      router.push("/admin");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Login failed. Invalid OTP.";
      toast.error(message);
      
      // Invalidate on threshold failure: if OTP gets cleared on backend, reset step
      if (message.includes("invalidated") || message.includes("expired")) {
        setAdminStep(1);
        setOtp("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24 min-h-[90vh] flex items-center justify-center bg-gradient-to-tr from-[#fbf8f0] via-[#fcfaf2] to-[#fffefc] relative overflow-hidden px-4">
      {/* Dynamic luxury background shapes */}
      <div className="absolute top-0 left-0 w-72 h-72 md:w-96 md:h-96 bg-[#D4AF37]/5 rounded-full filter blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 md:w-[450px] md:h-[450px] bg-[#B8860B]/5 rounded-full filter blur-[100px] md:blur-[140px] pointer-events-none" />

      <div className="container-custom flex justify-center w-full relative z-10">
        <div className="w-full max-w-[460px] bg-white rounded-3xl border border-[#d4af37]/15 p-6 sm:p-8 md:p-10 shadow-[0_20px_50px_rgba(212,175,55,0.06)]">
          
          {/* Brand Logo and Title */}
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <div className="transform hover:scale-[1.03] transition-transform duration-300">
              <Logo className="mx-auto" />
            </div>
            
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-serif mt-5">
              Kaumudi Portal
            </h1>
            <p className="text-gray-400 mt-1 text-xs uppercase tracking-wider font-semibold">
              Enterprise Secure Login
            </p>
          </div>

          {/* Luxury Tab Switcher */}
          <div className="grid grid-cols-2 bg-gray-50 border border-gray-100 rounded-xl p-1.5 mb-6 text-sm">
            <button
              onClick={() => {
                setActiveTab("customer");
                setEmail("");
                setPassword("");
                setOtp("");
                setAdminStep(1);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                activeTab === "customer"
                  ? "bg-white text-[#b8860b] shadow-[0_4px_12px_rgba(184,134,11,0.06)] border border-[#d4af37]/10"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <UserCheck size={16} />
              <span>Customer</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("admin");
                setEmail("");
                setPassword("");
                setOtp("");
                setAdminStep(1);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                activeTab === "admin"
                  ? "bg-white text-[#b8860b] shadow-[0_4px_12px_rgba(184,134,11,0.06)] border border-[#d4af37]/10"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <ShieldCheck size={16} />
              <span>Admin Portal</span>
            </button>
          </div>

          {/* Customer Login Form */}
          {activeTab === "customer" && (
            <form onSubmit={handleCustomerLogin} className="space-y-5">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#b8860b]/60">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/40 border border-gray-200/80 rounded-xl outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 focus:bg-white transition-all duration-300 text-sm text-gray-800 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[#b8860b] hover:text-[#d4af37] transition-colors font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#b8860b]/60">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-11 py-3 bg-gray-50/40 border border-gray-200/80 rounded-xl outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 focus:bg-white transition-all duration-300 text-sm text-gray-800 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#b8860b] transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* CAPTCHA challenge */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Verify CAPTCHA
                </label>
                <div className="flex items-center gap-3">
                  {/* CAPTCHA SVG Display */}
                  <div 
                    className="flex-grow h-[50px] bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden min-w-[180px]"
                    dangerouslySetInnerHTML={{ __html: captchaData?.captchaSvg || "" }}
                  />
                  
                  {/* Refresh Button */}
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    disabled={captchaLoading}
                    className="p-3 bg-gray-50 hover:bg-gray-100/80 border border-gray-200 rounded-xl transition-all duration-300 disabled:opacity-50 text-gray-500 hover:text-[#b8860b] flex items-center justify-center h-[50px] w-[50px]"
                    title="Refresh CAPTCHA"
                  >
                    <RefreshCw size={18} className={captchaLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                {/* Input Text Box */}
                <input
                  type="text"
                  maxLength={6}
                  value={captchaText}
                  onChange={(e) => setCaptchaText(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="Enter 6-Character Captcha Code"
                  required
                  className="w-full px-4 py-3 bg-gray-50/40 border border-gray-200/80 rounded-xl outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 focus:bg-white transition-all duration-300 text-sm text-gray-800 font-mono tracking-widest text-center uppercase placeholder:font-sans placeholder:tracking-normal"
                />
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white py-3.5 rounded-xl font-semibold text-sm tracking-wider uppercase shadow-[0_4px_14px_0_rgba(212,175,55,0.25)] hover:shadow-[0_6px_20px_0_rgba(184,134,11,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center min-h-[48px] cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying...</span>
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          )}

          {/* Admin Login Form */}
          {activeTab === "admin" && (
            <form onSubmit={adminStep === 1 ? handleAdminSendOtp : handleAdminLogin} className="space-y-5">
              {/* Step 1 Fields: Email & Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Admin Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#b8860b]/60">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kaumudi.com"
                    required
                    disabled={adminStep === 2}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/40 border border-gray-200/80 rounded-xl outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 focus:bg-white transition-all duration-300 text-sm text-gray-800 placeholder:text-gray-400 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#b8860b]/60">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={adminStep === 2}
                    className="w-full pl-11 pr-11 py-3 bg-gray-50/40 border border-gray-200/80 rounded-xl outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 focus:bg-white transition-all duration-300 text-sm text-gray-800 placeholder:text-gray-400 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={adminStep === 2}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#b8860b] transition-colors focus:outline-none disabled:opacity-40"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Step 2: OTP Entry Field */}
              {adminStep === 2 && (
                <div className="space-y-1.5 bg-[#fffdf5] border border-[#d4af37]/10 p-4 rounded-2xl animate-[fadeInSlideDown_0.3s_ease-out]">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1">
                      <KeyRound size={13} className="text-[#b8860b]" />
                      <span>Enter 6-Digit Email OTP</span>
                    </label>
                    <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 border border-gray-100 rounded-full font-medium">
                      Expires in 5m
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    className="w-full px-4 py-3 bg-white border border-[#d4af37]/25 rounded-xl outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 transition-all duration-300 text-sm text-gray-800 font-mono tracking-widest text-center"
                  />

                  {/* Resend Helper Action */}
                  <div className="flex justify-between items-center mt-2.5 text-xs">
                    <span className="text-gray-400">Didn&apos;t receive it?</span>
                    {resendTimer > 0 ? (
                      <span className="text-gray-500 font-medium bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAdminSendOtp}
                        className="text-[#b8860b] hover:text-[#d4af37] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="space-y-3 pt-2">
                {adminStep === 1 ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white py-3.5 rounded-xl font-semibold text-sm tracking-wider uppercase shadow-[0_4px_14px_0_rgba(212,175,55,0.25)] hover:shadow-[0_6px_20px_0_rgba(184,134,11,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center min-h-[48px] cursor-pointer"
                  >
                    {loading ? "Verifying Credentials..." : "Send OTP"}
                  </button>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminStep(1);
                        setOtp("");
                      }}
                      className="col-span-1 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center justify-center min-h-[48px]"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="col-span-2 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white py-3.5 rounded-xl font-semibold text-sm tracking-wider uppercase shadow-[0_4px_14px_0_rgba(212,175,55,0.25)] hover:shadow-[0_6px_20px_0_rgba(184,134,11,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center min-h-[48px] cursor-pointer"
                    >
                      {loading ? "Verifying OTP..." : "Admin Login"}
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* Optional Divider & Back to Shop */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-gray-100"></div>
            <span className="absolute bg-white px-4 text-[10px] uppercase tracking-[0.25em] text-gray-400 font-semibold">
              OR
            </span>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
              Don&apos;t have an account?
            </p>
            <Link
              href="/register"
              className="block w-full py-3 px-4 border border-[#d4af37]/80 text-[#b8860b] hover:text-[#d4af37] rounded-xl text-center text-xs font-semibold uppercase tracking-wider hover:bg-[#fff8e7]/30 hover:border-[#b8860b] active:scale-[0.99] transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
