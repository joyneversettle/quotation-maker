import { QuotationData } from '../types/quotation';
import { formatINR, formatDateDisplay } from './calculations';
import { resolveQrImageSrc } from './qrGenerator';

export interface PlaceholderDocumentation {
  tag: string;
  description: string;
  category: string;
  example: string;
}

export const AVAILABLE_PLACEHOLDERS: PlaceholderDocumentation[] = [
  // Hotel Details
  { tag: '{{hotel_name}}', description: 'Hotel / Resort Name', category: 'Property', example: "Shangri-La's Beach Resort" },
  { tag: '{{hotel_tagline}}', description: 'Property Tagline', category: 'Property', example: 'OCEAN BREEZE & ISLAND PEACE' },
  { tag: '{{hotel_address}}', description: 'Full Address', category: 'Property', example: 'Vijay Nagar, Swaraj Dweep - 744211' },
  { tag: '{{hotel_phone}}', description: 'Contact Phone', category: 'Property', example: '+91 9474252177' },
  { tag: '{{hotel_email}}', description: 'Official Email', category: 'Property', example: 'shangrilasbeachresort@gmail.com' },
  { tag: '{{hotel_gstin}}', description: 'Hotel GSTIN', category: 'Property', example: '35CIAPS8902B1ZG' },
  { tag: '{{hotel_website}}', description: 'Official Website', category: 'Property', example: 'www.shangrilasbeachresort.com' },

  // Quotation Meta
  { tag: '{{quotation_number}}', description: 'Quotation ID', category: 'Quotation', example: 'QT-202609-9013' },
  { tag: '{{quotation_date}}', description: 'Issued Date', category: 'Quotation', example: '21 Sept 2026' },
  { tag: '{{valid_until}}', description: 'Validity Date', category: 'Quotation', example: '01 Oct 2026' },

  // Guest Details
  { tag: '{{guest_name}}', description: 'Guest / Lead Name', category: 'Guest', example: 'Rajesh Kumar & Family' },
  { tag: '{{guest_contact_person}}', description: 'Contact Person', category: 'Guest', example: 'Mr. Rajesh Kumar' },
  { tag: '{{guest_phone}}', description: 'Guest Phone', category: 'Guest', example: '+91 98765 43210' },
  { tag: '{{guest_email}}', description: 'Guest Email', category: 'Guest', example: 'rajesh.kumar@example.com' },
  { tag: '{{guest_gstin}}', description: 'Guest GST Number', category: 'Guest', example: '29AABCU9603R1ZM' },
  { tag: '{{guest_address}}', description: 'Guest Billing Address', category: 'Guest', example: 'Bengaluru, India' },
  { tag: '{{travel_agency}}', description: 'Booking Agent / Company', category: 'Guest', example: 'Island Trails' },
  { tag: '{{guest_type}}', description: 'Type: Individual/Corporate/Agent', category: 'Guest', example: 'INDIVIDUAL' },

  // Stay Details
  { tag: '{{check_in}}', description: 'Check-in Date', category: 'Stay', example: '21 Sept 2026' },
  { tag: '{{check_out}}', description: 'Check-out Date', category: 'Stay', example: '22 Sept 2026' },
  { tag: '{{duration}}', description: 'Number of Nights', category: 'Stay', example: '1' },
  { tag: '{{adults}}', description: 'Total Adults', category: 'Stay', example: '2' },
  { tag: '{{children}}', description: 'Total Children', category: 'Stay', example: '0' },
  { tag: '{{total_rooms}}', description: 'Count of Rooms', category: 'Stay', example: '1' },
  { tag: '{{meal_plan}}', description: 'Meal Plan Code', category: 'Stay', example: 'CP' },
  { tag: '{{special_requirement}}', description: 'Special Request Note', category: 'Stay', example: 'Ground floor room' },

  // Tables
  { tag: '{{room_rows}}', description: 'Pre-rendered Table Rows for Rooms', category: 'Tables', example: '<tr>...</tr>' },
  { tag: '{{extra_service_rows}}', description: 'Pre-rendered Table Rows for Add-ons', category: 'Tables', example: '<tr>...</tr>' },

  // Tariff & Taxes
  { tag: '{{accommodation_total}}', description: 'Total Room Tariff', category: 'Financials', example: '₹7,500.00' },
  { tag: '{{extra_services_total}}', description: 'Total Extra Services', category: 'Financials', example: '₹5,000.00' },
  { tag: '{{subtotal}}', description: 'Subtotal Amount', category: 'Financials', example: '₹12,500.00' },
  { tag: '{{discount_amount}}', description: 'Discount Deducted', category: 'Financials', example: '₹0.00' },
  { tag: '{{taxable_amount}}', description: 'Taxable Amount', category: 'Financials', example: '₹12,500.00' },
  { tag: '{{cgst_amount}}', description: 'CGST Amount', category: 'Financials', example: '₹750.00' },
  { tag: '{{sgst_amount}}', description: 'SGST Amount', category: 'Financials', example: '₹750.00' },
  { tag: '{{grand_total}}', description: 'Grand Total with Currency', category: 'Financials', example: '₹14,000.00' },
  { tag: '{{amount_in_words}}', description: 'Grand Total in Indian Words', category: 'Financials', example: 'RUPEES FOURTEEN THOUSAND ONLY' },

  // Bank & UPI
  { tag: '{{bank_name}}', description: 'Bank Name', category: 'Payment', example: 'HDFC Bank Ltd.' },
  { tag: '{{account_name}}', description: 'Account Beneficiary Name', category: 'Payment', example: "Shangri-La's Beach Resort" },
  { tag: '{{account_number}}', description: 'Bank Account Number', category: 'Payment', example: '50200088991234' },
  { tag: '{{ifsc}}', description: 'IFSC Code', category: 'Payment', example: 'HDFC0001234' },
  { tag: '{{branch}}', description: 'Branch Location', category: 'Payment', example: 'Port Blair Branch' },
  { tag: '{{upi_id}}', description: 'VPA / UPI ID', category: 'Payment', example: 'shangrilasresort@hdfcbank' },
  { tag: '{{upi_qr_element}}', description: 'Scan & Pay QR Image', category: 'Payment', example: '<img src="..." />' },
  { tag: '{{advance_amount}}', description: 'Payable Advance Amount', category: 'Payment', example: '₹7,000.00' },
  { tag: '{{advance_percentage}}', description: 'Advance Required %', category: 'Payment', example: '50' },

  // Terms & Signatory
  { tag: '{{booking_terms_list}}', description: 'Numbered Terms as <li> items', category: 'Terms', example: '<li>Check-in 11 AM...</li>' },
  { tag: '{{authorized_name}}', description: 'Signatory Name', category: 'Signatory', example: 'Nityananda Sutar' },
  { tag: '{{designation}}', description: 'Signatory Designation', category: 'Signatory', example: 'General Manager' },
  { tag: '{{signature_element}}', description: 'Signature Seal / Graphic', category: 'Signatory', example: '<svg>...</svg>' },
  { tag: '{{thank_you_message}}', description: 'Closing Hospitality Message', category: 'Signatory', example: 'Thank you for choosing us...' }
];

/**
 * Renders the room rows as clean standard HTML <tr> elements
 */
function renderRoomRowsHtml(data: QuotationData): string {
  if (!data.rooms || data.rooms.length === 0) {
    return `<tr><td colspan="7" class="py-3 px-3 text-center text-slate-400 italic">No room items added</td></tr>`;
  }

  return data.rooms.map((room, idx) => {
    const bgClass = idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white';
    const discountLabel = room.discountValue > 0
      ? (room.discountType === 'PERCENT' ? `${room.discountValue}%` : formatINR(room.discountValue))
      : '&mdash;';

    return `<tr class="${bgClass} border-b border-slate-200">
      <td class="py-2.5 px-3 font-semibold text-slate-800">${escapeHtml(room.roomType || 'Standard Room')}</td>
      <td class="py-2.5 px-2 text-center font-bold text-amber-800"><span class="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">${room.mealPlan}</span></td>
      <td class="py-2.5 px-2 text-center font-mono text-slate-700">${room.roomsCount}</td>
      <td class="py-2.5 px-2 text-center font-mono text-slate-700">${room.nightsCount}</td>
      <td class="py-2.5 px-3 text-right font-mono text-slate-700">${formatINR(room.ratePerNight)}</td>
      <td class="py-2.5 px-2 text-right font-mono text-emerald-700">${discountLabel}</td>
      <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900">${formatINR(room.calculatedAmount)}</td>
    </tr>`;
  }).join('');
}

/**
 * Renders extra service rows as clean HTML
 */
function renderExtraServiceRowsHtml(data: QuotationData): string {
  if (!data.extraServices || data.extraServices.length === 0) {
    return '';
  }

  return data.extraServices.map((service, idx) => {
    const bgClass = idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white';
    return `<tr class="${bgClass} border-b border-slate-200">
      <td class="py-2 px-3 text-slate-800 font-medium">${escapeHtml(service.serviceName || 'Extra Service')}</td>
      <td class="py-2 px-2 text-center font-mono text-slate-700">${service.quantity}</td>
      <td class="py-2 px-3 text-right font-mono text-slate-700">${formatINR(service.rate)}</td>
      <td class="py-2 px-3 text-right font-mono font-bold text-slate-900">${formatINR(service.calculatedAmount)}</td>
    </tr>`;
  }).join('');
}

/**
 * Renders booking terms as clean HTML <li> items
 */
function renderBookingTermsHtml(data: QuotationData): string {
  if (!data.terms || data.terms.length === 0) {
    return '<li>Standard hotel booking policies apply.</li>';
  }

  return data.terms.map((term) => {
    return `<li class="mb-1 text-slate-700 leading-relaxed">${escapeHtml(term.text)}</li>`;
  }).join('');
}

/**
 * Helper to escape HTML special chars
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Signature graphic element
 */
function renderSignatureElement(data: QuotationData): string {
  if (data.signatory.signatureImageUrl) {
    return `<img src="${data.signatory.signatureImageUrl}" alt="Signature" class="max-h-12 max-w-[150px] object-contain" />`;
  }

  // Elegant luxury resort cursive digital seal vector
  return `<svg width="140" height="40" viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-slate-800">
    <path d="M12 28C24 10 42 12 55 18C68 24 85 8 98 14C111 20 120 18 132 12" stroke="#0B1B3D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M35 12C35 24 45 32 60 32C75 32 78 20 88 24" stroke="#0B1B3D" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M70 14L85 30" stroke="#0B1B3D" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

/**
 * UPI QR element
 */
function renderUpiQrElement(data: QuotationData, qrDataUrl?: string): string {
  const qrSrc = resolveQrImageSrc(data, false, qrDataUrl);
  if (qrSrc) {
    return `<img src="${qrSrc}" alt="Scan and Pay UPI QR" class="w-28 h-28 mx-auto object-contain rounded border border-slate-200" />`;
  }

  // Standalone fallback visual QR placeholder
  return `<div class="w-28 h-28 mx-auto bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center p-2 text-center text-slate-500">
    <svg class="w-12 h-12 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
    <span class="text-[9px] mt-1 font-mono">${data.payment.upiId || 'UPI QR'}</span>
  </div>`;
}

/**
 * Main Template Rendering Function
 * Resolves standard placeholders, conditionals, and loops.
 */
export function renderQuotationTemplate(
  templateHtml: string,
  data: QuotationData,
  qrDataUrl?: string
): string {
  if (!templateHtml) return '';

  let output = templateHtml;

  // 1. Process Conditionals: {{#if variable}} content {{/if}}
  const ifRegex = /\{\{#if\s+([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  output = output.replace(ifRegex, (match, conditionVar, innerContent) => {
    let condition = false;
    switch (conditionVar) {
      case 'discount':
      case 'discount_amount':
        condition = (data.calculations.discountAmount > 0);
        break;
      case 'extra_services_exist':
      case 'extra_services':
        condition = Boolean(data.extraServices && data.extraServices.length > 0);
        break;
      case 'gst':
      case 'gst_enabled':
        condition = Boolean(data.taxes.enableGst);
        break;
      case 'other_tax':
      case 'other_tax_enabled':
        condition = Boolean(data.taxes.enableOtherTax && data.taxes.otherTaxPercent > 0);
        break;
      case 'guest_company':
        condition = Boolean(data.guest.contactPerson && data.guest.contactPerson !== data.guest.name);
        break;
      case 'guest_gstin':
        condition = Boolean(data.guest.gstin && data.guest.gstin.trim().length > 0);
        break;
      case 'travel_agency':
        condition = Boolean(data.guest.travelAgency && data.guest.travelAgency.trim().length > 0);
        break;
      case 'special_requirement':
        condition = Boolean(data.stay.specialRequirement && data.stay.specialRequirement.trim().length > 0);
        break;
      case 'upi_qr':
        condition = Boolean(qrDataUrl || data.payment.upiQrImage || data.payment.upiId);
        break;
      default:
        condition = false;
    }
    return condition ? innerContent : '';
  });

  // 2. Process Loops: {{#each rooms}} content {{/each}}
  const eachRoomsRegex = /\{\{#each\s+rooms\}\}([\s\S]*?)\{\{\/each\}\}/g;
  output = output.replace(eachRoomsRegex, (match, itemTemplate) => {
    return data.rooms.map((room) => {
      let itemHtml = itemTemplate;
      itemHtml = itemHtml.replace(/\{\{room_type\}\}/g, escapeHtml(room.roomType));
      itemHtml = itemHtml.replace(/\{\{meal_plan\}\}/g, room.mealPlan);
      itemHtml = itemHtml.replace(/\{\{rooms_count\}\}/g, String(room.roomsCount));
      itemHtml = itemHtml.replace(/\{\{nights_count\}\}/g, String(room.nightsCount));
      itemHtml = itemHtml.replace(/\{\{rate\}\}/g, formatINR(room.ratePerNight));
      itemHtml = itemHtml.replace(/\{\{amount\}\}/g, formatINR(room.calculatedAmount));
      return itemHtml;
    }).join('');
  });

  // {{#each extra_services}}
  const eachServicesRegex = /\{\{#each\s+extra_services\}\}([\s\S]*?)\{\{\/each\}\}/g;
  output = output.replace(eachServicesRegex, (match, itemTemplate) => {
    return data.extraServices.map((service) => {
      let itemHtml = itemTemplate;
      itemHtml = itemHtml.replace(/\{\{service_name\}\}/g, escapeHtml(service.serviceName));
      itemHtml = itemHtml.replace(/\{\{quantity\}\}/g, String(service.quantity));
      itemHtml = itemHtml.replace(/\{\{rate\}\}/g, formatINR(service.rate));
      itemHtml = itemHtml.replace(/\{\{amount\}\}/g, formatINR(service.calculatedAmount));
      return itemHtml;
    }).join('');
  });

  // {{#each booking_terms}}
  const eachTermsRegex = /\{\{#each\s+booking_terms\}\}([\s\S]*?)\{\{\/each\}\}/g;
  output = output.replace(eachTermsRegex, (match, itemTemplate) => {
    return data.terms.map((term, i) => {
      let itemHtml = itemTemplate;
      itemHtml = itemHtml.replace(/\{\{index\}\}/g, String(i + 1));
      itemHtml = itemHtml.replace(/\{\{text\}\}/g, escapeHtml(term.text));
      return itemHtml;
    }).join('');
  });

  // 3. Simple Dictionary Replacements
  const dict: Record<string, string> = {
    // Hotel
    '{{hotel_name}}': escapeHtml(data.hotel.name),
    '{{hotel_tagline}}': escapeHtml(data.hotel.tagline),
    '{{hotel_address}}': escapeHtml(data.hotel.address),
    '{{hotel_phone}}': escapeHtml(data.hotel.phone),
    '{{hotel_email}}': escapeHtml(data.hotel.email),
    '{{hotel_website}}': escapeHtml(data.hotel.website),
    '{{hotel_gstin}}': escapeHtml(data.hotel.gstin),

    // Quotation
    '{{quotation_number}}': escapeHtml(data.quotationNumber),
    '{{quotation_date}}': formatDateDisplay(data.quotationDate),
    '{{valid_until}}': formatDateDisplay(data.validUntil),

    // Guest
    '{{guest_name}}': escapeHtml(data.guest.name),
    '{{guest_contact_person}}': escapeHtml(data.guest.contactPerson || data.guest.name),
    '{{guest_phone}}': escapeHtml(data.guest.phone),
    '{{guest_email}}': escapeHtml(data.guest.email),
    '{{guest_gstin}}': escapeHtml(data.guest.gstin),
    '{{guest_address}}': escapeHtml(data.guest.address),
    '{{travel_agency}}': escapeHtml(data.guest.travelAgency),
    '{{guest_type}}': data.guest.guestType || 'INDIVIDUAL',

    // Stay
    '{{check_in}}': formatDateDisplay(data.stay.checkIn),
    '{{check_out}}': formatDateDisplay(data.stay.checkOut),
    '{{duration}}': String(data.stay.durationNights || 1),
    '{{adults}}': String(data.stay.adults || 2),
    '{{children}}': String(data.stay.children || 0),
    '{{total_rooms}}': String(data.stay.totalRooms || 1),
    '{{extra_mattress}}': String(data.stay.extraMattress || 0),
    '{{cnb}}': String(data.stay.cnb || 0),
    '{{meal_plan}}': data.stay.mealPlan || 'CP',
    '{{special_requirement}}': escapeHtml(data.stay.specialRequirement),

    // Pre-rendered Tables
    '{{room_rows}}': renderRoomRowsHtml(data),
    '{{extra_service_rows}}': renderExtraServiceRowsHtml(data),

    // Totals
    '{{accommodation_total}}': formatINR(data.calculations.accommodationTotal),
    '{{extra_services_total}}': formatINR(data.calculations.extraServicesTotal),
    '{{subtotal}}': formatINR(data.calculations.subtotal),
    '{{discount_amount}}': formatINR(data.calculations.discountAmount),
    '{{taxable_amount}}': formatINR(data.calculations.taxableAmount),
    '{{cgst_rate}}': String(data.taxes.cgstPercent),
    '{{sgst_rate}}': String(data.taxes.sgstPercent),
    '{{cgst_amount}}': formatINR(data.calculations.cgstAmount),
    '{{sgst_amount}}': formatINR(data.calculations.sgstAmount),
    '{{other_tax_name}}': escapeHtml(data.taxes.otherTaxName || 'Other Tax'),
    '{{other_tax_amount}}': formatINR(data.calculations.otherTaxAmount),
    '{{grand_total}}': formatINR(data.calculations.grandTotal),
    '{{amount_in_words}}': data.calculations.amountInWords || '',

    // Payment & Bank
    '{{bank_name}}': escapeHtml(data.payment.bankName),
    '{{account_name}}': escapeHtml(data.payment.accountName),
    '{{account_number}}': escapeHtml(data.payment.accountNumber),
    '{{ifsc}}': escapeHtml(data.payment.ifsc),
    '{{branch}}': escapeHtml(data.payment.branch),
    '{{upi_id}}': escapeHtml(data.payment.upiId),
    '{{upi_qr_element}}': renderUpiQrElement(data, qrDataUrl),
    '{{advance_amount}}': formatINR(data.calculations.payableAdvance),
    '{{advance_percentage}}': String(data.payment.payableAdvancePercent),
    '{{balance_amount}}': formatINR(data.calculations.balanceAmount),
    '{{payment_note}}': escapeHtml(data.payment.note),
    '{{payment_due_date}}': formatDateDisplay(data.payment.paymentDueDate),

    // Terms & Signatory
    '{{booking_terms_list}}': renderBookingTermsHtml(data),
    '{{authorized_name}}': escapeHtml(data.signatory.authorizedName),
    '{{designation}}': escapeHtml(data.signatory.designation),
    '{{signature_element}}': renderSignatureElement(data),
    '{{thank_you_message}}': escapeHtml(data.signatory.thankYouMessage)
  };

  for (const [key, val] of Object.entries(dict)) {
    output = output.split(key).join(val);
  }

  return output;
}

export const renderTemplate = renderQuotationTemplate;
