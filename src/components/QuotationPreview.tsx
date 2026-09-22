import React, { useState, useMemo, useRef, useEffect } from 'react';
import { QuotationData, QuotationTemplate } from '../types/quotation';
import { renderTemplate } from '../utils/templateEngine';
import { generateEmailSafeHtml } from '../utils/emailRenderer';
import { generateQuotationPdf } from '../utils/pdfGenerator';
import { 
  Mail, 
  Copy, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Check, 
  LayoutTemplate,
  Monitor,
  Inbox,
  ArrowLeft,
  X,
  FileCheck
} from 'lucide-react';

interface QuotationPreviewProps {
  data: QuotationData;
  templates: QuotationTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const QuotationPreview: React.FC<QuotationPreviewProps> = ({
  data,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onShowToast,
  isModal = false,
  onClose
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [previewMode, setPreviewMode] = useState<'a4' | 'email'>('a4');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Find active template
  const currentTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  // Render HTML dynamically
  const renderedHtml = useMemo(() => {
    if (!currentTemplate) return '<p>No template selected</p>';
    try {
      if (previewMode === 'email') {
        return generateEmailSafeHtml(data);
      }
      return renderTemplate(currentTemplate.html, data);
    } catch (err: any) {
      return `<div style="padding: 20px; color: red;"><h3>Template Rendering Error</h3><pre>${err?.message || 'Unknown error'}</pre></div>`;
    }
  }, [currentTemplate, data, previewMode]);

  // Copy Email HTML using modern Clipboard API with text/html MIME type
  const handleCopyForEmail = async () => {
    try {
      const emailHtml = generateEmailSafeHtml(data);

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

      setCopiedEmail(true);
      onShowToast('success', 'Email-compatible HTML copied! Paste directly into Gmail/Outlook compose.');
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch (err) {
      console.error('Clipboard write error:', err);
      // Fallback
      try {
        const emailHtml = generateEmailSafeHtml(data);
        await navigator.clipboard.writeText(emailHtml);
        setCopiedEmail(true);
        onShowToast('success', 'Raw Email HTML copied to clipboard.');
        setTimeout(() => setCopiedEmail(false), 2500);
      } catch (fallbackErr) {
        onShowToast('error', 'Failed to copy to clipboard. Please allow clipboard permissions.');
      }
    }
  };

  // Copy Raw HTML
  const handleCopyRawHtml = async () => {
    try {
      const htmlToCopy = previewMode === 'email' ? generateEmailSafeHtml(data) : renderedHtml;
      await navigator.clipboard.writeText(htmlToCopy);
      setCopiedHtml(true);
      onShowToast('success', 'Raw HTML code copied to clipboard.');
      setTimeout(() => setCopiedHtml(false), 2500);
    } catch (err) {
      onShowToast('error', 'Failed to copy HTML.');
    }
  };

  // Deterministic PDF export. Uses a fixed A4 renderer instead of the browser print dialog.
  const handlePrint = async () => {
    try {
      const pdfHtml = currentTemplate
        ? renderTemplate(currentTemplate.html, data)
        : renderedHtml;

      await generateQuotationPdf(pdfHtml, data.quotationNumber || 'quotation');
      onShowToast('success', 'PDF downloaded successfully.');
    } catch (error) {
      console.error('PDF generation failed:', error);
      onShowToast('error', 'PDF generation failed. Please try again.');
    }
  };

  const previewBody = (
    <div id="quotation-preview-container" className="flex flex-col h-full bg-slate-100/70 border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
      
      {/* Top Toolbar */}
      <div id="preview-toolbar" className="bg-white px-3 sm:px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 no-print">
        
        {/* Template and Mode Selection */}
        <div className="flex items-center flex-wrap gap-2">
          {onClose && (
            <button
              id="btn-preview-back-to-edit"
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 text-xs font-bold transition-all shadow-xs cursor-pointer mr-1"
              title="Close Preview and return to Edit Form (Esc)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Form</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <LayoutTemplate className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Template:</span>
          </div>

          <select
            id="preview-template-dropdown"
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplate(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-800 font-medium focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer"
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>

          {/* Mode Switcher: A4 Standard vs Email Preview */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setPreviewMode('a4')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                previewMode === 'a4' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="A4 Clean Document Layout"
            >
              <Monitor className="w-3 h-3" />
              <span>A4 Print</span>
            </button>
            <button
              onClick={() => setPreviewMode('email')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                previewMode === 'email' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Email-Compatible Table Layout"
            >
              <Inbox className="w-3 h-3" />
              <span>Email Layout</span>
            </button>
          </div>
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          
          {/* Zoom controls */}
          <div className="hidden md:flex items-center bg-slate-100 border border-slate-200 rounded-md px-1 py-0.5 text-xs text-slate-600">
            <button
              onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
              className="p-1 hover:text-slate-900 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="w-9 text-center font-mono text-[11px] font-semibold">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              className="p-1 hover:text-slate-900 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1 hover:text-slate-900 text-[10px] ml-0.5 text-slate-400 cursor-pointer"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Email Copy Button */}
          <button
            id="btn-preview-copy-email"
            onClick={handleCopyForEmail}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Copy as Email-Formatted Rich Text"
          >
            {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedEmail ? 'Copied!' : 'Copy for Email'}</span>
          </button>

          {/* Copy HTML Code Button */}
          <button
            id="btn-preview-copy-html"
            onClick={handleCopyRawHtml}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title="Copy Raw HTML Code"
          >
            {copiedHtml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{copiedHtml ? 'Copied' : 'HTML'}</span>
          </button>

          {/* Print / PDF Button */}
          <button
            id="btn-preview-print-pdf"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Preview (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* Main Preview Area */}
      <div 
        ref={previewContainerRef}
        id="live-quotation-render-area" 
        className="flex-1 overflow-auto p-3 sm:p-6 flex justify-center bg-slate-200/50"
      >
        <div 
          style={{ 
            transform: `scale(${zoomLevel / 100})`, 
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
          className="w-full max-w-[800px] my-auto"
        >
          {/* Card Container simulating A4 sheet with subtle shadow */}
          <div className="bg-white rounded-lg shadow-md border border-slate-300/80 overflow-hidden print:border-none print:shadow-none print:rounded-none">
            <div 
              id="quotation-html-rendered-content"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        </div>
      </div>

    </div>
  );

  if (isModal) {
    return (
      <div 
        id="quotation-preview-modal-backdrop" 
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex flex-col p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto bg-slate-100 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden min-h-0">
          {previewBody}
        </div>
      </div>
    );
  }

  return previewBody;
};
