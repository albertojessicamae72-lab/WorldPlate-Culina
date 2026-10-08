import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, GraduationCap, MapPin, Utensils, WalletCards } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { useAuth } from "@/lib/AuthContext";
import { safeReturnTo } from "@/lib/authReturnTo";

const INTERESTS = [
  { id: "he_student", label: "I'm a Home Economics student", detail: "Share school projects and explore food and nutrition", icon: GraduationCap },
  { id: "share_recipes", label: "Share recipes", detail: "Contribute family or traditional recipes", icon: BookOpen },
  { id: "adapt_recipes", label: "Adapt recipes", detail: "Find local ingredients and substitutions", icon: Utensils },
  { id: "nearby_restaurants", label: "Find nearby restaurants", detail: "Discover places to eat around you", icon: MapPin },
  { id: "budget_meals", label: "Find budget meals", detail: "Explore affordable local meal ideas", icon: WalletCards },
];

export default function Login() {
  const [mode, setMode] = useState(() => {
    const initialMode = new URLSearchParams(window.location.search).get("mode");
    return initialMode === "register" || initialMode === "forgot" ? initialMode : "continue";
  });
  const [value, setValue] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [interests, setInterests] = useState([]);
  const [recoveryQuestion, setRecoveryQuestion] = useState("favorite_color");
  const [recoveryAnswer, setRecoveryAnswer] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const { enter, register, recoverPassword, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const returnTo = safeReturnTo();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
      if ((mode === "register" || mode === "forgot") && password !== confirmPassword) throw new Error("The passwords do not match.");
      if (mode === "register") {
        if (!recoveryAnswer.trim()) throw new Error("Enter your recovery answer.");
        await register(value.trim(), password, interests, recoveryQuestion, recoveryAnswer);
        navigate("/profile?welcome=1", { replace: true });
      } else if (mode === "forgot") {
        if (!recoveryAnswer.trim()) throw new Error("Enter your recovery answer.");
        await recoverPassword(value.trim().replace(/^@/, ""), recoveryQuestion, recoveryAnswer, password);
        setMode("continue");
        setPassword("");
        setConfirmPassword("");
        setRecoveryAnswer("");
        setError("");
        setNotice("If the recovery details match, the password has been reset. Try signing in with the new password.");
      } else {
        await enter(value.trim().replace(/^@/, ""), password);
        navigate(returnTo || "/", { replace: true });
      }
    } catch (requestError) {
      setError(requestError.message || "We couldn't complete your sign-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "register" ? "continue" : "register");
    setValue("");
    setPassword("");
    setConfirmPassword("");
    setInterests([]);
    setRecoveryAnswer("");
    setError("");
    setNotice("");
  };

  const toggleInterest = (id) => setInterests((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const changeMode = (nextMode) => {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setRecoveryAnswer("");
    setError("");
    setNotice("");
  };

  const recoveryPrompt = recoveryQuestion === "favorite_color"
    ? "What is your favorite color?"
    : "What is your favorite animal?";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6 sm:py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white shadow-2xl shadow-brand-orange/10 md:grid-cols-[0.85fr_1.15fr]">
        <aside className="relative hidden min-h-full flex-col justify-between overflow-hidden bg-brand-orange p-9 text-white md:flex lg:p-11">
          <div className="pointer-events-none absolute -right-24 -top-16 h-72 w-72 rounded-full border border-white/10" /><div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-white/10" />
          <div className="relative"><div className="flex items-center gap-3"><BrandMark className="h-12 w-12" /><span className="leading-tight"><span className="block text-lg font-bold tracking-tight">WorldPlate</span><span className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-peach">Culina</span></span></div>
            <p className="mt-16 text-xs font-semibold uppercase tracking-[0.2em] text-brand-peach">Recipes · Local food · Meal planning</p>
            <h1 className="mt-4 max-w-full break-words text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">Make the world’s recipes feel like home.</h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-stone-300">Share what you cook, adapt dishes with ingredients nearby, and plan meals that work for your household.</p>
          </div>
          <div className="relative mt-12 space-y-3">{["Discover recipes from different cultures", "Make local ingredient adaptations", "Plan meals with your own notes"].map((item) => <p key={item} className="flex items-center gap-2.5 text-sm text-stone-200"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-brand-peach"><Check className="h-3 w-3" /></span>{item}</p>)}</div>
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-brand-light-orange/25 blur-3xl" />
        </aside>

        <div className="max-h-[94vh] overflow-y-auto p-6 sm:p-9 lg:p-11">
          <div className="mb-7 flex items-center gap-3 md:hidden"><BrandMark className="h-11 w-11" /><span className="leading-tight"><span className="block text-base font-bold text-stone-800">WorldPlate</span><span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-orange">Culina</span></span></div>
          <div className="min-w-0 max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">{mode === "register" ? "Join the community" : mode === "forgot" ? "Account recovery" : "Welcome back"}</p>
            <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-stone-800 sm:text-3xl">{mode === "register" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Sign in to WorldPlate Culina"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">{mode === "register" ? "Save your profile, recipes, and meal plans in one place." : mode === "forgot" ? "Answer your recovery question and choose a new password." : "Use your username and password to continue."}</p>
          </div>

          {isAuthenticated ? <button type="button" onClick={() => navigate(returnTo || "/", { replace: true })} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 py-3 font-semibold text-white transition hover:bg-brand-deep-orange">Continue as @{user?.username}<ArrowRight className="h-4 w-4" /></button> : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div className="space-y-1.5"><label htmlFor="account-entry" className="block text-sm font-medium text-stone-700">{mode === "register" ? "Display name" : "Username"}</label><input id="account-entry" autoFocus autoComplete="username" maxLength={60} value={value} onChange={(event) => { setValue(event.target.value); setError(""); setNotice(""); }} placeholder={mode === "register" ? "e.g. Ysa" : "e.g. ysa123"} className="h-12 w-full rounded-xl border border-stone-200 px-4 text-sm outline-none transition focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10" required /></div>
              <div className="space-y-1.5"><label htmlFor="account-password" className="block text-sm font-medium text-stone-700">{mode === "forgot" ? "New password" : "Password"}</label><input id="account-password" type="password" autoComplete={mode === "continue" ? "current-password" : "new-password"} minLength={8} maxLength={128} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="At least 8 characters" className="h-12 w-full rounded-xl border border-stone-200 px-4 text-sm outline-none transition focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10" required /></div>
              {(mode === "register" || mode === "forgot") && <div className="space-y-1.5"><label htmlFor="account-confirm-password" className="block text-sm font-medium text-stone-700">Confirm password</label><input id="account-confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(""); }} placeholder="Enter your password again" className="h-12 w-full rounded-xl border border-stone-200 px-4 text-sm outline-none transition focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10" required /></div>}
              {(mode === "register" || mode === "forgot") && <fieldset aria-labelledby="recovery-heading" className="block min-w-0 w-full space-y-2 rounded-2xl border border-brand-orange/15 bg-brand-orange/[0.035] p-4">
                <p id="recovery-heading" className="mb-2 block w-full whitespace-normal break-words text-sm font-semibold leading-snug text-stone-800">{mode === "register" ? "Set up password recovery" : "Verify it’s you"}</p>
                {mode === "register" && <p className="text-xs leading-relaxed text-brand-deep-orange">Security questions are easier to guess than email recovery. Use an answer only you know, and don’t use your real favorite if it’s public.</p>}
                <label htmlFor="recovery-question" className="block text-xs font-medium text-stone-600">Recovery question</label>
                <select id="recovery-question" value={recoveryQuestion} onChange={(event) => setRecoveryQuestion(event.target.value)} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-brand-orange/50">
                  <option value="favorite_color">What is your favorite color?</option>
                  <option value="favorite_animal">What is your favorite animal?</option>
                </select>
                <label htmlFor="recovery-answer" className="block pt-1 text-xs font-medium text-stone-600">{recoveryPrompt}</label>
                <input id="recovery-answer" type="password" autoComplete="off" maxLength={80} value={recoveryAnswer} onChange={(event) => { setRecoveryAnswer(event.target.value); setError(""); }} placeholder="Your private answer" className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10" required />
              </fieldset>}
              {mode === "register" && <fieldset className="space-y-2 pt-2"><legend className="text-sm font-semibold text-stone-800">What would you like to explore?</legend>{INTERESTS.map(({ id, label, detail, icon: Icon }) => {
                const checked = interests.includes(id);
                return <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked ? "border-brand-orange/40 bg-brand-orange/[0.04]" : "border-stone-200 hover:border-stone-300"}`}><input type="checkbox" checked={checked} onChange={() => toggleInterest(id)} className="h-4 w-4 accent-brand-orange" /><Icon className="h-4 w-4 shrink-0 text-brand-orange" /><span className="min-w-0"><span className="block text-sm font-medium text-stone-800">{label}</span><span className="block text-xs text-stone-500">{detail}</span></span></label>;
              })}</fieldset>}
              {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}
              {notice && <p role="status" className="rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">{notice}</p>}
              <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 font-semibold text-white transition hover:bg-brand-deep-orange disabled:cursor-wait disabled:opacity-70">{loading ? "Please wait…" : mode === "register" ? "Create account" : mode === "forgot" ? "Reset password" : "Sign in"}<ArrowRight className="h-4 w-4" /></button>
            </form>
          )}

          {!isAuthenticated && mode === "continue" && <button type="button" onClick={() => changeMode("forgot")} className="mt-4 w-full text-center text-sm font-semibold text-brand-orange hover:text-brand-deep-orange">Forgot password?</button>}
          {!isAuthenticated && mode === "forgot" && <button type="button" onClick={() => changeMode("continue")} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-brand-orange hover:text-brand-deep-orange"><ArrowLeft className="h-4 w-4" /> Back to sign in</button>}
          {!isAuthenticated && mode !== "forgot" && <p className="mt-6 text-center text-sm text-stone-500">{mode === "register" ? "Already have an account?" : "New to WorldPlate Culina?"}{" "}<button type="button" onClick={switchMode} className="font-semibold text-brand-orange hover:text-brand-deep-orange">{mode === "register" ? "Sign in" : "Create an account"}</button></p>}
          <p className="mt-5 text-center text-xs leading-relaxed text-stone-400">Your profile, saved recipes, and meal plans stay with your account.</p>
        </div>
      </section>
    </main>
  );
}
