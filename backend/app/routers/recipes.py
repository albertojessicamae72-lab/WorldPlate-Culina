import re

from fastapi import APIRouter, HTTPException, Query

from ..models import NewRecipe, Recipe
from ..seed import RECIPES, get_recipe

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


@router.get("", response_model=list[Recipe])
def list_recipes(
    cuisine: str | None = None,
    category: str | None = None,
    country: str | None = None,
    q: str | None = Query(default=None, description="Search in name and original title"),
):
    results = RECIPES
    if cuisine:
        results = [r for r in results if r.cuisine == cuisine]
    if category:
        results = [r for r in results if r.category == category]
    if country:
        results = [r for r in results if r.country == country]
    if q:
        needle = q.lower()
        results = [
            r
            for r in results
            if needle in r.name.lower() or needle in (r.originalTitle or "").lower()
        ]
    return results


@router.post("", response_model=Recipe, status_code=201)
def create_recipe(payload: NewRecipe):
    base_id = re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-") or "recipe"
    recipe_id = base_id
    suffix = 2
    while get_recipe(recipe_id) is not None:
        recipe_id = f"{base_id}-{suffix}"
        suffix += 1
    recipe = Recipe(
        id=recipe_id,
        status="pending",
        country=payload.country.upper(),
        **payload.model_dump(exclude={"country"}),
    )
    RECIPES.append(recipe)
    return recipe


@router.get("/{recipe_id}", response_model=Recipe)
def read_recipe(recipe_id: str):
    recipe = get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: str):
    recipe = get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    RECIPES.remove(recipe)
