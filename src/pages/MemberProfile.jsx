import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, ChefHat, MapPin } from "lucide-react";
import { useRecipes } from "@/lib/recipes-api";
import { useAccountTips, usePublicAccount } from "@/lib/accounts-api";
import { accountContributions } from "@/lib/account-contributions";
import { getCountry } from "@/data/countries";
import { useApp } from "@/lib/AppContext";
import { profileText as tx } from "@/lib/profile-text";
import MemberSocialActions from "@/components/MemberSocialActions";
import ProfileInterests from "@/components/ProfileInterests";

export default function MemberProfile() {
  const { username } = useParams();
  const { data: profile, isLoading, error } = usePublicAccount(username);
  const { data: recipes = [] } = useRecipes();
  const { data: tips = [] } = useAccountTips(username);
  const { language } = useApp();
  const contributions = useMemo(() => accountContributions(recipes, profile?.id), [recipes, profile?.id]);

  if (isLoading) return <main className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-stone-500">Loading profile…</main>;
  if (error || !profile) return <main className="mx-auto max-w-4xl px-4 py-20 text-center"><p className="text-stone-600">{error?.message || "Profile not found."}</p><Link to="/profile" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700"><ArrowLeft className="h-4 w-4" />Back to profile</Link></main>;

  const initials = (profile.displayName || "?").trim().slice(0, 1).toUpperCase();
  return (
    <main className="mx-auto max-w-4xl px-4 py-7 sm:px-6 sm:py-10">
      <Link to="/profile" className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-800"><ArrowLeft className="h-4 w-4" />Back to profile</Link>
      <section className="mt-4 flex flex-wrap items-center gap-5 rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50 p-6 sm:p-8">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] bg-white text-2xl font-semibold text-amber-800 shadow-sm ring-1 ring-amber-200">{profile.avatarUrl ? <img src={profile.avatarUrl} alt={`${profile.displayName}'s profile`} className="h-full w-full object-cover" /> : initials}</span>
        <div className="min-w-0 flex-1"><h1 className="truncate text-2xl font-semibold tracking-tight text-stone-800">{profile.displayName}</h1><p className="mt-1 text-sm text-stone-600">@{profile.username}</p><ProfileInterests interests={profile.interests} /><p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{profile.about || tx(language, "bioEmpty")}</p><div className="mt-4"><MemberSocialActions username={profile.username}/></div></div>
      </section>
      <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-amber-600" /><div><h2 className="font-semibold text-stone-800">{tx(language, "contributions")}</h2><p className="mt-1 text-sm text-stone-500">{tx(language, "contributionsDesc")}</p></div></div>
        <div className="mt-4 grid max-w-lg grid-cols-2 gap-3"><Stat icon={ChefHat} value={contributions.filter((item) => item.kind === "recipe").length} label={tx(language, "recipe")} /><Stat icon={MapPin} value={contributions.filter((item) => item.kind === "adaptation").length} label={tx(language, "adaptation")} /></div>
        {contributions.length ? <ul className="mt-4 divide-y divide-stone-100">{contributions.map((item, index) => { const country = getCountry(item.country); const itemLabel = item.kind === "recipe" ? tx(language, "recipe") : `${tx(language, "adaptation")} · ${item.parent}`; return <li key={`${item.kind}-${item.href}-${index}`}><Link to={item.href} className="group flex items-center gap-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">{item.kind === "recipe" ? <ChefHat className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-stone-800 group-hover:text-amber-800">{item.title}</span><span className="mt-0.5 block truncate text-xs text-stone-500">{itemLabel} {country ? `· ${country.flag} ${country.name}` : ""}</span></span></Link></li>; })}</ul> : <div className="mt-4 rounded-2xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500">{tx(language, "contributionsEmpty")}</div>}
      </section>
      {tips.length > 0 && (
        <section className="mt-6 rounded-3xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">💡</span>
            <div>
              <h2 className="font-semibold text-stone-800">Published community tips</h2>
              <p className="mt-1 text-sm text-stone-500">Practical notes this member has shared with the community.</p>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-stone-100">
            {tips.map((tip) => {
              const recipe = recipes.find((item) => item.id === tip.recipeId);
              const isAdaptation = Boolean(tip.destinationCountry);
              const href = isAdaptation
                ? `/recipes/${tip.recipeId}/adapt/${tip.destinationCountry}`
                : `/recipes/${tip.recipeId}`;
              const label = isAdaptation
                ? recipe?.adaptations?.find((item) => item.destinationCountry === tip.destinationCountry)?.title
                : recipe?.name;
              return (
                <li key={tip.id} className="py-4">
                  <p className="text-sm leading-relaxed text-stone-700">{tip.text}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    {recipe ? (
                      <Link to={href} className="text-xs font-medium text-amber-800 hover:underline">
                        {label || recipe.name}
                      </Link>
                    ) : <span />}
                    <span className="text-xs text-stone-500">Helpful · {tip.helpfulVotes || 0}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-stone-400">Helpful votes show reader feedback, not factual verification.</p>
        </section>
      )}
    </main>
  );
}

function Stat({ icon: Icon, value, label }) {
  return <div className="rounded-2xl bg-stone-50 p-4"><Icon className="h-4 w-4 text-amber-700" /><p className="mt-2 text-2xl font-semibold text-stone-800">{value}</p><p className="text-xs text-stone-500">{label}</p></div>;
}
