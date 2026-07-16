"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShoppingBag, Clock, CheckCircle2, XCircle, Sparkles, ArrowRight, Package, FileText, MapPin } from "lucide-react";
import api from "@/lib/api";
import Image from "next/image";

interface DashboardOverviewProps {
  user: any;
  orders: any[];
  setActiveTab: (tab: string) => void;
  setSelectedOrderId: (id: string) => void;
  handleDownloadInvoice: (orderId: string) => void;
}

export default function DashboardOverview({
  user,
  orders,
  setActiveTab,
  setSelectedOrderId,
  handleDownloadInvoice,
}: DashboardOverviewProps) {
  // Stats calculations
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => ["pending", "confirmed", "processing", "shipped"].includes(o.orderStatus)
  ).length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered").length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === "cancelled").length;
  
  // Real coupon discount savings
  const totalSavings = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);

  const latestOrder = orders[0];

  // Fetch full details of the latest order to get populated products (including thumbnail)
  const { data: latestOrderDetail, isLoading: loadingLatestDetail } = useQuery({
    queryKey: ["latest-order-detail", latestOrder?._id],
    queryFn: async () => {
      const res = await api.get(`/orders/${latestOrder._id}`);
      return res.data;
    },
    enabled: !!latestOrder?._id,
  });

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingBag,
      color: "text-[#800020]",
      bg: "bg-[#FFF8F8]",
      border: "border-[#E6D6D6]/30",
    },
    {
      title: "Active Orders",
      value: pendingOrders,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      title: "Delivered",
      value: deliveredOrders,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      title: "Cancelled",
      value: cancelledOrders,
      icon: XCircle,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
    },
    {
      title: "Total Savings",
      value: `₹${totalSavings.toLocaleString("en-IN")}`,
      icon: Sparkles,
      color: "text-amber-500",
      bg: "bg-amber-50/50",
      border: "border-amber-100/50",
      highlight: true,
    },
  ];

  const getStatusStepIndex = (status: string) => {
    const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
    return steps.indexOf(status);
  };

  const currentStep = latestOrder ? getStatusStepIndex(latestOrder.orderStatus) : -1;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#800020] to-[#5C0013] p-8 text-white shadow-xl shadow-primary/10"
      >
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
            Welcome Back
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            Greetings, {user.name}
          </h2>
          <p className="text-sm text-[#FFF8F8]/80 leading-relaxed font-sans font-light">
            Manage your orders, customize delivery addresses, configure preferences, and view your style details. Experience premium luxury fashion at your fingertips.
          </p>
        </div>
        
        {/* Background Subtle Shape Accent */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none skew-x-12" />
        <div className="absolute right-12 bottom-0 w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent blur-xl" />
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className={`rounded-2xl border ${stat.border} ${stat.bg} p-5 flex flex-col justify-between shadow-sm relative overflow-hidden ${
              stat.highlight ? "col-span-2 md:col-span-1" : ""
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-sans">
                {stat.title}
              </span>
              <div className={`p-1.5 rounded-lg bg-white/80 shadow-sm border border-gray-100 shrink-0`}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight font-sans">
                {stat.value}
              </span>
            </div>

            {stat.highlight && (
              <div className="absolute -right-3 -bottom-3 opacity-10 pointer-events-none">
                <stat.icon size={64} className="text-[#800020]" />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Main Grid: Latest Order & Quick Actions */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Latest Order Section */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col justify-between shadow-[0_20px_50px_rgba(128,0,32,0.02)]"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-lg font-bold text-gray-900">
              Latest Order Status
            </h3>
            {latestOrder && (
              <button
                onClick={() => {
                  setActiveTab("orders");
                }}
                className="text-xs font-bold text-primary hover:text-primary-dark inline-flex items-center gap-1 transition cursor-pointer"
              >
                View History <ArrowRight size={13} />
              </button>
            )}
          </div>

          {!latestOrder ? (
            <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center shadow-inner">
                <Package className="text-primary/60" size={24} />
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">No Orders Placed Yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  Browse our exquisite catalog to place your first luxury order.
                </p>
              </div>
              <button
                onClick={() => (window.location.href = "/shop")}
                className="text-xs bg-primary text-white px-4 py-2 rounded-xl font-semibold hover:bg-primary-dark transition cursor-pointer"
              >
                Shop Now
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product info snippet */}
              {loadingLatestDetail ? (
                <div className="flex gap-4 items-center animate-pulse">
                  <div className="w-16 h-20 bg-gray-100 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ) : latestOrderDetail ? (
                <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-2xl border border-secondary">
                  {latestOrderDetail.items?.[0]?.product?.thumbnail?.url && (
                    <Image
                      src={latestOrderDetail.items[0].product.thumbnail.url}
                      alt={latestOrderDetail.items[0].product.name || "Saree"}
                      width={64}
                      height={80}
                      className="object-cover rounded-xl border border-gray-100 bg-white"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-800">
                        #{latestOrder._id.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(latestOrder.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="font-serif text-sm font-semibold text-gray-900 mt-1 truncate">
                      {latestOrderDetail.items?.[0]?.product?.name || "Premium Saree"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {latestOrderDetail.totalItems > 1
                        ? `+ ${latestOrderDetail.totalItems - 1} other item(s)`
                        : `1 item`}
                      {" • "}
                      <span className="font-semibold text-primary">
                        ₹{latestOrder.totalAmount?.toLocaleString("en-IN")}
                      </span>
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Order Status Stepper */}
              {latestOrder.orderStatus !== "cancelled" ? (
                <div className="py-2">
                  <div className="relative flex justify-between items-center w-full">
                    {/* Background Progress Bar */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded z-0" />
                    
                    {/* Active Progress Bar Overlay */}
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded z-0 transition-all duration-500"
                      style={{
                        width: `${currentStep === 4 ? 100 : (currentStep / 4) * 100}%`,
                      }}
                    />

                    {["Placed", "Confirmed", "Packed", "Shipped", "Delivered"].map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 text-[10px] font-bold transition-all duration-300 ${
                            idx <= currentStep
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-400 border-gray-200"
                          }`}
                        >
                          {idx <= currentStep ? "✓" : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] mt-2 font-semibold capitalize font-sans ${
                            idx <= currentStep ? "text-primary" : "text-gray-400"
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                  <XCircle size={18} className="text-rose-600" />
                  <p className="text-xs text-rose-600 font-medium">
                    This order was cancelled. Please view details to see refund status.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setSelectedOrderId(latestOrder._id);
                    setActiveTab("orders");
                  }}
                  className="flex-1 min-w-[120px] bg-secondary text-primary border border-primary/20 text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-primary/5 transition text-center cursor-pointer"
                >
                  Track & View Details
                </button>
                <button
                  onClick={() => handleDownloadInvoice(latestOrder._id)}
                  className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                >
                  <FileText size={14} /> Download Invoice
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col justify-between shadow-[0_20px_50px_rgba(128,0,32,0.02)]"
        >
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-5">
              Account Overview
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-secondary text-primary shrink-0 border border-primary/10">
                  <MapPin size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-800">Shipping Address</h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed truncate max-w-[200px]">
                    {user.address || "No address updated yet."}
                  </p>
                  <button
                    onClick={() => setActiveTab("addresses")}
                    className="text-[10px] text-primary font-bold hover:underline mt-1.5 block cursor-pointer"
                  >
                    Manage Addresses
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-secondary text-primary shrink-0 border border-primary/10">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-800">Notification Settings</h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    Custom alerts & design newsletters.
                  </p>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className="text-[10px] text-primary font-bold hover:underline mt-1.5 block cursor-pointer"
                  >
                    Adjust Toggles
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 leading-normal font-sans">
              Need assistance? Our support team is online 24/7. Contact us at{" "}
              <strong className="text-primary">care@kaumudi.com</strong>
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
