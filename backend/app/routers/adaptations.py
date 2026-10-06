from fastapi import APIRouter, Depends, HTTPException, Query

from ..models import Adaptation, NewAdaptation
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
    return adaptation


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
    recipe.adaptations.append(adaptation)
    return adaptation


@router.get("/adaptations", response_model=list[Adaptation])
def list_all_adaptations(country: str | None = None):
    adaptations = [a for r in RECIPES for a in r.adaptations]
    if country:
        adaptations = [a for a in adaptations if a.destinationCountry == country.upper()]
    return adaptations
