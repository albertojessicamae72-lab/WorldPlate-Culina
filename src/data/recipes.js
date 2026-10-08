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
        image: "/images/molokhiya.png",
        ingredients: [
            "Molokhiya Leaves",
            "Chicken broth",
            "Garlic",
            "Butter or ghee",
            "Salt",
            "Optional chicken",
        ],
        preparation:
         "Prepare the molokhia leaves, simmer in seasoned chicken broth, then finish with a garlic-coriander tempering in butter or ghee. Image note: The food image is AI-generated and is for illustrative purposes.",
        servingSize: 4,
        estimatedCost: null,
        status: "published",
        translations: [
            { language: "en", title: "Molokhia", status: "available", contributor: "Community tanslator" },
            { language: "fil", status: "not_translated"},
            { language: "ja", status: "not_translated"},
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
