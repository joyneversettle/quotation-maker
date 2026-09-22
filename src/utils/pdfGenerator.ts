import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  container.style.minHeight = "1px";
  container.style.margin = "0";
  container.style.padding = "0";
  container.style.background = "#ffffff";
  container.style.color = "#000000";
  container.style.zIndex = "-9999";
  container.style.pointerEvents = "none";
  container.style.visibility = "visible";
  container.style.overflow = "visible";
  container.style.fontFamily = "Arial, Helvetica, sans-serif";

  container.innerHTML = html;

  document.body.appendChild(container);

  try {
    await document.fonts.ready;

    const images = Array.from(container.querySelectorAll("img"));

    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }

            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });

            window.setTimeout(done, 15000);
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
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
      width: 794,
      windowWidth: 794,
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

    /*
     * First try to fit the complete quotation on one A4 page.
     * This prevents payment/terms cards from being cut at a page boundary
     * when the quotation is only slightly taller than A4.
     */
    const fitScale = Math.min(
      usableWidth / canvas.width,
      usableHeight / canvas.height
    );

    const fittedWidth = canvas.width * fitScale;
    const fittedHeight = canvas.height * fitScale;

    if (fittedHeight <= usableHeight) {
      const x = margin + (usableWidth - fittedWidth) / 2;
      const y = margin;

      pdf.addImage(
        canvas,
        "PNG",
        x,
        y,
        fittedWidth,
        fittedHeight,
        undefined,
        "FAST"
      );
    } else {
      /*
       * If the quotation genuinely needs multiple pages, keep the same
       * width on every page. No browser print dialog, URL, date or page
       * numbers are added.
       */
      const pixelsPerMm = canvas.width / usableWidth;
      const pageHeightPx = Math.floor(usableHeight * pixelsPerMm);

      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvas.height) {
        const remainingHeight = canvas.height - sourceY;
        const currentHeightPx = Math.min(pageHeightPx, remainingHeight);

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

        const pageHeightMm = currentHeightPx / pixelsPerMm;

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
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
