import React, { useRef } from 'react';
import { 
  QuotationData, 
  RoomRow, 
  ExtraServiceRow, 
  BookingTerm, 
  GuestType, 
  MealPlan, 
  DiscountType,
  QuotationTemplate
} from '../types/quotation';
import { calculateNights, formatINR } from '../utils/calculations';
import { NumberStepper } from './NumberStepper';
import { resolveQrImageSrc } from '../utils/qrGenerator';
import { 
  Building2, 
  FileCheck, 
  User, 
  Calendar, 
  BedDouble, 
  Sparkles, 
  Receipt, 
  CreditCard, 
  ScrollText, 
  PenTool, 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Upload, 
  QrCode,
  RotateCcw,
  Eye,
  Save,
  CheckCircle2
} from 'lucide-react';

interface QuotationFormProps {
  data: QuotationData;
  onChange: (updated: QuotationData) => void;
  templates: QuotationTemplate[];
  onGenerateQr: () => void;
  onResetTermsToDefault: () => void;
  onOpenPreview?: () => void;
  onSaveQuotation?: () => void;
}

const COMMON_ROOM_TYPES = [
  'Deluxe Garden View Room',
  'Deluxe Sea View Room',
  'Luxury Beach Cottage',
  'Premium Wooden Cottage',
  'Family Suite',
  'Presidential Villa',
  'Standard AC Room'
];

const COMMON_EXTRA_SERVICES = [
  'Airport / Harbor Speedboat Transfer (Round Trip)',
  'Candle Light Beachside Dinner',
  'Extra Mattress with Linen',
  'Child No Bed (CNB) Meal Charge',
  'Scuba Diving & Underwater Photography',
  'Snorkeling & Coral Island Boat Excursion',
  'Honeymoon Bed Floral Decoration & Cake',
  'Mandatory Gala Dinner Surcharge'
];

export const QuotationForm: React.FC<QuotationFormProps> = ({
  data,
  onChange,
  templates,
  onGenerateQr,
  onResetTermsToDefault,
  onOpenPreview,
  onSaveQuotation
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Effective QR code URL for display
  const effectiveQr = resolveQrImageSrc(data, false);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        onChange({
          ...data,
          payment: {
            ...data.payment,
            upiQrImage: res,
            qrCodeDataUrl: res
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearQr = () => {
    onChange({
      ...data,
      payment: {
        ...data.payment,
        upiQrImage: '',
        qrCodeDataUrl: '',
        qrCodeImageUrl: ''
      }
    });
  };

  // Helper updates
  const updateHotel = (field: string, val: string) => {
    onChange({
      ...data,
      hotel: { ...data.hotel, [field]: val }
    });
  };

  const updateMeta = (field: string, val: string) => {
    onChange({
      ...data,
      [field]: val
    });
  };

  const updateGuest = (field: string, val: any) => {
    onChange({
      ...data,
      guest: { ...data.guest, [field]: val }
    });
  };

  const updateStay = (field: string, val: any) => {
    const updatedStay = { ...data.stay, [field]: val };
    
    // Auto calculate duration if checkIn or checkOut changed
    if (field === 'checkIn' || field === 'checkOut') {
      const nights = calculateNights(
        field === 'checkIn' ? val : data.stay.checkIn,
        field === 'checkOut' ? val : data.stay.checkOut
      );
      updatedStay.durationNights = nights;

      // Update nights in room rows as well
      const updatedRooms = data.rooms.map(r => ({ ...r, nightsCount: nights }));
      onChange({
        ...data,
        stay: updatedStay,
        rooms: updatedRooms
      });
      return;
    }

    onChange({
      ...data,
      stay: updatedStay
    });
  };

  // ROOM ROWS HANDLERS
  const addRoomRow = () => {
    const newRoom: RoomRow = {
      id: `room-${Date.now()}`,
      roomType: 'Deluxe Garden View Room',
      mealPlan: data.stay.mealPlan || 'CP',
      roomsCount: 1,
      nightsCount: data.stay.durationNights || 1,
      ratePerNight: 5000,
      discountType: 'FIXED',
      discountValue: 0,
      calculatedAmount: 5000 * (data.stay.durationNights || 1)
    };
    onChange({
      ...data,
      rooms: [...data.rooms, newRoom]
    });
  };

  const updateRoomRow = (id: string, field: keyof RoomRow, value: any) => {
    const updatedRooms = data.rooms.map((r) => {
      if (r.id !== id) return r;
      return { ...r, [field]: value };
    });
    onChange({ ...data, rooms: updatedRooms });
  };

  const duplicateRoomRow = (index: number) => {
    const source = data.rooms[index];
    const copy: RoomRow = {
      ...source,
      id: `room-${Date.now()}`
    };
    const updated = [...data.rooms];
    updated.splice(index + 1, 0, copy);
    onChange({ ...data, rooms: updated });
  };

  const deleteRoomRow = (id: string) => {
    if (data.rooms.length <= 1) {
      alert('At least one room row is required.');
      return;
    }
    onChange({
      ...data,
      rooms: data.rooms.filter((r) => r.id !== id)
    });
  };

  const reorderRoomRow = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.rooms.length) return;
    const updated = [...data.rooms];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    onChange({ ...data, rooms: updated });
  };

  // EXTRA SERVICES HANDLERS
  const addExtraServiceRow = () => {
    const newService: ExtraServiceRow = {
      id: `extra-${Date.now()}`,
      serviceName: 'Airport / Harbor Transfer',
      quantity: 1,
      rate: 1500,
      calculatedAmount: 1500
    };
    onChange({
      ...data,
      extraServices: [...data.extraServices, newService]
    });
  };

  const updateExtraServiceRow = (id: string, field: keyof ExtraServiceRow, value: any) => {
    const updatedServices = data.extraServices.map((s) => {
      if (s.id !== id) return s;
      return { ...s, [field]: value };
    });
    onChange({ ...data, extraServices: updatedServices });
  };

  const duplicateExtraServiceRow = (index: number) => {
    const source = data.extraServices[index];
    const copy: ExtraServiceRow = {
      ...source,
      id: `extra-${Date.now()}`
    };
    const updated = [...data.extraServices];
    updated.splice(index + 1, 0, copy);
    onChange({ ...data, extraServices: updated });
  };

  const deleteExtraServiceRow = (id: string) => {
    onChange({
      ...data,
      extraServices: data.extraServices.filter((s) => s.id !== id)
    });
  };

  // TAXES HANDLERS
  const updateTaxes = (field: string, value: any) => {
    onChange({
      ...data,
      taxes: { ...data.taxes, [field]: value }
    });
  };

  // PAYMENT HANDLERS
  const updatePayment = (field: string, value: any) => {
    onChange({
      ...data,
      payment: { ...data.payment, [field]: value }
    });
  };

  // TERMS HANDLERS
  const addTerm = () => {
    const newTerm: BookingTerm = {
      id: `term-${Date.now()}`,
      text: 'New booking condition or resort policy note.'
    };
    onChange({
      ...data,
      terms: [...data.terms, newTerm]
    });
  };

  const updateTerm = (id: string, text: string) => {
    const updatedTerms = data.terms.map((t) => {
      if (t.id !== id) return t;
      return { ...t, text };
    });
    onChange({ ...data, terms: updatedTerms });
  };

  const deleteTerm = (id: string) => {
    onChange({
      ...data,
      terms: data.terms.filter((t) => t.id !== id)
    });
  };

  const reorderTerm = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.terms.length) return;
    const updated = [...data.terms];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    onChange({ ...data, terms: updated });
  };

  // SIGNATORY HANDLERS
  const updateSignatory = (field: string, value: string) => {
    onChange({
      ...data,
      signatory: { ...data.signatory, [field]: value }
    });
  };

  // FILE UPLOAD HELPERS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (dataUrl: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const res = uploadEvent.target?.result as string;
      if (res) callback(res);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="quotation-form-container" className="space-y-5 pb-12">

      {/* Top Form Header Action Bar */}
      <div id="quotation-form-top-bar" className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 font-bold shrink-0">
            <FileCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Quotation Editor
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200">
                {data.quotationNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {data.guest?.name ? `Guest: ${data.guest.name} • Clean Full-Width View` : 'Complete the quotation details and click Preview to review or send'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenPreview && (
            <button
              id="btn-form-preview-top"
              type="button"
              onClick={onOpenPreview}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow-sm transition-all hover:shadow hover:scale-102 cursor-pointer"
              title="Preview formatted quotation in A4 / Email view"
            >
              <Eye className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Preview Quotation</span>
            </button>
          )}
          {onSaveQuotation && (
            <button
              type="button"
              onClick={onSaveQuotation}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              title="Save Quotation"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Property Details Card */}
      <div id="section-property-details" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Property Details</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Hotel / Resort Information</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Hotel / Resort Name *</label>
            <input
              type="text"
              id="input-hotel-name"
              value={data.hotel.name}
              onChange={(e) => updateHotel('name', e.target.value)}
              placeholder="e.g. Shangri-La's Beach Resort"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none text-slate-900 font-medium"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Tagline / Subtitle</label>
            <input
              type="text"
              id="input-hotel-tagline"
              value={data.hotel.tagline}
              onChange={(e) => updateHotel('tagline', e.target.value)}
              placeholder="e.g. OCEAN BREEZE & ISLAND PEACE"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Full Address *</label>
            <input
              type="text"
              id="input-hotel-address"
              value={data.hotel.address}
              onChange={(e) => updateHotel('address', e.target.value)}
              placeholder="e.g. Vijay Nagar, Swaraj Dweep - 744211"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
            <input
              type="text"
              id="input-hotel-phone"
              value={data.hotel.phone}
              onChange={(e) => updateHotel('phone', e.target.value)}
              placeholder="+91 9474252177"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
            <input
              type="email"
              id="input-hotel-email"
              value={data.hotel.email}
              onChange={(e) => updateHotel('email', e.target.value)}
              placeholder="shangrilasbeachresort@gmail.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
            <input
              type="text"
              id="input-hotel-gstin"
              value={data.hotel.gstin}
              onChange={(e) => updateHotel('gstin', e.target.value.toUpperCase())}
              placeholder="35CIAPS8902B1ZG"
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-slate-900 outline-none text-slate-800 uppercase"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Website</label>
            <input
              type="text"
              id="input-hotel-website"
              value={data.hotel.website}
              onChange={(e) => updateHotel('website', e.target.value)}
              placeholder="www.shangrilasbeachresort.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* 2. Quotation Meta Card */}
      <div id="section-quotation-meta" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Quotation Details</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Reference &amp; Validity</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Quotation Number *</label>
            <input
              type="text"
              id="input-quotation-number"
              value={data.quotationNumber}
              onChange={(e) => updateMeta('quotationNumber', e.target.value)}
              placeholder="QT-202609-9013"
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono font-bold focus:ring-1 focus:ring-slate-900 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Quotation Date *</label>
            <input
              type="date"
              id="input-quotation-date"
              value={data.quotationDate}
              onChange={(e) => updateMeta('quotationDate', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Valid Until *</label>
            <input
              type="date"
              id="input-quotation-valid-until"
              value={data.validUntil}
              onChange={(e) => updateMeta('validUntil', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-semibold text-slate-700 mb-1">Selected Quotation Template</label>
            <select
              id="select-quotation-template"
              value={data.templateId}
              onChange={(e) => updateMeta('templateId', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-slate-900 outline-none text-slate-900 font-medium"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} {tpl.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Guest Details Card */}
      <div id="section-guest-details" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Guest Details</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Prepared For</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Guest / Company Name *</label>
            <input
              type="text"
              id="input-guest-name"
              value={data.guest.name}
              onChange={(e) => updateGuest('name', e.target.value)}
              placeholder="e.g. Rajesh Kumar & Family"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Guest Type</label>
            <select
              id="select-guest-type"
              value={data.guest.guestType}
              onChange={(e) => updateGuest('guestType', e.target.value as GuestType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            >
              <option value="INDIVIDUAL">INDIVIDUAL</option>
              <option value="CORPORATE">CORPORATE</option>
              <option value="TRAVEL_AGENT">TRAVEL AGENT</option>
              <option value="GROUP">GROUP BOOKING</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
            <input
              type="text"
              id="input-guest-contact-person"
              value={data.guest.contactPerson}
              onChange={(e) => updateGuest('contactPerson', e.target.value)}
              placeholder="e.g. Mr. Rajesh Kumar"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              id="input-guest-phone"
              value={data.guest.phone}
              onChange={(e) => updateGuest('phone', e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              id="input-guest-email"
              value={data.guest.email}
              onChange={(e) => updateGuest('email', e.target.value)}
              placeholder="rajesh.kumar@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Guest GST Number (Optional)</label>
            <input
              type="text"
              id="input-guest-gstin"
              value={data.guest.gstin}
              onChange={(e) => updateGuest('gstin', e.target.value.toUpperCase())}
              placeholder="29AABCU9603R1ZM"
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-slate-900 outline-none text-slate-800 uppercase"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Travel Agency Name (if any)</label>
            <input
              type="text"
              id="input-guest-travel-agency"
              value={data.guest.travelAgency}
              onChange={(e) => updateGuest('travelAgency', e.target.value)}
              placeholder="e.g. Island Trails Holidays"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Guest Address / City</label>
            <input
              type="text"
              id="input-guest-address"
              value={data.guest.address}
              onChange={(e) => updateGuest('address', e.target.value)}
              placeholder="Indiranagar, Bengaluru, Karnataka"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* 4. Stay Details Card */}
      <div id="section-stay-details" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Stay Details</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Dates &amp; Occupancy</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Check-in *</label>
            <input
              type="date"
              id="input-stay-checkin"
              value={data.stay.checkIn}
              onChange={(e) => updateStay('checkIn', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Check-out *</label>
            <input
              type="date"
              id="input-stay-checkout"
              value={data.stay.checkOut}
              onChange={(e) => updateStay('checkOut', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nights (Duration)</label>
            <NumberStepper
              min={1}
              id="input-stay-duration"
              value={data.stay.durationNights}
              onChange={(e) => updateStay('durationNights', Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold focus:ring-1 focus:ring-slate-900 outline-none text-slate-900 bg-slate-50"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Default Meal Plan</label>
            <select
              id="select-stay-meal-plan"
              value={data.stay.mealPlan}
              onChange={(e) => updateStay('mealPlan', e.target.value as MealPlan)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-slate-900 outline-none text-slate-800 font-semibold"
            >
              <option value="EP">EP (Room Only)</option>
              <option value="CP">CP (With Breakfast)</option>
              <option value="MAP">MAP (Breakfast + Dinner)</option>
              <option value="AP">AP (All Meals)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Adults</label>
            <NumberStepper
              min={1}
              id="input-stay-adults"
              value={data.stay.adults}
              onChange={(e) => updateStay('adults', Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Children</label>
            <NumberStepper
              min={0}
              id="input-stay-children"
              value={data.stay.children}
              onChange={(e) => updateStay('children', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Total Rooms</label>
            <NumberStepper
              min={1}
              id="input-stay-total-rooms"
              value={data.stay.totalRooms}
              onChange={(e) => updateStay('totalRooms', Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Extra Bed / Mattress</label>
            <NumberStepper
              min={0}
              id="input-stay-extra-mattress"
              value={data.stay.extraMattress}
              onChange={(e) => updateStay('extraMattress', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div className="col-span-2 sm:col-span-4">
            <label className="block font-semibold text-slate-700 mb-1">Special Requirement Note</label>
            <input
              type="text"
              id="input-stay-special-requirement"
              value={data.stay.specialRequirement}
              onChange={(e) => updateStay('specialRequirement', e.target.value)}
              placeholder="e.g. Ground floor cottage with quiet tropical garden view requested."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* 5. Room Details & Tariff Table */}
      <div id="section-room-details" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Accommodation &amp; Tariff</h3>
          </div>
          <button
            type="button"
            id="btn-add-room-row"
            onClick={addRoomRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0B1B3D] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Room Row</span>
          </button>
        </div>

        <div className="space-y-3">
          {data.rooms.map((room, idx) => {
            const baseTotal = (room.roomsCount || 1) * (room.nightsCount || 1) * (room.ratePerNight || 0);
            const discAmount = room.discountType === 'PERCENT'
              ? (baseTotal * (room.discountValue || 0)) / 100
              : (room.discountValue || 0);
            const netTotal = Math.max(0, baseTotal - discAmount);

            return (
              <div
                key={room.id}
                id={`room-card-${room.id}`}
                className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 hover:bg-slate-50 transition-colors shadow-xs"
              >
                {/* Card Header: Room # + Reorder/Duplicate/Delete */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#0B1B3D] text-amber-300 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800">Room Item #{idx + 1}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => reorderRoomRow(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => reorderRoomRow(idx, 'down')}
                      disabled={idx === data.rooms.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateRoomRow(idx)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRoomRow(room.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                      title="Delete Room"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 1: Room Category + Meal Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3 text-xs">
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Room Category / Type</label>
                    <input
                      type="text"
                      list="room-type-suggestions"
                      value={room.roomType}
                      onChange={(e) => updateRoomRow(room.id, 'roomType', e.target.value)}
                      placeholder="e.g. Deluxe Garden View Room"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                    <datalist id="room-type-suggestions">
                      {COMMON_ROOM_TYPES.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Meal Plan</label>
                    <select
                      value={room.mealPlan}
                      onChange={(e) => updateRoomRow(room.id, 'mealPlan', e.target.value as MealPlan)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-bold focus:ring-1 focus:ring-slate-900 outline-none"
                    >
                      <option value="EP">EP (Room Only)</option>
                      <option value="CP">CP (Bed &amp; Breakfast)</option>
                      <option value="MAP">MAP (Breakfast + Dinner)</option>
                      <option value="AP">AP (All Meals Included)</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Occupancy, Rates, and Spacious Discount Container */}
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 text-xs items-start">
                  {/* Rooms Count */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rooms</label>
                    <NumberStepper
                      min={1}
                      value={room.roomsCount}
                      onChange={(e) => updateRoomRow(room.id, 'roomsCount', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-center font-bold focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  {/* Nights Count */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nights</label>
                    <NumberStepper
                      min={1}
                      value={room.nightsCount}
                      onChange={(e) => updateRoomRow(room.id, 'nightsCount', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-center font-bold focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  {/* Rate Per Night */}
                  <div className="col-span-2 sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rate / Night (₹)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                      <NumberStepper
                        min={0}
                        value={room.ratePerNight}
                        onChange={(e) => updateRoomRow(room.id, 'ratePerNight', Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full pl-6 pr-2.5 py-2 border border-slate-300 rounded-lg bg-white text-right font-mono font-bold focus:ring-1 focus:ring-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* DISCOUNT BOX - Uncropped, spacious, full width */}
                  <div className="col-span-2 sm:col-span-5">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">Room Discount</label>
                      {discAmount > 0 && (
                        <span className="text-[10px] text-emerald-600 font-bold">
                          -₹{discAmount.toLocaleString('en-IN')} OFF
                        </span>
                      )}
                    </div>

                    <div className="flex items-stretch rounded-lg border border-slate-300 bg-white focus-within:ring-1 focus-within:ring-slate-900 focus-within:border-slate-900 overflow-hidden shadow-2xs">
                      <NumberStepper
                        min={0}
                        value={room.discountValue}
                        onChange={(e) => updateRoomRow(room.id, 'discountValue', Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full min-w-[70px] px-3 py-2 text-right font-mono font-bold text-slate-900 outline-none"
                      />
                      <select
                        value={room.discountType}
                        onChange={(e) => updateRoomRow(room.id, 'discountType', e.target.value as DiscountType)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border-l border-slate-300 text-slate-800 text-xs font-bold cursor-pointer outline-none shrink-0"
                      >
                        <option value="FIXED">Flat (₹)</option>
                        <option value="PERCENT">Percent (%)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Line Item Calculation Breakdown */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {room.roomsCount} Rms × {room.nightsCount} Nts @ ₹{(room.ratePerNight || 0).toLocaleString('en-IN')}
                    {discAmount > 0 && ` (-₹${discAmount.toLocaleString('en-IN')} discount)`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-500">Room Total:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ₹{netTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Extra Services Card */}
      <div id="section-extra-services" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Extra Services &amp; Experiences</h3>
          </div>
          <button
            type="button"
            id="btn-add-extra-service-row"
            onClick={addExtraServiceRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>
        </div>

        {data.extraServices.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
            No extra services added yet. Click &ldquo;Add Service&rdquo; to add airport transfers, gala dinners, or candlelight beachside dining.
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.extraServices.map((service, idx) => (
              <div
                key={service.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center border border-slate-200 rounded-lg p-2.5 bg-slate-50/60 text-xs"
              >
                <div className="sm:col-span-6">
                  <label className="block sm:hidden text-[10px] text-slate-500 mb-0.5">Service Name</label>
                  <input
                    type="text"
                    list="extra-services-suggestions"
                    value={service.serviceName}
                    onChange={(e) => updateExtraServiceRow(service.id, 'serviceName', e.target.value)}
                    placeholder="Service Name (e.g. Candle Light Dinner)"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                  <datalist id="extra-services-suggestions">
                    {COMMON_EXTRA_SERVICES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div className="sm:col-span-2">
                  <label className="block sm:hidden text-[10px] text-slate-500 mb-0.5">Quantity</label>
                  <NumberStepper
                    min={1}
                    value={service.quantity}
                    onChange={(e) => updateExtraServiceRow(service.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-center font-bold focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block sm:hidden text-[10px] text-slate-500 mb-0.5">Rate (₹)</label>
                  <NumberStepper
                    min={0}
                    value={service.rate}
                    onChange={(e) => updateExtraServiceRow(service.id, 'rate', Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Rate"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-right font-mono font-medium focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div className="sm:col-span-1 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => duplicateExtraServiceRow(idx)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteExtraServiceRow(service.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Tax & Discount Settings */}
      <div id="section-tax-discount" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Taxes &amp; Overall Discount</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Automatic Calculation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Overall Discount */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800">Special Promotion / Overall Discount</label>
              {data.taxes.overallDiscountValue > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Active
                </span>
              )}
            </div>

            <div className="flex items-stretch rounded-lg border border-slate-300 bg-white focus-within:ring-1 focus-within:ring-slate-900 focus-within:border-slate-900 overflow-hidden shadow-2xs mb-2">
              <NumberStepper
                min={0}
                value={data.taxes.overallDiscountValue}
                onChange={(e) => updateTaxes('overallDiscountValue', Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-full min-w-[80px] px-3 py-2 border-0 text-right font-mono font-bold text-slate-900 outline-none"
              />
              <select
                value={data.taxes.overallDiscountType}
                onChange={(e) => updateTaxes('overallDiscountType', e.target.value as DiscountType)}
                className="px-3 py-2 border-l border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer outline-none shrink-0"
              >
                <option value="FIXED">Flat (₹)</option>
                <option value="PERCENT">Percent (%)</option>
              </select>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-semibold">Quick:</span>
              {[5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    updateTaxes('overallDiscountType', 'PERCENT');
                    updateTaxes('overallDiscountValue', pct);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    data.taxes.overallDiscountType === 'PERCENT' && data.taxes.overallDiscountValue === pct
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              {data.taxes.overallDiscountValue > 0 && (
                <button
                  type="button"
                  onClick={() => updateTaxes('overallDiscountValue', 0)}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* GST Configuration */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-800 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.taxes.enableGst}
                  onChange={(e) => updateTaxes('enableGst', e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Enable Goods &amp; Services Tax (GST)</span>
              </label>
            </div>

            {data.taxes.enableGst && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">CGST (%)</label>
                  <NumberStepper
                    min={0}
                    step={0.5}
                    value={data.taxes.cgstPercent}
                    onChange={(e) => updateTaxes('cgstPercent', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">SGST (%)</label>
                  <NumberStepper
                    min={0}
                    step={0.5}
                    value={data.taxes.sgstPercent}
                    onChange={(e) => updateTaxes('sgstPercent', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-center font-mono font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Other Tax / Cess */}
          <div className="sm:col-span-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-800 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.taxes.enableOtherTax}
                  onChange={(e) => updateTaxes('enableOtherTax', e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Enable Secondary Tax / Tourism Cess</span>
              </label>
            </div>

            {data.taxes.enableOtherTax && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Tax / Cess Label</label>
                  <input
                    type="text"
                    value={data.taxes.otherTaxName}
                    onChange={(e) => updateTaxes('otherTaxName', e.target.value)}
                    placeholder="e.g. Green Cess / Service Tax"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Tax Rate (%)</label>
                  <NumberStepper
                    min={0}
                    value={data.taxes.otherTaxPercent}
                    onChange={(e) => updateTaxes('otherTaxPercent', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 8. Bank & UPI Details */}
      <div id="section-bank-upi" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Bank &amp; UPI Payment Details</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Payment Account</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
            <input
              type="text"
              value={data.payment.bankName}
              onChange={(e) => updatePayment('bankName', e.target.value)}
              placeholder="e.g. HDFC Bank Ltd."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Account Beneficiary Name *</label>
            <input
              type="text"
              value={data.payment.accountName}
              onChange={(e) => updatePayment('accountName', e.target.value)}
              placeholder="e.g. Shangri-La's Beach Resort Pvt Ltd"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Account Number *</label>
            <input
              type="text"
              value={data.payment.accountNumber}
              onChange={(e) => updatePayment('accountNumber', e.target.value)}
              placeholder="50200088991234"
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono font-bold focus:ring-1 focus:ring-slate-900 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">IFSC Code *</label>
            <input
              type="text"
              value={data.payment.ifsc}
              onChange={(e) => updatePayment('ifsc', e.target.value.toUpperCase())}
              placeholder="HDFC0001234"
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono font-bold uppercase focus:ring-1 focus:ring-slate-900 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
            <input
              type="text"
              value={data.payment.branch}
              onChange={(e) => updatePayment('branch', e.target.value)}
              placeholder="e.g. Port Blair Central Branch"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">UPI ID (VPA) *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={data.payment.upiId}
                onChange={(e) => updatePayment('upiId', e.target.value)}
                placeholder="shangrilasresort@hdfcbank"
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono font-semibold focus:ring-1 focus:ring-slate-900 outline-none text-slate-900"
              />
              <button
                type="button"
                onClick={onGenerateQr}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-semibold whitespace-nowrap shadow-sm"
                title="Generate UPI QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payable Advance Percentage (%)</label>
            <NumberStepper
              min={0}
              max={100}
              value={data.payment.payableAdvancePercent}
              onChange={(e) => updatePayment('payableAdvancePercent', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold focus:ring-1 focus:ring-slate-900 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Due Date</label>
            <input
              type="date"
              value={data.payment.paymentDueDate}
              onChange={(e) => updatePayment('paymentDueDate', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Payment Instruction Note</label>
            <input
              type="text"
              value={data.payment.note}
              onChange={(e) => updatePayment('note', e.target.value)}
              placeholder="Please transfer 50% advance to confirm your room reservation."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          {/* Dedicated UPI QR Code Section */}
          <div className="sm:col-span-2 pt-3 mt-1 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-slate-700" />
                  <span>UPI Payment QR Code (Email &amp; Quotation)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Dynamic UPI QR encodes your UPI ID and advance amount ({formatINR(data.calculations.payableAdvance)}). It renders reliably in Gmail, Outlook, and print quotations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={qrInputRef}
                  onChange={handleQrUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={onGenerateQr}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  title="Generate or update dynamic UPI QR for this quotation"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>{effectiveQr ? 'Regenerate Dynamic QR' : 'Generate Dynamic QR'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => qrInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  title="Upload resort or bank UPI standee image"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload QR</span>
                </button>
              </div>
            </div>

            {/* QR Preview & Status Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row items-center gap-4">
              {effectiveQr ? (
                <div className="relative group shrink-0">
                  <img
                    src={effectiveQr}
                    alt="UPI Payment QR Preview"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain bg-white rounded-md border border-slate-200 p-1 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleClearQr}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition-colors cursor-pointer"
                    title="Remove QR code"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-slate-400 p-2 text-center shrink-0">
                  <QrCode className="w-8 h-8 stroke-[1.5] mb-1 text-slate-400" />
                  <span className="text-[10px] font-medium leading-tight">No QR Yet</span>
                </div>
              )}

              <div className="flex-1 space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 font-mono text-xs">
                    {data.payment.upiId ? data.payment.upiId : 'UPI ID not configured'}
                  </span>
                  {effectiveQr && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Email &amp; PDF Active
                    </span>
                  )}
                </div>

                <p className="text-slate-600 text-[11px]">
                  <strong>Advance Payable:</strong> {formatINR(data.calculations.payableAdvance)} ({data.payment.payableAdvancePercent}% of total)
                </p>
                <p className="text-[11px] text-slate-500">
                  When guests scan this QR with PhonePe, Google Pay, Paytm, or BHIM, the payee name &amp; advance amount are automatically pre-filled.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 9. Booking Terms & Policies */}
      <div id="section-booking-terms" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Booking Terms &amp; Stay Policies</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetTermsToDefault}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              id="btn-add-term"
              onClick={addTerm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Term</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {data.terms.map((term, idx) => (
            <div key={term.id} className="flex items-start gap-2 text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
              <span className="font-bold text-slate-500 text-xs w-5 pt-1.5 shrink-0 text-center">
                {idx + 1}.
              </span>
              <textarea
                rows={2}
                value={term.text}
                onChange={(e) => updateTerm(term.id, e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-slate-900 outline-none"
              />
              <div className="flex flex-col gap-1 shrink-0 pt-1">
                <button
                  type="button"
                  onClick={() => reorderTerm(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200"
                  title="Move Up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => reorderTerm(idx, 'down')}
                  disabled={idx === data.terms.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200"
                  title="Move Down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteTerm(term.id)}
                  className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10. Authorized Signatory */}
      <div id="section-signatory" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Authorized Signatory</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Hotel Representative</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Authorized Person Name *</label>
            <input
              type="text"
              value={data.signatory.authorizedName}
              onChange={(e) => updateSignatory('authorizedName', e.target.value)}
              placeholder="e.g. Nityananda Sutar"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Designation</label>
            <input
              type="text"
              value={data.signatory.designation}
              onChange={(e) => updateSignatory('designation', e.target.value)}
              placeholder="e.g. General Manager / Reservations Head"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Closing Hospitality / Thank You Message</label>
            <input
              type="text"
              value={data.signatory.thankYouMessage}
              onChange={(e) => updateSignatory('thankYouMessage', e.target.value)}
              placeholder="Thank you for choosing Shangri-La's Beach Resort. We look forward to welcoming you!"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-800"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Signature Image (Optional upload)</label>
            <div className="flex items-center gap-3">
              <input
                ref={signatureInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, (url) => updateSignatory('signatureImageUrl', url))}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => signatureInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Signature</span>
              </button>
              {data.signatory.signatureImageUrl && (
                <button
                  type="button"
                  onClick={() => updateSignatory('signatureImageUrl', '')}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Remove Custom Image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Clear View Review Card */}
      <div id="section-form-bottom-preview-bar" className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Ready to review or export this quotation?
          </h4>
          <p className="text-xs text-slate-300 mt-1">
            Check the clean A4 print preview, choose template styles, or copy email-ready HTML.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenPreview && (
            <button
              id="btn-form-preview-bottom"
              type="button"
              onClick={onOpenPreview}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-all hover:shadow hover:scale-102 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Preview Quotation</span>
            </button>
          )}
          {onSaveQuotation && (
            <button
              type="button"
              onClick={onSaveQuotation}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
