import { Users } from "lucide-react";
import { useMealPlanCount } from "@/lib/recipes-api";

export default function MyListCount({ recipeId, adaptationCountry = "" }) {
  const { data } = useMealPlanCount(recipeId, adaptationCountry);
  return <span className="inline-flex items-center gap-1 text-xs text-stone-500"><Users className="h-3.5 w-3.5" />{data?.count ?? 0} in My List</span>;
}
