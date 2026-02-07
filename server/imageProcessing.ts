import sharp from "sharp";
import { storagePut } from "./storage";

export interface ImageProcessingOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
}

export interface ProcessedImage {
  url: string;
  key: string;
  format: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Download image from URL and return as Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Convert an image to WebP format
 */
export async function convertToWebP(
  imageBuffer: Buffer,
  options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const { quality = 80, maxWidth, maxHeight } = options;

  let pipeline = sharp(imageBuffer);

  if (maxWidth || maxHeight) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const result = await pipeline.webp({ quality }).toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
  };
}

/**
 * Convert an image to AVIF format
 */
export async function convertToAvif(
  imageBuffer: Buffer,
  options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const { quality = 50, maxWidth, maxHeight } = options;

  let pipeline = sharp(imageBuffer);

  if (maxWidth || maxHeight) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const result = await pipeline.avif({ quality }).toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
  };
}

/**
 * Generate responsive image variants (thumbnail, medium, large) in WebP
 */
export async function generateResponsiveVariants(
  imageBuffer: Buffer,
  baseKey: string
): Promise<{
  thumbnail: ProcessedImage;
  medium: ProcessedImage;
  large: ProcessedImage;
  original: ProcessedImage;
}> {
  const sizes = [
    { name: "thumbnail", maxWidth: 200, maxHeight: 200, quality: 70 },
    { name: "medium", maxWidth: 800, maxHeight: 800, quality: 80 },
    { name: "large", maxWidth: 1600, maxHeight: 1600, quality: 85 },
  ] as const;

  const results: Record<string, ProcessedImage> = {};

  for (const size of sizes) {
    const { buffer, width, height } = await convertToWebP(imageBuffer, {
      quality: size.quality,
      maxWidth: size.maxWidth,
      maxHeight: size.maxHeight,
    });

    const key = `${baseKey}-${size.name}.webp`;
    const { url } = await storagePut(key, buffer, "image/webp");

    results[size.name] = {
      url,
      key,
      format: "webp",
      width,
      height,
      size: buffer.length,
    };
  }

  // Also store original as WebP
  const { buffer: originalWebP, width: origW, height: origH } = await convertToWebP(imageBuffer, {
    quality: 90,
  });
  const origKey = `${baseKey}-original.webp`;
  const { url: origUrl } = await storagePut(origKey, originalWebP, "image/webp");

  results.original = {
    url: origUrl,
    key: origKey,
    format: "webp",
    width: origW,
    height: origH,
    size: originalWebP.length,
  };

  return results as {
    thumbnail: ProcessedImage;
    medium: ProcessedImage;
    large: ProcessedImage;
    original: ProcessedImage;
  };
}

/**
 * Process an image from URL: download, convert to WebP, and upload to S3
 */
export async function processImageFromUrl(
  imageUrl: string,
  outputKey: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const { quality = 80, maxWidth, maxHeight, format = "webp" } = options;

  const imageBuffer = await downloadImage(imageUrl);

  let convertFn: typeof convertToWebP;
  let mimeType: string;

  switch (format) {
    case "avif":
      convertFn = convertToAvif;
      mimeType = "image/avif";
      break;
    case "webp":
    default:
      convertFn = convertToWebP;
      mimeType = "image/webp";
      break;
  }

  const { buffer, width, height } = await convertFn(imageBuffer, {
    quality,
    maxWidth,
    maxHeight,
  });

  const key = `${outputKey}.${format}`;
  const { url } = await storagePut(key, buffer, mimeType);

  return {
    url,
    key,
    format,
    width,
    height,
    size: buffer.length,
  };
}

/**
 * Get image metadata (dimensions, format, size)
 */
export async function getImageMetadata(imageBuffer: Buffer) {
  const metadata = await sharp(imageBuffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || "unknown",
    size: metadata.size || imageBuffer.length,
    hasAlpha: metadata.hasAlpha || false,
    channels: metadata.channels || 0,
  };
}
