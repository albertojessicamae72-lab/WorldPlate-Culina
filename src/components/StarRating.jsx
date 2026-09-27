import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   value?: number,
 *   count?: number,
 *   onRate?: (stars: number) => void,
 *   size?: "sm" | "md",
 *   disabled?: boolean,
 * }} props
 */
export default function StarRating({ value = 0, count, onRate, size = "md", disabled }) {
  const [hover, setHover] = useState(0);
  const interactive = Boolean(onRate) && !disabled;
  const shown = hover || value;
  const dim = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
            onMouseEnter={() => interactive && setHover(star)}
            onClick={() => interactive && onRate(star)}
            className={cn(
              "rounded p-0.5 transition",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default",
            )}
          >
            <Star
              className={cn(
                dim,
                star <= Math.round(shown)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-stone-300",
              )}
            />
          </button>
        ))}
      </div>
      {count != null && (
        <span className="text-xs text-stone-400">
          {count > 0 ? `${value.toFixed(1)} · ${count} rating${count === 1 ? "" : "s"}` : "No ratings yet"}
        </span>
      )}
    </div>
  );
}
