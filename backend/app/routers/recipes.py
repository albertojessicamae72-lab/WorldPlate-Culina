import re

from fastapi import APIRouter, Depends, HTTPException, Query

from ..models import Adaptation, CommunityTipsSetting, NewRecipe, Recipe
from ..seed import RECIPES, get_recipe
from .. import account_store
from .accounts import current_account
from .local_twists import discard_recipe_twists

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


def restore_user_contributions() -> None:
    for data in account_store.list_recipe_contributions():
        recipe = Recipe.model_validate(data)
        if get_recipe(recipe.id) is None:
            RECIPES.append(recipe)

    for contribution in account_store.list_adaptation_contributions():
        recipe = get_recipe(contribution["recipeId"])
        country_code = contribution["countryCode"]
        if recipe is None or any(
            item.destinationCountry == country_code for item in recipe.adaptations
        ):
            continue
        recipe.adaptations.append(Adaptation.model_validate(contribution["data"]))


restore_user_contributions()


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
    for recipe in results:
        recipe.allowCommunityTips = account_store.community_tips_enabled(recipe.id)
        for adaptation in recipe.adaptations:
            adaptation.allowCommunityTips = account_store.community_tips_enabled(
                recipe.id, adaptation.destinationCountry
            )
    return results


@router.post("", response_model=Recipe, status_code=201)
def create_recipe(payload: NewRecipe, account=Depends(current_account)):
    base_id = re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-") or "recipe"
    recipe_id = base_id
    suffix = 2
    while get_recipe(recipe_id) is not None:
        recipe_id = f"{base_id}-{suffix}"
        suffix += 1
    data = payload.model_dump(exclude={"country", "owner"})
    data["owner"] = account["id"]
    try:
        data["collaborators"] = account_store.get_public_accounts_by_ids(data["collaborators"])
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    recipe = Recipe(
        id=recipe_id,
        status="pending",
        country=payload.country.upper(),
        **data,
    )
    account_store.save_recipe_contribution(
        recipe_id, account["id"], recipe.model_dump(mode="json")
    )
    RECIPES.append(recipe)
    account_store.set_community_tips_enabled(
        recipe_id, "", payload.allowCommunityTips
    )
    return recipe


@router.get("/{recipe_id}", response_model=Recipe)
def read_recipe(recipe_id: str):
    recipe = get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    recipe.allowCommunityTips = account_store.community_tips_enabled(recipe.id)
    for adaptation in recipe.adaptations:
        adaptation.allowCommunityTips = account_store.community_tips_enabled(
            recipe.id, adaptation.destinationCountry
        )
    return recipe


@router.patch("/{recipe_id}/community-tips")
def set_recipe_community_tips(
    recipe_id: str,
    payload: CommunityTipsSetting,
    account=Depends(current_account),
):
    recipe = get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if recipe.owner != account["id"]:
        raise HTTPException(
            status_code=403,
            detail="Only the person who added this recipe can change its community tip setting.",
        )
    account_store.set_community_tips_enabled(
        recipe_id, "", payload.allowCommunityTips
    )
    recipe.allowCommunityTips = payload.allowCommunityTips
    return {"allowCommunityTips": recipe.allowCommunityTips}


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: str, owner: str = Query(...)):
    recipe = get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if recipe.owner != owner:
        raise HTTPException(
            status_code=403,
            detail="Only the person who added this recipe can delete it.",
        )
    discard_recipe_twists(recipe_id)
    RECIPES.remove(recipe)
    account_store.delete_recipe_contribution(recipe_id)
