import React from 'react';
import { 
  FileText, 
  LayoutTemplate, 
  FolderArchive, 
  Settings as SettingsIcon, 
  Printer, 
  Mail, 
  Copy, 
  Save, 
  PlusCircle, 
  Eye,
  Menu
} from 'lucide-react';

export type ActiveTab = 'editor' | 'templates' | 'quotations' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewQuotation: () => void;
  onSaveQuotation: () => void;
  onCopyEmailHtml: () => void;
  onCopyRawHtml: () => void;
  onPrintPdf: () => void;
  onOpenPreview?: () => void;
  onQuickPreviewMobile?: () => void;
  isMobilePreviewActive?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewQuotation,
  onSaveQuotation,
  onCopyEmailHtml,
  onCopyRawHtml,
  onPrintPdf,
  onOpenPreview,
  onQuickPreviewMobile,
  isMobilePreviewActive,
  onToggleSidebar
}) => {
  return (
    <header id="app-header" className="bg-[#0B1B3D] text-white border-b border-slate-800 sticky top-0 z-40 no-print">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Left: Sidebar Toggle + Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            {onToggleSidebar && (
              <button
                type="button"
                id="btn-toggle-sidebar"
                onClick={onToggleSidebar}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="Toggle Sidebar Navigation"
              >
                <Menu className="w-4 h-4 text-amber-400" />
              </button>
            )}

            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-extrabold shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            
            <div>
              <div className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Quotation Maker</span>
                <span className="hidden sm:inline-block text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Pro Resort
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden md:block">
                Professional Hotel &amp; Resort Quotations
              </p>
            </div>
          </div>

          {/* Primary View Navigation Tabs */}
          <nav id="main-nav" className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1">
            <button
              id="nav-tab-quotation-maker"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'editor'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Quotation</span>
            </button>

            <button
              id="nav-tab-templates"
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'templates'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>

            <button
              id="nav-tab-quotations-list"
              onClick={() => setActiveTab('quotations')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'quotations'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Saved</span>
            </button>

            <button
              id="nav-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'settings'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activeTab === 'editor' && (
              <>
                {/* Prominent Preview button requested by user */}
                <button
                  id="btn-navbar-preview"
                  type="button"
                  onClick={onOpenPreview || onQuickPreviewMobile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-all hover:shadow hover:scale-102 cursor-pointer"
                  title="Preview Quotation (A4 / Email)"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  <span>Preview</span>
                </button>

                <button
                  id="btn-save-quotation-header"
                  type="button"
                  onClick={onSaveQuotation}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  title="Save Quotation"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </button>

                <button
                  id="btn-copy-email-header"
                  type="button"
                  onClick={onCopyEmailHtml}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
                  title="Copy formatted email-ready HTML (Gmail / Outlook)"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Email HTML</span>
                </button>

                <button
                  id="btn-print-pdf-header"
                  type="button"
                  onClick={onPrintPdf}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
                  title="Print / Save PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Print / PDF</span>
                </button>

                <button
                  id="btn-new-quotation-header"
                  type="button"
                  onClick={onNewQuotation}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
                  title="Create New Quotation"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">New</span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
