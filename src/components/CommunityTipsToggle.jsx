export default function CommunityTipsToggle({
  checked,
  onChange,
  disabled = false,
  compact = false,
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3 ${disabled ? "cursor-wait opacity-60" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 accent-amber-700"
      />
      <span>
        <span className="block text-sm font-medium text-stone-800">Allow Community Tips</span>
        {!compact && (
          <span className="mt-0.5 block text-xs leading-relaxed text-stone-500">
            Let members share extra cooking tips on this post. Existing published tips stay visible if you turn this off.
          </span>
        )}
      </span>
    </label>
  );
}
