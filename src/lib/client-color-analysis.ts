export interface ColorAnalysisProgress {
  currentPage: number;
  totalPages: number;
}

function hasMeaningfulColor(context: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = context.getImageData(0, 0, width, height);
  const stride = Math.max(1, Math.floor(Math.sqrt((width * height) / 16_000)));
  let sampled = 0;
  let colored = 0;

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const offset = (y * width + x) * 4;
      if (data[offset + 3] < 200) continue;
      sampled++;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      if (Math.max(red, green, blue) - Math.min(red, green, blue) >= 24 && Math.max(red, green, blue) >= 56) {
        colored++;
      }
    }
  }

  return colored >= Math.max(12, Math.ceil(sampled * 0.001));
}

export async function analyzePdfColorPages(
  file: File,
  onProgress?: (progress: ColorAnalysisProgress) => void,
): Promise<{ pageCount: number; colorPages: number[] }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
  });

  try {
    const document = await loadingTask.promise;
    const colorPages: number[] = [];
    try {
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber);
        const sourceViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1, 360 / Math.max(sourceViewport.width, sourceViewport.height));
        const viewport = page.getViewport({ scale });
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas color scan is unavailable in this browser.");

        await page.render({ canvasContext: context, viewport }).promise;
        if (hasMeaningfulColor(context, canvas.width, canvas.height)) colorPages.push(pageNumber);
        page.cleanup();
        canvas.width = 0;
        canvas.height = 0;
        onProgress?.({ currentPage: pageNumber, totalPages: document.numPages });
      }
      return { pageCount: document.numPages, colorPages };
    } finally {
      await document.destroy();
    }
  } finally {
    await loadingTask.destroy();
  }
}

export async function analyzeImageColor(file: File): Promise<number[]> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 360 / Math.max(bitmap.width, bitmap.height));
  const canvas = window.document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(bitmap.width * scale));
  canvas.height = Math.max(1, Math.ceil(bitmap.height * scale));
  try {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas color scan is unavailable in this browser.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return hasMeaningfulColor(context, canvas.width, canvas.height) ? [1] : [];
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}
