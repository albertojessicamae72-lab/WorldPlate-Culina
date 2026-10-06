import { ArrowRightLeft, BookOpen, Globe2, GraduationCap, WalletCards } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { profileText as tx } from "@/lib/profile-text";
import { translate as t } from "@/lib/translations";

const IDEAS = [
  { icon: BookOpen, title: "aboutRecipesTitle", text: "aboutRecipes" },
  { icon: Globe2, title: "aboutAdaptTitle", text: "aboutAdapt" },
  { icon: GraduationCap, title: "aboutStudentsTitle", text: "aboutStudents" },
  { icon: WalletCards, title: "aboutBudgetTitle", text: "aboutBudget" },
];

export default function About() {
  const { language } = useApp();
  const tr = (key) => t(language, key);
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50 p-7 sm:p-12">
        <div className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full bg-white/70 blur-3xl" />
        <div className="relative min-w-0 max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">{tx(language, "aboutUs")}</p><h1 className="mt-3 break-words text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">{tx(language, "aboutTitle")}</h1><p className="mt-5 text-base leading-relaxed text-stone-700 sm:text-lg">{tx(language, "aboutIntro")}</p></div>
      </section>
      <section className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-stone-900 px-6 py-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-9 sm:py-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
            <Globe2 className="h-3.5 w-3.5" /> WorldPlate Culina
          </span>
          <h2 className="mt-4 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">{tr("mission")}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-300 sm:text-base">{tr("missionDescription")}</p>
        </div>
        <div aria-hidden="true" className="relative mt-6 flex shrink-0 items-center gap-3 sm:mt-0 sm:flex-col sm:gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-stone-900"><ArrowRightLeft className="h-6 w-6" /></span>
        </div>
      </section>
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {IDEAS.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><Icon className="h-5 w-5" /></span><h2 className="mt-4 text-lg font-semibold text-stone-800">{tx(language, title)}</h2><p className="mt-2 text-sm leading-relaxed text-stone-600">{tx(language, text)}</p></article>)}
      </section>
      <p className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-sm leading-relaxed text-emerald-900">{tx(language, "aboutEveryone")}</p>
    </main>
  );
}
