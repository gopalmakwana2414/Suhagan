"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, CreditCard, Package, Download } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`);
      return res.data;
    },
    enabled: !!user && !!id,
  });

  if (!user) return null;

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloadingInvoice(true);
    try {
      const res = await api.get(`/orders/${order._id}/invoice`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Kaumudi-Invoice-${order._id.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download invoice. Please try again.");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <div className="h-8 w-40 bg-gray-100 rounded animate-pulse mb-8" />
          <div className="h-64 bg-gray-100 rounded-3xl animate-pulse" />
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="py-20 text-center">
        <p className="text-gray-400 text-xl">Order not found.</p>
        <Link href="/orders" className="text-[#b8860b] underline mt-4 inline-block">
          Back to My Orders
        </Link>
      </section>
    );
  }

  const isCancelled = order.orderStatus === "cancelled";
  const currentStepIndex = STATUS_STEPS.indexOf(order.orderStatus);

  return (
    <section className="py-16">
      <div className="container-custom max-w-4xl">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#b8860b] transition mb-8 text-sm"
        >
          <ArrowLeft size={16} /> Back to My Orders
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize ${
                STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-600"
              }`}
            >
              {order.orderStatus}
            </span>
            <button
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              className="flex items-center gap-2 border border-[#d4af37] text-[#b8860b] px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[#fff8e7] transition disabled:opacity-60"
            >
              <Download size={14} />
              {downloadingInvoice ? "Downloading..." : "Invoice"}
            </button>
          </div>
        </div>

        {/* Progress Tracker */}
        {!isCancelled && (
          <div className="bg-white rounded-3xl shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, idx) => (
                <div key={step} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx <= currentStepIndex
                          ? "bg-[#d4af37] text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <p
                      className={`text-xs mt-2 capitalize text-center ${
                        idx <= currentStepIndex
                          ? "text-[#b8860b] font-medium"
                          : "text-gray-400"
                      }`}
                    >
                      {step}
                    </p>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded ${
                        idx < currentStepIndex ? "bg-[#d4af37]" : "bg-gray-100"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 text-center">
            <p className="text-red-600 font-medium">This order has been cancelled.</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Items */}
          <div className="md:col-span-2 bg-white rounded-3xl shadow-sm border p-6">
            <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
              <Package size={18} className="text-[#d4af37]" /> Items ({order.totalItems})
            </h2>
            <div className="space-y-4">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 border-b last:border-0 pb-4 last:pb-0">
                  {item.product?.thumbnail?.url && (
                    <Image
                      src={item.product.thumbnail.url}
                      alt={item.product.name || "Product"}
                      width={70}
                      height={90}
                      className="w-16 h-20 object-cover rounded-xl flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">
                      {item.product?.name || "Product"}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">Qty: {item.quantity}</p>
                    <p className="font-semibold text-[#b8860b] text-sm mt-1">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            {/* Address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-3xl shadow-sm border p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-[#d4af37]" /> Delivery Address
                </h2>
                <p className="font-medium text-sm">{order.shippingAddress.fullName}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2 &&
                    `, ${order.shippingAddress.addressLine2}`}
                </p>
                <p className="text-gray-500 text-sm">
                  {order.shippingAddress.city}, {order.shippingAddress.state} –{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  📱 {order.shippingAddress.mobileNumber}
                </p>
              </div>
            )}

            {/* Payment */}
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-[#d4af37]" /> Payment
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium">
                    {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`font-medium capitalize ${
                      order.paymentStatus === "paid"
                        ? "text-green-600"
                        : order.paymentStatus === "failed"
                        ? "text-red-500"
                        : "text-yellow-600"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2 font-bold text-base">
                  <span>Total</span>
                  <span className="text-[#b8860b]">
                    ₹{order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
