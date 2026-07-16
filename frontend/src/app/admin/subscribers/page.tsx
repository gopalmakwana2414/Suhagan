"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Mail, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSubscribersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch subscribers from the API
  const { data: resData, isLoading } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const res = await api.get("/subscribers");
      return res.data;
    },
  });

  // Delete subscriber mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/subscribers/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Subscriber removed successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to remove subscriber");
    },
  });

  const subscribers = resData?.data || [];
  const totalItems = resData?.count || 0;
  
  // Client-side pagination logic
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedSubscribers = subscribers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleDelete = (id: string, email: string) => {
    if (confirm(`Are you sure you want to remove ${email} from the newsletter list?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Newsletter Circle</h1>
          <p className="text-gray-500 text-sm mt-1">
            View and manage newsletter subscribers
          </p>
        </div>
        <div className="bg-secondary/40 text-primary border border-primary/10 px-4 py-2 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span className="text-sm font-semibold">{totalItems} Total Subscribers</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-14 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Mail size={48} className="mx-auto mb-4 opacity-25 text-primary" />
            <h3 className="font-serif text-lg font-medium text-gray-700">No Subscribers Yet</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
              Emails collected via the homepage and footer newsletter forms will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left border-b border-gray-100">
                <tr>
                  <th className="p-4 text-gray-500 font-semibold w-16">#</th>
                  <th className="p-4 text-gray-500 font-semibold">Name</th>
                  <th className="p-4 text-gray-500 font-semibold">Email Address</th>
                  <th className="p-4 text-gray-500 font-semibold">Mobile No</th>
                  <th className="p-4 text-gray-500 font-semibold">Address</th>
                  <th className="p-4 text-gray-500 font-semibold">Subscribed On</th>
                  <th className="p-4 text-gray-500 font-semibold text-right pr-6 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedSubscribers.map((sub: any, i: number) => (
                  <tr key={sub._id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 text-gray-400">
                      {(page - 1) * itemsPerPage + i + 1}
                    </td>
                    <td className="p-4">
                      {sub.registered ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{sub.name}</span>
                          <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded-full w-fit font-medium mt-0.5">
                            Registered Account
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-light">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-gray-700">{sub.email}</span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {sub.mobile}
                    </td>
                    <td className="p-4 text-gray-500 max-w-xs truncate" title={sub.address}>
                      {sub.address}
                    </td>
                    <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => handleDelete(sub._id, sub.email)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                        title="Remove Subscriber"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 p-4 border-t border-gray-100 bg-gray-50/30">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-white transition cursor-pointer"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-white transition cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
