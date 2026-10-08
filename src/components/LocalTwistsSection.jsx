import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Lightbulb, Pencil, ThumbsUp, Trash2, X } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import {
  useCreateLocalTwist,
  useDeleteLocalTwist,
  useLocalTwists,
  useUpdateLocalTwist,
  useVoteLocalTwist,
} from "@/lib/recipes-api";
import { translate as t } from "@/lib/translations";

export default function LocalTwistsSection({
  recipeId,
  countryCode = "",
  allowCommunityTips = false,
  scopeLabel = "",
}) {
  const { language } = useApp();
  const tr = (key) => t(language, key);
  const [text, setText] = useState("");
  const [editingTip, setEditingTip] = useState(null);
  const [editText, setEditText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const { user } = useAuth();
  const viewer = user?.id || "";
  const { toast } = useToast();
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useLocalTwists(recipeId, countryCode, viewer);
  const scrollArea = useRef(null);
  const loadMoreMarker = useRef(null);
  const twists = data?.pages.flatMap((page) => page.items) ?? [];
  const addTwist = useCreateLocalTwist(recipeId, countryCode, viewer);
  const updateTwist = useUpdateLocalTwist(recipeId, countryCode, viewer);
  const deleteTwist = useDeleteLocalTwist(recipeId, countryCode, viewer);
  const vote = useVoteLocalTwist(recipeId, countryCode, viewer);
  const isAdaptation = Boolean(countryCode);
  const sortedTwists = [...twists].sort(
    (a, b) =>
      (b.helpfulVotes ?? b.upvotes ?? 0) - (a.helpfulVotes ?? a.upvotes ?? 0) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  useEffect(() => {
    const root = scrollArea.current;
    const marker = loadMoreMarker.current;
    if (!root || !marker || !hasNextPage || isFetchingNextPage) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { root, rootMargin: "0px 0px 100px 0px" },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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

  const saveEdit = (event) => {
    event.preventDefault();
    const updatedText = editText.trim();
    if (!editingTip || updatedText.length < 3) return;
    updateTwist.mutate(
      { twistId: editingTip.id, text: updatedText },
      {
        onSuccess: () => {
          setEditingTip(null);
          setEditText("");
          toast({ title: "Tip updated" });
        },
        onError: (error) => toast({ title: "Couldn't update tip", description: error.message, variant: "destructive" }),
      },
    );
  };

  const removeTip = (tipId) => {
    deleteTwist.mutate(tipId, {
      onSuccess: () => {
        setConfirmDeleteId(null);
        toast({ title: "Tip deleted" });
      },
      onError: (error) => toast({ title: "Couldn't delete tip", description: error.message, variant: "destructive" }),
    });
  };

  return (
    <section
      id={`tips-${recipeId}-${countryCode || "recipe"}`}
      className="scroll-mt-36 rounded-2xl border border-amber-200 bg-amber-50/50 p-3 shadow-sm sm:p-4"
    >
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
          <Lightbulb className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-stone-800">
            {isAdaptation ? "Adaptation Tips" : "Recipe Tips"}
          </h2>
          {scopeLabel && <p className="mt-0.5 text-[11px] font-medium text-amber-800">{scopeLabel}</p>}
        </div>
      </div>

      {allowCommunityTips ? (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
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
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded-xl bg-white/70 px-3 py-2.5 text-xs leading-relaxed text-stone-500">
          New community tips are turned off by the creator. Published tips remain available below.
        </p>
      )}

      {isLoading ? (
        <p className="mt-3 text-xs text-stone-500">{tr("twistLoading")}</p>
      ) : twists.length > 0 ? (
        <div ref={scrollArea} className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto overscroll-contain pr-1">
        <ul className="space-y-2">
          {sortedTwists.map((tip, index) => (
            <li key={tip.id} className="rounded-xl border border-amber-100 bg-white p-3 shadow-sm">
              {index === 0 && (tip.helpfulVotes ?? tip.upvotes ?? 0) > 0 && (
                <span className="mb-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  Most helpful
                </span>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {editingTip?.id === tip.id ? (
                    <form onSubmit={saveEdit} className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(event) => setEditText(event.target.value)}
                        maxLength={180}
                        minLength={3}
                        rows={3}
                        aria-label="Edit your community tip"
                        className="w-full resize-y rounded-xl border border-stone-200 px-3 py-2.5 text-sm leading-relaxed text-stone-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                      <div className="flex gap-2">
                        <button type="submit" disabled={editText.trim().length < 3 || updateTwist.isPending} className="inline-flex items-center gap-1 rounded-full bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"><Check className="h-3.5 w-3.5" />Save</button>
                        <button type="button" onClick={() => { setEditingTip(null); setEditText(""); }} disabled={updateTwist.isPending} className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600"><X className="h-3.5 w-3.5" />Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="break-words text-sm leading-relaxed text-stone-700">{tip.text}</p>
                      <Link to={tip.username ? `/members/${encodeURIComponent(tip.username)}` : `#tips-${recipeId}-${countryCode || "recipe"}`} className="mt-3 inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-amber-800"><span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-[9px] font-semibold text-amber-800">{tip.avatarUrl ? <img src={tip.avatarUrl} alt="" className="h-full w-full object-cover"/> : (tip.username || "?").slice(0,1).toUpperCase()}</span>{tr("twistSharedBy")} {tip.author}</Link>
                    </>
                  )}
                </div>
                {tip.userId === viewer && editingTip?.id !== tip.id && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => { setEditingTip(tip); setEditText(tip.text); setConfirmDeleteId(null); }} aria-label="Edit your tip" className="rounded-full p-2 text-stone-400 hover:bg-amber-50 hover:text-amber-800"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setConfirmDeleteId(tip.id)} aria-label="Delete your tip" className="rounded-full p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => vote.mutate({ twistId: tip.id, value: 1 }, { onError: (error) => toast({ title: tr("twistVoteError"), description: error.message, variant: "destructive" }) })}
                  disabled={vote.isPending || tip.userId === viewer}
                  aria-pressed={tip.myVote === 1}
                  aria-label={`Helpful, ${tip.helpfulVotes ?? tip.upvotes ?? 0} votes`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium ${tip.myVote === 1 ? "bg-emerald-100 text-emerald-800" : "bg-stone-50 text-stone-600 hover:bg-emerald-50"} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Helpful · {tip.helpfulVotes ?? tip.upvotes ?? 0}</span>
                </button>
                {confirmDeleteId === tip.id && (
                  <span className="flex items-center gap-2 text-xs text-stone-600">
                    Delete this tip?
                    <button type="button" onClick={() => removeTip(tip.id)} disabled={deleteTwist.isPending} className="rounded-full bg-rose-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">{deleteTwist.isPending ? "Deleting…" : "Delete"}</button>
                    <button type="button" onClick={() => setConfirmDeleteId(null)} disabled={deleteTwist.isPending} className="rounded-full border border-stone-200 px-3 py-1.5 font-medium">Cancel</button>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div ref={loadMoreMarker} className="py-1 text-center text-xs text-stone-500" aria-live="polite">
          {isFetchingNextPage && "Loading more tips…"}
        </div>
        </div>
      ) : null}
    </section>
  );
}
