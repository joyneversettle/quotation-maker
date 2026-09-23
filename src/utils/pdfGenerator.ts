import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 4;
const RENDER_WIDTH_PX = 794;

const COLOR_RE = /(?:oklch|oklab|color-mix|color)\(/i;

/**
 * IMPORTANT:
 * html2canvas requires the target element to be a real element in the
 * current document. Do not pass a detached clone or an iframe element.
 * This helper creates a real, off-screen render host and appends it to body.
 */
function createRenderHost(html: string): HTMLDivElement {
  const host = document.createElement('div');

  host.id = 'quotation-pdf-render-root';
  host.innerHTML = html;

  Object.assign(host.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: `${RENDER_WIDTH_PX}px`,
    maxWidth: `${RENDER_WIDTH_PX}px`,
    minWidth: `${RENDER_WIDTH_PX}px`,
    margin: '0',
    padding: '0',
    background: '#ffffff',
    visibility: 'visible',
    opacity: '1',
    pointerEvents: 'none',
    zIndex: '-2147483647',
    overflow: 'visible',
    boxSizing: 'border-box',
  });

  document.body.prepend(host);
  return host;
}

function resolveColor(value: string): string | null {
  if (!COLOR_RE.test(value)) return value;

  const probe = document.createElement('span');
  Object.assign(probe.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: '1px',
    height: '1px',
    visibility: 'hidden',
    pointerEvents: 'none',
  });

  document.body.appendChild(probe);

  try {
    probe.style.color = '';
    probe.style.color = value;
    const result = getComputedStyle(probe).color;
    return result && !COLOR_RE.test(result) ? result : null;
  } finally {
    probe.remove();
  }
}

function sanitizeSvg(root: HTMLElement): void {
  root.querySelectorAll<SVGElement>('svg').forEach((svg) => {
    const elements = [svg, ...Array.from(svg.querySelectorAll<SVGElement>('*'))];

    elements.forEach((element) => {
      ['fill', 'stroke', 'color', 'stop-color', 'flood-color', 'lighting-color'].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (!value || !COLOR_RE.test(value)) return;
        const resolved = resolveColor(value);
        if (resolved) element.setAttribute(attribute, resolved);
      });

      const style = element.getAttribute('style');
      if (style && COLOR_RE.test(style)) {
        element.setAttribute('style', replaceCssColors(style));
      }
    });
  });
}

function replaceCssColors(value: string): string {
  // Resolve function tokens through the browser rather than inventing RGB values.
  // A small parser is used so nested color-mix() functions are handled safely.
  let output = '';
  let i = 0;

  while (i < value.length) {
    const lower = value.slice(i).toLowerCase();
    const names = ['oklch(', 'oklab(', 'color-mix(', 'color('];
    const found = names
      .map((name) => ({ name, index: lower.indexOf(name) }))
      .filter((item) => item.index >= 0)
      .sort((a, b) => a.index - b.index)[0];

    if (!found) {
      output += value.slice(i);
      break;
    }

    const start = i + found.index;
    output += value.slice(i, start);

    let depth = 0;
    let end = start;
    for (; end < value.length; end++) {
      const ch = value[end];
      if (ch === '(') depth += 1;
      else if (ch === ')') {
        depth -= 1;
        if (depth === 0) {
          end += 1;
          break;
        }
      }
    }

    const token = value.slice(start, end);
    const resolved = resolveColor(token);
    output += resolved || '#000000';
    i = end;
  }

  return output;
}

/**
 * Copy browser-computed presentation into inline styles on the cloned PDF
 * document. Once this is done, Tailwind's stylesheet can be removed from the
 * clone, preventing html2canvas from parsing Tailwind v4 oklch declarations.
 */
function inlineComputedStyles(root: HTMLElement): void {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];

  elements.forEach((element) => {
    const computed = getComputedStyle(element);
    const inline = element.style;

    for (let i = 0; i < computed.length; i += 1) {
      const property = computed.item(i);
      if (!property) continue;

      let value = computed.getPropertyValue(property);
      if (!value) continue;

      if (COLOR_RE.test(value)) {
        const resolved = resolveColor(value);
        if (resolved) value = resolved;
        else continue;
      }

      try {
        inline.setProperty(property, value);
      } catch {
        // Ignore a browser-only computed property that cannot be written inline.
      }
    }

    // Also sanitize any existing inline declaration.
    const inlineCss = element.getAttribute('style');
    if (inlineCss && COLOR_RE.test(inlineCss)) {
      element.setAttribute('style', replaceCssColors(inlineCss));
    }
  });
}

function removeStylesheetsFromClone(clonedDocument: Document): void {
  // At this point every visual property has been copied inline.
  // Removing stylesheets prevents html2canvas's CSS parser from seeing oklch.
  clonedDocument.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    node.remove();
  });
}

function prepareClone(clonedDocument: Document): void {
  const root = clonedDocument.getElementById('quotation-pdf-render-root');
  if (!root) return;

  const htmlRoot = root as HTMLElement;
  htmlRoot.style.setProperty('width', `${RENDER_WIDTH_PX}px`, 'important');
  htmlRoot.style.setProperty('max-width', `${RENDER_WIDTH_PX}px`, 'important');
  htmlRoot.style.setProperty('min-width', `${RENDER_WIDTH_PX}px`, 'important');
  htmlRoot.style.setProperty('margin', '0', 'important');
  htmlRoot.style.setProperty('padding', '0', 'important');
  htmlRoot.style.setProperty('background', '#ffffff', 'important');
  htmlRoot.style.setProperty('visibility', 'visible', 'important');
  htmlRoot.style.setProperty('opacity', '1', 'important');
  htmlRoot.style.setProperty('transform', 'none', 'important');

  const template = htmlRoot.querySelector<HTMLElement>('.quotation-template');
  if (template) {
    template.style.setProperty('width', '100%', 'important');
    template.style.setProperty('max-width', '100%', 'important');
    template.style.setProperty('margin-left', '0', 'important');
    template.style.setProperty('margin-right', '0', 'important');
    template.style.setProperty('transform', 'none', 'important');
  }

  // The clone is already rendered by the browser. Freeze those computed styles
  // before removing Tailwind/application stylesheets.
  inlineComputedStyles(htmlRoot);
  sanitizeSvg(htmlRoot);
  removeStylesheetsFromClone(clonedDocument);

  // Restore only the few PDF-root guarantees needed after stylesheet removal.
  htmlRoot.style.setProperty('width', `${RENDER_WIDTH_PX}px`, 'important');
  htmlRoot.style.setProperty('background', '#ffffff', 'important');
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));

  return Promise.all(
    images.map((image) =>
      new Promise<void>((resolve) => {
        if (image.complete) {
          resolve();
          return;
        }

        const finish = () => resolve();
        image.addEventListener('load', finish, { once: true });
        image.addEventListener('error', finish, { once: true });
        window.setTimeout(finish, 10000);
      })
    )
  ).then(() => undefined);
}

function trimTrailingBlankRows(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  const sampleStep = Math.max(1, Math.floor(canvas.width / 500));
  const rowHeight = 1;
  let lastContentRow = canvas.height - 1;

  for (let y = canvas.height - 1; y >= 0; y -= rowHeight) {
    let hasContent = false;

    for (let x = 0; x < canvas.width; x += sampleStep) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const isNotWhite = pixel[3] > 5 && (pixel[0] < 248 || pixel[1] < 248 || pixel[2] < 248);
      if (isNotWhite) {
        hasContent = true;
        break;
      }
    }

    if (hasContent) {
      lastContentRow = y;
      break;
    }
  }

  // Keep a tiny amount of bottom breathing room, but never enough to create a
  // second blank A4 page.
  const keepRows = Math.min(24, Math.floor(canvas.height * 0.01));
  const targetHeight = Math.min(canvas.height, lastContentRow + keepRows + 1);

  if (targetHeight >= canvas.height - 4) return canvas;

  const trimmed = document.createElement('canvas');
  trimmed.width = canvas.width;
  trimmed.height = targetHeight;

  const tctx = trimmed.getContext('2d');
  if (!tctx) return canvas;

  tctx.fillStyle = '#ffffff';
  tctx.fillRect(0, 0, trimmed.width, trimmed.height);
  tctx.drawImage(canvas, 0, 0, canvas.width, targetHeight, 0, 0, trimmed.width, trimmed.height);

  return trimmed;
}

function sliceCanvas(source: HTMLCanvasElement, sourceY: number, height: number): HTMLCanvasElement {
  const slice = document.createElement('canvas');
  slice.width = source.width;
  slice.height = height;

  const ctx = slice.getContext('2d');
  if (!ctx) throw new Error('Unable to create PDF page canvas.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, slice.width, slice.height);
  ctx.drawImage(source, 0, sourceY, source.width, height, 0, 0, source.width, height);
  return slice;
}

export async function generateQuotationPdf(html: string, fileName = 'quotation.pdf'): Promise<void> {
  if (!html || !html.trim()) {
    throw new Error('Quotation HTML is empty.');
  }

  // Never render a detached HTML string. html2canvas explicitly requires the
  // target to exist in the current document; otherwise it can throw
  // "Unable to find element in cloned iframe".
  const host = createRenderHost(html);

  try {
    await document.fonts.ready;
    await waitForImages(host);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    if (!document.body.contains(host)) {
      throw new Error('PDF render element is no longer attached to the document.');
    }

    const canvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 10000,
      width: RENDER_WIDTH_PX,
      windowWidth: RENDER_WIDTH_PX,
      scrollX: 0,
      scrollY: 0,
      removeContainer: true,
      onclone: prepareClone,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error('Quotation could not be rendered.');
    }

    const finalCanvas = trimTrailingBlankRows(canvas);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const usableWidth = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
    const usableHeight = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;
    const pixelsPerMm = finalCanvas.width / usableWidth;
    const pageHeightPx = Math.max(1, Math.floor(usableHeight * pixelsPerMm));

    let sourceY = 0;
    let pageIndex = 0;

    while (sourceY < finalCanvas.height) {
      const currentHeight = Math.min(pageHeightPx, finalCanvas.height - sourceY);
      const pageCanvas = sliceCanvas(finalCanvas, sourceY, currentHeight);

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
      fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'quotation';

    pdf.save(safeFileName.toLowerCase().endsWith('.pdf') ? safeFileName : `${safeFileName}.pdf`);
  } finally {
    host.remove();
  }
}
