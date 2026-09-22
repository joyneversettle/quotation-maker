const printStyles = `
  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  @media print {
    html,
    body {
      width: 100% !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }

    body * {
      visibility: hidden !important;
    }

    #quotation-preview-modal-backdrop,
    #quotation-preview-modal-backdrop * {
      visibility: visible !important;
    }

    #quotation-preview-modal-backdrop {
      position: static !important;
      inset: auto !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #ffffff !important;
      overflow: visible !important;
      display: block !important;
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
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      background: #ffffff !important;
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
      overflow: visible !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #ffffff !important;
    }

    #live-quotation-render-area > div {
      width: 100% !important;
      max-width: 194mm !important;
      margin: 0 auto !important;
      transform: none !important;
      transition: none !important;
    }

    .quotation-print-sheet {
      width: 100% !important;
      max-width: 194mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      background: #ffffff !important;
    }

    #quotation-html-rendered-content {
      width: 100% !important;
      max-width: 194mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #ffffff !important;
      font-size: 9px !important;
      line-height: 1.18 !important;
      color: #000000 !important;
    }

    #quotation-html-rendered-content table {
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: collapse !important;
    }

    #quotation-html-rendered-content th,
    #quotation-html-rendered-content td {
      padding-top: 3px !important;
      padding-bottom: 3px !important;
    }

    #quotation-html-rendered-content p {
      margin-top: 2px !important;
      margin-bottom: 2px !important;
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
    #quotation-html-rendered-content div {
      break-inside: avoid !important;
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
