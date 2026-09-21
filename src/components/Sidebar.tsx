import React from 'react';
import { 
  FileText, 
  LayoutTemplate, 
  FolderArchive, 
  Settings as SettingsIcon, 
  PlusCircle, 
  Mail, 
  Printer, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Building2,
  Calendar,
  X,
  CreditCard,
  CheckCircle2,
  Receipt,
  Eye
} from 'lucide-react';
import { ActiveTab } from './Navbar';
import { QuotationData, QuotationTemplate } from '../types/quotation';
import { formatINR } from '../utils/calculations';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onNewQuotation: () => void;
  onSaveQuotation: () => void;
  onCopyEmailHtml: () => void;
  onPrintPdf: () => void;
  onOpenPreview?: () => void;
  quotationData: QuotationData;
  templatesCount: number;
  savedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onToggle,
  isMobileOpen,
  onCloseMobile,
  onNewQuotation,
  onSaveQuotation,
  onCopyEmailHtml,
  onPrintPdf,
  onOpenPreview,
  quotationData,
  templatesCount,
  savedCount
}) => {
  const navItems = [
    {
      id: 'editor' as ActiveTab,
      label: 'Quotation Editor',
      shortLabel: 'Editor',
      desc: 'Form & Live A4 Preview',
      icon: FileText,
      badge: null
    },
    {
      id: 'templates' as ActiveTab,
      label: 'HTML Templates',
      shortLabel: 'Templates',
      desc: 'Custom Code & Placeholders',
      icon: LayoutTemplate,
      badge: templatesCount ? `${templatesCount}` : null
    },
    {
      id: 'quotations' as ActiveTab,
      label: 'Saved Archive',
      shortLabel: 'Saved',
      desc: 'History & Management',
      icon: FolderArchive,
      badge: savedCount ? `${savedCount}` : null
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings & GST',
      shortLabel: 'Settings',
      desc: 'GST, Rates, Bank, Catalog',
      icon: SettingsIcon,
      badge: null
    }
  ];

  const grandTotal = quotationData.calculations?.grandTotal ?? quotationData.calculatedSummary?.grandTotal ?? 0;
  const guestName = quotationData.guest?.name?.trim() || 'Guest / Client';
  const hotelName = quotationData.hotel?.name || "Shangri-La's Beach Resort";

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`
          fixed top-0 bottom-0 left-0 z-50 bg-[#0B1B3D] text-slate-200 border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 ease-in-out no-print
          ${isMobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${isOpen ? 'lg:w-64' : 'lg:w-20'}
        `}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="h-16 border-b border-slate-800/80 flex items-center justify-between px-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
                <Building2 className="w-5 h-5" />
              </div>

              {(isOpen || isMobileOpen) && (
                <div className="overflow-hidden min-w-0">
                  <h1 className="font-extrabold text-sm text-white tracking-tight truncate leading-tight">
                    {hotelName}
                  </h1>
                  <p className="text-[11px] text-amber-400 font-semibold tracking-wide flex items-center gap-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Quotation Builder
                  </p>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle button */}
            <button
              onClick={onToggle}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* New Quotation Quick Action Button */}
          <div className="p-3">
            <button
              onClick={() => {
                onNewQuotation();
                setActiveTab('editor');
                onCloseMobile();
              }}
              id="sidebar-btn-new-quotation"
              className={`
                w-full flex items-center justify-center gap-2 rounded-lg font-bold text-xs transition-all shadow-sm
                bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 active:scale-[0.98]
                ${isOpen || isMobileOpen ? 'px-3 py-2.5' : 'p-2.5'}
              `}
              title="Create New Quotation"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              {(isOpen || isMobileOpen) && <span>New Quotation</span>}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-2.5 py-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 rounded-lg text-xs font-semibold transition-all relative group
                    ${isOpen || isMobileOpen ? 'px-3 py-2.5' : 'p-2.5 justify-center'}
                    ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                    }
                  `}
                  title={item.label}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  
                  {(isOpen || isMobileOpen) && (
                    <div className="flex-1 flex items-center justify-between text-left min-w-0">
                      <div>
                        <span className="block leading-snug">{item.label}</span>
                        <span className="block text-[10px] text-slate-400 font-normal truncate">{item.desc}</span>
                      </div>
                      {item.badge && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {!isOpen && !isMobileOpen && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-medium whitespace-nowrap shadow-lg border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Active Quotation Summary Card & Quick Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-3">
          {(isOpen || isMobileOpen) ? (
            <>
              {/* Active Quotation Badge */}
              <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono text-amber-400 font-bold">
                    {quotationData.quotationNumber}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                    Active
                  </span>
                </div>
                <div className="font-semibold text-slate-200 truncate" title={guestName}>
                  {guestName}
                </div>
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400">Total:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Prominent Preview Button */}
              {onOpenPreview && (
                <button
                  id="btn-sidebar-preview"
                  type="button"
                  onClick={onOpenPreview}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-all hover:shadow cursor-pointer"
                  title="Preview Quotation (A4 / Email)"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  <span>Preview Quotation</span>
                </button>
              )}

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  onClick={onCopyEmailHtml}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                  title="Copy Email-Safe HTML"
                >
                  <Mail className="w-3.5 h-3.5 mb-1 text-amber-400" />
                  <span className="text-[10px] font-medium">Email</span>
                </button>

                <button
                  onClick={onPrintPdf}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                  title="Print / Save PDF"
                >
                  <Printer className="w-3.5 h-3.5 mb-1 text-amber-400" />
                  <span className="text-[10px] font-medium">PDF</span>
                </button>

                <button
                  onClick={onSaveQuotation}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                  title="Save to Archive"
                >
                  <Save className="w-3.5 h-3.5 mb-1 text-amber-400" />
                  <span className="text-[10px] font-medium">Save</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                <Receipt className="w-3 h-3 text-slate-400" />
                <span>GSTIN: {quotationData.hotel?.gstin || '35CIAPS8902B1ZG'}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {onOpenPreview && (
                <button
                  onClick={onOpenPreview}
                  className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm cursor-pointer"
                  title="Preview Quotation"
                >
                  <Eye className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
              <button
                onClick={onCopyEmailHtml}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-400 transition-colors"
                title="Copy Email-Safe HTML"
              >
                <Mail className="w-4 h-4" />
              </button>
              <button
                onClick={onPrintPdf}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-400 transition-colors"
                title="Print or Save PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={onSaveQuotation}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-400 transition-colors"
                title="Save to Archive"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
