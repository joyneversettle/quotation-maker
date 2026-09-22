import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 5;
const USABLE_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2;
const USABLE_HEIGHT_MM = A4_HEIGHT_MM - MARGIN_MM * 2;

// Fixed desktop/A4 CSS viewport. This prevents mobile/desktop media queries
// from changing the quotation layout during PDF generation.
const RENDER_WIDTH_PX = 794;
const MIN_SINGLE_PAGE_SCALE = 0.72;

function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  return Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => {
          img.removeEventListener('load', done);
          img.removeEventListener('error', done);
          resolve();
        };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    }),
  ).then(() => undefined);
}

async function waitForIframeReady(iframe: HTMLIFrameElement): Promise<Document> {
  const doc = iframe.contentDocument;
  if (!doc) throw new Error('Unable to create PDF rendering document.');

  if (doc.fonts?.ready) {
    try {
      await doc.fonts.ready;
    } catch {
      // Continue even if a browser cannot resolve one optional font.
    }
  }

  await waitForImages(doc);
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

  return doc;
}

function copyStylesToIframe(iframeDoc: Document) {
  const head = iframeDoc.head;
  const base = iframeDoc.createElement('base');
  base.href = document.baseURI;
  head.appendChild(base);

  document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    head.appendChild(node.cloneNode(true));
  });

  const printStyle = iframeDoc.createElement('style');
  printStyle.textContent = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: ${RENDER_WIDTH_PX}px !important;
      min-width: ${RENDER_WIDTH_PX}px !important;
      max-width: ${RENDER_WIDTH_PX}px !important;
      background: #ffffff !important;
      overflow: visible !important;
    }

    #quotation-pdf-content {
      width: ${RENDER_WIDTH_PX}px !important;
      min-width: ${RENDER_WIDTH_PX}px !important;
      max-width: ${RENDER_WIDTH_PX}px !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      box-sizing: border-box !important;
      overflow: visible !important;
    }

    #quotation-pdf-content .quotation-template {
      width: 100% !important;
      max-width: ${RENDER_WIDTH_PX}px !important;
      margin: 0 !important;
      box-sizing: border-box !important;
    }

    #quotation-pdf-content * {
      box-sizing: border-box !important;
    }

    #quotation-pdf-content table {
      width: 100% !important;
      border-collapse: collapse !important;
    }

    #quotation-pdf-content th,
    #quotation-pdf-content td {
      vertical-align: middle !important;
      line-height: 1.2 !important;
    }

    #quotation-pdf-content img {
      max-width: 100% !important;
    }
  `;
  head.appendChild(printStyle);
}

function makeRenderIframe(html: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = `${RENDER_WIDTH_PX}px`;
  iframe.style.height = '1200px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-1';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument;
  if (!iframeDoc) {
    iframe.remove();
    throw new Error('Unable to access PDF rendering frame.');
  }

  iframeDoc.open();
  iframeDoc.write(`<!doctype html><html><head><meta name="viewport" content="width=${RENDER_WIDTH_PX}, initial-scale=1"></head><body><div id="quotation-pdf-content">${html}</div></body></html>`);
  iframeDoc.close();

  copyStylesToIframe(iframeDoc);
  return iframe;
}

function createCanvasSlice(source: HTMLCanvasElement, y: number, height: number) {
  const slice = document.createElement('canvas');
  slice.width = source.width;
  slice.height = Math.max(1, Math.min(height, source.height - y));

  const context = slice.getContext('2d');
  if (!context) throw new Error('Unable to create PDF page canvas.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, slice.width, slice.height);
  context.drawImage(
    source,
    0,
    y,
    source.width,
    slice.height,
    0,
    0,
    slice.width,
    slice.height,
  );

  return slice;
}


function buildPageRanges(
  canvas: HTMLCanvasElement,
  templateRoot: HTMLElement,
  canvasScale: number,
): Array<{ start: number; end: number }> {
  const maxPageHeight = Math.floor(canvas.width * (USABLE_HEIGHT_MM / USABLE_WIDTH_MM));
  const contentHeight = canvas.height;

  if (contentHeight <= maxPageHeight) {
    return [{ start: 0, end: contentHeight }];
  }

  const ranges: Array<{ start: number; end: number }> = [];
  let start = 0;
  const children = Array.from(templateRoot.children) as HTMLElement[];

  for (const child of children) {
    const childTop = Math.round(child.offsetTop * canvasScale);
    const childBottom = Math.round((child.offsetTop + child.offsetHeight) * canvasScale);

    if (childBottom - start <= maxPageHeight) {
      continue;
    }

    if (childTop > start) {
      ranges.push({ start, end: childTop });
      start = childTop;
    }

    if (childBottom - start > maxPageHeight) {
      // A single section is taller than a page. Split it only as a last resort.
      const forcedEnd = Math.min(start + maxPageHeight, contentHeight);
      ranges.push({ start, end: forcedEnd });
      start = forcedEnd;
    }
  }

  if (start < contentHeight) {
    ranges.push({ start, end: contentHeight });
  }

  return ranges.length ? ranges : [{ start: 0, end: contentHeight }];
}

export async function generateQuotationPdf(html: string, quotationNumber: string): Promise<void> {
  if (!html) throw new Error('Quotation content is empty.');

  const iframe = makeRenderIframe(html);

  try {
    const iframeDoc = await waitForIframeReady(iframe);
    const target = iframeDoc.getElementById('quotation-pdf-content');
    const templateRoot = target?.querySelector('.quotation-template') as HTMLElement | null;

    if (!target || !templateRoot) {
      throw new Error('Quotation template could not be prepared for PDF.');
    }

    iframe.style.height = `${Math.max(1200, target.scrollHeight + 50)}px`;

    const canvas = await html2canvas(target, {
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      logging: false,
      scale: 2,
      width: RENDER_WIDTH_PX,
      height: target.scrollHeight,
      windowWidth: RENDER_WIDTH_PX,
      windowHeight: Math.max(RENDER_WIDTH_PX, target.scrollHeight),
      scrollX: 0,
      scrollY: 0,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const maxPageCanvasHeight = canvas.width * (USABLE_HEIGHT_MM / USABLE_WIDTH_MM);
    const fullHeightScale = maxPageCanvasHeight / canvas.height;

    // Always use the full printable A4 width.
    // The previous implementation scaled width down together with height,
    // which created visible left/right gaps in the PDF.
    if (fullHeightScale >= 1) {
      const imageData = canvas.toDataURL('image/jpeg', 0.98);
      const renderWidth = USABLE_WIDTH_MM;
      const renderHeight = USABLE_WIDTH_MM * (canvas.height / canvas.width);

      pdf.addImage(
        imageData,
        'JPEG',
        MARGIN_MM,
        MARGIN_MM,
        renderWidth,
        renderHeight,
        undefined,
        'FAST',
      );
    } else {
      const canvasScale = canvas.width / Math.max(1, target.scrollWidth);
      const ranges = buildPageRanges(canvas, templateRoot, canvasScale);

      ranges.forEach((range, index) => {
        if (index > 0) pdf.addPage();

        const slice = createCanvasSlice(
          canvas,
          range.start,
          range.end - range.start,
        );

        const imageData = slice.toDataURL('image/jpeg', 0.98);
        const renderWidth = USABLE_WIDTH_MM;
        const renderHeight = renderWidth * (slice.height / slice.width);

        pdf.addImage(
          imageData,
          'JPEG',
          MARGIN_MM,
          MARGIN_MM,
          renderWidth,
          renderHeight,
          undefined,
          'FAST',
        );
      });
    }

    const safeNumber = String(quotationNumber || 'quotation')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'quotation';

    pdf.save(`Quotation-${safeNumber}.pdf`);
  } finally {
    iframe.remove();
  }
}
