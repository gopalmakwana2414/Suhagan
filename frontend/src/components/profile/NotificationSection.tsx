"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, ShieldCheck, Mail, Sparkles, MessageSquare, Info } from "lucide-react";
import { toast } from "sonner";

interface NotificationSectionProps {
  user: any;
}

export default function NotificationSection({ user }: NotificationSectionProps) {
  const email = user?.email || "";

  // Toggles state
  const [preferences, setPreferences] = useState({
    orderUpdates: true,
    offersPromotions: false,
    newsletter: true,
    wishlistAlerts: false,
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (email) {
      const stored = localStorage.getItem(`kaumudi_notifications_${email}`);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    }
  }, [email]);

  const handleToggle = (key: keyof typeof preferences) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(updated);
    if (email) {
      localStorage.setItem(`kaumudi_notifications_${email}`, JSON.stringify(updated));
    }
    toast.success("Notification preferences updated.");
  };

  const notificationOptions = [
    {
      key: "orderUpdates" as const,
      title: "Order & Shipping Updates",
      desc: "Receive real-time transactional SMS and email notifications on shipping, packed, out for delivery status updates.",
      icon: MessageSquare,
      color: "text-primary",
      bg: "bg-secondary",
    },
    {
      key: "offersPromotions" as const,
      title: "Offers & Promotions",
      desc: "Receive curated product arrivals, coupons, and seasonal discounts on premium collection catalog additions.",
      icon: Sparkles,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      key: "newsletter" as const,
      title: "Kaumudi Style Newsletter",
      desc: "Weekly hand-picked design selections, weaver interviews, and insights on the history and aesthetics of sarees.",
      icon: Mail,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      key: "wishlistAlerts" as const,
      title: "Wishlist Alerts (Future)",
      desc: "Receive alerts when products in your wishlist are restocked, running out of stock, or discount offers apply.",
      icon: Bell,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-6">
        <h2 className="font-serif text-2xl font-bold text-gray-900">Notification Preferences</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Toggle List */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="font-serif text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
            <Bell size={16} className="text-primary" /> Channel Channels
          </h3>

          <div className="space-y-6">
            {notificationOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = preferences[opt.key];

              return (
                <div key={opt.key} className="flex gap-4 items-start justify-between">
                  <div className="flex gap-3.5 items-start">
                    <div className={`p-2 rounded-xl shrink-0 ${opt.bg} ${opt.color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-850 font-sans">{opt.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed max-w-md">
                        {opt.desc}
                      </p>
                    </div>
                  </div>

                  {/* Custom Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggle(opt.key)}
                    className={`w-11 h-6 rounded-full flex items-center p-0.5 transition-colors cursor-pointer shrink-0 outline-none ${
                      isActive ? "bg-primary" : "bg-gray-250"
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${
                        isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informational Panel */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6 h-fit">
          <h3 className="font-serif text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
            <ShieldCheck size={16} className="text-primary" /> Security & Policy
          </h3>

          <div className="text-xs space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl text-[10px] text-gray-400 flex items-start gap-1.5 leading-relaxed">
              <Info size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <span>
                Transactional order details and password change notifications are highly critical and cannot be disabled. These will always be sent directly to your registered email.
              </span>
            </div>

            <p className="text-[10px] text-gray-400 leading-normal font-sans">
              We respect your privacy. We do not sell or lease customer information to third-party advertisers. Learn more in our <Link href="/privacy-policy" className="text-primary font-bold hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
