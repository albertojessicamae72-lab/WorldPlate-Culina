from fastapi import APIRouter, Depends, HTTPException

from ..models import Comment, LikeStatus, NewComment
from .. import account_store
from ..seed import get_recipe
from .accounts import current_account

router = APIRouter(prefix="/api/recipes", tags=["interactions"])

def _require_target(target_id: str):
    recipe = get_recipe(target_id)
    if recipe is not None:
        return
    recipe_id, separator, country_code = target_id.rpartition("--")
    recipe = get_recipe(recipe_id) if separator else None
    has_adaptation = recipe and any(
        adaptation.destinationCountry.upper() == country_code.upper()
        for adaptation in recipe.adaptations
    )
    if not has_adaptation:
        raise HTTPException(status_code=404, detail="Recipe or adaptation not found")


@router.get("/{recipe_id}/comments", response_model=list[Comment])
def list_comments(recipe_id: str):
    _require_target(recipe_id)
    return account_store.list_comments(recipe_id)


@router.post("/{recipe_id}/comments", response_model=Comment, status_code=201)
def create_comment(recipe_id: str, payload: NewComment, account=Depends(current_account)):
    _require_target(recipe_id)
    return account_store.create_comment(recipe_id, account, payload.text)


@router.delete("/{recipe_id}/comments/{comment_id}", status_code=204)
def delete_comment(recipe_id: str, comment_id: str, account=Depends(current_account)):
    result = account_store.delete_comment(recipe_id, comment_id, account["id"])
    if result is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    if not result:
        raise HTTPException(status_code=403, detail="You can only delete your own comment.")


@router.get("/{recipe_id}/like", response_model=LikeStatus)
def get_like(recipe_id: str, account=Depends(current_account)):
    _require_target(recipe_id)
    return account_store.get_recipe_like_status(recipe_id, account["id"])


@router.get("/{recipe_id}/likers")
def get_likers(recipe_id: str, _account=Depends(current_account)):
    _require_target(recipe_id)
    return account_store.list_recipe_likers(recipe_id)


@router.post("/{recipe_id}/like", response_model=LikeStatus)
def toggle_like(recipe_id: str, account=Depends(current_account)):
    _require_target(recipe_id)
    return account_store.toggle_recipe_like(recipe_id, account["id"])
