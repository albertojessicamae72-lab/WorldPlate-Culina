import { Coins } from "lucide-react";
import { getCountry } from "@/data/countries";

export function readIngredients(text) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function ingredientCostsPayload(ingredientsText, drafts) {
  return readIngredients(ingredientsText).flatMap((ingredient) => {
    const value = drafts[ingredient];
    if (value === undefined || value === "" || !Number.isFinite(Number(value))) return [];
    return [{ ingredient, amount: Number(value) }];
  });
}

export default function IngredientBudgetEditor({ ingredientsText, costs, onChange, countryCode, adjustment, onAdjustmentChange }) {
  const ingredients = readIngredients(ingredientsText);
  const country = getCountry(countryCode);
  const priced = ingredients.flatMap((ingredient) => {
    const value = costs[ingredient];
    return value !== undefined && value !== "" && Number.isFinite(Number(value)) ? [Number(value)] : [];
  });
  const total = priced.reduce((sum, amount) => sum + amount, 0) + (Number(adjustment) || 0);

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
      <div className="flex items-center gap-2"><Coins className="h-4 w-4 text-amber-700" /><p className="text-sm font-semibold text-stone-700">Ingredient budget</p></div>
      <p className="mt-1 text-xs text-stone-500">Add an optional price for each ingredient. Currency follows {country?.name || "the selected country"}.</p>
      {ingredients.length ? <ul className="mt-3 space-y-2">{ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`} className="flex items-center gap-3"><span className="min-w-0 flex-1 truncate text-sm text-stone-700">{ingredient}</span><label className="flex h-9 w-32 shrink-0 items-center rounded-lg border border-stone-200 bg-white px-2.5 focus-within:border-amber-400"><span className="mr-1 text-sm text-stone-500">{country?.currencySymbol || "¤"}</span><input type="number" min="0" step="0.01" inputMode="decimal" value={costs[ingredient] ?? ""} onChange={(event) => onChange({ ...costs, [ingredient]: event.target.value })} aria-label={`${ingredient} price in ${country?.currency || "local currency"}`} placeholder="0.00" className="min-w-0 flex-1 bg-transparent text-right text-sm text-stone-800 outline-none placeholder:text-stone-300" /></label></li>)}</ul> : <p className="mt-3 text-xs text-stone-500">List ingredients above to add their prices.</p>}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-200 pt-3"><label htmlFor="ingredient-budget-adjustment" className="text-xs font-medium text-stone-600">Other costs / allowance</label><label className="flex h-9 w-32 shrink-0 items-center rounded-lg border border-stone-200 bg-white px-2.5 focus-within:border-amber-400"><span className="mr-1 text-sm text-stone-500">{country?.currencySymbol || "¤"}</span><input id="ingredient-budget-adjustment" type="number" min="0" step="0.01" inputMode="decimal" value={adjustment} onChange={(event) => onAdjustmentChange(event.target.value)} aria-label={`Other costs in ${country?.currency || "local currency"}`} placeholder="0.00" className="min-w-0 flex-1 bg-transparent text-right text-sm text-stone-800 outline-none placeholder:text-stone-300" /></label></div>
      {(priced.length > 0 || Number(adjustment) > 0) && <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-3 text-sm"><span className="font-semibold text-stone-700">Estimated total</span><span className="font-bold text-amber-800">{country?.currencySymbol}{total.toFixed(2)} <span className="text-xs font-medium">{country?.currency}</span></span></div>}
    </div>
  );
}
