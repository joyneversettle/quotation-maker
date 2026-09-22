import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generateQuotationPdf(
  html: string,
  fileName = "quotation"
): Promise<void> {
  if (!html || !html.trim()) {
    throw new Error("Quotation HTML is empty.");
  }

  const container = document.createElement("div");

  container.style.position = "fixed";
  container.style.left = "-100000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.maxWidth = "794px";
  container.style.background = "#ffffff";
  container.style.padding = "0";
  container.style.margin = "0";
  container.style.zIndex = "-1";
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

            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 20000,
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

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    /*
     * Keep the quotation width fixed at A4 width.
     * This makes the PDF independent of the user's
     * browser/device viewport.
     */
    const scale = usableWidth / canvasWidth;

    const totalHeightMm = canvasHeight * scale;

    /*
     * If the quotation fits on one A4 page,
     * keep it on exactly one page.
     */
    if (totalHeightMm <= usableHeight) {
      pdf.addImage(
        canvas,
        "PNG",
        margin,
        margin,
        usableWidth,
        totalHeightMm,
        undefined,
        "FAST"
      );
    } else {
      /*
       * For longer quotations, create fixed A4 pages.
       * No browser print dialog is used, so browser
       * headers, footers and page numbers cannot appear.
       */
      const pixelsPerMm = canvasWidth / usableWidth;
      const pageHeightPx = Math.floor(usableHeight * pixelsPerMm);

      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvasHeight) {
        const remainingHeight = canvasHeight - sourceY;
        const currentHeightPx = Math.min(pageHeightPx, remainingHeight);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvasWidth;
        pageCanvas.height = currentHeightPx;

        const pageContext = pageCanvas.getContext("2d");

        if (!pageContext) {
          throw new Error("Unable to create PDF page.");
        }

        pageContext.fillStyle = "#ffffff";
        pageContext.fillRect(
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        );

        pageContext.drawImage(
          canvas,
          0,
          sourceY,
          canvasWidth,
          currentHeightPx,
          0,
          0,
          canvasWidth,
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
