/* Professional quotation PDF printing.
   This file intentionally affects print output only. */

@page {
  size: A4 portrait;
  margin: 8mm;
}

@media print {
  html, body {
    width: 100% !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
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
    display: block !important;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    background: #fff !important;
    backdrop-filter: none !important;
  }

  #quotation-preview-modal-backdrop > div {
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    overflow: visible !important;
  }

  #quotation-preview-container {
    display: block !important;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    overflow: visible !important;
  }

  #preview-toolbar {
    display: none !important;
  }

  #live-quotation-render-area {
    display: block !important;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    background: #fff !important;
  }

  #live-quotation-render-area > div {
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    transform: none !important;
    transition: none !important;
  }

  .quotation-print-sheet,
  #quotation-html-rendered-content {
    display: block !important;
    width: 100% !important;
    max-width: 194mm !important;
    margin: 0 auto !important;
    padding: 0 !important;
    background: #fff !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  #quotation-html-rendered-content img {
    max-width: 100% !important;
  }

  #quotation-html-rendered-content table {
    max-width: 100% !important;
    page-break-inside: auto !important;
  }

  #quotation-html-rendered-content tr,
  #quotation-html-rendered-content img {
    page-break-inside: avoid !important;
  }

  #quotation-html-rendered-content h1,
  #quotation-html-rendered-content h2,
  #quotation-html-rendered-content h3 {
    page-break-after: avoid !important;
  }

  /* Compact only the print copy so standard quotations fit on one A4 sheet. */
  #quotation-html-rendered-content {
    font-size: 9px !important;
    line-height: 1.18 !important;
  }

  #quotation-html-rendered-content table {
    font-size: 8px !important;
  }

  #quotation-html-rendered-content th,
  #quotation-html-rendered-content td {
    padding-top: 3px !important;
    padding-bottom: 3px !important;
    line-height: 1.15 !important;
  }

  #quotation-html-rendered-content p {
    margin-top: 2px !important;
    margin-bottom: 2px !important;
  }
}
