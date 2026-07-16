"use client";

import { useState } from "react";
import Link from "next/link";
import { Tag, Trash2, ArrowRight, Check, X, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

type CartSummaryProps = {
  subtotal: number;
  shipping: number;
  couponData: any;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  applyingCoupon: boolean;
  clearCart: () => void;
  checkoutUrl?: string;
};

export default function CartSummary({
  subtotal,
  shipping,
  couponData,
  applyCoupon,
  removeCoupon,
  applyingCoupon,
  clearCart,
  checkoutUrl = "/checkout",
}: CartSummaryProps) {
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);
  const user = useAuthStore((state) => state.user);

  const discount = couponData ? couponData.discount : 0;
  const total = Math.max(0, subtotal + shipping - discount);

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

  return (
    <div className="space-y-6">
      {/* ── PREMIUM COUPON CARD ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-[0_8px_30px_rgb(128,0,32,0.02)]">
        <h3 className="font-serif text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Tag size={16} className="text-primary" /> Promotional Coupon
        </h3>

        <AnimatePresence mode="wait">
          {couponData ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-green-50/50 border border-green-100 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <span className="inline-block text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                  Active Coupon
                </span>
                <p className="font-mono font-bold text-gray-900 text-sm">{couponData.coupon}</p>
                <p className="text-xs text-green-600 font-medium mt-0.5">
                  Save ₹{couponData.discount.toLocaleString()} ({couponData.discountPercentage}% Off)
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "#fee2e2" }}
                whileTap={{ scale: 0.9 }}
                onClick={removeCoupon}
                className="p-2 rounded-full text-red-500 hover:text-red-700 bg-red-50 transition-colors cursor-pointer border-none"
                title="Remove Coupon"
              >
                <X size={15} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-2.5"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    placeholder="ENTER COUPON CODE"
                    className="w-full border border-gray-200 pl-9 pr-3 py-3 rounded-xl text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-mono tracking-wider transition-all uppercase placeholder:text-gray-400 placeholder:normal-case bg-gray-50/20"
                    disabled={applyingCoupon}
                    onKeyDown={(e) => e.key === "Enter" && handleApply()}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApply}
                  disabled={applyingCoupon || !couponInput.trim()}
                  className="px-5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 cursor-pointer border-none flex items-center justify-center min-w-[76px]"
                >
                  {applyingCoupon ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </motion.button>
              </div>

              {/* Error messages */}
              <AnimatePresence>
                {couponError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[11px] text-red-500 font-medium pl-1"
                  >
                    ⚠ {couponError}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Success messages */}
              <AnimatePresence>
                {couponSuccess && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[11px] text-green-600 font-medium pl-1 flex items-center gap-1"
                  >
                    <Check size={12} /> Coupon applied successfully!
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── ORDER SUMMARY CARD ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-[0_8px_30px_rgb(128,0,32,0.02)] space-y-6">
        <h3 className="font-serif text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
          Order Summary
        </h3>

        <div className="space-y-3.5 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">₹{subtotal.toLocaleString()}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between items-center text-green-600 font-medium">
              <span className="flex items-center gap-1">Coupon Discount</span>
              <span>− ₹{discount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span>Shipping</span>
            <span className={shipping === 0 ? "text-green-600 font-semibold" : "font-medium text-gray-900"}>
              {shipping === 0 ? "Free" : `₹${shipping}`}
            </span>
          </div>

          <div className="flex justify-between items-center text-gray-400 text-xs">
            <span>Taxes (Included)</span>
            <span>₹0 (Future Ready)</span>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between items-baseline">
            <span className="font-bold text-gray-900 text-base">Grand Total</span>
            <div className="text-right">
              <span className="font-sans font-bold text-primary text-xl">
                ₹{total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {/* Checkout Button */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Link
              href={checkoutUrl}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-[#9B1B30] text-white py-3.5 rounded-xl font-semibold hover:from-[#6B0018] hover:to-[#800020] shadow-md hover:shadow-lg shadow-primary/20 transition-all duration-300 group cursor-pointer text-center text-sm border-none"
            >
              Proceed To Checkout
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Clear Cart Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={clearCart}
            className="w-full border border-gray-200 py-3 rounded-xl font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-300 cursor-pointer text-xs bg-transparent flex items-center justify-center gap-1.5"
          >
            <Trash2 size={13} /> Clear Cart
          </motion.button>
        </div>

        {/* Safe Checkout trust message */}
        <div className="border-t border-gray-50 pt-4 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <ShieldCheck size={14} className="text-green-600 flex-shrink-0" />
          <span>Secure checkout. 100% encrypted and protected.</span>
        </div>
      </div>
    </div>
  );
}
