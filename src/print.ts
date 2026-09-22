const styleId = 'quotation-print-styles';

const printStyles = `
  @page {
    size: A4 portrait;
    margin: 6mm;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
  }

  #quotation-print-root {
    display: none;
  }

  @media print {
    html,
    body {
      width: 100% !important;
      min-width: 0 !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      overflow: visible !important;
    }

    body > * {
      display: none !important;
    }

    body > #quotation-print-root {
      display: block !important;
      visibility: visible !important;
      position: static !important;
      width: 100% !important;
      max-width: 100% !important;
      min-height: 0 !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      background: #ffffff !important;
      box-sizing: border-box !important;
    }

    #quotation-print-root,
    #quotation-print-root * {
      visibility: visible !important;
    }

    #quotation-print-content {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 auto !important;
      padding: 0 !important;
      overflow: visible !important;
      box-sizing: border-box !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-size: 9px !important;
      line-height: 1.16 !important;
    }

    #quotation-print-content table {
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: collapse !important;
      table-layout: auto !important;
    }

    #quotation-print-content th,
    #quotation-print-content td {
      padding-top: 2px !important;
      padding-bottom: 2px !important;
    }

    #quotation-print-content p {
      margin-top: 1px !important;
      margin-bottom: 1px !important;
    }

    #quotation-print-content img {
      max-width: 100% !important;
      height: auto !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    #quotation-print-content tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    #quotation-print-content table,
    #quotation-print-content .mobile-note-card {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    #quotation-print-content * {
      box-sizing: border-box !important;
    }
  }
`;

function ensurePrintStyles() {
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = printStyles;
  document.head.appendChild(style);
}

function cleanupPrintRoot(root: HTMLElement) {
  root.remove();
  document.body.removeAttribute('data-quotation-printing');
}

function printQuotation() {
  ensurePrintStyles();

  const source = document.getElementById('quotation-html-rendered-content');

  if (!source) {
    console.warn(
      'Quotation print content was not found. Please open the quotation preview first.',
    );
    return;
  }

  const existing = document.getElementById('quotation-print-root');
  if (existing) existing.remove();

  const root = document.createElement('div');
  root.id = 'quotation-print-root';
  root.setAttribute('aria-hidden', 'true');

  const content = document.createElement('div');
  content.id = 'quotation-print-content';
  content.innerHTML = source.innerHTML;

  root.appendChild(content);
  document.body.appendChild(root);
  document.body.setAttribute('data-quotation-printing', 'true');

  const oldTitle = document.title;
  document.title = 'Quotation';

  const finish = () => {
    cleanupPrintRoot(root);
    document.title = oldTitle;
    window.removeEventListener('afterprint', finish);
  };

  window.addEventListener('afterprint', finish);

  window.setTimeout(() => {
    originalPrint();
  }, 100);
}

const originalPrint = window.print.bind(window);

ensurePrintStyles();

window.print = () => {
  printQuotation();
};

export {};
