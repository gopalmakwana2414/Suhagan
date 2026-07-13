"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Lock,
  Camera,
  LogOut,
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  Check,
  Package,
  ChevronRight,
  Shield,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "orders">("profile");
  const [loadingPic, setLoadingPic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal controls
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePhone, setShowChangePhone] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    houseNumber: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
  });

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

  const [addressForm, setAddressForm] = useState({
    _id: "",
    name: "",
    mobile: "",
    houseNumber: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    isDefault: false,
  });

  // Redirect guest users
  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  // Fetch full user profile details from backend
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await api.get("/auth/profile");
      const u = res.data.user;
      setProfileForm({
        name: u.name || "",
        houseNumber: u.houseNumber || "",
        street: u.street || "",
        landmark: u.landmark || "",
        city: u.city || "",
        state: u.state || "",
        country: u.country || "India",
        postalCode: u.postalCode || "",
      });
      // Sync authStore state
      useAuthStore.setState({ user: u });
      return u;
    },
    enabled: !!user,
  });

  // Fetch saved addresses
  const { data: addresses = [], isLoading: loadingAddresses } = useQuery({
    queryKey: ["saved-addresses"],
    queryFn: async () => {
      const res = await api.get("/addresses");
      return res.data;
    },
    enabled: activeTab === "addresses",
  });

  // Fetch user orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data;
    },
    enabled: activeTab === "orders",
  });

  // Handle Log Out
  const handleLogout = () => {
    logout();
    router.push("/");
    toast.success("Logged out successfully.");
  };

  // Profile Picture Upload Handler
  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      setLoadingPic(true);
      const res = await api.put("/auth/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        toast.success("Profile picture updated successfully.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload profile picture.");
    } finally {
      setLoadingPic(false);
    }
  };

  // Update profile details
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const res = await api.put("/auth/profile", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success(data.message || "Profile updated successfully.");
      setShowEditProfile(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    },
  });

  // Change password
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      const res = await api.put("/auth/change-password", data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Password changed successfully.");
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to change password.");
    },
  });

  // Change Email send OTP
  const sendEmailOtpMutation = useMutation({
    mutationFn: async (data: Omit<typeof emailForm, "otp">) => {
      const res = await api.post("/auth/change-email/send-otp", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Verification code sent to your new email.");
      setEmailOtpSent(true);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to send verification code.");
    },
  });

  // Verify change email
  const verifyEmailChangeMutation = useMutation({
    mutationFn: async (data: typeof emailForm) => {
      const res = await api.put("/auth/change-email/verify", {
        newEmail: data.newEmail,
        otp: data.otp,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success(data.message || "Email address updated successfully.");
      setShowChangeEmail(false);
      setEmailOtpSent(false);
      setEmailForm({ currentPassword: "", newEmail: "", otp: "" });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Verification failed. Please check the code.");
    },
  });

  // Change Phone send OTP
  const sendPhoneOtpMutation = useMutation({
    mutationFn: async (data: Omit<typeof phoneForm, "otp">) => {
      const res = await api.post("/auth/change-phone/send-otp", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Verification code sent to your new mobile number.");
      setPhoneOtpSent(true);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to send verification code.");
    },
  });

  // Verify change phone
  const verifyPhoneChangeMutation = useMutation({
    mutationFn: async (data: typeof phoneForm) => {
      const res = await api.put("/auth/change-phone/verify", {
        newPhone: data.newPhone,
        otp: data.otp,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success(data.message || "Mobile number updated successfully.");
      setShowChangePhone(false);
      setPhoneOtpSent(false);
      setPhoneForm({ currentPassword: "", newPhone: "", otp: "" });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Verification failed. Please check the code.");
    },
  });

  // Saved Address Add/Edit Mutations
  const addressSaveMutation = useMutation({
    mutationFn: async (data: typeof addressForm) => {
      if (data._id) {
        // Edit Mode
        const res = await api.put(`/addresses/${data._id}`, data);
        return res.data;
      } else {
        // Create Mode
        const res = await api.post("/addresses", data);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      toast.success(addressForm._id ? "Address updated successfully." : "Address added successfully.");
      setShowAddressModal(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to save address.");
    },
  });

  // Delete Address
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/addresses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      toast.success("Address deleted successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete address.");
    },
  });

  // Set Address as Default
  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/addresses/default/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      toast.success("Default address updated.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update default address.");
    },
  });

  const openEditAddressModal = (address: any) => {
    setAddressForm({
      _id: address._id,
      name: address.name || "",
      mobile: address.mobile || "",
      houseNumber: address.houseNumber || "",
      street: address.street || "",
      landmark: address.landmark || "",
      city: address.city || "",
      state: address.state || "",
      country: address.country || "India",
      postalCode: address.postalCode || "",
      isDefault: address.isDefault || false,
    });
    setShowAddressModal(true);
  };

  const openNewAddressModal = () => {
    setAddressForm({
      _id: "",
      name: "",
      mobile: "",
      houseNumber: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
      isDefault: false,
    });
    setShowAddressModal(true);
  };

  if (!user) return null;

  return (
    <section className="py-12 min-h-[85vh] bg-[#faf9f6]">
      <div className="container-custom max-w-6xl mx-auto px-4">
        
        {/* Profile Header */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex flex-col md:flex-row items-center gap-6">
            
            {/* Avatar & Photo Upload */}
            <div className="relative group">
              <div className="w-24 h-24 bg-[#fff8e7] border-2 border-[#d4af37] rounded-full overflow-hidden flex items-center justify-center shadow-inner">
                {loadingPic ? (
                  <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                ) : profileData?.profilePic ? (
                  <img src={profileData.profilePic} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={44} className="text-[#d4af37]" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingPic}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#d4af37] text-white rounded-full flex items-center justify-center border-2 border-white hover:bg-[#b8860b] transition shadow-md"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
              />
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900">{profileData?.name || user.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 justify-center md:justify-start">
                <span className="text-sm px-3 py-0.5 rounded-full font-medium bg-green-50 text-green-700 border border-green-100">
                  {user.role === "admin" ? "Administrator" : "Customer"}
                </span>
                <span className="text-xs text-gray-400">Member since {new Date(profileData?.createdAt || Date.now()).getFullYear()}</span>
              </div>
            </div>

          </div>

          <div className="flex items-center gap-3">
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="bg-[#d4af37] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#b8860b] transition shadow-sm text-sm"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 border border-red-200 text-red-600 px-5 py-2.5 rounded-xl font-medium hover:bg-red-50 transition text-sm"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Desktop Layout: Left Navigation, Right Tabs */}
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Navigation Sidebar */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 h-fit space-y-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition text-left text-sm ${
                activeTab === "profile" ? "bg-[#fff8e7] text-[#b8860b]" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <UserIcon size={18} /> Profile Overview
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition text-left text-sm ${
                activeTab === "addresses" ? "bg-[#fff8e7] text-[#b8860b]" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <MapPin size={18} /> Saved Addresses
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition text-left text-sm ${
                activeTab === "orders" ? "bg-[#fff8e7] text-[#b8860b]" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ShoppingBag size={18} /> My Orders
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="lg:col-span-3">
            
            {/* Tab 1: Profile Overview */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                
                {/* Account Details Info */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                    <button
                      onClick={() => setShowEditProfile(true)}
                      className="flex items-center gap-1 text-[#b8860b] hover:underline font-semibold text-sm"
                    >
                      <Edit2 size={14} /> Edit details
                    </button>
                  </div>

                  {loadingProfile ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-10 bg-gray-100 rounded-xl w-3/4" />
                      <div className="h-10 bg-gray-100 rounded-xl" />
                      <div className="h-10 bg-gray-100 rounded-xl w-1/2" />
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      
                      <div className="space-y-1">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Full Name</span>
                        <p className="font-semibold text-gray-800 text-sm">{profileData?.name || "Not provided"}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Primary Email</span>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800 text-sm">{profileData?.email}</p>
                          <button
                            onClick={() => setShowChangeEmail(true)}
                            className="text-xs text-[#b8860b] hover:underline font-semibold"
                          >
                            Change
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Mobile Number</span>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800 text-sm">{profileData?.mobile ? `+91 ${profileData.mobile}` : "Not provided"}</p>
                          <button
                            onClick={() => setShowChangePhone(true)}
                            className="text-xs text-[#b8860b] hover:underline font-semibold"
                          >
                            {profileData?.mobile ? "Change" : "Add Number"}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Default Address</span>
                        <p className="text-gray-600 text-sm leading-relaxed truncate max-w-xs">{profileData?.address || "No address updated yet"}</p>
                      </div>

                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-4">
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition text-xs shadow-sm"
                    >
                      <Lock size={14} /> Update Password
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Tab 2: Saved Addresses */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
                  <button
                    onClick={openNewAddressModal}
                    className="flex items-center gap-1.5 bg-[#d4af37] text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-[#b8860b] transition text-sm shadow-sm"
                  >
                    <Plus size={16} /> Add Address
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="grid md:grid-cols-2 gap-4 animate-pulse">
                    <div className="bg-gray-100 rounded-3xl h-44" />
                    <div className="bg-gray-100 rounded-3xl h-44" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                    <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">No Saved Addresses</h3>
                    <p className="text-gray-500 text-sm mt-1">Please add an address to speed up checkout.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {addresses.map((addr: any) => (
                      <div
                        key={addr._id}
                        className={`bg-white rounded-2xl border p-5 shadow-sm transition relative flex flex-col justify-between ${
                          addr.isDefault ? "border-[#d4af37] bg-[#fff8e7]/10" : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-gray-900 text-sm">{addr.name}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-[#d4af37]/15 text-[#b8860b] px-2 py-0.5 rounded-full font-bold border border-[#d4af37]/20 uppercase">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed mb-1">
                            {addr.houseNumber}, {addr.street}
                            {addr.landmark ? `, ${addr.landmark}` : ""}
                          </p>
                          <p className="text-xs text-gray-600 mb-3">
                            {addr.city}, {addr.state} - {addr.postalCode}
                          </p>
                          <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                            <Phone size={11} /> +91 {addr.mobile}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
                          {!addr.isDefault ? (
                            <button
                              onClick={() => setDefaultAddressMutation.mutate(addr._id)}
                              className="text-xs text-[#b8860b] font-semibold hover:underline"
                            >
                              Set as Default
                            </button>
                          ) : (
                            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                              <Check size={12} /> Active Default
                            </span>
                          )}

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEditAddressModal(addr)}
                              className="text-gray-500 hover:text-[#b8860b]"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteAddressMutation.mutate(addr._id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Order History */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Order History</h2>

                {loadingOrders ? (
                  <div className="space-y-4 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-gray-100 rounded-3xl h-24" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                    <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">No Orders Found</h3>
                    <p className="text-gray-500 text-sm mt-1">You haven&apos;t placed any orders with Kaumudi yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div
                        key={order._id}
                        onClick={() => router.push(`/orders/${order._id}`)}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#d4af37] transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-[#fff8e7] text-[#d4af37] rounded-xl flex items-center justify-center shadow-inner shrink-0">
                            <Package size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="font-semibold text-gray-800 text-sm">
                                #{order._id.slice(-8).toUpperCase()}
                              </span>
                              <span
                                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                  STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {order.orderStatus}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Ordered on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                          <div className="text-left md:text-right">
                            <span className="text-xs text-gray-400 block">Total Price</span>
                            <span className="font-bold text-[#b8860b] text-sm">
                              ₹{order.totalAmount?.toLocaleString()}
                            </span>
                          </div>
                          <ChevronRight size={18} className="text-gray-400 hidden md:block" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Edit Profile Details Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowEditProfile(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Edit Profile Information</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfileMutation.mutate(profileForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Flat / House No.</label>
                  <input
                    type="text"
                    required
                    value={profileForm.houseNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, houseNumber: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Street / Locality</label>
                  <input
                    type="text"
                    required
                    value={profileForm.street}
                    onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={profileForm.landmark}
                  onChange={(e) => setProfileForm({ ...profileForm, landmark: e.target.value })}
                  className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={profileForm.postalCode}
                    onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={profileForm.country}
                    onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full bg-[#d4af37] text-white py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition mt-4 disabled:opacity-60"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Profile Details"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowChangePassword(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2"><Lock size={20} className="text-[#d4af37]" /> Change Password</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                changePasswordMutation.mutate(passwordForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">New Password (Min 8 chars)</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                />
              </div>
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full bg-[#d4af37] text-white py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition mt-4 disabled:opacity-60"
              >
                {changePasswordMutation.isPending ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {showChangeEmail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setShowChangeEmail(false);
                setEmailOtpSent(false);
                setEmailForm({ currentPassword: "", newEmail: "", otp: "" });
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2"><Mail size={20} className="text-[#d4af37]" /> Change Email Address</h3>
            
            {!emailOtpSent ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendEmailOtpMutation.mutate({
                    currentPassword: emailForm.currentPassword,
                    newEmail: emailForm.newEmail,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Confirm Account Password</label>
                  <input
                    type="password"
                    required
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">New Email Address</label>
                  <input
                    type="email"
                    required
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                    placeholder="new@example.com"
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendEmailOtpMutation.isPending}
                  className="w-full bg-[#d4af37] text-white py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition mt-4 disabled:opacity-60"
                >
                  {sendEmailOtpMutation.isPending ? "Sending OTP..." : "Request Verification Code"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyEmailChangeMutation.mutate(emailForm);
                }}
                className="space-y-4"
              >
                <div className="p-4 bg-[#fff8e7] border border-[#d4af37]/20 rounded-xl text-xs text-gray-600 mb-2 leading-relaxed">
                  We sent a 6-digit verification code to <strong className="text-gray-800">{emailForm.newEmail}</strong>. Please check your inbox and enter it below.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Verification OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={emailForm.otp}
                    onChange={(e) => setEmailForm({ ...emailForm, otp: e.target.value.replace(/\D/g, "") })}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] text-xl font-bold border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifyEmailChangeMutation.isPending}
                  className="w-full bg-[#d4af37] text-white py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition mt-4 disabled:opacity-60"
                >
                  {verifyEmailChangeMutation.isPending ? "Verifying..." : "Verify & Update Email"}
                </button>
                <button
                  type="button"
                  onClick={() => setEmailOtpSent(false)}
                  className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2 font-medium"
                >
                  Go Back
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Change Phone Modal */}
      {showChangePhone && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setShowChangePhone(false);
                setPhoneOtpSent(false);
                setPhoneForm({ currentPassword: "", newPhone: "", otp: "" });
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2"><Phone size={20} className="text-[#d4af37]" /> Change Mobile Number</h3>
            
            {!phoneOtpSent ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendPhoneOtpMutation.mutate({
                    currentPassword: phoneForm.currentPassword,
                    newPhone: phoneForm.newPhone,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Confirm Account Password</label>
                  <input
                    type="password"
                    required
                    value={phoneForm.currentPassword}
                    onChange={(e) => setPhoneForm({ ...phoneForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">New Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={phoneForm.newPhone}
                    onChange={(e) => setPhoneForm({ ...phoneForm, newPhone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendPhoneOtpMutation.isPending}
                  className="w-full bg-[#d4af37] text-white py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition mt-4 disabled:opacity-60"
                >
                  {sendPhoneOtpMutation.isPending ? "Sending OTP..." : "Request SMS Code"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyPhoneChangeMutation.mutate(phoneForm);
                }}
                className="space-y-4"
              >
                <div className="p-4 bg-[#fff8e7] border border-[#d4af37]/20 rounded-xl text-xs text-gray-600 mb-2 leading-relaxed">
                  We sent a 6-digit verification code via SMS to <strong className="text-gray-800">+91 {phoneForm.newPhone}</strong>. Enter it below to complete verification.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Verification OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={phoneForm.otp}
                    onChange={(e) => setPhoneForm({ ...phoneForm, otp: e.target.value.replace(/\D/g, "") })}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] text-xl font-bold border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifyPhoneChangeMutation.isPending}
                  className="w-full bg-[#d4af37] text-white py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition mt-4 disabled:opacity-60"
                >
                  {verifyPhoneChangeMutation.isPending ? "Verifying..." : "Verify & Update Number"}
                </button>
                <button
                  type="button"
                  onClick={() => setPhoneOtpSent(false)}
                  className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2 font-medium"
                >
                  Go Back
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Saved Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowAddressModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2"><MapPin size={22} className="text-[#d4af37]" /> {addressForm._id ? "Edit Address" : "Add New Address"}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addressSaveMutation.mutate(addressForm);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    placeholder="Receiver's name"
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Mobile</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.mobile}
                    onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })}
                    placeholder="10 digit number"
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Flat / House No.</label>
                  <input
                    type="text"
                    required
                    value={addressForm.houseNumber}
                    onChange={(e) => setAddressForm({ ...addressForm, houseNumber: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Street / Area</label>
                  <input
                    type="text"
                    required
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  placeholder="e.g. Near Station"
                  className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    placeholder="PIN code"
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-[#d4af37] bg-gray-50/50"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="accent-[#d4af37] w-4.5 h-4.5"
                />
                <span className="text-xs text-gray-500 font-medium">Set as my default shipping address</span>
              </label>

              <button
                type="submit"
                disabled={addressSaveMutation.isPending}
                className="w-full bg-[#d4af37] text-white py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition mt-4 disabled:opacity-60"
              >
                {addressSaveMutation.isPending ? "Saving..." : "Save Address"}
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
