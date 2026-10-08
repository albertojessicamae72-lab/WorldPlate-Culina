from fastapi import APIRouter, Depends, HTTPException, Query

from ..models import Adaptation, CommunityTipsSetting, NewAdaptation
from ..seed import RECIPES, get_recipe
from .. import account_store
from .accounts import current_account
from .local_twists import discard_local_twists

router = APIRouter(prefix="/api", tags=["adaptations"])


@router.get("/recipes/{recipe_id}/adaptations", response_model=list[Adaptation])
def list_adaptations(recipe_id: str):
    recipe = get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    for adaptation in recipe.adaptations:
        adaptation.allowCommunityTips = account_store.community_tips_enabled(
            recipe_id, adaptation.destinationCountry
        )
    return recipe.adaptations


@router.get(
    "/recipes/{recipe_id}/adaptations/{country_code}",
    response_model=Adaptation,
)
def read_adaptation(recipe_id: str, country_code: str):
    recipe = get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    adaptation = next(
        (a for a in recipe.adaptations if a.destinationCountry == country_code.upper()),
        None,
    )
    if adaptation is None:
        raise HTTPException(
            status_code=404,
            detail=f"No adaptation of '{recipe_id}' for country '{country_code}'",
        )
    adaptation.allowCommunityTips = account_store.community_tips_enabled(
        recipe_id, adaptation.destinationCountry
    )
    return adaptation


@router.patch(
    "/recipes/{recipe_id}/adaptations/{country_code}/community-tips",
)
def set_adaptation_community_tips(
    recipe_id: str,
    country_code: str,
    payload: CommunityTipsSetting,
    account=Depends(current_account),
):
    recipe = get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    adaptation = next(
        (a for a in recipe.adaptations if a.destinationCountry == country_code.upper()),
        None,
    )
    if adaptation is None:
        raise HTTPException(status_code=404, detail="Recipe adaptation not found")
    if adaptation.owner != account["id"]:
        raise HTTPException(
            status_code=403,
            detail="Only the person who added this adaptation can change its community tip setting.",
        )
    account_store.set_community_tips_enabled(
        recipe_id, country_code, payload.allowCommunityTips
    )
    adaptation.allowCommunityTips = payload.allowCommunityTips
    return {"allowCommunityTips": adaptation.allowCommunityTips}


@router.delete(
    "/recipes/{recipe_id}/adaptations/{country_code}",
    status_code=204,
)
def delete_adaptation(recipe_id: str, country_code: str, owner: str = Query(...)):
    recipe = get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    adaptation = next(
        (a for a in recipe.adaptations if a.destinationCountry == country_code.upper()),
        None,
    )
    if adaptation is None:
        raise HTTPException(
            status_code=404,
            detail=f"No adaptation of '{recipe_id}' for country '{country_code}'",
        )
    if adaptation.owner != owner:
        raise HTTPException(
            status_code=403,
            detail="Only the person who added this adaptation can delete it.",
        )
    discard_local_twists(recipe_id, country_code)
    recipe.adaptations.remove(adaptation)
    account_store.delete_adaptation_contribution(recipe_id, country_code)


@router.post(
    "/recipes/{recipe_id}/adaptations",
    response_model=Adaptation,
    status_code=201,
)
def create_adaptation(recipe_id: str, payload: NewAdaptation, account=Depends(current_account)):
    recipe = get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    country = payload.destinationCountry.upper()
    if any(a.destinationCountry == country for a in recipe.adaptations):
        raise HTTPException(
            status_code=409,
            detail=f"An adaptation for country '{country}' already exists",
        )
    data = payload.model_dump(exclude={"owner"})
    data["owner"] = account["id"]
    try:
        data["collaborators"] = account_store.get_public_accounts_by_ids(data["collaborators"])
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    data["destinationCountry"] = country
    adaptation = Adaptation(
        id=f"{recipe.id}-{country.lower()}",
        status="pending",
        **data,
    )
    account_store.save_adaptation_contribution(
        recipe.id, country, account["id"], adaptation.model_dump(mode="json")
    )
    recipe.adaptations.append(adaptation)
    account_store.set_community_tips_enabled(
        recipe.id, country, payload.allowCommunityTips
    )
    return adaptation


@router.get("/adaptations", response_model=list[Adaptation])
def list_all_adaptations(country: str | None = None):
    adaptations = [a for r in RECIPES for a in r.adaptations]
    for recipe in RECIPES:
        for adaptation in recipe.adaptations:
            adaptation.allowCommunityTips = account_store.community_tips_enabled(
                recipe.id, adaptation.destinationCountry
            )
    if country:
        adaptations = [a for a in adaptations if a.destinationCountry == country.upper()]
    return adaptations
