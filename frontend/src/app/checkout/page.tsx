"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/checkout/OrderSummary";
declare global {
  interface Window {
    Razorpay: any;
  }
}

type Address = {
  _id: string;
  fullName: string;
  mobileNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { items, getCartTotal, clearCart } = useCartStore();

  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("ONLINE");
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Redirect if guest/empty cart
  useEffect(() => {
    if (!user) router.push("/login");
    if (items.length === 0) router.push("/cart");
  }, [user, items, router]);

  // Sync coupon data from sessionStorage on mount (if applied in Cart)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("kaumudi_coupon");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.discount) {
          setCouponData(parsed);
          setCouponCode(parsed.coupon);
        }
      }
    } catch (e) {
      console.error("Error parsing stored coupon:", e);
    }
  }, []);

  const { data: addresses = [], refetch: refetchAddresses, isLoading: loadingAddresses } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: async () => {
      const res = await api.get("/addresses");
      return res.data;
    },
    enabled: !!user,
  });

  // Auto-select default or first address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddress(def._id);
    }
  }, [addresses, selectedAddress]);

  const subtotal = getCartTotal();
  const shipping = subtotal > 999 ? 0 : 99;
  const discount = couponData ? couponData.discount : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  // --- Apply Coupon ---
  const applyCoupon = async (code: string) => {
    if (!code.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await api.post("/coupons/apply", {
        code: code.trim().toUpperCase(),
        orderAmount: subtotal,
      });
      setCouponData(res.data);
      setCouponCode(res.data.coupon);
      sessionStorage.setItem("kaumudi_coupon", JSON.stringify(res.data));
      toast.success(`Coupon applied! You save ₹${res.data.discount.toFixed(0)}`);
    } catch (err: any) {
      setCouponData(null);
      setCouponCode("");
      sessionStorage.removeItem("kaumudi_coupon");
      throw err; // bubble error up to OrderSummary
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponData(null);
    setCouponCode("");
    sessionStorage.removeItem("kaumudi_coupon");
    toast.info("Coupon removed.");
  };

  // --- Load Razorpay Script ---
  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // --- Place Order ---
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    setPlacingOrder(true);

    try {
      const orderItems = items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      }));

      const orderPayload = {
        items: orderItems,
        shippingAddress: selectedAddress,
        couponCode: couponData?.coupon || undefined,
      };

      if (paymentMethod === "COD") {
        const res = await api.post("/payment/cod", orderPayload);
        const orderId = res.data.order._id;
        clearCart();
        sessionStorage.removeItem("kaumudi_coupon"); // clean up applied coupon
        toast.success("Order placed successfully! 🎉");
        router.push(`/checkout/success?orderId=${orderId}`);
        return;
      }

      // Razorpay online payment
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Payment gateway failed to load. Please try again.");
        setPlacingOrder(false);
        return;
      }

      const { data } = await api.post("/payment/create-order", {
        items: orderItems,
        couponCode: couponData?.coupon || undefined,
        shippingAddress: selectedAddress,
      });

      const razorpayOrder = data.order;

      // Prefill customer contact details
      const selectedAddressData = addresses.find((a) => a._id === selectedAddress);
      const rawPhone = selectedAddressData?.mobileNumber?.replace(/\D/g, "");
      const contact =
        rawPhone && rawPhone.length === 10
          ? `+91${rawPhone}`
          : rawPhone
          ? `+${rawPhone}`
          : undefined;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "Kaumudi",
        description: "Premium Saree Purchase",
        order_id: razorpayOrder.id,
        prefill: {
          name: user?.name,
          email: user?.email,
          ...(contact && { contact }),
        },
        theme: { color: "#800020" },
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ...orderPayload,
            });
            const orderId = verifyRes.data.order._id;
            clearCart();
            sessionStorage.removeItem("kaumudi_coupon"); // clean up applied coupon
            toast.success("Payment successful! Order placed 🎉");
            router.push(`/checkout/success?orderId=${orderId}`);
          } catch (err: any) {
            toast.error(
              err?.response?.data?.message ||
                "Payment verification failed. Contact support."
            );
          } finally {
            setPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPlacingOrder(false);
            toast.error("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong");
      setPlacingOrder(false);
    }
  };

  if (!user || items.length === 0) return null;

  if (loadingAddresses) {
    return (
      <section className="py-16 bg-gradient-to-b from-[#FFF8F8]/40 to-white min-h-[90vh] flex items-center">
        <div className="container-custom max-w-4xl mx-auto space-y-4">
          <div className="h-10 w-40 bg-gray-150 rounded-xl animate-pulse luxury-shimmer" />
          <div className="grid lg:grid-cols-3 gap-8 mt-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-8 h-80 animate-pulse luxury-shimmer" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-8 h-96 animate-pulse luxury-shimmer" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-[#FFF8F8]/40 to-white min-h-[90vh]">
      <div className="container-custom">
        {/* Header Section */}
        <div className="flex items-baseline justify-between gap-3 mb-10 border-b border-gray-100 pb-6 max-w-6xl mx-auto">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-primary">Kaumudi Checkout</span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mt-1">
              Checkout
            </h1>
          </div>
          <Link href="/cart" className="text-gray-500 hover:text-primary text-xs font-semibold inline-flex items-center gap-1">
            <ArrowLeft size={13} /> Back to Bag
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {/* LEFT COLUMN - STEPS */}
          <div className="lg:col-span-2">
            <CheckoutForm
              user={user}
              addresses={addresses}
              selectedAddress={selectedAddress}
              setSelectedAddress={setSelectedAddress}
              refetchAddresses={refetchAddresses}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              items={items}
              subtotal={subtotal}
              shipping={shipping}
              discount={discount}
              total={total}
              couponData={couponData}
              handlePlaceOrder={handlePlaceOrder}
              placingOrder={placingOrder}
            />
          </div>

          {/* RIGHT COLUMN - SIDEBAR */}
          <div>
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shipping={shipping}
              discount={discount}
              total={total}
              couponData={couponData}
              applyCoupon={applyCoupon}
              removeCoupon={removeCoupon}
              applyingCoupon={applyingCoupon}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
