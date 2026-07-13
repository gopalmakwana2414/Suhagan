"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Save,
  Shield,
  Bell,
  Lock,
  User,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Trash2,
  AlertTriangle,
  History,
  Activity,
  LogOut,
  X,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"store" | "profile" | "sessions" | "audit">("store");

  // Store settings local state (preserved existing)
  const [storeInfo, setStoreInfo] = useState({
    storeName: "Kaumudi",
    email: "g91652251@gmail.com",
    phone: "+91 89594 65264",
    address: "Ring Road, Surat, Gujarat – 395002",
    freeShippingThreshold: 999,
    codAvailable: true,
    onlinePaymentAvailable: true,
  });

  const [notifications, setNotifications] = useState({
    newOrderEmail: true,
    lowStockAlert: true,
    newReviewAlert: true,
  });

  // Admin profile forms
  const [adminName, setAdminName] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [emailForm, setEmailForm] = useState({
    currentPassword: "",
    newEmail: "",
    otp: "",
  });
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  const [phoneForm, setPhoneForm] = useState({
    currentPassword: "",
    newPhone: "",
    otp: "",
  });
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/login");
    }
  }, [user, router]);

  // Fetch Admin Profile
  const { data: adminProfile } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: async () => {
      const res = await api.get("/admin/profile");
      setAdminName(res.data.user.name || "");
      return res.data.user;
    },
    enabled: !!user && user.role === "admin",
  });

  // Fetch Active Sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const res = await api.get("/admin/sessions");
      return res.data.sessions;
    },
    enabled: !!user && user.role === "admin" && activeTab === "sessions",
  });

  // Fetch Login History
  const { data: loginHistory = [] } = useQuery({
    queryKey: ["admin-login-history"],
    queryFn: async () => {
      const res = await api.get("/admin/login-history");
      return res.data.history;
    },
    enabled: !!user && user.role === "admin" && activeTab === "audit",
  });

  // Fetch Security Audit Logs
  const { data: securityLogs = [] } = useQuery({
    queryKey: ["admin-security-logs"],
    queryFn: async () => {
      const res = await api.get("/admin/security-logs");
      return res.data.logs;
    },
    enabled: !!user && user.role === "admin" && activeTab === "audit",
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.put("/admin/profile", { name });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
      // Sync store
      useAuthStore.setState({ user: data.user });
      toast.success("Profile details updated successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      const res = await api.put("/admin/change-password", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to change password.");
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: async (data: typeof emailForm) => {
      const res = await api.put("/admin/change-email", data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.otpRequired) {
        toast.success("Verification OTP sent to new email.");
        setEmailOtpSent(true);
      } else {
        queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
        // Sync store
        if (useAuthStore.getState().user) {
          useAuthStore.setState({ user: { ...useAuthStore.getState().user!, email: data.email } });
        }
        toast.success("Email address updated successfully.");
        setEmailOtpSent(false);
        setEmailForm({ currentPassword: "", newEmail: "", otp: "" });
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Operation failed.");
    },
  });

  const changePhoneMutation = useMutation({
    mutationFn: async (data: typeof phoneForm) => {
      const res = await api.put("/admin/change-phone", data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.otpRequired) {
        toast.success("Verification OTP sent to new phone.");
        setPhoneOtpSent(true);
      } else {
        queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
        toast.success("Mobile number updated successfully.");
        setPhoneOtpSent(false);
        setPhoneForm({ currentPassword: "", newPhone: "", otp: "" });
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Operation failed.");
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/session/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
      toast.success("Session revoked successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to revoke session.");
    },
  });

  const logoutAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/admin/logout-all");
      return res.data;
    },
    onSuccess: () => {
      logout();
      router.push("/login");
      toast.success("Logged out from all devices successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to logout from all devices.");
    },
  });

  const handleSaveStore = () => {
    toast.success("Store settings updated successfully.");
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="text-gray-400" size={18} />;
      case "tablet":
        return <Tablet className="text-gray-400" size={18} />;
      case "desktop":
      default:
        return <Monitor className="text-gray-400" size={18} />;
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-[#b8860b]">Settings & Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure Kaumudi settings, manage active login sessions, and monitor security logs.
        </p>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("store")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition ${
            activeTab === "store"
              ? "border-[#d4af37] text-[#b8860b]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Store size={16} /> Store Config
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition ${
            activeTab === "profile"
              ? "border-[#d4af37] text-[#b8860b]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <User size={16} /> Admin Profile
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition relative ${
            activeTab === "sessions"
              ? "border-[#d4af37] text-[#b8860b]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Laptop size={16} /> Active Sessions
          {sessions.length > 0 && (
            <span className="absolute top-2 right-0 bg-red-500 text-white rounded-full text-[9px] font-bold w-4 h-4 flex items-center justify-center">
              {sessions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition ${
            activeTab === "audit"
              ? "border-[#d4af37] text-[#b8860b]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Shield size={16} /> Security Audit
        </button>
      </div>

      {/* Tab 1: Store Configuration */}
      {activeTab === "store" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <Store size={20} className="text-[#d4af37]" />
              <h2 className="text-lg font-semibold text-gray-800">Store Information</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Store Name</label>
                <input
                  value={storeInfo.storeName}
                  onChange={(e) => setStoreInfo({ ...storeInfo, storeName: e.target.value })}
                  className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Contact Email</label>
                <input
                  value={storeInfo.email}
                  onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                  className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Contact Phone</label>
                <input
                  value={storeInfo.phone}
                  onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                  className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  value={storeInfo.freeShippingThreshold}
                  onChange={(e) =>
                    setStoreInfo({ ...storeInfo, freeShippingThreshold: Number(e.target.value) })
                  }
                  className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Store Address</label>
                <textarea
                  value={storeInfo.address}
                  onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                  rows={2}
                  className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] resize-none bg-gray-50/50"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield size={20} className="text-[#d4af37]" />
              <h2 className="text-lg font-semibold text-gray-800">Payment Methods</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700">Cash on Delivery (COD)</span>
                <input
                  type="checkbox"
                  checked={storeInfo.codAvailable}
                  onChange={(e) => setStoreInfo({ ...storeInfo, codAvailable: e.target.checked })}
                  className="accent-[#d4af37] w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700">Online Payments (Razorpay)</span>
                <input
                  type="checkbox"
                  checked={storeInfo.onlinePaymentAvailable}
                  onChange={(e) =>
                    setStoreInfo({ ...storeInfo, onlinePaymentAvailable: e.target.checked })
                  }
                  className="accent-[#d4af37] w-5 h-5"
                />
              </label>
            </div>
          </div>

          <button
            onClick={handleSaveStore}
            className="flex items-center gap-2 bg-[#d4af37] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition shadow-sm"
          >
            <Save size={16} /> Save Settings
          </button>
        </div>
      )}

      {/* Tab 2: Admin Profile Management */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          
          {/* Admin Profile Picture and Details */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#fff8e7] border border-[#d4af37] rounded-full flex items-center justify-center font-bold text-[#b8860b] text-xl shadow-inner">
                {adminName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{adminName}</h3>
                <p className="text-gray-400 text-sm mt-0.5">{adminProfile?.email}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={() => {
                  const newName = prompt("Enter new name:", adminName);
                  if (newName) updateProfileMutation.mutate(newName);
                }}
                disabled={updateProfileMutation.isPending}
                className="border border-[#d4af37] text-[#b8860b] px-4 py-2.5 rounded-xl font-semibold hover:bg-[#fff8e7] transition text-sm shadow-sm"
              >
                Update Name
              </button>
            </div>
          </div>

          {/* Change Password Panel */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2"><Lock size={18} className="text-[#d4af37]" /> Change Admin Password</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                changePasswordMutation.mutate(passwordForm);
              }}
              className="grid sm:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50 text-sm"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="bg-[#d4af37] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#b8860b] transition disabled:opacity-60 text-sm shadow-sm"
                >
                  {changePasswordMutation.isPending ? "Updating..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>

          {/* Change Email Panel */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2"><Mail size={18} className="text-[#d4af37]" /> Change Admin Email</h3>
            
            {!emailOtpSent ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  changeEmailMutation.mutate({
                    currentPassword: emailForm.currentPassword,
                    newEmail: emailForm.newEmail,
                    otp: "",
                  });
                }}
                className="grid sm:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">New Email Address</label>
                  <input
                    type="email"
                    required
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                    placeholder="admin-new@kaumudi.com"
                    className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={changeEmailMutation.isPending}
                    className="bg-[#d4af37] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#b8860b] transition disabled:opacity-60 text-sm shadow-sm"
                  >
                    Request OTP Verification
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  changeEmailMutation.mutate(emailForm);
                }}
                className="space-y-4 max-w-sm"
              >
                <div className="p-3 bg-[#fff8e7] border border-[#d4af37]/25 text-xs rounded-xl text-gray-600">
                  Verification OTP code sent to <strong>{emailForm.newEmail}</strong>.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Enter Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={emailForm.otp}
                    onChange={(e) => setEmailForm({ ...emailForm, otp: e.target.value.replace(/\D/g, "") })}
                    className="w-full text-center tracking-[0.5em] text-lg font-bold border p-3 rounded-xl focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={changeEmailMutation.isPending}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition text-sm shadow-sm"
                  >
                    Verify & Update Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailOtpSent(false)}
                    className="border px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition text-sm text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Change Phone Panel */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2"><Phone size={18} className="text-[#d4af37]" /> Change Admin Phone</h3>
            
            {!phoneOtpSent ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  changePhoneMutation.mutate({
                    currentPassword: phoneForm.currentPassword,
                    newPhone: phoneForm.newPhone,
                    otp: "",
                  });
                }}
                className="grid sm:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={phoneForm.currentPassword}
                    onChange={(e) => setPhoneForm({ ...phoneForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">New Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={phoneForm.newPhone}
                    onChange={(e) => setPhoneForm({ ...phoneForm, newPhone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={changePhoneMutation.isPending}
                    className="bg-[#d4af37] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#b8860b] transition disabled:opacity-60 text-sm shadow-sm"
                  >
                    Request OTP Verification
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  changePhoneMutation.mutate(phoneForm);
                }}
                className="space-y-4 max-w-sm"
              >
                <div className="p-3 bg-[#fff8e7] border border-[#d4af37]/25 text-xs rounded-xl text-gray-600">
                  Verification OTP code sent to <strong>{phoneForm.newPhone}</strong>.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Enter Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={phoneForm.otp}
                    onChange={(e) => setPhoneForm({ ...phoneForm, otp: e.target.value.replace(/\D/g, "") })}
                    className="w-full text-center tracking-[0.5em] text-lg font-bold border p-3 rounded-xl focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={changePhoneMutation.isPending}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition text-sm shadow-sm"
                  >
                    Verify & Update Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneOtpSent(false)}
                    className="border px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition text-sm text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      )}

      {/* Tab 3: Session Management */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Active Login Sessions</h2>
                <p className="text-xs text-gray-400 mt-1">Review currently logged-in devices. Terminate any unknown logins.</p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to log out from all devices?")) {
                    logoutAllMutation.mutate();
                  }
                }}
                className="flex items-center gap-1.5 border border-red-200 text-red-600 px-4 py-2 rounded-xl font-semibold hover:bg-red-50 transition text-xs shadow-sm"
              >
                <LogOut size={14} /> Logout All Devices
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {sessions.map((sess: any) => (
                <div key={sess._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border shrink-0">
                      {getDeviceIcon(sess.device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm">
                          {sess.browser} on {sess.os}
                        </span>
                        {sess.isCurrent && (
                          <span className="text-[9px] bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold uppercase">
                            Current Device
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5 flex-wrap">
                        <span>IP: <strong className="text-gray-600">{sess.ipAddress}</strong></span>
                        <span>•</span>
                        <span>Logged in: {new Date(sess.loginTime).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</span>
                        <span>•</span>
                        <span>Activity: {new Date(sess.lastActivity).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</span>
                      </div>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      onClick={() => revokeSessionMutation.mutate(sess._id)}
                      className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition"
                      title="Terminate session"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Logs & Login History */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          
          {/* Security Log Table */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity size={20} className="text-[#d4af37]" />
              <h2 className="text-lg font-semibold text-gray-800">Critical Security Audit Logs</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Action performed</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Agent / Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {securityLogs.slice(0, 50).map((log: any) => (
                    <tr key={log._id} className="hover:bg-gray-50 text-gray-600 font-medium">
                      <td className="p-3 whitespace-nowrap text-gray-400">
                        {new Date(log.time).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="p-3 font-semibold text-gray-800">
                        {log.user ? `${log.user.name} (${log.user.role})` : "Guest"}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action?.includes("Failed") || log.action?.includes("Locked")
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{log.ip}</td>
                      <td className="p-3 max-w-[150px] truncate">{log.device}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Login History Table */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <History size={20} className="text-[#d4af37]" />
              <h2 className="text-lg font-semibold text-gray-800">Recent Login History</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="p-3">Time</th>
                    <th className="p-3">Credential/User</th>
                    <th className="p-3">Result</th>
                    <th className="p-3">IP (Country)</th>
                    <th className="p-3">Device / Browser</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loginHistory.slice(0, 50).map((hist: any) => (
                    <tr key={hist._id} className="hover:bg-gray-50 text-gray-600 font-medium">
                      <td className="p-3 whitespace-nowrap text-gray-400">
                        {new Date(hist.time).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3 font-semibold text-gray-800">
                        {hist.user ? `${hist.user.name} (${hist.user.email})` : hist.email}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          hist.success ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                        }`}>
                          {hist.success ? "Success" : "Failed"}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        {hist.ip} {hist.country && `(${hist.country})`}
                      </td>
                      <td className="p-3 truncate max-w-[150px]">{hist.device} / {hist.browser}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
