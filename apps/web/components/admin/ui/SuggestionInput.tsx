import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface SuggestionInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  suggestions: string[];
  multiline?: boolean;
  rows?: number;
  required?: boolean;
}

export function SuggestionInput({
  label,
  value,
  onChange,
  placeholder,
  suggestions = [],
  multiline = false,
  rows = 3,
  required = false,
}: SuggestionInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const handleSelect = (s: string) => {
    onChange(s);
    setIsOpen(false);
  };

  // Filter suggestions based on current input value
  const filteredSuggestions = suggestions.filter((s) =>
    s.toLowerCase().includes((value || "").toLowerCase())
  );

  // If input is empty, show all suggestions. Otherwise show filtered ones.
  const displaySuggestions = value ? filteredSuggestions : suggestions;

  return (
    <div className="flex flex-col gap-1 w-full relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative w-full">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            onFocus={() => setIsOpen(true)}
            className="w-full pl-4 pr-16 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50 focus:ring-2 focus:ring-[#425733]/10 transition-all resize-y"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            onFocus={() => setIsOpen(true)}
            className="w-full pl-4 pr-16 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50 focus:ring-2 focus:ring-[#425733]/10 transition-all"
          />
        )}

        {/* Action Buttons (Clear X + Dropdown arrow) */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 text-gray-400">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Xóa nhanh"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Xem các gợi ý đã có"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "transform rotate-180 text-gray-600" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown panel */}
      {isOpen && displaySuggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-200 top-full">
          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Các thông tin đã dùng trước đó
          </div>
          {displaySuggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-2 text-xs hover:bg-[#f0f4ee] hover:text-[#425733] transition-colors truncate block"
              title={s}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
