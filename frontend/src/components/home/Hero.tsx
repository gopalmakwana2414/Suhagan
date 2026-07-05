"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";

export default function Hero() {
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["hero-banners"],
    queryFn: async () => {
      const res = await api.get("/banners?position=hero");
      return res.data;
    },
  });

  const banner = banners[0]; // First active hero banner

  return (
    <section className="hero-gradient">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[700px]">
          {/* Left Content */}
          <div>
            <p className="text-[#b8860b] font-semibold uppercase tracking-[4px]">
              Premium Saree Collection
            </p>

            <h1 className="text-5xl lg:text-7xl font-bold mt-6 leading-tight">
              {banner ? banner.title : "Celebrate Every Occasion"}
              <span className="text-[#d4af37] block">
                {banner ? "" : "With Elegance"}
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 max-w-xl">
              {banner
                ? banner.subtitle
                : "Discover handcrafted Banarasi, Kanjivaram, Silk and Designer Sarees curated specially for weddings, festivals and special moments."}
            </p>

            <div className="flex gap-4 mt-10">
              <Link
                href={banner?.link || "/shop"}
                className="bg-[#d4af37] text-white px-8 py-4 rounded-full font-semibold hover:scale-105 transition"
              >
                {banner?.buttonText || "Shop Now"}
              </Link>

              <Link
                href="/collections"
                className="border border-[#d4af37] text-[#b8860b] px-8 py-4 rounded-full font-semibold hover:bg-[#fff8e7] transition"
              >
                View Collections
              </Link>
            </div>

            <div className="flex gap-10 mt-12">
              <div>
                <h3 className="font-bold text-2xl">10K+</h3>
                <p className="text-gray-500">Happy Customers</p>
              </div>

              <div>
                <h3 className="font-bold text-2xl">500+</h3>
                <p className="text-gray-500">Saree Designs</p>
              </div>

              <div>
                <h3 className="font-bold text-2xl">4.8★</h3>
                <p className="text-gray-500">Customer Rating</p>
              </div>
            </div>
          </div>

          {/* pulled from Cloudinary via the banner API, never a local file —
              shows a skeleton while loading and a placeholder if no hero
              banner has been added yet */}
          <div className="relative">
            {isLoading ? (
              <div className="rounded-3xl w-full h-[650px] bg-gray-100 animate-pulse" />
            ) : banner?.image?.url ? (
              <img
                src={optimizedCloudinaryUrl(banner.image.url, 1600)}
                alt={banner.title || "Suhagan Saree Collection"}
                className="rounded-3xl shadow-2xl w-full object-cover h-[650px]"
              />
            ) : (
              <div className="rounded-3xl shadow-2xl w-full h-[650px] hero-gradient border border-[#eee0c0] flex flex-col items-center justify-center text-center px-10">
                <p className="text-[#b8860b] font-semibold uppercase tracking-[3px] text-sm">
                  Suhagan
                </p>
                <p className="text-gray-400 mt-3 text-sm max-w-xs">
                  No hero banner has been added yet. Add one from Admin → Hero
                  Banners to feature it here.
                </p>
              </div>
            )}

            <div className="absolute bottom-8 left-8 bg-white p-5 rounded-2xl shadow-lg">
              <p className="font-semibold">
                {banner ? banner.title : "Wedding Collection"}
              </p>
              <p className="text-sm text-gray-500">
                {banner?.subtitle || "Starting from ₹2,999"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
