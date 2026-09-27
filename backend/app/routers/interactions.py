from fastapi import APIRouter, HTTPException

from ..models import Comment, NewComment, NewRating, Rating
from ..seed import get_recipe

router = APIRouter(prefix="/api/recipes", tags=["interactions"])

COMMENTS: list[Comment] = []
RATINGS: dict[str, list[int]] = {}
_counter = 0


def _next_id() -> str:
    global _counter
    _counter += 1
    return f"c{_counter}"


def _require_recipe(recipe_id: str):
    if get_recipe(recipe_id) is None:
        raise HTTPException(status_code=404, detail="Recipe not found")


@router.get("/{recipe_id}/comments", response_model=list[Comment])
def list_comments(recipe_id: str):
    _require_recipe(recipe_id)
    return [c for c in COMMENTS if c.recipeId == recipe_id]


@router.post("/{recipe_id}/comments", response_model=Comment, status_code=201)
def create_comment(recipe_id: str, payload: NewComment):
    _require_recipe(recipe_id)
    comment = Comment(
        id=_next_id(),
        recipeId=recipe_id,
        author=(payload.author or "Anonymous").strip() or "Anonymous",
        text=payload.text.strip(),
    )
    COMMENTS.append(comment)
    return comment


@router.delete("/{recipe_id}/comments/{comment_id}", status_code=204)
def delete_comment(recipe_id: str, comment_id: str):
    comment = next(
        (c for c in COMMENTS if c.id == comment_id and c.recipeId == recipe_id), None
    )
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    COMMENTS.remove(comment)


@router.get("/{recipe_id}/rating", response_model=Rating)
def get_rating(recipe_id: str):
    _require_recipe(recipe_id)
    stars = RATINGS.get(recipe_id, [])
    if not stars:
        return Rating(average=0, count=0)
    return Rating(average=round(sum(stars) / len(stars), 2), count=len(stars))


@router.post("/{recipe_id}/rating", response_model=Rating, status_code=201)
def rate_recipe(recipe_id: str, payload: NewRating):
    _require_recipe(recipe_id)
    RATINGS.setdefault(recipe_id, []).append(payload.stars)
    stars = RATINGS[recipe_id]
    return Rating(average=round(sum(stars) / len(stars), 2), count=len(stars))
