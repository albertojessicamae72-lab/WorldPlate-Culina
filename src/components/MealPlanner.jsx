import { useState } from "react";
import { CalendarDays, ChefHat, MapPin, Trash2, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { profileText as tx } from "@/lib/profile-text";
import { useDeleteMealPlan } from "@/lib/accounts-api";
import { getCountry } from "@/data/countries";

export default function MealPlanner({ username, recipes, plans = [], isLoading, error }) {
  const { language } = useApp();
  const [removeError, setRemoveError] = useState("");
  const removePlan = useDeleteMealPlan(username);

  const onRemove = async (planId) => {
    setRemoveError("");
    try { await removePlan.mutateAsync(planId); }
    catch (requestError) { setRemoveError(requestError.message); }
  };

  const planDetails = (plan) => {
    const recipe = recipes.find((item) => item.id === plan.recipeId);
    const adaptation = plan.adaptationCountry && recipe?.adaptations?.find((item) => item.destinationCountry === plan.adaptationCountry);
    return { adaptation, title: adaptation?.title || recipe?.name || plan.recipeId,
      href: adaptation ? `/recipes/${plan.recipeId}/adapt/${plan.adaptationCountry}` : `/recipes/${plan.recipeId}` };
  };

  return (
    <div className="mt-6 space-y-4">
      <div><h2 className="text-2xl font-semibold tracking-tight text-stone-800">{tx(language, "plannerTitle")}</h2><p className="mt-1 text-sm text-stone-500">{tx(language, "plannerDescription")}</p></div>
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4"><div><h3 className="font-semibold text-stone-800">{tx(language, "yourPlan")}</h3></div><CalendarDays className="h-5 w-5 text-amber-600" /></div>
        {removeError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{removeError}</p>}
        {isLoading ? <p className="py-10 text-center text-sm text-stone-500">{tx(language, "loadingPlans")}</p> : error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : plans.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-stone-200 px-4 py-10 text-center"><Utensils className="mx-auto h-8 w-8 text-amber-500" /><p className="mt-3 text-sm font-medium text-stone-700">{tx(language, "noPlans")}</p><p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">{tx(language, "noPlansDesc")}</p></div> : <ul className="mt-4 divide-y divide-stone-100">{plans.map((plan) => {
          const detail = planDetails(plan);
          const date = new Date(`${plan.plannedFor}T12:00:00`);
          const dateLabel = date.toLocaleDateString(language, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
          return <li key={plan.id} className="flex gap-3 py-4"><div className="flex h-[62px] w-[62px] shrink-0 flex-col items-center justify-center rounded-2xl bg-amber-50 text-amber-800"><span className="text-[10px] font-semibold uppercase">{date.toLocaleDateString(language, { month: "short" })}</span><span className="text-xl font-bold leading-tight">{date.getDate()}</span></div><div className="min-w-0 flex-1"><p className="text-xs font-medium text-stone-500">{dateLabel}</p><Link to={detail.href} className="mt-0.5 block truncate text-sm font-semibold text-stone-800 hover:text-amber-800">{detail.title}</Link><p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">{detail.adaptation ? <MapPin className="h-3 w-3" /> : <ChefHat className="h-3 w-3" />}{detail.adaptation ? `${tx(language, "adaptationOption")} · ${getCountry(plan.adaptationCountry)?.name || plan.adaptationCountry}` : tx(language, "recipeOption")}</p>{plan.note && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-stone-50 px-3 py-2 text-xs leading-relaxed text-stone-600"><span className="font-semibold">{tx(language, "noteLabel")}: </span>{plan.note}</p>}</div><button type="button" onClick={() => onRemove(plan.id)} aria-label={tx(language, "remove")} title={tx(language, "remove")} disabled={removePlan.isPending} className="mt-1 h-8 w-8 shrink-0 rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><Trash2 className="mx-auto h-4 w-4" /></button></li>;
        })}</ul>}
      </section>
    </div>
  );
}
