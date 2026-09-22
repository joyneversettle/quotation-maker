import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generateQuotationPdf(
  element: HTMLElement,
  fileName = "quotation.pdf"
): Promise<void> {
  if (!element) {
    throw new Error("Quotation element not found.");
  }

  const originalStyle = {
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    margin: element.style.margin,
    overflow: element.style.overflow,
  };

  try {
    element.style.width = "794px";
    element.style.maxWidth = "794px";
    element.style.margin = "0 auto";
    element.style.overflow = "visible";

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
      windowWidth: 794,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const margin = 6;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const imageWidth = canvas.width;
    const imageHeight = canvas.height;

    const ratio = contentWidth / imageWidth;
    const totalPdfHeight = imageHeight * ratio;

    if (totalPdfHeight <= contentHeight) {
      pdf.addImage(
        canvas,
        "PNG",
        margin,
        margin,
        contentWidth,
        totalPdfHeight,
        undefined,
        "FAST"
      );
    } else {
      const pagePixelHeight = Math.floor(contentHeight / ratio);

      let sourceY = 0;
      let pageNumber = 0;

      while (sourceY < imageHeight) {
        if (pageNumber > 0) {
          pdf.addPage();
        }

        const currentPixelHeight = Math.min(
          pagePixelHeight,
          imageHeight - sourceY
        );

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = imageWidth;
        pageCanvas.height = currentPixelHeight;

        const context = pageCanvas.getContext("2d");

        if (!context) {
          throw new Error("Unable to create PDF canvas.");
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        context.drawImage(
          canvas,
          0,
          sourceY,
          imageWidth,
          currentPixelHeight,
          0,
          0,
          imageWidth,
          currentPixelHeight
        );

        const renderedHeight = currentPixelHeight * ratio;

        pdf.addImage(
          pageCanvas,
          "PNG",
          margin,
          margin,
          contentWidth,
          renderedHeight,
          undefined,
          "FAST"
        );

        sourceY += currentPixelHeight;
        pageNumber += 1;
      }
    }

    pdf.save(fileName);
  } finally {
    element.style.width = originalStyle.width;
    element.style.maxWidth = originalStyle.maxWidth;
    element.style.margin = originalStyle.margin;
    element.style.overflow = originalStyle.overflow;
  }
}
