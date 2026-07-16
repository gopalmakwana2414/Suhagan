"use client";

import { useState } from "react";
import { Tag, ShieldCheck, HelpCircle, RefreshCcw, Award, Lock, Loader2, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type OrderSummaryProps = {
  items: any[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponData: any;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  applyingCoupon: boolean;
};

export default function OrderSummary({
  items,
  subtotal,
  shipping,
  discount,
  total,
  couponData,
  applyCoupon,
  removeCoupon,
  applyingCoupon,
}: OrderSummaryProps) {
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);

  const handleApply = async () => {
    if (!couponInput.trim()) return;
    setCouponError("");
    setCouponSuccess(false);
    try {
      await applyCoupon(couponInput.trim().toUpperCase());
      setCouponSuccess(true);
      setCouponInput("");
      setTimeout(() => setCouponSuccess(false), 3000);
    } catch (err: any) {
      setCouponError(err?.response?.data?.message || "Invalid coupon code");
      setTimeout(() => setCouponError(""), 4000);
    }
  };

  const trustBadges = [
    { label: "100% Secure Payment", icon: Lock, desc: "UPI, Cards, and COD protected" },
    { label: "SSL Encrypted Checkout", icon: ShieldCheck, desc: "Bank-grade transactional safety" },
    { label: "Easy Returns", icon: RefreshCcw, desc: "Hassle-free 7-day return policy" },
    { label: "Premium Quality", icon: Award, desc: "Authentic handloomed sarees" },
    { label: "Customer Support", icon: HelpCircle, desc: "Dedicated support for orders" },
  ];

  return (
    <div className="space-y-6">
      {/* ── SUMMARY SIDEBAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-[0_8px_30px_rgb(128,0,32,0.015)]">
        <h3 className="font-serif text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
          Order Summary
        </h3>

        {/* Small product list thumbnail reviews */}
        <div className="space-y-3 max-h-40 overflow-y-auto pr-1 mb-5">
          {items.map((item) => (
            <div key={item.product._id} className="flex gap-3 text-xs items-center">
              <img
                src={item.product.thumbnail?.url}
                alt={item.product.name}
                className="w-10 h-13 object-cover rounded bg-gray-50 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{item.product.name}</p>
                <p className="text-gray-400">Qty: {item.quantity}</p>
              </div>
              <span className="font-semibold text-gray-900">
                ₹{(item.product.salePrice * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <hr className="border-gray-100 my-4" />

        {/* Coupon Form */}
        <div className="mb-5">
          <AnimatePresence mode="wait">
            {couponData ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-green-50/50 border border-green-150 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-mono font-bold text-green-800">{couponData.coupon} Applied</p>
                  <p className="text-[10px] text-green-600 font-medium mt-0.5">
                    Save ₹{couponData.discount.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="p-1 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 border-none bg-transparent cursor-pointer"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-1.5"
              >
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Tag size={12} className="absolute left-2.5 top-3 text-gray-400" />
                    <input
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      placeholder="COUPON CODE"
                      className="w-full border border-gray-200 pl-7 pr-2 py-2.5 rounded-lg text-[10px] outline-none focus:border-primary font-mono bg-gray-50/30"
                      disabled={applyingCoupon}
                      onKeyDown={(e) => e.key === "Enter" && handleApply()}
                    />
                  </div>
                  <button
                    onClick={handleApply}
                    disabled={applyingCoupon || !couponInput.trim()}
                    className="px-3 bg-primary text-white rounded-lg text-[10px] font-bold hover:bg-primary-dark disabled:opacity-50 cursor-pointer border-none flex items-center justify-center min-w-[56px]"
                  >
                    {applyingCoupon ? <Loader2 size={11} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-red-500 pl-1">⚠ {couponError}</p>}
                {couponSuccess && <p className="text-[10px] text-green-600 pl-1 flex items-center gap-0.5"><Check size={10} /> Coupon applied!</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <hr className="border-gray-100 my-4" />

        {/* Pricing calculations */}
        <div className="space-y-2.5 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Items Total</span>
            <span className="font-semibold text-gray-800">₹{subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600 font-medium">
              <span>Coupon Discount</span>
              <span>− ₹{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className={shipping === 0 ? "text-green-600 font-semibold" : "font-semibold text-gray-800"}>
              {shipping === 0 ? "Free" : `₹${shipping}`}
            </span>
          </div>
          <div className="flex justify-between text-[10px] opacity-75">
            <span>Estimated Taxes (0%)</span>
            <span>₹0 (Future Ready)</span>
          </div>
          <div className="border-t border-gray-100 pt-3 mt-1 flex justify-between items-baseline">
            <span className="font-bold text-gray-900 text-sm">Grand Total</span>
            <span className="font-sans font-bold text-primary text-lg">₹{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── TRUST BADGES SECTION ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-[0_8px_30px_rgb(128,0,32,0.015)] space-y-4">
        <h4 className="font-serif text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
          Kaumudi Trust Promise
        </h4>
        <div className="space-y-3.5">
          {trustBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div key={idx} className="flex gap-3 items-start">
                <div className="p-1.5 rounded-lg bg-secondary text-primary mt-0.5">
                  <Icon size={14} />
                </div>
                <div className="text-xs">
                  <h5 className="font-bold text-gray-800">{badge.label}</h5>
                  <p className="text-gray-400 text-[10px] mt-0.5">{badge.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
