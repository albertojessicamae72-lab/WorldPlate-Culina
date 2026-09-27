export const RECIPES = [
    {
        id: "molokhia",
        name: "Molokhiya",
        cuisine:"egyptian",
        country: "EG",
        category: "soups",
        originalLanguage: "ar",
        originalTitle: "ملوخية",
        contributor: "Community contributor",
        image: "",
        ingredients: [
            "Molokhiya Leaves",
            "Chicken broth",
            "Garlic",
            "Butter or ghee",
            "Salt",
            "Optional chicken",
        ],
        preparation:
         "Prepare the molokhia leaves, simmer in seasoned chickem broth, then finish with a garlic-coriander tempering in butter or ghee.",
        servingSize: 4,
        estimatedCost: null,
        status: "published",
        translations: [
            { language: "en", title: "Molokhia", status: "available", contributor: "Community tanslator" },
            { language: "fil", status: "not_translated"},
            { language: "ja", status: "not_translated"},
        ],
        adaptations: [
            {
                id: "molokhia-ph",
                destinationCountry: "PH",
                title: "Filipino Family Adaptation of Molokhia",
                adaptationType: "Family / local Adaptation",
                ingredients: [
                    "Chicken",
                    "Garlic",
                    "Blended saluyot",
                    "Maggi Magic Sarap",
                    "Salt",
                    "Onion",
                    "Oil",
                ],
                availability: "Alternative documented",
                estimatedLocalCost: null,
                servingSize: 4,
                contributor: "Community contributor",
                notes:
                 "Filipino family adaptation. this is local adaptation and not a claim that saluyot is theexact traditional equivalent of molokhia",
                 status: "published",
            },
        ],
    },
    {
    id: "chicken-adobo",
    name: "Chicken Adobo",
    cuisine: "filipino",
    country: "PH",
    category: "main",
    originalLanguage: "fil",
    originalTitle: "Chicken Adobo",
    contributor: "Community contributor",
    image: "",
    ingredients: [
      "Chicken",
      "Soy sauce",
      "Vinegar",
      "Garlic",
      "Onion",
      "Bay leaves",
      "Black pepper",
    ],
    preparation:
      "Marinate chicken in soy sauce, vinegar, garlic and pepper, then simmer with onions and bay leaves until tender and the sauce reduces.",
    servingSize: 4,
    estimatedCost: null,
    status: "published",
    translations: [
      { language: "en", title: "Chicken Adobo", status: "available", contributor: "Community translator" },
      { language: "ja", status: "not_translated" },
    ],
    adaptations: [],
  },
];

/** @param {string} id */
export const getRecipe = (id) => RECIPES.find((r) => r.id === id);
/** @param {string} code */
export const getRecipesByCuisine = (code) => RECIPES.filter((r) => r.cuisine === code);
/** @param {string} recipeId @param {string} countryCode */
export const getAdaptation = (recipeId, countryCode) => {
  const recipe = getRecipe(recipeId);
  if (!recipe) return null;
  return recipe.adaptations.find((a) => a.destinationCountry === countryCode) || null;
};    
