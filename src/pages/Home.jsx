// @ts-nocheck
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Globe2, UtensilsCrossed, Sparkles } from "lucide-react";
import CountrySelector from "@/components/CountrySelector";
import CuisineCard from "@/components/CuisineCard";
import { CUISINES } from "@/data/cuisines";
import { CATEGORIES } from "@/data/categories";
import { useRecipes } from "@/lib/recipes-api";
import { useApp } from "@/lib/AppContext";

export default function Home() {
  const { cookingCountry, setCookingCountry } = useApp();
  const navigate = useNavigate();
  const { data: recipes = [] } = useRecipes();
  const [showAllCuisines, setShowAllCuisines] = useState(false);
  const featured = CUISINES.slice(0, 8);
  const visible = showAllCuisines ? CUISINES : featured;

  const goExplore = (path) => navigate(path);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-amber-100 via-orange-50 to-rose-50" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #92400e 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-amber-700">
              <Sparkles className="h-3.5 w-3.5" /> Free · Community-driven · No AI recipes
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-stone-800 sm:text-5xl">
              Discover food from anywhere.
              <br />
              <span className="text-amber-600">Make it work where you are.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-500">
              Explore recipes from different cultures and discover how people adapt
              them to local ingredients, availability, and budgets.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => goExplore("/cuisines")}
                className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
              >
                Explore Cuisines <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => goExplore("/recipes")}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400"
              >
                Explore Recipes
              </button>
              <button
                onClick={() => goExplore("/recipes")}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400"
              >
                <UtensilsCrossed className="h-4 w-4" /> Adapt a Recipe
              </button>
            </div>

            <div className="mt-10 max-w-xs">
              <CountrySelector
                label="Where are you cooking?"
                value={cookingCountry}
                onChange={setCookingCountry}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cuisines */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-800">Explore cuisines</h2>
            <p className="mt-1 text-stone-500">Recipes contributed by people from or familiar with each cuisine.</p>
          </div>
          <Link to="/cuisines" className="hidden text-sm font-medium text-amber-600 hover:text-amber-700 sm:inline">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((c) => (
            <CuisineCard key={c.code} cuisine={c} recipeCount={recipes.filter((r) => r.cuisine === c.code).length} />
          ))}
        </div>
        {!showAllCuisines && CUISINES.length > featured.length && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAllCuisines(true)}
              className="text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              Show all {CUISINES.length} cuisines
            </button>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-800">Browse by category</h2>
        <p className="mt-1 text-stone-500">Some categories are still growing — they'll fill in as the community contributes.</p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => {
            const count = recipes.filter((r) => r.category === cat.code).length;
            return (
              <Link
                key={cat.code}
                to={`/recipes?category=${cat.code}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-6 text-center shadow-sm transition hover:border-amber-300 hover:shadow-md"
              >
                <span className="flex justify-center text-amber-600"><cat.icon className="h-7 w-7" /></span>
                <span className="text-sm font-medium text-stone-700">{cat.name}</span>
                <span className="text-xs text-stone-400">
                  {count > 0 ? `${count} recipe${count > 1 ? "s" : ""}` : "Coming soon"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured recipes */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-800">Featured recipes</h2>
            <p className="mt-1 text-stone-500">Original recipes with community adaptations.</p>
          </div>
          <Link to="/recipes" className="text-sm font-medium text-amber-600 hover:text-amber-700">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <RecipeCardLite key={r.id} recipe={r} />
          ))}
        </div>
      </section>

      {/* Mission strip */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50/60 px-6 py-12 text-center">
          <Globe2 className="h-8 w-8 text-amber-600" />
          <p className="max-w-xl text-xl font-medium text-stone-700">
            "Food travels across borders, but ingredients are local."
          </p>
          <p className="text-sm text-stone-500">
            Every adaptation is a community contribution — never an automatic substitution.
          </p>
        </div>
      </section>
    </div>
  );
}

function RecipeCardLite({ recipe }) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md"
    >
      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-amber-50 to-orange-50">
        {recipe.image && recipe.image.startsWith("/") ? (
          <img src={recipe.image} alt={recipe.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl">{recipe.image || "🍽️"}</span>
        )}
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold text-stone-800">{recipe.name}</h3>
        <p className="truncate text-sm text-stone-400">
          {recipe.adaptations?.length || 0} adaptation{recipe.adaptations?.length === 1 ? "" : "s"}
        </p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-stone-300 transition group-hover:text-amber-600" />
    </Link>
  );
}