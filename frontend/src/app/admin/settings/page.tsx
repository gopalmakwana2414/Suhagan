"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Store, Mail, Phone, MapPin, Save, Shield, Bell } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function AdminSettingsPage() {
  const user = useAuthStore((state) => state.user);

  // Store settings are currently informational — wire to a Settings API later
  const [storeInfo, setStoreInfo] = useState({
    storeName: "Suhagan",
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

  const handleSave = () => {
    // only saves to local state for now — needs a Settings model +
    // /api/settings route on the backend to actually persist
    toast.success("Settings saved locally. Connect a Settings API to persist these.");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#b8860b]">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your store configuration and preferences
        </p>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-6">
          <Store size={20} className="text-[#d4af37]" />
          <h2 className="text-lg font-semibold">Store Information</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-1">Store Name</label>
            <input
              value={storeInfo.storeName}
              onChange={(e) =>
                setStoreInfo({ ...storeInfo, storeName: e.target.value })
              }
              className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <Mail size={13} /> Contact Email
            </label>
            <input
              value={storeInfo.email}
              onChange={(e) =>
                setStoreInfo({ ...storeInfo, email: e.target.value })
              }
              className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <Phone size={13} /> Contact Phone
            </label>
            <input
              value={storeInfo.phone}
              onChange={(e) =>
                setStoreInfo({ ...storeInfo, phone: e.target.value })
              }
              className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Free Shipping Threshold (₹)
            </label>
            <input
              type="number"
              value={storeInfo.freeShippingThreshold}
              onChange={(e) =>
                setStoreInfo({
                  ...storeInfo,
                  freeShippingThreshold: Number(e.target.value),
                })
              }
              className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <MapPin size={13} /> Store / Factory Address
            </label>
            <textarea
              value={storeInfo.address}
              onChange={(e) =>
                setStoreInfo({ ...storeInfo, address: e.target.value })
              }
              rows={2}
              className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] resize-none"
            />
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield size={20} className="text-[#d4af37]" />
          <h2 className="text-lg font-semibold">Payment Methods</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Cash on Delivery (COD)</span>
            <input
              type="checkbox"
              checked={storeInfo.codAvailable}
              onChange={(e) =>
                setStoreInfo({ ...storeInfo, codAvailable: e.target.checked })
              }
              className="accent-[#d4af37] w-5 h-5"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Online Payment (Razorpay)</span>
            <input
              type="checkbox"
              checked={storeInfo.onlinePaymentAvailable}
              onChange={(e) =>
                setStoreInfo({
                  ...storeInfo,
                  onlinePaymentAvailable: e.target.checked,
                })
              }
              className="accent-[#d4af37] w-5 h-5"
            />
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell size={20} className="text-[#d4af37]" />
          <h2 className="text-lg font-semibold">Email Notifications</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium block">New Order Alerts</span>
              <span className="text-xs text-gray-400">
                Get emailed when a customer places an order
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifications.newOrderEmail}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  newOrderEmail: e.target.checked,
                })
              }
              className="accent-[#d4af37] w-5 h-5"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium block">Low Stock Alerts</span>
              <span className="text-xs text-gray-400">
                Get notified when products run low
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifications.lowStockAlert}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  lowStockAlert: e.target.checked,
                })
              }
              className="accent-[#d4af37] w-5 h-5"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium block">New Review Alerts</span>
              <span className="text-xs text-gray-400">
                Get notified when a customer leaves a review
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifications.newReviewAlert}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  newReviewAlert: e.target.checked,
                })
              }
              className="accent-[#d4af37] w-5 h-5"
            />
          </label>
        </div>
      </div>

      {/* Admin Account */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Admin Account</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#fff8e7] border border-[#d4af37] rounded-full flex items-center justify-center font-bold text-[#b8860b]">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="flex items-center gap-2 bg-[#d4af37] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#b8860b] transition"
      >
        <Save size={16} />
        Save Settings
      </button>
    </div>
  );
}
