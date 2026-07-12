"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ShoppingBag, Package, Users, TrendingUp, AlertTriangle, XCircle, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/dashboard");
      return res.data;
    },
  });

  const stats = [
    {
      label: "Total Products",
      value: data?.totalProducts ?? "—",
      icon: <Package size={24} className="text-[#d4af37]" />,
      bg: "bg-yellow-50",
    },
    {
      label: "Total Orders",
      value: data?.totalOrders ?? "—",
      icon: <ShoppingBag size={24} className="text-blue-500" />,
      bg: "bg-blue-50",
    },
    {
      label: "Total Revenue",
      value: data?.totalRevenue != null ? `₹${data.totalRevenue.toLocaleString()}` : "—",
      icon: <TrendingUp size={24} className="text-green-500" />,
      bg: "bg-green-50",
    },
    {
      label: "Total Customers",
      value: data?.totalUsers ?? "—",
      icon: <Users size={24} className="text-purple-500" />,
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#b8860b]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome to Kaumudi Admin Panel
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-2xl p-6 flex items-center gap-5`}
          >
            <div className="bg-white rounded-xl p-3 shadow-sm">{stat.icon}</div>
            <div>
              <p className="text-gray-500 text-sm">{stat.label}</p>
              <h2 className="text-2xl font-bold mt-1">
                {isLoading ? (
                  <span className="inline-block w-16 h-7 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Cards: Pending Orders + Out of Stock */}
      {!isLoading && (data?.pendingOrdersCount > 0 || data?.outOfStockCount > 0) && (
        <div className="grid sm:grid-cols-2 gap-6">
          {data?.pendingOrdersCount > 0 && (
            <Link
              href="/admin/orders"
              className="flex items-center gap-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <Clock size={28} className="text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-yellow-800">
                  {data.pendingOrdersCount} order{data.pendingOrdersCount > 1 ? "s" : ""} awaiting confirmation
                </p>
                <p className="text-yellow-600 text-sm mt-0.5">Click to review and update status</p>
              </div>
            </Link>
          )}

          {data?.outOfStockCount > 0 && (
            <Link
              href="/admin/products"
              className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <XCircle size={28} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-700">
                  {data.outOfStockCount} product{data.outOfStockCount > 1 ? "s" : ""} out of stock
                </p>
                <p className="text-red-500 text-sm mt-0.5">Restock to keep selling</p>
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Orders</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !data?.recentOrders?.length ? (
            <p className="text-gray-400 text-center py-10">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="p-3 rounded-l-xl">Order ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3 rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order: any) => (
                    <tr key={order._id} className="border-t">
                      <td className="p-3 font-mono text-xs">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{order.user?.name || "—"}</p>
                        <p className="text-gray-400 text-xs">{order.user?.email}</p>
                      </td>
                      <td className="p-3 font-semibold text-[#b8860b]">
                        ₹{order.totalAmount?.toLocaleString()}
                      </td>
                      <td className="p-3">{order.paymentMethod}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                            STATUS_COLORS[order.orderStatus] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Widget */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={18} className="text-yellow-500" />
            <h2 className="text-lg font-semibold">Low Stock Alert</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !data?.lowStockProducts?.length ? (
            <p className="text-gray-400 text-sm text-center py-10">
              All products are well-stocked! 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {data.lowStockProducts.map((p: any) => (
                <Link
                  key={p._id}
                  href="/admin/products"
                  className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition"
                >
                  {p.thumbnail?.url && (
                    <img
                      src={p.thumbnail.url}
                      alt={p.name}
                      className="w-10 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                  </div>
                  <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex-shrink-0">
                    {p.stock} left
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
