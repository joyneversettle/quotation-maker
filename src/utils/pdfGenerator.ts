import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function sanitizeCssText(cssText: string): string {
  return cssText
    .replace(/oklch\([^)]*\)/gi, "#000000")
    .replace(/oklab\([^)]*\)/gi, "#000000")
    .replace(/color\([^)]*\)/gi, "#000000");
}

function removeUnsupportedStyles(doc: Document): void {
  const styleSheets = Array.from(doc.querySelectorAll("style"));

  for (const style of styleSheets) {
    if (style.textContent) {
      style.textContent = sanitizeCssText(style.textContent);
    }
  }

  const linkedStylesheets = Array.from(
    doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  );

  for (const link of linkedStylesheets) {
    link.remove();
  }
}

function convertInlineUnsupportedColors(root: HTMLElement): void {
  const elements = [
    root,
    ...Array.from(root.querySelectorAll<HTMLElement>("*")),
  ];

  for (const element of elements) {
    const style = element.getAttribute("style");

    if (!style) continue;

    element.setAttribute("style", sanitizeCssText(style));
  }
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
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.maxWidth = "794px";
  container.style.margin = "0";
  container.style.padding = "0";
  container.style.background = "#ffffff";
  container.style.color = "#000000";
  container.style.visibility = "hidden";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-1";
  container.style.overflow = "visible";

  container.innerHTML = html;

  document.body.appendChild(container);

  try {
    await document.fonts.ready;

    convertInlineUnsupportedColors(container);

    const images = Array.from(container.querySelectorAll("img"));

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

    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 10000,
      width: 794,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,

      onclone: (clonedDocument) => {
        /*
         * html2canvas parses the cloned document's stylesheets.
         * Remove linked application stylesheets and sanitize every
         * inline <style> before html2canvas starts rendering.
         */
        removeUnsupportedStyles(clonedDocument);

        const clonedRoot =
          clonedDocument.body.querySelector<HTMLElement>(
            "[data-pdf-root]"
          );

        if (clonedRoot) {
          convertInlineUnsupportedColors(clonedRoot);
        }

        const allElements = Array.from(
          clonedDocument.body.querySelectorAll<HTMLElement>("*")
        );

        for (const element of allElements) {
          const style = element.getAttribute("style");

          if (style && /(oklch|oklab|color\()/i.test(style)) {
            element.setAttribute(
              "style",
              sanitizeCssText(style)
            );
          }
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

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 5;

    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    /*
     * Fit the complete quotation onto one A4 page whenever possible.
     * This avoids splitting payment/terms cards when the quotation
     * is only slightly taller than A4.
     */
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
      /*
       * Genuine multi-page quotation.
       * No browser print dialog, browser headers, URLs,
       * timestamps or page numbers are added.
       */
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

        const renderedHeight =
          currentHeightPx / pixelsPerMm;

        pdf.addImage(
          pageCanvas,
          "PNG",
          margin,
          margin,
          usableWidth,
          renderedHeight,
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
    container.remove();
  }
}
