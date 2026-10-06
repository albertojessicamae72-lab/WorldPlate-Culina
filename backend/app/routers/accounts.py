from typing import Literal
from datetime import date

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field, field_validator

from .. import account_store

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


class AccountCreate(BaseModel):
    displayName: str = Field(min_length=1, max_length=60)
    password: str = Field(min_length=8, max_length=128)
    recoveryQuestion: Literal["favorite_color", "favorite_animal"]
    recoveryAnswer: str = Field(min_length=1, max_length=80)
    interests: list[Literal["student", "he_student", "share_recipes", "adapt_recipes", "nearby_restaurants", "budget_meals"]] = Field(default_factory=list, max_length=6)

    @field_validator("recoveryAnswer")
    @classmethod
    def trim_recovery_answer(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Please enter a recovery answer")
        return value

    @field_validator("displayName")
    @classmethod
    def trim_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Please enter a name")
        return value


class AccountContinue(BaseModel):
    displayName: str = Field(min_length=1, max_length=60)
    password: str = Field(min_length=8, max_length=128)


class AccountLogin(BaseModel):
    username: str = Field(min_length=1, max_length=40)
    password: str = Field(min_length=8, max_length=128)


class AccountRecovery(BaseModel):
    username: str = Field(min_length=1, max_length=40)
    recoveryQuestion: Literal["favorite_color", "favorite_animal"]
    recoveryAnswer: str = Field(min_length=1, max_length=80)
    newPassword: str = Field(min_length=8, max_length=128)

    @field_validator("recoveryAnswer")
    @classmethod
    def trim_recovery_answer(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Please enter a recovery answer")
        return value



class AccountUpdate(BaseModel):
    displayName: str = Field(min_length=1, max_length=60)
    role: Literal["budget_cook", "recipe_contributor"] = "budget_cook"
    about: str = Field(default="", max_length=240)
    avatarUrl: str = Field(default="", max_length=500)

    @field_validator("displayName")
    @classmethod
    def trim_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Please enter a name")
        return value


class MealPlanCreate(BaseModel):
    recipeId: str = Field(min_length=1, max_length=160)
    adaptationCountry: str | None = Field(default=None, min_length=2, max_length=2)
    plannedFor: date
    note: str = Field(default="", max_length=500)


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)

    @field_validator("body")
    @classmethod
    def trim_body(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty")
        return value


class ConversationCreate(BaseModel):
    username: str = Field(min_length=1, max_length=40)


def current_account(authorization: str | None = Header(default=None)):
    scheme, _, token = (authorization or "").partition(" ")
    account = account_store.account_for_token(token) if scheme.lower() == "bearer" and token else None
    if not account:
        raise HTTPException(status_code=401, detail="Please log in to continue.")
    return account


def owned_account(username: str, account=Depends(current_account)):
    if account["username"].casefold() != username.casefold():
        raise HTTPException(status_code=403, detail="You can only access your own profile.")
    return account


@router.post("/register", status_code=201)
def register_account(payload: AccountCreate):
    return account_store.create_account(
        payload.displayName,
        payload.password,
        payload.interests,
        payload.recoveryQuestion,
        payload.recoveryAnswer,
    )

@router.post("/continue")
def continue_account(payload: AccountContinue):
    if not account_store.get_account(payload.displayName):
        raise HTTPException(status_code=404, detail="We couldn't find that account. Create an account to get started.")
    result = account_store.authenticate(payload.displayName, payload.password)
    if not result:
        if account_store.is_legacy_account(payload.displayName):
            raise HTTPException(status_code=409, detail="This older profile has no password yet. Ask the app owner to reset its password to keep using its saved profile.")
        raise HTTPException(status_code=401, detail="That name already has an account. Enter its password or choose another name.")
    return result


@router.post("/recover-password")
def recover_password(payload: AccountRecovery):
    account_store.recover_password(
        payload.username,
        payload.recoveryQuestion,
        payload.recoveryAnswer,
        payload.newPassword,
    )
    return {
        "message": "If the recovery details match, the password has been reset. Try signing in with the new password."
    }


@router.post("/login")
def login_account(payload: AccountLogin):
    result = account_store.authenticate(payload.username, payload.password)
    if not result:
        if account_store.is_legacy_account(payload.username):
            raise HTTPException(status_code=409, detail="This older profile has no password yet. Ask the app owner to reset its password to keep using its saved profile.")
        raise HTTPException(status_code=401, detail="Username or password is incorrect.")
    return result


@router.get("/search")
def search_accounts(q: str = "", account=Depends(current_account)):
    return account_store.search_accounts(q[:60], account["id"])


@router.get("/friends")
def get_friends(account=Depends(current_account)):
    return account_store.list_friendships(account["id"])


@router.post("/friends/{username}", status_code=201)
def add_friend(username: str, account=Depends(current_account)):
    result = account_store.request_friend(account["id"], username)
    if result is None: raise HTTPException(status_code=404, detail="Account not found")
    if result is False: raise HTTPException(status_code=400, detail="You cannot add yourself")
    return {"ok": True}


@router.post("/friends/{username}/accept")
def accept_friend(username: str, account=Depends(current_account)):
    if not account_store.accept_friend(account["id"], username):
        raise HTTPException(status_code=404, detail="Friend request not found")
    return {"ok": True}


@router.delete("/friends/{username}", status_code=204)
def delete_friend(username: str, account=Depends(current_account)):
    if not account_store.remove_friend(account["id"], username):
        raise HTTPException(status_code=404, detail="Friend not found")


@router.get("/conversations")
def get_conversations(account=Depends(current_account)):
    return account_store.list_conversations(account["id"])


@router.post("/conversations", status_code=201)
def create_conversation(payload: ConversationCreate, account=Depends(current_account)):
    result = account_store.start_conversation(account["id"], payload.username)
    if result is None: raise HTTPException(status_code=404, detail="Account not found")
    if result is False: raise HTTPException(status_code=403, detail="You need to be friends before you can start a chat")
    return result


@router.get("/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str, account=Depends(current_account)):
    result = account_store.list_messages(account["id"], conversation_id)
    if result is None: raise HTTPException(status_code=404, detail="Conversation not found")
    return result


@router.post("/conversations/{conversation_id}/messages", status_code=201)
def post_message(conversation_id: str, payload: MessageCreate, account=Depends(current_account)):
    result = account_store.send_message(account["id"], conversation_id, payload.body)
    if result is None: raise HTTPException(status_code=404, detail="Conversation not found")
    if result is False: raise HTTPException(status_code=403, detail="You need to be friends to send messages")
    return result


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: str, account=Depends(current_account)):
    if not account_store.hide_conversation(account["id"], conversation_id):
        raise HTTPException(status_code=404, detail="Conversation not found")


@router.get("/meal-plan-count/{recipe_id}")
def meal_plan_count(recipe_id: str, adaptationCountry: str = "", _account=Depends(current_account)):
    if adaptationCountry and len(adaptationCountry) != 2:
        raise HTTPException(status_code=422, detail="Country code must have two letters")
    return {"count": account_store.count_meal_plan_users(recipe_id, adaptationCountry)}


@router.get("/public/{username}/tips")
def get_public_tips(username: str, _account=Depends(current_account)):
    profile = account_store.get_account(username)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return account_store.list_account_tips(profile["id"])


@router.get("/public/{username}")
def read_public_account(username: str, _account=Depends(current_account)):
    profile = account_store.get_public_account(username)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.post("/logout", status_code=204)
def logout_account(authorization: str | None = Header(default=None), _account=Depends(current_account)):
    _, _, token = (authorization or "").partition(" ")
    account_store.revoke_token(token)


@router.get("/{username}")
def read_account(username: str, account=Depends(owned_account)):
    return account


@router.patch("/{username}")
def edit_account(username: str, payload: AccountUpdate, account=Depends(owned_account)):
    updated = account_store.update_account(username, payload.displayName, payload.role, payload.about, payload.avatarUrl)
    if not updated:
        raise HTTPException(status_code=404, detail="Profile not found")
    return updated


@router.get("/{username}/saved")
def get_saved_recipes(username: str, account=Depends(owned_account)):
    saved = account_store.list_saved_recipes(username)
    if saved is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"recipeIds": saved}


@router.post("/{username}/saved/{recipe_id}/toggle")
def toggle_saved_recipe(username: str, recipe_id: str, account=Depends(owned_account)):
    saved = account_store.toggle_saved_recipe(username, recipe_id)
    if saved is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"recipeIds": saved}


@router.get("/{username}/meal-plans")
def get_meal_plans(username: str, account=Depends(owned_account)):
    return account_store.list_meal_plans(account["id"])


@router.post("/{username}/meal-plans", status_code=201)
def add_meal_plan(username: str, payload: MealPlanCreate, account=Depends(owned_account)):
    return account_store.create_meal_plan(account["id"], payload.recipeId,
        payload.adaptationCountry.upper() if payload.adaptationCountry else None,
        payload.plannedFor.isoformat(), payload.note)


@router.delete("/{username}/meal-plans/{plan_id}", status_code=204)
def remove_meal_plan(username: str, plan_id: str, account=Depends(owned_account)):
    if not account_store.delete_meal_plan(account["id"], plan_id):
        raise HTTPException(status_code=404, detail="Meal plan not found")
