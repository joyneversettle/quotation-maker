import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const RENDER_WIDTH_PX = 794;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 4;

/**
 * Find complete CSS function expressions, including nested functions such as
 * color-mix(... oklch(...) ...). A simple single-level regex is not sufficient
 * for Tailwind v4 generated CSS.
 */
function findCssFunctionExpressions(
  css: string,
  names: readonly string[]
): string[] {
  const found: string[] = [];
  const namePattern = names.join("|");
  const startPattern = new RegExp(`(?:${namePattern})\\(`, "gi");

  let match: RegExpExecArray | null;
  while ((match = startPattern.exec(css))) {
    const start = match.index;
    const open = css.indexOf("(", start);
    if (open < 0) continue;

    let depth = 0;
    let quote: string | null = null;

    for (let i = open; i < css.length; i += 1) {
      const char = css[i];

      if (quote) {
        if (char === quote && css[i - 1] !== "\\") quote = null;
        continue;
      }

      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }

      if (char === "(") depth += 1;
      if (char === ")") depth -= 1;

      if (depth === 0) {
        found.push(css.slice(start, i + 1));
        startPattern.lastIndex = i + 1;
        break;
      }
    }
  }

  return found;
}

function replaceCssFunctions(
  css: string,
  resolver: (token: string) => string | undefined
): string {
  const targets = findCssFunctionExpressions(css, [
    "oklch",
    "oklab",
    "color-mix",
    "color",
  ]);

  let output = css;
  const unique = Array.from(new Set(targets)).sort(
    (a, b) => b.length - a.length
  );

  for (const token of unique) {
    const replacement = resolver(token);
    if (replacement && replacement !== token) {
      output = output.split(token).join(replacement);
    }
  }

  return output;
}

function resolveCssColor(token: string): string | undefined {
  const probe = document.createElement("span");
  probe.style.position = "fixed";
  probe.style.left = "-10000px";
  probe.style.top = "0";
  probe.style.width = "1px";
  probe.style.height = "1px";
  probe.style.pointerEvents = "none";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);

  try {
    probe.style.color = "";
    probe.style.color = token;

    const resolved = window.getComputedStyle(probe).color;
    if (!resolved || /(?:oklch|oklab|color-mix|color\()/i.test(resolved)) {
      return undefined;
    }

    return resolved;
  } finally {
    probe.remove();
  }
}

function collectSameOriginCss(): string {
  const cssParts: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;

      for (const rule of Array.from(rules)) {
        cssParts.push(rule.cssText);
      }
    } catch {
      // Cross-origin stylesheets cannot expose cssRules. Keep their original
      // link in place; html2canvas can normally use them when no unsupported
      // color function is present.
    }
  }

  return cssParts.join("\n");
}

function buildSanitizedPdfCss(): string {
  const css = collectSameOriginCss();

  if (!css) return "";

  return replaceCssFunctions(css, (token) => {
    if (/^color-mix\(/i.test(token)) {
      // color-mix can contain nested oklch/oklab values. First resolve the
      // complete expression in the browser if possible.
      return resolveCssColor(token);
    }

    return resolveCssColor(token);
  });
}

function sanitizeClonedDocument(
  clonedDocument: Document,
  sanitizedCss: string
): void {
  if (sanitizedCss) {
    // Disable same-origin stylesheet links in the clone. Their CSS is copied
    // below after unsupported color functions have been converted to RGB.
    clonedDocument
      .querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
      .forEach((link) => {
        link.disabled = true;
      });

    const style = clonedDocument.createElement("style");
    style.setAttribute("data-pdf-sanitized-css", "true");
    style.textContent = sanitizedCss;
    clonedDocument.head.appendChild(style);
  }

  // The quotation HTML can contain inline styles as well.
  clonedDocument
    .querySelectorAll<HTMLElement>("[style]")
    .forEach((element) => {
      const value = element.getAttribute("style");
      if (!value) return;

      const converted = replaceCssFunctions(
        value,
        (token) => resolveCssColor(token)
      );

      if (converted !== value) {
        element.setAttribute("style", converted);
      }
    });
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));

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

function createCanvasSlice(
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

function createPdfRenderRoot(html: string): HTMLElement {
  const container = document.createElement("div");
  container.id = "quotation-pdf-render-root";
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = `${RENDER_WIDTH_PX}px`;
  container.style.maxWidth = `${RENDER_WIDTH_PX}px`;
  container.style.margin = "0";
  container.style.padding = "0";
  container.style.background = "#ffffff";
  container.style.visibility = "visible";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-999999";
  container.style.overflow = "visible";

  container.innerHTML = html;

  const pdfRules = document.createElement("style");
  pdfRules.textContent = `
    #quotation-pdf-render-root {
      width: ${RENDER_WIDTH_PX}px !important;
      max-width: ${RENDER_WIDTH_PX}px !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      background: #ffffff !important;
    }

    #quotation-pdf-render-root .quotation-template {
      box-sizing: border-box !important;
      width: 100% !important;
      max-width: 100% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    #quotation-pdf-render-root table {
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: collapse !important;
    }

    #quotation-pdf-render-root th,
    #quotation-pdf-render-root td {
      vertical-align: middle !important;
      box-sizing: border-box !important;
    }
  `;

  container.prepend(pdfRules);
  document.body.appendChild(container);
  return container;
}

async function renderCanvas(
  container: HTMLElement,
  sanitizedCss: string,
  foreignObjectRendering: boolean
): Promise<HTMLCanvasElement> {
  return html2canvas(container, {
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
    foreignObjectRendering,
    onclone: (clonedDocument) => {
      const clonedRoot = clonedDocument.getElementById(
        "quotation-pdf-render-root"
      );

      if (!clonedRoot) return;

      clonedRoot.style.width = `${RENDER_WIDTH_PX}px`;
      clonedRoot.style.maxWidth = `${RENDER_WIDTH_PX}px`;
      clonedRoot.style.margin = "0";
      clonedRoot.style.padding = "0";

      const template = clonedRoot.querySelector(
        ".quotation-template"
      ) as HTMLElement | null;

      if (template) {
        template.style.width = "100%";
        template.style.maxWidth = "100%";
        template.style.marginLeft = "0";
        template.style.marginRight = "0";
      }

      // The normal html2canvas renderer has its own CSS parser. Use the
      // browser-native foreignObject renderer first; if that fails, the
      // fallback receives a CSS copy with all unsupported color functions
      // converted to browser-resolved RGB values.
      if (!foreignObjectRendering) {
        sanitizeClonedDocument(clonedDocument, sanitizedCss);
      }
    },
  });
}

export async function generateQuotationPdf(
  html: string,
  fileName = "quotation.pdf"
): Promise<void> {
  if (!html || !html.trim()) {
    throw new Error("Quotation HTML is empty.");
  }

  const container = createPdfRenderRoot(html);

  try {
    await document.fonts.ready;
    await waitForImages(container);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    let canvas: HTMLCanvasElement;

    try {
      // This is the preferred path. The browser itself renders the existing
      // quotation CSS, so Tailwind v4's oklch/oklab never reaches html2canvas's
      // legacy CSS color parser.
      canvas = await renderCanvas(container, "", true);
    } catch (foreignObjectError) {
      console.warn(
        "PDF foreignObject rendering failed; using sanitized canvas fallback.",
        foreignObjectError
      );

      const sanitizedCss = buildSanitizedPdfCss();
      canvas = await renderCanvas(container, sanitizedCss, false);
    }

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
    const pixelsPerMm = canvas.width / usableWidth;
    const pageHeightPx = Math.floor(usableHeight * pixelsPerMm);

    let sourceY = 0;
    let pageIndex = 0;

    while (sourceY < canvas.height) {
      const currentHeight = Math.min(
        pageHeightPx,
        canvas.height - sourceY
      );

      const pageCanvas = createCanvasSlice(
        canvas,
        sourceY,
        currentHeight
      );

      if (pageIndex > 0) {
        pdf.addPage();
      }

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

    const safeFileName =
      fileName
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
        .trim() || "quotation";

    pdf.save(
      safeFileName.toLowerCase().endsWith(".pdf")
        ? safeFileName
        : `${safeFileName}.pdf`
    );
  } finally {
    container.remove();
  }
}
