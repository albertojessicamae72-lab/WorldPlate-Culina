import React from "react";
import { getCuisine } from "@/data/cuisines";
import { getCountry } from "@/data/countries";
import { useRecipes } from "@/lib/recipes-api";

function ArrowLeftIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function BookOpenIcon({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 4.5A2.5 2.5 0 014.5 2H20a2 2 0 012 2v15.5a1.5 1.5 0 01-2.5 1.1L12 17l-7.5 3.6A1.5 1.5 0 012 19.5V4.5z" />
      <path d="M12 17V2" />
    </svg>
  );
}

function getCuisineCodeFromPath() {
  if (typeof window === "undefined") return undefined;

  const match = window.location.pathname.match(/\/cuisines\/([^/]+)/i);
  return match?.[1];
}

/** @typedef {{ name?: string, title?: string, image?: string, imageUrl?: string, description?: string, summary?: string, slug?: string, id?: string | number }} Recipe */

/** @param {{ recipe?: Recipe }} props */
function RecipeCard({ recipe = {} }) {
  const title = recipe.name || recipe.title || "Untitled recipe";
  const image = recipe.image || recipe.imageUrl;
  const description = recipe.description || recipe.summary;

  return (
    <a
      href={`/recipes/${recipe.slug || recipe.id}`}
      className="block overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {image && image.startsWith("/") ? (
        <img src={image} alt="" loading="lazy" className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 text-5xl">
          {image || "🍽️"}
        </div>
      )}
      <div className="p-5">
        <h2 className="text-lg font-semibold text-stone-800">{title}</h2>
        {description && <p className="mt-2 line-clamp-2 text-sm text-stone-500">{description}</p>}
      </div>
    </a>
  );
}

export default function CuisineDetail() {
  const cuisineCode = getCuisineCodeFromPath();
  const cuisine = getCuisine(cuisineCode ?? "");
  const { data: allRecipes = [] } = useRecipes();
  if (!cuisine) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-stone-500">Cuisine not found.</p>
        <a href="/cuisines" className="mt-4 inline-block text-amber-600 hover:underline">Back to cuisines</a>
      </div>
    );
  }
  const country = getCountry(cuisine.country);
  const recipes = allRecipes.filter((r) => r.cuisine === cuisine.code);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <a href="/cuisines" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeftIcon className="h-4 w-4" /> All cuisines
      </a>

      <div className="mt-6 flex items-center gap-4">
        <span className="text-6xl leading-none">{cuisine.flag}</span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800">{cuisine.name} Cuisine</h1>
          <p className="text-stone-500">{country?.name}</p>
        </div>
      </div>

      <div className="mt-10">
        {recipes.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map(/** @param {Recipe} recipe */ (recipe) => (
              <RecipeCard key={recipe.id || recipe.slug || recipe.name} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <BookOpenIcon className="h-8 w-8 text-stone-300" />
            <p className="text-stone-500">No recipes yet for {cuisine.name} cuisine.</p>
            <p className="text-sm text-stone-400">Be the first to contribute one.</p>
          </div>
        )}
      </div>
    </div>
  );
}