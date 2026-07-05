"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import api from "@/lib/api";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingInvoiceId(orderId);
    try {
      const res = await api.get(`/orders/${orderId}/invoice`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Suhagan-Invoice-${orderId.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page],
    queryFn: async () => {
      const res = await api.get(`/admin/orders?page=${page}&limit=20`);
      return res.data;
    },
  });

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const res = await api.patch(`/admin/orders/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
      setUpdatingId(null);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update status"
      );
      setUpdatingId(null);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#b8860b]">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage and track all customer orders
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No orders have been placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order._id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs">
                      #{order._id.slice(-8).toUpperCase()}
                    </td>

                    <td className="p-4">
                      <p className="font-medium">{order.user?.name || "—"}</p>
                      <p className="text-gray-400 text-xs">{order.user?.email}</p>
                    </td>

                    <td className="p-4">{order.totalItems}</td>

                    <td className="p-4 font-semibold text-[#b8860b]">
                      ₹{order.totalAmount?.toLocaleString()}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.paymentMethod === "ONLINE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.paymentMethod}
                      </span>
                    </td>

                    <td className="p-4 text-gray-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="p-4">
                      {updatingId === order._id ? (
                        <select
                          defaultValue={order.orderStatus}
                          autoFocus
                          onChange={(e) => {
                            statusMutation.mutate({
                              id: order._id,
                              status: e.target.value,
                            });
                          }}
                          onBlur={() => setUpdatingId(null)}
                          className="border rounded-lg px-2 py-1 text-xs outline-none"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setUpdatingId(order._id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize hover:opacity-80 transition ${
                            STATUS_COLORS[order.orderStatus] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                          title="Click to change status"
                        >
                          {order.orderStatus}
                        </button>
                      )}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleDownloadInvoice(order._id)}
                        disabled={downloadingInvoiceId === order._id}
                        className="flex items-center gap-1.5 text-xs border px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
                      >
                        <Download size={13} />
                        {downloadingInvoiceId === order._id ? "..." : "PDF"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
