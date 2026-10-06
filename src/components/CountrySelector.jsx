import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { COUNTRIES, getCountry } from "@/data/countries";
import { ChevronDown, Check } from "lucide-react";

export default function CountrySelector({ value, onChange, label, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});
  const selected = getCountry(value);

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const positionMenu = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const gap = 8;
      const edge = 12;
      const below = window.innerHeight - rect.bottom - edge - gap;
      const above = rect.top - edge - gap;
      const openUp = below < 240 && above > below;
      const maxHeight = Math.max(120, Math.min(288, openUp ? above : below));
      const left = Math.max(edge, Math.min(rect.left, window.innerWidth - rect.width - edge));
      const top = openUp ? Math.max(edge, rect.top - maxHeight - gap) : rect.bottom + gap;
      setMenuStyle({ position: "fixed", left, top, width: rect.width, maxHeight, zIndex: 1000 });
    };
    positionMenu();
    window.addEventListener("resize", positionMenu);
    document.addEventListener("scroll", positionMenu, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      document.removeEventListener("scroll", positionMenu, true);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 mb-2">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 rounded-full border border-stone-200 bg-white px-5 py-3 text-left shadow-sm transition hover:border-stone-300 hover:shadow"
      >
        <span className="flex items-center gap-3">
          <span className="text-2xl leading-none">{selected?.flag}</span>
          <span className="font-medium text-stone-800">{selected?.name}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-stone-400" />
      </button>
      {open && createPortal(
        <div ref={menuRef} style={menuStyle} className="overflow-y-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onChange(c.code);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-amber-50"
            >
              <span className="flex items-center gap-3">
                <span className="text-xl leading-none">{c.flag}</span>
                <span className="text-stone-700">{c.name}</span>
              </span>
              {c.code === value && <Check className="h-4 w-4 text-amber-600" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
