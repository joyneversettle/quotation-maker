/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  QuotationData, 
  QuotationTemplate, 
  HotelInfo, 
  PaymentDetails, 
  BookingTerm,
  TaxSettings,
  Signatory,
  CatalogServiceItem,
  CatalogRoomItem,
  PromoBannerConfig,
  AppSettings,
  DiscountType,
  RoomRow
} from './types/quotation';
import { 
  DEFAULT_HOTEL, 
  DEFAULT_PAYMENT, 
  DEFAULT_TERMS, 
  DEFAULT_QUOTATION, 
  BUILTIN_TEMPLATES,
  DEFAULT_SETTINGS
} from './data/defaultData';
import { calculateTotals, calculateQuotationSummary } from './utils/calculations';
import { generateUpiQrDataUrl, getUpiQrRemoteUrl } from './utils/qrGenerator';
import { generateEmailSafeHtml } from './utils/emailRenderer';
import { renderTemplate } from './utils/templateEngine';
import { generateQuotationPdf } from './utils/pdfGenerator';

import { Navbar, ActiveTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PromoBanner } from './components/PromoBanner';
import { QuotationForm } from './components/QuotationForm';
import { QuotationPreview } from './components/QuotationPreview';
import { TemplateEditor } from './components/TemplateEditor';
import { QuotationsList } from './components/QuotationsList';
import { SettingsView } from './components/SettingsView';
import { ToastContainer, ToastMessage } from './components/Toast';

const STORAGE_KEY_CURRENT = 'qm_current_quotation_v1';
const STORAGE_KEY_SAVED = 'qm_saved_quotations_v1';
const STORAGE_KEY_TEMPLATES = 'qm_templates_v1';
const STORAGE_KEY_SETTINGS_HOTEL = 'qm_settings_hotel_v1';
const STORAGE_KEY_SETTINGS_PAYMENT = 'qm_settings_payment_v1';
const STORAGE_KEY_SETTINGS_TERMS = 'qm_settings_terms_v1';
const STORAGE_KEY_SETTINGS_TAXES = 'qm_settings_taxes_v1';
const STORAGE_KEY_SETTINGS_SIGNATORY = 'qm_settings_signatory_v1';
const STORAGE_KEY_SETTINGS_SERVICES = 'qm_settings_services_v1';
const STORAGE_KEY_SETTINGS_ROOMS = 'qm_settings_rooms_v1';
const STORAGE_KEY_SETTINGS_PROMO = 'qm_settings_promo_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('editor');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Toast Helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Settings State (with localStorage persistence)
  const [defaultHotel, setDefaultHotel] = useState<HotelInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS_HOTEL);
      return saved ? JSON.parse(saved) : DEFAULT_HOTEL;
    } catch {
      return DEFAULT_HOTEL;
    }
  });

  const [defaultPayment, setDefaultPayment] = useState<PaymentDetails>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS_PAYMENT);
      return saved ? JSON.parse(saved) : DEFAULT_PAYMENT;
    } catch {
      return DEFAULT_PAYMENT;
    }
  });

  const [defaultTerms, setDefaultTerms] = useState<BookingTerm[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS_TERMS);
      return saved ? JSON.parse(saved) : DEFAULT_TERMS;
    } catch {
      return DEFAULT_TERMS;
    }
  });

  const [defaultTaxes, setDefaultTaxes] = useState<TaxSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS_TAXES);
      return saved ? JSON.parse(saved) : (DEFAULT_SETTINGS.defaultTaxes || DEFAULT_QUOTATION.taxes);
    } catch {
      return DEFAULT_SETTINGS.defaultTaxes || DEFAULT_QUOTATION.taxes;
    }
  });

  const [defaultSignatory, setDefaultSignatory] = useState<Signatory>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS_SIGNATORY);
      return saved ? JSON.parse(saved) : (DEFAULT_SETTINGS.defaultSignatory || DEFAULT_QUOTATION.signatory);
    } catch {
      return DEFAULT_SETTINGS.defaultSignatory || DEFAULT_QUOTATION.signatory;
    }
  });

  const [extraServicesCatalog, setExtraServicesCatalog] = useState<CatalogServiceItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS_SERVICES);
      return saved ? JSON.parse(saved) : (DEFAULT_SETTINGS.extraServicesCatalog || []);
    } catch {
      return DEFAULT_SETTINGS.extraServicesCatalog || [];
    }
  });

  const [roomTypesCatalog, setRoomTypesCatalog] = useState<CatalogRoomItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS_ROOMS);
      return saved ? JSON.parse(saved) : (DEFAULT_SETTINGS.roomTypesCatalog || []);
    } catch {
      return DEFAULT_SETTINGS.roomTypesCatalog || [];
    }
  });

  const [promoBanner, setPromoBanner] = useState<PromoBannerConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS_PROMO);
      return saved ? JSON.parse(saved) : (DEFAULT_SETTINGS.promoBanner || {
        enabled: true,
        badge: 'FESTIVE OFFER',
        text: 'Special Season Discount: Flat 10% OFF on all accommodation & complimentary breakfast!',
        discountCode: 'FESTIVE10',
        discountPercent: 10
      });
    } catch {
      return DEFAULT_SETTINGS.promoBanner || {
        enabled: true,
        badge: 'FESTIVE OFFER',
        text: 'Special Season Discount: Flat 10% OFF on all accommodation & complimentary breakfast!',
        discountCode: 'FESTIVE10',
        discountPercent: 10
      };
    }
  });

  // 2. Templates State
  const [templates, setTemplates] = useState<QuotationTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load custom templates from storage', e);
    }
    return BUILTIN_TEMPLATES;
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    return templates[0]?.id || 'tpl-executive-navy';
  });

  // 3. Current Quotation Data State
  const [quotationData, setQuotationData] = useState<QuotationData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (saved) {
        const parsed = JSON.parse(saved);
        const { calculations } = calculateTotals(parsed.rooms, parsed.extraServices, parsed.taxes, parsed.payment);
        return {
          ...parsed,
          calculations,
          calculatedSummary: calculations
        };
      }
    } catch (e) {
      console.warn('Failed to load active quotation from storage', e);
    }
    return { ...DEFAULT_QUOTATION };
  });

  // 4. Saved Quotations Archive State
  const [savedQuotations, setSavedQuotations] = useState<QuotationData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved quotations', e);
    }
    return [DEFAULT_QUOTATION];
  });

  // Keep calculations automatically updated whenever quotation data changes
  const handleQuotationChange = useCallback((updatedData: QuotationData) => {
    const { updatedRooms, updatedExtraServices, calculations } = calculateTotals(
      updatedData.rooms,
      updatedData.extraServices,
      updatedData.taxes,
      updatedData.payment
    );
    const finalizedData: QuotationData = {
      ...updatedData,
      rooms: updatedRooms,
      extraServices: updatedExtraServices,
      calculations,
      calculatedSummary: calculations,
      updatedAt: new Date().toISOString()
    };
    setQuotationData(finalizedData);

    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(finalizedData));
    } catch (err) {
      console.warn('Could not save active quotation to localStorage', err);
    }
  }, []);

  // Sync templates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
    } catch (e) {
      console.warn('Could not save templates to storage', e);
    }
  }, [templates]);

  // Sync saved quotations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(savedQuotations));
    } catch (e) {
      console.warn('Could not save quotations list to storage', e);
    }
  }, [savedQuotations]);

  // Generate UPI QR code automatically for current payment details
  const handleGenerateQr = useCallback(async () => {
    try {
      const upiId = quotationData.payment.upiId?.trim();
      if (!upiId) {
        showToast('error', 'Please enter a valid UPI ID (e.g. yourname@bank) in Payment Details first.');
        return;
      }
      const amount = quotationData.calculations?.payableAdvance || 0;
      const payeeName = quotationData.hotel?.name || 'Hotel';
      const note = quotationData.payment?.note || 'Room Quotation Advance';

      const dataUrl = await generateUpiQrDataUrl(upiId, payeeName, amount, note);
      const remoteUrl = getUpiQrRemoteUrl(upiId, payeeName, amount, note);

      handleQuotationChange({
        ...quotationData,
        payment: {
          ...quotationData.payment,
          upiId,
          qrCodeDataUrl: dataUrl,
          qrCodeImageUrl: remoteUrl,
          upiQrImage: dataUrl
        }
      });
      showToast('success', `Dynamic UPI QR (₹${amount.toLocaleString('en-IN')}) generated! Ready in Email and PDF.`);
    } catch (err) {
      showToast('error', 'Failed to generate UPI QR code.');
    }
  }, [quotationData, handleQuotationChange, showToast]);

  // Reset terms to defaults
  const handleResetTermsToDefault = useCallback(() => {
    handleQuotationChange({
      ...quotationData,
      terms: [...defaultTerms]
    });
    showToast('info', 'Terms reset to default policy settings.');
  }, [defaultTerms, quotationData, handleQuotationChange, showToast]);

  // Create new blank quotation
  const handleNewQuotation = useCallback(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const qNumber = `QT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const baseRooms: RoomRow[] = [
      {
        id: `room-${Date.now()}`,
        roomType: roomTypesCatalog[0]?.roomType || 'Deluxe Room',
        mealPlan: roomTypesCatalog[0]?.mealPlan || 'CP',
        roomsCount: 1,
        nightsCount: 1,
        ratePerNight: roomTypesCatalog[0]?.defaultRate || 7500,
        discountType: 'PERCENT',
        discountValue: 0,
        calculatedAmount: roomTypesCatalog[0]?.defaultRate || 7500
      }
    ];

    const { updatedRooms, calculations } = calculateTotals(
      baseRooms,
      [],
      defaultTaxes,
      {
        ...defaultPayment,
        advanceAmount: 0,
        balanceAmount: 0
      }
    );

    const fresh: QuotationData = {
      id: `q-${Date.now()}`,
      title: `${defaultHotel.name} - Quotation ${qNumber}`,
      quotationNumber: qNumber,
      quotationDate: dateStr,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      templateId: selectedTemplateId,
      hotel: { ...defaultHotel },
      guest: {
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        gstin: '',
        address: '',
        travelAgency: '',
        guestType: 'INDIVIDUAL'
      },
      stay: {
        checkIn: dateStr,
        checkOut: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        durationNights: 1,
        adults: 2,
        children: 0,
        totalRooms: 1,
        extraMattress: 0,
        cnb: 0,
        mealPlan: baseRooms[0].mealPlan,
        specialRequirement: ''
      },
      rooms: updatedRooms,
      extraServices: [],
      taxes: { ...defaultTaxes },
      payment: {
        ...defaultPayment,
        advanceAmount: calculations.payableAdvance,
        balanceAmount: calculations.balanceAmount
      },
      terms: [...defaultTerms],
      signatory: { ...defaultSignatory },
      calculations,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    handleQuotationChange(fresh);
    setActiveTab('editor');
    setIsPreviewModalOpen(false);
    showToast('success', `Created new blank quotation (${qNumber}).`);
  }, [defaultHotel, defaultPayment, defaultTerms, defaultTaxes, defaultSignatory, roomTypesCatalog, selectedTemplateId, handleQuotationChange, showToast]);

  // Save current quotation to saved list
  const handleSaveQuotation = useCallback(() => {
    const existingIndex = savedQuotations.findIndex((q) => q.id === quotationData.id);
    let updatedList: QuotationData[];

    if (existingIndex >= 0) {
      updatedList = [...savedQuotations];
      updatedList[existingIndex] = quotationData;
    } else {
      updatedList = [quotationData, ...savedQuotations];
    }

    setSavedQuotations(updatedList);
    showToast('success', `Quotation ${quotationData.quotationNumber} saved to archive.`);
  }, [quotationData, savedQuotations, showToast]);

  // Load quotation from saved list
  const handleLoadQuotation = useCallback((quotation: QuotationData) => {
    handleQuotationChange(quotation);
    setSelectedTemplateId(quotation.templateId || templates[0].id);
    setActiveTab('editor');
    setIsPreviewModalOpen(false);
    showToast('info', `Loaded quotation ${quotation.quotationNumber}.`);
  }, [templates, handleQuotationChange, showToast]);

  // Duplicate quotation
  const handleDuplicateQuotation = useCallback((source: QuotationData) => {
    const now = new Date();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newQNumber = `QT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;

    const duplicated: QuotationData = {
      ...source,
      id: `q-${Date.now()}`,
      quotationNumber: newQNumber,
      quotationDate: now.toISOString().split('T')[0],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    setSavedQuotations((prev) => [duplicated, ...prev]);
    handleQuotationChange(duplicated);
    setActiveTab('editor');
    setIsPreviewModalOpen(false);
    showToast('success', `Duplicated as ${newQNumber}.`);
  }, [handleQuotationChange, showToast]);

  // Delete saved quotation
  const handleDeleteQuotation = useCallback((id: string) => {
    setSavedQuotations((prev) => prev.filter((q) => q.id !== id));
  }, []);

  // Export All Quotations as JSON file
  const handleExportAllJson = useCallback(() => {
    const jsonStr = JSON.stringify(savedQuotations, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quotations-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Quotations backup downloaded.');
  }, [savedQuotations, showToast]);

  // Import JSON file
  const handleImportJson = useCallback((imported: QuotationData[]) => {
    setSavedQuotations((prev) => {
      const existingIds = new Set(prev.map((q) => q.id));
      const combined = [...prev];
      for (const item of imported) {
        if (!existingIds.has(item.id)) {
          combined.push(item);
        }
      }
      return combined;
    });
  }, []);

  // Global Quick Email Copy
  const handleCopyEmailHtml = useCallback(async () => {
    try {
      const emailHtml = generateEmailSafeHtml({ ...quotationData, bannerImageUrl: promoBanner.bannerImageUrl, promoBannerShowInEmail: promoBanner.showInEmail !== false } as any);
      if (navigator.clipboard && window.ClipboardItem) {
        const htmlBlob = new Blob([emailHtml], { type: 'text/html' });
        const textBlob = new Blob([emailHtml.replace(/<[^>]+>/g, ' ')], { type: 'text/plain' });
        const item = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(emailHtml);
      }
      showToast('success', 'Email-compatible quotation copied! Paste directly into Gmail/Outlook.');
    } catch (err) {
      showToast('error', 'Clipboard permission error.');
    }
  }, [quotationData, promoBanner, showToast]);

  // Global Quick Raw HTML Copy
  const handleCopyRawHtml = useCallback(async () => {
    try {
      const emailHtml = generateEmailSafeHtml({ ...quotationData, bannerImageUrl: promoBanner.bannerImageUrl, promoBannerShowInEmail: promoBanner.showInEmail !== false } as any);
      await navigator.clipboard.writeText(emailHtml);
      showToast('success', 'Raw HTML copied to clipboard.');
    } catch (err) {
      showToast('error', 'Failed to copy HTML.');
    }
  }, [quotationData, promoBanner, showToast]);

  // Print PDF
  const handlePrintPdf = useCallback(async () => {
    try {
      const currentTemplate =
        templates.find((template) => template.id === selectedTemplateId) ||
        templates[0];

      if (!currentTemplate) {
        throw new Error('No quotation template is selected.');
      }

      const pdfHtml = renderTemplate(currentTemplate.html, quotationData);

      await generateQuotationPdf(
        pdfHtml,
        quotationData.quotationNumber || 'quotation'
      );

      showToast('success', 'PDF downloaded successfully.');
    } catch (error) {
      console.error('PDF generation failed:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      showToast(
        'error',
        `PDF generation failed: ${errorMessage}`
      );
    }
  }, [templates, selectedTemplateId, quotationData, showToast]);

  // Template Handlers
  const handleSaveTemplate = useCallback((tpl: QuotationTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === tpl.id ? tpl : t)));
  }, []);

  const handleCreateTemplate = useCallback((tpl: QuotationTemplate) => {
    setTemplates((prev) => [...prev, tpl]);
  }, []);

  const handleDeleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setSelectedTemplateId(templates[0]?.id || 'tpl-executive-navy');
  }, [templates]);

  const handleResetTemplateToBuiltin = useCallback((id: string) => {
    const builtin = BUILTIN_TEMPLATES.find((b) => b.id === id);
    if (builtin) {
      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...builtin } : t)));
      showToast('info', `Reset template to default code.`);
    } else {
      showToast('error', 'No built-in default found for this custom template.');
    }
  }, [showToast]);

  // Save All Settings (GST, Catalog, Hotel, Bank, Terms, Signatory, Promo)
  const handleSaveAllSettings = useCallback((updated: AppSettings) => {
    setDefaultHotel(updated.defaultHotel);
    setDefaultPayment({
      ...updated.defaultPayment,
      advanceAmount: 0,
      balanceAmount: 0
    });
    setDefaultTerms(updated.defaultTerms);
    if (updated.defaultTaxes) setDefaultTaxes(updated.defaultTaxes);
    if (updated.defaultSignatory) setDefaultSignatory(updated.defaultSignatory);
    if (updated.extraServicesCatalog) setExtraServicesCatalog(updated.extraServicesCatalog);
    if (updated.roomTypesCatalog) setRoomTypesCatalog(updated.roomTypesCatalog);
    if (updated.promoBanner) setPromoBanner(updated.promoBanner);

    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS_HOTEL, JSON.stringify(updated.defaultHotel));
      localStorage.setItem(STORAGE_KEY_SETTINGS_PAYMENT, JSON.stringify(updated.defaultPayment));
      localStorage.setItem(STORAGE_KEY_SETTINGS_TERMS, JSON.stringify(updated.defaultTerms));
      if (updated.defaultTaxes) localStorage.setItem(STORAGE_KEY_SETTINGS_TAXES, JSON.stringify(updated.defaultTaxes));
      if (updated.defaultSignatory) localStorage.setItem(STORAGE_KEY_SETTINGS_SIGNATORY, JSON.stringify(updated.defaultSignatory));
      if (updated.extraServicesCatalog) localStorage.setItem(STORAGE_KEY_SETTINGS_SERVICES, JSON.stringify(updated.extraServicesCatalog));
      if (updated.roomTypesCatalog) localStorage.setItem(STORAGE_KEY_SETTINGS_ROOMS, JSON.stringify(updated.roomTypesCatalog));
      if (updated.promoBanner) localStorage.setItem(STORAGE_KEY_SETTINGS_PROMO, JSON.stringify(updated.promoBanner));
    } catch (e) {
      console.warn('Could not save settings to localStorage', e);
    }
  }, []);

  // Reset to Factory Defaults
  const handleResetSettingsToFactory = useCallback(() => {
    setDefaultHotel(DEFAULT_HOTEL);
    setDefaultPayment(DEFAULT_PAYMENT);
    setDefaultTerms(DEFAULT_TERMS);
    setDefaultTaxes(DEFAULT_SETTINGS.defaultTaxes || DEFAULT_QUOTATION.taxes);
    setDefaultSignatory(DEFAULT_SETTINGS.defaultSignatory || DEFAULT_QUOTATION.signatory);
    setExtraServicesCatalog(DEFAULT_SETTINGS.extraServicesCatalog || []);
    setRoomTypesCatalog(DEFAULT_SETTINGS.roomTypesCatalog || []);
    setPromoBanner(DEFAULT_SETTINGS.promoBanner || {
      enabled: true,
      badge: 'FESTIVE OFFER',
      text: 'Special Season Discount: Flat 10% OFF on all accommodation & complimentary breakfast!',
      discountCode: 'FESTIVE10',
      discountPercent: 10
    });

    try {
      localStorage.removeItem(STORAGE_KEY_SETTINGS_HOTEL);
      localStorage.removeItem(STORAGE_KEY_SETTINGS_PAYMENT);
      localStorage.removeItem(STORAGE_KEY_SETTINGS_TERMS);
      localStorage.removeItem(STORAGE_KEY_SETTINGS_TAXES);
      localStorage.removeItem(STORAGE_KEY_SETTINGS_SIGNATORY);
      localStorage.removeItem(STORAGE_KEY_SETTINGS_SERVICES);
      localStorage.removeItem(STORAGE_KEY_SETTINGS_ROOMS);
      localStorage.removeItem(STORAGE_KEY_SETTINGS_PROMO);
    } catch (e) {}
  }, []);

  // Apply Promotional Coupon Code directly to Quotation
  const handleApplyPromo = useCallback((code: string, percent: number) => {
    const updated = {
      ...quotationData,
      taxes: {
        ...quotationData.taxes,
        overallDiscountType: 'PERCENT' as DiscountType,
        overallDiscountValue: percent
      }
    };
    handleQuotationChange(updated);
    showToast('success', `Applied promotional coupon ${code} (${percent}% OFF) to quotation!`);
  }, [quotationData, handleQuotationChange, showToast]);

  return (
    <div id="quotation-app-root" className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased">
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Main Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewQuotation={handleNewQuotation}
        onSaveQuotation={handleSaveQuotation}
        onCopyEmailHtml={handleCopyEmailHtml}
        onCopyRawHtml={handleCopyRawHtml}
        onPrintPdf={handlePrintPdf}
        onOpenPreview={() => setIsPreviewModalOpen(true)}
        onToggleSidebar={() => {
          if (window.innerWidth < 1024) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
          } else {
            setIsSidebarOpen(!isSidebarOpen);
          }
        }}
      />

      {/* Modern Promotional Announcement Banner */}
      <PromoBanner
        config={promoBanner}
        onApplyDiscount={(percent, code) => handleApplyPromo(code, percent)}
        isApplied={quotationData.taxes.overallDiscountValue === promoBanner.discountPercent}
      />

      {/* Main Application Container with Sidebar & Viewport */}
      <div className="flex-1 flex w-full relative">
        
        {/* Navigation & Quick Actions Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onNewQuotation={() => {
            handleNewQuotation();
            setIsMobileSidebarOpen(false);
          }}
          onSaveQuotation={handleSaveQuotation}
          onCopyEmailHtml={handleCopyEmailHtml}
          onPrintPdf={handlePrintPdf}
          onOpenPreview={() => {
            setIsPreviewModalOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          quotationData={quotationData}
          templatesCount={templates.length}
          savedCount={savedQuotations.length}
        />

        {/* Content Viewport */}
        <main id="main-content-viewport" className="flex-1 w-full min-w-0 p-3 sm:p-5 lg:p-6 transition-all">
          
          {/* VIEW 1: Quotation Maker (Clear Full-Width Form View - No cramped split) */}
          {activeTab === 'editor' && (
            <div id="quotation-maker-clear-view" className="w-full max-w-5xl mx-auto">
              <QuotationForm
                data={quotationData}
                onChange={handleQuotationChange}
                templates={templates}
                onGenerateQr={handleGenerateQr}
                onResetTermsToDefault={handleResetTermsToDefault}
                onOpenPreview={() => setIsPreviewModalOpen(true)}
                onSaveQuotation={handleSaveQuotation}
              />
            </div>
          )}

          {/* VIEW 2: HTML Template Customizer */}
          {activeTab === 'templates' && (
            <TemplateEditor
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              sampleData={quotationData}
              onSelectTemplate={setSelectedTemplateId}
              onSaveTemplate={handleSaveTemplate}
              onCreateTemplate={handleCreateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onResetToBuiltin={handleResetTemplateToBuiltin}
              onShowToast={showToast}
            />
          )}

          {/* VIEW 3: Saved Quotations Archive */}
          {activeTab === 'quotations' && (
            <QuotationsList
              savedQuotations={savedQuotations}
              onLoadQuotation={handleLoadQuotation}
              onDuplicateQuotation={handleDuplicateQuotation}
              onDeleteQuotation={handleDeleteQuotation}
              onNewQuotation={handleNewQuotation}
              onExportAllJson={handleExportAllJson}
              onImportJson={handleImportJson}
              onShowToast={showToast}
            />
          )}

          {/* VIEW 4: Hotel & Default Settings */}
          {activeTab === 'settings' && (
            <SettingsView
              defaultHotel={defaultHotel}
              defaultPayment={defaultPayment}
              defaultTerms={defaultTerms}
              defaultTaxes={defaultTaxes}
              defaultSignatory={defaultSignatory}
              extraServicesCatalog={extraServicesCatalog}
              roomTypesCatalog={roomTypesCatalog}
              promoBanner={promoBanner}
              onSaveAllSettings={handleSaveAllSettings}
              onResetToFactory={handleResetSettingsToFactory}
              onShowToast={showToast}
            />
          )}

        </main>
      </div>

      {/* Dedicated Full-Screen Quotation Preview Modal */}
      {isPreviewModalOpen && (
        <QuotationPreview
          data={quotationData}
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={(id) => {
            setSelectedTemplateId(id);
            handleQuotationChange({ ...quotationData, templateId: id });
          }}
          onShowToast={showToast}
          isModal={true}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}

    </div>
  );
}
