"use client";

import { Heart, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function WishlistPlaceholder() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-6">
        <h2 className="font-serif text-2xl font-bold text-gray-900">My Wishlist</h2>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-12 md:p-16 text-center shadow-[0_20px_50px_rgba(128,0,32,0.02)] flex flex-col items-center justify-center space-y-5">
        <div className="relative">
          {/* Subtle heartbeat animation for luxury look */}
          <div className="w-18 h-18 rounded-full bg-secondary flex items-center justify-center shadow-inner relative z-10">
            <Heart size={28} className="text-primary fill-primary/10 animate-pulse" />
          </div>
          <div className="absolute inset-0 bg-[#FFF8F8] rounded-full scale-110 -z-0 opacity-40 blur-xs" />
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-xl font-bold text-gray-800">Your Wishlist is Empty</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed font-sans font-light">
            Keep track of the sarees you love. Adorn your wardrobe with standard works of art waiting to be crafted for your elegance.
          </p>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-xl text-xs font-bold transition shadow-md hover:shadow-lg shadow-primary/20 cursor-pointer"
        >
          Explore Collections <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
