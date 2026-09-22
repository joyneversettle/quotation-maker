import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function convertUnsupportedColors(root: HTMLElement): void {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  const colorProperties = [
    "color",
    "backgroundColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "outlineColor",
    "textDecorationColor",
    "columnRuleColor",
    "fill",
    "stroke",
  ];

  const temp = document.createElement("span");
  temp.style.position = "fixed";
  temp.style.left = "-99999px";
  temp.style.top = "-99999px";
  temp.style.width = "1px";
  temp.style.height = "1px";
  temp.style.visibility = "hidden";
  document.body.appendChild(temp);

  try {
    for (const element of elements) {
      const computed = window.getComputedStyle(element);

      for (const property of colorProperties) {
        const value = computed.getPropertyValue(property);

        if (!value || !/(oklch|oklab|color\()/i.test(value)) {
          continue;
        }

        temp.style.color = "";
        temp.style.backgroundColor = "";
        temp.style.borderColor = "";

        if (
          property === "color" ||
          property === "fill" ||
          property === "stroke" ||
          property === "outlineColor" ||
          property === "textDecorationColor" ||
          property === "columnRuleColor"
        ) {
          temp.style.color = value;
          const converted = temp.style.color;

          if (converted && !/(oklch|oklab|color\()/i.test(converted)) {
            element.style.setProperty(property, converted);
          }
        } else {
          temp.style.backgroundColor = value;
          const converted = temp.style.backgroundColor;

          if (converted && !/(oklch|oklab|color\()/i.test(converted)) {
            element.style.setProperty(property, converted);
          }
        }
      }

      const backgroundImage = computed.backgroundImage;

      if (
        backgroundImage &&
        /(oklch|oklab|color\()/i.test(backgroundImage)
      ) {
        element.style.backgroundImage = "none";
      }

      const boxShadow = computed.boxShadow;

      if (boxShadow && /(oklch|oklab|color\()/i.test(boxShadow)) {
        element.style.boxShadow = "none";
      }

      const textShadow = computed.textShadow;

      if (textShadow && /(oklch|oklab|color\()/i.test(textShadow)) {
        element.style.textShadow = "none";
      }
    }
  } finally {
    temp.remove();
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

    // html2canvas cannot parse CSS oklch/oklab colors.
    // Convert only the temporary PDF-render copy, never the live app.
    convertUnsupportedColors(container);

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
      const pageHeightPx = Math.floor(usableHeight * pixelsPerMm);

      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvas.height) {
        const currentPixelHeight = Math.min(
          pageHeightPx,
          canvas.height - sourceY
        );

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = currentPixelHeight;

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
          currentPixelHeight,
          0,
          0,
          canvas.width,
          currentPixelHeight
        );

        if (pageIndex > 0) {
          pdf.addPage();
        }

        const pageHeightMm = currentPixelHeight / pixelsPerMm;

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

        sourceY += currentPixelHeight;
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
