from datetime import datetime, timezone

from pydantic import BaseModel, Field


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Translation(BaseModel):
    language: str
    title: str | None = None
    status: str
    contributor: str | None = None


class Adaptation(BaseModel):
    id: str
    destinationCountry: str
    title: str
    adaptationType: str | None = None
    ingredients: list[str] = []
    preparation: str | None = None
    availability: str | None = None
    estimatedLocalCost: float | None = None
    servingSize: int | None = None
    contributor: str | None = None
    notes: str | None = None
    status: str = "published"


class Recipe(BaseModel):
    id: str
    name: str
    cuisine: str
    country: str
    category: str | None = None
    originalLanguage: str
    originalTitle: str | None = None
    contributor: str | None = None
    image: str = ""
    ingredients: list[str] = []
    preparation: str = ""
    servingSize: int | None = None
    estimatedCost: float | None = None
    status: str = "published"
    translations: list[Translation] = []
    adaptations: list[Adaptation] = []


class NewAdaptation(BaseModel):
    destinationCountry: str = Field(min_length=2, max_length=2)
    title: str = Field(min_length=1)
    adaptationType: str | None = None
    ingredients: list[str] = []
    availability: str | None = None
    estimatedLocalCost: float | None = None
    servingSize: int | None = None
    contributor: str | None = None
    notes: str | None = None


class Comment(BaseModel):
    id: str
    recipeId: str
    author: str = "Anonymous"
    text: str
    createdAt: str = Field(default_factory=_utcnow)


class NewComment(BaseModel):
    text: str = Field(min_length=1)
    author: str | None = None


class Rating(BaseModel):
    average: float = 0
    count: int = 0


class NewRating(BaseModel):
    stars: int = Field(ge=1, le=5)


class NewRecipe(BaseModel):
    name: str = Field(min_length=1)
    cuisine: str = Field(min_length=1)
    country: str = Field(min_length=2, max_length=2)
    category: str | None = None
    originalLanguage: str = "en"
    originalTitle: str | None = None
    contributor: str | None = None
    image: str = ""
    ingredients: list[str] = []
    preparation: str = ""
    servingSize: int | None = None
    estimatedCost: float | None = None
