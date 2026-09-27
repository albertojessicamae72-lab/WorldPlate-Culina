import React from "react";
import { Link, useLocation } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";
import { useApp } from "@/lib/AppContext";
import { getCountry } from "@/data/countries";

const NAV = [
  { label: "Home", to: "/" },
  { label: "Cuisines", to: "/cuisines" },
  { label: "Recipes", to: "/recipes" },
];

export default function Header() {
  const { language, setLanguage, cookingCountry } = useApp();
  const location = useLocation();
  const country = getCountry(cookingCountry);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-stone-800">
            Local<span className="text-amber-600">Plate</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-stone-100 text-stone-900"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            to="/recipes"
            className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 transition hover:border-stone-300 sm:flex"
          >
            <span className="text-base leading-none">{country?.flag}</span>
            <span className="font-medium">{country?.name}</span>
          </Link>
          <LanguageSelector value={language} onChange={setLanguage} />
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {NAV.map((item) => {
          const active =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active ? "bg-stone-100 text-stone-900" : "text-stone-500"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}