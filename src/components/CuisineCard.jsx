import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { translate as t } from "@/lib/translations";

export default function CuisineCard({ cuisine, recipeCount = 0 }) {
  const { language } = useApp();
  const tr = (key, values) => t(language, key, values);
  return (
    <Link
      to={`/cuisines/${cuisine.code}`}
      className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
    >
      <span className="text-4xl leading-none transition group-hover:scale-110">{cuisine.flag}</span>
      <div>
        <h3 className="font-semibold text-stone-800">{cuisine.name}</h3>
        <p className="mt-0.5 text-xs text-stone-400">
          {recipeCount > 0 ? tr(recipeCount === 1 ? "recipeCountSingular" : "recipeCount", { count: recipeCount }) : tr("noRecipes")}
        </p>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 opacity-0 transition group-hover:opacity-100">
        {tr("exploreAction")} <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}
