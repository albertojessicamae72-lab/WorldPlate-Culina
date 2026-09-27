import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Globe2 } from "lucide-react";
import { getCountry } from "@/data/countries";
import { getCuisine } from "@/data/cuisines";
import { getLanguage } from "@/data/languages";

export default function RecipeCard({ recipe }) {
  const country = getCountry(recipe.country);
  const cuisine = getCuisine(recipe.cuisine);
  const lang = getLanguage(recipe.originalLanguage);
  const adaptationCount = recipe.adaptations?.length || 0;

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
    >
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        {recipe.image && recipe.image.startsWith("/") ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl opacity-90">{recipe.image || "🍽️"}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-600 shadow-sm">
          {cuisine?.flag} {cuisine?.name}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <Globe2 className="h-3.5 w-3.5" />
          <span>{lang?.flag} {lang?.name}</span>
        </div>
        <h3 className="mt-1.5 text-lg font-semibold text-stone-800">{recipe.name}</h3>
        {recipe.originalTitle && recipe.originalTitle !== recipe.name && (
          <p className="text-sm text-stone-400" dir="auto">{recipe.originalTitle}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-xs text-stone-500">
            {adaptationCount > 0
              ? `${adaptationCount} adaptation${adaptationCount > 1 ? "s" : ""}`
              : "No adaptations yet"}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
            View <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}