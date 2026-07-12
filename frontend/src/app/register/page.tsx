"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import api from "@/lib/api";

import {
  registerSchema,
  RegisterFormData,
} from "@/lib/validations/auth";

import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  // OTP Verification States
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  
  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [verifyingMobileOtp, setVerifyingMobileOtp] = useState(false);
  
  const [emailTimer, setEmailTimer] = useState(0);
  const [mobileTimer, setMobileTimer] = useState(0);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country: "India",
    }
  });

  // Countdown timers
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailTimer > 0) {
      interval = setInterval(() => {
        setEmailTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mobileTimer > 0) {
      interval = setInterval(() => {
        setMobileTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mobileTimer]);

  // Send OTP handler
  const sendEmailOtpFunc = async (email: string) => {
    try {
      setSendingEmailOtp(true);
      await api.post("/auth/send-email-otp", { email });
      setEmailOtpSent(true);
      setEmailTimer(60);
      toast.success("OTP sent to your email address.");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to send email OTP."
      );
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const sendMobileOtpFunc = async (mobile: string) => {
    try {
      setSendingMobileOtp(true);
      await api.post("/auth/send-mobile-otp", { mobile });
      setMobileOtpSent(true);
      setMobileTimer(60);
      toast.success("OTP sent to your mobile number.");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to send mobile OTP."
      );
    } finally {
      setSendingMobileOtp(false);
    }
  };

  const handleSendOTPs = async () => {
    // Validate main credentials and contacts first before sending OTPs
    const isValid = await trigger(["name", "email", "mobile", "password", "confirmPassword"]);
    if (!isValid) {
      toast.error("Please fill in all account details correctly first.");
      return;
    }

    const { email, mobile } = getValues();
    
    // Trigger OTP dispatches
    await Promise.all([
      sendEmailOtpFunc(email),
      sendMobileOtpFunc(mobile)
    ]);
  };

  // Verify OTP handler
  const verifyEmailOtpFunc = async () => {
    if (emailOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit email OTP.");
      return;
    }
    try {
      setVerifyingEmailOtp(true);
      const email = getValues("email");
      await api.post("/auth/verify-email-otp", { email, otp: emailOtp });
      setEmailVerified(true);
      toast.success("Email verified successfully!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Email verification failed. Please try again."
      );
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const verifyMobileOtpFunc = async () => {
    if (mobileOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit mobile OTP.");
      return;
    }
    try {
      setVerifyingMobileOtp(true);
      const mobile = getValues("mobile");
      await api.post("/auth/verify-mobile-otp", { mobile, otp: mobileOtp });
      setMobileVerified(true);
      toast.success("Mobile verified successfully!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Mobile verification failed. Please try again."
      );
    } finally {
      setVerifyingMobileOtp(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!emailVerified) {
      toast.error("Please verify your email OTP before registering.");
      return;
    }
    if (!mobileVerified) {
      toast.error("Please verify your mobile OTP before registering.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        password: data.password,
        confirmPassword: data.confirmPassword,
        houseNumber: data.houseNumber,
        street: data.street,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
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

      toast.success(`Welcome to Kaumudi, ${user.name}!`);
      router.push("/");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 min-h-[90vh] flex items-center bg-gray-50/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">Create Account</h1>
            <p className="text-gray-500 mt-2 text-sm md:text-base">
              Join Kaumudi and discover our luxury saree collections
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Account Info */}
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
                  Account details
                </h2>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Full Name
                  </label>
                  <input
                    {...register("name")}
                    placeholder="Priya Sharma"
                    suppressHydrationWarning
                    className="w-full border border-gray-250 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition text-sm"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Email Address
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="you@example.com"
                    disabled={emailVerified}
                    suppressHydrationWarning
                    className="w-full border border-gray-250 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Mobile Number (Indian)
                  </label>
                  <input
                    {...register("mobile")}
                    type="tel"
                    placeholder="9876543210"
                    disabled={mobileVerified}
                    suppressHydrationWarning
                    className="w-full border border-gray-250 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  {errors.mobile && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.mobile.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    {...register("password")}
                    placeholder="Min. 8 characters"
                    suppressHydrationWarning
                    className="w-full border border-gray-250 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition text-sm"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    {...register("confirmPassword")}
                    placeholder="Repeat password"
                    suppressHydrationWarning
                    className="w-full border border-gray-250 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition text-sm"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Address Details */}
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
                  Delivery Address
                </h2>

                {/* House/Flat */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    House / Flat / Block No.
                  </label>
                  <input
                    {...register("houseNumber")}
                    placeholder="Flat 302, Royal Enclave"
                    suppressHydrationWarning
                    className="w-full border border-gray-250 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition text-sm"
                  />
                  {errors.houseNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.houseNumber.message}
                    </p>
                  )}
                </div>

                {/* Street/Area */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Street / Area / Locality
                  </label>
                  <input
                    {...register("street")}
                    placeholder="Ring Road, Textile Market"
                    suppressHydrationWarning
                    className="w-full border border-gray-250 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition text-sm"
                  />
                  {errors.street && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.street.message}
                    </p>
                  )}
                </div>

                {/* Landmark */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Landmark (Optional)
                  </label>
                  <input
                    {...register("landmark")}
                    placeholder="Near Golden Plaza"
                    suppressHydrationWarning
                    className="w-full border border-gray-250 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition text-sm"
                  />
                  {errors.landmark && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.landmark.message}
                    </p>
                  )}
                </div>

                {/* City & State Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      City
                    </label>
                    <input
                      {...register("city")}
                      placeholder="Surat"
                      suppressHydrationWarning
                      className="w-full border border-gray-250 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition text-sm"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      State
                    </label>
                    <input
                      {...register("state")}
                      placeholder="Gujarat"
                      suppressHydrationWarning
                      className="w-full border border-gray-250 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition text-sm"
                    />
                    {errors.state && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Country & PIN Code Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Country
                    </label>
                    <input
                      {...register("country")}
                      placeholder="India"
                      suppressHydrationWarning
                      className="w-full border border-gray-250 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition text-sm"
                    />
                    {errors.country && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.country.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Postal Code / PIN
                    </label>
                    <input
                      {...register("postalCode")}
                      placeholder="395003"
                      suppressHydrationWarning
                      className="w-full border border-gray-250 p-3 rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition text-sm"
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.postalCode.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* OTP Verification Panel */}
            <div className="border-t border-gray-150 pt-8 mt-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Verify Your Contact Information
              </h2>

              {!emailOtpSent && !mobileOtpSent ? (
                <button
                  type="button"
                  onClick={handleSendOTPs}
                  disabled={sendingEmailOtp || sendingMobileOtp}
                  suppressHydrationWarning
                  className="w-full bg-[#fff8e7] border border-[#d4af37] text-[#b8860b] hover:bg-[#fff0c8] py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 disabled:opacity-60"
                >
                  {sendingEmailOtp || sendingMobileOtp ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#b8860b] border-t-transparent rounded-full animate-spin"></span>
                      Sending OTP Codes...
                    </span>
                  ) : (
                    "Send Verification OTPs"
                  )}
                </button>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Email OTP Verification box */}
                  <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50/30">
                    <label className="block text-sm font-semibold mb-2 text-gray-800">
                      Email OTP Verification
                    </label>
                    {emailVerified ? (
                      <div className="flex items-center gap-2 text-green-600 font-semibold py-2">
                        <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-xs text-green-700">✓</span>
                        Email Verified
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="6-digit OTP"
                            maxLength={6}
                            value={emailOtp}
                            suppressHydrationWarning
                            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                            className="w-full border border-gray-250 p-2.5 rounded-xl outline-none focus:border-[#d4af37] text-center tracking-widest text-lg font-semibold bg-white transition"
                          />
                          <button
                            type="button"
                            onClick={verifyEmailOtpFunc}
                            disabled={verifyingEmailOtp || emailOtp.length !== 6}
                            suppressHydrationWarning
                            className="bg-[#d4af37] hover:bg-[#b8860b] text-white px-5 rounded-xl font-semibold transition disabled:opacity-60 text-sm flex items-center justify-center"
                          >
                            {verifyingEmailOtp ? (
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              "Verify"
                            )}
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 px-1">
                          <span>Expires in 5 mins</span>
                          {emailTimer > 0 ? (
                            <span>Resend OTP in {emailTimer}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => sendEmailOtpFunc(getValues("email"))}
                              disabled={sendingEmailOtp}
                              suppressHydrationWarning
                              className="text-[#b8860b] hover:underline font-bold"
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile OTP Verification box */}
                  <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50/30">
                    <label className="block text-sm font-semibold mb-2 text-gray-800">
                      Mobile OTP Verification
                    </label>
                    {mobileVerified ? (
                      <div className="flex items-center gap-2 text-green-600 font-semibold py-2">
                        <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-xs text-green-700">✓</span>
                        Mobile Verified
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="6-digit OTP"
                            maxLength={6}
                            value={mobileOtp}
                            suppressHydrationWarning
                            onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ""))}
                            className="w-full border border-gray-250 p-2.5 rounded-xl outline-none focus:border-[#d4af37] text-center tracking-widest text-lg font-semibold bg-white transition"
                          />
                          <button
                            type="button"
                            onClick={verifyMobileOtpFunc}
                            disabled={verifyingMobileOtp || mobileOtp.length !== 6}
                            suppressHydrationWarning
                            className="bg-[#d4af37] hover:bg-[#b8860b] text-white px-5 rounded-xl font-semibold transition disabled:opacity-60 text-sm flex items-center justify-center"
                          >
                            {verifyingMobileOtp ? (
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              "Verify"
                            )}
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 px-1">
                          <span>Expires in 5 mins</span>
                          {mobileTimer > 0 ? (
                            <span>Resend OTP in {mobileTimer}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => sendMobileOtpFunc(getValues("mobile"))}
                              disabled={sendingMobileOtp}
                              suppressHydrationWarning
                              className="text-[#b8860b] hover:underline font-bold"
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Create Account Submission button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !emailVerified || !mobileVerified}
                suppressHydrationWarning
                className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white py-3.5 rounded-xl font-bold hover:from-[#b8860b] hover:to-[#996515] transition shadow-md shadow-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
              
              {(!emailVerified || !mobileVerified) && (emailOtpSent || mobileOtpSent) && (
                <p className="text-center text-red-500 text-xs mt-2.5 font-medium">
                  * Please verify both Email & Mobile OTPs to enable account creation.
                </p>
              )}
            </div>

            <p className="text-center text-sm text-gray-600 mt-2">
              Already have an account?
              <Link
                href="/login"
                className="text-[#b8860b] ml-1 font-bold hover:underline"
              >
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
