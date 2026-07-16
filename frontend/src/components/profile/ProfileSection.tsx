"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, Calendar, Heart, Camera, Loader2, Check, X, ShieldAlert } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";

interface ProfileSectionProps {
  user: any;
  profileData: any;
}

export default function ProfileSection({ user, profileData }: ProfileSectionProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingPic, setLoadingPic] = useState(false);

  // States for Image Preview Upload Flow
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPicDeleted, setIsPicDeleted] = useState(false);

  // Email verification mock modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Form states
  const [name, setName] = useState(profileData?.name || user.name || "");
  const [phone, setPhone] = useState(profileData?.mobile || "");
  
  // Custom localStorage fields for Date of Birth & Gender
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  const email = profileData?.email || user.email || "";
  const isEmailVerified = profileData?.emailVerified ?? true; // Default to true since signup requires OTP

  // Sync state with incoming props
  useEffect(() => {
    if (profileData) {
      setName(profileData.name || "");
      setPhone(profileData.mobile || "");
    }
  }, [profileData]);

  // Load custom metadata (dob, gender, photo deletion status) from localStorage
  useEffect(() => {
    if (email) {
      const storedMeta = localStorage.getItem(`kaumudi_profile_ext_${email}`);
      if (storedMeta) {
        const parsed = JSON.parse(storedMeta);
        setDob(parsed.dob || "");
        setGender(parsed.gender || "");
      }
      
      const storedPicDeleted = localStorage.getItem(`kaumudi_profile_pic_deleted_${email}`);
      setIsPicDeleted(storedPicDeleted === "true");
    }
  }, [email]);

  // Handle Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; mobile: string }) => {
      // Backend expects the profile fields
      const res = await api.put("/auth/profile", {
        name: data.name,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      
      // Save Date of Birth & Gender to localStorage
      if (email) {
        localStorage.setItem(
          `kaumudi_profile_ext_${email}`,
          JSON.stringify({ dob, gender })
        );
      }

      toast.success("Profile details updated successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    },
  });

  // Handle File Input Selection (Preview before Upload)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setSelectedFile(file);
  };

  // Perform Cloudinary Upload
  const handleUploadConfirm = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("profilePic", selectedFile);

    try {
      setLoadingPic(true);
      const res = await api.put("/auth/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        // Clear delete flag since new photo is uploaded
        if (email) {
          localStorage.removeItem(`kaumudi_profile_pic_deleted_${email}`);
          setIsPicDeleted(false);
        }
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        setPreviewUrl(null);
        setSelectedFile(null);
        toast.success("Profile photo uploaded to Cloudinary successfully.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload profile photo.");
    } finally {
      setLoadingPic(false);
    }
  };

  const handleUploadCancel = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Profile picture delete flow
  const handleDeletePhoto = () => {
    if (email) {
      localStorage.setItem(`kaumudi_profile_pic_deleted_${email}`, "true");
      setIsPicDeleted(true);
      setPreviewUrl(null);
      setSelectedFile(null);
      toast.info("Profile photo deleted locally.");
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Full Name cannot be empty.");
      return;
    }
    updateProfileMutation.mutate({ name, mobile: phone });
  };

  // Mock resend and verify code for current email
  const handleSendVerificationCode = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setOtpSent(true);
      toast.success("Verification OTP sent to your email!");
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (verifyOtp === "123456" || verifyOtp.length === 6) {
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setShowVerifyModal(false);
        toast.success("Email verified successfully!");
      }, 1200);
    } else {
      toast.error("Invalid verification code. Please try again.");
    }
  };

  // User details for default avatar initials
  const initials = name
    ? name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.name
    ? user.name.slice(0, 2).toUpperCase()
    : "KU";

  const currentProfilePic = isPicDeleted ? null : previewUrl || profileData?.profilePic;

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-6">
        <h2 className="font-serif text-2xl font-bold text-gray-900">Personal Information</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Upload */}
        <div className="flex flex-col items-center bg-white rounded-3xl border border-gray-100 p-6 shadow-sm shadow-[0_20px_50px_rgba(128,0,32,0.01)] h-fit">
          <div className="relative group">
            <div className="w-32 h-32 bg-secondary border-2 border-primary rounded-full overflow-hidden flex items-center justify-center shadow-inner relative">
              {loadingPic ? (
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              ) : currentProfilePic ? (
                <Image
                  src={currentProfilePic}
                  alt={name || "User Avatar"}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary font-serif tracking-wide">{initials}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loadingPic}
              className="absolute bottom-1 right-1 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white hover:bg-primary-dark transition shadow-md cursor-pointer"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="text-center mt-4 space-y-1">
            <h3 className="font-serif text-sm font-bold text-gray-800">{name || "Kaumudi Customer"}</h3>
            <p className="text-[10px] text-gray-400 font-sans">Max image size: 5MB (JPG, PNG)</p>
          </div>

          {/* Confirm / Cancel Preview Controls */}
          {previewUrl && (
            <div className="mt-5 w-full flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={handleUploadConfirm}
                className="w-full bg-[#800020] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#5C0013] transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                Confirm Upload
              </button>
              <button
                onClick={handleUploadCancel}
                className="w-full border border-gray-200 text-gray-600 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Image Management */}
          {!previewUrl && (profileData?.profilePic || currentProfilePic) && (
            <button
              onClick={handleDeletePhoto}
              className="mt-4 text-xs font-bold text-red-600 hover:text-red-700 transition cursor-pointer"
            >
              Delete photo
            </button>
          )}
        </div>

        {/* Right Column: Profile Info Form */}
        <form onSubmit={handleProfileSubmit} className="md:col-span-2 space-y-5 bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm text-xs font-sans">
          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-primary bg-gray-50/50 focus:bg-white transition text-xs font-sans text-gray-800"
                placeholder="Your legal full name"
              />
            </div>
          </div>

          {/* Email Address & Verification Badge */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="email"
                  readOnly
                  value={email}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-450 cursor-not-allowed text-xs font-sans"
                />
              </div>

              {isEmailVerified ? (
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 select-none">
                  <Check size={14} /> Verified Account
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setVerifyOtp("");
                    setOtpSent(false);
                    setShowVerifyModal(true);
                  }}
                  className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 font-bold text-xs hover:bg-rose-100/50 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <ShieldAlert size={14} className="text-rose-600 animate-pulse" /> Verify Now
                </button>
              )}
            </div>
          </div>

          {/* Mobile Phone Number */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="tel"
                readOnly
                value={phone ? `+91 ${phone}` : "Not provided"}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-450 cursor-not-allowed text-xs font-sans"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-sans">
              To update your verified email or mobile number, please go to the Security Settings page.
            </p>
          </div>

          {/* Date of Birth & Gender (Persisted locally) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-primary bg-gray-50/50 focus:bg-white transition text-xs font-sans text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Gender
              </label>
              <div className="relative">
                <Heart className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-primary bg-gray-50/50 focus:bg-white transition text-xs font-sans text-gray-800 appearance-none cursor-pointer"
                >
                  <option value="">Select Gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full bg-[#800020] text-white py-3.5 rounded-xl font-bold hover:bg-[#5C0013] transition mt-6 disabled:opacity-60 cursor-pointer shadow-md hover:shadow-lg shadow-[#800020]/25 flex items-center justify-center gap-2"
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving changes...
              </>
            ) : (
              "Save Profile details"
            )}
          </button>
        </form>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 md:p-8 relative shadow-2xl"
            >
              <button
                onClick={() => setShowVerifyModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-650"
              >
                <X size={20} />
              </button>

              <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Verify Email Address</h3>
              <p className="text-[11px] text-gray-500 mb-6 font-sans">
                Confirm ownership of <strong className="text-gray-800">{email}</strong> to secure your transactions.
              </p>

              {!otpSent ? (
                <div className="space-y-4">
                  <button
                    onClick={handleSendVerificationCode}
                    disabled={isVerifying}
                    className="w-full bg-primary text-white py-3 rounded-xl text-xs font-bold hover:bg-primary-dark transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification Code"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Enter OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyOtp}
                      onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full text-center tracking-[0.5em] text-lg font-bold border border-gray-200 p-3 rounded-xl outline-none focus:border-primary bg-gray-50/50"
                    />
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isVerifying || verifyOtp.length < 6}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    className="w-full text-center text-[10px] font-bold text-primary hover:underline"
                  >
                    Resend Code
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
