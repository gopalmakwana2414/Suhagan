/**
 * Parses user agent string to extract Browser, OS, and Device Category.
 */
export const parseUserAgent = (userAgentString?: string) => {
  if (!userAgentString) {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      device: "Desktop",
    };
  }

  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let device = "Desktop";

  const ua = userAgentString.toLowerCase();

  // OS detection
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("linux")) os = "Linux";

  // Browser detection
  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("chrome") && !ua.includes("chromium")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edge") || ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera";
  else if (ua.includes("msie") || ua.includes("trident")) browser = "Internet Explorer";

  // Device detection
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    device = "Mobile";
  } else if (ua.includes("ipad") || ua.includes("tablet")) {
    device = "Tablet";
  }

  return { browser, os, device };
};
