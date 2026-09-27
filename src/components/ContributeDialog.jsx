import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageIcon, Loader2, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { COUNTRIES } from "@/data/countries";
import { CUISINES } from "@/data/cuisines";
import { CATEGORIES } from "@/data/categories";
import { LANGUAGES } from "@/data/languages";
import { uploadImage, useCreateAdaptation, useCreateRecipe } from "@/lib/recipes-api";

const ADAPTATION_TYPES = [
  "Family / local Adaptation",
  "Traditional variant",
  "Budget-friendly",
  "Vegetarian swap",
  "Other",
];

const AVAILABILITY_OPTIONS = [
  "Available locally",
  "Alternative documented",
  "Hard to find",
];

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textareaClass =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function parseLines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toIntOrNull(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

export default function ContributeDialog({
  open,
  onOpenChange,
  recipe = null,
  defaultCountry = "",
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(recipe ? "adaptation" : "recipe");

  useEffect(() => {
    if (open) setTab(recipe ? "adaptation" : "recipe");
  }, [open, recipe]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-amber-600" /> Contribute
          </DialogTitle>
          <DialogDescription>
            {recipe
              ? `Share how ${recipe.name} is cooked where you live, or add a new traditional recipe.`
              : "Add a new traditional recipe to the community."}
          </DialogDescription>
        </DialogHeader>

        {recipe && (
          <div className="flex gap-1 rounded-full bg-stone-100 p-1 text-sm">
            <TabButton active={tab === "adaptation"} onClick={() => setTab("adaptation")}>
              Local adaptation
            </TabButton>
            <TabButton active={tab === "recipe"} onClick={() => setTab("recipe")}>
              New traditional recipe
            </TabButton>
          </div>
        )}

        <div className="max-h-[65vh] overflow-y-auto pr-1">
          {tab === "adaptation" && recipe ? (
            <AdaptationForm
              key={`adaptation-${String(open)}`}
              recipe={recipe}
              defaultCountry={defaultCountry}
              onDone={(country) => {
                onOpenChange(false);
                navigate(`/recipes/${recipe.id}/adapt/${country}`);
              }}
            />
          ) : (
            <RecipeForm
              key={`recipe-${String(open)}`}
              onDone={(id) => {
                onOpenChange(false);
                navigate(`/recipes/${id}`);
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full px-3 py-1.5 font-medium transition ${
        active ? "bg-white text-amber-700 shadow-sm" : "text-stone-500 hover:text-stone-700"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-amber-600">*</span>}
      </Label>
      {children}
    </div>
  );
}

function FormError({ children }) {
  if (!children) return null;
  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{children}</p>
  );
}

function AdaptationForm({ recipe, defaultCountry, onDone }) {
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState(defaultCountry);
  const [adaptationType, setAdaptationType] = useState(ADAPTATION_TYPES[0]);
  const [ingredients, setIngredients] = useState("");
  const [availability, setAvailability] = useState(AVAILABILITY_OPTIONS[1]);
  const [servingSize, setServingSize] = useState("");
  const [contributor, setContributor] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const createAdaptation = useCreateAdaptation(recipe.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !country || !parseLines(ingredients).length) {
      setError("Please fill in the title, country, and at least one ingredient.");
      return;
    }
    createAdaptation.mutate(
      {
        destinationCountry: country,
        title: title.trim(),
        adaptationType,
        ingredients: parseLines(ingredients),
        availability,
        servingSize: toIntOrNull(servingSize),
        contributor: contributor.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          toast({
            title: "Adaptation submitted",
            description: "Thanks for contributing! It will show up after review.",
          });
          onDone(country);
        },
        onError: (err) => setError(err.message),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <Field label="Adaptation title" required>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`e.g. Filipino-style ${recipe.name}`}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country you're cooking in" required>
          <select className={selectClass} value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Select a country…</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Adaptation type">
          <select
            className={selectClass}
            value={adaptationType}
            onChange={(e) => setAdaptationType(e.target.value)}
          >
            {ADAPTATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Local ingredients (one per line)" required>
        <textarea
          className={textareaClass}
          rows={5}
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder={"Chicken\nGarlic\nLocal substitute for …"}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ingredient availability">
          <select
            className={selectClass}
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            {AVAILABILITY_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Serving size">
          <Input
            type="number"
            min="1"
            value={servingSize}
            onChange={(e) => setServingSize(e.target.value)}
            placeholder="4"
          />
        </Field>
      </div>
      <Field label="Your name (contributor)">
        <Input
          value={contributor}
          onChange={(e) => setContributor(e.target.value)}
          placeholder="Community contributor"
        />
      </Field>
      <Field label="Adaptation notes">
        <textarea
          className={textareaClass}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why these substitutions work locally…"
        />
      </Field>
      <FormError>{error}</FormError>
      <Button type="submit" className="w-full" disabled={createAdaptation.isPending}>
        {createAdaptation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit adaptation
      </Button>
    </form>
  );
}

function RecipeForm({ onDone }) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [category, setCategory] = useState("");
  const [originalLanguage, setOriginalLanguage] = useState("en");
  const [ingredients, setIngredients] = useState("");
  const [preparation, setPreparation] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [contributor, setContributor] = useState("");
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const createRecipe = useCreateRecipe();

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      setImage(await uploadImage(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !country || !cuisine || !parseLines(ingredients).length) {
      setError("Please fill in the name, country of origin, cuisine, and at least one ingredient.");
      return;
    }
    createRecipe.mutate(
      {
        name: name.trim(),
        country,
        cuisine,
        category: category || null,
        originalLanguage,
        ingredients: parseLines(ingredients),
        preparation: preparation.trim(),
        servingSize: toIntOrNull(servingSize),
        contributor: contributor.trim() || null,
        image,
      },
      {
        onSuccess: (created) => {
          toast({
            title: "Recipe submitted",
            description: "Thanks for contributing! It will show up after review.",
          });
          onDone(created.id);
        },
        onError: (err) => setError(err.message),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <Field label="Recipe name" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pancit Canton" />
      </Field>
      <Field label="Food photo">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handlePhoto}
          className="hidden"
        />
        {image ? (
          <div className="relative h-36 w-full overflow-hidden rounded-md border border-stone-200">
            <img src={image} alt="Recipe" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setImage("")}
              aria-label="Remove photo"
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-stone-500 shadow transition hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-stone-300 text-sm text-stone-400 transition hover:border-amber-400 hover:text-amber-600 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <ImageIcon className="h-5 w-5" /> Add a photo of the dish (JPEG/PNG, max 5 MB)
              </>
            )}
          </button>
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country of origin" required>
          <select className={selectClass} value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Select a country…</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cuisine" required>
          <select className={selectClass} value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
            <option value="">Select a cuisine…</option>
            {CUISINES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select a category…</option>
            {CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Original language">
          <select
            className={selectClass}
            value={originalLanguage}
            onChange={(e) => setOriginalLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Ingredients (one per line)" required>
        <textarea
          className={textareaClass}
          rows={5}
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder={"Rice\nOnion\n…"}
        />
      </Field>
      <Field label="Preparation">
        <textarea
          className={textareaClass}
          rows={4}
          value={preparation}
          onChange={(e) => setPreparation(e.target.value)}
          placeholder="How is it cooked?"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Serving size">
          <Input
            type="number"
            min="1"
            value={servingSize}
            onChange={(e) => setServingSize(e.target.value)}
            placeholder="4"
          />
        </Field>
        <Field label="Your name (contributor)">
          <Input
            value={contributor}
            onChange={(e) => setContributor(e.target.value)}
            placeholder="Community contributor"
          />
        </Field>
      </div>
      <FormError>{error}</FormError>
      <Button type="submit" className="w-full" disabled={createRecipe.isPending}>
        {createRecipe.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit recipe
      </Button>
    </form>
  );
}
