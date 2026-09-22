const printStyles = `
  @page {
    size: A4 portrait;
    margin: 5mm;
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

    body * {
      visibility: hidden !important;
    }

    #quotation-preview-modal-backdrop,
    #quotation-preview-modal-backdrop * {
      visibility: visible !important;
    }

    /*
     * Keep the quotation at the very top of the printed page.
     * The previous version used position: static, which caused the
     * hidden editor DOM before the modal to reserve several blank pages.
     */
    #quotation-preview-modal-backdrop {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: auto !important;
      bottom: auto !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #ffffff !important;
      overflow: visible !important;
      display: block !important;
      z-index: 999999 !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    #quotation-preview-modal-backdrop > div {
      width: 100% !important;
      max-width: none !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      background: #ffffff !important;
    }

    #quotation-preview-container {
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      background: #ffffff !important;
    }

    #preview-toolbar {
      display: none !important;
      visibility: hidden !important;
    }

    #live-quotation-render-area {
      display: block !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #ffffff !important;
    }

    /*
     * The quotation is slightly taller than one A4 page in its normal
     * screen size. Use print-only zoom so the complete quotation fits
     * on one A4 page without changing the on-screen/email design.
     */
    #live-quotation-render-area > div {
      width: 125% !important;
      max-width: none !important;
      margin: 0 0 0 -12.5% !important;
      transform: none !important;
      transition: none !important;
      zoom: 0.80 !important;
    }

    .quotation-print-sheet {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      background: #ffffff !important;
    }

    #quotation-html-rendered-content {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      font-size: 9px !important;
      line-height: 1.16 !important;
      color: #000000 !important;
    }

    #quotation-html-rendered-content table {
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: collapse !important;
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

    #quotation-html-rendered-content tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    #quotation-html-rendered-content table,
    #quotation-html-rendered-content .mobile-note-card {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
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
