import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const RENDER_WIDTH_PX = 794;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 4;

/**
 * Resolve browser-supported color functions to RGB once in the real document.
 * html2canvas can then use the same visual colors without parsing oklch/oklab.
 */
function buildColorMap(): Map<string, string> {
  const map = new Map<string, string>();
  const sourceTexts: string[] = [];

  document.querySelectorAll("style").forEach((style) => {
    if (style.textContent) sourceTexts.push(style.textContent);
  });

  const html = document.documentElement.outerHTML;
  sourceTexts.push(html);

  const matches =
    sourceTexts.join("\n").match(/(?:oklch|oklab|color)\([^)]*\)/gi) || [];

  if (!matches.length) return map;

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
    for (const token of new Set(matches)) {
      probe.style.color = "";
      probe.style.color = token;

      const resolved = window.getComputedStyle(probe).color;

      if (resolved && !/(oklch|oklab|color\()/i.test(resolved)) {
        map.set(token, resolved);
      } else {
        map.set(token, "#000000");
      }
    }
  } finally {
    probe.remove();
  }

  return map;
}

function replaceUnsupportedColors(
  cssText: string,
  colorMap: Map<string, string>
): string {
  return cssText.replace(
    /(?:oklch|oklab|color)\([^)]*\)/gi,
    (token) => colorMap.get(token) || "#000000"
  );
}

function sanitizeClonedStyles(
  clonedDocument: Document,
  colorMap: Map<string, string>
): void {
  // Preserve ALL application CSS. Only replace unsupported color functions.
  clonedDocument.querySelectorAll("style").forEach((style) => {
    if (style.textContent) {
      style.textContent = replaceUnsupportedColors(
        style.textContent,
        colorMap
      );
    }
  });

  // Sanitize inline style attributes without removing any other styling.
  clonedDocument.querySelectorAll<HTMLElement>("[style]").forEach((element) => {
    const value = element.getAttribute("style");

    if (value && /(?:oklch|oklab|color)\(/i.test(value)) {
      element.setAttribute(
        "style",
        replaceUnsupportedColors(value, colorMap)
      );
    }
  });
}

function resolveColorToken(token: string): string | null {
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
    probe.style.color = token;

    const resolved = window.getComputedStyle(probe).color;

    return resolved &&
      !/(oklch|oklab|color-mix|color\()/i.test(resolved)
      ? resolved
      : null;
  } finally {
    probe.remove();
  }
}

function sanitizeComputedColors(root: HTMLElement): void {
  /*
   * html2canvas reads computed styles from the cloned document.
   *
   * Tailwind CSS v4 can leave OKLCH/OKLAB color functions in those
   * computed values even after stylesheet text has been rewritten.
   *
   * Convert only color-bearing properties in the temporary PDF clone.
   * The actual application DOM is never modified.
   */
  const colorProperties = [
    "color",
    "backgroundColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "outlineColor",
    "columnRuleColor",
    "textDecorationColor",
    "fill",
    "stroke",
    "caretColor",
    "accentColor",
  ] as const;

  const elements = [
    root,
    ...Array.from(root.querySelectorAll<HTMLElement>("*")),
  ];

  for (const element of elements) {
    const computed = window.getComputedStyle(element);

    for (const property of colorProperties) {
      const value = computed[property];

      if (
        !value ||
        !/(oklch|oklab|color-mix|color\()/i.test(value)
      ) {
        continue;
      }

      const resolved = resolveColorToken(value);

      if (resolved) {
        element.style.setProperty(
          property.replace(
            /[A-Z]/g,
            (letter) => `-${letter.toLowerCase()}`
          ),
          resolved
        );
      }
    }

    /*
     * Gradients/shadows can contain OKLCH/OKLAB stops even when normal
     * color properties are already RGB.
     */
    for (const property of [
      "backgroundImage",
      "boxShadow",
      "textShadow",
    ] as const) {
      const value = computed[property];

      if (
        !value ||
        !/(oklch|oklab|color-mix|color\()/i.test(value)
      ) {
        continue;
      }

      const converted = value.replace(
        /(?:oklch|oklab|color)\([^)]*\)/gi,
        (token) => resolveColorToken(token) || token
      );

      if (
        converted !== value &&
        !/(oklch|oklab|color-mix|color\()/i.test(converted)
      ) {
        element.style.setProperty(
          property.replace(
            /[A-Z]/g,
            (letter) => `-${letter.toLowerCase()}`
          ),
          converted
        );
      }
    }
  }
}

function getSafePageBreaks(
  root: HTMLElement,
  pageHeightPx: number
): number[] {
  const template = root.querySelector<HTMLElement>(
    ".quotation-template"
  );

  if (!template) return [];

  const rootRect = root.getBoundingClientRect();
  const templateRect = template.getBoundingClientRect();

  const offsetY = templateRect.top - rootRect.top;

  const breaks = new Set<number>();

  /*
   * The built-in quotation templates place their major quotation
   * sections as direct children of .quotation-template.
   */
  const sections = Array.from(template.children) as HTMLElement[];

  for (const section of sections) {
    const rect = section.getBoundingClientRect();

    const bottom = Math.round(
      rect.bottom - rootRect.top
    );

    if (bottom > 0 && bottom < root.scrollHeight) {
      breaks.add(bottom);
    }
  }

  /*
   * Also allow explicit safe-break descendants for templates that
   * wrap multiple sections inside another container.
   */
  for (const element of Array.from(
    template.querySelectorAll<HTMLElement>(
      ".page-break-inside-avoid, [data-pdf-break], .mobile-note-card"
    )
  )) {
    const rect = element.getBoundingClientRect();

    const bottom = Math.round(
      rect.bottom - rootRect.top
    );

    if (
      bottom > offsetY &&
      bottom < root.scrollHeight
    ) {
      breaks.add(bottom);
    }
  }

  return Array.from(breaks)
    .sort((a, b) => a - b)
    .filter(
      (value) => value > pageHeightPx * 0.15
    );
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(
    root.querySelectorAll("img")
  );

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }

          const finish = () => resolve();

          img.addEventListener(
            "load",
            finish,
            { once: true }
          );

          img.addEventListener(
            "error",
            finish,
            { once: true }
          );

          window.setTimeout(
            finish,
            10000
          );
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
    throw new Error(
      "Unable to create PDF page canvas."
    );
  }

  context.fillStyle = "#ffffff";

  context.fillRect(
    0,
    0,
    slice.width,
    slice.height
  );

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
    throw new Error(
      "Quotation HTML is empty."
    );
  }

  /*
   * Resolve colors while the browser still understands
   * oklch/oklab.
   */
  const colorMap = buildColorMap();

  const container =
    document.createElement("div");

  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width =
    `${RENDER_WIDTH_PX}px`;
  container.style.maxWidth =
    `${RENDER_WIDTH_PX}px`;
  container.style.margin = "0";
  container.style.padding = "0";
  container.style.background = "#ffffff";
  container.style.visibility = "visible";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-999999";
  container.style.overflow = "visible";

  container.innerHTML = html;

  /*
   * PDF-only alignment/width rules.
   *
   * The quotation content/design itself is untouched.
   */
  const pdfRules =
    document.createElement("style");

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

  container.id =
    "quotation-pdf-render-root";

  container.prepend(pdfRules);

  document.body.appendChild(container);

  try {
    await document.fonts.ready;

    await waitForImages(container);

    await new Promise<void>(
      (resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(
            () => resolve()
          );
        });
      }
    );

    const canvas =
      await html2canvas(
        container,
        {
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

          onclone: (
            clonedDocument
          ) => {
            /*
             * Keep all application CSS intact.
             * Only convert unsupported color functions.
             */
            sanitizeClonedStyles(
              clonedDocument,
              colorMap
            );

            const clonedRoot =
              clonedDocument.getElementById(
                "quotation-pdf-render-root"
              );

            if (clonedRoot) {
              clonedRoot.style.width =
                `${RENDER_WIDTH_PX}px`;

              clonedRoot.style.maxWidth =
                `${RENDER_WIDTH_PX}px`;

              clonedRoot.style.margin =
                "0";

              clonedRoot.style.padding =
                "0";

              const template =
                clonedRoot.querySelector<HTMLElement>(
                  ".quotation-template"
                );

              if (template) {
                template.style.width =
                  "100%";

                template.style.maxWidth =
                  "100%";

                template.style.marginLeft =
                  "0";

                template.style.marginRight =
                  "0";
              }

              /*
               * Critical fix:
               * normalize the actual computed color values
               * that html2canvas reads.
               */
              sanitizeComputedColors(
                clonedRoot
              );
            }
          },
        }
      );

    if (!canvas.width || !canvas.height) {
      throw new Error(
        "Quotation could not be rendered."
      );
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const usableWidth =
      A4_WIDTH_MM -
      PDF_MARGIN_MM * 2;

    const usableHeight =
      A4_HEIGHT_MM -
      PDF_MARGIN_MM * 2;

    const pixelsPerMm =
      canvas.width / usableWidth;

    const fullHeightMm =
      canvas.height / pixelsPerMm;

    /*
     * Single-page quotation.
     */
    if (
      fullHeightMm <= usableHeight
    ) {
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
       * Multi-page quotation.
       *
       * Prefer natural quotation-section boundaries
       * instead of cutting directly through cards.
       */
      const pageHeightPx =
        Math.floor(
          usableHeight *
            pixelsPerMm
        );

      const safeBreaks =
        getSafePageBreaks(
          container,
          pageHeightPx
        );

      let sourceY = 0;
      let pageIndex = 0;

      while (
        sourceY < canvas.height
      ) {
        const targetY =
          Math.min(
            sourceY +
              pageHeightPx,
            canvas.height
          );

        const nextSafeBreak =
          safeBreaks
            .filter(
              (breakY) =>
                breakY > sourceY &&
                breakY <= targetY
            )
            .pop();

        const endY =
          nextSafeBreak ??
          targetY;

        const currentHeight =
          Math.max(
            1,
            Math.min(
              endY - sourceY,
              canvas.height -
                sourceY
            )
          );

        const pageCanvas =
          createCanvasSlice(
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
          currentHeight /
            pixelsPerMm,
          undefined,
          "FAST"
        );

        sourceY += currentHeight;
        pageIndex += 1;
      }
    }

    const safeFileName =
      fileName
        .replace(
          /[<>:"/\\|?*\x00-\x1F]/g,
          "-"
        )
        .trim() ||
      "quotation";

    pdf.save(
      safeFileName
        .toLowerCase()
        .endsWith(".pdf")
        ? safeFileName
        : `${safeFileName}.pdf`
    );
  } finally {
    container.remove();
  }
}
