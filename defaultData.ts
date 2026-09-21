import { QuotationData, QuotationTemplate, AppSettings, BankPaymentInfo } from '../types/quotation';
import { calculateTotals } from '../utils/calculations';

export const DEFAULT_HOTEL = {
  name: "Shangri-La's Beach Resort",
  tagline: "OCEAN BREEZE & ISLAND PEACE",
  address: "Vijay Nagar, Swaraj Dweep - 744211, Andaman & Nicobar Islands",
  phone: "+91 9474252177",
  email: "shangrilasbeachresort@gmail.com",
  gstin: "35CIAPS8902B1ZG",
  website: "www.shangrilasbeachresort.com",
  logoUrl: ""
};

export const DEFAULT_TERMS = [
  { id: '1', text: 'Check-in time is 11:00 AM and Check-out time is 09:00 AM. Early check-in and late check-out are subject to room availability.' },
  { id: '2', text: 'A 50% advance deposit is mandatory to guarantee room reservation. Balance payable upon check-in.' },
  { id: '3', text: 'Free cancellation up to 30 days prior to arrival. Cancellations between 7 to 15 days attract 50% charge. No refund within 7 days.' },
  { id: '4', text: 'Valid Government Photo ID is mandatory at check-in (Passport, Voter ID, Driving License, Aadhaar). Note: PAN Cards are strictly not accepted as proof of identity.' },
  { id: '5', text: 'Festive Date Event Surcharge applies for Mandatory Gala Dinners (Durga Puja, Diwali, Christmas Eve, New Year Eve, Valentine\'s Day).' }
];

export const DEFAULT_SETTINGS: AppSettings = {
  defaultHotel: DEFAULT_HOTEL,
  defaultPayment: {
    bankName: "HDFC Bank Ltd.",
    accountName: "Shangri-La's Beach Resort Pvt Ltd",
    accountNumber: "50200088991234",
    ifsc: "HDFC0001234",
    branch: "Port Blair Central Branch",
    upiId: "shangrilasresort@hdfcbank",
    payableAdvancePercent: 50,
    paymentDueDate: "2026-09-24",
    note: "Please transfer 50% advance to confirm your room reservation."
  },
  defaultTerms: DEFAULT_TERMS,
  defaultSignatory: {
    authorizedName: "Nityananda Sutar",
    designation: "General Manager",
    hotelName: "Shangri-La's Beach Resort",
    thankYouMessage: "Thank you for choosing Shangri-La's Beach Resort. We look forward to welcoming you!"
  },
  defaultTaxes: {
    enableGst: true,
    cgstPercent: 6,
    sgstPercent: 6,
    enableOtherTax: false,
    otherTaxName: "Tourism Cess",
    otherTaxPercent: 0,
    overallDiscountType: 'FIXED',
    overallDiscountValue: 0
  },
  extraServicesCatalog: [
    { id: 'cat-1', serviceName: 'Candle Light Beachside Dinner', rate: 3500 },
    { id: 'cat-2', serviceName: 'Jetty / Harbor Speedboat Transfer (Round Trip)', rate: 1500 },
    { id: 'cat-3', serviceName: 'Scuba Diving Session with Underwater Video', rate: 4500 },
    { id: 'cat-4', serviceName: 'Extra Mattress & Buffet Breakfast', rate: 1800 },
    { id: 'cat-5', serviceName: 'Snorkeling Tour at Elephant Beach', rate: 2200 },
    { id: 'cat-6', serviceName: 'Romantic Flower Bed Decoration', rate: 2000 }
  ],
  roomTypesCatalog: [
    { id: 'room-cat-1', roomType: 'Deluxe Garden View Room', defaultRate: 7500, mealPlan: 'CP' },
    { id: 'room-cat-2', roomType: 'Ocean Front Luxury Cottage', defaultRate: 9500, mealPlan: 'CP' },
    { id: 'room-cat-3', roomType: 'Royal Beach Villa with Private Jacuzzi', defaultRate: 14500, mealPlan: 'CP' },
    { id: 'room-cat-4', roomType: 'Family Quad Suite (2 Bedrooms)', defaultRate: 16000, mealPlan: 'CP' }
  ],
  promoBanner: {
    enabled: true,
    badge: 'FESTIVE OFFER',
    text: 'Special Season Discount: Flat 10% OFF on all accommodation & complimentary breakfast!',
    discountCode: 'FESTIVE10',
    discountPercent: 10
  }
};

const initialRooms = [
  {
    id: 'room-1',
    roomType: 'Deluxe Garden View Room',
    mealPlan: 'CP' as const,
    roomsCount: 1,
    nightsCount: 1,
    ratePerNight: 7500,
    discountType: 'FIXED' as const,
    discountValue: 0,
    calculatedAmount: 7500
  }
];

const initialExtraServices = [
  {
    id: 'extra-1',
    serviceName: 'Candle Light Beachside Dinner',
    quantity: 1,
    rate: 3500,
    calculatedAmount: 3500
  },
  {
    id: 'extra-2',
    serviceName: 'Jetty / Harbor Speedboat Transfer (Round Trip)',
    quantity: 1,
    rate: 1500,
    calculatedAmount: 1500
  }
];

const paymentInitial = {
  bankName: "HDFC Bank Ltd.",
  accountName: "Shangri-La's Beach Resort Pvt Ltd",
  accountNumber: "50200088991234",
  ifsc: "HDFC0001234",
  branch: "Port Blair Central Branch",
  upiId: "shangrilasresort@hdfcbank",
  payableAdvancePercent: 50,
  advanceAmount: 0,
  balanceAmount: 0,
  paymentDueDate: "2026-09-24",
  note: "Please transfer 50% advance to confirm your room reservation."
};

const taxesInitial = {
  enableGst: true,
  cgstPercent: 6,
  sgstPercent: 6,
  enableOtherTax: false,
  otherTaxName: "Green Cess",
  otherTaxPercent: 0,
  overallDiscountType: 'FIXED' as const,
  overallDiscountValue: 0
};

const { calculations } = calculateTotals(initialRooms, initialExtraServices, taxesInitial, paymentInitial);

export const DEFAULT_QUOTATION: QuotationData = {
  id: 'quotation-sample-1',
  title: "Shangri-La Resort - Rajesh Kumar Room Quotation",
  quotationNumber: "QT-202609-9013",
  quotationDate: "2026-09-21",
  validUntil: "2026-10-01",
  templateId: "tpl-executive-navy",
  hotel: { ...DEFAULT_HOTEL },
  guest: {
    name: "Rajesh Kumar & Family",
    contactPerson: "Mr. Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh.kumar@example.com",
    gstin: "29AABCU9603R1ZM",
    address: "Indiranagar, Bengaluru, Karnataka - 560038",
    travelAgency: "Island Trails Holidays",
    guestType: "INDIVIDUAL"
  },
  stay: {
    checkIn: "2026-09-21",
    checkOut: "2026-09-22",
    durationNights: 1,
    adults: 2,
    children: 0,
    totalRooms: 1,
    extraMattress: 0,
    cnb: 0,
    mealPlan: "CP",
    specialRequirement: "Ground floor cottage with quiet tropical garden view requested."
  },
  rooms: initialRooms,
  extraServices: initialExtraServices,
  taxes: taxesInitial,
  payment: paymentInitial,
  terms: [...DEFAULT_TERMS],
  signatory: {
    authorizedName: "Nityananda Sutar",
    designation: "General Manager",
    hotelName: "Shangri-La's Beach Resort",
    thankYouMessage: "Thank you for choosing Shangri-La's Beach Resort. We look forward to welcoming you!"
  },
  calculations,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const DEFAULT_PAYMENT = paymentInitial;

export const BUILTIN_TEMPLATES: QuotationTemplate[] = [
  {
    id: "tpl-executive-navy",
    name: "Executive Resort (Modern Navy & Amber)",
    description: "Enhanced, pixel-perfect executive resort quotation with navy headers, equal margins, clean boxes, and UPI QR scan card.",
    isDefault: true,
    html: `<div class="quotation-template font-sans text-slate-800 bg-white">
  <!-- Top Header Section -->
  <div class="header-container border-b-2 border-slate-900 pb-5 mb-5">
    <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
      <div class="hotel-info flex-1">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight uppercase">{{hotel_name}}</h1>
        <p class="text-xs sm:text-sm font-bold text-amber-700 tracking-wider uppercase mt-0.5">{{hotel_tagline}}</p>
        <div class="text-xs text-slate-600 mt-2 space-y-0.5 leading-relaxed">
          <p>{{hotel_address}}</p>
          <p>Phone: <span class="font-medium text-slate-800">{{hotel_phone}}</span> &bull; Email: <span class="font-medium text-slate-800">{{hotel_email}}</span></p>
          <p>GSTIN: <span class="font-semibold text-slate-900">{{hotel_gstin}}</span> &bull; Web: {{hotel_website}}</p>
        </div>
      </div>
      <div class="meta-card bg-slate-50 border border-slate-200 rounded-lg p-3 text-right min-w-[210px] w-full sm:w-auto">
        <div class="inline-block bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded tracking-wider uppercase mb-1">
          ROOM QUOTATION
        </div>
        <div class="text-lg font-extrabold text-slate-900 font-mono tracking-tight">{{quotation_number}}</div>
        <div class="text-xs text-slate-600 mt-1">Date: <span class="font-semibold text-slate-800">{{quotation_date}}</span></div>
        <div class="text-xs text-slate-600">Valid Until: <span class="font-bold text-amber-700">{{valid_until}}</span></div>
      </div>
    </div>
  </div>

  <!-- Guest & Stay Details Grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
    <!-- Prepared For Card -->
    <div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
      <div>
        <div class="text-[11px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-200 pb-1.5 mb-2 flex items-center justify-between">
          <span>PREPARED FOR</span>
          <span class="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded font-semibold">{{guest_type}}</span>
        </div>
        <h2 class="text-base font-bold text-slate-900 leading-snug">{{guest_name}}</h2>
        {{#if guest_company}}
        <p class="text-xs font-semibold text-slate-700">{{guest_company}}</p>
        {{/if}}
        <div class="text-xs text-slate-600 mt-1.5 space-y-0.5 leading-relaxed">
          <p>Contact: <span class="font-medium text-slate-800">{{guest_contact_person}}</span> ({{guest_phone}})</p>
          <p>Email: <span class="font-medium text-slate-800">{{guest_email}}</span></p>
          {{#if guest_gstin}}
          <p>GSTIN: <span class="font-mono text-slate-800 font-medium">{{guest_gstin}}</span></p>
          {{/if}}
          <p>{{guest_address}}</p>
          {{#if travel_agency}}
          <p class="text-amber-800 font-medium">Agency: {{travel_agency}}</p>
          {{/if}}
        </div>
      </div>
    </div>

    <!-- Stay Details Card -->
    <div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
      <div class="text-[11px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-200 pb-1.5 mb-2">
        STAY DETAILS
      </div>
      <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <div><span class="text-slate-500">Check-in:</span> <span class="font-bold text-slate-800 ml-1">{{check_in}}</span></div>
        <div><span class="text-slate-500">Check-out:</span> <span class="font-bold text-slate-800 ml-1">{{check_out}}</span></div>
        <div><span class="text-slate-500">Duration:</span> <span class="font-bold text-slate-800 ml-1">{{duration}} Night(s)</span></div>
        <div><span class="text-slate-500">Guests:</span> <span class="font-bold text-slate-800 ml-1">{{adults}} Ad, {{children}} Ch</span></div>
        <div><span class="text-slate-500">Total Rooms:</span> <span class="font-bold text-slate-800 ml-1">{{total_rooms}} Room(s)</span></div>
        <div><span class="text-slate-500">Meal Plan:</span> <span class="font-bold text-amber-800 ml-1">{{meal_plan}}</span></div>
      </div>
      {{#if special_requirement}}
      <div class="mt-2.5 pt-2 border-t border-slate-200 text-xs text-slate-600">
        <span class="font-semibold text-slate-700">Special Request:</span> {{special_requirement}}
      </div>
      {{/if}}
    </div>
  </div>

  <!-- Accommodation Table -->
  <div class="mb-5">
    <div class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">ACCOMMODATION & TARIFF</div>
    <div class="overflow-x-auto rounded-lg border border-slate-200">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-900 text-white font-semibold">
            <th class="py-2.5 px-3">TYPE</th>
            <th class="py-2.5 px-2 text-center">PLAN</th>
            <th class="py-2.5 px-2 text-center">ROOMS</th>
            <th class="py-2.5 px-2 text-center">NIGHTS</th>
            <th class="py-2.5 px-3 text-right">RATE/NT</th>
            <th class="py-2.5 px-2 text-right">DISCOUNT</th>
            <th class="py-2.5 px-3 text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          {{room_rows}}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Extra Services Table (if applicable) -->
  {{#if extra_services_exist}}
  <div class="mb-5">
    <div class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">EXTRA SERVICES & EXPERIENCES</div>
    <div class="overflow-x-auto rounded-lg border border-slate-200">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-800 text-white font-semibold">
            <th class="py-2 px-3">SERVICE</th>
            <th class="py-2 px-2 text-center">QTY</th>
            <th class="py-2 px-3 text-right">RATE</th>
            <th class="py-2 px-3 text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          {{extra_service_rows}}
        </tbody>
      </table>
    </div>
  </div>
  {{/if}}

  <!-- Tariff Breakdown & Grand Total -->
  <div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-5">
    <div class="text-[11px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-200 pb-1.5 mb-2.5">
      TARIFF BREAKDOWN & GRAND TOTAL
    </div>
    <div class="max-w-md ml-auto space-y-1.5 text-xs">
      <div class="flex justify-between text-slate-600">
        <span>Accommodation Total:</span>
        <span class="font-medium text-slate-900">{{accommodation_total}}</span>
      </div>
      {{#if extra_services_exist}}
      <div class="flex justify-between text-slate-600">
        <span>Extra Services Total:</span>
        <span class="font-medium text-slate-900">{{extra_services_total}}</span>
      </div>
      {{/if}}
      <div class="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200">
        <span>Subtotal:</span>
        <span>{{subtotal}}</span>
      </div>
      {{#if discount_amount}}
      <div class="flex justify-between text-emerald-700">
        <span>Discount:</span>
        <span>-{{discount_amount}}</span>
      </div>
      {{/if}}
      <div class="flex justify-between text-slate-600">
        <span>Taxable Amount:</span>
        <span>{{taxable_amount}}</span>
      </div>
      {{#if gst_enabled}}
      <div class="flex justify-between text-slate-600">
        <span>CGST ({{cgst_rate}}%):</span>
        <span>{{cgst_amount}}</span>
      </div>
      <div class="flex justify-between text-slate-600">
        <span>SGST ({{sgst_rate}}%):</span>
        <span>{{sgst_amount}}</span>
      </div>
      {{/if}}
      {{#if other_tax_enabled}}
      <div class="flex justify-between text-slate-600">
        <span>{{other_tax_name}}:</span>
        <span>{{other_tax_amount}}</span>
      </div>
      {{/if}}
      <div class="flex justify-between items-center bg-slate-900 text-white p-2.5 rounded font-extrabold text-sm sm:text-base mt-2">
        <span>GRAND TOTAL:</span>
        <span class="text-amber-400 font-mono">{{grand_total}}</span>
      </div>
      <div class="text-right text-[11px] text-slate-500 italic pt-0.5">
        {{amount_in_words}}
      </div>
    </div>
  </div>

  <!-- Payment & UPI Details -->
  <div class="border border-slate-200 rounded-lg p-3.5 mb-5 bg-slate-50">
    <div class="text-[11px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-200 pb-1.5 mb-3">
      PAYMENT & UPI PAYMENT DETAILS
    </div>
    <div class="flex flex-col sm:flex-row gap-4 items-start justify-between">
      <div class="flex-1 text-xs space-y-1 text-slate-700">
        <p><span class="text-slate-500 w-24 inline-block">Bank:</span> <span class="font-bold text-slate-900">{{bank_name}}</span></p>
        <p><span class="text-slate-500 w-24 inline-block">A/C Name:</span> <span class="font-bold text-slate-900">{{account_name}}</span></p>
        <p><span class="text-slate-500 w-24 inline-block">A/C No:</span> <span class="font-mono font-bold text-slate-900">{{account_number}}</span></p>
        <p><span class="text-slate-500 w-24 inline-block">IFSC Code:</span> <span class="font-mono font-bold text-slate-900">{{ifsc}}</span></p>
        <p><span class="text-slate-500 w-24 inline-block">Branch:</span> <span class="text-slate-800">{{branch}}</span></p>
        <div class="mt-2 p-2 bg-white rounded border border-dashed border-slate-300">
          <span class="text-slate-500 font-semibold">UPI ID:</span> <span class="font-mono font-bold text-slate-900">{{upi_id}}</span>
        </div>
        <div class="pt-2 text-xs text-slate-700">
          <p><span class="font-bold text-slate-900">Payable Advance:</span> <span class="text-amber-800 font-bold">{{advance_amount}}</span> ({{advance_percentage}}% Advance)</p>
          <p class="text-slate-500 text-[11px] mt-0.5">{{payment_note}}</p>
        </div>
      </div>
      <div class="qr-container bg-white border border-slate-200 rounded-lg p-2.5 text-center sm:w-44 w-full flex flex-col items-center justify-center">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">SCAN & PAY VIA UPI</div>
        {{upi_qr_element}}
        <div class="text-xs font-bold text-slate-900 mt-1.5">{{advance_amount}}</div>
        <div class="text-[9px] text-slate-400 mt-0.5">GPay | PhonePe | Paytm | BHIM</div>
      </div>
    </div>
  </div>

  <!-- Booking Terms -->
  <div class="border border-slate-200 rounded-lg p-3.5 mb-5 bg-slate-50">
    <div class="text-[11px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-200 pb-1.5 mb-2">
      BOOKING TERMS & STAY POLICIES
    </div>
    <ol class="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed">
      {{booking_terms_list}}
    </ol>
  </div>

  <!-- Authorized Signatory & Footer -->
  <div class="flex flex-col sm:flex-row justify-between items-end gap-6 pt-2 pb-1 border-t border-slate-200">
    <div class="signatory-box text-center sm:text-left">
      <div class="signature-area my-2 min-h-[44px] flex items-center">
        {{signature_element}}
      </div>
      <div class="text-xs font-bold text-slate-900">{{authorized_name}}</div>
      <div class="text-[11px] text-slate-500">{{designation}}</div>
    </div>
    <div class="text-center sm:text-right flex-1">
      <p class="text-xs font-semibold text-slate-800">{{thank_you_message}}</p>
      <p class="text-[11px] text-slate-500 mt-1">Phone: {{hotel_phone}} &bull; Email: {{hotel_email}}</p>
      <p class="text-[11px] text-slate-500">Web: {{hotel_website}}</p>
    </div>
  </div>
</div>`,
    css: `.quotation-template {
  width: 100%;
  max-width: 780px;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
  overflow-wrap: anywhere;
}
.quotation-template img { max-width: 100%; height: auto; }
@media (max-width: 640px) {
  .quotation-template { padding: 10px; width: 100%; max-width: 100%; }
  .quotation-template table { width: 100% !important; table-layout: fixed; }
  .quotation-template th, .quotation-template td { overflow-wrap: anywhere; word-break: normal; }
  .quotation-template .signatory-box { min-width: 0; }
}`,
    createdAt: "2026-09-21T00:00:00.000Z",
    updatedAt: "2026-09-21T00:00:00.000Z"
  },
  {
    id: "tpl-minimal-corporate",
    name: "Minimal Corporate Luxury",
    description: "Sleek, high-contrast monochrome design with crisp dividing rules and subtle slate accents for business & luxury resorts.",
    isDefault: false,
    html: `<div class="quotation-template font-sans text-slate-800 bg-white">
  <div class="border-b-4 border-slate-900 pb-4 mb-5 flex justify-between items-end">
    <div>
      <h1 class="text-2xl font-black text-slate-900 uppercase tracking-tight">{{hotel_name}}</h1>
      <p class="text-xs text-slate-500 uppercase tracking-widest">{{hotel_tagline}}</p>
    </div>
    <div class="text-right">
      <div class="text-xs font-mono text-slate-500">QUOTATION REF</div>
      <div class="text-base font-bold text-slate-900 font-mono">{{quotation_number}}</div>
      <div class="text-[11px] text-slate-600">{{quotation_date}}</div>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-5">
    <div class="p-3 border-l-2 border-slate-900 bg-slate-50">
      <div class="font-bold text-slate-900 uppercase mb-1">RESERVATION FOR:</div>
      <div class="font-bold text-sm text-slate-900">{{guest_name}}</div>
      <div class="text-slate-600 mt-1">{{guest_email}} | {{guest_phone}}</div>
      <div class="text-slate-500 mt-0.5">{{guest_address}}</div>
    </div>
    <div class="p-3 border-l-2 border-slate-400 bg-slate-50">
      <div class="font-bold text-slate-900 uppercase mb-1">SCHEDULE:</div>
      <div>Dates: <span class="font-bold">{{check_in}}</span> to <span class="font-bold">{{check_out}}</span> ({{duration}} Nights)</div>
      <div>Guests: {{adults}} Adults, {{children}} Children | Rooms: {{total_rooms}}</div>
      <div>Meal Plan: <span class="font-bold text-slate-900">{{meal_plan}}</span></div>
    </div>
  </div>

  <div class="mb-5">
    <table class="w-full text-xs text-left border border-slate-200">
      <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
        <tr>
          <th class="p-2">TYPE</th>
          <th class="p-2 text-center">PLAN</th>
          <th class="p-2 text-center">ROOMS</th>
          <th class="p-2 text-center">NIGHTS</th>
          <th class="p-2 text-right">RATE</th>
          <th class="p-2 text-right">DISC</th>
          <th class="p-2 text-right">AMOUNT</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {{room_rows}}
      </tbody>
    </table>
  </div>

  {{#if extra_services_exist}}
  <div class="mb-5">
    <table class="w-full text-xs text-left border border-slate-200">
      <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
        <tr>
          <th class="p-2">ADD-ON SERVICE</th>
          <th class="p-2 text-center">QTY</th>
          <th class="p-2 text-right">RATE</th>
          <th class="p-2 text-right">AMOUNT</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {{extra_service_rows}}
      </tbody>
    </table>
  </div>
  {{/if}}

  <div class="flex flex-col sm:flex-row justify-between gap-6 mb-5">
    <div class="flex-1 text-xs border p-3 rounded">
      <div class="font-bold text-slate-900 mb-1">PAYMENT INSTRUCTIONS</div>
      <div>Bank: {{bank_name}}</div>
      <div>A/C: {{account_number}} (IFSC: {{ifsc}})</div>
      <div>UPI: <span class="font-mono font-bold">{{upi_id}}</span></div>
      <div class="mt-2 font-bold text-slate-900">Required Advance: {{advance_amount}} ({{advance_percentage}}%)</div>
    </div>
    <div class="w-full sm:w-64 text-xs space-y-1">
      <div class="flex justify-between"><span>Accommodation:</span><span>{{accommodation_total}}</span></div>
      {{#if extra_services_exist}}
      <div class="flex justify-between"><span>Extra Services:</span><span>{{extra_services_total}}</span></div>
      {{/if}}
      <div class="flex justify-between font-bold border-t pt-1"><span>Subtotal:</span><span>{{subtotal}}</span></div>
      {{#if gst_enabled}}
      <div class="flex justify-between text-slate-600"><span>GST:</span><span>{{cgst_amount}} + {{sgst_amount}}</span></div>
      {{/if}}
      <div class="flex justify-between font-extrabold text-base border-t-2 border-slate-900 pt-1">
        <span>TOTAL:</span>
        <span>{{grand_total}}</span>
      </div>
      <div class="text-[10px] text-slate-500 italic text-right">{{amount_in_words}}</div>
    </div>
  </div>

  <div class="border-t pt-4 flex justify-between items-end text-xs text-slate-500">
    <div>
      <div class="font-bold text-slate-800">{{authorized_name}}</div>
      <div>{{designation}}, {{hotel_name}}</div>
    </div>
    <div class="text-right">
      <div>{{hotel_phone}} | {{hotel_email}}</div>
    </div>
  </div>
</div>`,
    css: `.quotation-template {
  max-width: 780px;
  margin: 0 auto;
  padding: 24px;
}`,
    createdAt: "2026-09-21T00:00:00.000Z",
    updatedAt: "2026-09-21T00:00:00.000Z"
  }
];

export const DEFAULT_HOTEL_INFO = DEFAULT_HOTEL;
export const DEFAULT_BANK_PAYMENT: BankPaymentInfo = {
  ...DEFAULT_SETTINGS.defaultPayment,
  advanceAmount: 0,
  balanceAmount: 0
};
export const DEFAULT_BOOKING_TERMS = DEFAULT_TERMS;
export const SAMPLE_QUOTATION_DATA = DEFAULT_QUOTATION;

export interface PlaceholderItem {
  tag: string;
  description: string;
}

export interface PlaceholderGroup {
  category: string;
  tags: PlaceholderItem[];
}

export const TEMPLATE_PLACEHOLDERS_DOCS: PlaceholderGroup[] = [
  {
    category: 'Property & Resort',
    tags: [
      { tag: '{{hotel_name}}', description: 'Hotel / Resort Name' },
      { tag: '{{hotel_tagline}}', description: 'Tagline / Subtitle' },
      { tag: '{{hotel_address}}', description: 'Full Address' },
      { tag: '{{hotel_phone}}', description: 'Phone Number' },
      { tag: '{{hotel_email}}', description: 'Official Email' },
      { tag: '{{hotel_gstin}}', description: 'Resort GSTIN' },
      { tag: '{{hotel_website}}', description: 'Website URL' }
    ]
  },
  {
    category: 'Quotation Details',
    tags: [
      { tag: '{{quotation_number}}', description: 'Quotation Number' },
      { tag: '{{quotation_date}}', description: 'Issued Date' },
      { tag: '{{valid_until}}', description: 'Validity Date' }
    ]
  },
  {
    category: 'Guest Information',
    tags: [
      { tag: '{{guest_name}}', description: 'Guest / Lead Name' },
      { tag: '{{guest_contact_person}}', description: 'Contact Person' },
      { tag: '{{guest_phone}}', description: 'Guest Phone' },
      { tag: '{{guest_email}}', description: 'Guest Email' },
      { tag: '{{guest_gstin}}', description: 'Guest GSTIN' },
      { tag: '{{guest_address}}', description: 'Guest Billing Address' },
      { tag: '{{travel_agency}}', description: 'Travel Agency Name' },
      { tag: '{{guest_type}}', description: 'Guest Type' }
    ]
  },
  {
    category: 'Stay & Occupancy',
    tags: [
      { tag: '{{check_in}}', description: 'Check-in Date' },
      { tag: '{{check_out}}', description: 'Check-out Date' },
      { tag: '{{duration}}', description: 'Duration in Nights' },
      { tag: '{{adults}}', description: 'Adults Count' },
      { tag: '{{children}}', description: 'Children Count' },
      { tag: '{{total_rooms}}', description: 'Total Rooms' },
      { tag: '{{meal_plan}}', description: 'Meal Plan (EP/CP/MAP/AP)' },
      { tag: '{{special_requirement}}', description: 'Special Request Note' }
    ]
  },
  {
    category: 'Tables & Line Items',
    tags: [
      { tag: '{{room_rows}}', description: 'Pre-rendered Rooms Table Rows' },
      { tag: '{{extra_service_rows}}', description: 'Pre-rendered Add-on Table Rows' }
    ]
  },
  {
    category: 'Financial Totals',
    tags: [
      { tag: '{{accommodation_total}}', description: 'Rooms Total' },
      { tag: '{{extra_services_total}}', description: 'Extra Services Total' },
      { tag: '{{subtotal}}', description: 'Subtotal Amount' },
      { tag: '{{discount_amount}}', description: 'Discount Amount' },
      { tag: '{{taxable_amount}}', description: 'Taxable Base' },
      { tag: '{{cgst_amount}}', description: 'CGST Amount' },
      { tag: '{{sgst_amount}}', description: 'SGST Amount' },
      { tag: '{{grand_total}}', description: 'Grand Total (₹)' },
      { tag: '{{amount_in_words}}', description: 'Total in Indian Words' }
    ]
  },
  {
    category: 'Bank & UPI',
    tags: [
      { tag: '{{bank_name}}', description: 'Bank Name' },
      { tag: '{{account_name}}', description: 'Account Beneficiary' },
      { tag: '{{account_number}}', description: 'Account Number' },
      { tag: '{{ifsc}}', description: 'Bank IFSC Code' },
      { tag: '{{branch}}', description: 'Branch' },
      { tag: '{{upi_id}}', description: 'VPA / UPI ID' },
      { tag: '{{upi_qr_element}}', description: 'Scan & Pay QR Image' },
      { tag: '{{advance_amount}}', description: 'Required Advance Amount' },
      { tag: '{{advance_percentage}}', description: 'Advance Percentage (%)' },
      { tag: '{{balance_amount}}', description: 'Balance Due Amount' },
      { tag: '{{payment_due_date}}', description: 'Payment Due Date' }
    ]
  },
  {
    category: 'Terms & Signatory',
    tags: [
      { tag: '{{booking_terms_list}}', description: 'Rendered Terms <li> list' },
      { tag: '{{authorized_name}}', description: 'Signatory Name' },
      { tag: '{{designation}}', description: 'Signatory Title' },
      { tag: '{{signature_element}}', description: 'Signature / Seal Graphic' },
      { tag: '{{thank_you_message}}', description: 'Hospitality Message' }
    ]
  }
];
