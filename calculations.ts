import { RoomRow, ExtraServiceRow, TaxSettings, PaymentDetails, QuotationCalculations } from '../types/quotation';

/**
 * Formats a number to Indian Rupee representation (e.g. ₹1,25,000.00)
 */
export function formatINR(val: number | undefined | null, includeSymbol = true): string {
  if (val === undefined || val === null || isNaN(val)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }

  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const fixed = absVal.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');

  // Indian Number System Formatting
  // Last 3 digits grouped together, then groups of 2 digits
  let result = '';
  const len = integerPart.length;

  if (len <= 3) {
    result = integerPart;
  } else {
    const lastThree = integerPart.substring(len - 3);
    const otherDigits = integerPart.substring(0, len - 3);
    const withCommas = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${withCommas},${lastThree}`;
  }

  const formatted = `${isNegative ? '-' : ''}${result}.${decimalPart}`;
  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Converts a number to Indian Words (e.g., "RUPEES TWENTY FIVE THOUSAND ONLY")
 */
export function numberToIndianWords(num: number | undefined | null): string {
  if (!num || isNaN(num) || num <= 0) {
    return 'RUPEES ZERO ONLY';
  }

  const rounded = Math.round(num);
  if (rounded === 0) return 'RUPEES ZERO ONLY';

  const ones = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ];

  const tens = [
    '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    const ten = Math.floor(n / 10);
    const rem = n % 10;
    return `${tens[ten]}${rem > 0 ? ` ${ones[rem]}` : ''}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rem = n % 100;
    let str = '';
    if (hundred > 0) {
      str += `${ones[hundred]} HUNDRED`;
    }
    if (rem > 0) {
      str += `${hundred > 0 ? ' AND ' : ''}${convertTwoDigits(rem)}`;
    }
    return str;
  }

  let n = rounded;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remainder = n;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(`${convertTwoDigits(crore)} CRORE`);
  }
  if (lakh > 0) {
    parts.push(`${convertTwoDigits(lakh)} LAKH`);
  }
  if (thousand > 0) {
    parts.push(`${convertTwoDigits(thousand)} THOUSAND`);
  }
  if (remainder > 0) {
    parts.push(convertThreeDigits(remainder));
  }

  return `RUPEES ${parts.join(' ')} ONLY`;
}

/**
 * Calculates night difference between two YYYY-MM-DD dates
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  try {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  } catch {
    return 1;
  }
}

/**
 * Calculates row amounts and overall totals
 */
export function calculateTotals(
  rooms: RoomRow[],
  extraServices: ExtraServiceRow[],
  taxes: TaxSettings,
  payment: PaymentDetails
): {
  updatedRooms: RoomRow[];
  updatedExtraServices: ExtraServiceRow[];
  calculations: QuotationCalculations;
} {
  // Calculate Rooms
  let accommodationTotal = 0;
  const updatedRooms = rooms.map((room) => {
    const roomsCount = Math.max(0, Number(room.roomsCount) || 0);
    const nightsCount = Math.max(1, Number(room.nightsCount) || 1);
    const ratePerNight = Math.max(0, Number(room.ratePerNight) || 0);
    const base = roomsCount * nightsCount * ratePerNight;

    let discount = 0;
    const discountVal = Math.max(0, Number(room.discountValue) || 0);
    if (room.discountType === 'PERCENT') {
      discount = (base * Math.min(100, discountVal)) / 100;
    } else {
      discount = Math.min(base, discountVal);
    }

    const calculatedAmount = Math.max(0, Math.round(base - discount));
    accommodationTotal += calculatedAmount;

    return {
      ...room,
      roomsCount,
      nightsCount,
      ratePerNight,
      calculatedAmount
    };
  });

  // Calculate Extra Services
  let extraServicesTotal = 0;
  const updatedExtraServices = extraServices.map((service) => {
    const quantity = Math.max(0, Number(service.quantity) || 0);
    const rate = Math.max(0, Number(service.rate) || 0);
    const calculatedAmount = Math.max(0, Math.round(quantity * rate));
    extraServicesTotal += calculatedAmount;

    return {
      ...service,
      quantity,
      rate,
      calculatedAmount
    };
  });

  const subtotal = accommodationTotal + extraServicesTotal;

  // Overall Discount
  let discountAmount = 0;
  const overallDiscountVal = Math.max(0, Number(taxes.overallDiscountValue) || 0);
  if (taxes.overallDiscountType === 'PERCENT') {
    discountAmount = (subtotal * Math.min(100, overallDiscountVal)) / 100;
  } else {
    discountAmount = Math.min(subtotal, overallDiscountVal);
  }
  discountAmount = Math.round(discountAmount);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // Taxes
  let cgstAmount = 0;
  let sgstAmount = 0;
  let otherTaxAmount = 0;

  if (taxes.enableGst) {
    const cgstRate = Math.max(0, Number(taxes.cgstPercent) || 0);
    const sgstRate = Math.max(0, Number(taxes.sgstPercent) || 0);
    cgstAmount = Math.round((taxableAmount * cgstRate) / 100);
    sgstAmount = Math.round((taxableAmount * sgstRate) / 100);
  }

  if (taxes.enableOtherTax) {
    const otherRate = Math.max(0, Number(taxes.otherTaxPercent) || 0);
    otherTaxAmount = Math.round((taxableAmount * otherRate) / 100);
  }

  const grandTotal = taxableAmount + cgstAmount + sgstAmount + otherTaxAmount;

  // Advance calculation
  const advancePercent = Math.max(0, Math.min(100, Number(payment.payableAdvancePercent) || 0));
  let payableAdvance = Math.round((grandTotal * advancePercent) / 100);
  if (payment.advanceAmount > 0 && advancePercent === 0) {
    payableAdvance = payment.advanceAmount;
  }
  const balanceAmount = Math.max(0, grandTotal - payableAdvance);

  const amountInWords = numberToIndianWords(grandTotal);

  return {
    updatedRooms,
    updatedExtraServices,
    calculations: {
      accommodationTotal,
      extraServicesTotal,
      subtotal,
      discountAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      otherTaxAmount,
      grandTotal,
      payableAdvance,
      balanceAmount,
      amountInWords
    }
  };
}

/**
 * Format date string from YYYY-MM-DD to "DD Mon YYYY" (e.g. 21 Sept 2026)
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

export const formatIndianCurrency = formatINR;

export function calculateQuotationSummary(data: {
  rooms: RoomRow[];
  extraServices: ExtraServiceRow[];
  taxes: TaxSettings;
  payment: PaymentDetails;
}): QuotationCalculations {
  const { calculations } = calculateTotals(data.rooms, data.extraServices, data.taxes, data.payment);
  return calculations;
}
