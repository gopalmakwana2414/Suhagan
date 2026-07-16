"use client";

import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  linkToHome?: boolean;
}

/**
 * Shared Logo component used globally across the website.
 * Enforces precise branding layout constraints:
 * - width: auto
 * - height: auto
 * - max-width: 220px
 * - max-height: 80px
 * - object-fit: contain
 * - shrink-0 to prevent shrinking inside flex containers (headers, navbars).
 */
export default function Logo({
  className = "",
  linkToHome = true,
}: LogoProps) {
  // Check if a size class is provided. If not, supply a default aspect-ratio size
  const hasHeight = className.includes("h-") || className.includes("max-h-");
  const sizeClasses = hasHeight ? "" : "h-[68px] w-[156px]";

  const image = (
    <Image
      src="/kaumudi.png"
      alt="Kaumudi — Premium Handcrafted Sarees"
      width={639}
      height={279}
      priority
      className={`object-contain transition-all duration-300 shrink-0 select-none ${sizeClasses} ${className}`}
    />
  );

  const content = (
    <span className="inline-flex items-center justify-center shrink-0">
      {image}
    </span>
  );

  if (!linkToHome) return content;

  return (
    <Link
      href="/"
      aria-label="Kaumudi — Home"
      className="flex items-center justify-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
    >
      {content}
    </Link>
  );
}
