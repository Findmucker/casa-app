/**
 * PDF utilities — client-side only (uses dynamic imports)
 */

const MAX_PAGES = 5;
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
