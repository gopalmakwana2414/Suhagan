"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Truck, 
  Crown, 
  Headphones, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Heart 
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { toast } from "sonner";

// Custom Payment Icons for Uniform Luxury Aesthetic
const VisaIcon = () => (
  <svg className="w-9 h-5 text-white/45 hover:text-accent-gold transition-colors duration-300 fill-current" viewBox="0 0 48 16" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
    <path d="M18.8 0.3L15.3 15.6H11.5L8 3.5C7.9 3.1 7.8 3 7.4 2.8C6.9 2.5 5.9 2.1 4.7 1.9L4.8 1.4H11.3C12.2 1.4 12.9 2 13.1 2.9L15 12.5L22.5 1.4H26.3L20.8 15.6H17.1L18.8 0.3ZM36.1 10.6C36.1 7.2 31.4 7 31.4 5.7C31.4 5.2 31.9 4.7 32.9 4.6C33.4 4.5 34.8 4.5 36.2 5.1L36.8 2.2C35.1 1.6 33 1.3 30.9 1.3C27.1 1.3 24.5 3.3 24.5 6.2C24.5 10 29.5 10.2 29.5 12C29.5 12.5 28.3 13 27.2 13C25.7 13 24.1 12.4 23.3 12L22.7 14.9C24.4 15.6 26.6 15.9 28.7 15.9C32.7 15.9 36.1 13.9 36.1 10.6ZM47.4 15.6H50.8L47.8 0.3H44.7C44 0.3 43.4 0.7 43.1 1.4L37 15.6H40.7L41.4 13.6H46.7L47.4 15.6ZM42.5 10.8L44.8 4.2L46.1 10.8H42.5ZM2.8 15.6L0 0.3H3.6L6.4 15.6H2.8Z" />
  </svg>
);

const MastercardIcon = () => (
  <svg className="w-8 h-5 text-white/45 hover:text-accent-gold transition-colors duration-300 fill-current" viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
    <circle cx="7" cy="8" r="7" opacity="0.6" />
    <circle cx="17" cy="8" r="7" opacity="0.6" />
    <path d="M12 1.3A6.9 6.9 0 0 1 14.6 8A6.9 6.9 0 0 1 12 14.7A6.9 6.9 0 0 1 9.4 8A6.9 6.9 0 0 1 12 1.3Z" opacity="0.8" />
  </svg>
);

const RuPayIcon = () => (
  <svg className="w-12 h-5 text-white/45 hover:text-accent-gold transition-colors duration-300" viewBox="0 0 68 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="RuPay">
    <text x="0" y="14" fill="currentColor" className="font-sans font-bold tracking-tighter text-[13px] italic">RuPay</text>
    <path d="M50 2 L58 2 L51 16 L43 16 Z" fill="currentColor" opacity="0.8" />
    <path d="M55 2 L63 2 L56 16 L48 16 Z" fill="currentColor" opacity="0.4" />
  </svg>
);

const UPIIcon = () => (
  <svg className="w-10 h-5 text-white/45 hover:text-accent-gold transition-colors duration-300" viewBox="0 0 45 16" xmlns="http://www.w3.org/2000/svg" aria-label="UPI">
    <text x="0" y="13" fill="currentColor" className="font-sans font-extrabold tracking-tight text-[13px] italic">UPI</text>
    <path d="M30 4 L38 4 L34 14 L26 14 Z" fill="currentColor" opacity="0.6" />
  </svg>
);

const RazorpayIcon = () => (
  <svg className="w-16 h-5 text-white/45 hover:text-accent-gold transition-colors duration-300 fill-none" viewBox="0 0 85 20" xmlns="http://www.w3.org/2000/svg" aria-label="Razorpay">
    <path d="M5 2L15 10L5 18L1 10L5 2Z" fill="currentColor" />
    <text x="18" y="15" fill="currentColor" className="font-sans font-bold text-[12px]">Razorpay</text>
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsLoading(true);
    // Simulate subscribe with beautiful success state
    setTimeout(() => {
      toast.success("Welcome to the Kaumudi Circle! Exclusive previews await you.");
      setIsSubscribed(true);
      setEmail("");
      setIsLoading(false);
    }, 1200);
  };

  const trustFeatures = [
    {
      icon: ShieldCheck,
      title: "Secure Payments",
      description: "100% encrypted checkout"
    },
    {
      icon: Truck,
      title: "Express Shipping",
      description: "Worldwide safe delivery"
    },
    {
      icon: Crown,
      title: "Premium Quality",
      description: "Authentic Surat weaves"
    },
    {
      icon: Headphones,
      title: "Dedicated Support",
      description: "Personal styling assistance"
    }
  ];

  return (
    <footer className="relative bg-[#4A0010] text-white pt-20 pb-8 border-t border-accent-gold/15 overflow-hidden">
      {/* Background rich gradient and center radial lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#31000a] via-[#4A0010] to-[#1a0005] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.05)_0%,transparent_60%)] pointer-events-none" />

      <div className="container-custom relative z-10">
        
        {/* 1. TRUST SECTION */}
        <div className="border-b border-accent-gold/10 pb-12 mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="flex items-center gap-4 p-5 rounded-xl bg-white/[0.01] border border-accent-gold/5 hover:border-accent-gold/15 hover:bg-white/[0.03] transition-all duration-300 group"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-accent-gold/10 border border-accent-gold/25 flex items-center justify-center text-accent-gold transition-all duration-300 group-hover:bg-accent-gold group-hover:text-black">
                    <Icon size={20} className="transition-transform duration-500 group-hover:rotate-[360deg]" />
                  </div>
                  <div>
                    <h4 className="font-serif text-accent-gold font-semibold text-sm tracking-wider">
                      {feature.title}
                    </h4>
                    <p className="text-gray-400 text-xs font-light mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 2. MAIN FOOTER COLUMNS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-12 pb-16 border-b border-accent-gold/10">
          
          {/* Logo, Description & Tagline Column */}
          <div className="space-y-6 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <div className="flex flex-col items-start">
              <Logo className="brightness-0 invert max-h-16 w-auto" />
              <p className="text-accent-gold font-serif italic text-sm tracking-wider mt-3">
                "Timeless elegance crafted for every celebration."
              </p>
            </div>
            
            <p className="text-gray-300 text-sm leading-8 font-light max-w-md">
              Premium handcrafted sarees from Surat — Banarasi, Kanjivaram, Silk, and designer weaves. Drape yourself in centuries of Indian textile heritage.
            </p>

            {/* Social Links */}
            <div className="flex gap-4 pt-2">
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/[0.03] rounded-full border border-white/10 flex items-center justify-center hover:bg-accent-gold hover:text-black hover:border-accent-gold hover:scale-110 hover:-rotate-6 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-300 cursor-pointer text-white/80"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current transition-transform duration-300" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/[0.03] rounded-full border border-white/10 flex items-center justify-center hover:bg-accent-gold hover:text-black hover:border-accent-gold hover:scale-110 hover:-rotate-6 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-300 cursor-pointer text-white/80"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current transition-transform duration-300" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://wa.me/918959465264"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/[0.03] rounded-full border border-white/10 flex items-center justify-center hover:bg-[#25D366] hover:text-white hover:border-[#25D366] hover:scale-110 hover:rotate-6 hover:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all duration-300 cursor-pointer text-white/80"
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4 fill-current transition-transform duration-300" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-6 md:pl-4">
            <h4 className="font-serif tracking-[3px] text-accent-gold uppercase text-xs font-semibold">
              Quick Links
            </h4>
            <div className="flex flex-col gap-3.5 text-gray-400 text-sm font-light">
              {[
                { href: "/", label: "Home" },
                { href: "/shop", label: "Shop All Sarees" },
                { href: "/collections", label: "Collections" },
                { href: "/categories", label: "Categories" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative text-gray-300 hover:text-accent-gold transition-colors duration-300 text-sm py-0.5 w-fit flex items-center"
                >
                  <span className="transition-transform duration-300 ease-out group-hover:translate-x-1.5 flex items-center">
                    {link.label}
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-accent-gold scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                </Link>
              ))}
            </div>
          </div>

          {/* Support Links Column */}
          <div className="space-y-6 md:pl-4">
            <h4 className="font-serif tracking-[3px] text-accent-gold uppercase text-xs font-semibold">
              Customer Support
            </h4>
            <div className="flex flex-col gap-3.5 text-gray-400 text-sm font-light">
              {[
                { href: "/shipping-policy", label: "Shipping Policy" },
                { href: "/refund-policy", label: "Refund & Return Policy" },
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/orders", label: "Track My Order" },
                { href: "/wishlist", label: "My Wishlist" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative text-gray-300 hover:text-accent-gold transition-colors duration-300 text-sm py-0.5 w-fit flex items-center"
                >
                  <span className="transition-transform duration-300 ease-out group-hover:translate-x-1.5 flex items-center">
                    {link.label}
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-accent-gold scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-6">
            <h4 className="font-serif tracking-[3px] text-accent-gold uppercase text-xs font-semibold">
              Get in Touch
            </h4>
            <div className="space-y-5 text-sm text-gray-300 font-light">
              
              <div className="flex items-start gap-3.5 group">
                <span className="text-accent-gold mt-1 transition-transform duration-300 group-hover:scale-110">
                  <Mail size={16} />
                </span>
                <div>
                  <p className="text-accent-gold/50 text-[9px] uppercase tracking-wider mb-0.5 font-bold">
                    Email Address
                  </p>
                  <a
                    href="mailto:g91652251@gmail.com"
                    className="hover:text-accent-gold transition-colors duration-300 break-all"
                  >
                    g91652251@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <span className="text-accent-gold mt-1 transition-transform duration-300 group-hover:scale-110">
                  <Phone size={16} />
                </span>
                <div>
                  <p className="text-accent-gold/50 text-[9px] uppercase tracking-wider mb-0.5 font-bold">
                    Phone / WhatsApp
                  </p>
                  <a
                    href="https://wa.me/918959465264"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent-gold transition-colors duration-300"
                  >
                    +91 89594 65264
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <span className="text-accent-gold mt-1 transition-transform duration-300 group-hover:scale-110">
                  <MapPin size={16} />
                </span>
                <div>
                  <p className="text-accent-gold/50 text-[9px] uppercase tracking-wider mb-0.5 font-bold">
                    Heritage Studio
                  </p>
                  <p className="leading-relaxed text-gray-300">
                    Ring Road, Surat<br />
                    Gujarat – 395002
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <span className="text-accent-gold mt-1 transition-transform duration-300 group-hover:scale-110">
                  <Clock size={16} />
                </span>
                <div>
                  <p className="text-accent-gold/50 text-[9px] uppercase tracking-wider mb-0.5 font-bold">
                    Working Hours
                  </p>
                  <p className="text-gray-300">Mon–Sat: 9AM – 6PM IST</p>
                </div>
              </div>

            </div>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-6 sm:col-span-2 lg:col-span-2 xl:col-span-1">
            <h4 className="font-serif tracking-[3px] text-accent-gold uppercase text-xs font-semibold">
              Stay Updated
            </h4>
            <p className="text-gray-300 text-sm font-light leading-relaxed">
              Subscribe to the Kaumudi Circle for private sales, loom launches, and heritage previews.
            </p>
            
            <AnimatePresence mode="wait">
              {!isSubscribed ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubscribe}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full bg-white/[0.03] border border-white/15 hover:border-white/25 focus:border-accent-gold focus:ring-1 focus:ring-accent-gold px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 font-light rounded-md"
                      aria-label="Email Address for Newsletter"
                      required
                      suppressHydrationWarning
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full bg-accent-gold hover:bg-[#C5A059] text-[#1a0005] py-3 rounded-md font-semibold text-xs uppercase tracking-widest transition-all duration-300 hover:tracking-[0.2em] flex items-center justify-center gap-2 group cursor-pointer shadow-md disabled:opacity-70"
                    suppressHydrationWarning
                  >
                    {isLoading ? "Subscribing..." : "Subscribe"}
                    <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="p-5 rounded-xl bg-white/[0.02] border border-accent-gold/20 flex flex-col items-center text-center space-y-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                    className="w-10 h-10 bg-accent-gold/10 rounded-full flex items-center justify-center text-accent-gold"
                  >
                    <CheckCircle2 size={20} />
                  </motion.div>
                  <div>
                    <h5 className="font-serif text-accent-gold text-sm font-semibold tracking-wider">Welcome to the Circle</h5>
                    <p className="text-gray-400 text-xs font-light mt-1">Exclusive previews will be delivered to your inbox.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* 3. PAYMENT & COPYRIGHT ROW */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-gray-500 font-light">
          
          {/* Copyright text */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 order-2 md:order-1 text-center md:text-left">
            <p>© {currentYear} Kaumudi. All Rights Reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy-policy" className="hover:text-accent-gold transition-colors duration-300">
                Privacy
              </Link>
              <Link href="/refund-policy" className="hover:text-accent-gold transition-colors duration-300">
                Returns
              </Link>
              <Link href="/shipping-policy" className="hover:text-accent-gold transition-colors duration-300">
                Shipping
              </Link>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="flex items-center gap-4.5 order-1 md:order-2 flex-wrap justify-center">
            <span className="text-[10px] uppercase tracking-wider text-white/30 mr-1.5 font-bold">Accepted Payments:</span>
            <div className="flex items-center gap-4">
              <VisaIcon />
              <MastercardIcon />
              <RuPayIcon />
              <UPIIcon />
              <RazorpayIcon />
            </div>
          </div>

          {/* Handcraft signature */}
          <p className="flex items-center gap-1 order-3 md:order-3 text-center">
            Made with <Heart size={11} className="text-accent-gold fill-accent-gold inline animate-pulse" /> in Surat, India
          </p>

        </div>

      </div>
    </footer>
  );
}
