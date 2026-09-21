import React, { useState } from 'react';
import { Sparkles, Tag, Check, Copy, X, ArrowRight, Percent } from 'lucide-react';
import { PromoBannerConfig } from '../types/quotation';

interface PromoBannerProps {
  config?: PromoBannerConfig;
  onApplyDiscount?: (percent: number, code: string) => void;
  onDismiss?: () => void;
  isApplied?: boolean;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  config,
  onApplyDiscount,
  onDismiss,
  isApplied = false
}) => {
  const [copied, setCopied] = useState(false);
  const [closed, setClosed] = useState(false);

  if (!config || config.enabled === false || closed) {
    return null;
  }

  const handleCopy = () => {
    if (config.discountCode) {
      navigator.clipboard.writeText(config.discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (onApplyDiscount && config.discountPercent) {
      onApplyDiscount(config.discountPercent, config.discountCode);
    }
  };

  return (
    <div
      id="promo-announcement-banner"
      className="bg-gradient-to-r from-[#0B1B3D] via-[#1E293B] to-[#0F172A] border-b border-amber-500/30 text-white px-3 sm:px-6 py-2.5 transition-all no-print relative shadow-sm"
    >
      {config.bannerImageUrl && (
        <div className="max-w-7xl mx-auto mb-2 overflow-hidden rounded-lg border border-white/10">
          <img
            src={config.bannerImageUrl}
            alt="Promotional banner"
            className="block w-full h-auto max-h-[200px] object-cover"
          />
        </div>
      )}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        
        {/* Left: Badge & Message */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-[10px] tracking-wider uppercase shadow-xs">
            <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
            <span>{config.badge || 'PROMO OFFER'}</span>
          </span>

          <span className="text-slate-200 font-medium">
            {config.text || 'Apply special promotional discount on luxury resort accommodation!'}
          </span>

          {config.discountCode && (
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/15 text-amber-300 font-mono font-bold text-[11px] transition-colors"
              title="Click to copy coupon code"
            >
              <Tag className="w-3 h-3" />
              <span>{config.discountCode}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-60" />}
            </button>
          )}
        </div>

        {/* Right: Quick Apply Button & Close */}
        <div className="flex items-center gap-2 shrink-0">
          {onApplyDiscount && config.discountPercent > 0 && (
            <button
              onClick={handleApply}
              disabled={isApplied}
              id="btn-apply-promo-discount"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all shadow-xs ${
                isApplied
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 active:scale-95'
              }`}
            >
              {isApplied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{config.discountPercent}% Applied</span>
                </>
              ) : (
                <>
                  <Percent className="w-3.5 h-3.5" />
                  <span>Apply {config.discountPercent}% OFF</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          )}

          <button
            onClick={() => {
              setClosed(true);
              if (onDismiss) onDismiss();
            }}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss Announcement"
            aria-label="Close Promo Banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
