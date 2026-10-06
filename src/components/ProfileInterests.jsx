const LABELS = {
  student: "Student",
  he_student: "Home Economics student",
  share_recipes: "Shares recipes",
  adapt_recipes: "Adapts recipes",
  nearby_restaurants: "Finds local restaurants",
  budget_meals: "Looks for budget meals",
};

export default function ProfileInterests({ interests }) {
  const selected = Array.isArray(interests) ? interests.filter((interest) => LABELS[interest]) : [];
  if (!selected.length) return null;

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Interested in</p>
      <div className="flex flex-wrap gap-1.5">
        {selected.map((interest) => <span key={interest} className="rounded-full border border-amber-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-amber-900">{LABELS[interest]}</span>)}
      </div>
    </div>
  );
}
