"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Package, MapPin, CreditCard, Download, Clock, User, Calendar, Check, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import Image from "next/image";

interface OrderDetailViewProps {
  orderId: string;
  onBack: () => void;
  handleDownloadInvoice: (orderId: string) => void;
}

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function OrderDetailView({
  orderId,
  onBack,
  handleDownloadInvoice,
}: OrderDetailViewProps) {
  const { data: order, isLoading } = useQuery({
    queryKey: ["order-details-view", orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}`);
      return res.data;
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-gray-150 rounded animate-pulse" />
        <div className="h-44 bg-white rounded-3xl border border-gray-100 p-8 animate-pulse luxury-shimmer" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 h-96 bg-white rounded-3xl border border-gray-100 p-8 animate-pulse luxury-shimmer" />
          <div className="space-y-6">
            <div className="h-44 bg-white rounded-3xl border border-gray-100 p-8 animate-pulse luxury-shimmer" />
            <div className="h-44 bg-white rounded-3xl border border-gray-100 p-8 animate-pulse luxury-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400 text-lg">Order not found.</p>
        <button onClick={onBack} className="text-primary hover:underline mt-4 cursor-pointer font-semibold">
          Go Back
        </button>
      </div>
    );
  }

  const isCancelled = order.orderStatus === "cancelled";
  const currentStepIndex = STATUS_STEPS.indexOf(order.orderStatus);

  // Billing breakdown calculation
  const itemsSubtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const shippingFee = itemsSubtotal > 999 ? 0 : 99;
  const couponDiscount = order.discountAmount || 0;
  const grandTotal = order.totalAmount;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to History
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleDownloadInvoice(order._id)}
            className="inline-flex items-center gap-1.5 border border-primary text-primary hover:bg-[#FFF8F8] px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Download size={14} /> Download Invoice
          </button>
        </div>
      </div>

      {/* Order Identity Block */}
      <div className="bg-[#FFF8F8] rounded-3xl border border-[#E6D6D6]/40 p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
            Luxury Saree Selection
          </span>
          <h1 className="font-serif text-2xl font-bold text-gray-900 mt-1">
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Calendar size={13} />
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">
            Grand Total
          </span>
          <span className="text-2xl font-bold text-primary block mt-0.5">
            ₹{grandTotal.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Progress Timeline Tracker */}
      {!isCancelled ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
          <h3 className="font-serif text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock size={16} className="text-primary" /> Tracking Timeline
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-2 relative">
            {/* Horizontal timeline bar on desktop */}
            <div className="absolute left-6 right-6 top-[15px] h-1 bg-gray-100 rounded hidden sm:block z-0" />
            <div
              className="absolute left-6 top-[15px] h-1 bg-primary rounded hidden sm:block z-0 transition-all duration-500"
              style={{
                width: `${currentStepIndex === 4 ? "calc(100% - 48px)" : `${(currentStepIndex / 4) * 100}%`}`,
              }}
            />

            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step} className="flex sm:flex-col items-center gap-3 sm:gap-0 relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-300 ${
                      isCompleted
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-400 border-gray-205"
                    }`}
                  >
                    {isCompleted ? <Check size={14} /> : idx + 1}
                  </div>
                  <div className="sm:text-center mt-0 sm:mt-3">
                    <p
                      className={`text-xs capitalize font-semibold ${
                        isCurrent ? "text-primary font-bold" : isCompleted ? "text-gray-800" : "text-gray-400"
                      }`}
                    >
                      {step === "processing" ? "Packed" : step}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5 hidden sm:block">
                      {isCompleted ? "Completed" : "Awaiting"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 text-center flex flex-col items-center justify-center space-y-2">
          <p className="text-rose-700 font-bold font-serif text-lg">Order Cancelled</p>
          <p className="text-xs text-rose-500 max-w-md">
            This order was cancelled. A refund (if payment was completed online) will be credited to your account within 5-7 business days.
          </p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Items */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="font-serif text-lg font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-4">
            <Package size={18} className="text-primary" /> Items in Order ({order.totalItems})
          </h2>

          <div className="divide-y divide-gray-100">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                {item.product?.thumbnail?.url && (
                  <div className="relative w-16 h-20 rounded-xl overflow-hidden border border-gray-100 bg-white shrink-0">
                    <Image
                      src={item.product.thumbnail.url}
                      alt={item.product.name || "Saree"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif text-sm font-semibold text-gray-900 truncate">
                    {item.product?.name || "Premium Saree"}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Fabric: {item.product?.fabric || "Silk"} • Color: {item.product?.color || "Multicolor"}
                  </p>
                  <div className="flex justify-between items-center mt-2.5">
                    <span className="text-xs text-gray-500 font-medium">
                      ₹{item.price?.toLocaleString("en-IN")} × {item.quantity}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Address and Billing */}
        <div className="space-y-6">
          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-serif text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
                <MapPin size={15} className="text-primary" /> Shipping Destination
              </h3>
              <div className="text-xs space-y-1.5 text-gray-650">
                <p className="font-bold text-gray-800 text-sm flex items-center gap-1">
                  <User size={13} className="text-primary" /> {order.shippingAddress.fullName}
                </p>
                <p className="leading-relaxed mt-1">
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
                </p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                </p>
                <p className="pt-1 text-gray-400 font-semibold">
                  📱 +91 {order.shippingAddress.mobileNumber}
                </p>
              </div>
            </div>
          )}

          {/* Payment & Summary */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-serif text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
              <CreditCard size={15} className="text-primary" /> Billing Details
            </h3>

            <div className="text-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-sans">Payment Method</span>
                <span className="font-bold text-gray-800">
                  {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-sans">Payment Status</span>
                <span
                  className={`font-bold capitalize ${
                    order.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{itemsSubtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Delivery Charge</span>
                  <span>{shippingFee === 0 ? "FREE" : `₹${shippingFee}`}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-gray-100 pt-2.5 font-bold text-sm text-primary">
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
