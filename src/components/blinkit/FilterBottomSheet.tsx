import { useEffect, useRef } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAll: () => void;
  onApply: () => void;
  hasActiveFilters: boolean;
  totalResults?: number;
  children: React.ReactNode;
}

export default function FilterBottomSheet({
  isOpen,
  onClose,
  onClearAll,
  onApply,
  hasActiveFilters,
  totalResults,
  children,
}: FilterBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-600" />
            <span className="text-base font-bold text-gray-900">Filters</span>
            {hasActiveFilters && (
              <span className="bg-[#0C831F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 custom-scrollbar">
          {children}
        </div>

        {/* Sticky Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-100 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-safe">
          <button
            onClick={() => { onClearAll(); onClose(); }}
            className="flex-1 py-3 border border-gray-300 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={() => { onApply(); onClose(); }}
            className="flex-1 py-3 bg-[#0C831F] text-white text-sm font-bold rounded-xl hover:bg-[#0A6B19] active:bg-[#085514] transition-colors"
          >
            {totalResults != null ? `Show ${totalResults} results` : 'Apply Filters'}
          </button>
        </div>
      </div>
    </div>
  );
}

