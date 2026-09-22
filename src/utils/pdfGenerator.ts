import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PDF_WIDTH_PX = 794;

function convertCssColors(value: string): string {
  if (!value || !/(oklch|oklab|color\()/i.test(value)) {
    return value;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const context = canvas.getContext("2d");

  if (!context) {
    return value
      .replace(/oklch\([^)]*\)/gi, "#000000")
      .replace(/oklab\([^)]*\)/gi, "#000000")
      .replace(/color\([^)]*\)/gi, "#000000");
  }

  const replaceColor = (match: string): string => {
    try {
      context.fillStyle = "#000000";
      context.fillStyle = match;
      return context.fillStyle;
    } catch {
      return "#000000";
    }
  };

  return value
    .replace(/oklch\([^)]*\)/gi, replaceColor)
    .replace(/oklab\([^)]*\)/gi, replaceColor)
    .replace(/color\([^)]*\)/gi, replaceColor);
}

function copyComputedStyles(
  source: Element,
  target: Element
): void {
  const computed = window.getComputedStyle(source);
  const targetStyle = (target as HTMLElement).style;

  for (let index = 0; index < computed.length; index += 1) {
    const property = computed[index];

    if (!property || property.startsWith("--")) {
      continue;
    }

    let value = computed.getPropertyValue(property);

    if (!value) {
      continue;
    }

    value = convertCssColors(value);

    try {
      targetStyle.setProperty(
        property,
        value,
        computed.getPropertyPriority(property)
      );
    } catch {
      // Ignore properties that cannot be applied inline.
    }
  }

  // Remove utility classes so no Tailwind/application stylesheet is needed.
  target.removeAttribute("class");

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);

  for (
    let index = 0;
    index < sourceChildren.length;
    index += 1
  ) {
    const sourceChild = sourceChildren[index];
    const targetChild = targetChildren[index];

    if (targetChild) {
      copyComputedStyles(sourceChild, targetChild);
    }
  }
}

function prepareIsolatedDocument(
  iframe: HTMLIFrameElement,
  html: string
): HTMLElement {
  const iframeDocument = iframe.contentDocument;

  if (!iframeDocument) {
    throw new Error("Unable to create PDF rendering document.");
  }

  iframeDocument.open();
  iframeDocument.write(
    `<!doctype html><html><head><meta charset="UTF-8"><base href="${document.baseURI}"></head><body></body></html>`
  );
  iframeDocument.close();

  const source = document.createElement("div");

  source.style.position = "fixed";
  source.style.left = "0";
  source.style.top = "0";
  source.style.width = `${PDF_WIDTH_PX}px`;
  source.style.maxWidth = `${PDF_WIDTH_PX}px`;
  source.style.margin = "0";
  source.style.padding = "0";
  source.style.background = "#ffffff";
  source.style.overflow = "visible";
  source.innerHTML = html;

  document.body.appendChild(source);

  const isolatedRoot = iframeDocument.createElement("div");

  isolatedRoot.style.width = `${PDF_WIDTH_PX}px`;
  isolatedRoot.style.maxWidth = `${PDF_WIDTH_PX}px`;
  isolatedRoot.style.margin = "0";
  isolatedRoot.style.padding = "0";
  isolatedRoot.style.background = "#ffffff";
  isolatedRoot.style.color = "#000000";
  isolatedRoot.innerHTML = source.innerHTML;

  iframeDocument.body.style.margin = "0";
  iframeDocument.body.style.padding = "0";
  iframeDocument.body.style.width = `${PDF_WIDTH_PX}px`;
  iframeDocument.body.style.background = "#ffffff";

  iframeDocument.body.appendChild(isolatedRoot);

  // Browser computes Tailwind/quotation styles here while the real app CSS
  // is still available. Those computed styles are then copied as inline CSS.
  copyComputedStyles(source, isolatedRoot);

  source.remove();

  return isolatedRoot;
}

export async function generateQuotationPdf(
  html: string,
  fileName = "quotation.pdf"
): Promise<void> {
  if (!html || !html.trim()) {
    throw new Error("Quotation HTML is empty.");
  }

  const iframe = document.createElement("iframe");

  iframe.style.position = "fixed";
  iframe.style.left = "0";
  iframe.style.top = "0";
  iframe.style.width = `${PDF_WIDTH_PX}px`;
  iframe.style.height = "12000px";
  iframe.style.border = "0";
  iframe.style.margin = "0";
  iframe.style.padding = "0";
  iframe.style.background = "#ffffff";
  iframe.style.zIndex = "-2147483647";
  iframe.setAttribute("aria-hidden", "true");

  document.body.appendChild(iframe);

  try {
    const root = prepareIsolatedDocument(iframe, html);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const images = Array.from(
      root.querySelectorAll<HTMLImageElement>("img")
    );

    await Promise.all(
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
    );

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    /*
     * This html2canvas call runs inside a completely isolated iframe.
     * There are no Tailwind stylesheets and no oklch() rules available
     * for html2canvas to parse.
     */
    const canvas = await html2canvas(root, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 10000,
      width: PDF_WIDTH_PX,
      windowWidth: PDF_WIDTH_PX,
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

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 5;

    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    // Fit the whole quotation on one A4 page whenever possible.
    const fitScale = Math.min(
      usableWidth / canvas.width,
      usableHeight / canvas.height
    );

    const fittedWidth = canvas.width * fitScale;
    const fittedHeight = canvas.height * fitScale;

    if (fittedHeight <= usableHeight) {
      const x = margin + (usableWidth - fittedWidth) / 2;

      pdf.addImage(
        canvas,
        "PNG",
        x,
        margin,
        fittedWidth,
        fittedHeight,
        undefined,
        "FAST"
      );
    } else {
      const pixelsPerMm = canvas.width / usableWidth;
      const pageHeightPx = Math.floor(
        usableHeight * pixelsPerMm
      );

      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvas.height) {
        const currentHeightPx = Math.min(
          pageHeightPx,
          canvas.height - sourceY
        );

        const pageCanvas = document.createElement("canvas");

        pageCanvas.width = canvas.width;
        pageCanvas.height = currentHeightPx;

        const context = pageCanvas.getContext("2d");

        if (!context) {
          throw new Error("Unable to create PDF page.");
        }

        context.fillStyle = "#ffffff";
        context.fillRect(
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        );

        context.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          currentHeightPx,
          0,
          0,
          canvas.width,
          currentHeightPx
        );

        if (pageIndex > 0) {
          pdf.addPage();
        }

        const pageHeightMm =
          currentHeightPx / pixelsPerMm;

        pdf.addImage(
          pageCanvas,
          "PNG",
          margin,
          margin,
          usableWidth,
          pageHeightMm,
          undefined,
          "FAST"
        );

        sourceY += currentHeightPx;
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
    iframe.remove();
  }
}
