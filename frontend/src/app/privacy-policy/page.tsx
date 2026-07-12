import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Kaumudi",
  description: "Kaumudi privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="py-20">
      <div className="container-custom max-w-3xl">
        <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: June 2025</p>

        <div className="space-y-8">

          <p className="text-gray-600 leading-8">
            Kaumudi (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to
            protecting your privacy. This policy explains what information we collect when you
            visit <strong>kaumudi.com</strong>, how we use it, and your rights regarding your data.
          </p>

          {[
            {
              title: "1. Information We Collect",
              content: `When you use Kaumudi, we may collect the following:

              Personal Information:
              • Name, email address, phone number (when you register or checkout)
              • Delivery address (when you place an order)
              • Payment details (processed securely via Razorpay — we never store card numbers)

              Usage Information:
              • Browser type, IP address, pages visited, time spent (via standard web analytics)
              • Device type and operating system`,
            },
            {
              title: "2. How We Use Your Information",
              content: `We use your information to:
              • Process and deliver your orders
              • Send order confirmations and shipping updates via email
              • Respond to your queries and support requests
              • Improve our website and customer experience
              • Send promotional emails (only with your consent — you can unsubscribe anytime)
              • Comply with legal and tax obligations`,
            },
            {
              title: "3. Payment Security",
              content: `All payments on Kaumudi are processed by Razorpay, a PCI-DSS compliant payment 
              gateway. We do not store your credit/debit card numbers or CVV on our servers. 
              Your payment data is encrypted and handled entirely by Razorpay.`,
            },
            {
              title: "4. Sharing Your Information",
              content: `We do not sell, trade, or rent your personal information to third parties.
              We may share limited information with:
              • Courier partners (name, phone, address) to fulfill delivery
              • Razorpay for payment processing
              • Email service providers for transactional emails
              • Government or legal authorities if required by law`,
            },
            {
              title: "5. Cookies",
              content: `We use essential cookies to maintain your session (cart, login state) and 
              analytics cookies to understand how visitors use our site. You can disable cookies 
              in your browser settings, though some features may not work correctly.`,
            },
            {
              title: "6. Data Retention",
              content: `We retain your account information as long as your account is active. 
              Order records are kept for 7 years for accounting and legal compliance. 
              You may request deletion of your account by contacting us.`,
            },
            {
              title: "7. Your Rights",
              content: `You have the right to:
              • Access the personal information we hold about you
              • Request correction of inaccurate information
              • Request deletion of your account and data
              • Opt out of marketing emails at any time
              • Withdraw consent for data processing

              To exercise any of these rights, email us at g91652251@gmail.com.`,
            },
            {
              title: "8. Children's Privacy",
              content: `Kaumudi is not intended for users under the age of 18. We do not knowingly 
              collect personal information from minors.`,
            },
            {
              title: "9. Changes to This Policy",
              content: `We may update this Privacy Policy from time to time. We will notify you of 
              significant changes by email or by posting a notice on our website. 
              Continued use of our site after changes constitutes acceptance of the updated policy.`,
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
              For privacy-related queries, contact us at{" "}
              <a href="mailto:g91652251@gmail.com" className="text-[#b8860b] underline">
                g91652251@gmail.com
              </a>
              <br />
              Kaumudi Sarees, Ring Road, Surat, Gujarat – 395002
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
