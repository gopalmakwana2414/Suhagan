"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import ScrollReveal from "@/components/ui/ScrollReveal";
import api from "@/lib/api";

export default function Newsletter() {
  const { user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
    } else {
      setEmail("");
    }
  }, [user]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to subscribe to our newsletter.");
      return;
    }
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post("/subscribers", { email });
      toast.success(response.data?.message || "Welcome to the Kaumudi Circle! Exclusive previews await you.");
      setEmail("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container-custom">
        <ScrollReveal>
          <div className="bg-[#4A0010] text-white rounded-3xl p-8 md:p-16 relative overflow-hidden shadow-2xl border border-accent-gold/25">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
              <span className="text-accent-gold font-semibold uppercase tracking-[5px] text-xs">
                The Kaumudi Circle
              </span>
              
              <h2 className="text-3xl md:text-5xl font-serif font-light leading-tight">
                Subscribe For Exclusive Previews
              </h2>

              <p className="text-gray-300 text-sm md:text-base font-light leading-relaxed max-w-md mx-auto">
                Join our premium newsletter circle to receive notifications on loom launches, private sales, and heritage collection drops.
              </p>

              <form onSubmit={handleSubscribe} className="pt-4 max-w-md mx-auto">
                <div className="relative flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                      <Mail size={16} />
                    </span>
                    <input
                      suppressHydrationWarning
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={user ? "Enter your email address" : "Please log in to join"}
                      className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-accent-gold rounded-full text-white placeholder-gray-400 outline-none text-sm transition-all disabled:opacity-50"
                      required
                      disabled={!user}
                      readOnly={!!user}
                    />
                  </div>

                  <motion.button
                    suppressHydrationWarning
                    whileHover={user ? { scale: 1.03 } : {}}
                    whileTap={user ? { scale: 0.97 } : {}}
                    type="submit"
                    disabled={isLoading || !user}
                    className="bg-accent-gold hover:bg-[#C5A059] text-[#1a0004] px-7 py-3.5 rounded-full text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isLoading ? "Subscribing..." : user ? "Join Now" : "Log In to Join"}
                    <ArrowRight size={13} />
                  </motion.button>
                </div>
              </form>

              <p className="text-[10px] text-gray-400 font-light">
                By subscribing, you agree to our privacy policy. We protect your privacy and do not spam.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
