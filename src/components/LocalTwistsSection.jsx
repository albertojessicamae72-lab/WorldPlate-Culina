import { useState } from "react";
import { Link } from "react-router-dom";
import { Lightbulb, ThumbsDown, ThumbsUp } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useCreateLocalTwist, useLocalTwists, useVoteLocalTwist } from "@/lib/recipes-api";
import { translate as t } from "@/lib/translations";

export default function LocalTwistsSection({ recipeId, countryCode = "", embedded = false }) {
  const { language } = useApp();
  const tr = (key) => t(language, key);
  const [text, setText] = useState("");
  const { user } = useAuth();
  const viewer = user?.id || "";
  const { toast } = useToast();
  const { data: twists = [], isLoading } = useLocalTwists(recipeId, countryCode, viewer);
  const addTwist = useCreateLocalTwist(recipeId, countryCode, viewer);
  const vote = useVoteLocalTwist(recipeId, countryCode, viewer);
  const isAdaptation = Boolean(countryCode);

  const submit = (event) => {
    event.preventDefault();
    const tip = text.trim();
    if (tip.length < 3) return;
    addTwist.mutate(
      { text: tip },
      {
        onSuccess: () => {
          setText("");
          toast({ title: tr("twistPosted") });
        },
        onError: (error) => toast({ title: tr("twistPostError"), description: error.message, variant: "destructive" }),
      },
    );
  };

  return (
    <section id="tips" className={embedded ? "scroll-mt-36" : "mt-6 scroll-mt-36 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5"}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
          <Lightbulb className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-stone-800">{isAdaptation ? tr("localTwistsTitle") : "Recipe tips"}</h2>
          <p className="mt-1 text-sm leading-relaxed text-stone-500">{isAdaptation ? tr("localTwistsDescription") : "Share a practical cooking tip to help others make this recipe."}</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={180}
          minLength={3}
          placeholder={isAdaptation ? tr("twistPlaceholder") : "Add a recipe tip…"}
          aria-label={isAdaptation ? tr("twistPlaceholder") : "Add a recipe tip"}
          className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        <button
          type="submit"
          disabled={text.trim().length < 3 || addTwist.isPending}
          className="rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {addTwist.isPending ? tr("twistSubmitting") : tr("twistSubmit")}
        </button>
      </form>

      {isLoading ? (
        <p className="mt-4 text-sm text-stone-500">{tr("twistLoading")}</p>
      ) : twists.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-white/70 px-4 py-4 text-center text-sm text-stone-500">
          {tr("twistEmpty")}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {twists.map((tip) => (
            <li key={tip.id} className="flex items-start justify-between gap-4 rounded-xl border border-amber-100 bg-white p-3.5 shadow-sm">
              <div className="min-w-0">
                <p className="break-words text-sm leading-relaxed text-stone-700">{tip.text}</p>
                <Link to={tip.username ? `/members/${encodeURIComponent(tip.username)}` : "#tips"} className="mt-2 inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-amber-800"><span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-[9px] font-semibold text-amber-800">{tip.avatarUrl ? <img src={tip.avatarUrl} alt="" className="h-full w-full object-cover"/> : (tip.username || "?").slice(0,1).toUpperCase()}</span>{tr("twistSharedBy")} {tip.author}</Link>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => vote.mutate({ twistId: tip.id, value: 1 }, { onError: (error) => toast({ title: tr("twistVoteError"), description: error.message, variant: "destructive" }) })} disabled={vote.isPending} aria-pressed={tip.myVote === 1} aria-label={`Upvote: ${tip.upvotes ?? 0}`} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-2 text-sm font-medium ${tip.myVote === 1 ? "bg-emerald-100 text-emerald-800" : "bg-stone-50 text-stone-500 hover:bg-emerald-50"}`}><ThumbsUp className="h-4 w-4"/><span>{tip.upvotes ?? 0}</span></button>
                <button type="button" onClick={() => vote.mutate({ twistId: tip.id, value: -1 }, { onError: (error) => toast({ title: tr("twistVoteError"), description: error.message, variant: "destructive" }) })} disabled={vote.isPending} aria-pressed={tip.myVote === -1} aria-label={`Downvote: ${tip.downvotes ?? 0}`} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-2 text-sm font-medium ${tip.myVote === -1 ? "bg-rose-100 text-rose-800" : "bg-stone-50 text-stone-500 hover:bg-rose-50"}`}><ThumbsDown className="h-4 w-4"/><span>{tip.downvotes ?? 0}</span></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
