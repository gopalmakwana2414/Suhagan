"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  /** height in px — this actually controls the rendered size now */
  height?: number;
  linkToHome?: boolean;
}

// shared logo used in the Navbar, Footer, and Admin sidebar. reads from
// /public/logo.png, falls back to the "SUHAGAN" text if the file's missing
export default function Logo({
  className = "",
  height = 142,
  linkToHome = true,
}: LogoProps) {
  const image = (
    <Image
      src="/logo.png"
      alt="Suhagan — Premium Handcrafted Sarees"
      width={height * 3.2}
      height={height}
      priority
      style={{ height: `${height}px`, width: "auto" }}
      className={`object-contain ${className}`}
      onError={(e) => {
        // Graceful fallback if logo.png hasn't been added yet.
        (e.target as HTMLImageElement).style.display = "none";
        const fallback = (e.target as HTMLImageElement)
          .nextElementSibling as HTMLElement | null;
        if (fallback) fallback.style.display = "inline-block";
      }}
    />
  );

  const content = (
    <span className="inline-flex items-center mt-4">
      {image}
      <span
        style={{ display: "none", fontSize: `${height * 0.55}px` }}
        className="font-bold tracking-wide text-[#b8860b]"
      >
        SUHAGAN
      </span>
    </span>
  );

  if (!linkToHome) return content;

  return (
    <Link href="/" aria-label="Suhagan — Home">
      {content}
    </Link>
  );
}
