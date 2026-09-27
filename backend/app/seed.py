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
        image="",
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
            "then finish with a garlic-coriander tempering in butter or ghee."
        ),
        servingSize=4,
        estimatedCost=None,
        status="published",
        translations=[
            {"language": "en", "title": "Molokhia", "status": "available", "contributor": "Community translator"},
            {"language": "fil", "status": "not_translated"},
            {"language": "ja", "status": "not_translated"},
        ],
        adaptations=[
            {
                "id": "molokhia-ph",
                "destinationCountry": "PH",
                "title": "Filipino Family Adaptation of Molokhia",
                "adaptationType": "Family / local Adaptation",
                "ingredients": [
                    "Chicken",
                    "Garlic",
                    "Blended saluyot",
                    "Maggi Magic Sarap",
                    "Salt",
                    "Onion",
                    "Oil",
                ],
                "availability": "Alternative documented",
                "estimatedLocalCost": None,
                "servingSize": 4,
                "contributor": "Community contributor",
                "notes": (
                    "Filipino family adaptation. This is a local adaptation and not a claim "
                    "that saluyot is the exact traditional equivalent of molokhia."
                ),
                "status": "published",
            },
        ],
    ),
    Recipe(
        id="chicken-adobo",
        name="Chicken Adobo",
        cuisine="filipino",
        country="PH",
        category="main",
        originalLanguage="fil",
        originalTitle="Chicken Adobo",
        contributor="Community contributor",
        image="",
        ingredients=[
            "Chicken",
            "Soy sauce",
            "Vinegar",
            "Garlic",
            "Onion",
            "Bay leaves",
            "Black pepper",
        ],
        preparation=(
            "Marinate chicken in soy sauce, vinegar, garlic and pepper, then simmer "
            "with onions and bay leaves until tender and the sauce reduces."
        ),
        servingSize=4,
        estimatedCost=None,
        status="published",
        translations=[
            {"language": "en", "title": "Chicken Adobo", "status": "available", "contributor": "Community translator"},
            {"language": "ja", "status": "not_translated"},
        ],
        adaptations=[],
    ),
]


def get_recipe(recipe_id: str) -> Recipe | None:
    return next((r for r in RECIPES if r.id == recipe_id), None)




