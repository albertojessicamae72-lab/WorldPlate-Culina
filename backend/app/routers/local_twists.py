from fastapi import APIRouter, Depends, HTTPException

from .. import account_store
from ..models import LocalTwist, LocalTwistVote, NewLocalTwist
from ..seed import get_recipe
from .accounts import current_account

router = APIRouter(prefix="/api/recipes", tags=["local tips"])


def _recipe_key(recipe_id: str):
    if get_recipe(recipe_id) is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe_id, ""


@router.get("/{recipe_id}/tips", response_model=list[LocalTwist])
def list_recipe_tips(recipe_id: str, account=Depends(current_account)):
    return account_store.list_local_tips(*_recipe_key(recipe_id), account["id"])


@router.post("/{recipe_id}/tips", response_model=LocalTwist, status_code=201)
def create_recipe_tip(recipe_id: str, payload: NewLocalTwist, account=Depends(current_account)):
    return account_store.create_local_tip(*_recipe_key(recipe_id), account["id"], payload.text)


@router.post("/{recipe_id}/tips/{tip_id}/vote", response_model=LocalTwist)
def vote_recipe_tip(recipe_id: str, tip_id: str, payload: LocalTwistVote, account=Depends(current_account)):
    _recipe_key(recipe_id)
    result = account_store.vote_local_tip(tip_id, account["id"], payload.value)
    if not result or result["recipeId"] != recipe_id or result["destinationCountry"] != "":
        raise HTTPException(status_code=404, detail="Recipe tip not found")
    return result


def _adaptation_key(recipe_id: str, country_code: str):
    recipe = get_recipe(recipe_id)
    country = country_code.upper()
    if recipe is None or not any(a.destinationCountry.upper() == country for a in recipe.adaptations):
        raise HTTPException(status_code=404, detail="Recipe adaptation not found")
    return recipe_id, country


@router.get("/{recipe_id}/adaptations/{country_code}/twists", response_model=list[LocalTwist])
def list_local_twists(recipe_id: str, country_code: str, account=Depends(current_account)):
    key = _adaptation_key(recipe_id, country_code)
    return account_store.list_local_tips(*key, account["id"])


@router.post("/{recipe_id}/adaptations/{country_code}/twists", response_model=LocalTwist, status_code=201)
def create_local_twist(recipe_id: str, country_code: str, payload: NewLocalTwist, account=Depends(current_account)):
    key = _adaptation_key(recipe_id, country_code)
    return account_store.create_local_tip(*key, account["id"], payload.text)


@router.post("/{recipe_id}/adaptations/{country_code}/twists/{twist_id}/vote", response_model=LocalTwist)
def toggle_local_twist_vote(recipe_id: str, country_code: str, twist_id: str,
                            payload: LocalTwistVote, account=Depends(current_account)):
    _adaptation_key(recipe_id, country_code)
    result = account_store.vote_local_tip(twist_id, account["id"], payload.value)
    if not result or result["recipeId"] != recipe_id or result["destinationCountry"] != country_code.upper():
        raise HTTPException(status_code=404, detail="Local tip not found")
    return result


def discard_local_twists(recipe_id: str, country_code: str) -> None:
    account_store.discard_local_tips(recipe_id, country_code)


def discard_recipe_twists(recipe_id: str) -> None:
    account_store.discard_local_tips(recipe_id)
