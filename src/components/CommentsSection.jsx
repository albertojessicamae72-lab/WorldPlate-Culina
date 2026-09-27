import { useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { useAddComment, useComments, useDeleteComment } from "@/lib/recipes-api";
import { useToast } from "@/components/ui/use-toast";

/** @param {{ recipeId: string }} props */
export default function CommentsSection({ recipeId }) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const { data: comments = [], isLoading } = useComments(recipeId);
  const addComment = useAddComment(recipeId);
  const deleteComment = useDeleteComment(recipeId);
  const { toast } = useToast();

  const submit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addComment.mutate(
      { text: trimmed, author: author.trim() || null },
      {
        onSuccess: () => {
          setText("");
          toast({ title: "Comment posted" });
        },
        onError: (err) => toast({ title: "Couldn't post comment", description: err.message, variant: "destructive" }),
      },
    );
  };

  const remove = (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    deleteComment.mutate(commentId, {
      onError: (err) => toast({ title: "Couldn't delete comment", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-800">
        <MessageCircle className="h-5 w-5 text-amber-500" /> Comments
        <span className="text-sm font-normal text-stone-400">({comments.length})</span>
      </h2>

      <form onSubmit={submit} className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={40}
            className="rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 sm:w-56"
          />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts about this recipe..."
            maxLength={500}
            className="flex-1 rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          <button
            type="submit"
            disabled={!text.trim() || addComment.isPending}
            className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addComment.isPending ? "Posting..." : "Post"}
          </button>
        </div>
      </form>

      {isLoading ? (
        <p className="mt-6 text-sm text-stone-400">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-8 text-center text-sm text-stone-400">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="group rounded-2xl border border-stone-100 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-stone-700">{c.author}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">
                    {new Date(c.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  <button
                    onClick={() => remove(c.id)}
                    aria-label="Delete comment"
                    className="text-stone-300 transition hover:text-red-500 group-hover:text-stone-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
