import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

interface BlinkitSearchBarProps {
  className?: string;
  placeholder?: string;
}

export default function BlinkitSearchBar({ className = '', placeholder = 'Search for products...' }: BlinkitSearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/collection?q=${encodeURIComponent(trimmed)}`);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Close overlay on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Backdrop on focus (mobile) */}
      {isFocused && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => { setIsFocused(false); inputRef.current?.blur(); }}
        />
      )}

      <form onSubmit={handleSubmit} className={`relative z-40 ${className}`}>
        <div
          className={`flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 transition-all duration-200 ${
            isFocused
              ? 'shadow-lg ring-2 ring-[#0C831F]'
              : 'shadow-sm ring-1 ring-[#E8E8E8] hover:ring-[#AAAAAA]'
          }`}
        >
          <Search
            className={`w-4 h-4 flex-shrink-0 transition-colors ${isFocused ? 'text-[#0C831F]' : 'text-gray-400'}`}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder={placeholder}
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none min-w-0"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Search button (desktop) */}
          {query && (
            <button
              type="submit"
              className="hidden md:flex flex-shrink-0 items-center gap-1.5 bg-[#0C831F] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#0A6B19] transition-colors"
            >
              Search
            </button>
          )}
        </div>
      </form>
    </>
  );
}
