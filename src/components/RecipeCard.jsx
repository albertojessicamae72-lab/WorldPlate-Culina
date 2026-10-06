import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Coins, Globe2 } from "lucide-react";
import { getCountry } from "@/data/countries";
import { getCuisine } from "@/data/cuisines";
import { getLanguage } from "@/data/languages";
import InteractionBar from "@/components/InteractionBar";
import { useApp } from "@/lib/AppContext";
import { translate as t } from "@/lib/translations";

export default function RecipeCard({ recipe }) {
  const { language } = useApp();
  const tr = (key, values) => t(language, key, values);
  const country = getCountry(recipe.country);
  const cuisine = getCuisine(recipe.cuisine);
  const lang = getLanguage(recipe.originalLanguage);
  const adaptationCount = recipe.adaptations?.length || 0;
  const budgetTotal = recipe.ingredientCosts?.length
    ? recipe.ingredientCosts.reduce((sum, item) => sum + Number(item.amount || 0), 0) + Number(recipe.budgetAdjustment || 0)
    : recipe.estimatedCost;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
      <Link to={`/recipes/${recipe.id}`} aria-label={`${tr("viewAction")} ${recipe.name}`} className="relative block h-40 overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
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
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <Globe2 className="h-3.5 w-3.5" />
          <span>{lang?.flag} {lang?.name}</span>
        </div>
        <Link to={`/recipes/${recipe.id}`} className="mt-1.5 text-lg font-semibold text-stone-800 hover:text-amber-700">{recipe.name}</Link>
        {budgetTotal != null && <span className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><Coins className="h-3.5 w-3.5" />{country?.currencySymbol}{Number(budgetTotal).toFixed(2)} {country?.currency}</span>}
        {recipe.originalTitle && recipe.originalTitle !== recipe.name && (
          <p className="text-sm text-stone-400" dir="auto">{recipe.originalTitle}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs text-stone-500">
            {adaptationCount > 0
              ? tr(adaptationCount === 1 ? "adaptationCountSingular" : "adaptationCount", { count: adaptationCount })
              : tr("noAdaptations")}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
            {tr("viewAction")} <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
        <InteractionBar interactionId={recipe.id} commentsHref={`/recipes/${recipe.id}#comments`} />
      </div>
    </article>
  );
}
