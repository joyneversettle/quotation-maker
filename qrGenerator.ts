import QRCode from 'qrcode';
import { QuotationData } from '../types/quotation';

/**
 * Builds standard UPI Deep Link URI
 * Format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
 */
export function buildUpiPaymentUri(
  upiId: string,
  payeeName: string,
  amount: number,
  note = 'Room Quotation Advance'
): string {
  if (!upiId || !upiId.trim()) {
    return '';
  }

  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent(payeeName?.trim() || 'Hotel');
  const cleanNote = encodeURIComponent(note?.trim() || 'Room Quotation Advance');
  const formattedAmount = amount > 0 ? amount.toFixed(2) : '';

  let upiString = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&cu=INR`;
  if (formattedAmount) {
    upiString += `&am=${formattedAmount}`;
  }
  if (cleanNote) {
    upiString += `&tn=${cleanNote}`;
  }

  return upiString;
}

/**
 * High-reliability HTTPS QR code image URL for email clients (Gmail, Outlook, Apple Mail).
 * Gmail image proxy blocks data:image base64 URIs, so HTTPS URLs are essential for emails.
 */
export function getUpiQrRemoteUrl(
  upiId: string,
  payeeName: string,
  amount: number,
  note = 'Room Quotation Advance'
): string {
  const upiUri = buildUpiPaymentUri(upiId, payeeName, amount, note);
  if (!upiUri) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(upiUri)}`;
}

/**
 * Generates a local base64 data URL PNG for UPI Payment
 */
export async function generateUpiQrDataUrl(
  upiId: string,
  payeeName: string,
  amount: number,
  note = 'Room Quotation Advance'
): Promise<string> {
  const upiString = buildUpiPaymentUri(upiId, payeeName, amount, note);
  if (!upiString) {
    return '';
  }

  try {
    const dataUrl = await QRCode.toDataURL(upiString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 250,
      color: {
        dark: '#0B1B3D',
        light: '#FFFFFF'
      }
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate UPI QR code data URL:', err);
    // Return remote URL as seamless fallback if local QR canvas fails
    return getUpiQrRemoteUrl(upiId, payeeName, amount, note);
  }
}

/**
 * Resolves the most reliable QR code image source for rendering.
 * @param data QuotationData
 * @param forEmail When true, prioritizes HTTPS URLs that Gmail/Outlook won't strip
 */
export function resolveQrImageSrc(data: QuotationData, forEmail = false, explicitQr?: string): string {
  if (explicitQr) {
    // If it's an email and explicitQr is base64, check if we can make a remote URL
    if (forEmail && explicitQr.startsWith('data:') && data.payment?.upiId) {
      const remote = getUpiQrRemoteUrl(
        data.payment.upiId,
        data.hotel?.name || 'Hotel',
        data.calculations?.payableAdvance || 0,
        data.payment?.note || 'Room Quotation Advance'
      );
      if (remote) return remote;
    }
    return explicitQr;
  }

  // 1. If explicit HTTPS QR code URL is already stored
  if (data.payment?.qrCodeImageUrl) {
    return data.payment.qrCodeImageUrl;
  }

  // 2. If upiQrImage is an HTTPS URL
  if (data.payment?.upiQrImage && data.payment.upiQrImage.startsWith('http')) {
    return data.payment.upiQrImage;
  }

  // 3. For email: prefer HTTPS QR so Gmail/Outlook image proxy renders it perfectly
  if (forEmail && data.payment?.upiId) {
    const remote = getUpiQrRemoteUrl(
      data.payment.upiId,
      data.hotel?.name || 'Hotel',
      data.calculations?.payableAdvance || 0,
      data.payment?.note || 'Room Quotation Advance'
    );
    if (remote) return remote;
  }

  // 4. Stored QR base64 data URL
  if (data.payment?.qrCodeDataUrl) {
    return data.payment.qrCodeDataUrl;
  }

  // 5. Stored upiQrImage (e.g. uploaded standee)
  if (data.payment?.upiQrImage) {
    return data.payment.upiQrImage;
  }

  // 6. If upiId is provided, generate remote URL even if user forgot to click generate
  if (data.payment?.upiId) {
    return getUpiQrRemoteUrl(
      data.payment.upiId,
      data.hotel?.name || 'Hotel',
      data.calculations?.payableAdvance || 0,
      data.payment?.note || 'Room Quotation Advance'
    );
  }

  return '';
}

export const generateUpiQrCode = generateUpiQrDataUrl;
