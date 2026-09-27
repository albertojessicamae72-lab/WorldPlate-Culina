import React, { useState, useRef, useEffect } from "react";
import { LANGUAGES, getLanguage } from "@/data/languages";
import { ChevronDown, Check, Globe } from "lucide-react";

export default function LanguageSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = getLanguage(value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-sm transition hover:border-stone-300 hover:shadow-sm"
      >
        <Globe className="h-4 w-4 text-stone-500" />
        <span className="text-base leading-none">{selected?.flag}</span>
        <span className="hidden sm:inline font-medium text-stone-700">{selected?.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 max-h-80 overflow-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                onChange(l.code);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-amber-50"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg leading-none">{l.flag}</span>
                <span className="text-stone-700">{l.name}</span>
              </span>
              {l.code === value && <Check className="h-4 w-4 text-amber-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}