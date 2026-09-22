import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 4;
const RENDER_WIDTH_PX = 794;

function waitForFonts(): Promise<void> {
  if (!document.fonts?.ready) return Promise.resolve();
  return document.fonts.ready.then(() => undefined);
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  return Promise.all(images.map((img) => new Promise<void>((resolve) => {
    if (img.complete) return resolve();
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      resolve();
    };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
    window.setTimeout(done, 10000);
  }))).then(() => undefined);
}

/**
 * Copy the browser's already-resolved computed styles into the temporary PDF
 * clone. Chromium resolves Tailwind v4 oklch/oklab colors to RGB here, so the
 * PDF renderer never has to parse Tailwind's color functions.
 */
function inlineComputedStyles(source: HTMLElement, target: HTMLElement): void {
  const computed = window.getComputedStyle(source);

  for (let i = 0; i < computed.length; i += 1) {
    const property = computed.item(i);
    const value = computed.getPropertyValue(property);
    if (value) target.style.setProperty(property, value);
  }

  target.style.setProperty('box-sizing', 'border-box');

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children) as HTMLElement[];

  for (let i = 0; i < sourceChildren.length; i += 1) {
    const sourceChild = sourceChildren[i];
    const targetChild = targetChildren[i];
    if (sourceChild instanceof HTMLElement && targetChild instanceof HTMLElement) {
      inlineComputedStyles(sourceChild, targetChild);
    }
  }
}

function removeStylesheetsAndNormalizeClone(clone: HTMLElement): void {
  clone.querySelectorAll('style, link[rel~="stylesheet"]').forEach((node) => node.remove());

  clone.querySelectorAll<HTMLElement>('*').forEach((element) => {
    // Never allow responsive rules from the live app to change PDF dimensions.
    element.style.setProperty('max-width', element.style.maxWidth || 'none');
  });
}

function replaceUnsupportedColorFunctions(value: string): string {
  // This is only a defensive fallback. Normally getComputedStyle() has
  // already resolved colors to rgb()/rgba().
  if (!/(oklch|oklab|color-mix)\(/i.test(value)) return value;
  return 'rgb(0 0 0 / 0)';
}

function sanitizeInlineColors(root: HTMLElement): void {
  const colorProperties = [
    'color',
    'background-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
    'fill',
    'stroke',
    'box-shadow',
    'text-shadow',
    'background-image',
  ];

  root.querySelectorAll<HTMLElement>('*').forEach((element) => {
    for (const property of colorProperties) {
      const value = element.style.getPropertyValue(property);
      if (value && /(oklch|oklab|color-mix)\(/i.test(value)) {
        element.style.setProperty(
          property,
          replaceUnsupportedColorFunctions(value)
        );
      }
    }
  });
}

function createPdfClone(root: HTMLElement): HTMLElement {
  const clone = root.cloneNode(true) as HTMLElement;

  clone.removeAttribute('id');
  clone.style.position = 'static';
  clone.style.left = 'auto';
  clone.style.top = 'auto';
  clone.style.width = `${RENDER_WIDTH_PX}px`;
  clone.style.maxWidth = `${RENDER_WIDTH_PX}px`;
  clone.style.minWidth = `${RENDER_WIDTH_PX}px`;
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.background = '#ffffff';
  clone.style.overflow = 'visible';
  clone.style.height = 'auto';

  inlineComputedStyles(root, clone);

  // Restore the PDF root dimensions after copying computed styles.
  clone.style.width = `${RENDER_WIDTH_PX}px`;
  clone.style.maxWidth = `${RENDER_WIDTH_PX}px`;
  clone.style.minWidth = `${RENDER_WIDTH_PX}px`;
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.background = '#ffffff';
  clone.style.overflow = 'visible';
  clone.style.height = 'auto';

  const template = clone.querySelector<HTMLElement>('.quotation-template');
  if (template) {
    template.style.width = '100%';
    template.style.maxWidth = '100%';
    template.style.minWidth = '0';
    template.style.marginLeft = '0';
    template.style.marginRight = '0';
  }

  removeStylesheetsAndNormalizeClone(clone);
  sanitizeInlineColors(clone);

  return clone;
}

function trimTrailingBlankRows(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context || canvas.width <= 0 || canvas.height <= 0) return canvas;

  const { width, height } = canvas;
  const data = context.getImageData(0, 0, width, height).data;
  const rowStride = width * 4;
  const whiteThreshold = 250;
  let lastContentRow = -1;

  for (let y = height - 1; y >= 0; y -= 1) {
    const row = y * rowStride;
    let hasContent = false;

    for (let x = 0; x < width; x += 1) {
      const i = row + x * 4;
      const alpha = data[i + 3];
      if (
        alpha > 8 &&
        (data[i] < whiteThreshold ||
          data[i + 1] < whiteThreshold ||
          data[i + 2] < whiteThreshold)
      ) {
        hasContent = true;
        break;
      }
    }

    if (hasContent) {
      lastContentRow = y;
      break;
    }
  }

  // A completely white render is an actual render failure, not a page to save.
  if (lastContentRow < 0) {
    throw new Error('The quotation rendered as a blank page.');
  }

  const safetyRows = Math.min(12, height - lastContentRow - 1);
  const newHeight = lastContentRow + 1 + safetyRows;

  if (newHeight >= height) return canvas;

  const trimmed = document.createElement('canvas');
  trimmed.width = width;
  trimmed.height = newHeight;

  const trimmedContext = trimmed.getContext('2d');
  if (!trimmedContext) return canvas;

  trimmedContext.fillStyle = '#ffffff';
  trimmedContext.fillRect(0, 0, width, newHeight);
  trimmedContext.drawImage(
    canvas,
    0,
    0,
    width,
    newHeight,
    0,
    0,
    width,
    newHeight
  );

  return trimmed;
}

function createCanvasSlice(
  source: HTMLCanvasElement,
  sourceY: number,
  height: number
): HTMLCanvasElement {
  const slice = document.createElement('canvas');
  slice.width = source.width;
  slice.height = Math.max(1, Math.floor(height));

  const context = slice.getContext('2d');
  if (!context) throw new Error('Unable to create PDF page canvas.');

  context.fillStyle = '#ffffff';
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
  fileName = 'quotation.pdf'
): Promise<void> {
  if (!html.trim()) throw new Error('Quotation HTML is empty.');

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-100000px';
  container.style.top = '0';
  container.style.width = `${RENDER_WIDTH_PX}px`;
  container.style.maxWidth = `${RENDER_WIDTH_PX}px`;
  container.style.margin = '0';
  container.style.padding = '0';
  container.style.background = '#ffffff';
  container.style.pointerEvents = 'none';
  container.style.visibility = 'visible';
  container.style.zIndex = '-2147483647';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await waitForFonts();
    await waitForImages(container);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const clone = createPdfClone(container);

    // html2canvas gets an isolated, stylesheet-free clone. Therefore Tailwind
    // v4's oklch()/oklab() declarations are never parsed by html2canvas.
    const canvas = await html2canvas(clone, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 10000,
      width: RENDER_WIDTH_PX,
      windowWidth: RENDER_WIDTH_PX,
      scrollX: 0,
      scrollY: 0,
      foreignObjectRendering: false,
    });

    const trimmedCanvas = trimTrailingBlankRows(canvas);

    const usableWidth = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
    const usableHeight = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;
    const pixelsPerMm = trimmedCanvas.width / usableWidth;
    const pageHeightPx = Math.floor(usableHeight * pixelsPerMm);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    let sourceY = 0;
    let pageIndex = 0;

    while (sourceY < trimmedCanvas.height) {
      const currentHeight = Math.min(
        pageHeightPx,
        trimmedCanvas.height - sourceY
      );

      const pageCanvas = createCanvasSlice(
        trimmedCanvas,
        sourceY,
        currentHeight
      );

      if (pageIndex > 0) pdf.addPage();

      pdf.addImage(
        pageCanvas,
        'PNG',
        PDF_MARGIN_MM,
        PDF_MARGIN_MM,
        usableWidth,
        currentHeight / pixelsPerMm,
        undefined,
        'FAST'
      );

      sourceY += currentHeight;
      pageIndex += 1;
    }

    const safeFileName =
      fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() ||
      'quotation';

    pdf.save(
      safeFileName.toLowerCase().endsWith('.pdf')
        ? safeFileName
        : `${safeFileName}.pdf`
    );
  } finally {
    container.remove();
  }
}
