const CLOUDINARY_HOST = "res.cloudinary.com";

/**
 * Delivery transform for a Cloudinary-hosted photo: best format and quality
 * for the browser, scaled down to `width` and never up (`c_limit`).
 * Only https://res.cloudinary.com/<cloud>/image/upload/... URLs are touched;
 * anything else, and URLs that already carry a transform, come back as given.
 */
export function cloudinaryUrl(url: string, width: number): string {
  if (!Number.isInteger(width) || width <= 0) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== CLOUDINARY_HOST) return url;

  const segments = parsed.pathname.split("/"); // ["", cloud, "image", "upload", next, ...]
  if (segments[2] !== "image" || segments[3] !== "upload") return url;

  // After /upload/ comes either a version (v123) or the public id; anything
  // else is a transform someone chose on purpose.
  const next = segments[4] ?? "";
  if (/^[a-z]{1,3}_[^/]*$/.test(next) || next.includes(",")) return url;

  segments.splice(4, 0, `f_auto,q_auto,c_limit,w_${width}`);
  parsed.pathname = segments.join("/");
  return parsed.href;
}

export interface CloudinaryImage {
  src: string;
  srcset?: string;
}

/** `src` at `defaultWidth` plus a `w`-descriptor srcset; plain `src` for other hosts. */
export function cloudinaryImage(
  url: string,
  { widths, defaultWidth }: { widths: number[]; defaultWidth: number },
): CloudinaryImage {
  const src = cloudinaryUrl(url, defaultWidth);
  if (src === url) return { src: url };
  return { src, srcset: widths.map((w) => `${cloudinaryUrl(url, w)} ${w}w`).join(", ") };
}
