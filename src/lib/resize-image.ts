import { MAX_IMAGE_SIZE } from "@/lib/constants";

const MAX_DIMENSION = 1920;

/**
 * Resize an image file to fit within MAX_IMAGE_SIZE (2MB).
 * If already under the limit, returns the original file.
 * Uses canvas to downscale and re-encode as JPEG with decreasing quality.
 */
export async function resizeImage(file: File): Promise<File> {
  if (file.size <= MAX_IMAGE_SIZE) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  // Scale down if either dimension exceeds MAX_DIMENSION
  let targetW = width;
  let targetH = height;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    targetW = Math.round(width * ratio);
    targetH = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  // Try decreasing quality until under 2MB
  for (const quality of [0.85, 0.7, 0.5, 0.3]) {
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
    if (blob.size <= MAX_IMAGE_SIZE) {
      return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
      });
    }
  }

  // Last resort: scale down further
  const smallRatio = 0.5;
  const smallCanvas = new OffscreenCanvas(
    Math.round(targetW * smallRatio),
    Math.round(targetH * smallRatio)
  );
  const smallCtx = smallCanvas.getContext("2d")!;
  smallCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
  const blob = await smallCanvas.convertToBlob({ type: "image/jpeg", quality: 0.7 });
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
}
