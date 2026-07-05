"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { X, ImagePlus, Upload } from "lucide-react";

import {
  productSchema,
  ProductFormData,
  ProductFormInput,
} from "@/lib/validations/product";

import { useCategories } from "@/hooks/useCategories";

import {
  useCreateProduct,
  useUpdateProduct,
} from "@/hooks/useProductMutations";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  product?: any;
}

const DEFAULT_VALUES: ProductFormData = {
  name: "",
  sku: "",
  category: "",
  originalPrice: 0,
  salePrice: 0,
  stock: 0,
  fabric: "",
  color: "",
  occasion: "",
  blouseIncluded: false,
  featured: false,
  bestseller: false,
  newArrival: false,
  shortDescription: "",
  description: "",
  metaTitle: "",
  metaDescription: "",
};

export default function ProductModal({ open, setOpen, product }: Props) {
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInput, any, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;

    if (product) {
      reset({
        name: product.name ?? "",
        sku: product.sku ?? "",
        category: product.category?._id ?? product.category ?? "",
        originalPrice: product.originalPrice ?? 0,
        salePrice: product.salePrice ?? 0,
        stock: product.stock ?? 0,
        fabric: product.fabric ?? "",
        color: product.color ?? "",
        occasion: product.occasion ?? "",
        blouseIncluded: product.blouseIncluded ?? false,
        featured: product.featured ?? false,
        bestseller: product.bestseller ?? false,
        newArrival: product.newArrival ?? false,
        shortDescription: product.shortDescription ?? "",
        description: product.description ?? "",
        metaTitle: product.metaTitle ?? "",
        metaDescription: product.metaDescription ?? "",
      });
      setThumbnailPreview(product.thumbnail?.url ?? null);
      setExistingImages(product.images ?? []);
    } else {
      reset(DEFAULT_VALUES);
      setThumbnailPreview(null);
      setExistingImages([]);
    }

    setThumbnailFile(null);
    setGalleryFiles([]);
  }, [open, product, reset]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;

  const handleClose = () => {
    reset(DEFAULT_VALUES);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setGalleryFiles([]);
    setExistingImages([]);
    setOpen(false);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Require a thumbnail for new products
      if (!product && !thumbnailFile) {
        toast.error("Please upload a thumbnail image");
        return;
      }

      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      galleryFiles.forEach((file) => {
        formData.append("images", file);
      });

      if (product) {
        await updateProduct.mutateAsync({
          id: product._id,
          formData,
        });
        toast.success("Product updated successfully!");
      } else {
        await createProduct.mutateAsync(formData);
        toast.success("Product created successfully!");
      }

      handleClose();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  const isSaving = createProduct.isPending || updateProduct.isPending;

  const inputClass =
    "w-full border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-[#d4af37] transition";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1.5";
  const errorClass = "text-red-500 text-xs mt-1";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onMouseDown={handleClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-4xl rounded-3xl my-10 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b sticky top-0 bg-white rounded-t-3xl z-10">
          <h2 className="text-xl font-bold">
            {product ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={handleClose}
            type="button"
            className="text-gray-400 hover:text-gray-700 transition"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          {/* ── BASIC INFO ── */}
          <div>
            <h3 className="font-semibold text-[#b8860b] mb-4 text-sm uppercase tracking-wide">
              Basic Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Product Name *</label>
                <input
                  {...register("name")}
                  placeholder="e.g. Royal Banarasi Silk Saree"
                  className={inputClass}
                />
                {errors.name && <p className={errorClass}>{errors.name.message}</p>}
              </div>

              <div>
                <label className={labelClass}>SKU *</label>
                <input
                  {...register("sku")}
                  placeholder="e.g. SHG-BAN-001"
                  className={`${inputClass} uppercase`}
                />
                {errors.sku && <p className={errorClass}>{errors.sku.message}</p>}
              </div>

              <div>
                <label className={labelClass}>Category *</label>
                <select {...register("category")} className={inputClass}>
                  <option value="">Select Category</option>
                  {categories.map((cat: any) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className={errorClass}>{errors.category.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── PRICING & STOCK ── */}
          <div>
            <h3 className="font-semibold text-[#b8860b] mb-4 text-sm uppercase tracking-wide">
              Pricing & Stock
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Original Price (₹) *</label>
                <input
                  type="number"
                  step="1"
                  {...register("originalPrice")}
                  placeholder="3999"
                  className={inputClass}
                />
                {errors.originalPrice && (
                  <p className={errorClass}>{errors.originalPrice.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Sale Price (₹) *</label>
                <input
                  type="number"
                  step="1"
                  {...register("salePrice")}
                  placeholder="2999"
                  className={inputClass}
                />
                {errors.salePrice && (
                  <p className={errorClass}>{errors.salePrice.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Stock Quantity *</label>
                <input
                  type="number"
                  {...register("stock")}
                  placeholder="50"
                  className={inputClass}
                />
                {errors.stock && (
                  <p className={errorClass}>{errors.stock.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── PRODUCT DETAILS ── */}
          <div>
            <h3 className="font-semibold text-[#b8860b] mb-4 text-sm uppercase tracking-wide">
              Product Details
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Fabric *</label>
                <input
                  {...register("fabric")}
                  placeholder="e.g. Pure Silk"
                  className={inputClass}
                />
                {errors.fabric && (
                  <p className={errorClass}>{errors.fabric.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Color *</label>
                <input
                  {...register("color")}
                  placeholder="e.g. Maroon"
                  className={inputClass}
                />
                {errors.color && (
                  <p className={errorClass}>{errors.color.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Occasion *</label>
                <input
                  {...register("occasion")}
                  placeholder="e.g. Wedding"
                  className={inputClass}
                />
                {errors.occasion && (
                  <p className={errorClass}>{errors.occasion.message}</p>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 mt-4 cursor-pointer w-fit">
              <input
                type="checkbox"
                {...register("blouseIncluded")}
                className="accent-[#d4af37] w-4 h-4"
              />
              <span className="text-sm">Blouse piece included</span>
            </label>
          </div>

          {/* ── DESCRIPTIONS ── */}
          <div>
            <h3 className="font-semibold text-[#b8860b] mb-4 text-sm uppercase tracking-wide">
              Descriptions
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Short Description * (shown in product cards)
                </label>
                <textarea
                  {...register("shortDescription")}
                  rows={2}
                  placeholder="A brief, catchy description..."
                  className={`${inputClass} resize-none`}
                />
                {errors.shortDescription && (
                  <p className={errorClass}>{errors.shortDescription.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Full Description *</label>
                <textarea
                  {...register("description")}
                  rows={4}
                  placeholder="Detailed product description..."
                  className={`${inputClass} resize-none`}
                />
                {errors.description && (
                  <p className={errorClass}>{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── VISIBILITY FLAGS ── */}
          <div>
            <h3 className="font-semibold text-[#b8860b] mb-4 text-sm uppercase tracking-wide">
              Visibility
            </h3>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("featured")}
                  className="accent-[#d4af37] w-4 h-4"
                />
                <span className="text-sm">Featured (homepage)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("bestseller")}
                  className="accent-[#d4af37] w-4 h-4"
                />
                <span className="text-sm">Bestseller</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("newArrival")}
                  className="accent-[#d4af37] w-4 h-4"
                />
                <span className="text-sm">New Arrival</span>
              </label>
            </div>
          </div>

          {/* ── IMAGES ── */}
          <div>
            <h3 className="font-semibold text-[#b8860b] mb-4 text-sm uppercase tracking-wide">
              Images
            </h3>

            {/* Thumbnail */}
            <div className="mb-6">
              <label className={labelClass}>
                Thumbnail Image {!product && "*"} (main product photo)
              </label>
              <label className="flex items-center gap-4 cursor-pointer">
                <div className="w-24 h-28 bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden hover:border-[#d4af37] transition flex-shrink-0">
                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload size={20} className="text-gray-300" />
                  )}
                </div>
                <span className="text-sm text-[#b8860b] font-medium border border-[#d4af37] px-4 py-2 rounded-xl hover:bg-[#fff8e7] transition">
                  {thumbnailPreview ? "Change Thumbnail" : "Choose Thumbnail"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Gallery */}
            <div>
              <label className={labelClass}>Gallery Images (multiple, optional)</label>

              {existingImages.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">Current images:</p>
                  <div className="flex flex-wrap gap-2">
                    {existingImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}

              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[#b8860b] font-medium border border-[#d4af37] px-4 py-2 rounded-xl hover:bg-[#fff8e7] transition w-fit">
                <ImagePlus size={15} />
                Add Gallery Images
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (!e.target.files) return;
                    const newFiles = Array.from(e.target.files);
                    setGalleryFiles((prev) => [...prev, ...newFiles]);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
              </label>

              {galleryFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {galleryFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryFiles(galleryFiles.filter((_, i) => i !== index))
                        }
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── SEO (optional, collapsed-style) ── */}
          <div>
            <h3 className="font-semibold text-[#b8860b] mb-4 text-sm uppercase tracking-wide">
              SEO (Optional)
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Meta Title</label>
                <input
                  {...register("metaTitle")}
                  placeholder="For search engines"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Meta Description</label>
                <input
                  {...register("metaDescription")}
                  placeholder="For search engines"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* ── ACTIONS ── */}
          <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white pb-1">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#d4af37] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#b8860b] transition disabled:opacity-60"
            >
              {isSaving ? "Saving..." : product ? "Update Product" : "Create Product"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="border px-8 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
