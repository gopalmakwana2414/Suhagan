// adds f_auto,q_auto to a Cloudinary URL so it serves the best format/quality
// for the browser instead of the raw untouched upload. width caps delivery
// size for big display areas like the hero image (c_limit won't upscale
// a smaller source past its real resolution)
export function optimizedCloudinaryUrl(url: string, width?: number): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url; // not a cloudinary url, leave it alone
  }

  const transforms = ["f_auto", "q_auto"];
  if (width) transforms.push(`w_${width}`, "c_limit");

  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}
