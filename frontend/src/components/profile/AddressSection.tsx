"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Edit2, Trash2, Plus, X, Check, Shield } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface AddressSectionProps {
  addresses: any[];
  isLoading: boolean;
}

export default function AddressSection({ addresses, isLoading }: AddressSectionProps) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [addressForm, setAddressForm] = useState({
    _id: "",
    fullName: "",
    mobileNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
  });

  // Saved Address Add/Edit Mutations
  const addressSaveMutation = useMutation({
    mutationFn: async (data: typeof addressForm) => {
      if (data._id) {
        // Edit Mode
        const res = await api.put(`/addresses/${data._id}`, data);
        return res.data;
      } else {
        // Create Mode
        const res = await api.post("/addresses", data);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      toast.success(addressForm._id ? "Address updated successfully." : "Address added successfully.");
      setShowModal(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to save address.");
    },
  });

  // Delete Address
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/addresses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      toast.success("Address deleted successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete address.");
    },
  });

  // Set Address as Default
  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/addresses/default/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      toast.success("Default address updated.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update default address.");
    },
  });

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!addressForm.fullName.trim()) tempErrors.fullName = "Contact name is required";
    if (!addressForm.mobileNumber.trim()) {
      tempErrors.mobileNumber = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(addressForm.mobileNumber.trim())) {
      tempErrors.mobileNumber = "Please enter a valid 10-digit Indian mobile number";
    }
    if (!addressForm.addressLine1.trim()) tempErrors.addressLine1 = "Flat, house, or street details are required";
    if (!addressForm.city.trim()) tempErrors.city = "City is required";
    if (!addressForm.state.trim()) tempErrors.state = "State is required";
    if (!addressForm.postalCode.trim()) {
      tempErrors.postalCode = "Pin code is required";
    } else if (!/^\d{6}$/.test(addressForm.postalCode.trim())) {
      tempErrors.postalCode = "Please enter a valid 6-digit pin code";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleOpenAddModal = () => {
    setAddressForm({
      _id: "",
      fullName: "",
      mobileNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      isDefault: false,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (addr: any) => {
    setAddressForm({
      _id: addr._id,
      fullName: addr.fullName || "",
      mobileNumber: addr.mobileNumber || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      country: addr.country || "India",
      isDefault: addr.isDefault || false,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      addressSaveMutation.mutate(addressForm);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-6">
          <h2 className="font-serif text-2xl font-bold text-gray-900">Saved Addresses</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 h-48 animate-pulse luxury-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-6">
        <h2 className="font-serif text-2xl font-bold text-gray-900">Saved Addresses</h2>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md hover:shadow-lg shadow-primary/20 cursor-pointer"
        >
          <Plus size={14} /> Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-[0_20px_50px_rgba(128,0,32,0.02)] flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center shadow-inner">
            <MapPin className="text-primary/60" size={24} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-800">No Saved Addresses</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Add a default delivery address to speed up checkout.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="text-xs bg-primary text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition cursor-pointer"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <motion.div
              layout
              key={addr._id}
              className={`bg-white rounded-2xl border p-6 shadow-sm transition flex flex-col justify-between relative ${
                addr.isDefault
                  ? "border-primary bg-[#FFF8F8]/40 shadow-[0_8px_30px_rgb(128,0,32,0.02)]"
                  : "border-gray-150 hover:border-gray-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-serif text-sm font-bold text-gray-800">{addr.fullName}</span>
                  {addr.isDefault && (
                    <span className="text-[9px] bg-primary/10 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Default Shipping
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1 text-gray-600 leading-relaxed font-sans font-light">
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  <p>
                    {addr.city}, {addr.state} – {addr.postalCode}
                  </p>
                  <p className="flex items-center gap-1 text-gray-400 font-semibold pt-1">
                    <Phone size={12} /> +91 {addr.mobileNumber}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-center justify-between mt-6">
                {!addr.isDefault ? (
                  <button
                    onClick={() => setDefaultAddressMutation.mutate(addr._id)}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Check size={14} /> Default Shipping Set
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenEditModal(addr)}
                    className="p-1.5 rounded-lg border border-gray-100 hover:border-primary text-gray-400 hover:text-primary transition bg-white shadow-sm cursor-pointer"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => deleteAddressMutation.mutate(addr._id)}
                    className="p-1.5 rounded-lg border border-gray-100 hover:border-red-500 text-gray-400 hover:text-red-500 transition bg-white shadow-sm cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 transition shrink-0"
              >
                <X size={20} />
              </button>

              <h3 className="font-serif text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                <MapPin size={22} className="text-primary" />
                {addressForm._id ? "Edit Address Details" : "Add Shipping Address"}
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4 font-sans text-xs">
                {/* Contact Name & Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Receiver Name
                    </label>
                    <input
                      type="text"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      className={`w-full border p-3 rounded-xl outline-none bg-gray-50/50 focus:bg-white focus:border-primary transition ${
                        errors.fullName ? "border-rose-500 focus:border-rose-500" : "border-gray-200"
                      }`}
                      placeholder="e.g. Aditi Sharma"
                    />
                    {errors.fullName && <p className="text-[10px] text-rose-500 mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={addressForm.mobileNumber}
                      onChange={(e) => setAddressForm({ ...addressForm, mobileNumber: e.target.value })}
                      className={`w-full border p-3 rounded-xl outline-none bg-gray-50/50 focus:bg-white focus:border-primary transition ${
                        errors.mobileNumber ? "border-rose-500 focus:border-rose-500" : "border-gray-200"
                      }`}
                      placeholder="10-digit number"
                    />
                    {errors.mobileNumber && <p className="text-[10px] text-rose-500 mt-1">{errors.mobileNumber}</p>}
                  </div>
                </div>

                {/* Flat / Street details */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Flat / House No. / Building Name
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    className={`w-full border p-3 rounded-xl outline-none bg-gray-50/50 focus:bg-white focus:border-primary transition ${
                      errors.addressLine1 ? "border-rose-500 focus:border-rose-500" : "border-gray-200"
                    }`}
                    placeholder="Flat 302, 3rd Floor, Golden Heights"
                  />
                  {errors.addressLine1 && <p className="text-[10px] text-rose-500 mt-1">{errors.addressLine1}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Street Address / Locality / Landmark
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine2}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none bg-gray-50/50 focus:bg-white focus:border-primary transition"
                    placeholder="Near City Mall, MG Road"
                  />
                </div>

                {/* City, State & Pin */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className={`w-full border p-3 rounded-xl outline-none bg-gray-50/50 focus:bg-white focus:border-primary transition ${
                        errors.city ? "border-rose-500 focus:border-rose-500" : "border-gray-200"
                      }`}
                      placeholder="Mumbai"
                    />
                    {errors.city && <p className="text-[10px] text-rose-500 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className={`w-full border p-3 rounded-xl outline-none bg-gray-50/50 focus:bg-white focus:border-primary transition ${
                        errors.state ? "border-rose-500 focus:border-rose-500" : "border-gray-200"
                      }`}
                      placeholder="Maharashtra"
                    />
                    {errors.state && <p className="text-[10px] text-rose-500 mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Pin Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value.replace(/\D/g, "") })}
                      className={`w-full border p-3 rounded-xl outline-none bg-gray-50/50 focus:bg-white focus:border-primary transition ${
                        errors.postalCode ? "border-rose-500 focus:border-rose-500" : "border-gray-200"
                      }`}
                      placeholder="400001"
                    />
                    {errors.postalCode && <p className="text-[10px] text-rose-500 mt-1">{errors.postalCode}</p>}
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={addressForm.country}
                    className="w-full border border-gray-200 p-3 rounded-xl outline-none bg-gray-100 text-gray-400 cursor-not-allowed"
                  />
                </div>

                {/* Set as Default Switch */}
                <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="accent-primary w-4.5 h-4.5 rounded"
                  />
                  <span className="text-[11px] text-gray-500 font-medium">Set as my default shipping address</span>
                </label>

                <button
                  type="submit"
                  disabled={addressSaveMutation.isPending}
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-primary-dark transition mt-6 disabled:opacity-60 cursor-pointer shadow-md hover:shadow-lg shadow-primary/20"
                >
                  {addressSaveMutation.isPending ? "Saving..." : addressForm._id ? "Update Address" : "Save Address"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
