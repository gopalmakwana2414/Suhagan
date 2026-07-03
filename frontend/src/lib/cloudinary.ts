/**
 * Inserts Cloudinary delivery transformations into a raw secure_url.
 *
 * Cloudinary URLs look like:
 *   https://res.cloudinary.com/<cloud>/image/upload/v169.../folder/file.jpg
 *                                          ^^^^^^ transformations go here
 *
 * Without any transformation, Cloudinary serves whatever format/quality
 * the file was uploaded as. Adding f_auto,q_auto asks it to pick the best
 * format for the requesting browser (WebP/AVIF where supported) and the
 * best quality-to-size ratio automatically — this is Cloudinary's own
 * recommended default for anything user-facing, and in practice looks
 * noticeably sharper than an untouched JPEG at the same file size.
 *
 * `width` caps delivery size for large display contexts (e.g. a full-
 * width hero) so a browser isn't downloading/decoding a multi-megabyte
 * original just to display it at 900px wide — c_limit means it will
 * never upscale a smaller source past its native resolution.
 */
export function optimizedCloudinaryUrl(url: string, width?: number): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url; // not a Cloudinary URL — return unchanged
  }

  const transforms = ["f_auto", "q_auto"];
  if (width) transforms.push(`w_${width}`, "c_limit");

  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}
