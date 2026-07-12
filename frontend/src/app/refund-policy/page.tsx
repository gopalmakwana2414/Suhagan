import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Return Policy | Kaumudi",
  description: "Kaumudi return and refund policy — 7-day easy returns on all orders.",
};

export default function RefundPolicyPage() {
  return (
    <section className="py-20">
      <div className="container-custom max-w-3xl">
        <h1 className="text-4xl font-bold mb-3">Refund & Return Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: June 2025</p>

        <div className="space-y-8">

          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-green-800 mb-3">
              ✅ 7-Day Easy Return Policy
            </h2>
            <p className="text-gray-600">
              We want you to love your Kaumudi saree. If you&apos;re not completely satisfied,
              you may return most items within <strong>7 days</strong> of delivery for an
              exchange or refund.
            </p>
          </div>

          {[
            {
              title: "Eligible Returns",
              content: `We accept returns for the following reasons:
              • Product received is damaged or defective
              • Product received is different from what was ordered
              • Product has a manufacturing defect (colour bleeding, loose thread, torn fabric)

              Items must be returned in their original condition — unwashed, unworn, with tags intact, and in original packaging.`,
            },
            {
              title: "Non-Returnable Items",
              content: `The following cannot be returned:
              • Items that have been used, washed, or altered
              • Sale or clearance items (marked "Final Sale")
              • Custom or personalised orders
              • Blouse pieces that have been cut or stitched`,
            },
            {
              title: "How to Initiate a Return",
              content: `To start a return:
              1. Email us at g91652251@gmail.com within 7 days of delivery
              2. Include your Order ID, reason for return, and photos of the product
              3. Our team will verify and respond within 24–48 business hours
              4. Once approved, we will arrange a pickup or ask you to ship the item back`,
            },
            {
              title: "Refund Process",
              content: `Once we receive and inspect the returned item:
              • Online payment orders — refund credited to original payment method within 5–7 business days
              • COD orders — refund via bank transfer / UPI within 5–7 business days

              You will receive a confirmation email once the refund is processed.`,
            },
            {
              title: "Exchange Policy",
              content: `If you'd like to exchange for a different size or colour, we'll arrange a replacement 
              subject to availability. Exchanges are free on defective or incorrectly shipped products.`,
            },
            {
              title: "Cancellation Policy",
              content: `Orders can be cancelled within 12 hours of placement by contacting us on WhatsApp 
              or email. Once an order has been dispatched, it cannot be cancelled — you may return it 
              after delivery under the return policy above.`,
            },
          ].map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-bold mb-3">{section.title}</h2>
              <p className="text-gray-600 leading-8 whitespace-pre-line">{section.content}</p>
            </div>
          ))}

          <div className="bg-gray-50 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-3">Contact Us</h2>
            <p className="text-gray-600">
              For return or refund queries:{" "}
              <a href="mailto:g91652251@gmail.com" className="text-[#b8860b] underline">
                g91652251@gmail.com
              </a>{" "}
              |{" "}
              <a href="https://wa.me/918959465264" className="text-[#b8860b] underline">
                WhatsApp +91 89594 65264
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
