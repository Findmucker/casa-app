/**
 * PDF utilities — client-side only (uses dynamic imports)
 */

const MAX_PAGES = 5;
const SCALE = 1.5;

export interface PDFRow {
  items: { str: string; x: number }[];
}

/**
 * Extract text content from a PDF file as positioned rows
 */
export async function pdfToRows(file: File): Promise<PDFRow[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf = await (pdfjsLib as any).getDocument({ data: buffer }).promise;

  const numPages = Math.min(pdf.numPages, MAX_PAGES);
  const allRows: PDFRow[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group items by Y position (row)
    const rowMap = new Map<number, { str: string; x: number }[]>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of content.items as any[]) {
      const y = Math.round(item.transform[5]);
      if (!rowMap.has(y)) rowMap.set(y, []);
      rowMap.get(y)!.push({ str: item.str, x: Math.round(item.transform[4]) });
    }

    // Sort rows top-to-bottom, items left-to-right
    const sortedRows = [...rowMap.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, items] of sortedRows) {
      allRows.push({ items: items.sort((a, b) => a.x - b.x) });
    }
  }

  return allRows;
}

/**
 * Extract text content from a PDF file (simple join for CSV-like parsing)
 */
export async function pdfToText(file: File): Promise<string> {
  const rows = await pdfToRows(file);
  return rows.map(r => r.items.map(i => i.str).join(" ")).join("\n");
}

/**
 * Renders a PDF file to a single JPEG image (pages stacked vertically)
 * Used as fallback when text extraction doesn't yield parseable data
 */
export async function pdfToImage(file: File): Promise<{ base64: string; mimeType: string }> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf = await (pdfjsLib as any).getDocument({ data: buffer }).promise;

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
