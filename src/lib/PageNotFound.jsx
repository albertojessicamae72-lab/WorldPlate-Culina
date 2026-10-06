import { Link } from "react-router-dom";

export default function PageNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <section className="max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <p className="text-6xl font-light text-amber-300">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-stone-800">Page not found</h1>
        <p className="mt-2 text-stone-500">Hindi namin makita ang page na ito.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700">Go to WorldPlate Culina</Link>
      </section>
    </main>
  );
}
