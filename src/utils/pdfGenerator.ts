import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 4;
const RENDER_WIDTH_PX = 794;

function sanitizeCss(css: string): string {
  return css
    .replace(/oklch\([^)]*\)/gi, "#000000")
    .replace(/oklab\([^)]*\)/gi, "#000000")
    .replace(/color\([^)]*\)/gi, "#000000");
}

function sanitizeHtmlStyles(html: string): string {
  return html.replace(
    /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
    (_match, css: string) => `<style>${sanitizeCss(css)}</style>`
  );
}

function waitForImages(root: Document): Promise<void> {
  const images = Array.from(root.images);

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }

          const finish = () => resolve();

          img.addEventListener("load", finish, { once: true });
          img.addEventListener("error", finish, { once: true });

          window.setTimeout(finish, 10000);
        })
    )
  ).then(() => undefined);
}

function createPdfDocument(html: string): {
  iframe: HTMLIFrameElement;
  root: HTMLElement;
} {
  const iframe = document.createElement("iframe");

  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = `${RENDER_WIDTH_PX}px`;
  iframe.style.height = "2000px";
  iframe.style.border = "0";
  iframe.style.margin = "0";
  iframe.style.padding = "0";
  iframe.style.background = "#ffffff";
  iframe.style.zIndex = "-999999";

  document.body.appendChild(iframe);

  const iframeDocument = iframe.contentDocument;

  if (!iframeDocument) {
    iframe.remove();
    throw new Error("Unable to create isolated PDF document.");
  }

  iframeDocument.open();
  iframeDocument.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=${RENDER_WIDTH_PX}" />
        <style>
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${RENDER_WIDTH_PX}px !important;
            min-width: ${RENDER_WIDTH_PX}px !important;
            background: #ffffff !important;
            color: #111111 !important;
          }

          body {
            font-family: Arial, Helvetica, sans-serif !important;
            overflow: visible !important;
          }

          * {
            box-sizing: border-box;
          }

          table {
            max-width: 100% !important;
          }

          img {
            max-width: 100%;
          }
        </style>
      </head>
      <body></body>
    </html>
  `);
  iframeDocument.close();

  const root = iframeDocument.createElement("div");

  root.id = "quotation-pdf-root";
  root.style.width = `${RENDER_WIDTH_PX}px`;
  root.style.maxWidth = `${RENDER_WIDTH_PX}px`;
  root.style.margin = "0";
  root.style.padding = "0";
  root.style.background = "#ffffff";
  root.style.overflow = "visible";

  /*
   * IMPORTANT:
   * The quotation is inserted into an isolated iframe.
   * Therefore html2canvas never sees the main application's Tailwind
   * stylesheet containing oklch().
   */
  root.innerHTML = sanitizeHtmlStyles(html);

  iframeDocument.body.appendChild(root);

  /*
   * Re-sanitize any inline style attributes supplied by the template.
   */
  const elements = [
    root,
    ...Array.from(root.querySelectorAll<HTMLElement>("*")),
  ];

  for (const element of elements) {
    const inlineStyle = element.getAttribute("style");

    if (inlineStyle) {
      element.setAttribute("style", sanitizeCss(inlineStyle));
    }
  }

  return { iframe, root };
}

function createSlice(
  source: HTMLCanvasElement,
  sourceY: number,
  height: number
): HTMLCanvasElement {
  const slice = document.createElement("canvas");

  slice.width = source.width;
  slice.height = height;

  const context = slice.getContext("2d");

  if (!context) {
    throw new Error("Unable to create PDF page canvas.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, slice.width, slice.height);

  context.drawImage(
    source,
    0,
    sourceY,
    source.width,
    height,
    0,
    0,
    source.width,
    height
  );

  return slice;
}

/*
 * Walks the DOM inside `root` and collects the top/bottom edges (in canvas
 * pixel space) of every "atomic" element — i.e. an element with no
 * block-level children. These edges are safe places to cut a page,
 * because cutting there never slices through the middle of a text line,
 * a QR image, a table row, etc.
 */
function getSafeBreakPoints(root: HTMLElement, scale: number): number[] {
  const rootTop = root.getBoundingClientRect().top;
  const points = new Set<number>();

  const all = Array.from(root.querySelectorAll<HTMLElement>("*"));

  for (const el of all) {
    const hasBlockChild = Array.from(el.children).some((c) => {
      const display = (el.ownerDocument.defaultView ?? window).getComputedStyle(
        c
      ).display;
      return display !== "inline" && display !== "inline-block";
    });

    if (hasBlockChild) continue;

    const rect = el.getBoundingClientRect();
    if (rect.height === 0) continue;

    points.add(Math.round((rect.top - rootTop) * scale));
    points.add(Math.round((rect.bottom - rootTop) * scale));
  }

  const rootRect = root.getBoundingClientRect();
  points.add(0);
  points.add(Math.round(rootRect.height * scale));

  return Array.from(points).sort((a, b) => a - b);
}

/*
 * Finds the safe break point closest to (but not exceeding) `target`,
 * while staying strictly greater than `minY` so we always make progress.
 */
function nearestSafeBreak(
  target: number,
  safePoints: number[],
  minY: number
): number {
  let best = -1;

  for (const p of safePoints) {
    if (p > minY && p <= target) {
      best = p;
    }
  }

  return best;
}

export async function generateQuotationPdf(
  html: string,
  fileName = "quotation.pdf"
): Promise<void> {
  if (!html || !html.trim()) {
    throw new Error("Quotation HTML is empty.");
  }

  const { iframe, root } = createPdfDocument(html);

  try {
    const iframeDocument = iframe.contentDocument;

    if (!iframeDocument) {
      throw new Error("PDF document is unavailable.");
    }

    await waitForImages(iframeDocument);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 10000,
      width: RENDER_WIDTH_PX,
      windowWidth: RENDER_WIDTH_PX,
      scrollX: 0,
      scrollY: 0,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error("Quotation could not be rendered.");
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const usableWidth = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
    const usableHeight = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;

    const widthRatio = usableWidth / canvas.width;
    const fullHeightMm = canvas.height * widthRatio;

    /*
     * Use the complete printable A4 width.
     * This removes the unnecessary left/right whitespace.
     */
    if (fullHeightMm <= usableHeight) {
      pdf.addImage(
        canvas,
        "PNG",
        PDF_MARGIN_MM,
        PDF_MARGIN_MM,
        usableWidth,
        fullHeightMm,
        undefined,
        "FAST"
      );
    } else {
      /*
       * Multiple pages only when the quotation is genuinely taller
       * than A4. Each page keeps the same full printable width.
       *
       * Page breaks are snapped to "safe" points between DOM elements
       * so that no text line, image (e.g. the UPI QR code), or table
       * row is ever sliced through the middle.
       */
      const pixelsPerMm = canvas.width / usableWidth;
      const pageHeightPx = Math.floor(usableHeight * pixelsPerMm);
      const scale = canvas.width / RENDER_WIDTH_PX; // matches html2canvas scale

      const safePoints = getSafeBreakPoints(root, scale);

      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvas.height) {
        const idealEnd = Math.min(sourceY + pageHeightPx, canvas.height);

        let breakY = nearestSafeBreak(idealEnd, safePoints, sourceY);

        // No safe point found in range (e.g. one giant element taller
        // than a page) — fall back to a hard cut so we still make progress.
        if (breakY <= sourceY) {
          breakY = idealEnd;
        }

        const currentHeightPx = breakY - sourceY;

        const pageCanvas = createSlice(canvas, sourceY, currentHeightPx);

        if (pageIndex > 0) {
          pdf.addPage();
        }

        const pageHeightMm = currentHeightPx / pixelsPerMm;

        pdf.addImage(
          pageCanvas,
          "PNG",
          PDF_MARGIN_MM,
          PDF_MARGIN_MM,
          usableWidth,
          pageHeightMm,
          undefined,
          "FAST"
        );

        sourceY = breakY;
        pageIndex += 1;
      }
    }

    const safeFileName =
      fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").trim() || "quotation";

    pdf.save(
      safeFileName.toLowerCase().endsWith(".pdf")
        ? safeFileName
        : `${safeFileName}.pdf`
    );
  } finally {
    iframe.remove();
  }
}
