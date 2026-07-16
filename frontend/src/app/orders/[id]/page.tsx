"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { toast } from "sonner";
import OrderDetailView from "@/components/profile/OrderDetailView";

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const handleDownloadInvoice = async (orderId: string) => {
    if (downloadingInvoice) return;
    setDownloadingInvoice(true);
    const toastId = toast.loading("Generating your invoice PDF...");
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
      toast.success("Invoice downloaded successfully.", { id: toastId });
    } catch (err) {
      toast.error("Failed to download invoice. Please try again.", { id: toastId });
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (!user || !id) return null;

  return (
    <section className="py-16 bg-gradient-to-tr from-[#FFF8F8] via-[#FFFAFA] to-white min-h-[90vh]">
      <div className="container-custom max-w-4xl mx-auto px-4">
        <OrderDetailView
          orderId={id as string}
          onBack={() => router.push("/profile?tab=orders")}
          handleDownloadInvoice={handleDownloadInvoice}
        />
      </div>
    </section>
  );
}
