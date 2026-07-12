import Link from "next/link";

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="hero-gradient py-24">
        <div className="container-custom text-center">
          <p className="text-[#b8860b] font-semibold uppercase tracking-[4px] text-sm">
            Our Story
          </p>
          <h1 className="text-5xl lg:text-6xl font-bold mt-4">
            About{" "}
            <span className="text-[#d4af37]">Kaumudi</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Born in the city of Surat, Kaumudi is a celebration of India&apos;s
            finest saree traditions — crafted for the modern woman who values
            heritage, elegance, and quality.
          </p>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                title: "Authentic Craftsmanship",
                desc: "Every saree is crafted by skilled weavers using traditional techniques passed down through generations.",
                icon: "🪡",
              },
              {
                title: "Direct from Factory",
                desc: "We source directly from our own manufacturing unit in Surat, ensuring the best quality at fair prices.",
                icon: "🏭",
              },
              {
                title: "Customer First",
                desc: "From easy returns to personalised styling, we make every saree shopping experience delightful.",
                icon: "💛",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border rounded-3xl p-8 text-center hover:shadow-xl transition"
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-[#fafafa]">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#b8860b] font-semibold uppercase tracking-widest text-sm">
                Who We Are
              </p>
              <h2 className="text-4xl font-bold mt-4 mb-6">
                The Heart Behind Kaumudi
              </h2>
              <p className="text-gray-600 leading-8 mb-5">
                Kaumudi started as a vision — to bring the finest Banarasi,
                Kanjivaram, and Silk sarees from the looms of Surat directly to
                women across India. Our factory in Surat has been weaving sarees
                for decades, and today we bring that craftsmanship online.
              </p>
              <p className="text-gray-600 leading-8 mb-8">
                Whether it&apos;s a wedding, festival, or everyday elegance —
                every woman deserves to feel beautiful and celebrated. Our
                collections are designed with that spirit in mind.
              </p>
              <Link
                href="/shop"
                className="bg-[#d4af37] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#b8860b] transition"
              >
                Explore Collection
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "20+", label: "Years of Experience" },
                { value: "500+", label: "Saree Designs" },
                { value: "10K+", label: "Happy Customers" },
                { value: "4.8★", label: "Average Rating" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border rounded-2xl p-6 text-center hover:shadow-md transition"
                >
                  <h3 className="text-3xl font-bold text-[#d4af37]">
                    {stat.value}
                  </h3>
                  <p className="text-gray-500 mt-2 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
