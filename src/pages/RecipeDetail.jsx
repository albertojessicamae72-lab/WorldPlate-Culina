import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDownUp, ArrowLeft, ChefHat, Coins, Globe2, Tag, Trash2, Users } from "lucide-react";
import { useDeleteRecipe, useRateRecipe, useRating, useRecipe } from "@/lib/recipes-api";
import { getCountry } from "@/data/countries";
import { getCuisine } from "@/data/cuisines";
import { getCategory } from "@/data/categories";
// @ts-ignore
import { getLanguage } from "@/data/languages";
import StatusBadge from "@/components/StatusBadge";
import AdaptRecipeDialog from "@/components/AdaptRecipeDialog";
import StarRating from "@/components/StarRating";
import CommentsSection from "@/components/CommentsSection";
import { useToast } from "@/components/ui/use-toast";

export default function RecipeDetail() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: recipe, isLoading } = useRecipe(recipeId);
  const { data: rating } = useRating(recipeId);
  const rateRecipe = useRateRecipe(recipeId);
  const deleteRecipe = useDeleteRecipe();
  const { toast } = useToast();

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

  const handleDelete = () => {
    if (!window.confirm(`Delete "${recipe.name}"? This removes the recipe and all its adaptations.`)) return;
    deleteRecipe.mutate(recipe.id, {
      onSuccess: () => {
        toast({ title: "Recipe deleted" });
        navigate("/recipes");
      },
      onError: (err) =>
        toast({ title: "Couldn't delete recipe", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <Link to="/recipes" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
          <ArrowLeft className="h-4 w-4" /> All recipes
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleteRecipe.isPending}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" /> {deleteRecipe.isPending ? "Deleting..." : "Delete recipe"}
        </button>
      </div>

      {/* Header */}
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-linear-to-br from-amber-50 via-orange-50 to-rose-50">
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
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-800">{recipe.name}</h1>
          {recipe.originalTitle && recipe.originalTitle !== recipe.name && (
            <p className="mt-1 text-lg text-stone-400" dir="auto">{recipe.originalTitle}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1.5"><Globe2 className="h-4 w-4" /> {country?.flag} {country?.name}</span>
            <span className="inline-flex items-center gap-1.5"><ChefHat className="h-4 w-4" /> {lang?.flag} {lang?.name}</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {recipe.servingSize} servings</span>
            <span className="inline-flex items-center gap-1.5"><Tag className="h-4 w-4" /> By {recipe.contributor}</span>
          </div>
          <div className="mt-4">
            <StarRating
              value={rating?.average ?? 0}
              count={rating?.count ?? 0}
              disabled={rateRecipe.isPending}
              onRate={(stars) =>
                rateRecipe.mutate(stars, {
                  onSuccess: (data) => toast({ title: `Rated ${stars} star${stars === 1 ? "" : "s"}`, description: `Average is now ${data.average.toFixed(1)} from ${data.count} rating${data.count === 1 ? "" : "s"}.` }),
                  onError: (err) => toast({ title: "Couldn't save rating", description: err.message, variant: "destructive" }),
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Adapt CTA */}
      <div className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Ingredients */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-stone-800">Ingredients</h2>
          <ul className="mt-4 space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3 text-stone-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {ing}
              </li>
            ))}
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-stone-800">Preparation</h2>
          <p className="mt-3 leading-relaxed text-stone-600">{recipe.preparation}</p>

          {recipe.estimatedCost != null && (
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
              <Coins className="h-4 w-4 text-stone-400" />
              Estimated cost: <span className="font-medium">{country?.currencySymbol}{recipe.estimatedCost} {country?.currency}</span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">Translations</h3>
            <p className="mt-1 text-xs text-stone-400">Original language: <span className="font-medium text-stone-600">{lang?.flag} {lang?.name}</span></p>
            <ul className="mt-4 space-y-2.5">
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
            <p className="mt-3 text-xs text-stone-400">Translation contributed by community</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">Adaptations</h3>
            {recipe.adaptations.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {recipe.adaptations.map((a) => {
                  const ac = getCountry(a.destinationCountry);
                  return (
                    <li key={a.id}>
                      <Link
                        to={`/recipes/${recipe.id}/adapt/${a.destinationCountry}`}
                        className="flex items-center justify-between rounded-xl border border-stone-100 px-3 py-2.5 transition hover:border-amber-300 hover:bg-amber-50/50"
                      >
                        <span className="flex items-center gap-2.5 text-sm text-stone-700">
                          <span className="text-lg">{ac?.flag}</span> {ac?.name}
                        </span>
                        <ArrowDownUp className="h-3.5 w-3.5 text-amber-600" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-400">No adaptations yet. Be the first to adapt this recipe.</p>
            )}
            <button
              onClick={() => setOpen(true)}
              className="mt-4 w-full rounded-full border border-stone-300 bg-white py-2.5 text-sm font-medium text-stone-700 transition hover:border-amber-400 hover:text-amber-700"
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