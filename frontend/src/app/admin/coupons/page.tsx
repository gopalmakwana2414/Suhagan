"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, X, Tag, Pencil } from "lucide-react";
import api from "@/lib/api";

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    discountPercentage: 10,
    minimumOrderAmount: 0,
    expiresAt: "",
    isActive: true,
    usageLimit: "" as string | number,
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const res = await api.get("/coupons");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.post("/coupons", {
        ...data,
        code: data.code.toUpperCase().trim(),
        usageLimit: data.usageLimit === "" ? null : Number(data.usageLimit),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon created!");
      setShowForm(false);
      setForm({
        code: "",
        discountPercentage: 10,
        minimumOrderAmount: 0,
        expiresAt: "",
        isActive: true,
        usageLimit: "",
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create coupon");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.put(`/coupons/${editingCoupon._id}`, {
        ...data,
        code: data.code.toUpperCase().trim(),
        usageLimit: data.usageLimit === "" ? null : Number(data.usageLimit),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon updated successfully!");
      setShowForm(false);
      setEditingCoupon(null);
      setForm({
        code: "",
        discountPercentage: 10,
        minimumOrderAmount: 0,
        expiresAt: "",
        isActive: true,
        usageLimit: "",
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update coupon");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete coupon"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error("Coupon code required");
    if (!form.expiresAt) return toast.error("Expiry date required");
    if (form.discountPercentage < 1 || form.discountPercentage > 100) {
      return toast.error("Discount percentage must be between 1 and 100");
    }
    if (form.minimumOrderAmount < 0) {
      return toast.error("Minimum order amount cannot be negative");
    }
    if (form.usageLimit !== "" && Number(form.usageLimit) <= 0) {
      return toast.error("Usage limit must be a positive number");
    }

    if (editingCoupon) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  // Get tomorrow as min date for expiry input
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#b8860b]">Coupons</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage discount coupons for customers
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setForm({
              code: "",
              discountPercentage: 10,
              minimumOrderAmount: 0,
              expiresAt: "",
              isActive: true,
              usageLimit: "",
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-[#d4af37] text-white px-4 py-2 rounded-xl hover:bg-[#b8860b] transition"
        >
          <Plus size={16} />
          Create Coupon
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold">
              {editingCoupon ? "Edit Coupon" : "New Coupon"}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingCoupon(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Coupon Code *
              </label>
              <input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="KAUMUDI20"
                className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Discount (%) *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.discountPercentage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discountPercentage: Number(e.target.value),
                  })
                }
                className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Minimum Order Amount (₹)
              </label>
              <input
                type="number"
                min={0}
                value={form.minimumOrderAmount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minimumOrderAmount: Number(e.target.value),
                  })
                }
                className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                min={minDate}
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
                className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Usage Limit (Optional)
              </label>
              <input
                type="number"
                min={1}
                placeholder="Unlimited"
                value={form.usageLimit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    usageLimit: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="accent-[#d4af37]"
              />
              <label htmlFor="isActive" className="text-sm">
                Active (can be used by customers)
              </label>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#d4af37] text-white px-6 py-2.5 rounded-xl hover:bg-[#b8860b] transition disabled:opacity-60"
              >
                {editingCoupon
                  ? updateMutation.isPending
                    ? "Saving..."
                    : "Save Changes"
                  : createMutation.isPending
                  ? "Creating..."
                  : "Create Coupon"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCoupon(null);
                }}
                className="border px-6 py-2.5 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Tag size={48} className="mx-auto mb-3 opacity-30" />
            <p>No coupons yet. Create your first one above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Min. Order</th>
                <th className="p-4">Expires</th>
                <th className="p-4">Usage / Limit</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon: any) => (
                <tr key={coupon._id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <span className="font-mono font-bold text-[#b8860b] bg-[#fff8e7] px-2 py-1 rounded-lg">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="p-4 font-semibold">{coupon.discountPercentage}% OFF</td>
                  <td className="p-4 text-gray-500">
                    {coupon.minimumOrderAmount > 0
                      ? `₹${coupon.minimumOrderAmount.toLocaleString()}`
                      : "No minimum"}
                  </td>
                  <td className="p-4">
                    <span
                      className={isExpired(coupon.expiresAt) ? "text-red-500" : "text-gray-700"}
                    >
                      {new Date(coupon.expiresAt).toLocaleDateString("en-IN")}
                      {isExpired(coupon.expiresAt) && " (Expired)"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-700 font-medium">
                      {coupon.usageLimit !== undefined && coupon.usageLimit !== null
                        ? `${coupon.usedCount || 0} / ${coupon.usageLimit}`
                        : `${coupon.usedCount || 0} / ∞`}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        coupon.isActive && !isExpired(coupon.expiresAt) && (!coupon.usageLimit || (coupon.usedCount || 0) < coupon.usageLimit)
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {coupon.isActive && !isExpired(coupon.expiresAt) && (!coupon.usageLimit || (coupon.usedCount || 0) < coupon.usageLimit)
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCoupon(coupon);
                          const expiryDate = coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "";
                          setForm({
                            code: coupon.code || "",
                            discountPercentage: coupon.discountPercentage || 10,
                            minimumOrderAmount: coupon.minimumOrderAmount || 0,
                            expiresAt: expiryDate,
                            isActive: coupon.isActive !== undefined ? coupon.isActive : true,
                            usageLimit: coupon.usageLimit !== undefined && coupon.usageLimit !== null ? coupon.usageLimit : "",
                          });
                          setShowForm(true);
                        }}
                        className="text-[#d4af37] hover:text-[#b8860b] transition"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(coupon._id)}
                        className="text-red-500 hover:text-red-700 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold mb-3">Delete Coupon?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This coupon will be permanently deleted and customers won't be able to use it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl hover:bg-red-600 transition disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border py-2.5 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
