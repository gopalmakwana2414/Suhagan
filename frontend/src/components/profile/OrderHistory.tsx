"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Package, ChevronRight, Download, Eye, Truck, RefreshCw, X, Calendar, CreditCard, ExternalLink, Check } from "lucide-react";
import api from "@/lib/api";
import Image from "next/image";

interface OrderHistoryProps {
  orders: any[];
  isLoading: boolean;
  setSelectedOrderId: (id: string) => void;
  setActiveTab: (tab: any) => void;
  handleDownloadInvoice: (orderId: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-amber-50 border-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  confirmed: { bg: "bg-blue-50 border-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  processing: { bg: "bg-purple-50 border-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  shipped: { bg: "bg-indigo-50 border-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  delivered: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  cancelled: { bg: "bg-rose-50 border-rose-100", text: "text-rose-700", dot: "bg-rose-500" },
};

// Caching helper to fetch order thumbnails dynamically
function OrderThumbnail({ orderId }: { orderId: string }) {
  const { data: orderDetail, isLoading } = useQuery({
    queryKey: ["order-thumbnail", orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <div className="w-16 h-20 bg-gray-100 rounded-xl animate-pulse luxury-shimmer shrink-0" />;
  }

  const firstItem = orderDetail?.items?.[0];
  if (!firstItem?.product?.thumbnail?.url) {
    return (
      <div className="w-16 h-20 bg-[#FFF8F8] rounded-xl border border-gray-150 flex items-center justify-center shrink-0">
        <Package size={20} className="text-primary/40" />
      </div>
    );
  }

  return (
    <div className="relative group shrink-0 w-16 h-20 rounded-xl overflow-hidden border border-gray-100 bg-white">
      <Image
        src={firstItem.product.thumbnail.url}
        alt={firstItem.product.name || "Saree"}
        fill
        className="object-cover"
      />
    </div>
  );
}

export default function OrderHistory({
  orders,
  isLoading,
  setSelectedOrderId,
  setActiveTab,
  handleDownloadInvoice,
}: OrderHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trackingOrder, setTrackingOrder] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">Order History</h2>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 h-32 animate-pulse luxury-shimmer" />
        ))}
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order._id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && ["pending", "confirmed", "processing", "shipped"].includes(order.orderStatus)) ||
      order.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStepIndex = (status: string) => {
    const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
    return steps.indexOf(status);
  };

  const handleTrackClick = (e: React.MouseEvent, order: any) => {
    e.stopPropagation();
    setTrackingOrder(order);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
        <h2 className="font-serif text-2xl font-bold text-gray-900">Order History</h2>
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary bg-gray-50/50 text-sm font-sans"
          />
        </div>
      </div>

      {/* Tabs / Filter Controls */}
      <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 p-1 rounded-xl w-fit">
        {[
          { id: "all", label: "All Orders" },
          { id: "active", label: "Active" },
          { id: "delivered", label: "Delivered" },
          { id: "cancelled", label: "Cancelled" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
              statusFilter === tab.id
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-[0_20px_50px_rgba(128,0,32,0.02)] flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center shadow-inner">
            <ShoppingBag className="text-primary/60" size={24} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-800">No Orders Found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? "We couldn't find any orders matching your search. Double check your Order ID."
                : "You don't have any orders in this category yet."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const colors = STATUS_COLORS[order.orderStatus] || { bg: "bg-gray-150", text: "text-gray-700", dot: "bg-gray-400" };
            return (
              <motion.div
                layout
                key={order._id}
                onClick={() => {
                  setSelectedOrderId(order._id);
                  setActiveTab("orders");
                }}
                whileHover={{ scale: 1.005 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm hover:border-primary transition cursor-pointer flex flex-col gap-4 shadow-[0_15px_40px_rgba(0,0,0,0.01)] hover:shadow-md hover:shadow-primary/5"
              >
                {/* Header Row */}
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-gray-800">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span
                      className={`px-3 py-1 border text-[10px] uppercase font-bold tracking-wider rounded-full flex items-center gap-1.5 ${colors.bg} ${colors.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={13} />
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Content Row */}
                <div className="flex items-center gap-4">
                  {/* Loaded dynamically & cached */}
                  <OrderThumbnail orderId={order._id} />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold font-sans">
                        Method
                      </span>
                      <p className="text-xs font-semibold text-gray-700 mt-1 font-sans">
                        {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold font-sans">
                        Payment Status
                      </span>
                      <p
                        className={`text-xs font-semibold mt-1 capitalize font-sans ${
                          order.paymentStatus === "paid"
                            ? "text-emerald-600"
                            : order.paymentStatus === "failed"
                            ? "text-rose-500"
                            : "text-amber-600"
                        }`}
                      >
                        {order.paymentStatus}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold font-sans">
                        Total Amount
                      </span>
                      <p className="text-xs font-bold text-primary mt-1 font-sans">
                        ₹{order.totalAmount?.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold font-sans">
                        Items
                      </span>
                      <p className="text-xs font-semibold text-gray-700 mt-1 font-sans">
                        {order.totalItems} Saree(s)
                      </p>
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-gray-300 hidden sm:block shrink-0" />
                </div>

                {/* Actions Footer */}
                <div className="border-t border-gray-50 pt-3 flex flex-wrap items-center justify-between gap-3 mt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrderId(order._id);
                        setActiveTab("orders");
                      }}
                      className="inline-flex items-center gap-1 bg-secondary hover:bg-primary/5 text-primary text-xs font-bold py-2 px-3 rounded-lg border border-primary/10 transition cursor-pointer"
                    >
                      <Eye size={12} /> View Details
                    </button>
                    {order.orderStatus !== "cancelled" && (
                      <button
                        onClick={(e) => handleTrackClick(e, order)}
                        className="inline-flex items-center gap-1 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                      >
                        <Truck size={12} /> Track Order
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadInvoice(order._id);
                      }}
                      className="inline-flex items-center gap-1 text-gray-500 hover:text-primary text-xs font-bold py-2 px-3 rounded-lg transition cursor-pointer"
                    >
                      <Download size={12} /> Invoice
                    </button>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-1 text-gray-300 text-xs font-bold py-2 px-3 rounded-lg cursor-not-allowed"
                    >
                      <RefreshCw size={12} /> Reorder
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modern Stepper tracking popup overlay */}
      <AnimatePresence>
        {trackingOrder && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 relative shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setTrackingOrder(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition shrink-0"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2.5 mb-6">
                <Truck size={20} className="text-primary" />
                <h3 className="font-serif text-xl font-bold text-gray-900">Track Shipment</h3>
              </div>

              <div className="mb-6 p-4 bg-secondary/40 border border-secondary rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Courier Partner</p>
                  <p className="text-xs font-semibold text-gray-800 mt-0.5">Blue Dart Express</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">AWB Number</p>
                  <p className="text-xs font-mono font-bold text-primary flex items-center gap-1 mt-0.5">
                    KMD8374928 <ExternalLink size={10} />
                  </p>
                </div>
              </div>

              {/* Progress Stepper list */}
              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                {[
                  { title: "Ordered Placed", desc: "Awaiting confirmation", key: "pending" },
                  { title: "Order Confirmed", desc: "Successfully validated", key: "confirmed" },
                  { title: "Packed at Loom", desc: "Hand-folded with premium care", key: "processing" },
                  { title: "Shipped & Dispatched", desc: "In transit with Blue Dart", key: "shipped" },
                  { title: "Delivered", desc: "Signature received", key: "delivered" },
                ].map((step, idx) => {
                  const currentIdx = getStatusStepIndex(trackingOrder.orderStatus);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={idx} className="flex gap-4 relative z-10">
                      <div
                        className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${
                          isCompleted
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-300 border-gray-250"
                        }`}
                      >
                        {isCompleted ? <Check size={12} /> : idx + 1}
                      </div>
                      <div>
                        <h4
                          className={`text-xs font-semibold ${
                            isCurrent ? "text-primary font-bold" : isCompleted ? "text-gray-800" : "text-gray-400"
                          }`}
                        >
                          {step.title}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setTrackingOrder(null)}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition mt-8 cursor-pointer shadow-md hover:shadow-lg shadow-primary/20"
              >
                Close Tracking
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
