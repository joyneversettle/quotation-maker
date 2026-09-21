export type GuestType = 'INDIVIDUAL' | 'CORPORATE' | 'TRAVEL_AGENT' | 'GROUP';
export type MealPlan = 'EP' | 'CP' | 'MAP' | 'AP';
export type DiscountType = 'PERCENT' | 'FIXED';

export interface HotelInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  website: string;
  logoUrl?: string;
  propertyImageUrl?: string;
  bannerImageUrl?: string;
}

export interface GuestInfo {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  travelAgency: string;
  guestType: GuestType;
}

export interface StayDetails {
  checkIn: string;
  checkOut: string;
  durationNights: number;
  adults: number;
  children: number;
  totalRooms: number;
  extraMattress: number;
  cnb: number; // Child No Bed
  mealPlan: MealPlan;
  specialRequirement: string;
}

export interface RoomRow {
  id: string;
  roomType: string;
  mealPlan: MealPlan;
  roomsCount: number;
  nightsCount: number;
  ratePerNight: number;
  discountType: DiscountType;
  discountValue: number;
  calculatedAmount: number;
}

export interface ExtraServiceRow {
  id: string;
  serviceName: string;
  quantity: number;
  rate: number;
  calculatedAmount: number;
}

export interface TaxSettings {
  enableGst: boolean;
  cgstPercent: number;
  sgstPercent: number;
  enableOtherTax: boolean;
  otherTaxName: string;
  otherTaxPercent: number;
  overallDiscountType: DiscountType;
  overallDiscountValue: number;
}

export interface PaymentDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
  upiQrImage?: string;
  qrCodeDataUrl?: string;
  qrCodeImageUrl?: string;
  payableAdvancePercent: number;
  advanceAmount: number;
  balanceAmount: number;
  paymentDueDate: string;
  note: string;
}

export type BankPaymentInfo = PaymentDetails;

export interface BookingTerm {
  id: string;
  text: string;
}

export interface Signatory {
  authorizedName: string;
  designation: string;
  signatureImageUrl?: string;
  hotelName?: string;
  thankYouMessage: string;
}

export interface QuotationCalculations {
  accommodationTotal: number;
  extraServicesTotal: number;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  otherTaxAmount: number;
  grandTotal: number;
  payableAdvance: number;
  balanceAmount: number;
  amountInWords: string;
}

export interface QuotationData {
  id: string;
  title: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  templateId: string;
  hotel: HotelInfo;
  guest: GuestInfo;
  stay: StayDetails;
  rooms: RoomRow[];
  extraServices: ExtraServiceRow[];
  taxes: TaxSettings;
  payment: PaymentDetails;
  terms: BookingTerm[];
  signatory: Signatory;
  calculations: QuotationCalculations;
  calculatedSummary?: QuotationCalculations;
  bannerImageUrl?: string;
  showPromoBanner?: boolean;
  promoBannerShowInEmail?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  html: string;
  css: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogServiceItem {
  id: string;
  serviceName: string;
  rate: number;
}

export interface CatalogRoomItem {
  id: string;
  roomType: string;
  defaultRate: number;
  mealPlan: MealPlan;
}

export interface PromoBannerConfig {
  enabled: boolean;
  badge: string;
  text: string;
  discountCode: string;
  discountPercent: number;
  bannerImageUrl?: string;
  showInEmail?: boolean;
}

export interface AppSettings {
  defaultHotel: HotelInfo;
  defaultPayment: Omit<PaymentDetails, 'advanceAmount' | 'balanceAmount'>;
  defaultTerms: BookingTerm[];
  defaultSignatory: Signatory;
  defaultTaxes: TaxSettings;
  extraServicesCatalog?: CatalogServiceItem[];
  roomTypesCatalog?: CatalogRoomItem[];
  promoBanner?: PromoBannerConfig;
}
