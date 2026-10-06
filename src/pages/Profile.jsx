import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarDays, Camera, Check, ChefHat, Copy, LogOut, MapPin, MessageCircle, Pencil, ReceiptText, Save, Search, UserRound, Users, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useRecipes } from "@/lib/recipes-api";
import { saveAccountProfile, useAccountMealPlans, useSearchAccounts } from "@/lib/accounts-api";
import { uploadImage } from "@/lib/recipes-api";
import { accountContributions } from "@/lib/account-contributions";
import { getCountry } from "@/data/countries";
import { useApp } from "@/lib/AppContext";
import { profileText as tx } from "@/lib/profile-text";
import { translate as t } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import MealPlanner from "@/components/MealPlanner";
import FriendsPanel from "@/components/FriendsPanel";
import ProfileInterests from "@/components/ProfileInterests";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { data: recipes = [] } = useRecipes();
  const { data: plans = [], isLoading: loadingPlans, error: plansError } = useAccountMealPlans(user?.username);
  const { language } = useApp();
  const tr = (key) => t(language, key);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = ["friends", "planner", "list"].includes(searchParams.get("tab")) ? (searchParams.get("tab") === "list" ? "planner" : searchParams.get("tab")) : "profile";
  const [about, setAbout] = useState(user?.about || "");
  const [draftBio, setDraftBio] = useState(user?.about || "");
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [usernameCopied, setUsernameCopied] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const { data: people = [], isFetching: searchingPeople, error: peopleError } = useSearchAccounts(peopleSearch);

  useEffect(() => {
    setAbout(user?.about || "");
    setDraftBio(user?.about || "");
  }, [user?.id, user?.about]);

  const contributions = useMemo(() => accountContributions(recipes, user?.id), [recipes, user?.id]);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError("");
    try {
      const avatarUrl = await uploadImage(file);
      const updated = await saveAccountProfile(user.username, {
        displayName: user.displayName || user.full_name,
        role: user.role || "budget_cook",
        about: user.about || "",
        avatarUrl,
      });
      updateUser(updated);
    } catch (uploadError) {
      setAvatarError(uploadError.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveBio = async (event) => {
    event.preventDefault();
    setSavingBio(true);
    setMessage("");
    setError("");
    try {
      const updated = await saveAccountProfile(user.username, {
        displayName: user.displayName || user.full_name,
        role: user.role || "budget_cook",
        about: draftBio.trim(),
        avatarUrl: user.avatarUrl || "",
      });
      updateUser(updated);
      setAbout(updated.about || "");
      setEditingBio(false);
      setMessage(tx(language, "profileSaved"));
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingBio(false);
    }
  };

  const switchTab = (tab) => setSearchParams(tab === "profile" ? {} : { tab });
  const initials = (user?.displayName || user?.full_name || "C").trim().slice(0, 1).toUpperCase();

  const copyUsername = async () => {
    try {
      await navigator.clipboard.writeText(user.username);
      setUsernameCopied(true);
      window.setTimeout(() => setUsernameCopied(false), 1800);
    } catch {
      setError(tx(language, "copyError"));
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <section className="mb-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div><h2 className="font-semibold text-stone-800">Find your community</h2><p className="mt-1 text-sm text-stone-500">Search for students, recipe contributors, and budget meal explorers.</p></div>
        <label className="mt-4 flex h-11 items-center gap-2 rounded-xl border border-stone-200 px-3 text-stone-400 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
          <Search className="h-4 w-4 shrink-0" />
          <input value={peopleSearch} onChange={(event) => setPeopleSearch(event.target.value)} maxLength={60} placeholder="Search by name or username" className="min-w-0 flex-1 bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400" />
        </label>
        {peopleSearch.trim().length === 1 && <p className="mt-3 text-sm text-stone-500">Type at least 2 characters to search.</p>}
        {searchingPeople && <p className="mt-3 text-sm text-stone-500">Searching…</p>}
        {peopleError && <p role="alert" className="mt-3 text-sm text-red-700">{peopleError.message}</p>}
        {peopleSearch.trim().length >= 2 && !searchingPeople && !peopleError && (people.length ? <ul className="mt-3 divide-y divide-stone-100">{people.map((person) => <li key={person.id}><Link to={`/members/${encodeURIComponent(person.username)}`} className="flex items-center gap-3 py-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 font-semibold text-amber-800">{person.avatarUrl ? <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" /> : (person.displayName || "?").trim().slice(0, 1).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-stone-800">{person.displayName}</span><span className="block truncate text-xs text-stone-500">@{person.username}{person.about ? ` · ${person.about}` : ""}</span></span></Link></li>)}</ul> : <p className="mt-3 text-sm text-stone-500">No community members found.</p>)}
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-white/60 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
            <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={`${user.displayName}'s profile`} className="h-full w-full rounded-[1.35rem] object-cover shadow-sm ring-1 ring-amber-200" /> : <span className="flex h-full w-full items-center justify-center rounded-[1.35rem] bg-white text-2xl font-semibold text-amber-800 shadow-sm ring-1 ring-amber-200">{initials}</span>}
              <label title="Change profile picture" className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-amber-700 text-white shadow transition hover:bg-amber-800">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleAvatarChange} disabled={avatarUploading} className="sr-only" />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-amber-800"><UserRound className="h-3.5 w-3.5" /> {tx(language, "profileTab")}</div>
              <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight text-stone-800 sm:text-3xl">{user?.displayName || user?.full_name || tx(language, "yourProfile")}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-stone-600">@{user?.username}</span><button type="button" onClick={copyUsername} className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-white">{usernameCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{usernameCopied ? tx(language, "copied") : tx(language, "copy")}</button></div>
              <ProfileInterests interests={user?.interests} />
              <div className="mt-4 max-w-2xl">
                {editingBio ? <form onSubmit={handleSaveBio} className="space-y-2"><textarea autoFocus value={draftBio} onChange={(event) => setDraftBio(event.target.value)} rows={3} maxLength={240} placeholder={tx(language, "aboutPlaceholder")} className="w-full resize-y rounded-xl border border-amber-200 bg-white/90 px-3.5 py-3 text-sm outline-none placeholder:text-stone-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /><div className="flex items-center justify-between gap-3"><span className="text-xs text-stone-500">{draftBio.length}/240</span><div className="flex gap-2"><button type="button" onClick={() => { setEditingBio(false); setDraftBio(about); setError(""); }} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-600"><X className="h-3.5 w-3.5" />{tx(language, "cancel")}</button><button type="submit" disabled={savingBio} className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"><Save className="h-3.5 w-3.5" />{savingBio ? tx(language, "saving") : tx(language, "saveChanges")}</button></div></div></form> : <div className="flex flex-wrap items-start gap-2"><p className="min-w-0 flex-1 text-sm leading-relaxed text-stone-700">{about || tx(language, "bioEmpty")}</p><button type="button" onClick={() => { setDraftBio(about); setEditingBio(true); setMessage(""); setError(""); }} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-white"><Pencil className="h-3 w-3" />{tx(language, "editBio")}</button></div>}
                {message && <p role="status" className="mt-2 text-xs font-medium text-emerald-800">{message}</p>}
                {error && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{error}</p>}
                {avatarError && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{avatarError}</p>}
                {avatarUploading && <p role="status" className="mt-2 text-xs text-stone-500">Uploading profile picture…</p>}
              </div>
            </div>
          </div>
          <div className="relative flex flex-wrap gap-2">
            <Link to="/messages" className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-white">
              <MessageCircle className="h-4 w-4" /> {tr("messages")}
            </Link>
            <Button variant="outline" onClick={() => logout()} className="relative border-white/80 bg-white/80"><LogOut /> {tx(language, "signOut")}</Button>
          </div>
        </div>
      </section>

      <div className="mt-6 flex gap-2 border-b border-stone-200 pb-2">
        <Tab active={activeTab === "profile"} onClick={() => switchTab("profile")} icon={UserRound}>{tx(language, "profileTab")}</Tab>
        <Tab active={activeTab === "friends"} onClick={() => switchTab("friends")} icon={Users}>Friends</Tab>
        <Tab active={activeTab === "planner"} onClick={() => switchTab("planner")} icon={CalendarDays}>{tx(language, "plannerTab")} <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs">{plans.length}</span></Tab>
      </div>

      {activeTab === "profile" ? <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-stone-800">{tx(language, "contributions")}</h2><p className="mt-1 text-sm text-stone-500">{tx(language, "contributionsDesc")}</p></div><BookOpen className="h-5 w-5 text-amber-600" /></div>
        <div className="mt-5 grid max-w-lg grid-cols-2 gap-3"><Stat icon={ChefHat} value={contributions.filter((item) => item.kind === "recipe").length} label={tx(language, "recipe")} /><Stat icon={ReceiptText} value={contributions.filter((item) => item.kind === "adaptation").length} label={tx(language, "adaptation")} /></div>
        {contributions.length ? <ul className="mt-4 divide-y divide-stone-100">{contributions.map((item, index) => {
          const country = getCountry(item.country);
          const itemLabel = item.kind === "recipe" ? tx(language, "recipe") : `${tx(language, "adaptation")} · ${item.parent}`;
          return <li key={`${item.kind}-${item.href}-${index}`}><Link to={item.href} className="group flex items-center gap-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">{item.kind === "recipe" ? <ChefHat className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-stone-800 group-hover:text-amber-800">{item.title}</span><span className="mt-0.5 block truncate text-xs text-stone-500">{itemLabel} {country ? `· ${country.flag} ${country.name}` : ""}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-stone-300 group-hover:text-amber-600" /></Link></li>;
        })}</ul> : <div className="mt-4 rounded-2xl border border-dashed border-stone-200 px-4 py-7 text-center"><p className="text-sm font-medium text-stone-700">{tx(language, "noContributions")}</p><p className="mt-1 text-xs leading-relaxed text-stone-500">{tx(language, "contributionsEmpty")}</p></div>}
      </section> : activeTab === "friends" ? <FriendsPanel /> : <MealPlanner username={user.username} recipes={recipes} plans={plans} isLoading={loadingPlans} error={plansError} />}
    </main>
  );
}

function Tab({ active, onClick, icon: Icon, children }) {
  return <button type="button" onClick={onClick} aria-current={active ? "page" : undefined} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${active ? "bg-amber-100 text-amber-900" : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"}`}><Icon className="h-4 w-4" />{children}</button>;
}

function Stat({ icon: Icon, value, label }) {
  return <div className="rounded-2xl bg-stone-50 p-4"><Icon className="h-4 w-4 text-amber-700" /><p className="mt-2 text-2xl font-semibold text-stone-800">{value}</p><p className="text-xs text-stone-500">{label}</p></div>;
}
