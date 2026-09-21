import React, { useState } from 'react';
import { QuotationData } from '../types/quotation';
import { formatIndianCurrency } from '../utils/calculations';
import { 
  FolderArchive, 
  Search, 
  Calendar, 
  User, 
  CreditCard, 
  Trash2, 
  Copy, 
  FileEdit, 
  Download, 
  Upload, 
  PlusCircle 
} from 'lucide-react';

interface QuotationsListProps {
  savedQuotations: QuotationData[];
  onLoadQuotation: (quotation: QuotationData) => void;
  onDuplicateQuotation: (quotation: QuotationData) => void;
  onDeleteQuotation: (id: string) => void;
  onNewQuotation: () => void;
  onExportAllJson: () => void;
  onImportJson: (imported: QuotationData[]) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const QuotationsList: React.FC<QuotationsListProps> = ({
  savedQuotations,
  onLoadQuotation,
  onDuplicateQuotation,
  onDeleteQuotation,
  onNewQuotation,
  onExportAllJson,
  onImportJson,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filtered = savedQuotations.filter((q) => {
    const term = searchTerm.toLowerCase();
    const guest = q.guest.name.toLowerCase();
    const qNum = q.quotationNumber.toLowerCase();
    const agency = (q.guest.travelAgency || '').toLowerCase();
    return guest.includes(term) || qNum.includes(term) || agency.includes(term);
  });

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportJson(parsed);
          onShowToast('success', `Imported ${parsed.length} quotations successfully.`);
        } else if (parsed && parsed.quotationNumber) {
          onImportJson([parsed]);
          onShowToast('success', 'Imported 1 quotation successfully.');
        } else {
          onShowToast('error', 'Invalid quotation JSON format.');
        }
      } catch (err) {
        onShowToast('error', 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="saved-quotations-view" className="space-y-4">
      
      {/* Header & Global Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center">
            <FolderArchive className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Saved Quotations Archive</h2>
            <p className="text-xs text-slate-500">
              Manage, reload, duplicate, or export all your generated hotel quotes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            title="Import from JSON backup"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import JSON</span>
          </button>

          <button
            onClick={onExportAllJson}
            disabled={savedQuotations.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold"
            title="Export all quotations to JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup All</span>
          </button>

          <button
            onClick={onNewQuotation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1B3D] hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create New Quote</span>
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Guest Name, Quotation Number, or Travel Agency..."
            className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
          />
        </div>
      </div>

      {/* Quotations Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          <FolderArchive className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No quotations found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm ? 'Try adjusting your search keywords.' : 'Create and save your first quotation to see it here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const grandTotal = item.calculations?.grandTotal ?? item.calculatedSummary?.grandTotal ?? 0;
            const advanceAmt = item.calculations?.payableAdvance ?? item.calculatedSummary?.payableAdvance ?? 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Q-number & Date */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {item.quotationNumber}
                    </span>
                    <span className="text-slate-500 text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.quotationDate}
                    </span>
                  </div>

                  {/* Guest Name & Type */}
                  <div className="mb-3">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.guest.name}</span>
                    </div>
                    {item.guest.travelAgency && (
                      <div className="text-[11px] text-amber-700 font-medium pl-5 truncate">
                        via {item.guest.travelAgency}
                      </div>
                    )}
                  </div>

                  {/* Stay Dates and Room Summary */}
                  <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-600 mb-3 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Check-in / Out:</span>
                      <span className="font-medium text-slate-800">
                        {item.stay.checkIn} → {item.stay.checkOut}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Rooms &amp; Nights:</span>
                      <span className="font-medium text-slate-800">
                        {item.rooms.length} categories ({item.stay.durationNights} Nts)
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Meal Plan:</span>
                      <span className="font-semibold text-slate-900">
                        {item.stay.mealPlan}
                      </span>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="flex items-center justify-between py-1.5 px-2 bg-amber-500/10 border border-amber-500/20 rounded-md mb-3">
                    <span className="text-[11px] font-bold text-amber-900 uppercase">Grand Total:</span>
                    <span className="font-bold text-sm text-amber-900 font-mono">
                      {formatIndianCurrency(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                  <button
                    onClick={() => onLoadQuotation(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                    title="Load into Edit Form"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Open &amp; Edit</span>
                  </button>

                  <button
                    onClick={() => onDuplicateQuotation(item)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200"
                    title="Duplicate Quotation"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete quotation ${item.quotationNumber}?`)) {
                        onDeleteQuotation(item.id);
                        onShowToast('info', `Quotation ${item.quotationNumber} deleted.`);
                      }
                    }}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded border border-rose-200"
                    title="Delete Quotation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
