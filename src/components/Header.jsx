import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LockKeyhole, UserRound } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import LanguageSelector from "@/components/LanguageSelector";
import { useApp } from "@/lib/AppContext";
import { getCountry } from "@/data/countries";
import { translate as t } from "@/lib/translations";
import { useAuth } from "@/lib/AuthContext";
import { profileText as tx } from "@/lib/profile-text";

const NAV = [
  { key: "home", to: "/" },
  { key: "recipes", to: "/recipes" },
  { key: "restaurants", label: "Restaurant map", to: "/restaurants", locked: true },
  { key: "aboutUs", to: "/about" },
];

export default function Header() {
  const { language, setLanguage, cookingCountry } = useApp();
  const { user, isAuthenticated } = useAuth();
  const tr = (key) => t(language, key);
  const location = useLocation();
  const country = getCountry(cookingCountry);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <BrandMark className="h-9 w-9" />
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-stone-800">WorldPlate</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-orange">Culina</span>
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-0.5 lg:flex">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            if (item.locked) {
              return (
                <span
                  key={item.to}
                  aria-disabled="true"
                  aria-label={`${tr("restaurantMap")}, ${tr("comingSoon")}`}
                  title={tr("comingSoon")}
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-stone-400"
                >
                  {tr("restaurantMap")}<LockKeyhole className="h-3.5 w-3.5" />
                </span>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-light-orange text-brand-orange"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {item.label ? (item.key === "restaurants" ? tr("restaurantMap") : item.label) : (item.key === "aboutUs" ? tx(language, "aboutUs") : tr(item.key))}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            to="/recipes"
            className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 transition hover:border-stone-300 xl:flex"
          >
            <span className="text-base leading-none">{country?.flag}</span>
            <span className="font-medium">{country?.name}</span>
          </Link>
          <LanguageSelector value={language} onChange={setLanguage} />
          <Link to={isAuthenticated ? "/profile" : "/login"}                     className="inline-flex h-10 min-w-0 max-w-40 items-center gap-2 rounded-full bg-brand-orange px-3 text-sm font-medium text-white transition hover:bg-brand-deep-orange sm:max-w-56" aria-label={isAuthenticated ? "Open your profile" : "Sign in"}>
            <UserRound className="h-4 w-4 shrink-0" /><span className="hidden truncate sm:inline">{isAuthenticated ? (user?.full_name || user?.name || "Profile") : "Sign in"}</span>
          </Link>
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
        {NAV.map((item) => {
          const active =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          if (item.locked) {
            return (
              <span
                key={item.to}
                aria-disabled="true"
                aria-label={`${tr("restaurantMap")}, ${tr("comingSoon")}`}
                title={tr("comingSoon")}
                className="inline-flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-stone-400"
              >
                {tr("restaurantMap")}<LockKeyhole className="h-3.5 w-3.5" />
              </span>
            );
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active ? "bg-brand-light-orange text-brand-orange" : "text-stone-500"
              }`}
            >
                {item.label ? (item.key === "restaurants" ? tr("restaurantMap") : item.label) : (item.key === "aboutUs" ? tx(language, "aboutUs") : tr(item.key))}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
