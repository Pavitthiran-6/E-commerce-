import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useCategorySearch } from '../../hooks/useCategorySearch';
import { getTrendingSearches } from '../../services/searchService';

interface BlinkitSearchBarProps {
  className?: string;
  placeholder?: string;
}

export default function BlinkitSearchBar({ className = '', placeholder = 'Search for products...' }: BlinkitSearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [trending, setTrending] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, searchCategories } = useCategorySearch();

  // Load trending searches on focus / mount
  useEffect(() => {
    getTrendingSearches(8)
      .then(list => setTrending(list.map(item => item.searchTerm)))
      .catch(err => console.error('Failed to load trending searches', err));
  }, [isFocused]);

  // Debounced search logic
  useEffect(() => {
    const handler = setTimeout(() => {
      searchCategories(query);
    }, 300);

    return () => clearTimeout(handler);
  }, [query, searchCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/collection?search=${encodeURIComponent(trimmed)}`);
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

  const hasSuggestions = suggestions.categories.length > 0 || suggestions.products.length > 0;

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

        {/* Suggestion Dropdown */}
        {isFocused && (query.trim() === '' ? (
          trending.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-gray-100 shadow-xl z-50 overflow-hidden py-1 max-h-[380px] overflow-y-auto custom-scrollbar">
              <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">🔥 Trending Searches</div>
              {trending.map((term, index) => (
                <button
                  key={`trending-${index}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQuery(term);
                    navigate(`/collection?search=${encodeURIComponent(term)}`);
                    setIsFocused(false);
                    inputRef.current?.blur();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <span className="text-gray-400">🔥</span>
                  <span className="capitalize">{term}</span>
                </button>
              ))}
            </div>
          )
        ) : (
          hasSuggestions && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-gray-100 shadow-xl z-50 overflow-hidden py-1 max-h-[380px] overflow-y-auto custom-scrollbar">
              {suggestions.categories.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Categories</div>
                  {suggestions.categories.map((cat) => (
                    <button
                      key={`cat-${cat.id}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (cat.isMain) {
                          navigate(`/collection?mainCategory=${cat.slug}`);
                        } else {
                          navigate(`/collection?category=${cat.slug}`);
                        }
                        setQuery('');
                        setIsFocused(false);
                        inputRef.current?.blur();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors font-medium"
                    >
                      <span className="text-gray-400">📁</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {suggestions.products.length > 0 && (
                <div className="border-t border-gray-100">
                  <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Products</div>
                  {suggestions.products.map((prod) => (
                    <button
                      key={`prod-${prod.id}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        navigate(`/collection?search=${encodeURIComponent(prod.name)}`);
                        setQuery('');
                        setIsFocused(false);
                        inputRef.current?.blur();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors font-medium"
                    >
                      <span className="text-gray-400">🔍</span>
                      <span>{prod.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        ))}

        {/* Empty Search Results */}
        {isFocused && query.trim() && !hasSuggestions && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-gray-100 shadow-xl z-50 p-4 text-center text-sm text-gray-500 font-medium">
            No matching products or categories found.
          </div>
        )}
      </form>
    </>
  );
}
