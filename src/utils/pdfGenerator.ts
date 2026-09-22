import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const RENDER_WIDTH_PX = 794;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 4;
const STYLE_ID_ATTR = "data-pdf-style-id";

/**
 * html2canvas 1.4.x has its own CSS parser and does not understand the
 * OKLCH/OKLAB colors emitted by Tailwind CSS v4. The live quotation must
 * keep its existing CSS, so the PDF renderer creates a temporary copy and
 * converts that copy to computed, browser-resolved styles only.
 */
function snapshotComputedStyles(root: HTMLElement): {
  elementStyles: Array<{ id: string; cssText: string }>;
  pseudoStyles: string[];
} {
  const elementStyles: Array<{ id: string; cssText: string }> = [];
  const pseudoStyles: string[] = [];

  const elements = [
    root,
    ...Array.from(root.querySelectorAll<HTMLElement>("*")),
  ];

  elements.forEach((element, index) => {
    const id = String(index);
    element.setAttribute(STYLE_ID_ATTR, id);

    const computed = window.getComputedStyle(element);
    const inline = document.createElement("div").style;

    for (let i = 0; i < computed.length; i += 1) {
      const property = computed.item(i);
      const value = computed.getPropertyValue(property);

      if (!property || !value) continue;

      // Setting the value through the browser CSSOM guarantees that any
      // color function is resolved/validated by the browser rather than
      // being handed to html2canvas's CSS parser as raw authored CSS.
      inline.setProperty(
        property,
        resolveUnsupportedColorValue(value),
        computed.getPropertyPriority(property)
      );
    }

    elementStyles.push({
      id,
      cssText: inline.cssText,
    });

    for (const pseudo of ["::before", "::after"]) {
      const pseudoComputed = window.getComputedStyle(
        element,
        pseudo
      );

      const content = pseudoComputed.getPropertyValue("content");

      if (!content || content === "none" || content === '""') {
        continue;
      }

      const pseudoStyle = document.createElement("div").style;

      for (let i = 0; i < pseudoComputed.length; i += 1) {
        const property = pseudoComputed.item(i);
        const value = pseudoComputed.getPropertyValue(property);

        if (!property || !value) continue;

        pseudoStyle.setProperty(
          property,
          resolveUnsupportedColorValue(value),
          pseudoComputed.getPropertyPriority(property)
        );
      }

      pseudoStyles.push(
        `[${STYLE_ID_ATTR}="${id}"]${pseudo}{${pseudoStyle.cssText}}`
      );
    }
  });

  return { elementStyles, pseudoStyles };
}

function resolveUnsupportedColorValue(value: string): string {
  if (!/(oklch|oklab|color-mix|color\()/i.test(value)) {
    return value;
  }

  const probe = document.createElement("span");
  probe.style.position = "fixed";
  probe.style.left = "-10000px";
  probe.style.top = "0";
  probe.style.width = "1px";
  probe.style.height = "1px";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);

  try {
    // Color-bearing properties need a browser color parser. For composite
    // values such as gradients/shadows, resolve each individual color token.
    if (/^(?:oklch|oklab|color-mix|color)\(/i.test(value.trim())) {
      probe.style.color = value;
      const resolved = window.getComputedStyle(probe).color;

      if (resolved && !/(oklch|oklab|color-mix|color\()/i.test(resolved)) {
        return resolved;
      }
    }

    return value.replace(
      /(?:oklch|oklab|color-mix|color)\([^()]*\)/gi,
      (token) => {
        probe.style.color = "";
        probe.style.color = token;

        const resolved = window.getComputedStyle(probe).color;

        return resolved && !/(oklch|oklab|color-mix|color\()/i.test(resolved)
          ? resolved
          : "transparent";
      }
    );
  } finally {
    probe.remove();
  }
}

function applySnapshotToClone(
  clonedDocument: Document,
  snapshot: ReturnType<typeof snapshotComputedStyles>
): void {
  for (const item of snapshot.elementStyles) {
    const element = clonedDocument.querySelector<HTMLElement>(
      `[${STYLE_ID_ATTR}="${item.id}"]`
    );

    if (!element) continue;

    element.setAttribute("style", item.cssText);
  }

  // Remove the application's stylesheets from the temporary clone. At this
  // point every normal element has its computed appearance inlined, so the
  // Tailwind v4 stylesheet no longer needs to be parsed by html2canvas.
  clonedDocument
    .querySelectorAll("style, link[rel~='stylesheet']")
    .forEach((node) => node.remove());

  if (snapshot.pseudoStyles.length) {
    const pseudoStyle = clonedDocument.createElement("style");
    pseudoStyle.textContent = snapshot.pseudoStyles.join("\n");
    clonedDocument.head.appendChild(pseudoStyle);
  }
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

export async function generateQuotationPdf(
  html: string,
  fileName = "quotation.pdf"
): Promise<void> {
  if (!html || !html.trim()) {
    throw new Error("Quotation HTML is empty.");
  }

  const container = document.createElement("div");
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
  document.body.appendChild(container);

  try {
    await document.fonts.ready;
    await waitForImages(container);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    /*
     * Capture the browser's final visual result BEFORE html2canvas clones
     * the DOM. This is the critical compatibility step: Tailwind v4 may
     * contain oklch() in authored CSS, but the browser has already resolved
     * the visual styles here.
     */
    const snapshot = snapshotComputedStyles(container);

    const canvas = await html2canvas(container, {
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
      foreignObjectRendering: true,
      onclone: (clonedDocument) => {
        applySnapshotToClone(clonedDocument, snapshot);

        const clonedRoot = clonedDocument.querySelector<HTMLElement>(
          `[${STYLE_ID_ATTR}="0"]`
        );

        if (clonedRoot) {
          clonedRoot.style.width = `${RENDER_WIDTH_PX}px`;
          clonedRoot.style.maxWidth = `${RENDER_WIDTH_PX}px`;
          clonedRoot.style.margin = "0";
          clonedRoot.style.padding = "0";
          clonedRoot.style.background = "#ffffff";
        }
      },
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
    const pixelsPerMm = canvas.width / usableWidth;
    const fullHeightMm = canvas.height / pixelsPerMm;

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
