// @ts-nocheck
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Leaf, Clock3 } from "lucide-react";
import CountrySelector from "@/components/CountrySelector";
import CuisineCard from "@/components/CuisineCard";
import { CUISINES } from "@/data/cuisines";
import { CATEGORIES } from "@/data/categories";
import { useRecipes } from "@/lib/recipes-api";
import { useApp } from "@/lib/AppContext";
import { translate as t } from "@/lib/translations";
import InteractionBar from "@/components/InteractionBar";

export default function Home() {
  const { cookingCountry, setCookingCountry, language } = useApp();
  const tr = (key) => t(language, key);
  const { data: recipes = [] } = useRecipes();
  const [showAllCuisines, setShowAllCuisines] = useState(false);
  const featured = CUISINES.slice(0, 8);
  const visible = showAllCuisines ? CUISINES : featured;


  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#f6f1e8]">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 md:grid-cols-[1fr_0.9fr] md:gap-10 md:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-amber-700">
              <Sparkles className="h-3.5 w-3.5" /> {tr("tagline")}
            </span>
            <h1 className="mt-5 text-3xl font-semibold leading-[1.14] tracking-tight text-stone-800 sm:text-4xl lg:text-5xl">
              {tr("heroTitle")}
              <br />
              <span className="text-amber-600">{tr("heroAccent")}</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
              {tr("heroDescription")}
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link
                to="/cuisines"
                className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
              >
                {tr("exploreCuisines")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/recipes"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400"
              >
                {tr("exploreRecipes")}
              </Link>
            </div>

            <div className="mt-6 max-w-xs rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-stone-200/70">
              <CountrySelector
                label={tr("cookingCountry")}
                value={cookingCountry}
                onChange={setCookingCountry}
              />
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md md:mt-2">
            <div className="pointer-events-none absolute -left-2 top-8 z-10 rounded-2xl bg-white px-3.5 py-2.5 shadow-lg sm:-left-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-800"><span className="text-lg">🇵🇭</span> {tr("madeForTable")}</div>
              <p className="mt-1 text-xs text-stone-500">{tr("recipesTravel")}</p>
            </div>
            <Link to="/recipes/chicken-adobo" aria-label="Open the Chicken Adobo recipe" className="block overflow-hidden rounded-[1.75rem] bg-amber-100 shadow-xl shadow-amber-900/10 ring-4 ring-white/60 transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400">
              <img src="/images/chicken-adobo.png" alt="A home-cooked Filipino chicken adobo" className="aspect-[4/3] w-full object-cover" />
            </Link>
            <div className="pointer-events-none absolute -bottom-4 right-2 flex items-center gap-2.5 rounded-2xl bg-white p-2.5 pr-4 shadow-xl sm:right-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Leaf className="h-5 w-5" /></span>
              <div><p className="text-sm font-semibold text-stone-800">{tr("cookYourWay")}</p><p className="text-xs text-stone-500">{tr("localSwapsSoul")}</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Cuisines */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-800">{tr("exploreTitle")}</h2>
            <p className="mt-1 text-stone-500">{tr("exploreDescription")}</p>
          </div>
          <Link to="/cuisines" className="hidden text-sm font-medium text-amber-600 hover:text-amber-700 sm:inline">
            {tr("viewAll")}
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
              {tr("showAll")} {CUISINES.length} {tr("cuisines").toLowerCase()}
            </button>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-800">{tr("browseCategory")}</h2>
        <p className="mt-1 text-stone-500">{tr("categoryDescription")}</p>
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
                <span className="text-sm font-medium text-stone-700">{tr(`category_${cat.code}`)}</span>
                <span className="text-xs text-stone-400">
                  {count > 0 ? `${count} ${count > 1 ? tr("recipesPlural") : tr("recipe")}` : tr("comingSoon")}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured recipes */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-800">{tr("featured")}</h2>
            <p className="mt-1 text-stone-500">{tr("featuredDescription")}</p>
          </div>
          <Link to="/recipes" className="text-sm font-medium text-amber-600 hover:text-amber-700">
            {tr("viewAll")}
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.slice(0, 3).map((r) => (
            <RecipeCardLite key={r.id} recipe={r} language={language} />
          ))}
        </div>
      </section>

    </div>
  );
}

function RecipeCardLite({ recipe, language }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl">
      <div className="relative h-48 overflow-hidden bg-amber-50">
        <Link to={`/recipes/${recipe.id}`} aria-label={`Open ${recipe.name}`} className="absolute inset-0">
          <img src={recipe.image?.startsWith("/") ? recipe.image : recipe.id === "molokhia" ? "/images/molokhiya.png" : "/images/chicken-adobo.png"} alt={recipe.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </Link>
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-stone-700 backdrop-blur">{recipe.cuisine}</span>
      </div>
      <div className="p-5">
        <Link to={`/recipes/${recipe.id}`} className="text-lg font-semibold text-stone-800 hover:text-amber-700">{recipe.name}</Link>
        <div className="mt-3 flex items-center justify-between text-sm text-stone-500">
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> {t(language, "homeStyleFavorite")}</span>
          <ArrowRight className="h-4 w-4 text-stone-300 transition group-hover:translate-x-1 group-hover:text-amber-600" />
        </div>
        <InteractionBar interactionId={recipe.id} commentsHref={`/recipes/${recipe.id}#comments`} />
      </div>
    </article>
  );
}
