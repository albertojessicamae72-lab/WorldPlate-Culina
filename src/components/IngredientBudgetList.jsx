import { Coins } from "lucide-react";

export default function IngredientBudgetList({ ingredients = [], ingredientCosts = [], budgetAdjustment = 0, country }) {
  const costs = new Map(ingredientCosts.map((item) => [item.ingredient, Number(item.amount)]));
  const priced = ingredients.filter((ingredient) => costs.has(ingredient));
  const total = priced.reduce((sum, ingredient) => sum + costs.get(ingredient), 0) + Number(budgetAdjustment || 0);
  return (
    <>
      <ul className="mt-3 divide-y divide-stone-100 rounded-xl border border-stone-100">
        {ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-stone-700"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" /><span className="min-w-0 flex-1">{ingredient}</span>{costs.has(ingredient) && <span className="shrink-0 text-xs font-medium text-stone-500">{country?.currencySymbol}{costs.get(ingredient).toFixed(2)}</span>}</li>)}
      </ul>
      {priced.length > 0 && Number(budgetAdjustment) > 0 && <div className="mt-2 flex items-center justify-between px-1 text-xs text-stone-500"><span>Other costs / allowance</span><span>{country?.currencySymbol}{Number(budgetAdjustment).toFixed(2)}</span></div>}
      {(priced.length > 0 || Number(budgetAdjustment) > 0) && <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5 text-sm"><span className="inline-flex items-center gap-2 font-medium text-stone-700"><Coins className="h-4 w-4 text-amber-700" />Ingredient budget total</span><span className="font-bold text-amber-800">{country?.currencySymbol}{total.toFixed(2)} <span className="text-xs font-medium">{country?.currency}</span></span></div>}
    </>
  );
}
