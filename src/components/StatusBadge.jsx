import React from "react";

const STYLES = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  review: "bg-amber-50 text-amber-700 ring-amber-200",
  locked: "bg-stone-100 text-stone-600 ring-stone-300",
  removed: "bg-rose-50 text-rose-700 ring-rose-200",
};

const LABELS = {
  published: "Published",
  review: "Under Review",
  locked: "Locked",
  removed: "Removed",
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || STYLES.review;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {LABELS[status] || status}
    </span>
  );
}