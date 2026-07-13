/**
 * Client-side image compression using the Canvas API.
 * Zero external dependencies — runs entirely in the browser.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0–1 JPEG quality
  outputFormat?: "image/jpeg" | "image/webp";
}

/**
 * Compress a File or Blob and return a base64 data-URL.
 * Preserves aspect ratio; downscales if either dimension exceeds the limit.
 */
export async function compressImage(
  file: File | Blob,
  options: CompressOptions = {},
): Promise<string> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.82,
    outputFormat = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Scale down maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas 2D context unavailable"));

        // White background for JPEG (avoids transparent → black artefact)
        if (outputFormat === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(outputFormat, quality));
      };
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.src = evt.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/** Human-readable file size */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Estimate compressed size from a data-URL (rough) */
export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.round((base64.length * 3) / 4);
}
