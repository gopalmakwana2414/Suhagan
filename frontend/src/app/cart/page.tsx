"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, ArrowRight, ShieldCheck, CreditCard, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import ScrollReveal from "@/components/ui/ScrollReveal";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import api from "@/lib/api";
import { toast } from "sonner";

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart, isLoading } = useCart();
  const [couponData, setCouponData] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const items = cart?.items || [];

  // Calculate subtotal
  const subtotal = items.reduce(
    (total: number, item: any) =>
      total + item.product.salePrice * item.quantity,
    0
  );

  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;

  // Sync coupon data from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("kaumudi_coupon");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Verify if it matches current subtotal
        if (parsed && parsed.discount) {
          setCouponData(parsed);
        }
      }
    } catch (e) {
      console.error("Error parsing stored coupon:", e);
    }
  }, []);

  // Sync coupon calculations if items list changes
  useEffect(() => {
    if (couponData && items.length > 0) {
      // Re-apply coupon logic locally or call API to refresh discount
      const pct = couponData.discountPercentage;
      const newDiscount = Math.round(subtotal * (pct / 100));
      const updated = {
        ...couponData,
        discount: newDiscount
      };
      setCouponData(updated);
      sessionStorage.setItem("kaumudi_coupon", JSON.stringify(updated));
    } else if (items.length === 0) {
      setCouponData(null);
      sessionStorage.removeItem("kaumudi_coupon");
    }
  }, [subtotal, items.length]);

  const applyCoupon = async (code: string) => {
    setApplyingCoupon(true);
    try {
      const res = await api.post("/coupons/apply", {
        code: code.trim().toUpperCase(),
        orderAmount: subtotal,
      });
      setCouponData(res.data);
      sessionStorage.setItem("kaumudi_coupon", JSON.stringify(res.data));
      toast.success(`Coupon applied! You save ₹${res.data.discount.toFixed(0)}`);
    } catch (err: any) {
      setCouponData(null);
      sessionStorage.removeItem("kaumudi_coupon");
      throw err; // bubble up to handle error states in child component
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponData(null);
    sessionStorage.removeItem("kaumudi_coupon");
    toast.info("Coupon removed.");
  };

  const grandTotal = Math.max(0, subtotal + shipping - (couponData?.discount || 0));

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-[#FFF8F8]/40 to-white min-h-[85vh]">
        <div className="container-custom">
          {/* Skeleton Loaders for Luxury Experience */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="h-10 w-48 bg-gray-150 rounded-xl animate-pulse luxury-shimmer" />
            <div className="grid lg:grid-cols-3 gap-8 mt-10">
              <div className="lg:col-span-2 space-y-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-44 animate-pulse luxury-shimmer" />
                ))}
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 h-36 animate-pulse luxury-shimmer" />
                <div className="bg-white rounded-2xl border border-gray-100 p-6 h-80 animate-pulse luxury-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // EMPTY STATE
  if (items.length === 0) {
    return (
      <section className="py-24 bg-gradient-to-b from-[#FFF8F8]/40 to-white min-h-[80vh] flex items-center">
        <div className="container-custom text-center max-w-lg mx-auto px-4">
          <ScrollReveal>
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
              <ShoppingBag size={38} className="text-primary/70 animate-bounce" />
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Your Bag is Empty
            </h1>

            <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-md mx-auto">
              Our looms are weaving standard works of art, waiting to adorn your elegance. Browse our curated saree collections.
            </p>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-[#9B1B30] text-white px-10 py-4 rounded-xl font-semibold shadow-md hover:shadow-lg shadow-primary/10 transition-all duration-300 hover:from-[#6B0018] hover:to-[#800020] border-none"
              >
                Explore Collections
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-[#FFF8F8]/40 to-white min-h-[90vh] pb-28 lg:pb-16">
      <div className="container-custom">
        {/* Header Section */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 mb-10 border-b border-gray-100 pb-6">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-primary">Kaumudi Bag</span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mt-1">
                Shopping Cart
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{items.reduce((acc: number, item: any) => acc + item.quantity, 0)} items</span>
              <span>•</span>
              <Link href="/shop" className="text-primary hover:underline font-medium inline-flex items-center gap-0.5">
                <ArrowLeft size={13} /> Continue Shopping
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Free Shipping Progress Indicator */}
        {subtotal < 999 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-secondary/80 border border-primary/10 rounded-xl flex items-center justify-between text-xs text-primary/95 font-medium max-w-4xl mx-auto shadow-sm"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-accent-gold" />
              Add <strong className="font-bold">₹{(999 - subtotal).toLocaleString()}</strong> more to unlock free home delivery!
            </span>
            <Link href="/shop" className="underline font-bold text-primary hover:text-[#9B1B30]">
              Add Items
            </Link>
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {/* Left - Item List */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((item: any) => (
                <motion.div
                  key={item.product._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                >
                  <CartItem
                    item={item}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Right - Summary */}
          <ScrollReveal y={20}>
            <CartSummary
              subtotal={subtotal}
              shipping={shipping}
              couponData={couponData}
              applyCoupon={applyCoupon}
              removeCoupon={removeCoupon}
              applyingCoupon={applyingCoupon}
              clearCart={clearCart}
            />
          </ScrollReveal>
        </div>
      </div>

      {/* Sticky Bottom checkout on mobile */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-150 p-4 flex items-center justify-between z-30 shadow-[0_-10px_35px_rgba(0,0,0,0.08)]"
      >
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Grand Total</p>
          <p className="font-sans font-bold text-primary text-lg">₹{grandTotal.toLocaleString()}</p>
        </div>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Link
            href="/checkout"
            className="bg-primary text-white text-xs font-semibold px-6 py-3.5 rounded-xl hover:bg-primary-dark transition shadow-md shadow-primary/20 border-none flex items-center gap-1.5 cursor-pointer text-center"
          >
            Checkout
            <ArrowRight size={13} />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}