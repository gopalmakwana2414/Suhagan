import { Truck, RefreshCcw, Shield, Star, Factory, HeadphonesIcon } from "lucide-react";

const FEATURES = [
  {
    icon: <Factory size={28} className="text-[#d4af37]" />,
    title: "Direct from Factory",
    desc: "We manufacture every saree in our own Surat facility — zero middlemen, best price guaranteed.",
  },
  {
    icon: <Star size={28} className="text-[#d4af37]" />,
    title: "Authentic Handcraft",
    desc: "Each piece is handwoven by master weavers preserving centuries-old Indian textile traditions.",
  },
  {
    icon: <Truck size={28} className="text-[#d4af37]" />,
    title: "Free Shipping ₹999+",
    desc: "Get free pan-India delivery on orders above ₹999. Delivered in 3–7 business days.",
  },
  {
    icon: <RefreshCcw size={28} className="text-[#d4af37]" />,
    title: "7-Day Easy Returns",
    desc: "Not happy? Return your saree within 7 days for a full refund — no questions asked.",
  },
  {
    icon: <Shield size={28} className="text-[#d4af37]" />,
    title: "100% Secure Payment",
    desc: "Pay with UPI, card, or COD. All online transactions secured by Razorpay encryption.",
  },
  {
    icon: <HeadphonesIcon size={28} className="text-[#d4af37]" />,
    title: "Dedicated Support",
    desc: "Reach us on WhatsApp or email — our team responds within 24 hours, Monday to Saturday.",
  },
];

export default function WhyUs() {
  return (
    <section className="py-20 bg-[#111] text-white">
      <div className="container-custom">
        <div className="text-center mb-14">
          <p className="text-[#d4af37] font-semibold uppercase tracking-widest text-sm">
            Why Choose Us
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mt-3">
            The Kaumudi Promise
          </h2>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto">
            We&apos;re not just an online store — we&apos;re the factory. Every saree you
            see is made by us, for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-[#d4af37]/50 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="bg-[#d4af37]/10 w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#d4af37]/20 transition">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-7">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
