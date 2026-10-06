import { Heart } from "lucide-react";
import { useLike, useToggleLike } from "@/lib/recipes-api";
import { getViewerId } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/AppContext";
import { translate as t } from "@/lib/translations";

/** @param {{ recipeId: string }} props */
export default function LikeButton({ recipeId, compact = false }) {
  const { language } = useApp();
  const viewer = getViewerId();
  const { data } = useLike(recipeId, viewer);
  const toggle = useToggleLike(recipeId, viewer);

  const liked = data?.liked ?? false;
  const count = data?.count ?? 0;

  return (
    <div className="relative inline-flex items-center gap-1">
    <button
      type="button"
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      aria-pressed={liked}
      aria-label={t(language, liked ? "removeLike" : "likeThisRecipe")}
      className={cn(
        "inline-flex items-center gap-2 rounded-full text-sm font-medium transition disabled:opacity-60",
        compact ? "border border-transparent px-3 py-2" : "border px-4 py-2",
        liked
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : compact ? "text-stone-500 hover:bg-rose-50 hover:text-rose-500" : "border-stone-200 bg-white text-stone-600 hover:border-rose-300 hover:text-rose-500",
      )}
    >
      <Heart
        className={cn(
          compact ? "h-4 w-4 transition" : "h-5 w-5 transition",
          liked ? "fill-rose-500 text-rose-500" : "fill-transparent text-stone-400",
          toggle.isPending && "animate-pulse",
        )}
      />
      <span>{count}</span>
      {!compact && <span className="hidden sm:inline">{t(language, liked ? "liked" : "like")}</span>}
    </button>
    </div>
  );
}
