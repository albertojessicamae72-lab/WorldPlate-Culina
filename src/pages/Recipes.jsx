import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useRecipes } from "@/lib/recipes-api";
import { CUISINES } from "@/data/cuisines";
import { CATEGORIES } from "@/data/categories";
import { COUNTRIES } from "@/data/countries";
// @ts-ignore
import RecipeCard from "@/components/RecipeCard";
import ContributeDialog from "@/components/ContributeDialog";

export default function Recipes() {
  const [params, setParams] = useUrlSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [contributeOpen, setContributeOpen] = useState(false);
  const { data: allRecipes = [], isLoading } = useRecipes();
  const cuisine = params.get("cuisine") || "";
  const category = params.get("category") || "";
  const country = params.get("country") || "";

  /**
   * @param {RecipeFilterKey} key
   * @param {string} value
   */
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const filtered = useMemo(() => {
    return allRecipes.filter((/** @type {{ cuisine: string; category: string; country: string; name: string; originalTitle: any; }} */ r) => {
      if (cuisine && r.cuisine !== cuisine) return false;
      if (category && r.category !== category) return false;
      if (country && r.country !== country) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !(r.originalTitle || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allRecipes, query, cuisine, category, country]);

  const activeCount = [cuisine, category, country].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800">Recipes</h1>
          <p className="mt-2 text-stone-500">
            Browse original recipes from around the world. Advanced cross-country and
            budget filters are coming soon.
          </p>
        </div>
        <button
          onClick={() => setContributeOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" /> Add a recipe
        </button>
      </div>

      {/* Search + filters */}
      <div className="mt-8 flex flex-col gap-3">
        <div className="relative">
          <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes..."
            className="w-full rounded-full border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-stone-400">
            <span aria-hidden="true">☷</span> Filters
          </span>
          <FilterSelect label="Cuisine" value={cuisine} onChange={(v) => update("cuisine", v)} options={CUISINES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))} />
          <FilterSelect label="Category" value={category} onChange={(v) => update("category", v)} options={CATEGORIES.map((c) => ({ value: c.code, label: c.name }))} />
          <FilterSelect label="Country" value={country} onChange={(v) => update("country", v)} options={COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))} />
          {activeCount > 0 && (
            <button onClick={() => setParams(new URLSearchParams())} className="text-xs font-medium text-amber-600 hover:underline">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <p className="mt-6 text-sm text-stone-400">
        {filtered.length} recipe{filtered.length === 1 ? "" : "s"} found
      </p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((/** @type {{ id: any; }} */ r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>
      {isLoading && (
        <div className="mt-16 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
        </div>
      )}
      {!isLoading && filtered.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-stone-500">
          No recipes match your filters yet.
        </div>
      )}

      <ContributeDialog open={contributeOpen} onOpenChange={setContributeOpen} />
    </div>
  );
}

function useUrlSearchParams() {
  const [params, setParamsState] = useState(
    () => new URLSearchParams(window.location.search),
  );

  const setParams = (/** @type {{ toString: () => any; }} */ next) => {
    const search = next.toString();
    const url = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
    window.history.pushState({}, "", url);
    setParamsState(new URLSearchParams(search));
  };

  React.useEffect(() => {
    const handlePopState = () =>
      setParamsState(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return /** @type {[URLSearchParams, (next: URLSearchParams) => void]} */ ([params, setParams]);
}

/**
 * @param {{
 *   label: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   options: Array<{ value: string, label: string }>
 * }} props
 */
function FilterSelect({ label, value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 shadow-sm outline-none transition focus:border-amber-400"
    >
      <option value="">{label}: All</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/** @typedef {"cuisine" | "category" | "country"} RecipeFilterKey */