import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import { ImageIcon, Loader2, Plus, Search, UserPlus, X } from "lucide-react";
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
import { getCurrentUser, resolveOwner } from "@/lib/current-user";
import { useAuth } from "@/lib/AuthContext";
import { useSearchAccounts } from "@/lib/accounts-api";
import IngredientBudgetEditor, { ingredientCostsPayload } from "@/components/IngredientBudgetEditor";
import { useApp } from "@/lib/AppContext";

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
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
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

        {!isAuthenticated ? (
          <div className="py-5 text-center">
            <p className="text-sm leading-relaxed text-stone-600">Sign in first so your recipe or local adaptation is saved under your community profile.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Button asChild className="bg-amber-600 hover:bg-amber-700"><Link to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}>Continue to WorldPlate Culina</Link></Button>
            </div>
          </div>
        ) : <>
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
              user={user}
              onDone={(country) => {
                onOpenChange(false);
                navigate(`/recipes/${recipe.id}/adapt/${country}`);
              }}
            />
          ) : (
            <RecipeForm
              user={user}
              key={`recipe-${String(open)}`}
              onDone={(id) => {
                onOpenChange(false);
                navigate(`/recipes/${id}`);
              }}
            />
          )}
        </div>
        </>}
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

function PhotoField({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field label={label}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFile}
        className="hidden"
      />
      {value ? (
        <div className="relative h-36 w-full overflow-hidden rounded-md border border-stone-200">
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove photo"
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-stone-500 shadow transition hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-stone-300 text-sm text-stone-400 transition hover:border-amber-400 hover:text-amber-600 disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <ImageIcon className="h-5 w-5" /> Add a photo (JPEG/PNG, max 5 MB)
            </>
          )}
        </button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </Field>
  );
}

function AdaptationForm({ recipe, defaultCountry, onDone, user }) {
  const { cookingCountry } = useApp();
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState(defaultCountry || cookingCountry);
  const [adaptationType, setAdaptationType] = useState(ADAPTATION_TYPES[0]);
  const [ingredients, setIngredients] = useState("");
  const [ingredientPrices, setIngredientPrices] = useState({});
  const [budgetAdjustment, setBudgetAdjustment] = useState("");
  const [availability, setAvailability] = useState(AVAILABILITY_OPTIONS[1]);
  const [servingSize, setServingSize] = useState("");
  const [contributor, setContributor] = useState(user?.displayName || getCurrentUser());
  const [collaborators, setCollaborators] = useState([]);
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState("");
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
        ingredientCosts: ingredientCostsPayload(ingredients, ingredientPrices),
        budgetAdjustment: Number(budgetAdjustment) || 0,
        availability,
        servingSize: toIntOrNull(servingSize),
        contributor: contributor.trim() || null,
        owner: user?.id || resolveOwner(contributor),
        collaborators: collaborators.map((person) => person.id),
        image,
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
      <IngredientBudgetEditor ingredientsText={ingredients} costs={ingredientPrices} onChange={setIngredientPrices} countryCode={country} adjustment={budgetAdjustment} onAdjustmentChange={setBudgetAdjustment} />
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
      <CollaboratorField value={collaborators} onChange={setCollaborators} />
      <PhotoField
        label="Photo of your cooked version"
        value={image}
        onChange={setImage}
      />
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

function RecipeForm({ onDone, user }) {
  const { cookingCountry } = useApp();
  const [name, setName] = useState("");
  const [country, setCountry] = useState(cookingCountry);
  const [cuisine, setCuisine] = useState("");
  const [category, setCategory] = useState("");
  const [originalLanguage, setOriginalLanguage] = useState("en");
  const [ingredients, setIngredients] = useState("");
  const [ingredientPrices, setIngredientPrices] = useState({});
  const [budgetAdjustment, setBudgetAdjustment] = useState("");
  const [preparation, setPreparation] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [contributor, setContributor] = useState(user?.displayName || getCurrentUser());
  const [collaborators, setCollaborators] = useState([]);
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const createRecipe = useCreateRecipe();

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
        ingredientCosts: ingredientCostsPayload(ingredients, ingredientPrices),
        budgetAdjustment: Number(budgetAdjustment) || 0,
        preparation: preparation.trim(),
        servingSize: toIntOrNull(servingSize),
        contributor: contributor.trim() || null,
        owner: user?.id || resolveOwner(contributor),
        collaborators: collaborators.map((person) => person.id),
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
      <PhotoField label="Food photo" value={image} onChange={setImage} />
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
      <IngredientBudgetEditor ingredientsText={ingredients} costs={ingredientPrices} onChange={setIngredientPrices} countryCode={country} adjustment={budgetAdjustment} onAdjustmentChange={setBudgetAdjustment} />
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
      <CollaboratorField value={collaborators} onChange={setCollaborators} />
      <FormError>{error}</FormError>
      <Button type="submit" className="w-full" disabled={createRecipe.isPending}>
        {createRecipe.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit recipe
      </Button>
    </form>
  );
}

function CollaboratorField({ value, onChange }) {
  const [query, setQuery] = useState("");
  const { data: matches = [], isFetching } = useSearchAccounts(query);
  const addCollaborator = (person) => {
    if (!value.some((item) => item.id === person.id)) onChange([...value, person]);
    setQuery("");
  };
  return (
    <Field label="Add collaborators (optional)">
      <div className="space-y-2">
        <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5">
          {value.map((person) => <span key={person.id} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">@{person.username}<button type="button" onClick={() => onChange(value.filter((item) => item.id !== person.id))} aria-label={`Remove ${person.username}`} className="rounded-full p-0.5 hover:bg-amber-100"><X className="h-3 w-3" /></button></span>)}
          <div className="flex min-w-[150px] flex-1 items-center gap-2 px-1"><Search className="h-3.5 w-3.5 text-stone-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search member name" className="h-7 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></div>
        </div>
        {query.trim().length >= 2 && <div className="max-h-36 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-sm">{isFetching ? <p className="px-3 py-2 text-xs text-stone-500">Searching members…</p> : matches.filter((person) => !value.some((item) => item.id === person.id)).length ? matches.filter((person) => !value.some((item) => item.id === person.id)).map((person) => <button key={person.id} type="button" onClick={() => addCollaborator(person)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-amber-50"><UserPlus className="h-4 w-4 text-amber-700" /><span className="font-medium text-stone-800">{person.displayName}</span><span className="text-xs text-stone-500">@{person.username}</span></button>) : <p className="px-3 py-2 text-xs text-stone-500">No other members found.</p>}</div>}
        <p className="text-xs text-stone-500">Selected members will also see this in their profile contributions.</p>
      </div>
    </Field>
  );
}
