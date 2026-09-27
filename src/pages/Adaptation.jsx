// @ts-nocheck
import React, { useState } from "react";
// react-router-dom is provided by the application's runtime dependencies.
// @ts-expect-error The editor may not resolve the package in this workspace.
import { useParams, Link, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useDeleteAdaptation, useRecipe } from "@/lib/recipes-api";
import { getCountry } from "@/data/countries";
import { getCuisine } from "@/data/cuisines";
import { getCategory } from "@/data/categories";
import ContributeDialog from "@/components/ContributeDialog";
import { useToast } from "@/components/ui/use-toast";

export default function Adaptation() {
  const { recipeId, countryCode } = useParams();
  const navigate = useNavigate();
  const { data: recipe, isLoading } = useRecipe(recipeId);
  const [contributeOpen, setContributeOpen] = useState(false);
  const deleteAdaptation = useDeleteAdaptation(recipeId);
  const { toast } = useToast();
  const destCode = (countryCode || "").toUpperCase();
  const adaptation =
    recipe?.adaptations?.find((a) => a.destinationCountry === destCode) || null;

  const handleDelete = () => {
    if (!window.confirm("Delete this adaptation? This cannot be undone.")) return;
    deleteAdaptation.mutate(destCode, {
      onSuccess: () => {
        toast({ title: "Adaptation deleted" });
        navigate(`/recipes/${recipeId}`);
      },
      onError: (err) =>
        toast({ title: "Couldn't delete adaptation", description: err.message, variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-stone-500">Recipe not found.</p>
        <Link to="/recipes" className="mt-4 inline-block text-amber-600 hover:underline">Back to recipes</Link>
      </div>
    );
  }

  const origin = getCountry(recipe.country);
  const dest = getCountry(countryCode);
  const cuisine = getCuisine(recipe.cuisine);
  const category = getCategory(recipe.category);
  const lang = recipe.originalLanguage ? { flag: "", name: recipe.originalLanguage } : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link to={`/recipes/${recipe.id}`} className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
        <span aria-hidden="true" className="text-base">←</span> Back to recipe
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-600">{origin?.flag} {origin?.name}</span>
        <span className="text-stone-400">{recipe.name}</span>
        <span aria-hidden="true" className="text-base text-amber-500">↓</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">Adapted to {dest?.flag} {dest?.name}</span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Original */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Original Recipe</span>
            <StatusBadge status={recipe.status} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-4xl">{origin?.flag}</span>
            <div>
              <h2 className="text-xl font-semibold text-stone-800">{recipe.name}</h2>
              <p className="text-sm text-stone-400">{origin?.name} · {cuisine?.name} · {category?.name}</p>
            </div>
          </div>
          {recipe.originalTitle && recipe.originalTitle !== recipe.name && (
            <p className="mt-2 text-stone-400" dir="auto">Original: {recipe.originalTitle}</p>
          )}
          <p className="mt-1 text-xs text-stone-400">Original language: {lang?.flag} {lang?.name}</p>

          <h3 className="mt-5 text-sm font-semibold text-stone-700">Ingredients</h3>
          <ul className="mt-2 space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {ing}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center gap-2 text-xs text-stone-400">
            <span aria-hidden="true" className="text-xs">👥</span> {recipe.servingSize} servings
          </div>
        </div>

        {/* Adaptation */}
        {adaptation ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Adapted to</span>
              <div className="flex items-center gap-2">
                <StatusBadge status={adaptation.status} />
                <button
                  onClick={handleDelete}
                  disabled={deleteAdaptation.isPending}
                  aria-label="Delete adaptation"
                  className="rounded-full p-1.5 text-stone-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-4xl">{dest?.flag}</span>
              <div>
                <h2 className="text-xl font-semibold text-stone-800">{adaptation.title}</h2>
                <p className="text-sm text-stone-500">{dest?.name} · {adaptation.adaptationType}</p>
              </div>
            </div>

            <h3 className="mt-5 text-sm font-semibold text-stone-700">Ingredients</h3>
            <ul className="mt-2 space-y-2">
              {adaptation.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {ing}
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2.5 border-t border-amber-200/70 pt-5">
              <Row icon={<span aria-hidden="true" className="text-xs">📍</span>} label="Ingredient Availability" value={adaptation.availability} />
              <Row
                icon={<span aria-hidden="true" className="text-xs">🪙</span>}
                label="Estimated Local Cost"
                value={
                  adaptation.estimatedLocalCost != null
                    ? `${dest?.currencySymbol}${adaptation.estimatedLocalCost} ${dest?.currency}`
                    : "Not provided yet"
                }
              />
              <Row icon={<span aria-hidden="true" className="text-xs">👥</span>} label="Serving Size" value={`${adaptation.servingSize} servings`} />
              <Row icon={<span aria-hidden="true" className="text-xs">📝</span>} label="Adaptation Contributor" value={adaptation.contributor} />
            </div>

            {adaptation.notes && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Adaptation Notes</p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{adaptation.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <span aria-hidden="true" className="text-3xl text-stone-300">⚠</span>
            <div>
              <p className="font-medium text-stone-700">No {dest?.name} adaptation yet</p>
              <p className="mt-1 text-sm text-stone-400">
                This recipe hasn't been adapted for {dest?.name}. The original recipe is always preserved.
              </p>
            </div>
            <button
              onClick={() => setContributeOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-amber-400 hover:text-amber-700"
            >
              <span aria-hidden="true" className="text-base">＋</span> Contribute an adaptation
            </button>
            <p className="text-xs text-stone-400">Share how this dish is cooked in {dest?.name}.</p>
          </div>
        )}
      </div>

      {/* Other adaptations */}
      {recipe.adaptations.length > 1 && (
        <div className="mt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">Other adaptations of this recipe</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {recipe.adaptations.map((/** @type {{ destinationCountry: any; id: any; }} */ a) => {
              const ac = getCountry(a.destinationCountry);
              const active = a.destinationCountry === countryCode;
              return (
                <Link
                  key={a.id}
                  to={`/recipes/${recipe.id}/adapt/${a.destinationCountry}`}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${
                    active
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-stone-200 bg-white text-stone-600 hover:border-amber-300"
                  }`}
                >
                  {ac?.flag} {ac?.name}
                  {active && <span aria-hidden="true" className="text-xs">✓</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <ContributeDialog
        open={contributeOpen}
        onOpenChange={setContributeOpen}
        recipe={recipe}
        defaultCountry={destCode}
      />
    </div>
  );
}

/** @param {{ icon: React.ReactNode, label: string, value: React.ReactNode }} props */
function Row({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-2 text-stone-400">
        {icon} {label}
      </span>
      <span className="text-right font-medium text-stone-700">{value}</span>
    </div>
  );
}

/** @param {{ status: string }} props */
function StatusBadge({ status }) {
  const tone = status.toLowerCase();
  const className = tone === "approved" || tone === "published"
    ? "bg-green-100 text-green-700"
    : tone === "pending" || tone === "review"
      ? "bg-amber-100 text-amber-700"
      : "bg-stone-100 text-stone-600";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{status}</span>;
}