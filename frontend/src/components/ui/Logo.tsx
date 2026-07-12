"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  linkToHome?: boolean;
}

// shared logo used across the website. reads from public/kaumodi.png
// responsive size: height 35px (mobile) -> 45px (tablet) -> 55px (desktop)
export default function Logo({
  className = "",
  linkToHome = true,
}: LogoProps) {
  const image = (
    <Image
      src="/kaumodi.png"
      alt="Kaumudi — Premium Handcrafted Sarees"
      width={315}
      height={141}
      priority
      className={`h-[35px] sm:h-[45px] lg:h-[55px] w-auto object-contain ${className}`}
    />
  );

  const content = (
    <span className="inline-flex items-center justify-center">
      {image}
    </span>
  );

  if (!linkToHome) return content;

  return (
    <Link href="/" aria-label="Kaumudi — Home" className="flex items-center">
      {content}
    </Link>
  );
}
