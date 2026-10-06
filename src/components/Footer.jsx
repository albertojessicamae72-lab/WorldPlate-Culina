import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { useApp } from "@/lib/AppContext";
import { translate as t } from "@/lib/translations";
import { profileText as tx } from "@/lib/profile-text";

export default function Footer() {
  const { language } = useApp();
  const tr = (key) => t(language, key);
  return (
    <footer className="mt-20 border-t border-stone-200 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-9 w-9" />
              <span className="min-w-0 break-words text-lg font-semibold tracking-tight text-stone-800">
                WorldPlate Culina
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-500">
              {tr("footerDescription")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
            <Link to="/cuisines" className="text-stone-500 hover:text-stone-800">{tr("cuisines")}</Link>
            <Link to="/recipes" className="text-stone-500 hover:text-stone-800">{tr("recipes")}</Link>
            <Link to="/recipes" className="text-stone-500 hover:text-stone-800">{tr("adaptRecipe")}</Link>
            <Link to="/recipes" className="text-stone-500 hover:text-stone-800">{tr("contribute")}</Link>
            <Link to="/about" className="text-stone-500 hover:text-stone-800">{tx(language, "aboutUs")}</Link>
          </div>
        </div>
        <div className="mt-10 flex items-center gap-1.5 text-xs text-stone-400">
          <Heart className="h-3.5 w-3.5" />
          <span>{tr("footerTagline")}</span>
        </div>
      </div>
    </footer>
  );
}
