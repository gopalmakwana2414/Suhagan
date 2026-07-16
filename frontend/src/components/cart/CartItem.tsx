"use client";

import { useState } from "react";
import { Trash2, Heart, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type CartItemProps = {
  item: any;
  updateQuantity: (productId: string, quantity: number, stock: number, name: string) => void;
  removeItem: (productId: string) => void;
};

export default function CartItem({ item, updateQuantity, removeItem }: CartItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const product = item.product;
  const quantity = item.quantity;
  const isLowStock = product.stock <= 5;

  const originalPrice = product.originalPrice || product.salePrice;
  const salePrice = product.salePrice;
  const hasDiscount = originalPrice > salePrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  const handleWishlistClick = () => {
    setIsWishlisted(!isWishlisted);
    if (!isWishlisted) {
      toast.success(`"${product.name}" moved to wishlist placeholder!`, {
        icon: "❤️",
        description: "This is a future-ready feature placeholder.",
      });
    } else {
      toast.info(`"${product.name}" removed from wishlist placeholder.`);
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-[0_12px_40px_rgba(128,0,32,0.04)] transition-all duration-500 p-4 sm:p-5 flex flex-col sm:flex-row gap-5">
      {/* Product Image Container */}
      <div className="relative w-full sm:w-28 md:w-32 h-44 sm:h-40 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
        <img
          src={product.thumbnail?.url || "/placeholder-saree.jpg"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold tracking-widest px-2 py-0.5 rounded uppercase shadow-sm">
            {discountPercent}% Off
          </div>
        )}
      </div>

      {/* Details Container */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="space-y-1">
          {/* Top section: Category & SKU */}
          <div className="flex justify-between items-start gap-4">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-primary/70">
              {product.category?.name || "Saree Collection"}
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              SKU: {product.sku || "KMD-SR-001"}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-lg text-gray-900 leading-tight group-hover:text-primary transition-colors truncate pr-6">
            {product.name}
          </h3>

          {/* Attributes: Fabric, Color, Size */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 pt-1">
            {product.fabric && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                Fabric: <strong className="text-gray-700 font-medium">{product.fabric}</strong>
              </span>
            )}
            {product.color && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                Color: <strong className="text-gray-700 font-medium">{product.color}</strong>
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              Size: <strong className="text-gray-700 font-medium">OS (Free Size)</strong>
            </span>
          </div>

          {/* Stock Status Badge */}
          <div className="pt-1.5">
            {product.stock === 0 ? (
              <span className="inline-flex items-center text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Only {product.stock} units left
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                In Stock
              </span>
            )}
          </div>
        </div>

        {/* Bottom pricing and controls */}
        <div className="flex flex-wrap items-end justify-between gap-4 mt-4 pt-3 border-t border-gray-50">
          {/* Price details */}
          <div className="space-y-0.5">
            <p className="text-xs text-gray-400">Price</p>
            <div className="flex items-baseline gap-2">
              <span className="font-sans font-bold text-gray-900 text-base">
                ₹{salePrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xs line-through text-gray-400">
                  ₹{originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-[10px] text-green-600 font-medium">
                Save ₹{(originalPrice - salePrice).toLocaleString()}
              </p>
            )}
          </div>

          {/* Quantity Selector controls */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 font-medium hidden xs:inline">Quantity</span>
            <div className="flex items-center border border-gray-200 rounded-full bg-gray-50/50 p-1 shadow-inner transition-all hover:border-gray-300">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#f3f4f6" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (quantity === 1) {
                    setConfirmDelete(true);
                  } else {
                    updateQuantity(product._id, quantity - 1, product.stock, product.name);
                  }
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
                title="Decrease Quantity"
                aria-label="Decrease Quantity"
              >
                <Minus size={13} />
              </motion.button>

              <span className="w-8 text-center font-medium text-gray-900 text-sm select-none">
                {quantity}
              </span>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#f3f4f6" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (quantity >= product.stock) {
                    toast.error(`Maximum stock reached. Only ${product.stock} units available.`);
                  } else {
                    updateQuantity(product._id, quantity + 1, product.stock, product.name);
                  }
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
                title="Increase Quantity"
                aria-label="Increase Quantity"
              >
                <Plus size={13} />
              </motion.button>
            </div>
          </div>

          {/* Item Subtotal */}
          <div className="text-right">
            <p className="text-xs text-gray-400">Subtotal</p>
            <span className="font-sans font-bold text-primary text-base">
              ₹{(salePrice * quantity).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Top right quick actions */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        {/* Wishlist Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleWishlistClick}
          className={`p-2 rounded-full border transition-all duration-300 cursor-pointer bg-white ${
            isWishlisted
              ? "border-red-100 text-red-500 shadow-sm"
              : "border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100"
          }`}
          title="Move to Wishlist"
          aria-label="Move to Wishlist"
        >
          <Heart size={15} fill={isWishlisted ? "currentColor" : "none"} />
        </motion.button>

        {/* Delete button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setConfirmDelete(true)}
          className="p-2 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-primary hover:border-primary/20 hover:bg-secondary transition-all duration-300 cursor-pointer"
          title="Remove Item"
          aria-label="Remove Item"
        >
          <Trash2 size={15} />
        </motion.button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(false)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-gray-900">Remove from Bag?</DialogTitle>
            <DialogDescription className="text-gray-500 mt-2 text-sm">
              Are you sure you want to remove <span className="font-medium text-gray-800">"{product.name}"</span> from your shopping bag?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              className="rounded-xl px-5 border-gray-200 hover:bg-gray-50 text-gray-600 font-medium h-10 transition-all cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                removeItem(product._id);
                setConfirmDelete(false);
              }}
              className="rounded-xl px-5 bg-primary hover:bg-primary-dark text-white font-medium h-10 transition-all cursor-pointer border-none shadow-md shadow-primary/20"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
