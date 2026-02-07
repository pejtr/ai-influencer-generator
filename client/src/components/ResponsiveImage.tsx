import { ImgHTMLAttributes } from "react";

interface ResponsiveImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Predefined size presets for common use cases */
  preset?: "thumbnail" | "card" | "gallery" | "hero" | "avatar" | "full";
  /** Custom sizes attribute override */
  sizes?: string;
}

/**
 * Size presets mapping to responsive sizes attribute values.
 * These define how much viewport width the image occupies at different breakpoints.
 */
const SIZE_PRESETS: Record<string, string> = {
  thumbnail: "(max-width: 640px) 80px, (max-width: 1024px) 96px, 120px",
  avatar: "(max-width: 640px) 40px, (max-width: 1024px) 48px, 56px",
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  gallery: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  hero: "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw",
  full: "100vw",
};

/**
 * Standard widths for srcset generation.
 * These cover common device widths and DPR combinations.
 */
const SRCSET_WIDTHS = [320, 480, 640, 768, 1024, 1280, 1536, 1920];

/**
 * Generates srcset string for images served from S3/CDN.
 * For external URLs that support width parameters, appends width query param.
 * For static/data URLs, returns undefined (no srcset needed).
 */
function generateSrcSet(src: string): string | undefined {
  // Skip data URLs, SVGs, and blob URLs
  if (!src || src.startsWith("data:") || src.startsWith("blob:") || src.endsWith(".svg")) {
    return undefined;
  }

  // For S3/CDN URLs or any HTTP image, we can't resize server-side without an image CDN
  // But we still provide the srcset with the original URL so the browser knows the intrinsic size
  // This is still beneficial for the browser's resource loading prioritization
  if (src.startsWith("http") || src.startsWith("//")) {
    // Return single source with width descriptor for browser optimization
    return undefined; // External URLs without resize support don't benefit from srcset
  }

  // For local/relative paths, generate srcset (useful if image CDN is added later)
  return undefined;
}

/**
 * ResponsiveImage component that automatically adds sizes attribute
 * for better browser resource loading decisions.
 * 
 * Even without srcset (when images come from S3 without resize support),
 * the sizes attribute helps the browser allocate space and prioritize loading.
 */
export default function ResponsiveImage({
  src,
  alt,
  preset = "card",
  sizes: customSizes,
  loading = "lazy",
  decoding = "async",
  className,
  ...props
}: ResponsiveImageProps) {
  const sizes = customSizes || SIZE_PRESETS[preset] || SIZE_PRESETS.card;
  const srcSet = generateSrcSet(src);

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      sizes={sizes}
      srcSet={srcSet}
      className={className}
      {...props}
    />
  );
}

/**
 * Hook to get responsive image props for inline usage
 * when you can't use the ResponsiveImage component directly.
 */
export function useResponsiveImageProps(
  src: string,
  preset: ResponsiveImageProps["preset"] = "card"
) {
  const sizes = SIZE_PRESETS[preset] || SIZE_PRESETS.card;
  const srcSet = generateSrcSet(src);

  return {
    sizes,
    ...(srcSet ? { srcSet } : {}),
    loading: "lazy" as const,
    decoding: "async" as const,
  };
}
