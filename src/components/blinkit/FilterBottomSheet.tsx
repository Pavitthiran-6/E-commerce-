import { useEffect, useRef } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterSection {
  id: string;
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sections: FilterSection[];
  onClearAll: () => void;
  totalResults?: number;
}

export default function FilterBottomSheet({
  isOpen,
  onClose,
  sections,
  onClearAll,
  totalResults,
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

  const hasActiveFilters = sections.some((s) => s.selectedValues.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
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

        {/* Filter sections */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          {sections.map((section) => (
            <div key={section.id}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                {section.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {section.options.map((option) => {
                  const isSelected = section.selectedValues.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => section.onToggle(option.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                        isSelected
                          ? 'bg-[#0C831F] text-white border-[#0C831F]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#0C831F] hover:text-[#0C831F]'
                      }`}
                    >
                      {option.label}
                      {option.count != null && (
                        <span className={`ml-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                          ({option.count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-100 pb-safe">
          <button
            onClick={() => { onClearAll(); onClose(); }}
            disabled={!hasActiveFilters}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 text-sm font-bold rounded-xl disabled:opacity-40 hover:border-gray-400 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#0C831F] text-white text-sm font-bold rounded-xl hover:bg-[#0A6B19] transition-colors"
          >
            {totalResults != null ? `Show ${totalResults} results` : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
