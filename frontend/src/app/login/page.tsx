"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

import api from "@/lib/api";
import Logo from "@/components/ui/Logo";

import {
  loginSchema,
  LoginFormData,
} from "@/lib/validations/auth";

import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);

      const res = await api.post("/auth/login", data);

      // Backend returns: { user: { _id, name, email, role }, token }
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

      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      toast.error(
        apiError?.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24 min-h-[90vh] flex items-center justify-center bg-gradient-to-tr from-[#fbf8f0] via-[#fcfaf2] to-[#fffefc] relative overflow-hidden px-4">
      {/* Client-safe CSS styling for premium animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-card {
          animation: fadeInSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-error {
          animation: fadeInSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Decorative luxury background shapes */}
      <div className="absolute top-0 left-0 w-72 h-72 md:w-96 md:h-96 bg-[#D4AF37]/5 rounded-full filter blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 md:w-[450px] md:h-[450px] bg-[#B8860B]/5 rounded-full filter blur-[100px] md:blur-[140px] pointer-events-none" />

      <div className="container-custom flex justify-center w-full relative z-10">
        {/* Centered Authentication Card */}
        <div className="w-full max-w-[440px] bg-white rounded-3xl border border-[#d4af37]/15 p-6 sm:p-8 md:p-10 shadow-[0_20px_50px_rgba(212,175,55,0.06)] animate-card">
          
          {/* Header */}
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <div className="transform hover:scale-[1.03] transition-transform duration-300 -mt-2">
              <Logo className="mx-auto" />
            </div>
            
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-serif mt-5">
              Welcome Back
            </h1>
            <p className="text-gray-400 mt-1 text-xs">
              Login to continue shopping with KAUMUDI.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email-input" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#b8860b]/60">
                  <Mail size={18} />
                </span>
                <input
                  id="email-input"
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/40 border border-gray-200/80 rounded-xl outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 focus:bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] hover:border-gray-300 transition-all duration-300 text-sm placeholder:text-gray-400 text-gray-800"
                  aria-invalid={errors.email ? "true" : "false"}
                />
              </div>
              {errors.email && (
                <div className="animate-error">
                  <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1.5 font-medium">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{errors.email.message}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password-input" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-gray-50/40 border border-gray-200/80 rounded-xl outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 focus:bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] hover:border-gray-300 transition-all duration-300 text-sm placeholder:text-gray-400 text-gray-800"
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#b8860b] transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div className="animate-error">
                  <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1.5 font-medium">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{errors.password.message}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white py-3.5 rounded-xl font-semibold text-sm tracking-wider uppercase shadow-[0_4px_14px_0_rgba(212,175,55,0.25)] hover:shadow-[0_6px_20px_0_rgba(184,134,11,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none disabled:transform-none disabled:shadow-none cursor-pointer flex items-center justify-center min-h-[48px]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                "Login"
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="w-full border-t border-gray-100"></div>
              <span className="absolute bg-white px-4 text-[10px] uppercase tracking-[0.25em] text-gray-400 font-semibold">
                OR
              </span>
            </div>

            {/* Create Account Section */}
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
          </form>
        </div>
      </div>
    </section>
  );
}

