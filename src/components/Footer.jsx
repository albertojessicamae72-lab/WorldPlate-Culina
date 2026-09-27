import React from "react";
import { Link } from "react-router-dom";
import { UtensilsCrossed, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white">
                <UtensilsCrossed className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-stone-800">
                Local<span className="text-amber-600">Plate</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-500">
              Food travels across borders, but ingredients are local. Discover recipes
              from around the world and see how communities adapt them to what's
              available where they live.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
            <Link to="/cuisines" className="text-stone-500 hover:text-stone-800">Cuisines</Link>
            <Link to="/recipes" className="text-stone-500 hover:text-stone-800">Recipes</Link>
            <Link to="/" className="text-stone-500 hover:text-stone-800">Adapt a Recipe</Link>
            <Link to="/" className="text-stone-500 hover:text-stone-800">Contribute</Link>
          </div>
        </div>
        <div className="mt-10 flex items-center gap-1.5 text-xs text-stone-400">
          <Heart className="h-3.5 w-3.5" />
          <span>A free, community-driven project. No AI-generated recipes.</span>
        </div>
      </div>
    </footer>
  );
}