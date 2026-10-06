export default function BrandMark({ className = "h-10 w-10" }) {
  return (
    <img
      src="/culina-mark.svg"
      alt=""
      aria-hidden="true"
      className={`block shrink-0 rounded-xl shadow-sm ${className}`}
    />
  );
}
