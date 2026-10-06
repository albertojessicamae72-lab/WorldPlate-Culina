import React, { useMemo, useState } from "react";
import { Coins, MapPin, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useRecipes } from "@/lib/recipes-api";
import { CUISINES } from "@/data/cuisines";
import { CATEGORIES } from "@/data/categories";
import { COUNTRIES, getCountry } from "@/data/countries";
import { useApp } from "@/lib/AppContext";
import RecipeCard from "@/components/RecipeCard";
import ContributeDialog from "@/components/ContributeDialog";
import InteractionBar from "@/components/InteractionBar";

function totalCost(item, kind) {
  const costs = item.ingredientCosts || [];
  if (costs.length) return costs.reduce((sum, cost) => sum + Number(cost.amount || 0), 0) + Number(item.budgetAdjustment || 0);
  return kind === "adaptation" ? item.estimatedLocalCost : item.estimatedCost;
}

export default function Recipes() {
  const [params, setParams] = useUrlSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [budget, setBudget] = useState("");
  const [contributeOpen, setContributeOpen] = useState(false);
  const { data: allRecipes = [], isLoading } = useRecipes();
  const { cookingCountry } = useApp();
  const cuisine = params.get("cuisine") || "";
  const category = params.get("category") || "";
  const country = params.get("country") || "";
  const diet = params.get("diet") || "";
  const currentCurrency = getCountry(cookingCountry);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const meals = useMemo(() => allRecipes.flatMap((recipe) => [
    { ...recipe, kind: "recipe", title: recipe.name, targetCountry: recipe.country, budgetAmount: totalCost(recipe, "recipe"), currencyCountry: recipe.country, href: `/recipes/${recipe.id}`, interactionId: recipe.id },
    ...(recipe.adaptations || []).map((adaptation) => ({
      ...adaptation,
      recipe,
      kind: "adaptation",
      title: adaptation.title,
      targetCountry: adaptation.destinationCountry,
      budgetAmount: totalCost(adaptation, "adaptation"),
      currencyCountry: adaptation.destinationCountry,
      href: `/recipes/${recipe.id}/adapt/${adaptation.destinationCountry}`,
      interactionId: `${recipe.id}--${adaptation.destinationCountry}`,
    })),
  ]), [allRecipes]);

  const filtered = useMemo(() => meals.filter((meal) => {
    if (cuisine && meal.recipe?.cuisine !== cuisine && meal.cuisine !== cuisine) return false;
    if (category && meal.recipe?.category !== category && meal.category !== category) return false;
    if (country && meal.recipe?.country !== country && meal.country !== country && meal.targetCountry !== country) return false;
    if (diet && classifyDiet(meal.ingredients) !== diet) return false;
    if (query) {
      const q = query.toLowerCase();
      const haystack = [meal.title, meal.name, meal.originalTitle, meal.recipe?.name, ...(meal.ingredients || [])].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (budget !== "") {
      const limit = Number(budget);
      if (!Number.isFinite(limit) || meal.currencyCountry !== cookingCountry || meal.budgetAmount == null || meal.budgetAmount > limit) return false;
    }
    return true;
  }), [meals, cuisine, category, country, diet, query, budget, cookingCountry]);

  const activeCount = [cuisine, category, country, diet].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800">Recipes & local adaptations</h1>
          <p className="mt-2 text-stone-500">Find dishes and local versions that fit the ingredients and budget you have.</p>
        </div>
        <button onClick={() => setContributeOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"><Plus className="h-4 w-4" /> Add a recipe</button>
      </div>

      <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
          <label className="relative block"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes, adaptations, or ingredients" className="h-14 w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-12 pr-4 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100" /></label>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-3 py-2"><label htmlFor="budget-filter" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-900"><Coins className="h-3.5 w-3.5" /> Maximum budget</label><div className="mt-1 flex h-8 items-center"><span className="mr-2 text-base font-semibold text-stone-500">{currentCurrency?.currencySymbol}</span><input id="budget-filter" type="number" min="0" step="0.01" inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="150" className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-stone-800 outline-none placeholder:text-stone-400" /><span className="ml-2 text-xs font-semibold text-stone-500">{currentCurrency?.currency}</span></div></div>
        </div>
        <p className="mt-2 px-1 text-xs text-stone-500">Currency and results follow <span className="font-medium text-stone-700">{currentCurrency?.flag} {currentCurrency?.name}</span> selected in “Where are you cooking?” on Home.</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-stone-400"><span aria-hidden="true">☷</span> Filters</span>
        <FilterSelect label="Cuisine" value={cuisine} onChange={(value) => update("cuisine", value)} options={CUISINES.map((item) => ({ value: item.code, label: `${item.flag} ${item.name}` }))} />
        <FilterSelect label="Category" value={category} onChange={(value) => update("category", value)} options={CATEGORIES.map((item) => ({ value: item.code, label: item.name }))} />
        <FilterSelect label="Diet" value={diet} onChange={(value) => update("diet", value)} options={[{ value: "vegetarian", label: "Vegetarian" }, { value: "omnivore", label: "Omnivore" }]} />
        <FilterSelect label="Recipe or adaptation country" value={country} onChange={(value) => update("country", value)} options={COUNTRIES.map((item) => ({ value: item.code, label: `${item.flag} ${item.name}` }))} />
        {activeCount > 0 && <button onClick={() => setParams(new URLSearchParams())} className="text-xs font-medium text-amber-600 hover:underline">Clear filters</button>}
      </div>

      <p className="mt-6 text-sm text-stone-400">{filtered.length} meal{filtered.length === 1 ? "" : "s"} found{budget !== "" ? ` under ${currentCurrency?.currencySymbol}${budget} ${currentCurrency?.currency}` : ""}</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((meal) => meal.kind === "recipe"
          ? <RecipeCard key={`recipe-${meal.id}`} recipe={meal} />
          : <AdaptationCard key={`adaptation-${meal.id}`} meal={meal} />)}
      </div>
      {isLoading && <div className="mt-16 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>}
      {!isLoading && filtered.length === 0 && <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-stone-500">No meals match your search. Try another budget or country.</div>}
      <ContributeDialog open={contributeOpen} onOpenChange={setContributeOpen} />
    </div>
  );
}

function AdaptationCard({ meal }) {
  const country = getCountry(meal.targetCountry);
  const amount = meal.budgetAmount;
  return <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
    <Link to={meal.href} className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"><span className="text-6xl">{country?.flag || "🍲"}</span><span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-600">Local adaptation</span></Link>
    <div className="flex flex-1 flex-col p-4"><div className="flex items-center gap-1.5 text-xs text-stone-400"><MapPin className="h-3.5 w-3.5" /><span>{country?.name} · {meal.recipe?.name}</span></div><Link to={meal.href} className="mt-1.5 text-lg font-semibold text-stone-800 hover:text-amber-700">{meal.title}</Link>
      {amount != null && <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800"><Coins className="h-4 w-4" />{country?.currencySymbol}{Number(amount).toFixed(2)} {country?.currency}</p>}
      <p className="mt-auto pt-3 text-xs text-stone-500">{meal.ingredients?.length || 0} local ingredients</p><InteractionBar interactionId={meal.interactionId} commentsHref={`${meal.href}#comments`} />
    </div>
  </article>;
}

function classifyDiet(ingredients = []) {
  if (!ingredients.length) return "unknown";
  const text = ingredients.map((item) => typeof item === "string" ? item : item?.name || item?.ingredient || "").join(" ").toLowerCase();
  const animalFoods = /\b(beef|pork|chicken|turkey|duck|lamb|mutton|goat|bacon|ham|sausage|meat|fish|salmon|tuna|shrimp|prawn|crab|lobster|anchov|sardine|squid|oyster|clam|mussel|seafood|chorizo|hotdog|hot dog)\b/;
  return animalFoods.test(text) ? "omnivore" : "vegetarian";
}

function useUrlSearchParams() {
  const [params, setParamsState] = useState(() => new URLSearchParams(window.location.search));
  const setParams = (next) => {
    const search = next.toString();
    const url = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
    window.history.pushState({}, "", url);
    setParamsState(new URLSearchParams(search));
  };
  React.useEffect(() => {
    const handlePopState = () => setParamsState(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  return [params, setParams];
}

function FilterSelect({ label, value, onChange, options }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 shadow-sm outline-none transition focus:border-amber-400"><option value="">{label}: All</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}
