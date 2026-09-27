import React from "react";
import { CUISINES } from "@/data/cuisines";
import { useRecipes } from "@/lib/recipes-api";

/**
 * @param {{ cuisine: { name: string }, recipeCount: number }} props
 */
function CuisineCard({
  cuisine,
  recipeCount,
}) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-stone-800">{cuisine.name}</h2>
      <p className="mt-1 text-sm text-stone-500">
        {recipeCount} {recipeCount === 1 ? "recipe" : "recipes"}
      </p>
    </article>
  );
}

export default function Cuisines() {
  const { data: recipes = [] } = useRecipes();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-800">Cuisine Explorer</h1>
        <p className="mt-2 text-stone-500">
          Recipes from different cultures, contributed by people from or familiar with
          each cuisine. Some cuisines are still waiting for their first recipe.
        </p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {CUISINES.map((c) => (
          <CuisineCard key={c.code} cuisine={c} recipeCount={recipes.filter((r) => r.cuisine === c.code).length} />
        ))}
      </div>
    </div>
  );
}