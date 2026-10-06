import { Link } from "react-router-dom";
import { ArrowLeft, LockKeyhole, MapPin } from "lucide-react";
import { getCountry } from "@/data/countries";
import { useApp } from "@/lib/AppContext";
import { translate as t } from "@/lib/translations";

export default function Restaurants() {
  const { cookingCountry, language } = useApp();
  const country = getCountry(cookingCountry);
  const tr = (key) => t(language, key);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-12 sm:px-6">
      <section className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white px-6 py-10 text-center shadow-sm sm:px-12 sm:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-amber-100/70 blur-3xl" />
        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <LockKeyhole className="h-7 w-7" />
          </span>
          <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            <MapPin className="h-3.5 w-3.5" /> {tr("restaurantMap")}
          </p>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600">{country?.flag} {country?.name}</p>
          <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">{tr("restaurantLockedTitle")}</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-stone-600 sm:text-base">
            {tr("restaurantLockedDescription")}
          </p>
          <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700">
            <ArrowLeft className="h-4 w-4" /> {tr("backHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
