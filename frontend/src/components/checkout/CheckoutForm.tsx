"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Plus, CreditCard, ChevronRight, Check, ShieldCheck, Truck, ShoppingBag, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

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

type CheckoutFormProps = {
  user: any;
  addresses: Address[];
  selectedAddress: string;
  setSelectedAddress: (id: string) => void;
  refetchAddresses: () => void;
  paymentMethod: "COD" | "ONLINE";
  setPaymentMethod: (method: "COD" | "ONLINE") => void;
  items: any[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponData: any;
  handlePlaceOrder: () => void;
  placingOrder: boolean;
};

export default function CheckoutForm({
  user,
  addresses,
  selectedAddress,
  setSelectedAddress,
  refetchAddresses,
  paymentMethod,
  setPaymentMethod,
  items,
  subtotal,
  shipping,
  discount,
  total,
  couponData,
  handlePlaceOrder,
  placingOrder,
}: CheckoutFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Address Form State
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

  // --- Reset form helper ---
  const resetForm = () => {
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
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  // --- Save / Create Address Mutation ---
  const saveAddressMutation = useMutation({
    mutationFn: async (data: typeof addressForm) => {
      const res = await api.post("/addresses", data);
      return res.data;
    },
    onSuccess: (saved: Address) => {
      toast.success("New address saved!");
      refetchAddresses();
      setSelectedAddress(saved._id);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to save address");
    },
  });

  // --- Update Address Mutation ---
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof addressForm }) => {
      const res = await api.put(`/addresses/${id}`, data);
      return res.data;
    },
    onSuccess: (updated: Address) => {
      toast.success("Address updated successfully!");
      refetchAddresses();
      setSelectedAddress(updated._id);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update address");
    },
  });

  // --- Delete Address Mutation ---
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/addresses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Address deleted successfully");
      refetchAddresses();
      if (selectedAddress) {
        // Clear if current selected was deleted
        const remaining = addresses.filter((a) => a._id !== selectedAddress);
        if (remaining.length > 0) {
          setSelectedAddress(remaining[0]._id);
        } else {
          setSelectedAddress("");
        }
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete address");
    },
  });

  // --- Set Default Address Mutation ---
  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/addresses/default/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Default address updated");
      refetchAddresses();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to set default address");
    },
  });

  const handleEditInit = (addr: Address, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingAddress(addr);
    setAddressForm({
      fullName: addr.fullName,
      mobileNumber: addr.mobileNumber,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setShowAddressForm(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this address?")) {
      deleteAddressMutation.mutate(id);
    }
  };

  const handleSetDefault = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDefaultAddressMutation.mutate(id);
  };

  const validateAndSubmitAddress = () => {
    const { fullName, mobileNumber, addressLine1, city, state, postalCode } = addressForm;
    if (!fullName.trim() || !mobileNumber.trim() || !addressLine1.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      toast.error("Please fill all required (*) fields");
      return;
    }
    // Simple phone validation
    if (!/^\d{10}$/.test(mobileNumber.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress._id, data: addressForm });
    } else {
      saveAddressMutation.mutate(addressForm);
    }
  };

  // Steps definitions
  const steps = [
    { number: 1, name: "Address", icon: MapPin },
    { number: 2, name: "Shipping", icon: Truck },
    { number: 3, name: "Payment", icon: CreditCard },
    { number: 4, name: "Review", icon: ShoppingBag },
  ];

  return (
    <div className="space-y-8">
      {/* ── STEPS NAVIGATION BAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_8px_30px_rgba(128,0,32,0.015)]">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;

            return (
              <div key={step.number} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => {
                    // Only allow clicking back to completed steps
                    if (step.number < currentStep) {
                      setCurrentStep(step.number);
                    }
                  }}
                  disabled={step.number >= currentStep}
                  className="flex flex-col items-center gap-1.5 focus:outline-none group disabled:cursor-not-allowed cursor-pointer"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${
                      isCompleted
                        ? "bg-primary border-primary text-white"
                        : isActive
                        ? "border-primary text-primary bg-secondary shadow-sm"
                        : "border-gray-200 text-gray-400 bg-white"
                    }`}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : step.number}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-semibold tracking-wider transition-colors duration-300 ${
                      isActive ? "text-primary font-bold" : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  >
                    {step.name}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 rounded transition-all duration-500 ${
                      isCompleted ? "bg-primary" : "bg-gray-100"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STEP CONTENT WRAPPER ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-[0_12px_40px_rgba(128,0,32,0.015)]">
        <AnimatePresence mode="wait">
          {/* STEP 1: DELIVERY ADDRESS */}
          {currentStep === 1 && (
            <motion.div
              key="step-address"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin size={20} className="text-primary" /> Delivery Address
                </h3>
                {!showAddressForm && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline cursor-pointer border-none bg-transparent"
                  >
                    <Plus size={14} /> Add New Address
                  </motion.button>
                )}
              </div>

              {/* ADDRESS ADD / EDIT FORM */}
              {showAddressForm && (
                <div className="bg-gray-50/50 border border-gray-150 rounded-2xl p-5 space-y-4">
                  <h4 className="font-serif text-sm font-bold text-gray-900 border-b border-gray-150 pb-2">
                    {editingAddress ? "Edit Saved Address" : "Add New Delivery Address"}
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Full Name *</label>
                      <input
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                        placeholder="Priya Sharma"
                        className="w-full border border-gray-200 p-3 rounded-xl text-xs outline-none focus:border-primary bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Mobile Number *</label>
                      <input
                        value={addressForm.mobileNumber}
                        onChange={(e) => setAddressForm({ ...addressForm, mobileNumber: e.target.value })}
                        placeholder="9876543210"
                        className="w-full border border-gray-200 p-3 rounded-xl text-xs outline-none focus:border-primary bg-white transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Street address *</label>
                      <input
                        value={addressForm.addressLine1}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                        placeholder="Flat, House No., Building, Company, Apartment"
                        className="w-full border border-gray-200 p-3 rounded-xl text-xs outline-none focus:border-primary bg-white transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Apartment, suite, unit etc. (optional)</label>
                      <input
                        value={addressForm.addressLine2}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                        placeholder="Landmark, Area or Sector"
                        className="w-full border border-gray-200 p-3 rounded-xl text-xs outline-none focus:border-primary bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Town / City *</label>
                      <input
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="Surat"
                        className="w-full border border-gray-200 p-3 rounded-xl text-xs outline-none focus:border-primary bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">State *</label>
                      <input
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        placeholder="Gujarat"
                        className="w-full border border-gray-200 p-3 rounded-xl text-xs outline-none focus:border-primary bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Postcode / ZIP *</label>
                      <input
                        value={addressForm.postalCode}
                        onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                        placeholder="395001"
                        className="w-full border border-gray-200 p-3 rounded-xl text-xs outline-none focus:border-primary bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Country</label>
                      <input
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        className="w-full border border-gray-200 p-3 rounded-xl text-xs outline-none focus:border-primary bg-white transition-all"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        className="w-4 h-4 accent-primary rounded border-gray-300"
                      />
                      <label htmlFor="isDefault" className="text-xs font-medium text-gray-700 cursor-pointer select-none">
                        Set as my default shipping address
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={validateAndSubmitAddress}
                      className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-primary/15 border-none cursor-pointer"
                    >
                      {saveAddressMutation.isPending || updateAddressMutation.isPending
                        ? "Saving..."
                        : editingAddress
                        ? "Update Address"
                        : "Save Address"}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={resetForm}
                      className="border border-gray-200 hover:bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer bg-white"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              )}

              {/* SAVED ADDRESSES GRID */}
              {!showAddressForm && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {addresses.length === 0 ? (
                    <div className="sm:col-span-2 text-center py-10 text-gray-400 text-xs">
                      No saved addresses found. Please add a shipping address.
                    </div>
                  ) : (
                    addresses.map((addr) => {
                      const isSelected = selectedAddress === addr._id;
                      return (
                        <div
                          key={addr._id}
                          onClick={() => setSelectedAddress(addr._id)}
                          className={`relative border rounded-2xl p-5 cursor-pointer flex gap-4 transition-all duration-300 hover:shadow-sm ${
                            isSelected
                              ? "border-primary bg-secondary/30 shadow-[0_4px_25px_rgba(128,0,32,0.03)]"
                              : "border-gray-150 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="pt-0.5">
                            <input
                              type="radio"
                              name="shipping_address"
                              value={addr._id}
                              checked={isSelected}
                              onChange={() => setSelectedAddress(addr._id)}
                              className="accent-primary w-4 h-4 cursor-pointer"
                            />
                          </div>
                          <div className="flex-1 min-w-0 text-xs text-gray-500 space-y-1 pr-8">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-gray-900 font-bold text-sm">{addr.fullName}</strong>
                              {addr.isDefault && (
                                <span className="bg-green-50 text-green-700 border border-green-150 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="line-clamp-2 text-gray-600 mt-1">{addr.addressLine1}</p>
                            {addr.addressLine2 && <p className="line-clamp-1">{addr.addressLine2}</p>}
                            <p className="font-semibold text-gray-800">{addr.city}, {addr.state} – {addr.postalCode}</p>
                            <p className="text-gray-800 pt-0.5 font-medium">📱 {addr.mobileNumber}</p>

                            {/* Actions bar inside card */}
                            <div className="flex gap-3 pt-3 border-t border-gray-50 mt-3 flex-wrap">
                              {!addr.isDefault && (
                                <button
                                  onClick={(e) => handleSetDefault(addr._id, e)}
                                  className="text-[10px] text-gray-400 hover:text-primary underline cursor-pointer border-none bg-transparent"
                                >
                                  Set default
                                </button>
                              )}
                              <button
                                onClick={(e) => handleEditInit(addr, e)}
                                className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-0.5 cursor-pointer border-none bg-transparent"
                              >
                                <Edit size={10} /> Edit
                              </button>
                              <button
                                onClick={(e) => handleDelete(addr._id, e)}
                                className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-0.5 cursor-pointer border-none bg-transparent"
                              >
                                <Trash2 size={10} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ACTION FOOTER */}
              {!showAddressForm && (
                <div className="border-t border-gray-100 pt-6 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!selectedAddress}
                    onClick={() => setCurrentStep(2)}
                    className="bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-8 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-primary/10 border-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Select Shipping Method <ChevronRight size={16} />
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: SHIPPING METHOD */}
          {currentStep === 2 && (
            <motion.div
              key="step-shipping"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
                <Truck size={20} className="text-primary" /> Shipping Method
              </h3>

              <div className="border border-primary bg-secondary/35 rounded-2xl p-5 flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Truck size={18} />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex justify-between items-baseline gap-4 mb-1">
                    <strong className="text-sm font-serif font-bold text-gray-900">Standard Home Delivery</strong>
                    <span className="font-sans font-bold text-primary text-sm">
                      {shipping === 0 ? "FREE" : `₹${shipping}`}
                    </span>
                  </div>
                  <p className="text-gray-500">Delivered within 3 to 5 business days straight to your doorstep.</p>
                  {shipping === 0 && (
                    <span className="inline-block bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider mt-2 px-2 py-0.5 rounded border border-green-150">
                      Free Shipping Unlocked 🎉
                    </span>
                  )}
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="border-t border-gray-100 pt-6 flex justify-between">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentStep(1)}
                  className="border border-gray-200 hover:bg-gray-100 text-gray-600 font-semibold text-sm px-6 py-3 rounded-xl cursor-pointer bg-white"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentStep(3)}
                  className="bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-8 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-primary/10 border-none cursor-pointer"
                >
                  Proceed To Payment <ChevronRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {currentStep === 3 && (
            <motion.div
              key="step-payment"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={20} className="text-primary" /> Choose Payment Option
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Online Payment Card */}
                <div
                  onClick={() => setPaymentMethod("ONLINE")}
                  className={`border rounded-2xl p-5 cursor-pointer transition-all duration-300 flex items-start gap-4 hover:shadow-sm ${
                    paymentMethod === "ONLINE"
                      ? "border-primary bg-secondary/35 shadow-[0_4px_25px_rgba(128,0,32,0.03)]"
                      : "border-gray-150 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    checked={paymentMethod === "ONLINE"}
                    onChange={() => setPaymentMethod("ONLINE")}
                    className="accent-primary w-4.5 h-4.5 mt-1 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <strong className="text-sm font-serif font-bold text-gray-900 block mb-1">Razorpay Secure Checkout</strong>
                    <p className="text-gray-500">Pay securely via UPI, Credit/Debit cards, Net Banking, or mobile wallets.</p>
                    <div className="mt-3 flex gap-2 flex-wrap items-center opacity-65">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">UPI</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">Cards</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">NetBanking</span>
                    </div>
                  </div>
                </div>

                {/* COD Card */}
                <div
                  onClick={() => setPaymentMethod("COD")}
                  className={`border rounded-2xl p-5 cursor-pointer transition-all duration-300 flex items-start gap-4 hover:shadow-sm ${
                    paymentMethod === "COD"
                      ? "border-primary bg-secondary/35 shadow-[0_4px_25px_rgba(128,0,32,0.03)]"
                      : "border-gray-150 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                    className="accent-primary w-4.5 h-4.5 mt-1 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <strong className="text-sm font-serif font-bold text-gray-900 block mb-1">Cash on Delivery (COD)</strong>
                    <p className="text-gray-500">Pay with cash when your parcel is delivered. Free COD available.</p>
                    <div className="mt-3">
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">
                        Pay on delivery
                      </span>
                    </div>
                  </div>
                </div>

                {/* Future method placeholder */}
                <div className="border border-gray-100 border-dashed rounded-2xl p-5 opacity-40 bg-gray-50/50 flex items-start gap-4">
                  <div className="w-4 h-4 border border-gray-300 rounded-full flex items-center justify-center text-gray-300 text-[10px] mt-1 select-none">
                    •
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <strong className="text-sm font-serif font-bold text-gray-900 block mb-1">EMI / PayLater</strong>
                    <p className="text-gray-500">Luxurious monthly payment schemes coming soon.</p>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="border-t border-gray-100 pt-6 flex justify-between">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentStep(2)}
                  className="border border-gray-200 hover:bg-gray-100 text-gray-600 font-semibold text-sm px-6 py-3 rounded-xl cursor-pointer bg-white"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentStep(4)}
                  className="bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-8 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-primary/10 border-none cursor-pointer"
                >
                  Review Order <ChevronRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: ORDER REVIEW & CONFIRM */}
          {currentStep === 4 && (
            <motion.div
              key="step-review"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag size={20} className="text-primary" /> Review Your Order
              </h3>

              {/* Summary blocks */}
              <div className="grid md:grid-cols-2 gap-6 bg-gray-50/50 rounded-2xl p-5 border border-gray-150 text-xs text-gray-500">
                <div className="space-y-1">
                  <h4 className="font-serif text-sm font-bold text-gray-950">Shipping Destination</h4>
                  {addresses.find((a) => a._id === selectedAddress) ? (
                    (() => {
                      const selectedAddrData = addresses.find((a) => a._id === selectedAddress)!;
                      return (
                        <>
                          <p className="font-bold text-gray-800">{selectedAddrData.fullName}</p>
                          <p>{selectedAddrData.addressLine1}</p>
                          {selectedAddrData.addressLine2 && <p>{selectedAddrData.addressLine2}</p>}
                          <p className="font-semibold text-gray-700">{selectedAddrData.city}, {selectedAddrData.state} – {selectedAddrData.postalCode}</p>
                          <p className="text-gray-800 pt-0.5">📱 {selectedAddrData.mobileNumber}</p>
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-red-500 font-medium">No address selected</p>
                  )}
                </div>

                <div className="space-y-1 md:border-l md:border-gray-200 md:pl-6">
                  <h4 className="font-serif text-sm font-bold text-gray-950">Payment Settings</h4>
                  <p className="font-bold text-gray-800">
                    {paymentMethod === "ONLINE" ? "Online Payment (Razorpay)" : "Cash on Delivery (COD)"}
                  </p>
                  <p className="text-gray-400">
                    {paymentMethod === "ONLINE"
                      ? "Pay securely in the next step using UPI/Cards."
                      : "Pay with cash at the time of delivery."}
                  </p>
                </div>
              </div>

              {/* Item reviews */}
              <div className="space-y-3.5 border-t border-gray-100 pt-5">
                <h4 className="font-serif text-sm font-bold text-gray-950">Products ({items.length})</h4>
                <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.product._id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                      <img
                        src={item.product.thumbnail?.url}
                        alt={item.product.name}
                        className="w-12 h-16 object-cover rounded bg-gray-50 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <strong className="text-gray-800 font-medium line-clamp-1">{item.product.name}</strong>
                        <p className="text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                        <p className="font-semibold text-primary mt-1">₹{(item.product.salePrice * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final order button */}
              <div className="border-t border-gray-100 pt-6 flex flex-col xs:flex-row justify-between items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={placingOrder}
                  onClick={() => setCurrentStep(3)}
                  className="border border-gray-200 hover:bg-gray-100 text-gray-600 font-semibold text-sm px-6 py-3 rounded-xl cursor-pointer bg-white w-full xs:w-auto text-center"
                >
                  Back
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={placingOrder || !selectedAddress}
                  onClick={handlePlaceOrder}
                  className="w-full xs:w-auto bg-gradient-to-r from-primary to-[#9B1B30] text-white hover:from-[#6B0018] hover:to-[#800020] font-bold text-sm px-10 py-3.5 rounded-xl shadow-md hover:shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer border-none"
                >
                  {placingOrder ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : paymentMethod === "COD" ? (
                    "Confirm Order (COD)"
                  ) : (
                    "Pay & Place Order"
                  )}
                </motion.button>
              </div>

              {/* Secure Trust Notice */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 bg-gray-50 py-2.5 rounded-xl">
                <ShieldCheck size={13} className="text-green-600 flex-shrink-0" />
                <span>Protected by SSL-encryption checkout gateway.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
