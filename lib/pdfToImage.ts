/**
 * Convert PDF file to a single image (or multiple page images merged)
 * Uses pdf.js to render pages to canvas client-side
 * IMPORTANT: This module must only be imported dynamically on the client
 */

const MAX_PAGES = 5;
const SCALE = 1.5;

/**
 * Renders a PDF file to a single JPEG image (pages stacked vertically)
 * Returns base64-encoded image data (no data: prefix)
 */
export async function pdfToImage(file: File): Promise<{ base64: string; mimeType: string }> {
  // Dynamic import to avoid SSR issues (pdfjs-dist uses DOMMatrix)
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const numPages = Math.min(pdf.numPages, MAX_PAGES);
  const canvases: HTMLCanvasElement[] = [];
  let totalHeight = 0;
  let maxWidth = 0;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: SCALE });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d")!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (page as any).render({ canvasContext: ctx, viewport }).promise;

    canvases.push(canvas);
    totalHeight += viewport.height;
    maxWidth = Math.max(maxWidth, viewport.width);
  }

  // Merge all pages into one tall canvas
  const merged = document.createElement("canvas");
  merged.width = maxWidth;
  merged.height = totalHeight;
  const mergedCtx = merged.getContext("2d")!;

  let y = 0;
  for (const canvas of canvases) {
    mergedCtx.drawImage(canvas, 0, y);
    y += canvas.height;
  }

  const dataUrl = merged.toDataURL("image/jpeg", 0.85);
  const base64 = dataUrl.split(",")[1];

  return { base64, mimeType: "image/jpeg" };
}
