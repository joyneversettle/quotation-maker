import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 4;
const RENDER_WIDTH_PX = 794;

const COLOR_FUNCTION_RE = /(?:oklch|oklab|color-mix|color)\(/i;
const COLOR_FUNCTION_NAMES = ['oklch(', 'oklab(', 'color-mix(', 'color('];

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

  document.body.appendChild(host);
  return host;
}

function resolveColor(value: string): string | null {
  if (!COLOR_FUNCTION_RE.test(value)) return value;

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
    return result && !COLOR_FUNCTION_RE.test(result) ? result : null;
  } finally {
    probe.remove();
  }
}

function replaceCssColors(value: string): string {
  let output = '';
  let cursor = 0;

  while (cursor < value.length) {
    const lower = value.slice(cursor).toLowerCase();
    const matches = COLOR_FUNCTION_NAMES
      .map((name) => ({ name, index: lower.indexOf(name) }))
      .filter((item) => item.index >= 0)
      .sort((a, b) => a.index - b.index);

    if (!matches.length) {
      output += value.slice(cursor);
      break;
    }

    const start = cursor + matches[0].index;
    output += value.slice(cursor, start);

    let depth = 0;
    let end = start;
    for (; end < value.length; end += 1) {
      const char = value[end];
      if (char === '(') depth += 1;
      if (char === ')') {
        depth -= 1;
        if (depth === 0) {
          end += 1;
          break;
        }
      }
    }

    const token = value.slice(start, end);
    output += resolveColor(token) || '#000000';
    cursor = end;
  }

  return output;
}

function sanitizeSvg(root: HTMLElement): void {
  root.querySelectorAll<SVGElement>('svg').forEach((svg) => {
    const nodes = [svg, ...Array.from(svg.querySelectorAll<SVGElement>('*'))];

    nodes.forEach((node) => {
      ['fill', 'stroke', 'color', 'stop-color', 'flood-color', 'lighting-color'].forEach((attribute) => {
        const value = node.getAttribute(attribute);
        if (!value || !COLOR_FUNCTION_RE.test(value)) return;
        const resolved = resolveColor(value);
        if (resolved) node.setAttribute(attribute, resolved);
      });

      const style = node.getAttribute('style');
      if (style && COLOR_FUNCTION_RE.test(style)) {
        node.setAttribute('style', replaceCssColors(style));
      }
    });
  });
}

function inlineComputedStyles(root: HTMLElement): void {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];

  elements.forEach((element) => {
    const computed = getComputedStyle(element);

    for (let index = 0; index < computed.length; index += 1) {
      const property = computed.item(index);
      if (!property) continue;

      let value = computed.getPropertyValue(property);
      if (!value) continue;

      if (COLOR_FUNCTION_RE.test(value)) {
        const resolved = resolveColor(value);
        if (resolved) value = resolved;
      }

      try {
        element.style.setProperty(property, value);
      } catch {
        // Ignore browser-only read-only computed properties.
      }
    }

    // Do not allow the PDF renderer to inherit the application's responsive
    // mobile typography or transformed preview state.
    if (element === root) {
      element.style.setProperty('font-family', 'Inter, Arial, Helvetica, sans-serif');
      element.style.setProperty('font-size', '16px');
      element.style.setProperty('line-height', 'normal');
      element.style.setProperty('letter-spacing', 'normal');
      element.style.setProperty('word-spacing', 'normal');
      element.style.setProperty('transform', 'none');
    }

    const inlineCss = element.getAttribute('style');
    if (inlineCss && COLOR_FUNCTION_RE.test(inlineCss)) {
      element.setAttribute('style', replaceCssColors(inlineCss));
    }
  });
}

function removeStylesheetsFromClone(documentClone: Document): void {
  documentClone
    .querySelectorAll('style, link[rel="stylesheet"]')
    .forEach((node) => node.remove());
}

function prepareClone(documentClone: Document): void {
  const root = documentClone.getElementById('quotation-pdf-render-root') as HTMLElement | null;
  if (!root) return;

  root.style.setProperty('width', `${RENDER_WIDTH_PX}px`, 'important');
  root.style.setProperty('max-width', `${RENDER_WIDTH_PX}px`, 'important');
  root.style.setProperty('min-width', `${RENDER_WIDTH_PX}px`, 'important');
  root.style.setProperty('margin', '0', 'important');
  root.style.setProperty('padding', '0', 'important');
  root.style.setProperty('background', '#ffffff', 'important');
  root.style.setProperty('visibility', 'visible', 'important');
  root.style.setProperty('opacity', '1', 'important');
  root.style.setProperty('transform', 'none', 'important');

  const template = root.querySelector<HTMLElement>('.quotation-template');
  if (template) {
    template.style.setProperty('width', '100%', 'important');
    template.style.setProperty('max-width', '100%', 'important');
    template.style.setProperty('margin-left', '0', 'important');
    template.style.setProperty('margin-right', '0', 'important');
    template.style.setProperty('transform', 'none', 'important');
  }

  inlineComputedStyles(root);
  sanitizeSvg(root);
  removeStylesheetsFromClone(documentClone);

  root.style.setProperty('width', `${RENDER_WIDTH_PX}px`, 'important');
  root.style.setProperty('background', '#ffffff', 'important');
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));

  return Promise.all(
    images.map(
      (image) =>
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
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas;

  const step = Math.max(1, Math.floor(canvas.width / 500));
  let lastContentRow = canvas.height - 1;

  for (let y = canvas.height - 1; y >= 0; y -= 1) {
    let content = false;

    for (let x = 0; x < canvas.width; x += step) {
      const pixel = context.getImageData(x, y, 1, 1).data;
      if (pixel[3] > 5 && (pixel[0] < 248 || pixel[1] < 248 || pixel[2] < 248)) {
        content = true;
        break;
      }
    }

    if (content) {
      lastContentRow = y;
      break;
    }
  }

  const bottomPadding = Math.min(20, Math.floor(canvas.height * 0.008));
  const targetHeight = Math.min(canvas.height, lastContentRow + bottomPadding + 1);

  if (targetHeight >= canvas.height - 4) return canvas;

  const trimmed = document.createElement('canvas');
  trimmed.width = canvas.width;
  trimmed.height = targetHeight;

  const trimmedContext = trimmed.getContext('2d');
  if (!trimmedContext) return canvas;

  trimmedContext.fillStyle = '#ffffff';
  trimmedContext.fillRect(0, 0, trimmed.width, trimmed.height);
  trimmedContext.drawImage(canvas, 0, 0, canvas.width, targetHeight, 0, 0, trimmed.width, trimmed.height);

  return trimmed;
}

function sliceCanvas(source: HTMLCanvasElement, sourceY: number, height: number): HTMLCanvasElement {
  const slice = document.createElement('canvas');
  slice.width = source.width;
  slice.height = height;

  const context = slice.getContext('2d');
  if (!context) throw new Error('Unable to create PDF page canvas.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, slice.width, slice.height);
  context.drawImage(source, 0, sourceY, source.width, height, 0, 0, source.width, height);
  return slice;
}

/**
 * Build page boundaries from the real quotation sections.
 * A section is moved to the next page when it would otherwise be cut by the
 * A4 boundary. This prevents payment/terms/signature cards from being sliced.
 */
function getSectionAwarePageRanges(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  pageHeightPx: number
): Array<{ start: number; end: number }> {
  const template = host.querySelector<HTMLElement>('.quotation-template');
  if (!template) {
    return [{ start: 0, end: canvas.height }];
  }

  const hostRect = host.getBoundingClientRect();
  const templateRect = template.getBoundingClientRect();
  const scale = canvas.width / Math.max(1, hostRect.width);
  const templateTop = templateRect.top - hostRect.top;
  const sections = Array.from(template.children) as HTMLElement[];

  const boundaries = sections
    .map((section) => {
      const rect = section.getBoundingClientRect();
      return {
        start: Math.max(0, Math.round((rect.top - hostRect.top) * scale)),
        end: Math.min(canvas.height, Math.round((rect.bottom - hostRect.top) * scale)),
      };
    })
    .filter((section) => section.end > section.start && section.end > templateTop * scale)
    .sort((a, b) => a.start - b.start);

  if (!boundaries.length) {
    return [{ start: 0, end: canvas.height }];
  }

  const ranges: Array<{ start: number; end: number }> = [];
  let pageStart = 0;
  let sectionIndex = 0;

  while (pageStart < canvas.height && sectionIndex < boundaries.length) {
    const pageLimit = Math.min(canvas.height, pageStart + pageHeightPx);
    let pageEnd = pageLimit;
    let moved = false;

    for (let index = sectionIndex; index < boundaries.length; index += 1) {
      const section = boundaries[index];

      if (section.end <= pageStart) {
        sectionIndex = index + 1;
        continue;
      }

      if (section.end <= pageLimit) {
        sectionIndex = index + 1;
        continue;
      }

      // This section crosses the A4 boundary. Move it as a whole when there
      // is already content on the current page.
      if (section.start > pageStart + 4) {
        pageEnd = section.start;
        moved = true;
      }
      break;
    }

    if (pageEnd <= pageStart) {
      pageEnd = pageLimit;
    }

    ranges.push({ start: pageStart, end: Math.min(pageEnd, canvas.height) });
    pageStart = Math.min(pageEnd, canvas.height);

    if (!moved && pageStart < canvas.height) {
      // The section itself is taller than a page; allow it to split rather
      // than looping forever.
      pageStart = pageLimit;
      while (
        sectionIndex < boundaries.length &&
        boundaries[sectionIndex].end <= pageStart
      ) {
        sectionIndex += 1;
      }
    }
  }

  if (pageStart < canvas.height) {
    ranges.push({ start: pageStart, end: canvas.height });
  }

  return ranges.filter((range) => range.end - range.start > 4);
}

export async function generateQuotationPdf(
  html: string,
  fileName = 'quotation.pdf'
): Promise<void> {
  if (!html || !html.trim()) {
    throw new Error('Quotation HTML is empty.');
  }

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
      scale: 3,
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
      foreignObjectRendering: false,
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
    const pageHeightPx = Math.floor(usableHeight * pixelsPerMm);
    const ranges = getSectionAwarePageRanges(host, finalCanvas, pageHeightPx);

    ranges.forEach((range, index) => {
      if (index > 0) pdf.addPage();

      const pageCanvas = sliceCanvas(
        finalCanvas,
        range.start,
        range.end - range.start
      );

      pdf.addImage(
        pageCanvas,
        'PNG',
        PDF_MARGIN_MM,
        PDF_MARGIN_MM,
        usableWidth,
        (range.end - range.start) / pixelsPerMm,
        undefined,
        'FAST'
      );
    });

    const safeFileName =
      fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'quotation';

    pdf.save(
      safeFileName.toLowerCase().endsWith('.pdf')
        ? safeFileName
        : `${safeFileName}.pdf`
    );
  } finally {
    host.remove();
  }
}
