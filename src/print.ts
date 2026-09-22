
const printStyles = `
  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  @media print {
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 0 !important;
      background: #fff !important;
      overflow: visible !important;
    }

    /* Print only the quotation preview, never the editor. */
    body * {
      visibility: hidden !important;
    }

    #quotation-preview-modal-backdrop,
    #quotation-preview-modal-backdrop * {
      visibility: visible !important;
    }

    #quotation-preview-modal-backdrop {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #fff !important;
      overflow: visible !important;
      display: block !important;
      box-shadow: none !important;
    }

    #quotation-preview-modal-backdrop > div {
      width: 100% !important;
      max-width: none !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      background: #fff !important;
    }

    #quotation-preview-container {
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      background: #fff !important;
    }

    #preview-toolbar {
      display: none !important;
    }

    #live-quotation-render-area {
      display: block !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      background: #fff !important;
    }

    /* Do not stretch/zoom the quotation horizontally. */
    #live-quotation-render-area > div {
      width: 100% !important;
      max-width: 194mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      transform: none !important;
      zoom: 1 !important;
    }

    .quotation-print-sheet {
      width: 100% !important;
      max-width: 194mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      background: #fff !important;
    }

    #quotation-html-rendered-content {
      width: 100% !important;
      max-width: 194mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #fff !important;
      color: #000 !important;
      font-size: 9px !important;
      line-height: 1.18 !important;
    }

    /*
     * Never split a quotation card/section across pages.
     * The browser will move the complete card to the next page.
     */
    #quotation-html-rendered-content > div,
    #quotation-html-rendered-content > section,
    #quotation-html-rendered-content > table,
    #quotation-html-rendered-content .mobile-note-card {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    #quotation-html-rendered-content table {
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: collapse !important;
    }

    #quotation-html-rendered-content tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    #quotation-html-rendered-content th,
    #quotation-html-rendered-content td {
      padding-top: 2px !important;
      padding-bottom: 2px !important;
    }

    #quotation-html-rendered-content p {
      margin-top: 1px !important;
      margin-bottom: 1px !important;
    }

    #quotation-html-rendered-content img {
      max-width: 100% !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    /*
     * Keep browser-generated print headers/footers from getting any
     * document content underneath them. They cannot be disabled by CSS;
     * turn off "Headers and footers" in the browser print dialog.
     */
  }
`;

const styleId = 'quotation-print-styles';

if (!document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = printStyles;
  document.head.appendChild(style);
}

export {};
