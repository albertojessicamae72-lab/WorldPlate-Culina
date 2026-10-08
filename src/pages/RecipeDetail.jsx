import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDownUp, ArrowLeft, ChefHat, Coins, Globe2, Tag, Trash2, Users } from "lucide-react";
import { useDeleteRecipe, useRecipe } from "@/lib/recipes-api";
import { getCountry } from "@/data/countries";
import { getCuisine } from "@/data/cuisines";
import { getCategory } from "@/data/categories";
// @ts-ignore
import { getLanguage } from "@/data/languages";
import StatusBadge from "@/components/StatusBadge";
import AdaptRecipeDialog from "@/components/AdaptRecipeDialog";
import LikeButton from "@/components/LikeButton";
import SaveRecipeButton from "@/components/SaveRecipeButton";
import CommentsSection from "@/components/CommentsSection";
import IngredientBudgetList from "@/components/IngredientBudgetList";
import MyListCount from "@/components/MyListCount";
import LocalTwistsSection from "@/components/LocalTwistsSection";
import CommunityTipsToggle from "@/components/CommunityTipsToggle";
import InteractionBar from "@/components/InteractionBar";
import { useToast } from "@/components/ui/use-toast";
import { getViewerId } from "@/lib/current-user";
import { useApp } from "@/lib/AppContext";
import { useSetRecipeCommunityTips } from "@/lib/recipes-api";

export default function RecipeDetail() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [contentTab, setContentTab] = useState("recipe");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: recipe, isLoading } = useRecipe(recipeId);
  const deleteRecipe = useDeleteRecipe();
  const updateCommunityTips = useSetRecipeCommunityTips(recipeId);
  const { toast } = useToast();
  const { language } = useApp();

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

  const country = getCountry(recipe.country);
  const cuisine = getCuisine(recipe.cuisine);
  const category = getCategory(recipe.category);
  const lang = getLanguage(recipe.originalLanguage);
  const CategoryIcon = category?.icon;
  const photoUrl = recipe.image && recipe.image.startsWith("/") ? recipe.image : null;
  const isOwner = Boolean(recipe.owner) && recipe.owner === getViewerId();

  const handleDelete = () => {
    deleteRecipe.mutate(
      { recipeId: recipe.id, owner: getViewerId() },
      {
        onSuccess: () => {
          toast({ title: "Recipe deleted" });
          navigate("/recipes");
        },
        onError: (err) => {
          setConfirmDelete(false);
          toast({ title: "Couldn't delete recipe", description: err.message, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <Link to="/recipes" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
          <ArrowLeft className="h-4 w-4" /> All recipes
        </Link>
        {isOwner && (
          confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-stone-500 sm:inline">Delete this recipe?</span>
              <button
                onClick={handleDelete}
                disabled={deleteRecipe.isPending}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleteRecipe.isPending ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleteRecipe.isPending}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Delete recipe
            </button>
          )
        )}
      </div>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-linear-to-br from-amber-50 via-orange-50 to-rose-50 sm:h-32 sm:w-32">
          {photoUrl ? (
            <img src={photoUrl} alt={recipe.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">{recipe.image || "🍽️"}</div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
              {cuisine?.flag} {cuisine?.name}
            </span>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
              {CategoryIcon && <CategoryIcon className="mr-1 inline-block h-3.5 w-3.5" />} {category?.name}
            </span>
            <StatusBadge status={recipe.status} />
          </div>
          <h1 className="mt-2 break-words text-xl font-semibold tracking-tight text-stone-800 sm:text-2xl lg:text-3xl">{recipe.name}</h1>
          {recipe.originalTitle && recipe.originalTitle !== recipe.name && (
            <p className="mt-1 text-lg text-stone-400" dir="auto">{recipe.originalTitle}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1.5"><Globe2 className="h-4 w-4" /> {country?.flag} {country?.name}</span>
            <span className="inline-flex items-center gap-1.5"><ChefHat className="h-4 w-4" /> {lang?.flag} {lang?.name}</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {recipe.servingSize} servings</span>
            <span className="inline-flex items-center gap-1.5"><Tag className="h-4 w-4" /> By {recipe.contributor}</span>
          </div>
          {recipe.collaborators?.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-500"><span>Made with</span>{recipe.collaborators.map((person) => <Link key={person.id} to={`/members/${encodeURIComponent(person.username)}`} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-800 hover:bg-amber-100">@{person.username}</Link>)}</div>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <LikeButton recipeId={recipe.id} />
            <SaveRecipeButton recipeId={recipe.id} title={recipe.name} />
            <MyListCount recipeId={recipe.id} />
          </div>
        </div>
      </div>

      {/* Adapt CTA */}
      <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-stone-800">Want to cook this where you are?</p>
          <p className="text-sm text-stone-500">See how this recipe can be locally adapted in your country.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
        >
          <ArrowDownUp className="h-4 w-4" /> Adapt this recipe
        </button>
      </div>

      {isOwner && (
        <div className="mt-4 max-w-xl">
          <CommunityTipsToggle
            checked={Boolean(recipe.allowCommunityTips)}
            onChange={(enabled) => updateCommunityTips.mutate(enabled, {
              onError: (error) => toast({ title: "Couldn't update community tips", description: error.message, variant: "destructive" }),
            })}
            disabled={updateCommunityTips.isPending}
          />
        </div>
      )}

      <div className="mt-5 space-y-5">
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div role="tablist" aria-label="Recipe content" className="flex overflow-x-auto border-b border-stone-200 bg-stone-50 p-2">
          {[['recipe', 'Recipe ingredients'], ['adaptations', 'Adaptation ingredients']].map(([key, label]) => <button key={key} role="tab" aria-selected={contentTab === key} onClick={() => setContentTab(key)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${contentTab === key ? "bg-white text-amber-800 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}>{label}</button>)}
        </div>
        <div className="p-4 sm:p-5">
          {contentTab === "recipe" && (
            <div>
              <h2 className="text-base font-semibold text-stone-800">{recipe.name} · Ingredients</h2>
              <IngredientBudgetList ingredients={recipe.ingredients} ingredientCosts={recipe.ingredientCosts} budgetAdjustment={recipe.budgetAdjustment} country={country} />
              <div className="mt-5 border-t border-stone-100 pt-4">
                <h2 className="text-base font-semibold text-stone-800">Preparation</h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{recipe.preparation}</p>
              </div>
              {recipe.estimatedCost != null && !recipe.ingredientCosts?.length && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2.5 text-sm text-stone-600">
                  <Coins className="h-4 w-4 text-stone-400" />Estimated cost: <span className="font-medium">{country?.currencySymbol}{recipe.estimatedCost} {country?.currency}</span>
                </div>
              )}
              <div className="mt-5 border-t border-stone-100 pt-4">
                <LocalTwistsSection
                  recipeId={recipe.id}
                  allowCommunityTips={Boolean(recipe.allowCommunityTips)}
                  scopeLabel={`Tips for ${recipe.name}`}
                />
              </div>
            </div>
          )}
          {contentTab === "adaptations" && (
            recipe.adaptations.length ? (
              <div className="space-y-4">
                {recipe.adaptations.map((adaptation) => {
                  const adaptedCountry = getCountry(adaptation.destinationCountry);
                  return (
                    <article key={adaptation.id} className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h2 className="font-semibold text-stone-800">{adaptedCountry?.flag} {adaptation.title}</h2>
                        <Link to={`/recipes/${recipe.id}/adapt/${adaptation.destinationCountry}`} className="shrink-0 text-sm font-medium text-amber-700 hover:underline">Open adaptation</Link>
                      </div>
                      <IngredientBudgetList ingredients={adaptation.ingredients} ingredientCosts={adaptation.ingredientCosts} budgetAdjustment={adaptation.budgetAdjustment} country={adaptedCountry} />
                      <div className="mt-4 border-t border-amber-200/70 pt-4">
                        <LocalTwistsSection
                          recipeId={recipe.id}
                          countryCode={adaptation.destinationCountry}
                          allowCommunityTips={Boolean(adaptation.allowCommunityTips)}
                          scopeLabel={`${adaptation.title} · ${adaptedCountry?.name}`}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-stone-500">No adaptations yet. Be the first to adapt this recipe.</p>
            )
          )}
        </div>
      </section>

        <aside className="grid items-start gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">Translations</h3>
            <p className="mt-1 text-xs text-stone-400">Original language: <span className="font-medium text-stone-600">{lang?.flag} {lang?.name}</span></p>
            <ul className="mt-3 space-y-2">
              {(recipe.translations ?? []).map((t) => {
                const tl = getLanguage(t.language);
                return (
                  <li key={t.language} className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">{tl?.flag} {tl?.name}</span>
                    {t.status === "available" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Available
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">Not yet translated</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-stone-400">Translation contributed by community</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">Adaptations</h3>
            {recipe.adaptations.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {recipe.adaptations.map((a) => {
                  const ac = getCountry(a.destinationCountry);
                  return (
                    <li key={a.id} className="rounded-xl border border-stone-100 px-2.5 py-2">
                      <Link
                        to={`/recipes/${recipe.id}/adapt/${a.destinationCountry}`}
                        className="flex items-center justify-between transition hover:text-amber-700"
                      >
                        <span className="flex items-center gap-2.5 text-sm text-stone-700">
                          <span className="text-lg">{ac?.flag}</span> {ac?.name}
                        </span>
                        <ArrowDownUp className="h-3.5 w-3.5 text-amber-600" />
                      </Link>
                      <InteractionBar
                        interactionId={`${recipe.id}--${a.destinationCountry}`}
                        commentsHref={`/recipes/${recipe.id}/adapt/${a.destinationCountry}#comments`}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
            <p className="mt-2 text-sm text-stone-400">No adaptations yet. Be the first to adapt this recipe.</p>
            )}
            <button
              onClick={() => setOpen(true)}
              className="mt-3 w-full rounded-full border border-stone-300 bg-white py-2.5 text-sm font-medium text-stone-700 transition hover:border-amber-400 hover:text-amber-700"
            >
              + Contribute an adaptation
            </button>
          </div>
        </aside>
      </div>
      <CommentsSection recipeId={recipe.id} />

      <AdaptRecipeDialog recipe={recipe} open={open} onOpenChange={setOpen} />
    </div>
  );
}
