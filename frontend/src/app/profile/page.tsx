"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon,
  ShoppingBag,
  MapPin,
  Heart,
  Shield,
  Bell,
  LogOut,
  Menu,
  X,
  Loader2,
  Calendar,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

// Import modular dashboard tab components
import DashboardOverview from "@/components/profile/DashboardOverview";
import OrderHistory from "@/components/profile/OrderHistory";
import OrderDetailView from "@/components/profile/OrderDetailView";
import AddressSection from "@/components/profile/AddressSection";
import ProfileSection from "@/components/profile/ProfileSection";
import SecuritySection from "@/components/profile/SecuritySection";
import NotificationSection from "@/components/profile/NotificationSection";
import WishlistPlaceholder from "@/components/profile/WishlistPlaceholder";

type TabId = "dashboard" | "orders" | "addresses" | "wishlist" | "profile" | "security" | "notifications";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: UserIcon },
  { id: "orders", label: "My Orders", icon: ShoppingBag },
  { id: "addresses", label: "Saved Addresses", icon: MapPin },
  { id: "wishlist", label: "My Wishlist", icon: Heart },
  { id: "profile", label: "Profile Details", icon: UserIcon },
  { id: "security", label: "Security & Devices", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function ProfilePageContent() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  // Sync tab and order ID from URL query parameters (for deep linking support)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam as TabId);
    }
    
    const orderIdParam = searchParams.get("orderId");
    if (orderIdParam) {
      setSelectedOrderId(orderIdParam);
      setActiveTab("orders");
    }
  }, [searchParams]);

  // Redirect guest users
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Fetch full user profile details from backend
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await api.get("/auth/profile");
      const u = res.data.user;
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
    enabled: !!user && activeTab === "addresses",
  });

  // Fetch user orders (Enabled for dashboard overview and order history)
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data;
    },
    enabled: !!user && (activeTab === "orders" || activeTab === "dashboard"),
  });

  // Invoice PDF Downloader
  const handleDownloadInvoice = async (orderId: string) => {
    if (downloadingInvoice) return;
    setDownloadingInvoice(true);
    const toastId = toast.loading("Generating your invoice PDF...");
    try {
      const res = await api.get(`/orders/${orderId}/invoice`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Kaumudi-Invoice-${orderId.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded successfully.", { id: toastId });
    } catch (err) {
      toast.error("Failed to download invoice. Please try again.", { id: toastId });
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Log out handler
  const handleLogout = () => {
    logout();
    router.push("/");
    toast.success("Logged out successfully.");
  };

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setSelectedOrderId(null);
    setMobileMenuOpen(false);
    // Update URL query parameters for navigation state preservation
    router.push(`/profile?tab=${tabId}`);
  };

  if (!user) return null;

  // Render components based on active tab
  const renderTabContent = () => {
    if (activeTab === "orders" && selectedOrderId) {
      return (
        <OrderDetailView
          orderId={selectedOrderId}
          onBack={() => setSelectedOrderId(null)}
          handleDownloadInvoice={handleDownloadInvoice}
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            user={user}
            orders={orders}
            setActiveTab={(tab) => handleTabChange(tab as TabId)}
            setSelectedOrderId={setSelectedOrderId}
            handleDownloadInvoice={handleDownloadInvoice}
          />
        );
      case "orders":
        return (
          <OrderHistory
            orders={orders}
            isLoading={loadingOrders}
            setSelectedOrderId={setSelectedOrderId}
            setActiveTab={(tab) => handleTabChange(tab as TabId)}
            handleDownloadInvoice={handleDownloadInvoice}
          />
        );
      case "addresses":
        return <AddressSection addresses={addresses} isLoading={loadingAddresses} />;
      case "wishlist":
        return <WishlistPlaceholder />;
      case "profile":
        return <ProfileSection user={user} profileData={profileData} />;
      case "security":
        return <SecuritySection />;
      case "notifications":
        return <NotificationSection user={user} />;
      default:
        return null;
    }
  };

  return (
    <section className="py-12 min-h-[90vh] bg-gradient-to-tr from-[#FFF8F8] via-[#FFFAFA] to-white relative">
      <div className="container-custom max-w-6xl mx-auto px-4">
        
        {/* Mobile Header Bar */}
        <div className="lg:hidden flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-50 rounded-xl transition text-gray-700 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <span className="font-serif text-sm font-bold text-gray-800 capitalize">
              {TABS.find((t) => t.id === activeTab)?.label}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="p-2 border border-rose-100 text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Desktop Header Banner */}
        <div className="hidden lg:flex bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 mb-8 items-center justify-between shadow-[0_20px_50px_rgba(128,0,32,0.015)]">
          <div className="flex items-center gap-6">
            {/* Avatar Initials circle */}
            <div className="w-16 h-16 bg-secondary border border-primary/20 rounded-full flex items-center justify-center shadow-inner">
              {profileData?.profilePic ? (
                <img src={profileData.profilePic} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-xl font-bold text-primary font-serif">
                  {profileData?.name
                    ? profileData.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : user.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h1 className="font-serif text-2xl font-bold text-gray-900">
                {profileData?.name || user.name}
              </h1>
              <div className="flex items-center gap-2 mt-1 font-sans">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-green-50 border border-green-150 text-green-700 uppercase tracking-wider">
                  {user.role === "admin" ? "Administrator" : "Valued Customer"}
                </span>
                <span className="text-[10px] text-gray-400">
                  Member since {new Date(profileData?.createdAt || Date.now()).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.role === "admin" && (
              <button
                onClick={() => router.push("/admin")}
                className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-dark transition text-xs shadow-md shadow-primary/20 cursor-pointer"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 border border-rose-100 text-rose-600 px-5 py-2.5 rounded-xl font-bold hover:bg-rose-50 transition text-xs cursor-pointer"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Navigation Sidebar (Desktop view) */}
          <aside className="hidden lg:block bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-1 h-fit shadow-[0_20px_50px_rgba(128,0,32,0.015)]">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer outline-none ${
                    isActive
                      ? "bg-secondary text-primary border-l-2 border-primary"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                >
                  <Icon size={15} /> {tab.label}
                </button>
              );
            })}
          </aside>

          {/* Tab Content Panel */}
          <main className="lg:col-span-3 min-h-[50vh] relative">
            {loadingProfile ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-3xl">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : null}
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (selectedOrderId || "")}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </main>

        </div>

      </div>

      {/* Navigation Drawer Sidebar (Mobile view) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/50"
            />

            {/* Slide menu content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-white p-6 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary font-serif">
                        {profileData?.name ? profileData.name[0].toUpperCase() : "K"}
                      </span>
                    </div>
                    <span className="font-serif text-sm font-bold text-gray-800">
                      My Account
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-650 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-xs font-bold transition text-left cursor-pointer outline-none ${
                          isActive
                            ? "bg-secondary text-primary"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={16} /> {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-soft-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-gray-500">Loading Profile...</p>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
