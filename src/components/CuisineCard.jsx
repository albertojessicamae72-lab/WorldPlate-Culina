import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CuisineCard({ cuisine, recipeCount = 0 }) {
  return (
    <Link
      to={`/cuisines/${cuisine.code}`}
      className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white px-6 py-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
    >
      <span className="text-5xl leading-none transition group-hover:scale-110">{cuisine.flag}</span>
      <div>
        <h3 className="font-semibold text-stone-800">{cuisine.name}</h3>
        <p className="mt-0.5 text-xs text-stone-400">
          {recipeCount > 0 ? `${recipeCount} recipe${recipeCount > 1 ? "s" : ""}` : "No recipes yet"}
        </p>
      </div>
      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-600 opacity-0 transition group-hover:opacity-100">
        Explore <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}