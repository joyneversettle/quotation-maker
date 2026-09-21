import React, { useState } from 'react';
import { QuotationTemplate, QuotationData } from '../types/quotation';
import { TEMPLATE_PLACEHOLDERS_DOCS } from '../data/defaultData';
import { renderTemplate } from '../utils/templateEngine';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Save, 
  RotateCcw, 
  Code, 
  Eye, 
  Check, 
  HelpCircle,
  FileCode
} from 'lucide-react';

interface TemplateEditorProps {
  templates: QuotationTemplate[];
  selectedTemplateId: string;
  sampleData: QuotationData;
  onSelectTemplate: (id: string) => void;
  onSaveTemplate: (template: QuotationTemplate) => void;
  onCreateTemplate: (template: QuotationTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onResetToBuiltin: (id: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  templates,
  selectedTemplateId,
  sampleData,
  onSelectTemplate,
  onSaveTemplate,
  onCreateTemplate,
  onDeleteTemplate,
  onResetToBuiltin,
  onShowToast
}) => {
  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  
  const [templateName, setTemplateName] = useState<string>(currentTemplate?.name || '');
  const [templateDesc, setTemplateDesc] = useState<string>(currentTemplate?.description || '');
  const [templateHtml, setTemplateHtml] = useState<string>(currentTemplate?.html || '');
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'preview'>('editor');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync state if selected template changes
  React.useEffect(() => {
    if (currentTemplate) {
      setTemplateName(currentTemplate.name);
      setTemplateDesc(currentTemplate.description || '');
      setTemplateHtml(currentTemplate.html);
    }
  }, [currentTemplate?.id]);

  const handleCopyTag = async (tag: string) => {
    await navigator.clipboard.writeText(tag);
    setCopiedKey(tag);
    onShowToast('info', `Copied tag ${tag} to clipboard`);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      onShowToast('error', 'Template name cannot be empty');
      return;
    }
    const updated: QuotationTemplate = {
      ...currentTemplate,
      name: templateName,
      description: templateDesc,
      html: templateHtml,
      updatedAt: new Date().toISOString()
    };
    onSaveTemplate(updated);
    onShowToast('success', `Template "${templateName}" saved successfully.`);
  };

  const handleCreateNew = () => {
    const newId = `tpl-custom-${Date.now()}`;
    const newTemplate: QuotationTemplate = {
      id: newId,
      name: 'New Custom Template',
      description: 'Customized quotation template',
      isDefault: false,
      html: currentTemplate?.html || '',
      css: currentTemplate?.css || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onCreateTemplate(newTemplate);
    onSelectTemplate(newId);
    onShowToast('success', 'Created new template based on current code. Customize it below.');
  };

  const handleDelete = () => {
    if (currentTemplate.isDefault) {
      onShowToast('error', 'Default template cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete template "${currentTemplate.name}"?`)) {
      onDeleteTemplate(currentTemplate.id);
      onShowToast('success', 'Template deleted.');
    }
  };

  const previewRendered = React.useMemo(() => {
    try {
      return renderTemplate(templateHtml, sampleData);
    } catch (e: any) {
      return `<div style="color:red; padding:20px;">Error rendering preview: ${e?.message}</div>`;
    }
  }, [templateHtml, sampleData]);

  return (
    <div id="template-editor-view" className="space-y-4">
      
      {/* Template Header & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center">
            <FileCode className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">HTML Template Customizer</h2>
            <p className="text-xs text-slate-500">
              Customize or paste your own HTML code with dynamic placeholders.
            </p>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2">
          <select
            value={currentTemplate?.id}
            onChange={(e) => onSelectTemplate(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-md font-semibold bg-white text-slate-800 focus:ring-1 focus:ring-slate-900 outline-none"
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} {tpl.isDefault ? '(Default)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            title="Create a new template"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>

          <button
            onClick={() => onResetToBuiltin(currentTemplate.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            title="Reset to default code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {!currentTemplate.isDefault && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-rose-300 rounded-md text-rose-600 hover:bg-rose-50 text-xs font-semibold"
              title="Delete this template"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs"
            title="Save template changes"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Template</span>
          </button>
        </div>
      </div>

      {/* Template Metadata Inputs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Template Name</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-900 font-semibold"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Description</label>
          <input
            type="text"
            value={templateDesc}
            onChange={(e) => setTemplateDesc(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 outline-none text-slate-700"
          />
        </div>
      </div>

      {/* Main Two-Column Layout: Code Editor + Placeholders Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left Column: Code Editor or Live Preview */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
          
          {/* Subtabs */}
          <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveSubTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeSubTab === 'editor' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>HTML Code</span>
              </button>
              <button
                onClick={() => setActiveSubTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeSubTab === 'preview' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Template Preview</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Supports inline CSS, HTML tables, &amp; dynamic mustache tags
            </span>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeSubTab === 'editor' ? (
              <textarea
                id="template-code-textarea"
                value={templateHtml}
                onChange={(e) => setTemplateHtml(e.target.value)}
                spellCheck={false}
                placeholder="Paste or edit HTML code here..."
                className="w-full h-full p-4 font-mono text-xs bg-slate-900 text-amber-300/90 leading-relaxed outline-none resize-none selection:bg-amber-500 selection:text-black"
              />
            ) : (
              <div className="w-full h-full overflow-auto p-4 bg-slate-100 flex justify-center">
                <div className="w-full max-w-[760px] bg-white rounded-lg shadow border border-slate-300 overflow-hidden my-auto">
                  <div dangerouslySetInnerHTML={{ __html: previewRendered }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Placeholders Sidebar / Cheat Sheet */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-[700px] flex flex-col">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Dynamic Placeholders</h3>
              <p className="text-[11px] text-slate-500">Click any tag to copy it to clipboard</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            {TEMPLATE_PLACEHOLDERS_DOCS.map((grp) => (
              <div key={grp.category} className="border border-slate-100 rounded-lg p-2.5 bg-slate-50/60">
                <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wide mb-2">
                  {grp.category}
                </h4>
                <div className="space-y-1.5">
                  {grp.tags.map((item) => {
                    const isCopied = copiedKey === item.tag;
                    return (
                      <button
                        key={item.tag}
                        onClick={() => handleCopyTag(item.tag)}
                        className="w-full text-left p-1.5 rounded bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-colors flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-mono text-[11px] text-slate-900 font-semibold group-hover:text-amber-800 truncate">
                            {item.tag}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {item.description}
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] text-slate-400 group-hover:text-amber-700">
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Syntax Info Box */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 leading-relaxed">
              <strong className="block mb-1 font-bold">Conditional &amp; Loop Syntax:</strong>
              <div className="font-mono text-[10px] space-y-1 bg-white/80 p-2 rounded border border-amber-200">
                <div>{'{{#each rooms}}'}</div>
                <div className="pl-3">{'<tr><td>{{room_type}}</td>...</tr>'}</div>
                <div>{'{{/each}}'}</div>
                <div className="pt-1">{'{{#if enable_gst}}'}</div>
                <div className="pl-3">{'CGST & SGST rows'}</div>
                <div>{'{{/if}}'}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
