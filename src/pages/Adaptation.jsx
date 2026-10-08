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
import CommentsSection from "@/components/CommentsSection";
import InteractionBar from "@/components/InteractionBar";
import LocalTwistsSection from "@/components/LocalTwistsSection";
import CommunityTipsToggle from "@/components/CommunityTipsToggle";
import SaveRecipeButton from "@/components/SaveRecipeButton";
import MyListCount from "@/components/MyListCount";
import IngredientBudgetList from "@/components/IngredientBudgetList";
import { useToast } from "@/components/ui/use-toast";
import { getViewerId } from "@/lib/current-user";
import { languageForCountry } from "@/lib/AppContext";
import { useSetAdaptationCommunityTips } from "@/lib/recipes-api";

export default function Adaptation() {
  const { recipeId, countryCode } = useParams();
  const navigate = useNavigate();
  const { data: recipe, isLoading } = useRecipe(recipeId);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [contentTab, setContentTab] = useState("recipe");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteAdaptation = useDeleteAdaptation(recipeId);
  const updateCommunityTips = useSetAdaptationCommunityTips(recipeId, countryCode);
  const { toast } = useToast();
  const destCode = (countryCode || "").toUpperCase();
  const adaptation =
    recipe?.adaptations?.find((a) => a.destinationCountry === destCode) || null;
  const interactionId = adaptation ? `${recipeId}--${destCode}` : null;
  const isOwner = Boolean(adaptation?.owner) && adaptation.owner === getViewerId();

  const handleDelete = () => {
    deleteAdaptation.mutate(
      { countryCode: destCode, owner: getViewerId() },
      {
        onSuccess: () => {
          toast({ title: "Adaptation deleted" });
          navigate(`/recipes/${recipeId}`);
        },
        onError: (err) => {
          setConfirmDelete(false);
          toast({ title: "Couldn't delete adaptation", description: err.message, variant: "destructive" });
        },
      },
    );
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link to={`/recipes/${recipe.id}`} className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
        <span aria-hidden="true" className="text-base">←</span> Back to recipe
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-600">{origin?.flag} {origin?.name}</span>
        <span className="text-stone-400">{recipe.name}</span>
        <span aria-hidden="true" className="text-base text-amber-500">↓</span>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">Adapted to {dest?.flag} {dest?.name}</span>
      </div>

      <div className="mt-5 space-y-5">
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div role="tablist" aria-label="Recipe content" className="flex overflow-x-auto border-b border-stone-200 bg-stone-50 p-2">
          {[['recipe', 'Recipe ingredients'], ['adaptation', 'Adaptation ingredients']].map(([key, label]) => <button key={key} role="tab" aria-selected={contentTab === key} onClick={() => setContentTab(key)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${contentTab === key ? "bg-white text-amber-800 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}>{label}</button>)}
        </div>
        <div className="p-4 sm:p-5">
          {contentTab === "recipe" && <div><h2 className="mb-2 font-semibold text-stone-800">{recipe.name} · {origin?.name}</h2><IngredientBudgetList ingredients={recipe.ingredients} ingredientCosts={recipe.ingredientCosts} budgetAdjustment={recipe.budgetAdjustment} country={origin} /></div>}
          {contentTab === "adaptation" && (adaptation ? <div><h2 className="mb-2 font-semibold text-stone-800">{adaptation.title} · {dest?.name}</h2><IngredientBudgetList ingredients={adaptation.ingredients} ingredientCosts={adaptation.ingredientCosts} budgetAdjustment={adaptation.budgetAdjustment} country={dest} /></div> : <p className="py-6 text-center text-sm text-stone-500">No adaptation ingredients have been added yet.</p>)}
        </div>
      </section>

      <section id="adaptation" className="mt-4 scroll-mt-36 rounded-2xl border border-amber-200 bg-amber-50/30 p-4 shadow-sm">
        <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Original */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Original Recipe</span>
            <StatusBadge status={recipe.status} />
          </div>
          <div className="mt-2.5 flex items-center gap-3">
            <span className="text-3xl">{origin?.flag}</span>
            <div>
              <h2 className="text-xl font-semibold text-stone-800">{recipe.name}</h2>
              <p className="text-sm text-stone-400">{origin?.name} · {cuisine?.name} · {category?.name}</p>
            </div>
          </div>
          {recipe.originalTitle && recipe.originalTitle !== recipe.name && (
            <p className="mt-2 text-stone-400" dir="auto">Original: {recipe.originalTitle}</p>
          )}
          <p className="mt-1 text-xs text-stone-400">Original language: {lang?.flag} {lang?.name}</p>

          <div className="mt-3 flex items-center gap-2 text-xs text-stone-400">
            <span aria-hidden="true" className="text-xs">👥</span> {recipe.servingSize} servings
          </div>
        </div>

        {/* Adaptation */}
        {adaptation ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Adapted to</span>
              <div className="flex items-center gap-2">
                <StatusBadge status={adaptation.status} />
                {isOwner && (
                  confirmDelete ? (
                    <span className="flex items-center gap-1.5">
                      <button
                        onClick={handleDelete}
                        disabled={deleteAdaptation.isPending}
                        className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleteAdaptation.isPending ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleteAdaptation.isPending}
                        className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-600 transition hover:bg-white"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      aria-label="Delete adaptation"
                      className="rounded-full p-1.5 text-stone-300 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <span className="text-3xl">{dest?.flag}</span>
              <div>
                <h2 className="text-xl font-semibold text-stone-800">{adaptation.title}</h2>
                <p className="text-sm text-stone-500">{dest?.name} · {adaptation.adaptationType}</p>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-3"><SaveRecipeButton recipeId={recipe.id} adaptationCountry={destCode} title={adaptation.title} /><MyListCount recipeId={recipe.id} adaptationCountry={destCode} /></div>
            </div>

            {adaptation.image && adaptation.image.startsWith("/") && (
              <div className="mt-3 overflow-hidden rounded-xl border border-amber-200">
                <img
                  src={adaptation.image}
                  alt={adaptation.title}
                  className="aspect-[4/3] w-full object-cover"
                />
                <p className="bg-white/70 px-3 py-1.5 text-xs text-stone-500">
                  Cooked version shared by {adaptation.contributor || "a community member"}
                </p>
              </div>
            )}

            <div className="mt-4 space-y-2 border-t border-amber-200/70 pt-4">
              <Row icon={<span aria-hidden="true" className="text-xs">📍</span>} label="Ingredient Availability" value={adaptation.availability} />
              {!adaptation.ingredientCosts?.length && <Row
                icon={<span aria-hidden="true" className="text-xs">🪙</span>}
                label="Estimated Local Cost"
                value={
                  adaptation.estimatedLocalCost != null
                    ? `${dest?.currencySymbol}${adaptation.estimatedLocalCost} ${dest?.currency}`
                    : "Not provided yet"
                }
              />}
              <Row icon={<span aria-hidden="true" className="text-xs">👥</span>} label="Serving Size" value={`${adaptation.servingSize} servings`} />
              <Row icon={<span aria-hidden="true" className="text-xs">📝</span>} label="Adaptation Contributor" value={adaptation.contributor} />
            </div>

            {adaptation.collaborators?.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500"><span>Made with</span>{adaptation.collaborators.map((person) => <Link key={person.id} to={`/members/${encodeURIComponent(person.username)}`} className="rounded-full border border-amber-200 bg-white px-2.5 py-1 font-medium text-amber-800 hover:bg-amber-50">@{person.username}</Link>)}</div>}

            {adaptation.notes && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Adaptation Notes</p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{adaptation.notes}</p>
              </div>
            )}

            {isOwner && (
              <div className="mt-4 border-t border-amber-200/70 pt-4">
                <CommunityTipsToggle
                  checked={Boolean(adaptation.allowCommunityTips)}
                  onChange={(enabled) => updateCommunityTips.mutate(enabled, {
                    onError: (error) => toast({ title: "Couldn't update community tips", description: error.message, variant: "destructive" }),
                  })}
                  disabled={updateCommunityTips.isPending}
                />
              </div>
            )}
            <div className="mt-4 border-t border-amber-200/70 pt-4">
              <LocalTwistsSection
                recipeId={recipe.id}
                countryCode={destCode}
                allowCommunityTips={Boolean(adaptation.allowCommunityTips)}
                scopeLabel={`${adaptation.title} · ${dest?.name}`}
              />
            </div>
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
      </section>

      {/* Other adaptations */}
      {recipe.adaptations.length > 1 && (
          <div className="mt-6">
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

      {adaptation && (
        <div className="mt-6 rounded-2xl border border-amber-100 bg-white px-4">
            <p className="pt-3 text-sm font-medium text-stone-700">Like or comment on this local adaptation</p>
            <InteractionBar interactionId={interactionId} commentsHref="#comments" />
        </div>
      )}
      </div>
      {adaptation && <CommentsSection recipeId={interactionId} />}

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
