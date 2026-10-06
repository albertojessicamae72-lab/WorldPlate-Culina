import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import LikeButton from "@/components/LikeButton";
import { useComments } from "@/lib/recipes-api";
import { useApp } from "@/lib/AppContext";
import { translate as t } from "@/lib/translations";

export default function InteractionBar({ interactionId, commentsHref }) {
  const { language } = useApp();
  const tr = (key, values) => t(language, key, values);
  const { data: comments = [] } = useComments(interactionId);

  return (
    <div className="flex items-center gap-2 border-t border-stone-100 pt-3" onClick={(event) => event.stopPropagation()}>
      <LikeButton recipeId={interactionId} compact />
      <Link
        to={commentsHref}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-stone-500 transition hover:bg-amber-50 hover:text-amber-700"
        aria-label={tr("commentsCount", { count: comments.length })}
      >
        <MessageCircle className="h-4 w-4" />
        <span>{comments.length}</span>
        <span className="hidden sm:inline">{tr("comments")}</span>
      </Link>
    </div>
  );
}
