import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Trash2 } from "lucide-react";
import { useAddComment, useComments, useDeleteComment } from "@/lib/recipes-api";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/lib/AppContext";
import { translate as t } from "@/lib/translations";
import { useAuth } from "@/lib/AuthContext";

/** @param {{ recipeId: string }} props */
export default function CommentsSection({ recipeId }) {
  const { language } = useApp();
  const tr = (key) => t(language, key);
  const [text, setText] = useState("");
  const [commentToDelete, setCommentToDelete] = useState(null);
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useComments(recipeId);
  const addComment = useAddComment(recipeId);
  const deleteComment = useDeleteComment(recipeId);
  const { toast } = useToast();

  const submit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addComment.mutate(
      { text: trimmed },
      {
        onSuccess: () => {
          setText("");
          toast({ title: tr("commentPosted") });
        },
        onError: (err) => toast({ title: tr("couldntPostComment"), description: err.message, variant: "destructive" }),
      },
    );
  };

  const remove = () => {
    if (!commentToDelete) return;
    deleteComment.mutate(commentToDelete.id, {
      onSuccess: () => setCommentToDelete(null),
      onError: (err) => {
        setCommentToDelete(null);
        toast({ title: tr("couldntDeleteComment"), description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <section id="comments" className="mt-7 scroll-mt-24 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><MessageCircle className="h-4 w-4" /></span> {tr("comments")}
        </h2>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-stone-500">{comments.length}</span>
      </div>

      <form onSubmit={submit} className="mt-3 rounded-2xl border border-stone-200 bg-white p-3 sm:p-4">
        <p className="mb-3 text-xs text-stone-500">Nagkokomento bilang <span className="font-semibold text-stone-700">{user?.displayName || user?.username}</span></p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={tr("commentPlaceholder")}
            maxLength={500}
            className="flex-1 rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          <button
            type="submit"
            disabled={!text.trim() || addComment.isPending}
            className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addComment.isPending ? tr("posting") : tr("post")}
          </button>
        </div>
      </form>

      {isLoading ? (
        <p className="mt-4 text-sm text-stone-400">{tr("loadingComments")}</p>
      ) : comments.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-5 text-center text-sm text-stone-400">
          {tr("noCommentsYet")} {tr("beFirstComment")}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="group rounded-xl border border-stone-200/80 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <Link to={c.username ? `/members/${encodeURIComponent(c.username)}` : "#comments"} className="flex min-w-0 items-center gap-2.5 rounded-full hover:text-amber-800">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-sm font-semibold text-amber-800">{c.avatarUrl ? <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" /> : (c.author || "?").replace(/^@/, "").slice(0, 1).toUpperCase()}</span>
                  <span className="truncate text-sm font-medium text-stone-700">{c.author}</span>
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">
                    {new Date(c.createdAt).toLocaleString(language, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  {c.userId === user?.id && <button
                    type="button"
                    onClick={() => setCommentToDelete(c)}
                    disabled={deleteComment.isPending}
                    aria-label={tr("deleteComment")}
                    className="text-stone-300 transition hover:text-red-500 group-hover:text-stone-400 disabled:cursor-wait disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>}
                </div>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={Boolean(commentToDelete)} onOpenChange={(open) => { if (!open && !deleteComment.isPending) setCommentToDelete(null); }}>
        <DialogContent className="max-w-sm rounded-2xl border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-stone-800">{tr("deleteCommentConfirm")}</DialogTitle>
            <DialogDescription>
              This comment will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setCommentToDelete(null)}
              disabled={deleteComment.isPending}
              className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={deleteComment.isPending}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteComment.isPending ? tr("posting") : tr("deleteComment")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
