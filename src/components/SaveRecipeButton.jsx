import { useState } from "react";
import { CalendarPlus, CalendarDays, NotebookPen } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useApp } from "@/lib/AppContext";
import { profileText as tx } from "@/lib/profile-text";
import { useCreateMealPlan } from "@/lib/accounts-api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function localToday() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export default function SaveRecipeButton({ recipeId, adaptationCountry, title }) {
  const { user } = useAuth();
  const { language } = useApp();
  const addPlan = useCreateMealPlan(user?.username);
  const [open, setOpen] = useState(false);
  const [plannedFor, setPlannedFor] = useState(localToday);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const saveToList = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await addPlan.mutateAsync({ recipeId, adaptationCountry: adaptationCountry || null, plannedFor, note: note.trim() });
      setSaved(true);
      window.setTimeout(() => {
        setOpen(false);
        setSaved(false);
        setNote("");
      }, 900);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setError(""); }} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100">
        <CalendarPlus className="h-4 w-4" />
        <span>{tx(language, "addToMyList")}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl border-stone-200 p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-800"><CalendarDays className="h-5 w-5 text-amber-700" />{tx(language, "addToPlan")}</DialogTitle>
            <DialogDescription>{title}</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveToList} className="space-y-4">
            <div className="space-y-1.5"><label htmlFor="my-list-date" className="text-sm font-medium text-stone-700">{tx(language, "plannedDate")}</label><input id="my-list-date" type="date" required value={plannedFor} onChange={(event) => setPlannedFor(event.target.value)} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></div>
            <div className="space-y-1.5"><label htmlFor="my-list-note" className="flex items-center gap-1.5 text-sm font-medium text-stone-700"><NotebookPen className="h-4 w-4 text-stone-400" />{tx(language, "note")}</label><textarea id="my-list-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} placeholder={tx(language, "notePlaceholder")} className="w-full resize-y rounded-xl border border-stone-200 px-3.5 py-3 text-sm outline-none placeholder:text-stone-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></div>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {saved && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{tx(language, "profileSaved")}</p>}
            <button type="submit" disabled={addPlan.isPending || saved} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"><CalendarPlus className="h-4 w-4" />{addPlan.isPending ? tx(language, "adding") : tx(language, "addToPlan")}</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
