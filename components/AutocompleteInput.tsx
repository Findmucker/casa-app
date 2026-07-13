"use client";

import { useState, useRef, useEffect, useMemo } from "react";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  suggestions: string[];
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function AutocompleteInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  suggestions,
  inputRef: externalRef,
}: AutocompleteInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const internalRef = useRef<HTMLInputElement>(null);
  const ref = externalRef || internalRef;
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!value.trim()) return [];
    const lower = value.toLowerCase();
    return suggestions
      .filter((s) => s.toLowerCase().includes(lower) && s.toLowerCase() !== lower)
      .slice(0, 5);
  }, [value, suggestions]);

  useEffect(() => {
    setSelectedIdx(-1);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filtered.length > 0 && showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && selectedIdx >= 0)) {
        if (selectedIdx >= 0) {
          e.preventDefault();
          onChange(filtered[selectedIdx]);
          setShowSuggestions(false);
          return;
        }
      }
    }
    onKeyDown?.(e);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-pink-100 shadow-lg shadow-pink-100/30 z-50 overflow-hidden">
          {filtered.map((suggestion, idx) => (
            <button
              key={suggestion}
              onClick={() => {
                onChange(suggestion);
                setShowSuggestions(false);
                ref.current?.focus();
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                idx === selectedIdx
                  ? "bg-pink-50 text-rose-700"
                  : "text-rose-800 hover:bg-pink-50/50"
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
