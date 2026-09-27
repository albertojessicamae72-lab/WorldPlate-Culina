import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { COUNTRIES } from "@/data/countries";
import { useApp } from "@/lib/AppContext";
import { MapPin } from "lucide-react";

export default function AdaptRecipeDialog({ recipe, open, onOpenChange }) {
  const navigate = useNavigate();
  const { cookingCountry } = useApp();
  const [selected, setSelected] = useState(cookingCountry);

  const handleSelect = (code) => {
    setSelected(code);
    onOpenChange(false);
    navigate(`/recipes/${recipe.id}/adapt/${code}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-600" />
            Where are you cooking?
          </DialogTitle>
          <DialogDescription>
            Choose a country to see how <span className="font-medium text-stone-700">{recipe.name}</span> can be locally adapted.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 grid max-h-80 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleSelect(c.code)}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                selected === c.code
                  ? "border-amber-500 bg-amber-50"
                  : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              <span className="text-xl leading-none">{c.flag}</span>
              <span className="font-medium text-stone-700">{c.name}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}