import { QuotationData } from '../types/quotation';
import { formatINR, formatDateDisplay } from './calculations';
import { resolveQrImageSrc, buildUpiPaymentUri } from './qrGenerator';

/**
 * Dedicated EMAIL_RENDERER:
 * Produces bulletproof, responsive, email-safe HTML compatible with
 * Gmail (web & mobile app), Microsoft Outlook, Apple Mail, and Android Mail.
 *
 * Requirements enforced:
 * 1. Mobile responsive layout tested for 360px, 390px, and 412px with zero horizontal scroll.
 * 2. All text black (#000000) with zero blue underlines or link styles on phone/email/web.
 * 3. Preserved cards, borders, and visual structure.
 * 4. GST Hide/Unhide support (completely removes Taxable Amount, CGST, and SGST when hidden).
 * 5. Promo banner support (1200x300px recommended banner).
 * 6. Inter / sans-serif only throughout.
 * 7. Clean footer with signature, authorized signatory, thank-you message, and contact details,
 *    with "SHANGRILAS BEACH RESORT" text removed from above the signature on the left.
 */
export function generateEmailHtml(data: QuotationData, qrDataUrl?: string): string {
  const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const borderGray = '#CBD5E1';
  const lightBg = '#F8FAFC';
  const tableHeaderBg = '#0B1B3D'; // Solid executive navy
  const textBlack = '#000000';

  // Format Dates
  const formattedQuotationDate = formatDateDisplay(data.quotationDate);
  const formattedValidUntil = formatDateDisplay(data.validUntil);
  const formattedCheckIn = formatDateDisplay(data.stay.checkIn);
  const formattedCheckOut = formatDateDisplay(data.stay.checkOut);

  // Check if any room has discount to decide whether DISC column has values
  const hasRoomDiscount = data.rooms.some(r => r.discountValue > 0);

  // Build Room Rows
  const roomRowsHtml = data.rooms.map((room, idx) => {
    const rowBg = idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
    const discountStr = room.discountValue > 0
      ? (room.discountType === 'PERCENT' ? `${room.discountValue}%` : formatINR(room.discountValue))
      : '-';

    return `
      <tr style="background-color: ${rowBg};">
        <td style="padding: 7px 6px; border-bottom: 1px solid ${borderGray}; font-size: 11px; font-weight: 700; color: ${textBlack}; text-align: left; line-height: 1.3;">
          ${room.roomType || 'Room'}
        </td>
        <td style="padding: 7px 3px; border-bottom: 1px solid ${borderGray}; font-size: 11px; font-weight: 700; color: ${textBlack}; text-align: center;">
          ${room.mealPlan}
        </td>
        <td style="padding: 7px 3px; border-bottom: 1px solid ${borderGray}; font-size: 11px; color: ${textBlack}; text-align: center; font-weight: 600;">
          ${room.roomsCount}
        </td>
        <td style="padding: 7px 3px; border-bottom: 1px solid ${borderGray}; font-size: 11px; color: ${textBlack}; text-align: center; font-weight: 600;">
          ${room.nightsCount}
        </td>
        <td style="padding: 7px 4px; border-bottom: 1px solid ${borderGray}; font-size: 11px; color: ${textBlack}; text-align: right; white-space: nowrap;">
          ${formatINR(room.ratePerNight)}
        </td>
        <td style="padding: 7px 3px; border-bottom: 1px solid ${borderGray}; font-size: 10px; color: ${textBlack}; text-align: center;">
          ${discountStr}
        </td>
        <td style="padding: 7px 6px; border-bottom: 1px solid ${borderGray}; font-size: 11px; font-weight: 700; color: ${textBlack}; text-align: right; white-space: nowrap;">
          ${formatINR(room.calculatedAmount)}
        </td>
      </tr>
    `;
  }).join('');

  // Extra Services Rows
  const extraServicesHtml = data.extraServices && data.extraServices.length > 0 ? `
    <!-- Extra Services Table -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px; border: 1px solid ${borderGray}; border-radius: 6px; overflow: hidden; table-layout: fixed;" class="extra-services-table">
      <thead>
        <tr style="background-color: ${tableHeaderBg}; color: #FFFFFF;">
          <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; width: 45%;">Extra Service / Experience</th>
          <th style="padding: 6px 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 15%;">Qty</th>
          <th style="padding: 6px 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 20%;">Rate</th>
          <th style="padding: 6px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 20%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.extraServices.map((service, idx) => {
          const rowBg = idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
          return `
            <tr style="background-color: ${rowBg};">
              <td style="padding: 6px 8px; border-bottom: 1px solid ${borderGray}; font-size: 11px; color: ${textBlack}; font-weight: 600;">${service.serviceName}</td>
              <td style="padding: 6px 4px; border-bottom: 1px solid ${borderGray}; font-size: 11px; color: ${textBlack}; text-align: center;">${service.quantity}</td>
              <td style="padding: 6px 6px; border-bottom: 1px solid ${borderGray}; font-size: 11px; color: ${textBlack}; text-align: right; white-space: nowrap;">${formatINR(service.rate)}</td>
              <td style="padding: 6px 8px; border-bottom: 1px solid ${borderGray}; font-size: 11px; font-weight: 700; color: ${textBlack}; text-align: right; white-space: nowrap;">${formatINR(service.calculatedAmount)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  ` : '';

  // Booking terms
  const termsHtml = data.terms && data.terms.length > 0 ? data.terms.map((term, i) => `
    <tr style="vertical-align: top;">
      <td style="padding: 2px 4px 2px 0; font-size: 10px; color: ${textBlack}; font-weight: 700; width: 16px;">${i + 1}.</td>
      <td style="padding: 2px 0; font-size: 10px; color: ${textBlack}; line-height: 1.4;">${term.text}</td>
    </tr>
  `).join('') : '';

  // Promo Banner in Email (if uploaded / enabled)
  const promoBannerUrl = data.bannerImageUrl || data.hotel.bannerImageUrl;
  const showPromoBanner = Boolean(promoBannerUrl && (data as any).promoBannerShowInEmail !== false);
  const promoBannerHtml = showPromoBanner ? `
    <!-- Promo Banner (1200x300 recommended) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px;">
      <tr>
        <td style="text-align: center;">
          <img src="${promoBannerUrl}" alt="Resort Promotion" width="100%" style="display: block; width: 100%; max-width: 680px; height: auto; border-radius: 6px; border: 1px solid ${borderGray}; margin: 0 auto;" />
        </td>
      </tr>
    </table>
  ` : '';

  // QR Element for Email
  const qrImageSrc = resolveQrImageSrc(data, true, qrDataUrl);
  const upiDeepLink = buildUpiPaymentUri(
    data.payment?.upiId || '',
    data.hotel?.name || 'Hotel',
    data.calculations?.payableAdvance || 0,
    data.payment?.note || 'Room Quotation Advance'
  );

  const qrBlockHtml = qrImageSrc ? `
    <img src="${qrImageSrc}" alt="UPI QR Code" width="110" height="110" style="display: block; width: 110px; height: 110px; border: 1px solid ${borderGray}; border-radius: 4px; margin: 0 auto 4px auto; background-color: #FFFFFF;" />
    ${upiDeepLink ? `
      <div style="margin: 2px 0;">
        <a href="${upiDeepLink}" style="display: inline-block; font-size: 9px; font-weight: 700; color: #000000 !important; text-decoration: none !important; padding: 2px 8px; background-color: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 3px;">Open UPI App &rarr;</a>
      </div>
    ` : ''}
  ` : `
    <div style="width: 90px; height: 90px; line-height: 90px; background-color: #F1F5F9; border: 1px dashed ${borderGray}; text-align: center; font-size: 10px; color: #000000; margin: 0 auto 4px auto; border-radius: 4px;">UPI QR</div>
  `;

  // GST & Tax Breakdown Rows (Completely removed when GST is hidden!)
  const isGstEnabled = Boolean(data.taxes && data.taxes.enableGst);
  const isOtherTaxEnabled = Boolean(data.taxes && data.taxes.enableOtherTax && data.calculations.otherTaxAmount > 0);

  const gstBreakdownRowsHtml = isGstEnabled ? `
    <tr>
      <td style="color: ${textBlack}; font-weight: 500;">Taxable Amount:</td>
      <td style="text-align: right; color: ${textBlack}; font-weight: 600;">${formatINR(data.calculations.taxableAmount)}</td>
    </tr>
    <tr>
      <td style="color: ${textBlack};">CGST (${data.taxes.cgstPercent}%):</td>
      <td style="text-align: right; color: ${textBlack}; font-weight: 600;">${formatINR(data.calculations.cgstAmount)}</td>
    </tr>
    <tr>
      <td style="color: ${textBlack};">SGST (${data.taxes.sgstPercent}%):</td>
      <td style="text-align: right; color: ${textBlack}; font-weight: 600;">${formatINR(data.calculations.sgstAmount)}</td>
    </tr>
  ` : '';

  const otherTaxRowHtml = isOtherTaxEnabled ? `
    <tr>
      <td style="color: ${textBlack};">${data.taxes.otherTaxName || 'Other Tax'} (${data.taxes.otherTaxPercent}%):</td>
      <td style="text-align: right; color: ${textBlack}; font-weight: 600;">${formatINR(data.calculations.otherTaxAmount)}</td>
    </tr>
  ` : '';

  // Clean website URL with http fallback for links
  const webHref = data.hotel.website
    ? (data.hotel.website.startsWith('http') ? data.hotel.website : `https://${data.hotel.website}`)
    : '#';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>Room Quotation - ${data.hotel.name}</title>
  <style>
    /* Inter font and zero link styling */
    body, table, td, p, a, div, span {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    a, a:link, a:visited, a:hover, a:active {
      color: #000000 !important;
      text-decoration: none !important;
      font-weight: inherit !important;
    }
    span.appleLinks a, .appleLinks a, a[x-apple-data-detectors] {
      color: #000000 !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    u + #body a {
      color: #000000 !important;
      text-decoration: none !important;
    }
    #MessageViewBody a {
      color: #000000 !important;
      text-decoration: none !important;
    }

    /* Mobile Responsive Fix - preserve existing quotation design */
    @media only screen and (max-width: 520px) {
      /* Equal mobile page margins and identical card widths */
      .email-wrapper {
        width: 100% !important;
        max-width: 100% !important;
        padding: 6px !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
      }

      .email-wrapper > tbody > tr > td {
        padding: 0 !important;
      }

      .email-card {
        width: 100% !important;
        max-width: 100% !important;
        padding: 10px !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
      }

      .full-mobile-card,
      .full-mobile-card > tbody,
      .full-mobile-card > tbody > tr,
      .full-mobile-card > tbody > tr > td,
      .guest-stay-card,
      .extra-services-table {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      .full-mobile-card,
      .extra-services-table {
        table-layout: fixed !important;
      }

      /* Header stays compact and aligned side-by-side */
      .header-col-left {
        display: table-cell !important;
        width: 62% !important;
        padding-right: 6px !important;
        vertical-align: top !important;
        box-sizing: border-box !important;
      }

      .header-col-right {
        display: table-cell !important;
        width: 38% !important;
        min-width: 0 !important;
        max-width: 38% !important;
        padding: 0 !important;
        text-align: right !important;
        vertical-align: top !important;
        box-sizing: border-box !important;
      }

      .hotel-header-title {
        display: block !important;
        font-size: 11px !important;
        line-height: 1.05 !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
      }

      .header-col-left > div:nth-of-type(1) {
        font-size: 7px !important;
        line-height: 1.1 !important;
        letter-spacing: 0.2px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
      }

      .header-col-left > div:nth-of-type(2) {
        font-size: 7.5px !important;
        line-height: 1.2 !important;
        margin-top: 3px !important;
      }

      .header-col-left > div {
        overflow-wrap: normal !important;
        word-break: normal !important;
      }

      .meta-box-table {
        width: 100% !important;
        max-width: 100% !important;
        padding: 5px 5px !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }

      .meta-box-td {
        text-align: center !important;
      }

      .meta-box-table div {
        line-height: 1.05 !important;
      }

      /* Prepared For + Stay Details are equal cards */
      .grid-col {
        display: table-cell !important;
        width: 50% !important;
        padding: 0 3px !important;
        margin: 0 !important;
        vertical-align: top !important;
        box-sizing: border-box !important;
      }

      .grid-col:first-child {
        padding-left: 0 !important;
      }

      .grid-col:last-child {
        padding-right: 0 !important;
      }

      .guest-stay-card {
        min-height: 170px !important;
        height: 170px !important;
        padding: 7px !important;
        box-sizing: border-box !important;
      }

      .guest-stay-card table {
        width: 100% !important;
        table-layout: fixed !important;
      }

      .guest-stay-card td {
        font-size: 8.5px !important;
        line-height: 1.25 !important;
      }

      .guest-stay-card td:first-child {
        white-space: nowrap !important;
      }

      .guest-stay-card td:nth-child(2) {
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: clip !important;
      }

      /* Accommodation table remains one compact row */
      .tariff-table,
      .extra-services-table {
        display: table !important;
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        table-layout: fixed !important;
      }

      .tariff-table th,
      .tariff-table td {
        font-size: 8px !important;
        padding: 5px 2px !important;
        line-height: 1.15 !important;
        box-sizing: border-box !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: clip !important;
      }

      .tariff-table th {
        font-size: 7.5px !important;
      }

      /* All financial/payment cards occupy exactly the same width */
      .full-mobile-card {
        display: table !important;
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        table-layout: fixed !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }

      .full-mobile-card td {
        box-sizing: border-box !important;
        max-width: 100% !important;
      }

      /* Financial rows stay label/value on one line */
      .full-mobile-card table {
        width: 100% !important;
        table-layout: fixed !important;
      }

      .full-mobile-card table td {
        font-size: 9px !important;
        line-height: 1.3 !important;
      }

      /* Payment section: bank text remains compact, QR stays centered */
      .payment-col-bank {
        display: table-cell !important;
        width: 68% !important;
        padding-right: 5px !important;
        vertical-align: top !important;
        box-sizing: border-box !important;
      }

      .payment-col-qr {
        display: table-cell !important;
        width: 32% !important;
        max-width: 32% !important;
        padding: 0 !important;
        text-align: center !important;
        vertical-align: top !important;
        box-sizing: border-box !important;
      }

      .payment-col-bank > div {
        font-size: 8px !important;
        line-height: 1.35 !important;
        white-space: nowrap !important;
      }

      .payment-col-qr > table {
        width: 105px !important;
        max-width: 105px !important;
        margin: 0 auto !important;
      }

      /* Separate note card */
      .mobile-note-card {
        width: 100% !important;
        max-width: 100% !important;
        margin: 5px 0 0 0 !important;
        padding: 6px 7px !important;
        box-sizing: border-box !important;
        font-size: 8px !important;
        line-height: 1.25 !important;
      }

      /* Footer: compact, clean and aligned */
      .footer-col-left {
        display: table-cell !important;
        width: 45% !important;
        padding-right: 5px !important;
        vertical-align: bottom !important;
      }

      .footer-col-right {
        display: table-cell !important;
        width: 55% !important;
        padding-left: 5px !important;
        vertical-align: bottom !important;
        text-align: right !important;
      }

      .footer-col-right > div:first-child {
        font-size: 8px !important;
        line-height: 1.15 !important;
        margin-bottom: 2px !important;
        text-align: right !important;
      }

      .footer-col-right > div:last-child {
        font-size: 7px !important;
        line-height: 1.2 !important;
        text-align: right !important;
        white-space: nowrap !important;
      }
    }
  </style>
</head>
<body id="body" style="margin: 0; padding: 10px 0; background-color: #F1F5F9; font-family: ${fontFamily}; color: ${textBlack};">
  <center>
    <!-- Outer Wrapper -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-wrapper" style="max-width: 680px; width: 100%; margin: 0 auto; background-color: transparent; font-family: ${fontFamily};">
      <tr>
        <td style="padding: 0 4px;">

          <!-- Main White Container Card -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card" style="width: 100%; background-color: #FFFFFF; border: 1px solid ${borderGray}; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); font-family: ${fontFamily}; padding: 20px 18px 18px 18px; box-sizing: border-box;">
            <tr>
              <td>

                ${promoBannerHtml}

                <!-- Hotel Header & Quotation Meta Table -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 2px solid ${textBlack}; padding-bottom: 14px; margin-bottom: 14px;">
                  <tr>
                    <!-- Hotel Details Column -->
                    <td class="header-col-left" style="vertical-align: top; padding-right: 12px;">
                      <div class="hotel-header-title" style="font-size: 18px; font-weight: 800; color: ${textBlack}; text-transform: uppercase; letter-spacing: -0.3px; line-height: 1.2;">
                        ${data.hotel.name}
                      </div>
                      ${data.hotel.tagline ? `
                        <div style="font-size: 10px; font-weight: 700; color: ${textBlack}; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 2px;">
                          ${data.hotel.tagline}
                        </div>
                      ` : ''}
                      <div style="font-size: 10px; color: ${textBlack}; margin-top: 6px; line-height: 1.45;">
                        ${data.hotel.address}<br>
                        Phone: <a href="tel:${data.hotel.phone}" style="color: ${textBlack} !important; text-decoration: none !important; font-weight: 700;">${data.hotel.phone}</a> &bull; Email: <a href="mailto:${data.hotel.email}" style="color: ${textBlack} !important; text-decoration: none !important; font-weight: 700;">${data.hotel.email}</a><br>
                        ${isGstEnabled && data.hotel.gstin ? `GSTIN: <strong style="color: ${textBlack};">${data.hotel.gstin}</strong> &bull; ` : ''}Web: <a href="${webHref}" target="_blank" style="color: ${textBlack} !important; text-decoration: none !important; font-weight: 700;">${data.hotel.website}</a>
                      </div>
                    </td>

                    <!-- Meta Box Column -->
                    <td class="header-col-right" style="vertical-align: top; text-align: right; width: 36%; min-width: 150px; max-width: 210px;">
                      <table cellpadding="0" cellspacing="0" border="0" class="meta-box-table" style="background-color: ${lightBg}; border: 1px solid ${borderGray}; border-radius: 6px; padding: 8px 10px; width: 100%; text-align: right; box-sizing: border-box;">
                        <tr>
                          <td class="meta-box-td">
                            <div style="font-size: 9px; font-weight: 800; color: ${textBlack}; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 2px;">
                              ROOM QUOTATION
                            </div>
                            <div style="font-size: 13px; font-weight: 800; color: ${textBlack}; font-family: ${fontFamily}; margin-top: 2px;">
                              ${data.quotationNumber}
                            </div>
                            <div style="font-size: 10px; color: ${textBlack}; margin-top: 3px; line-height: 1.35;">
                              Date: <strong style="color: ${textBlack};">${formattedQuotationDate}</strong><br>
                              Valid Until: <strong style="color: ${textBlack};">${formattedValidUntil}</strong>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Guest and Stay Grid Table -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px;">
                  <tr>
                    <!-- Guest Details -->
                    <td class="grid-col" style="vertical-align: top; width: 50%; padding-right: 6px; box-sizing: border-box;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="guest-stay-card" style="width: 100%; max-width: 100%; background-color: ${lightBg}; border: 1px solid ${borderGray}; border-radius: 6px; padding: 10px; box-sizing: border-box; height: 100%;">
                        <tr>
                          <td style="border-bottom: 1px solid ${borderGray}; padding-bottom: 4px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="font-size: 9px; font-weight: 800; color: ${textBlack}; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;">PREPARED FOR</td>
                                <td style="text-align: right; padding-left: 6px; white-space: nowrap;">
                                  <span style="background-color: #E2E8F0; color: ${textBlack}; font-size: 8px; font-weight: 700; padding: 1px 5px; border-radius: 3px;">${data.guest.guestType}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 6px;">
                            <div style="font-size: 13px; font-weight: 800; color: ${textBlack};">${data.guest.name}</div>
                            ${data.guest.contactPerson && data.guest.contactPerson !== data.guest.name ? `
                              <div style="font-size: 10px; color: ${textBlack}; font-weight: 600;">Attn: ${data.guest.contactPerson}</div>
                            ` : ''}
                            <div style="font-size: 10px; color: ${textBlack}; margin-top: 3px; line-height: 1.4;">
                              Phone: <a href="tel:${data.guest.phone}" style="color: ${textBlack} !important; text-decoration: none !important; font-weight: 700;">${data.guest.phone}</a><br>
                              Email: <a href="mailto:${data.guest.email}" style="color: ${textBlack} !important; text-decoration: none !important; font-weight: 600;">${data.guest.email}</a><br>
                              ${isGstEnabled && data.guest.gstin ? `GSTIN: <strong style="color: ${textBlack};">${data.guest.gstin}</strong><br>` : ''}
                              ${data.guest.address ? `${data.guest.address}<br>` : ''}
                              ${data.guest.travelAgency ? `<strong style="color: ${textBlack};">Agency: ${data.guest.travelAgency}</strong>` : ''}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>

                    <!-- Stay Details -->
                    <td class="grid-col" style="vertical-align: top; width: 50%; padding-left: 6px; box-sizing: border-box;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="guest-stay-card" style="width: 100%; max-width: 100%; background-color: ${lightBg}; border: 1px solid ${borderGray}; border-radius: 6px; padding: 10px; box-sizing: border-box; height: 100%;">
                        <tr>
                          <td style="border-bottom: 1px solid ${borderGray}; padding-bottom: 4px; font-size: 9px; font-weight: 800; color: ${textBlack}; text-transform: uppercase; letter-spacing: 0.5px;">
                            STAY DETAILS
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 6px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 10px; line-height: 1.55; color: ${textBlack};">
                              <tr>
                                <td style="color: ${textBlack}; width: 80px; font-weight: 500;">Check-in:</td>
                                <td style="font-weight: 700; color: ${textBlack};">${formattedCheckIn}</td>
                              </tr>
                              <tr>
                                <td style="color: ${textBlack}; font-weight: 500;">Check-out:</td>
                                <td style="font-weight: 700; color: ${textBlack};">${formattedCheckOut}</td>
                              </tr>
                              <tr>
                                <td style="color: ${textBlack}; font-weight: 500;">Duration:</td>
                                <td style="font-weight: 700; color: ${textBlack};">${data.stay.durationNights} Night(s)</td>
                              </tr>
                              <tr>
                                <td style="color: ${textBlack}; font-weight: 500;">Occupancy:</td>
                                <td style="font-weight: 700; color: ${textBlack}; white-space: nowrap;">${data.stay.adults} Adults, ${data.stay.children} Children</td>
                              </tr>
                              <tr>
                                <td style="color: ${textBlack}; font-weight: 500;">Rooms / Plan:</td>
                                <td style="font-weight: 700; color: ${textBlack}; white-space: nowrap;">${data.stay.totalRooms} Room(s) &bull; ${data.stay.mealPlan}</td>
                              </tr>
                              ${data.stay.specialRequirement ? `
                              <tr>
                                <td colspan="2" style="padding: 0;">
                                  <div class="mobile-note-card" style="margin-top: 6px; padding: 7px 8px; border: 1px solid ${borderGray}; border-radius: 5px; background-color: #FFFFFF; font-size: 9px; line-height: 1.35; color: ${textBlack}; box-sizing: border-box;">
                                    <strong>Note:</strong> ${data.stay.specialRequirement}
                                  </div>
                                </td>
                              </tr>` : ''}
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Accommodation & Tariff Section -->
                <div style="font-size: 10px; font-weight: 800; color: ${textBlack}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                  ACCOMMODATION & TARIFF
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" class="tariff-table" style="margin-bottom: 14px; border: 1px solid ${borderGray}; border-radius: 6px; overflow: hidden; table-layout: fixed; width: 100%;">
                  <thead>
                    <tr style="background-color: ${tableHeaderBg}; color: #FFFFFF;">
                      <th style="padding: 7px 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; width: 33%;">ROOM TYPE</th>
                      <th style="padding: 7px 3px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 10%;">PLAN</th>
                      <th style="padding: 7px 3px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 9%;">RMS</th>
                      <th style="padding: 7px 3px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 9%;">NTS</th>
                      <th style="padding: 7px 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 18%;">RATE/NT</th>
                      <th style="padding: 7px 3px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 8%;">DISC</th>
                      <th style="padding: 7px 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 19%;">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${roomRowsHtml}
                  </tbody>
                </table>

                ${extraServicesHtml}

                <!-- Financial Breakdown & Grand Total Table -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" class="full-mobile-card" style="width: 100%; max-width: 100%; background-color: ${lightBg}; border: 1px solid ${borderGray}; border-radius: 6px; padding: 10px 12px; margin-bottom: 14px; box-sizing: border-box;">
                  <tr>
                    <td>
                      <div style="font-size: 9px; font-weight: 800; color: ${textBlack}; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid ${borderGray}; padding-bottom: 3px; margin-bottom: 8px;">
                        TARIFF BREAKDOWN &amp; GRAND TOTAL
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; min-width: 100%; font-size: 11px; line-height: 1.6; color: ${textBlack}; table-layout: fixed;">
                        <tr>
                          <td style="color: ${textBlack};">Accommodation Total:</td>
                          <td style="text-align: right; font-weight: 600; color: ${textBlack};">${formatINR(data.calculations.accommodationTotal)}</td>
                        </tr>
                        ${data.extraServices && data.extraServices.length > 0 ? `
                        <tr>
                          <td style="color: ${textBlack};">Extra Services Total:</td>
                          <td style="text-align: right; font-weight: 600; color: ${textBlack};">${formatINR(data.calculations.extraServicesTotal)}</td>
                        </tr>` : ''}
                        <tr>
                          <td style="color: ${textBlack}; font-weight: 700; border-top: 1px solid ${borderGray}; padding-top: 3px;">Subtotal:</td>
                          <td style="text-align: right; font-weight: 700; color: ${textBlack}; border-top: 1px solid ${borderGray}; padding-top: 3px;">${formatINR(data.calculations.subtotal)}</td>
                        </tr>
                        ${data.calculations.discountAmount > 0 ? `
                        <tr>
                          <td style="color: ${textBlack}; font-weight: 600;">Discount:</td>
                          <td style="text-align: right; font-weight: 700; color: ${textBlack};">-${formatINR(data.calculations.discountAmount)}</td>
                        </tr>` : ''}
                        
                        ${gstBreakdownRowsHtml}
                        ${otherTaxRowHtml}

                        <tr>
                          <td colspan="2" style="padding-top: 6px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; min-width: 100%; background-color: ${tableHeaderBg}; color: #FFFFFF; border-radius: 4px; padding: 8px 10px;">
                              <tr>
                                <td style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #FFFFFF;">GRAND TOTAL:</td>
                                <td style="font-size: 16px; font-weight: 800; text-align: right; color: #FFFFFF; font-family: ${fontFamily};">${formatINR(data.calculations.grandTotal)}</td>
                              </tr>
                            </table>
                            <div style="font-size: 9px; color: ${textBlack}; font-weight: 600; text-align: right; margin-top: 3px;">
                              ${data.calculations.amountInWords}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Payment & UPI Payment Details Table -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" class="full-mobile-card" style="width: 100%; max-width: 100%; background-color: ${lightBg}; border: 1px solid ${borderGray}; border-radius: 6px; padding: 10px 12px; margin-bottom: 14px; box-sizing: border-box;">
                  <tr>
                    <td colspan="2" style="border-bottom: 1px solid ${borderGray}; padding-bottom: 4px; font-size: 9px; font-weight: 800; color: ${textBlack}; text-transform: uppercase; letter-spacing: 0.5px;">
                      PAYMENT &amp; UPI PAYMENT DETAILS
                    </td>
                  </tr>
                  <tr>
                    <!-- Bank details -->
                    <td class="payment-col-bank" style="vertical-align: top; padding-top: 8px; font-size: 10px; line-height: 1.5; color: ${textBlack};">
                      <div>Bank: <strong>${data.payment.bankName}</strong></div>
                      <div>A/C Name: <strong>${data.payment.accountName}</strong></div>
                      <div>A/C No: <strong>${data.payment.accountNumber}</strong></div>
                      <div>IFSC Code: <strong>${data.payment.ifsc}</strong></div>
                      <div>Branch: <strong>${data.payment.branch}</strong></div>
                      <div style="margin-top: 6px; padding: 4px 6px; background-color: #FFFFFF; border: 1px solid ${borderGray}; border-radius: 4px; display: inline-block;">
                        UPI ID: <strong style="color: ${textBlack};">${data.payment.upiId}</strong>
                      </div>
                      <div style="margin-top: 6px; font-size: 10px;">
                        Payable Advance: <strong style="color: ${textBlack};">${formatINR(data.calculations.payableAdvance)}</strong> (${data.payment.payableAdvancePercent}% Advance)
                        ${data.payment.note ? `<div style="color: ${textBlack}; font-size: 9px; margin-top: 1px;">${data.payment.note}</div>` : ''}
                      </div>
                    </td>

                    <!-- QR Code Card -->
                    <td class="payment-col-qr" style="vertical-align: top; padding-top: 8px; width: 130px; text-align: center;">
                      <table cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border: 1px solid ${borderGray}; border-radius: 6px; padding: 6px; width: 100%; text-align: center; margin: 0 auto;">
                        <tr>
                          <td>
                            <div style="font-size: 8px; font-weight: 800; color: ${textBlack}; text-transform: uppercase; margin-bottom: 3px;">SCAN &amp; PAY VIA UPI</div>
                            ${qrBlockHtml}
                            <div style="font-size: 10px; font-weight: 800; color: ${textBlack};">${formatINR(data.calculations.payableAdvance)}</div>
                            <div style="font-size: 8px; color: ${textBlack}; margin-top: 1px;">GPay | PhonePe | Paytm</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Booking Terms Table -->
                ${termsHtml ? `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" class="full-mobile-card" style="width: 100%; max-width: 100%; background-color: ${lightBg}; border: 1px solid ${borderGray}; border-radius: 6px; padding: 10px 12px; margin-bottom: 14px; box-sizing: border-box;">
                  <tr>
                    <td style="border-bottom: 1px solid ${borderGray}; padding-bottom: 4px; font-size: 9px; font-weight: 800; color: ${textBlack}; text-transform: uppercase; letter-spacing: 0.5px;">
                      BOOKING TERMS &amp; STAY POLICIES
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 6px;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${termsHtml}
                      </table>
                    </td>
                  </tr>
                </table>
                ` : ''}

                <!-- Signatory & Footer (Cleanly aligned, hotel name removed from above signature on left) -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid ${borderGray}; padding-top: 10px; margin-top: 4px;">
                  <tr>
                    <!-- Left: Signature & Authorized Person (Notice: Hotel Name removed as requested) -->
                    <td class="footer-col-left" style="vertical-align: bottom; width: 50%; padding-right: 8px;">
                      <div style="margin-bottom: 4px;">
                        ${data.signatory.signatureImageUrl ? `
                          <img src="${data.signatory.signatureImageUrl}" alt="Signature" height="34" style="display: block; max-height: 34px;" />
                        ` : `
                          <div style="font-size: 13px; font-weight: 800; color: ${textBlack}; border-bottom: 1px solid ${textBlack}; display: inline-block; padding-bottom: 2px;">
                            ${data.signatory.authorizedName}
                          </div>
                        `}
                      </div>
                      <div style="font-size: 11px; font-weight: 800; color: ${textBlack}; line-height: 1.3;">
                        ${data.signatory.authorizedName}
                      </div>
                      <div style="font-size: 10px; color: ${textBlack}; font-weight: 500; line-height: 1.3;">
                        ${data.signatory.designation}
                      </div>
                    </td>

                    <!-- Right: Thank-you message & Contact details -->
                    <td class="footer-col-right" style="vertical-align: bottom; width: 50%; text-align: right; padding-left: 8px;">
                      <div style="font-size: 11px; font-weight: 700; color: ${textBlack}; margin-bottom: 3px; line-height: 1.3;">
                        ${data.signatory.thankYouMessage || 'Thank you for choosing us!'}
                      </div>
                      <div style="font-size: 10px; color: ${textBlack}; line-height: 1.45;">
                        Phone: <a href="tel:${data.hotel.phone}" style="color: ${textBlack} !important; text-decoration: none !important; font-weight: 600;">${data.hotel.phone}</a><br>
                        Email: <a href="mailto:${data.hotel.email}" style="color: ${textBlack} !important; text-decoration: none !important; font-weight: 600;">${data.hotel.email}</a><br>
                        Web: <a href="${webHref}" target="_blank" style="color: ${textBlack} !important; text-decoration: none !important; font-weight: 600;">${data.hotel.website}</a>
                      </div>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

/**
 * Copies email-compatible rich formatted HTML to user clipboard so that
 * when pasted into Gmail/Outlook compose, the styles and tables paste directly!
 */
export async function copyFormattedEmailToClipboard(emailHtml: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const blobHtml = new Blob([emailHtml], { type: 'text/html' });
      // Create a clean plaintext summary as fallback
      const textFallback = emailHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const blobText = new Blob([textFallback], { type: 'text/plain' });

      const item = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText
      });

      await navigator.clipboard.write([item]);
      return true;
    } else {
      // Fallback
      await navigator.clipboard.writeText(emailHtml);
      return true;
    }
  } catch (err) {
    console.error('Clipboard write error:', err);
    // Fallback using text copy
    try {
      await navigator.clipboard.writeText(emailHtml);
      return true;
    } catch {
      return false;
    }
  }
}

export const generateEmailSafeHtml = generateEmailHtml;
