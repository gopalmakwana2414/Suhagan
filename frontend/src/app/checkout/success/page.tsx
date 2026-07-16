"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Download, ArrowRight, Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const user = useAuthStore((state) => state.user);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
    if (!orderId) {
      router.push("/orders");
    }
  }, [user, orderId, router]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}`);
      return res.data;
    },
    enabled: !!user && !!orderId,
  });

  const handleDownloadInvoice = async () => {
    if (!orderId) return;
    setDownloadingInvoice(true);
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
      toast.success("Invoice downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download invoice. Please try again.");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (!user || !orderId) return null;

  if (isLoading) {
    return (
      <div className="text-center space-y-4 py-20 min-h-[50vh] flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-primary mx-auto" size={40} />
        <p className="text-gray-500 font-medium text-sm">Securing order details...</p>
      </div>
    );
  }

  // Framer Motion drawing animation configurations
  const circleVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeInOut" }
    }
  } as const;

  const checkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut", delay: 0.6 }
    }
  } as const;

  return (
    <div className="container-custom max-w-xl mx-auto px-4 text-center">
      {/* Success Animation */}
      <div className="flex justify-center mb-8">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Elegant SVG animated circle & checkmark */}
          <svg className="w-full h-full text-primary" viewBox="0 0 100 100">
            <motion.circle
              cx="50"
              cy="50"
              r="44"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              variants={circleVariants}
              initial="hidden"
              animate="visible"
            />
            <motion.path
              d="M30 52 L45 66 L70 36"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              variants={checkVariants}
              initial="hidden"
              animate="visible"
            />
          </svg>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="space-y-4"
      >
        <span className="inline-block text-[10px] font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-150">
          Order Placed Successfully
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          Thank You For Your Purchase
        </h1>

        <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
          Your standard handloomed saree order has been placed. We are preparing it with absolute devotion and will keep you updated.
        </p>

        {/* Order Info Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 my-8 shadow-[0_8px_30px_rgba(128,0,32,0.015)] text-left space-y-3.5 max-w-md mx-auto text-xs">
          <div className="flex justify-between border-b border-gray-50 pb-2.5">
            <span className="text-gray-400 font-medium">Order Reference:</span>
            <span className="font-mono font-bold text-gray-900 text-sm">
              #{orderId.slice(-8).toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between border-b border-gray-50 pb-2.5">
            <span className="text-gray-400 font-medium">Payment Option:</span>
            <span className="font-medium text-gray-800">
              {order?.paymentMethod === "COD" ? "Cash on Delivery" : "Paid via Razorpay"}
            </span>
          </div>

          <div className="flex justify-between border-b border-gray-50 pb-2.5">
            <span className="text-gray-400 font-medium">Grand Total:</span>
            <span className="font-sans font-bold text-primary text-sm">
              ₹{order?.totalAmount?.toLocaleString() || "0"}
            </span>
          </div>

          {order?.shippingAddress && (
              <div className="pt-1.5 space-y-1">
                <span className="text-gray-400 font-medium block">Shipping Destination:</span>
                <p className="text-gray-800 font-semibold">{order.shippingAddress.fullName}</p>
                <p className="text-gray-500 line-clamp-1">{order.shippingAddress.addressLine1}</p>
                <p className="text-gray-500 font-medium">
                  {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.postalCode}
                </p>
              </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid xs:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
          {/* Download Invoice Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadInvoice}
            disabled={downloadingInvoice}
            className="w-full flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-xs font-semibold hover:bg-gray-50 transition shadow-sm cursor-pointer"
          >
            {downloadingInvoice ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {downloadingInvoice ? "Generating..." : "Invoice Download"}
          </motion.button>

          {/* Track Order Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href={`/orders/${orderId}`}
              className="w-full flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-xs font-semibold hover:bg-gray-50 transition shadow-sm cursor-pointer text-center"
            >
              <FileText size={14} /> Track Order
            </Link>
          </motion.div>

          {/* Continue Shopping Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="xs:col-span-2">
            <Link
              href="/shop"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-[#9B1B30] text-white py-3.5 rounded-xl font-semibold hover:from-[#6B0018] hover:to-[#800020] shadow-md hover:shadow-lg shadow-primary/20 transition-all duration-300 border-none text-xs"
            >
              Continue Shopping
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <section className="py-20 bg-gradient-to-b from-[#FFF8F8]/40 to-white min-h-[90vh] flex items-center">
      <Suspense fallback={
        <div className="container-custom max-w-xl mx-auto px-4 text-center py-20 min-h-[50vh] flex flex-col justify-center items-center">
          <Loader2 className="animate-spin text-primary mx-auto" size={40} />
          <p className="text-gray-500 font-medium text-sm">Loading order success context...</p>
        </div>
      }>
        <SuccessPageContent />
      </Suspense>
    </section>
  );
}
