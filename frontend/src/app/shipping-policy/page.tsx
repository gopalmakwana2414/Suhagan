import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy | Kaumudi",
  description: "Kaumudi shipping policy — delivery timelines, charges, and tracking.",
};

export default function ShippingPolicyPage() {
  return (
    <section className="py-20">
      <div className="container-custom max-w-3xl">
        <h1 className="text-4xl font-bold mb-3">Shipping Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: June 2025</p>

        <div className="prose prose-gray max-w-none space-y-8">

          <div className="bg-[#fff8e7] border border-[#f0d060] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-[#b8860b] mb-3">Free Shipping</h2>
            <p className="text-gray-600">
              We offer <strong>free shipping on all orders above ₹999</strong> across India.
              For orders below ₹999, a flat shipping charge of <strong>₹99</strong> applies.
            </p>
          </div>

          {[
            {
              title: "Processing Time",
              content: `All orders are processed within 1–2 business days (Monday to Saturday, excluding public holidays). 
              You will receive an email confirmation once your order has been dispatched.`,
            },
            {
              title: "Delivery Timeline",
              content: `Standard delivery takes 5–7 business days depending on your location:
              • Metro cities (Mumbai, Delhi, Bangalore, Surat, etc.) — 3–5 days
              • Tier 2 cities — 5–7 days
              • Remote or rural areas — 7–10 days
              These are estimated timelines and may vary during peak festival seasons (Diwali, Navratri, etc.).`,
            },
            {
              title: "Shipping Partners",
              content: `We ship through trusted courier partners including Delhivery, Blue Dart, and India Post 
              to ensure your sarees arrive safely. A tracking number will be shared via email/SMS once dispatched.`,
            },
            {
              title: "Packaging",
              content: `Every Kaumudi saree is carefully packaged in protective, eco-friendly packaging to prevent 
              damage during transit. Sarees are folded, wrapped in tissue paper, and placed in a branded box.`,
            },
            {
              title: "Shipping to International Locations",
              content: `Currently, we only ship within India. International shipping will be available soon. 
              If you are outside India and wish to order, please contact us at g91652251@gmail.com.`,
            },
            {
              title: "Incorrect Address",
              content: `Please ensure your delivery address is complete and accurate at the time of placing your order. 
              Kaumudi is not responsible for non-delivery due to an incorrect or incomplete address provided by the customer.`,
            },
          ].map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-bold mb-3">{section.title}</h2>
              <p className="text-gray-600 leading-8 whitespace-pre-line">{section.content}</p>
            </div>
          ))}

          <div className="bg-gray-50 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-3">Need Help?</h2>
            <p className="text-gray-600">
              For shipping queries, contact us at{" "}
              <a href="mailto:g91652251@gmail.com" className="text-[#b8860b] underline">
                g91652251@gmail.com
              </a>{" "}
              or call/WhatsApp{" "}
              <a href="https://wa.me/918959465264" className="text-[#b8860b] underline">
                +91 89594 65264
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
