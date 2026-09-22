import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PDF_WIDTH_PX = 794;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 4;

function copyComputedStyles(sourceRoot: HTMLElement): void {
  const elements = [
    sourceRoot,
    ...Array.from(sourceRoot.querySelectorAll<HTMLElement>("*")),
  ];

  for (const element of elements) {
    const computed = window.getComputedStyle(element);
    let cssText = "";

    for (let index = 0; index < computed.length; index += 1) {
      const property = computed.item(index);
      if (!property || property.startsWith("--")) continue;

      const value = computed.getPropertyValue(property);
      if (!value) continue;

      // Computed browser colors are rgb/rgba, so html2canvas never has
      // to parse the original Tailwind oklch() declaration.
      cssText += `${property}:${value};`;
    }

    element.setAttribute("data-pdf-computed-style", cssText);
  }
}

function applyComputedStylesInClone(clonedDocument: Document): void {
  // Remove every stylesheet from the clone. The clone will use only the
  // browser-resolved computed styles copied below.
  clonedDocument
    .querySelectorAll("style, link[rel='stylesheet']")
    .forEach((node) => node.remove());

  const elements = Array.from(
    clonedDocument.querySelectorAll<HTMLElement>("[data-pdf-computed-style]")
  );

  for (const element of elements) {
    const computedStyle = element.getAttribute("data-pdf-computed-style");

    if (computedStyle) {
      element.setAttribute("style", computedStyle);
    }

    element.removeAttribute("data-pdf-computed-style");
  }

  const body = clonedDocument.body;
  if (body) {
    body.style.margin = "0";
    body.style.padding = "0";
    body.style.width = `${PDF_WIDTH_PX}px`;
    body.style.background = "#ffffff";
    body.style.overflow = "visible";
  }
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));

  return Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          const finish = () => resolve();
          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });
          window.setTimeout(finish, 15000);
        })
    )
  ).then(() => undefined);
}

function createPageSlice(
  source: HTMLCanvasElement,
  sourceY: number,
  height: number
): HTMLCanvasElement {
  const pageCanvas = document.createElement("canvas");
  pageCanvas.width = source.width;
  pageCanvas.height = height;

  const context = pageCanvas.getContext("2d");
  if (!context) throw new Error("Unable to create PDF page canvas.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
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

  return pageCanvas;
}

export async function generateQuotationPdf(
  html: string,
  fileName = "quotation.pdf"
): Promise<void> {
  if (!html || !html.trim()) {
    throw new Error("Quotation HTML is empty.");
  }

  const container = document.createElement("div");
  container.id = "quotation-pdf-render-root";
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = `${PDF_WIDTH_PX}px`;
  container.style.maxWidth = `${PDF_WIDTH_PX}px`;
  container.style.margin = "0";
  container.style.padding = "0";
  container.style.background = "#ffffff";
  container.style.overflow = "visible";
  container.style.zIndex = "-99999";
  container.style.visibility = "visible";
  container.style.pointerEvents = "none";

  container.innerHTML = html;

  // The live browser resolves Tailwind oklch() to computed RGB values.
  // Capture those resolved values before html2canvas sees the clone.
  const templateRoot =
    container.querySelector<HTMLElement>(".quotation-template") || container;

  // The template itself is 780px wide in the editor. For PDF only, make it
  // use the complete 794px render width while keeping its internal padding.
  templateRoot.style.width = `${PDF_WIDTH_PX}px`;
  templateRoot.style.maxWidth = `${PDF_WIDTH_PX}px`;
  templateRoot.style.marginLeft = "0";
  templateRoot.style.marginRight = "0";
  templateRoot.style.boxSizing = "border-box";

  document.body.appendChild(container);

  try {
    await document.fonts.ready;
    await waitForImages(container);

    copyComputedStyles(container);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
      width: PDF_WIDTH_PX,
      windowWidth: PDF_WIDTH_PX,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDocument) => {
        applyComputedStylesInClone(clonedDocument);
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
    const pxPerMm = canvas.width / usableWidth;
    const pageHeightPx = Math.floor(usableHeight * pxPerMm);

    // Keep the full quotation on one page when it fits.
    const fullHeightMm = canvas.height / pxPerMm;

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
      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvas.height) {
        const height = Math.min(pageHeightPx, canvas.height - sourceY);
        const pageCanvas = createPageSlice(canvas, sourceY, height);

        if (pageIndex > 0) pdf.addPage();

        pdf.addImage(
          pageCanvas,
          "PNG",
          PDF_MARGIN_MM,
          PDF_MARGIN_MM,
          usableWidth,
          height / pxPerMm,
          undefined,
          "FAST"
        );

        sourceY += height;
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
