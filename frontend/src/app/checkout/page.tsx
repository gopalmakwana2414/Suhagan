"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingBag, MapPin, Plus, CreditCard, Truck, Tag, X } from "lucide-react";
import Link from "next/link";

import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

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
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [addressForm, setAddressForm] = useState({
    fullName: user?.name || "",
    mobileNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
  });

  useEffect(() => {
    if (!user) router.push("/login");
    if (items.length === 0) router.push("/cart");
  }, [user, items, router]);

  const { data: addresses = [], refetch: refetchAddresses } = useQuery<Address[]>({
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
  const total = subtotal + shipping - discount;

  // --- Save Address ---
  const saveAddressMutation = useMutation({
    mutationFn: async (data: typeof addressForm) => {
      const res = await api.post("/addresses", data);
      return res.data;
    },
    onSuccess: (saved: Address) => {
      toast.success("Address saved!");
      refetchAddresses();
      setSelectedAddress(saved._id);
      setShowAddressForm(false);
      setAddressForm({
        fullName: user?.name || "",
        mobileNumber: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        isDefault: false,
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to save address");
    },
  });

  // --- Apply Coupon ---
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await api.post("/coupons/apply", {
        code: couponCode.trim().toUpperCase(),
        orderAmount: subtotal,
      });
      setCouponData(res.data);
      toast.success(`Coupon applied! You save ₹${res.data.discount.toFixed(0)}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid coupon");
      setCouponData(null);
    } finally {
      setApplyingCoupon(false);
    }
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
      // only send product id + quantity, never price — the backend
      // works out the real price itself so a tampered request can't
      // pay less than the actual cart total
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
        await api.post("/payment/cod", orderPayload);
        clearCart();
        toast.success("Order placed successfully! 🎉");
        router.push("/orders");
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
      });

      const razorpayOrder = data.order;

      // Prefill the customer's phone number for Razorpay
      const selectedAddressData = addresses.find(
        (a) => a._id === selectedAddress
      );
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
        theme: { color: "#d4af37" },
        handler: async (response: any) => {
          try {
            await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ...orderPayload,
            });
            clearCart();
            toast.success("Payment successful! Order placed 🎉");
            router.push("/orders");
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

  return (
    <section className="py-16">
      <div className="container-custom">
        <h1 className="text-4xl font-bold mb-10">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">

            {/* ── SHIPPING ADDRESS ── */}
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-[#d4af37]" />
                  <h2 className="text-xl font-semibold">Shipping Address</h2>
                </div>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-1 text-sm text-[#b8860b] hover:underline"
                >
                  <Plus size={14} />
                  {showAddressForm ? "Cancel" : "Add New"}
                </button>
              </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <div className="bg-gray-50 rounded-2xl p-5 mb-6 border">
                  <h3 className="font-medium mb-4">New Address</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Full Name *</label>
                      <input
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                        placeholder="Priya Sharma"
                        className="w-full border p-3 rounded-xl text-sm outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Mobile Number *</label>
                      <input
                        value={addressForm.mobileNumber}
                        onChange={(e) => setAddressForm({ ...addressForm, mobileNumber: e.target.value })}
                        placeholder="9876543210"
                        className="w-full border p-3 rounded-xl text-sm outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Address Line 1 *</label>
                      <input
                        value={addressForm.addressLine1}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                        placeholder="House No., Street, Area"
                        className="w-full border p-3 rounded-xl text-sm outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Address Line 2</label>
                      <input
                        value={addressForm.addressLine2}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                        placeholder="Landmark (optional)"
                        className="w-full border p-3 rounded-xl text-sm outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">City *</label>
                      <input
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="Surat"
                        className="w-full border p-3 rounded-xl text-sm outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">State *</label>
                      <input
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        placeholder="Gujarat"
                        className="w-full border p-3 rounded-xl text-sm outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Pincode *</label>
                      <input
                        value={addressForm.postalCode}
                        onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                        placeholder="395001"
                        className="w-full border p-3 rounded-xl text-sm outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Country</label>
                      <input
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        className="w-full border p-3 rounded-xl text-sm outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        className="accent-[#d4af37]"
                      />
                      <label htmlFor="isDefault" className="text-sm">
                        Set as default address
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => saveAddressMutation.mutate(addressForm)}
                    disabled={saveAddressMutation.isPending}
                    className="mt-4 bg-[#d4af37] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#b8860b] transition disabled:opacity-60"
                  >
                    {saveAddressMutation.isPending ? "Saving..." : "Save Address"}
                  </button>
                </div>
              )}

              {/* Address List */}
              {addresses.length === 0 && !showAddressForm ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  No saved addresses. Add one above.
                </p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={`flex items-start gap-4 border rounded-2xl p-4 cursor-pointer transition ${
                        selectedAddress === addr._id
                          ? "border-[#d4af37] bg-[#fff8e7]"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr._id}
                        checked={selectedAddress === addr._id}
                        onChange={() => setSelectedAddress(addr._id)}
                        className="mt-1 accent-[#d4af37]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{addr.fullName}</p>
                          {addr.isDefault && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                          {addr.addressLine1}
                          {addr.addressLine2 && `, ${addr.addressLine2}`}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {addr.city}, {addr.state} – {addr.postalCode}
                        </p>
                        <p className="text-gray-500 text-sm">📱 {addr.mobileNumber}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ── PAYMENT METHOD ── */}
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard size={20} className="text-[#d4af37]" />
                <h2 className="text-xl font-semibold">Payment Method</h2>
              </div>

              <div className="space-y-3">
                <label
                  className={`flex items-center gap-4 border rounded-2xl p-4 cursor-pointer transition ${
                    paymentMethod === "ONLINE"
                      ? "border-[#d4af37] bg-[#fff8e7]"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    checked={paymentMethod === "ONLINE"}
                    onChange={() => setPaymentMethod("ONLINE")}
                    className="accent-[#d4af37]"
                  />
                  <div>
                    <p className="font-semibold text-sm">
                      Online Payment (Razorpay)
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      UPI, Credit/Debit Card, Net Banking, Wallets
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-4 border rounded-2xl p-4 cursor-pointer transition ${
                    paymentMethod === "COD"
                      ? "border-[#d4af37] bg-[#fff8e7]"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                    className="accent-[#d4af37]"
                  />
                  <div>
                    <p className="font-semibold text-sm">Cash on Delivery</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Pay when your order arrives
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT — ORDER SUMMARY */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-6">
                <ShoppingBag size={20} className="text-[#d4af37]" />
                <h2 className="text-xl font-semibold">Order Summary</h2>
              </div>

              {/* Items */}
              <div className="space-y-4 mb-5">
                {items.map((item) => (
                  <div key={item.product._id} className="flex gap-3">
                    <img
                      src={item.product.thumbnail.url}
                      alt={item.product.name}
                      className="w-16 h-20 object-cover rounded-xl"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {item.product.name}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Qty: {item.quantity}
                      </p>
                      <p className="font-semibold text-[#b8860b] text-sm mt-1">
                        ₹{(item.product.salePrice * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="border-t pt-5 mb-5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag
                      size={14}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                    <input
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      placeholder="COUPON CODE"
                      className="w-full border pl-8 pr-3 py-3 rounded-xl text-sm outline-none focus:border-[#d4af37] font-mono"
                      disabled={!!couponData}
                    />
                  </div>
                  {couponData ? (
                    <button
                      onClick={() => {
                        setCouponData(null);
                        setCouponCode("");
                      }}
                      className="px-3 border rounded-xl text-red-500 hover:bg-red-50"
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={applyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="px-4 bg-[#d4af37] text-white rounded-xl text-sm font-medium hover:bg-[#b8860b] transition disabled:opacity-60"
                    >
                      {applyingCoupon ? "..." : "Apply"}
                    </button>
                  )}
                </div>
                {couponData && (
                  <p className="text-green-600 text-xs mt-2">
                    ✓ {couponData.coupon} applied — {couponData.discountPercentage}% off
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t pt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Truck size={13} /> Shipping
                  </span>
                  <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>− ₹{discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-3 mt-2">
                  <span>Total</span>
                  <span className="text-[#b8860b]">₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || !selectedAddress}
                className="w-full mt-6 bg-[#d4af37] text-white py-4 rounded-xl text-lg font-semibold hover:bg-[#b8860b] transition disabled:opacity-60"
              >
                {placingOrder
                  ? "Processing..."
                  : paymentMethod === "COD"
                  ? "Place Order (COD)"
                  : "Pay & Place Order"}
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                🔒 Secure checkout. 100% safe & encrypted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
