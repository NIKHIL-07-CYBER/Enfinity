/**
 * Client-side PDF text extraction using pdfjs-dist.
 * react-pdf already ships pdfjs-dist, so no extra install is needed.
 * We import pdfjs-dist directly and point the worker at the local file
 * so there are no version mismatches with a CDN URL.
 */

let pdfjsLoaded = false;

async function getPdfLib() {
  // Dynamic import keeps this out of the initial bundle
  const pdfjs = await import('pdfjs-dist');

  if (!pdfjsLoaded) {
    // Point the worker at the ESM worker bundled with the package.
    // Vite will copy this asset to the output; the `?url` suffix tells
    // Vite to treat the import as an asset URL rather than a module.
    // We use the CDN as fallback if the local worker fails to resolve.
    try {
      const workerUrl = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).href;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    } catch {
      // Fallback: use a CDN URL that matches the installed package version
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;
    }
    pdfjsLoaded = true;
  }

  return pdfjs;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjs = await getPdfLib();

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pageTexts.push(pageText.trim());
  }

  // Filter empty pages, join with double newlines to create paragraph boundaries
  return pageTexts.filter(Boolean).join('\n\n');
}
