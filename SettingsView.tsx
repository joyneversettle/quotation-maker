import React, { useState, useRef } from 'react';
import { 
  HotelInfo, 
  BankPaymentInfo, 
  BookingTerm, 
  TaxSettings, 
  Signatory, 
  CatalogServiceItem, 
  CatalogRoomItem, 
  PromoBannerConfig,
  AppSettings,
  MealPlan,
  DiscountType
} from '../types/quotation';
import { 
  Building2, 
  CreditCard, 
  ScrollText, 
  Save, 
  RotateCcw, 
  Upload, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Receipt,
  Sparkles,
  BedDouble,
  PenTool,
  Tag,
  Check,
  Percent,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

interface SettingsViewProps {
  defaultHotel: HotelInfo;
  defaultPayment: BankPaymentInfo;
  defaultTerms: BookingTerm[];
  defaultTaxes?: TaxSettings;
  defaultSignatory?: Signatory;
  extraServicesCatalog?: CatalogServiceItem[];
  roomTypesCatalog?: CatalogRoomItem[];
  promoBanner?: PromoBannerConfig;
  onSaveAllSettings: (settings: AppSettings) => void;
  onResetToFactory: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  defaultHotel,
  defaultPayment,
  defaultTerms,
  defaultTaxes = {
    enableGst: true,
    cgstPercent: 6,
    sgstPercent: 6,
    enableOtherTax: false,
    otherTaxName: 'Tourism Cess',
    otherTaxPercent: 0,
    overallDiscountType: 'FIXED',
    overallDiscountValue: 0
  },
  defaultSignatory = {
    authorizedName: 'Nityananda Sutar',
    designation: 'General Manager',
    hotelName: "Shangri-La's Beach Resort",
    thankYouMessage: "Thank you for choosing Shangri-La's Beach Resort. We look forward to welcoming you!"
  },
  extraServicesCatalog = [
    { id: 'cat-1', serviceName: 'Candle Light Beachside Dinner', rate: 3500 },
    { id: 'cat-2', serviceName: 'Jetty / Harbor Speedboat Transfer (Round Trip)', rate: 1500 },
    { id: 'cat-3', serviceName: 'Scuba Diving Session with Underwater Video', rate: 4500 },
    { id: 'cat-4', serviceName: 'Extra Mattress & Buffet Breakfast', rate: 1800 }
  ],
  roomTypesCatalog = [
    { id: 'room-cat-1', roomType: 'Deluxe Garden View Room', defaultRate: 7500, mealPlan: 'CP' },
    { id: 'room-cat-2', roomType: 'Ocean Front Luxury Cottage', defaultRate: 9500, mealPlan: 'CP' },
    { id: 'room-cat-3', roomType: 'Royal Beach Villa with Private Jacuzzi', defaultRate: 14500, mealPlan: 'CP' }
  ],
  promoBanner = {
    enabled: true,
    badge: 'FESTIVE OFFER',
    text: 'Special Season Discount: Flat 10% OFF on all accommodation & complimentary breakfast!',
    discountCode: 'FESTIVE10',
    discountPercent: 10
  },
  onSaveAllSettings,
  onResetToFactory,
  onShowToast
}) => {
  // Local state for all settings
  const [activeTab, setActiveTab] = useState<'taxes' | 'services' | 'rooms' | 'hotel' | 'payment' | 'terms' | 'signatory' | 'promo'>('taxes');
  
  const [hotel, setHotel] = useState<HotelInfo>(defaultHotel);
  const [payment, setPayment] = useState<BankPaymentInfo>(defaultPayment);
  const [terms, setTerms] = useState<BookingTerm[]>(defaultTerms);
  const [taxes, setTaxes] = useState<TaxSettings>(defaultTaxes);
  const [signatory, setSignatory] = useState<Signatory>(defaultSignatory);
  const [services, setServices] = useState<CatalogServiceItem[]>(extraServicesCatalog);
  const [rooms, setRooms] = useState<CatalogRoomItem[]>(roomTypesCatalog);
  const [promo, setPromo] = useState<PromoBannerConfig>(promoBanner);

  // New item draft states
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceRate, setNewServiceRate] = useState<number>(1500);

  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomRate, setNewRoomRate] = useState<number>(7500);
  const [newRoomPlan, setNewRoomPlan] = useState<MealPlan>('CP');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const promoBannerInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setHotel(defaultHotel);
    setPayment(defaultPayment);
    setTerms(defaultTerms);
    if (defaultTaxes) setTaxes(defaultTaxes);
    if (defaultSignatory) setSignatory(defaultSignatory);
    if (extraServicesCatalog) setServices(extraServicesCatalog);
    if (roomTypesCatalog) setRooms(roomTypesCatalog);
    if (promoBanner) setPromo(promoBanner);
  }, [defaultHotel, defaultPayment, defaultTerms, defaultTaxes, defaultSignatory, extraServicesCatalog, roomTypesCatalog, promoBanner]);

  const handleSave = () => {
    onSaveAllSettings({
      defaultHotel: hotel,
      defaultPayment: payment,
      defaultTerms: terms,
      defaultTaxes: taxes,
      defaultSignatory: signatory,
      extraServicesCatalog: services,
      roomTypesCatalog: rooms,
      promoBanner: promo
    });
    onShowToast('success', 'All Resort & GST Settings saved successfully.');
  };

  // Service Catalog Actions
  const handleAddService = () => {
    if (!newServiceName.trim()) {
      onShowToast('error', 'Please enter a service name.');
      return;
    }
    const item: CatalogServiceItem = {
      id: `svc-${Date.now()}`,
      serviceName: newServiceName.trim(),
      rate: Math.max(0, Number(newServiceRate) || 0)
    };
    setServices([...services, item]);
    setNewServiceName('');
    setNewServiceRate(1500);
    onShowToast('success', `Added "${item.serviceName}" to services catalog.`);
  };

  const handleUpdateService = (id: string, field: keyof CatalogServiceItem, val: any) => {
    setServices(services.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
    onShowToast('info', 'Service removed from catalog.');
  };

  // Room Catalog Actions
  const handleAddRoom = () => {
    if (!newRoomName.trim()) {
      onShowToast('error', 'Please enter a room category name.');
      return;
    }
    const item: CatalogRoomItem = {
      id: `room-cat-${Date.now()}`,
      roomType: newRoomName.trim(),
      defaultRate: Math.max(0, Number(newRoomRate) || 0),
      mealPlan: newRoomPlan
    };
    setRooms([...rooms, item]);
    setNewRoomName('');
    setNewRoomRate(7500);
    onShowToast('success', `Added "${item.roomType}" to room categories.`);
  };

  const handleUpdateRoom = (id: string, field: keyof CatalogRoomItem, val: any) => {
    setRooms(rooms.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const handleDeleteRoom = (id: string) => {
    setRooms(rooms.filter((r) => r.id !== id));
    onShowToast('info', 'Room category deleted.');
  };

  // Terms Actions
  const handleAddTerm = () => {
    setTerms([
      ...terms,
      { id: `term-def-${Date.now()}`, text: 'Check-in time is 12:00 PM and Check-out time is 09:00 AM.' }
    ]);
  };

  const handleUpdateTerm = (id: string, text: string) => {
    setTerms(terms.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const handleDeleteTerm = (id: string) => {
    setTerms(terms.filter((t) => t.id !== id));
  };

  const handleReorderTerm = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= terms.length) return;
    const updated = [...terms];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setTerms(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const res = uploadEvent.target?.result as string;
      if (res) {
        setHotel((prev) => ({ ...prev, logoUrl: res }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* Header Bar with Action Buttons */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Hotel &amp; Resort System Settings</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
              Defaults &amp; Master Catalog
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure default GST rates, add-on experiences catalog, room categories, banking, and quotation policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Reset all settings and catalog items back to factory preset?')) {
                onResetToFactory();
                onShowToast('info', 'Reset all settings to factory defaults.');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Factory</span>
          </button>

          <button
            onClick={handleSave}
            id="btn-save-settings-top"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg text-xs font-bold shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'taxes', label: 'GST & Taxes', icon: Receipt, badge: taxes.enableGst ? `${taxes.cgstPercent + taxes.sgstPercent}%` : 'Off' },
          { id: 'services', label: 'Add-on Catalog', icon: Sparkles, badge: `${services.length}` },
          { id: 'rooms', label: 'Room Categories', icon: BedDouble, badge: `${rooms.length}` },
          { id: 'hotel', label: 'Resort Profile', icon: Building2 },
          { id: 'payment', label: 'Bank & UPI', icon: CreditCard },
          { id: 'terms', label: 'Booking Terms', icon: ScrollText, badge: `${terms.length}` },
          { id: 'signatory', label: 'Signatory', icon: PenTool },
          { id: 'promo', label: 'Promo Banner', icon: Tag, badge: promo.enabled ? 'Active' : null }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              id={`tab-setting-${tab.id}`}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0B1B3D] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GST & TAX SETTINGS (NEW!) */}
      {activeTab === 'taxes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-500" />
                <span>Goods &amp; Services Tax (GST) &amp; Tariff Rules</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set government GST tax rates (CGST + SGST) according to Indian Hospitality Tax Rules.
              </p>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">Enable GST</span>
              <input
                type="checkbox"
                checked={taxes.enableGst}
                onChange={(e) => setTaxes({ ...taxes, enableGst: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
              />
            </label>
          </div>

          {/* Hotel GSTIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resort / Business GSTIN Number *</label>
              <input
                type="text"
                value={hotel.gstin || ''}
                onChange={(e) => setHotel({ ...hotel, gstin: e.target.value.toUpperCase() })}
                placeholder="e.g. 35CIAPS8902B1ZG"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-1 focus:ring-slate-900 outline-none uppercase text-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                State Code 35 (Andaman &amp; Nicobar) or your registered state GSTIN code.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SAC Code for Accommodation</label>
              <input
                type="text"
                defaultValue="9963"
                readOnly
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono bg-slate-50 text-slate-600 outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Standard HSN / SAC 9963 applies to hotel room accommodation services.
              </p>
            </div>
          </div>

          {/* GST Presets & Percentages */}
          {taxes.enableGst && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-2">Hospitality GST Presets</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setTaxes({ ...taxes, cgstPercent: 6, sgstPercent: 6 })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taxes.cgstPercent === 6 && taxes.sgstPercent === 6
                        ? 'bg-amber-500/15 border-amber-500 text-slate-950 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-sm">12% GST</div>
                    <div className="text-[10px] text-slate-500">CGST 6% + SGST 6%</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">&lt; ₹7,500/night tariff</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxes({ ...taxes, cgstPercent: 9, sgstPercent: 9 })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taxes.cgstPercent === 9 && taxes.sgstPercent === 9
                        ? 'bg-amber-500/15 border-amber-500 text-slate-950 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-sm">18% GST</div>
                    <div className="text-[10px] text-slate-500">CGST 9% + SGST 9%</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">≥ ₹7,500/night luxury</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxes({ ...taxes, cgstPercent: 2.5, sgstPercent: 2.5 })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taxes.cgstPercent === 2.5 && taxes.sgstPercent === 2.5
                        ? 'bg-amber-500/15 border-amber-500 text-slate-950 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-sm">5% GST</div>
                    <div className="text-[10px] text-slate-500">CGST 2.5% + SGST 2.5%</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Stand-alone restaurant</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxes({ ...taxes, cgstPercent: 0, sgstPercent: 0 })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taxes.cgstPercent === 0 && taxes.sgstPercent === 0
                        ? 'bg-amber-500/15 border-amber-500 text-slate-950 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-sm">0% Exempt</div>
                    <div className="text-[10px] text-slate-500">Zero Tax / Exempt</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Special exemptions</div>
                  </button>
                </div>
              </div>

              {/* Custom Rates Inputs */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CGST Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={taxes.cgstPercent}
                    onChange={(e) => setTaxes({ ...taxes, cgstPercent: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-center text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SGST Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={taxes.sgstPercent}
                    onChange={(e) => setTaxes({ ...taxes, sgstPercent: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-center text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Other Tax / Tourism Cess */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxes.enableOtherTax}
                  onChange={(e) => setTaxes({ ...taxes, enableOtherTax: e.target.checked })}
                  className="rounded text-slate-900"
                />
                <span>Enable Additional Tourism Cess / Luxury Surcharge</span>
              </label>
            </div>

            {taxes.enableOtherTax && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tax Label / Title</label>
                  <input
                    type="text"
                    value={taxes.otherTaxName || 'Tourism Cess'}
                    onChange={(e) => setTaxes({ ...taxes, otherTaxName: e.target.value })}
                    placeholder="e.g. Green Island Cess"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cess Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={taxes.otherTaxPercent || 0}
                    onChange={(e) => setTaxes({ ...taxes, otherTaxPercent: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-center"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXTRA SERVICES CATALOG (ADD / EDIT / DELETE) */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Add-on Experiences &amp; Extra Services Catalog</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your resort's add-on services list. Staff can insert these with 1-click into any quotation.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">{services.length} Services Registered</span>
          </div>

          {/* Quick Add Form */}
          <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              <span>Add New Service to Catalog</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-8">
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g. Harbor Speedboat Ferry Transfer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={newServiceRate}
                    onChange={(e) => setNewServiceRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Rate"
                    className="w-full pl-6 pr-2 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-right outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddService}
                  className="w-full h-full py-2 px-3 bg-[#0B1B3D] hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          </div>

          {/* Existing Services List */}
          <div className="space-y-2">
            {services.map((svc, idx) => (
              <div
                key={svc.id}
                className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/70 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={svc.serviceName}
                    onChange={(e) => handleUpdateService(svc.id, 'serviceName', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium text-slate-900 outline-none focus:ring-1 focus:ring-slate-900 min-w-0"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={svc.rate}
                      onChange={(e) => handleUpdateService(svc.id, 'rate', Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full pl-6 pr-2 py-1.5 border border-slate-300 rounded-md bg-white font-mono font-bold text-right outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteService(svc.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete Service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ROOM CATEGORIES CATALOG (ADD / EDIT / DELETE) */}
      {activeTab === 'rooms' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-amber-500" />
                <span>Room Categories &amp; Base Tariffs</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Preset room types automatically appear in suggestions when creating new accommodation rows.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">{rooms.length} Categories</span>
          </div>

          {/* Quick Add Room Form */}
          <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              <span>Add New Room Category</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Royal Beachfront Villa with Jacuzzi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <select
                  value={newRoomPlan}
                  onChange={(e) => setNewRoomPlan(e.target.value as MealPlan)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 outline-none"
                >
                  <option value="EP">EP (Room Only)</option>
                  <option value="CP">CP (Breakfast)</option>
                  <option value="MAP">MAP (Half Board)</option>
                  <option value="AP">AP (Full Board)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={newRoomRate}
                    onChange={(e) => setNewRoomRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Rate"
                    className="w-full pl-6 pr-2 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-right outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="w-full h-full py-2 px-3 bg-[#0B1B3D] hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Room</span>
                </button>
              </div>
            </div>
          </div>

          {/* Existing Rooms List */}
          <div className="space-y-2">
            {rooms.map((room, idx) => (
              <div
                key={room.id}
                className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/70 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={room.roomType}
                    onChange={(e) => handleUpdateRoom(room.id, 'roomType', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-slate-900 min-w-0"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={room.mealPlan}
                    onChange={(e) => handleUpdateRoom(room.id, 'mealPlan', e.target.value as MealPlan)}
                    className="px-2 py-1.5 border border-slate-300 rounded-md bg-white font-bold text-slate-800 text-xs"
                  >
                    <option value="EP">EP</option>
                    <option value="CP">CP</option>
                    <option value="MAP">MAP</option>
                    <option value="AP">AP</option>
                  </select>

                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={room.defaultRate}
                      onChange={(e) => handleUpdateRoom(room.id, 'defaultRate', Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full pl-6 pr-2 py-1.5 border border-slate-300 rounded-md bg-white font-mono font-bold text-right outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete Room"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RESORT PROFILE */}
      {activeTab === 'hotel' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Resort Branding &amp; Contact Details</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resort / Hotel Name *</label>
              <input
                type="text"
                value={hotel.name}
                onChange={(e) => setHotel({ ...hotel, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-bold outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tagline / Subtitle</label>
              <input
                type="text"
                value={hotel.tagline}
                onChange={(e) => setHotel({ ...hotel, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Complete Resort Address</label>
              <input
                type="text"
                value={hotel.address}
                onChange={(e) => setHotel({ ...hotel, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone(s)</label>
              <input
                type="text"
                value={hotel.phone}
                onChange={(e) => setHotel({ ...hotel, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reservation Email</label>
              <input
                type="email"
                value={hotel.email}
                onChange={(e) => setHotel({ ...hotel, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Website</label>
              <input
                type="text"
                value={hotel.website}
                onChange={(e) => setHotel({ ...hotel, website: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resort Logo (URL or Upload)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hotel.logoUrl}
                  onChange={(e) => setHotel({ ...hotel, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none font-mono text-[11px]"
                />
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 shrink-0 font-semibold"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BANK & UPI */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <span>Default Bank &amp; UPI Payment Accounts</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={payment.bankName}
                onChange={(e) => setPayment({ ...payment, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={payment.accountName}
                onChange={(e) => setPayment({ ...payment, accountName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={payment.accountNumber}
                onChange={(e) => setPayment({ ...payment, accountNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={payment.ifsc}
                onChange={(e) => setPayment({ ...payment, ifsc: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 uppercase outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
              <input
                type="text"
                value={payment.branch}
                onChange={(e) => setPayment({ ...payment, branch: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">UPI ID (VPA)</label>
              <input
                type="text"
                value={payment.upiId}
                onChange={(e) => setPayment({ ...payment, upiId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Advance Deposit Required (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={payment.payableAdvancePercent}
                onChange={(e) => setPayment({ ...payment, payableAdvancePercent: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 outline-none text-center"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Instructions / Note</label>
              <input
                type="text"
                value={payment.note}
                onChange={(e) => setPayment({ ...payment, note: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TERMS & POLICIES (ADD / EDIT / DELETE / REORDER) */}
      {activeTab === 'terms' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-amber-500" />
                <span>Reservation Terms &amp; Conditions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                These conditions will be pre-filled into all new quotations generated.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddTerm}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1B3D] text-white text-xs font-bold hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Policy Note</span>
            </button>
          </div>

          <div className="space-y-2">
            {terms.map((term, idx) => (
              <div
                key={term.id}
                className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100/60"
              >
                <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {idx + 1}
                </span>

                <input
                  type="text"
                  value={term.text}
                  onChange={(e) => handleUpdateTerm(term.id, e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800 outline-none focus:ring-1 focus:ring-slate-900 min-w-0"
                />

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReorderTerm(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorderTerm(idx, 'down')}
                    disabled={idx === terms.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTerm(term.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                    title="Delete Term"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: SIGNATORY */}
      {activeTab === 'signatory' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <PenTool className="w-4 h-4 text-amber-500" />
              <span>Authorized Signatory &amp; Closing Message</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Authorized Person Name</label>
              <input
                type="text"
                value={signatory.authorizedName}
                onChange={(e) => setSignatory({ ...signatory, authorizedName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-bold outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designation / Title</label>
              <input
                type="text"
                value={signatory.designation}
                onChange={(e) => setSignatory({ ...signatory, designation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Default Thank You Note</label>
              <textarea
                rows={2}
                value={signatory.thankYouMessage}
                onChange={(e) => setSignatory({ ...signatory, thankYouMessage: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: PROMO BANNER CONFIG */}
      {activeTab === 'promo' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Promotional Announcement Banner &amp; Coupon Codes</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays the announcement banner at the top of the app and provides quick discount insertion.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">Enable Promo Banner</span>
              <input
                type="checkbox"
                checked={promo.enabled}
                onChange={(e) => setPromo({ ...promo, enabled: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
              />
            </label>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <div className="font-bold text-slate-800 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-amber-500" /> Promo Banner Image</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Recommended size: 1200×300px • JPG/PNG/WebP</div>
              </div>
              <button type="button" onClick={() => promoBannerInputRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800">Upload Banner</button>
              <input
                ref={promoBannerInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    onShowToast('error', 'Banner must be 2MB or smaller.');
                    e.currentTarget.value = '';
                    return;
                  }
                  const img = new Image();
                  img.onload = () => {
                    if (img.width !== 1200 || img.height !== 300) {
                      onShowToast('info', `Banner is ${img.width}×${img.height}px. Recommended: 1200×300px.`);
                    }
                    const reader = new FileReader();
                    reader.onload = () => setPromo({ ...promo, bannerImageUrl: String(reader.result || '') });
                    reader.readAsDataURL(file);
                  };
                  img.src = URL.createObjectURL(file);
                }}
              />
            </div>
            {promo.bannerImageUrl && (
              <div className="relative mt-2 rounded-lg overflow-hidden border border-slate-200 bg-white">
                <img src={promo.bannerImageUrl} alt="Promo banner preview" className="w-full h-auto block" />
                <button type="button" onClick={() => setPromo({ ...promo, bannerImageUrl: undefined })} className="absolute top-2 right-2 px-2 py-1 rounded-md bg-white/95 border border-slate-200 text-rose-600 text-[10px] font-bold shadow-sm">Remove</button>
              </div>
            )}
            <label className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={promo.showInEmail !== false} onChange={(e) => setPromo({ ...promo, showInEmail: e.target.checked })} className="rounded text-slate-900" />
              Show uploaded banner in email quotation
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Badge Tag</label>
              <input
                type="text"
                value={promo.badge}
                onChange={(e) => setPromo({ ...promo, badge: e.target.value })}
                placeholder="e.g. FESTIVE OFFER"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-bold outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Coupon Code</label>
              <input
                type="text"
                value={promo.discountCode}
                onChange={(e) => setPromo({ ...promo, discountCode: e.target.value.toUpperCase() })}
                placeholder="e.g. FESTIVE10"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Announcement Text</label>
              <input
                type="text"
                value={promo.text}
                onChange={(e) => setPromo({ ...promo, text: e.target.value })}
                placeholder="Special Season Discount: Flat 10% OFF on all accommodation & complimentary breakfast!"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">One-Click Discount Percent (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={promo.discountPercent}
                onChange={(e) => setPromo({ ...promo, discountPercent: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 outline-none text-center"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          id="btn-save-settings-bottom"
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </div>
    </div>
  );
};
