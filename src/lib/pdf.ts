export async function extractPdfText(file: File): Promise<string> {
  // Dynamic imports — pdfjs touches DOMMatrix at module scope and breaks SSR.
  const pdfjsLib: any = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strs = content.items.map((it: any) => ("str" in it ? it.str : "")).filter(Boolean);
    text += strs.join(" ") + "\n\n";
  }
  return text.trim();
}