"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the customer profile orders tab
    router.replace("/profile?tab=orders");
  }, [router]);

  return (
    <section className="py-24 min-h-[70vh] flex items-center justify-center bg-gradient-to-tr from-[#FFF8F8] to-white">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest font-sans">
          Loading your order history...
        </p>
      </div>
    </section>
  );
}
