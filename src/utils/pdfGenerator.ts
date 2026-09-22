import jsPDF from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 4;
const RENDER_WIDTH_PX = 794;

function waitForFonts(): Promise<void> {
  if (!document.fonts?.ready) return Promise.resolve();
  return document.fonts.ready.then(() => undefined);
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  return Promise.all(images.map((img) => new Promise<void>((resolve) => {
    if (img.complete) return resolve();
    const done = () => resolve();
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    window.setTimeout(done, 10000);
  }))).then(() => undefined);
}

function copyComputedStyles(source: HTMLElement, target: HTMLElement): void {
  const computed = window.getComputedStyle(source);
  for (let i = 0; i < computed.length; i += 1) {
    const property = computed.item(i);
    const value = computed.getPropertyValue(property);
    const priority = computed.getPropertyPriority(property);
    if (value) target.style.setProperty(property, value, priority);
  }

  // The PDF clone must have a deterministic box model and no responsive
  // stylesheet left for the renderer to parse.
  target.style.setProperty("box-sizing", "border-box");
}

function inlineComputedStyles(source: HTMLElement, target: HTMLElement): void {
  copyComputedStyles(source, target);
  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children) as HTMLElement[];

  for (let i = 0; i < sourceChildren.length; i += 1) {
    const sourceChild = sourceChildren[i];
    const targetChild = targetChildren[i];
    if (sourceChild instanceof HTMLElement && targetChild instanceof HTMLElement) {
      inlineComputedStyles(sourceChild, targetChild);
    }
  }
}

async function imageToDataUrl(src: string): Promise<string | null> {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src || null;

  try {
    const response = await fetch(src, { mode: "cors", credentials: "omit" });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function inlineImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(images.map(async (img) => {
    const src = img.getAttribute("src");
    if (!src) return;
    const dataUrl = await imageToDataUrl(new URL(src, document.baseURI).href);
    if (dataUrl) img.setAttribute("src", dataUrl);
  }));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function renderDomToCanvas(root: HTMLElement): Promise<HTMLCanvasElement> {
  await waitForFonts();
  await waitForImages(root);
  await inlineImages(root);

  const clone = root.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.position = "static";
  clone.style.left = "auto";
  clone.style.top = "auto";
  clone.style.width = `${RENDER_WIDTH_PX}px`;
  clone.style.maxWidth = `${RENDER_WIDTH_PX}px`;
  clone.style.margin = "0";
  clone.style.background = "#ffffff";
  clone.style.overflow = "visible";

  // Inline the browser's already-resolved RGB colors and all other computed
  // presentation values. No Tailwind stylesheet is passed to the PDF renderer.
  inlineComputedStyles(root, clone);
  clone.style.width = `${RENDER_WIDTH_PX}px`;
  clone.style.maxWidth = `${RENDER_WIDTH_PX}px`;
  clone.style.margin = "0";
  clone.style.background = "#ffffff";

  // Remove every stylesheet/link from the cloned document. This is the key
  // compatibility fix: html2canvas is no longer used to parse Tailwind v4's
  // oklch() CSS at all.
  clone.querySelectorAll("style, link[rel~='stylesheet']").forEach((node) => node.remove());

  const width = RENDER_WIDTH_PX;
  const height = Math.max(1, root.scrollHeight);
  clone.style.height = `${height}px`;

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<foreignObject x="0" y="0" width="${width}" height="${height}">${serialized}</foreignObject>` +
    `</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The quotation could not be rendered for PDF export."));
    });

    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to create PDF rendering canvas.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.drawImage(image, 0, 0, width, height);

    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}


function trimTrailingBlankRows(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const context = canvas.getContext("2d");
  if (!context) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  if (width <= 0 || height <= 0) return canvas;

  const data = context.getImageData(0, 0, width, height).data;
  const rowStride = width * 4;
  const WHITE_THRESHOLD = 250;
  const ALPHA_THRESHOLD = 8;

  let lastContentRow = -1;

  for (let y = height - 1; y >= 0; y -= 1) {
    const offset = y * rowStride;
    let hasContent = false;

    for (let x = 0; x < width; x += 1) {
      const i = offset + x * 4;
      const alpha = data[i + 3];
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (alpha > ALPHA_THRESHOLD &&
          (r < WHITE_THRESHOLD || g < WHITE_THRESHOLD || b < WHITE_THRESHOLD)) {
        hasContent = true;
        break;
      }
    }

    if (hasContent) {
      lastContentRow = y;
      break;
    }
  }

  // Keep a very small safety margin, but remove the large trailing blank
  // area that otherwise creates an unnecessary extra PDF page.
  const safetyRows = Math.min(8, Math.max(0, height - lastContentRow - 1));
  const trimmedHeight = lastContentRow < 0
    ? 1
    : Math.min(height, lastContentRow + 1 + safetyRows);

  if (trimmedHeight >= height) return canvas;

  const trimmed = document.createElement("canvas");
  trimmed.width = width;
  trimmed.height = trimmedHeight;

  const trimmedContext = trimmed.getContext("2d");
  if (!trimmedContext) return canvas;

  trimmedContext.fillStyle = "#ffffff";
  trimmedContext.fillRect(0, 0, width, trimmedHeight);
  trimmedContext.drawImage(
    canvas,
    0, 0, width, trimmedHeight,
    0, 0, width, trimmedHeight
  );

  return trimmed;
}

function createCanvasSlice(source: HTMLCanvasElement, sourceY: number, height: number): HTMLCanvasElement {
  const slice = document.createElement("canvas");
  slice.width = source.width;
  slice.height = Math.max(1, Math.floor(height));
  const context = slice.getContext("2d");
  if (!context) throw new Error("Unable to create PDF page canvas.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, slice.width, slice.height);
  context.drawImage(source, 0, sourceY, source.width, height, 0, 0, source.width, height);
  return slice;
}

export async function generateQuotationPdf(html: string, fileName = "quotation.pdf"): Promise<void> {
  if (!html.trim()) throw new Error("Quotation HTML is empty.");

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-100000px";
  container.style.top = "0";
  container.style.width = `${RENDER_WIDTH_PX}px`;
  container.style.maxWidth = `${RENDER_WIDTH_PX}px`;
  container.style.margin = "0";
  container.style.padding = "0";
  container.style.background = "#ffffff";
  container.style.pointerEvents = "none";
  container.style.visibility = "visible";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const template = container.querySelector<HTMLElement>(".quotation-template");
    if (template) {
      template.style.width = "100%";
      template.style.maxWidth = "100%";
      template.style.marginLeft = "0";
      template.style.marginRight = "0";
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    let canvas = await renderDomToCanvas(container);
    // Prevent a tiny trailing overflow/blank row from becoming an entire
    // second PDF page. This does not alter the quotation content.
    canvas = trimTrailingBlankRows(canvas);

    const usableWidth = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
    const usableHeight = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;
    const pixelsPerMm = canvas.width / usableWidth;
    const pageHeightPx = Math.floor(usableHeight * pixelsPerMm);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

    let sourceY = 0;
    let pageIndex = 0;
    while (sourceY < canvas.height) {
      const currentHeight = Math.min(pageHeightPx, canvas.height - sourceY);
      const pageCanvas = createCanvasSlice(canvas, sourceY, currentHeight);
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        pageCanvas,
        "PNG",
        PDF_MARGIN_MM,
        PDF_MARGIN_MM,
        usableWidth,
        currentHeight / pixelsPerMm,
        undefined,
        "FAST"
      );
      sourceY += currentHeight;
      pageIndex += 1;
    }

    const safeFileName = fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").trim() || "quotation";
    pdf.save(safeFileName.toLowerCase().endsWith(".pdf") ? safeFileName : `${safeFileName}.pdf`);
  } finally {
    container.remove();
  }
}
