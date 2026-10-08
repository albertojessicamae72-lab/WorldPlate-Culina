import re

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from .. import account_store
from ..models import LocalTwist, LocalTwistsPage, LocalTwistVote, NewLocalTwist
from ..seed import get_recipe
from .accounts import current_account

router = APIRouter(prefix="/api/recipes", tags=["local tips"])


def _recipe_key(recipe_id: str):
    if get_recipe(recipe_id) is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe_id, ""


def _check_tips_enabled(recipe_id: str, country_code: str):
    if not account_store.community_tips_enabled(recipe_id, country_code):
        raise HTTPException(
            status_code=403,
            detail="The creator has disabled community tips for this recipe or adaptation.",
        )


def _reject_instruction_duplicate(text: str, instructions: list[str]):
    normalize = lambda value: re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()
    submitted = normalize(text)
    parts = [
        normalize(part)
        for instruction in instructions
        for part in re.split(r"[\n.!?]+", instruction)
        if normalize(part)
    ]
    if any(submitted == part for part in parts):
        raise HTTPException(
            status_code=400,
            detail="Share a practical tip that adds something beyond the listed ingredients and instructions.",
        )


@router.get("/{recipe_id}/tips", response_model=LocalTwistsPage)
def list_recipe_tips(
    recipe_id: str,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=8, ge=1, le=50),
    account=Depends(current_account),
):
    return account_store.list_local_tips(
        *_recipe_key(recipe_id), account["id"], limit, offset
    )


@router.post("/{recipe_id}/tips", response_model=LocalTwist, status_code=201)
def create_recipe_tip(recipe_id: str, payload: NewLocalTwist, account=Depends(current_account)):
    key = _recipe_key(recipe_id)
    recipe = get_recipe(recipe_id)
    _check_tips_enabled(*key)
    _reject_instruction_duplicate(
        payload.text, [*recipe.ingredients, recipe.preparation]
    )
    return account_store.create_local_tip(*key, account["id"], payload.text)


@router.post("/{recipe_id}/tips/{tip_id}/vote", response_model=LocalTwist)
def vote_recipe_tip(recipe_id: str, tip_id: str, payload: LocalTwistVote, account=Depends(current_account)):
    _recipe_key(recipe_id)
    result = account_store.vote_local_tip(
        tip_id, account["id"], payload.value, recipe_id, ""
    )
    if not result:
        raise HTTPException(status_code=404, detail="Recipe tip not found")
    return result


@router.patch("/{recipe_id}/tips/{tip_id}", response_model=LocalTwist)
def update_recipe_tip(
    recipe_id: str,
    tip_id: str,
    payload: NewLocalTwist,
    account=Depends(current_account),
):
    _recipe_key(recipe_id)
    recipe = get_recipe(recipe_id)
    _reject_instruction_duplicate(
        payload.text, [*recipe.ingredients, recipe.preparation]
    )
    result = account_store.update_local_tip(
        tip_id, recipe_id, "", account["id"], payload.text
    )
    if not result:
        raise HTTPException(status_code=404, detail="Recipe tip not found")
    return result


@router.delete("/{recipe_id}/tips/{tip_id}", status_code=204)
def delete_recipe_tip(
    recipe_id: str, tip_id: str, account=Depends(current_account)
):
    _recipe_key(recipe_id)
    if not account_store.delete_local_tip(
        tip_id, recipe_id, "", account["id"]
    ):
        raise HTTPException(status_code=404, detail="Recipe tip not found")
    return Response(status_code=204)


def _adaptation_key(recipe_id: str, country_code: str):
    recipe = get_recipe(recipe_id)
    country = country_code.upper()
    if recipe is None or not any(a.destinationCountry.upper() == country for a in recipe.adaptations):
        raise HTTPException(status_code=404, detail="Recipe adaptation not found")
    return recipe_id, country


@router.get(
    "/{recipe_id}/adaptations/{country_code}/twists",
    response_model=LocalTwistsPage,
)
def list_local_twists(
    recipe_id: str,
    country_code: str,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=8, ge=1, le=50),
    account=Depends(current_account),
):
    key = _adaptation_key(recipe_id, country_code)
    return account_store.list_local_tips(
        *key, account["id"], limit, offset
    )


@router.post("/{recipe_id}/adaptations/{country_code}/twists", response_model=LocalTwist, status_code=201)
def create_local_twist(recipe_id: str, country_code: str, payload: NewLocalTwist, account=Depends(current_account)):
    key = _adaptation_key(recipe_id, country_code)
    _check_tips_enabled(*key)
    recipe = get_recipe(recipe_id)
    adaptation = next(
        a for a in recipe.adaptations
        if a.destinationCountry == country_code.upper()
    )
    _reject_instruction_duplicate(
        payload.text,
        [*adaptation.ingredients, adaptation.preparation or "", adaptation.notes or ""],
    )
    return account_store.create_local_tip(*key, account["id"], payload.text)


@router.post("/{recipe_id}/adaptations/{country_code}/twists/{twist_id}/vote", response_model=LocalTwist)
def toggle_local_twist_vote(recipe_id: str, country_code: str, twist_id: str,
                            payload: LocalTwistVote, account=Depends(current_account)):
    _adaptation_key(recipe_id, country_code)
    result = account_store.vote_local_tip(
        twist_id, account["id"], payload.value, recipe_id, country_code
    )
    if not result:
        raise HTTPException(status_code=404, detail="Local tip not found")
    return result


@router.patch(
    "/{recipe_id}/adaptations/{country_code}/twists/{twist_id}",
    response_model=LocalTwist,
)
def update_local_twist(
    recipe_id: str,
    country_code: str,
    twist_id: str,
    payload: NewLocalTwist,
    account=Depends(current_account),
):
    _adaptation_key(recipe_id, country_code)
    recipe = get_recipe(recipe_id)
    adaptation = next(
        a for a in recipe.adaptations
        if a.destinationCountry == country_code.upper()
    )
    _reject_instruction_duplicate(
        payload.text,
        [*adaptation.ingredients, adaptation.preparation or "", adaptation.notes or ""],
    )
    result = account_store.update_local_tip(
        twist_id, recipe_id, country_code, account["id"], payload.text
    )
    if not result:
        raise HTTPException(status_code=404, detail="Local tip not found")
    return result


@router.delete(
    "/{recipe_id}/adaptations/{country_code}/twists/{twist_id}",
    status_code=204,
)
def delete_local_twist(
    recipe_id: str,
    country_code: str,
    twist_id: str,
    account=Depends(current_account),
):
    _adaptation_key(recipe_id, country_code)
    if not account_store.delete_local_tip(
        twist_id, recipe_id, country_code, account["id"]
    ):
        raise HTTPException(status_code=404, detail="Local tip not found")
    return Response(status_code=204)


def discard_local_twists(recipe_id: str, country_code: str) -> None:
    account_store.discard_local_tips(recipe_id, country_code)


def discard_recipe_twists(recipe_id: str) -> None:
    account_store.discard_local_tips(recipe_id)
