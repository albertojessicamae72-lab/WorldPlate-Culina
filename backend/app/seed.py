from .models import Recipe

RECIPES: list[Recipe] = [
    Recipe(
        id="molokhia",
        name="Molokhiya",
        cuisine="egyptian",
        country="EG",
        category="soups",
        originalLanguage="ar",
        originalTitle="ملوخية",
        contributor="Community contributor",
        owner="localplate",
        image="/images/molokhiya.png",
        ingredients=[
            "Molokhiya Leaves",
            "Chicken broth",
            "Garlic",
            "Butter or ghee",
            "Salt",
            "Optional chicken",
        ],
        preparation=(
            "Prepare the molokhia leaves, simmer in seasoned chicken broth, "
            "then finish with a garlic-coriander tempering in butter or ghee. "
            "Image note: The food image is AI-generated and is for illustrative purposes."
        ),
        servingSize=4,
        estimatedCost=None,
        status="published",
        translations=[
            {"language": "en", "title": "Molokhia", "status": "available", "contributor": "Community translator"},
            {"language": "fil", "status": "not_translated"},
            {"language": "ja", "status": "not_translated"},
        ],
        adaptations=[],
    ),
]


def get_recipe(recipe_id: str) -> Recipe | None:
    return next((r for r in RECIPES if r.id == recipe_id), None)
