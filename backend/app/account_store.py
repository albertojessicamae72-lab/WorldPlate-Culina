import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parent.parent / "data" / "culina.sqlite3"
PASSWORD_ITERATIONS = 310_000


@contextmanager
def _connect():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        with connection:
            yield connection
    finally:
        connection.close()


def initialize():
    with _connect() as connection:
        connection.executescript("""
        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE UNIQUE,
            display_name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'budget_cook',
            about TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
            password_salt TEXT NOT NULL DEFAULT '', password_hash TEXT NOT NULL DEFAULT '',
            interests TEXT NOT NULL DEFAULT '[]', avatar_url TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS saved_recipes (
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            recipe_id TEXT NOT NULL, created_at TEXT NOT NULL,
            PRIMARY KEY (account_id, recipe_id)
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token_hash TEXT PRIMARY KEY,
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            recipe_id TEXT NOT NULL,
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            author TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS comments_recipe_created ON comments(recipe_id, created_at);
        CREATE TABLE IF NOT EXISTS recipe_likes (
            recipe_id TEXT NOT NULL, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL, PRIMARY KEY(recipe_id, account_id)
        );
        CREATE TABLE IF NOT EXISTS meal_plans (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            recipe_id TEXT NOT NULL,
            adaptation_country TEXT NOT NULL DEFAULT '',
            planned_for TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS meal_plans_account_date ON meal_plans(account_id, planned_for);
        CREATE TABLE IF NOT EXISTS local_tips (
            id TEXT PRIMARY KEY, recipe_id TEXT NOT NULL, country_code TEXT NOT NULL,
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            text TEXT NOT NULL, created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS local_tips_recipe ON local_tips(recipe_id, country_code, created_at);
        CREATE TABLE IF NOT EXISTS recipe_contributions (
            recipe_id TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            data TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS adaptation_contributions (
            recipe_id TEXT NOT NULL,
            country_code TEXT NOT NULL,
            owner_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            data TEXT NOT NULL,
            created_at TEXT NOT NULL,
            PRIMARY KEY (recipe_id, country_code)
        );
        CREATE TABLE IF NOT EXISTS community_tip_settings (
            recipe_id TEXT NOT NULL, country_code TEXT NOT NULL DEFAULT '',
            enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0, 1)),
            PRIMARY KEY(recipe_id, country_code)
        );
        CREATE TABLE IF NOT EXISTS local_tip_votes (
            tip_id TEXT NOT NULL REFERENCES local_tips(id) ON DELETE CASCADE,
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            value INTEGER NOT NULL CHECK(value IN (-1, 1)), PRIMARY KEY(tip_id, account_id)
        );
        CREATE TABLE IF NOT EXISTS friendships (
            requester_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            addressee_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            status TEXT NOT NULL CHECK(status IN ('pending', 'accepted')),
            created_at TEXT NOT NULL, PRIMARY KEY(requester_id, addressee_id),
            CHECK(requester_id != addressee_id)
        );
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY, account_a TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            account_b TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL, UNIQUE(account_a, account_b), CHECK(account_a < account_b)
        );
        CREATE TABLE IF NOT EXISTS hidden_conversations (
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            PRIMARY KEY(account_id, conversation_id)
        );
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            sender_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            body TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS messages_conversation_created
            ON messages(conversation_id, created_at DESC, id DESC);
        CREATE TABLE IF NOT EXISTS avatar_retirements (
            url TEXT PRIMARY KEY, delete_after TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recovery_attempts (
            username_hash TEXT PRIMARY KEY,
            failures INTEGER NOT NULL,
            window_started TEXT NOT NULL,
            locked_until TEXT NOT NULL DEFAULT ''
        );
        """)
        columns = {row["name"] for row in connection.execute("PRAGMA table_info(accounts)")}
        if "password_salt" not in columns:
            connection.execute("ALTER TABLE accounts ADD COLUMN password_salt TEXT NOT NULL DEFAULT ''")
        if "password_hash" not in columns:
            connection.execute("ALTER TABLE accounts ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''")
        if "interests" not in columns:
            connection.execute("ALTER TABLE accounts ADD COLUMN interests TEXT NOT NULL DEFAULT '[]'")
        if "avatar_url" not in columns:
            connection.execute("ALTER TABLE accounts ADD COLUMN avatar_url TEXT NOT NULL DEFAULT ''")
        for column, definition in (
            ("recovery_question", "TEXT NOT NULL DEFAULT ''"),
            ("recovery_salt", "TEXT NOT NULL DEFAULT ''"),
            ("recovery_hash", "TEXT NOT NULL DEFAULT ''"),
        ):
            if column not in columns:
                connection.execute(f"ALTER TABLE accounts ADD COLUMN {column} {definition}")


def save_recipe_contribution(recipe_id: str, owner_id: str, data: dict) -> None:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with _connect() as connection:
        connection.execute(
            """INSERT INTO recipe_contributions (recipe_id, owner_id, data, created_at)
            VALUES (?, ?, ?, ?) ON CONFLICT(recipe_id) DO UPDATE SET
            owner_id=excluded.owner_id, data=excluded.data""",
            (recipe_id, owner_id, json.dumps(data, ensure_ascii=False), now),
        )


def list_recipe_contributions() -> list[dict]:
    with _connect() as connection:
        rows = connection.execute(
            "SELECT data FROM recipe_contributions ORDER BY created_at, recipe_id"
        ).fetchall()
        return [json.loads(row["data"]) for row in rows]


def delete_recipe_contribution(recipe_id: str) -> None:
    with _connect() as connection:
        connection.execute(
            "DELETE FROM adaptation_contributions WHERE recipe_id=?", (recipe_id,)
        )
        connection.execute(
            "DELETE FROM recipe_contributions WHERE recipe_id=?", (recipe_id,)
        )


def save_adaptation_contribution(
    recipe_id: str, country_code: str, owner_id: str, data: dict
) -> None:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with _connect() as connection:
        connection.execute(
            """INSERT INTO adaptation_contributions
            (recipe_id, country_code, owner_id, data, created_at)
            VALUES (?, ?, ?, ?, ?) ON CONFLICT(recipe_id, country_code)
            DO UPDATE SET owner_id=excluded.owner_id, data=excluded.data""",
            (
                recipe_id,
                country_code.upper(),
                owner_id,
                json.dumps(data, ensure_ascii=False),
                now,
            ),
        )


def list_adaptation_contributions() -> list[dict]:
    with _connect() as connection:
        rows = connection.execute(
            """SELECT recipe_id, country_code, data FROM adaptation_contributions
            ORDER BY created_at, recipe_id, country_code"""
        ).fetchall()
        return [
            {
                "recipeId": row["recipe_id"],
                "countryCode": row["country_code"],
                "data": json.loads(row["data"]),
            }
            for row in rows
        ]


def delete_adaptation_contribution(recipe_id: str, country_code: str) -> None:
    with _connect() as connection:
        connection.execute(
            "DELETE FROM adaptation_contributions WHERE recipe_id=? AND country_code=?",
            (recipe_id, country_code.upper()),
        )


def _account(row):
    return {"id": row["id"], "username": row["username"], "displayName": row["display_name"],
            "role": row["role"], "about": row["about"], "interests": json.loads(row["interests"] or "[]"),
            "avatarUrl": row["avatar_url"] if "avatar_url" in row.keys() else "",
            "createdAt": row["created_at"]}


def _handle_base(display_name: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "", display_name.casefold())
    return normalized[:24] or "cook"


def _password_hash(password: str, salt: bytes) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PASSWORD_ITERATIONS).hex()


def _new_session(connection, account_id: str):
    token = secrets.token_urlsafe(36)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    connection.execute("INSERT INTO sessions VALUES (?, ?, ?)",
                       (token_hash, account_id, datetime.now(timezone.utc).isoformat(timespec="seconds")))
    return token


def _recovery_hash(answer: str, salt: bytes) -> str:
    normalized = " ".join(answer.split()).casefold()
    return hashlib.pbkdf2_hmac("sha256", normalized.encode(), salt, PASSWORD_ITERATIONS).hex()


def create_account(
    display_name: str,
    password: str,
    interests: list[str] | None = None,
    recovery_question: str = "",
    recovery_answer: str = "",
):
    display_name = display_name.strip()
    base = _handle_base(display_name)
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    salt = os.urandom(16)
    recovery_salt = os.urandom(16)
    with _connect() as connection:
        username = base
        suffix = 123
        while connection.execute("SELECT 1 FROM accounts WHERE username = ? COLLATE NOCASE", (username,)).fetchone():
            username = f"{base}{suffix}"
            suffix += 1
        account_id = str(uuid.uuid4())
        connection.execute("""INSERT INTO accounts
            (id, username, display_name, created_at, password_salt, password_hash, interests,
             recovery_question, recovery_salt, recovery_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (account_id, username, display_name, now, salt.hex(), _password_hash(password, salt),
             json.dumps(interests or []), recovery_question, recovery_salt.hex(),
             _recovery_hash(recovery_answer, recovery_salt)))
        row = connection.execute("SELECT * FROM accounts WHERE id = ?", (account_id,)).fetchone()
        return {"account": _account(row), "token": _new_session(connection, account_id)}


def recover_password(username: str, question: str, answer: str, new_password: str) -> bool:
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat(timespec="seconds")
    username_hash = hashlib.sha256(username.strip().casefold().encode()).hexdigest()
    with _connect() as connection:
        connection.execute(
            "DELETE FROM recovery_attempts WHERE window_started < ?",
            ((now - timedelta(days=1)).isoformat(timespec="seconds"),),
        )
        attempt = connection.execute(
            "SELECT * FROM recovery_attempts WHERE username_hash = ?", (username_hash,)
        ).fetchone()
        if attempt and attempt["locked_until"] and attempt["locked_until"] > now_iso:
            return False

        row = connection.execute(
            "SELECT id, recovery_question, recovery_salt, recovery_hash FROM accounts "
            "WHERE username = ? COLLATE NOCASE",
            (username.strip(),),
        ).fetchone()
        valid = False
        if row and row["recovery_question"] and row["recovery_salt"] and row["recovery_hash"]:
            salt = bytes.fromhex(row["recovery_salt"])
            valid = (
                hmac.compare_digest(row["recovery_question"], question)
                and hmac.compare_digest(_recovery_hash(answer, salt), row["recovery_hash"])
            )
        else:
            # Keep unknown and legacy accounts from returning immediately.
            _recovery_hash(answer, bytes(16))

        if valid:
            salt = os.urandom(16)
            connection.execute(
                "UPDATE accounts SET password_salt = ?, password_hash = ? WHERE id = ?",
                (salt.hex(), _password_hash(new_password, salt), row["id"]),
            )
            connection.execute("DELETE FROM sessions WHERE account_id = ?", (row["id"],))
            connection.execute("DELETE FROM recovery_attempts WHERE username_hash = ?", (username_hash,))
            return True

        window_started = now_iso
        failures = 1
        if attempt and (now - datetime.fromisoformat(attempt["window_started"])) < timedelta(minutes=15):
            window_started = attempt["window_started"]
            failures = attempt["failures"] + 1
        locked_until = (
            (now + timedelta(minutes=15)).isoformat(timespec="seconds")
            if failures >= 5 else ""
        )
        connection.execute(
            """INSERT INTO recovery_attempts (username_hash, failures, window_started, locked_until)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(username_hash) DO UPDATE SET
               failures = excluded.failures, window_started = excluded.window_started,
               locked_until = excluded.locked_until""",
            (username_hash, failures, window_started, locked_until),
        )
    return False


def get_account(username: str):
    with _connect() as connection:
        row = connection.execute("SELECT * FROM accounts WHERE username = ? COLLATE NOCASE", (username.strip(),)).fetchone()
        return _account(row) if row else None


def search_accounts(query: str, exclude_account_id: str, limit: int = 20):
    term = query.strip()
    if not term:
        return []
    pattern = f"%{term}%"
    with _connect() as connection:
        rows = connection.execute(
            """SELECT id, username, display_name, role, about, interests, avatar_url
               FROM accounts WHERE id != ? AND (display_name LIKE ? COLLATE NOCASE
               OR username LIKE ? COLLATE NOCASE) ORDER BY display_name COLLATE NOCASE LIMIT ?""",
            (exclude_account_id, pattern, pattern, limit),
        ).fetchall()
        return [{"id": row["id"], "username": row["username"],
                 "displayName": row["display_name"], "role": row["role"],
                 "about": row["about"], "interests": json.loads(row["interests"] or "[]"),
                 "avatarUrl": row["avatar_url"]}
                for row in rows]


def get_public_account(username: str):
    with _connect() as connection:
        row = connection.execute(
            "SELECT id, username, display_name, role, about, interests, avatar_url FROM accounts WHERE username = ? COLLATE NOCASE",
            (username.strip(),),
        ).fetchone()
        if not row:
            return None
        return {"id": row["id"], "username": row["username"], "displayName": row["display_name"],
                "role": row["role"], "about": row["about"],
                "interests": json.loads(row["interests"] or "[]"), "avatarUrl": row["avatar_url"]}


def get_public_accounts_by_ids(account_ids: list[str]):
    unique_ids = list(dict.fromkeys(account_ids))
    if not unique_ids:
        return []
    placeholders = ",".join("?" for _ in unique_ids)
    with _connect() as connection:
        rows = connection.execute(
            f"SELECT id, username, display_name FROM accounts WHERE id IN ({placeholders})",
            unique_ids,
        ).fetchall()
        profiles = {row["id"]: {"id": row["id"], "username": row["username"],
                                 "displayName": row["display_name"]} for row in rows}
        missing = [account_id for account_id in unique_ids if account_id not in profiles]
        if missing:
            raise ValueError("One or more selected collaborators could not be found.")
        return [profiles[account_id] for account_id in unique_ids]


def is_legacy_account(username: str) -> bool:
    with _connect() as connection:
        row = connection.execute(
            "SELECT password_hash FROM accounts WHERE username = ? COLLATE NOCASE", (username.strip(),)
        ).fetchone()
        return bool(row and not row["password_hash"])


def set_legacy_password(username: str, password: str) -> bool:
    salt = os.urandom(16)
    with _connect() as connection:
        cursor = connection.execute(
            "UPDATE accounts SET password_salt = ?, password_hash = ? WHERE username = ? COLLATE NOCASE AND password_hash = ''",
            (salt.hex(), _password_hash(password, salt), username.strip()),
        )
        return cursor.rowcount == 1


def authenticate(username: str, password: str):
    with _connect() as connection:
        row = connection.execute("SELECT * FROM accounts WHERE username = ? COLLATE NOCASE", (username.strip(),)).fetchone()
        if not row:
            return None
        # Never let someone claim a legacy passwordless username by guessing it.
        if not row["password_salt"] or not row["password_hash"]:
            return None
        salt = bytes.fromhex(row["password_salt"])
        if not hmac.compare_digest(_password_hash(password, salt), row["password_hash"]):
            return None
        return {"account": _account(row), "token": _new_session(connection, row["id"])}


def create_or_continue(display_name: str, password: str, interests: list[str] | None = None):
    account = get_account(display_name)
    if account:
        result = authenticate(account["username"], password)
        return ({**result, "created": False} if result else None)
    result = create_account(display_name, password, interests)
    return {**result, "created": True}


def account_for_token(token: str):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with _connect() as connection:
        row = connection.execute("""SELECT a.* FROM sessions s JOIN accounts a ON a.id = s.account_id
            WHERE s.token_hash = ?""", (token_hash,)).fetchone()
        return _account(row) if row else None


def revoke_token(token: str):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with _connect() as connection:
        connection.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))


def update_account(username: str, display_name: str, role: str, about: str, avatar_url: str = ""):
    with _connect() as connection:
        existing = connection.execute("SELECT avatar_url FROM accounts WHERE username = ? COLLATE NOCASE", (username.strip(),)).fetchone()
        old_avatar = (existing["avatar_url"] or "") if existing else ""
        next_avatar = avatar_url.strip()
        if old_avatar.startswith("/api/uploads/") and old_avatar != next_avatar:
            delete_after = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(timespec="seconds")
            connection.execute("INSERT INTO avatar_retirements (url, delete_after) VALUES (?, ?) ON CONFLICT(url) DO UPDATE SET delete_after=excluded.delete_after", (old_avatar, delete_after))
        connection.execute("UPDATE accounts SET display_name = ?, role = ?, about = ?, avatar_url = ? WHERE username = ? COLLATE NOCASE",
                           (display_name.strip(), role, about.strip(), next_avatar, username.strip()))
        row = connection.execute("SELECT * FROM accounts WHERE username = ? COLLATE NOCASE", (username.strip(),)).fetchone()
        return _account(row) if row else None


def list_saved_recipes(username: str):
    with _connect() as connection:
        account = connection.execute("SELECT id FROM accounts WHERE username = ? COLLATE NOCASE", (username.strip(),)).fetchone()
        if not account:
            return None
        return [row["recipe_id"] for row in connection.execute("SELECT recipe_id FROM saved_recipes WHERE account_id = ? ORDER BY created_at DESC", (account["id"],))]


def toggle_saved_recipe(username: str, recipe_id: str):
    with _connect() as connection:
        account = connection.execute("SELECT id FROM accounts WHERE username = ? COLLATE NOCASE", (username.strip(),)).fetchone()
        if not account:
            return None
        existing = connection.execute("SELECT 1 FROM saved_recipes WHERE account_id = ? AND recipe_id = ?", (account["id"], recipe_id)).fetchone()
        if existing:
            connection.execute("DELETE FROM saved_recipes WHERE account_id = ? AND recipe_id = ?", (account["id"], recipe_id))
        else:
            connection.execute("INSERT INTO saved_recipes (account_id, recipe_id, created_at) VALUES (?, ?, ?)",
                (account["id"], recipe_id, datetime.now(timezone.utc).isoformat(timespec="seconds")))
        return [row["recipe_id"] for row in connection.execute("SELECT recipe_id FROM saved_recipes WHERE account_id = ? ORDER BY created_at DESC", (account["id"],))]


def list_comments(recipe_id: str):
    with _connect() as connection:
        rows = connection.execute(
            "SELECT c.id, c.recipe_id, c.account_id, c.author, c.text, c.created_at, a.username, a.avatar_url FROM comments c JOIN accounts a ON a.id = c.account_id WHERE c.recipe_id = ? ORDER BY c.created_at ASC",
            (recipe_id,),
        ).fetchall()
        return [{"id": row["id"], "recipeId": row["recipe_id"], "userId": row["account_id"],
                 "username": row["username"], "avatarUrl": row["avatar_url"], "author": row["author"],
                 "text": row["text"], "createdAt": row["created_at"]} for row in rows]


def create_comment(recipe_id: str, account: dict, text: str):
    comment_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    author = f"@{account['username']}"
    with _connect() as connection:
        connection.execute(
            "INSERT INTO comments (id, recipe_id, account_id, author, text, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (comment_id, recipe_id, account["id"], author, text.strip(), created_at),
        )
    return {"id": comment_id, "recipeId": recipe_id, "userId": account["id"],
            "username": account["username"], "avatarUrl": account.get("avatarUrl", ""),
            "author": author, "text": text.strip(), "createdAt": created_at}


def delete_comment(recipe_id: str, comment_id: str, account_id: str):
    with _connect() as connection:
        row = connection.execute("SELECT account_id FROM comments WHERE id = ? AND recipe_id = ?", (comment_id, recipe_id)).fetchone()
        if not row:
            return None
        if row["account_id"] != account_id:
            return False
        connection.execute("DELETE FROM comments WHERE id = ?", (comment_id,))
        return True


def get_recipe_like_status(recipe_id: str, account_id: str):
    with _connect() as connection:
        count = connection.execute("SELECT COUNT(*) AS total FROM recipe_likes WHERE recipe_id=?", (recipe_id,)).fetchone()["total"]
        liked = connection.execute("SELECT 1 FROM recipe_likes WHERE recipe_id=? AND account_id=?", (recipe_id, account_id)).fetchone()
        return {"liked": bool(liked), "count": count}


def toggle_recipe_like(recipe_id: str, account_id: str):
    with _connect() as connection:
        exists = connection.execute("SELECT 1 FROM recipe_likes WHERE recipe_id=? AND account_id=?", (recipe_id, account_id)).fetchone()
        if exists:
            connection.execute("DELETE FROM recipe_likes WHERE recipe_id=? AND account_id=?", (recipe_id, account_id))
        else:
            connection.execute("INSERT INTO recipe_likes VALUES (?, ?, ?)", (recipe_id, account_id, datetime.now(timezone.utc).isoformat(timespec="seconds")))
        count = connection.execute("SELECT COUNT(*) AS total FROM recipe_likes WHERE recipe_id=?", (recipe_id,)).fetchone()["total"]
        return {"liked": not bool(exists), "count": count}


def list_recipe_likers(recipe_id: str):
    with _connect() as connection:
        rows = connection.execute("""SELECT a.id,a.username,a.display_name,a.avatar_url FROM recipe_likes l
            JOIN accounts a ON a.id=l.account_id WHERE l.recipe_id=? ORDER BY l.created_at DESC""", (recipe_id,)).fetchall()
        return [{"id": row["id"], "username": row["username"], "displayName": row["display_name"], "avatarUrl": row["avatar_url"]} for row in rows]


def cleanup_expired_avatars(now: datetime | None = None):
    now_iso = (now or datetime.now(timezone.utc)).isoformat(timespec="seconds")
    upload_dir = Path(__file__).resolve().parent.parent / "uploads"
    removed = 0
    with _connect() as connection:
        rows = connection.execute("SELECT url FROM avatar_retirements WHERE delete_after <= ?", (now_iso,)).fetchall()
        for row in rows:
            url = row["url"]
            referenced = connection.execute("SELECT 1 FROM accounts WHERE avatar_url=? LIMIT 1", (url,)).fetchone()
            filename = url.removeprefix("/api/uploads/")
            if not referenced and filename and Path(filename).name == filename:
                try:
                    (upload_dir / filename).unlink(missing_ok=True)
                    removed += 1
                except OSError:
                    continue
            connection.execute("DELETE FROM avatar_retirements WHERE url=?", (url,))
    return removed


def list_meal_plans(account_id: str):
    with _connect() as connection:
        rows = connection.execute(
            "SELECT id, recipe_id, adaptation_country, planned_for, note, created_at FROM meal_plans WHERE account_id = ? ORDER BY planned_for, created_at",
            (account_id,),
        ).fetchall()
        return [{"id": row["id"], "recipeId": row["recipe_id"],
                 "adaptationCountry": row["adaptation_country"] or None,
                 "plannedFor": row["planned_for"], "note": row["note"],
                 "createdAt": row["created_at"]} for row in rows]


def create_meal_plan(account_id: str, recipe_id: str, adaptation_country: str | None, planned_for: str, note: str):
    plan_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with _connect() as connection:
        connection.execute(
            "INSERT INTO meal_plans (id, account_id, recipe_id, adaptation_country, planned_for, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (plan_id, account_id, recipe_id, adaptation_country or "", planned_for, note.strip(), created_at),
        )
    return {"id": plan_id, "recipeId": recipe_id, "adaptationCountry": adaptation_country,
            "plannedFor": planned_for, "note": note.strip(), "createdAt": created_at}


def delete_meal_plan(account_id: str, plan_id: str):
    with _connect() as connection:
        cursor = connection.execute("DELETE FROM meal_plans WHERE id = ? AND account_id = ?", (plan_id, account_id))
        return cursor.rowcount == 1


def count_meal_plan_users(recipe_id: str, adaptation_country: str | None = None):
    with _connect() as connection:
        row = connection.execute(
            "SELECT COUNT(DISTINCT account_id) AS total FROM meal_plans WHERE recipe_id = ? AND adaptation_country = ?",
            (recipe_id, (adaptation_country or "").upper()),
        ).fetchone()
        return row["total"]


def community_tips_enabled(recipe_id: str, country_code: str = "") -> bool:
    with _connect() as connection:
        row = connection.execute(
            "SELECT enabled FROM community_tip_settings WHERE recipe_id=? AND country_code=?",
            (recipe_id, country_code.upper()),
        ).fetchone()
        return bool(row["enabled"]) if row else False


def set_community_tips_enabled(recipe_id: str, country_code: str, enabled: bool) -> None:
    with _connect() as connection:
        connection.execute(
            """INSERT INTO community_tip_settings (recipe_id, country_code, enabled)
            VALUES (?, ?, ?) ON CONFLICT(recipe_id, country_code)
            DO UPDATE SET enabled=excluded.enabled""",
            (recipe_id, country_code.upper(), int(enabled)),
        )


def list_local_tips(
    recipe_id: str,
    country_code: str,
    account_id: str,
    limit: int = 8,
    offset: int = 0,
):
    with _connect() as connection:
        rows = connection.execute("""SELECT t.id, t.recipe_id, t.country_code, t.account_id, t.text, t.created_at,
            a.username, a.avatar_url, COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
            COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) AS downvotes,
            MAX(CASE WHEN v.account_id = ? THEN v.value ELSE 0 END) AS my_vote
            FROM local_tips t JOIN accounts a ON a.id = t.account_id
            LEFT JOIN local_tip_votes v ON v.tip_id = t.id
            WHERE t.recipe_id = ? AND t.country_code = ?
            GROUP BY t.id ORDER BY upvotes DESC, t.created_at DESC, t.id DESC
            LIMIT ? OFFSET ?""",
            (account_id, recipe_id, country_code.upper(), limit + 1, offset)).fetchall()
        return {
            "items": [_tip(row) for row in rows[:limit]],
            "hasMore": len(rows) > limit,
        }


def list_account_tips(account_id: str):
    with _connect() as connection:
        rows = connection.execute("""SELECT t.id, t.recipe_id, t.country_code, t.text, t.created_at,
            COUNT(v.account_id) AS helpful_votes
            FROM local_tips t LEFT JOIN local_tip_votes v ON v.tip_id=t.id AND v.value=1
            WHERE t.account_id=? GROUP BY t.id
            ORDER BY helpful_votes DESC, t.created_at DESC, t.id DESC""", (account_id,)).fetchall()
        return [{"id": row["id"], "recipeId": row["recipe_id"], "destinationCountry": row["country_code"],
                 "text": row["text"], "helpfulVotes": row["helpful_votes"],
                 "createdAt": row["created_at"]} for row in rows]


def _tip(row):
    up, down, my = row["upvotes"], row["downvotes"], row["my_vote"]
    return {"id": row["id"], "recipeId": row["recipe_id"], "destinationCountry": row["country_code"],
            "userId": row["account_id"],
            "text": row["text"], "author": "@" + row["username"], "username": row["username"],
            "avatarUrl": row["avatar_url"], "upvotes": up, "downvotes": down,
            "votes": up - down, "myVote": my, "helpfulVotes": up,
            "voted": my != 0, "createdAt": row["created_at"]}


def create_local_tip(recipe_id: str, country_code: str, account_id: str, text: str):
    tip_id, now = str(uuid.uuid4()), datetime.now(timezone.utc).isoformat(timespec="seconds")
    with _connect() as connection:
        connection.execute("INSERT INTO local_tips VALUES (?, ?, ?, ?, ?, ?)",
                           (tip_id, recipe_id, country_code.upper(), account_id, text.strip(), now))
        row = connection.execute("""SELECT t.id,t.recipe_id,t.country_code,t.account_id,t.text,t.created_at,a.username,
            a.avatar_url,0 AS upvotes,0 AS downvotes,0 AS my_vote FROM local_tips t JOIN accounts a ON a.id=t.account_id WHERE t.id=?""", (tip_id,)).fetchone()
        return _tip(row)


def update_local_tip(
    tip_id: str, recipe_id: str, country_code: str, account_id: str, text: str
):
    with _connect() as connection:
        cursor = connection.execute(
            """UPDATE local_tips SET text=?
            WHERE id=? AND recipe_id=? AND country_code=? AND account_id=?""",
            (text.strip(), tip_id, recipe_id, country_code.upper(), account_id),
        )
        if cursor.rowcount != 1:
            return None
        return _read_local_tip(connection, tip_id, account_id)


def delete_local_tip(
    tip_id: str, recipe_id: str, country_code: str, account_id: str
):
    with _connect() as connection:
        cursor = connection.execute(
            """DELETE FROM local_tips
            WHERE id=? AND recipe_id=? AND country_code=? AND account_id=?""",
            (tip_id, recipe_id, country_code.upper(), account_id),
        )
        return cursor.rowcount == 1


def _read_local_tip(connection, tip_id: str, account_id: str):
    row = connection.execute(
        """SELECT t.id, t.recipe_id, t.country_code, t.account_id, t.text,
        t.created_at, a.username, a.avatar_url,
        COALESCE(SUM(CASE WHEN v.value=1 THEN 1 ELSE 0 END), 0) AS upvotes,
        COALESCE(SUM(CASE WHEN v.value=-1 THEN 1 ELSE 0 END), 0) AS downvotes,
        COALESCE(MAX(CASE WHEN v.account_id=? THEN v.value ELSE 0 END), 0) AS my_vote
        FROM local_tips t JOIN accounts a ON a.id=t.account_id
        LEFT JOIN local_tip_votes v ON v.tip_id=t.id
        WHERE t.id=? GROUP BY t.id""",
        (account_id, tip_id),
    ).fetchone()
    return _tip(row) if row else None


def vote_local_tip(
    tip_id: str, account_id: str, value: int,
    recipe_id: str, country_code: str,
):
    with _connect() as connection:
        exists = connection.execute(
            """SELECT 1 FROM local_tips
            WHERE id=? AND recipe_id=? AND country_code=? AND account_id != ?""",
            (tip_id, recipe_id, country_code.upper(), account_id),
        ).fetchone()
        if not exists: return None
        current = connection.execute("SELECT value FROM local_tip_votes WHERE tip_id=? AND account_id=?", (tip_id, account_id)).fetchone()
        if current and current["value"] == value:
            connection.execute("DELETE FROM local_tip_votes WHERE tip_id=? AND account_id=?", (tip_id, account_id))
        else:
            connection.execute("INSERT INTO local_tip_votes VALUES (?, ?, ?) ON CONFLICT(tip_id,account_id) DO UPDATE SET value=excluded.value", (tip_id, account_id, value))
        return _read_local_tip(connection, tip_id, account_id)


def discard_local_tips(recipe_id: str, country_code: str | None = None):
    with _connect() as connection:
        if country_code:
            connection.execute("DELETE FROM local_tips WHERE recipe_id=? AND country_code=?", (recipe_id, country_code.upper()))
        else:
            connection.execute("DELETE FROM local_tips WHERE recipe_id=?", (recipe_id,))


def _friend_item(row, account_id):
    peer_id = row["requester_id"] if row["addressee_id"] == account_id else row["addressee_id"]
    direction = "incoming" if row["addressee_id"] == account_id else "outgoing"
    return {"id": peer_id, "username": row["username"], "displayName": row["display_name"],
            "avatarUrl": row["avatar_url"], "status": row["status"], "direction": direction}


def list_friendships(account_id: str):
    with _connect() as connection:
        rows = connection.execute("""SELECT f.*, a.username,a.display_name,a.avatar_url FROM friendships f
            JOIN accounts a ON a.id=CASE WHEN f.requester_id=? THEN f.addressee_id ELSE f.requester_id END
            WHERE f.requester_id=? OR f.addressee_id=? ORDER BY f.created_at DESC""", (account_id, account_id, account_id)).fetchall()
        return [_friend_item(row, account_id) for row in rows]


def request_friend(account_id: str, username: str):
    with _connect() as connection:
        peer = connection.execute("SELECT id FROM accounts WHERE username=? COLLATE NOCASE", (username.strip(),)).fetchone()
        if not peer: return None
        peer_id = peer["id"]
        if peer_id == account_id: return False
        reverse = connection.execute("SELECT status FROM friendships WHERE requester_id=? AND addressee_id=?", (peer_id, account_id)).fetchone()
        if reverse:
            if reverse["status"] == "pending":
                connection.execute("UPDATE friendships SET status='accepted' WHERE requester_id=? AND addressee_id=?", (peer_id, account_id))
            return True
        connection.execute("INSERT OR IGNORE INTO friendships VALUES (?, ?, 'pending', ?)", (account_id, peer_id, datetime.now(timezone.utc).isoformat(timespec="seconds")))
        return True


def accept_friend(account_id: str, peer_username: str):
    with _connect() as connection:
        cursor = connection.execute("""UPDATE friendships SET status='accepted' WHERE addressee_id=? AND status='pending'
            AND requester_id=(SELECT id FROM accounts WHERE username=? COLLATE NOCASE)""", (account_id, peer_username.strip()))
        return cursor.rowcount == 1


def remove_friend(account_id: str, peer_username: str):
    with _connect() as connection:
        peer = connection.execute("SELECT id FROM accounts WHERE username=? COLLATE NOCASE", (peer_username.strip(),)).fetchone()
        if not peer: return False
        cursor = connection.execute("DELETE FROM friendships WHERE (requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)", (account_id, peer["id"], peer["id"], account_id))
        return cursor.rowcount > 0


def _conversation_access(connection, conversation_id, account_id):
    return connection.execute("SELECT * FROM conversations WHERE id=? AND (account_a=? OR account_b=?)", (conversation_id, account_id, account_id)).fetchone()


def _conversation_item(connection, row, account_id):
    peer_id = row["account_b"] if row["account_a"] == account_id else row["account_a"]
    peer = connection.execute("SELECT id,username,display_name,avatar_url FROM accounts WHERE id=?", (peer_id,)).fetchone()
    last = connection.execute(
        "SELECT body,created_at FROM messages WHERE conversation_id=? ORDER BY created_at DESC,id DESC LIMIT 1",
        (row["id"],),
    ).fetchone()
    return {"id": row["id"], "user": {"id": peer["id"], "username": peer["username"], "displayName": peer["display_name"], "avatarUrl": peer["avatar_url"]},
            "lastMessage": last["body"] if last else "", "updatedAt": last["created_at"] if last else row["created_at"]}


def start_conversation(account_id: str, peer_username: str):
    with _connect() as connection:
        peer = connection.execute("SELECT id FROM accounts WHERE username=? COLLATE NOCASE", (peer_username.strip(),)).fetchone()
        if not peer or peer["id"] == account_id: return None
        friendship = connection.execute("SELECT status FROM friendships WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?))", (account_id, peer["id"], peer["id"], account_id)).fetchone()
        if not friendship: return False
        a, b = sorted([account_id, peer["id"]])
        row = connection.execute("SELECT * FROM conversations WHERE account_a=? AND account_b=?", (a,b)).fetchone()
        if not row:
            cid = str(uuid.uuid4()); now = datetime.now(timezone.utc).isoformat(timespec="seconds")
            connection.execute("INSERT INTO conversations VALUES (?, ?, ?, ?)", (cid,a,b,now))
            row = connection.execute("SELECT * FROM conversations WHERE id=?", (cid,)).fetchone()
        connection.execute("DELETE FROM hidden_conversations WHERE account_id=? AND conversation_id=?", (account_id,row["id"]))
        return _conversation_item(connection,row,account_id)


def list_conversations(account_id: str):
    with _connect() as connection:
        rows = connection.execute("""SELECT c.* FROM conversations c LEFT JOIN hidden_conversations h ON h.conversation_id=c.id AND h.account_id=?
            WHERE (c.account_a=? OR c.account_b=?) AND h.conversation_id IS NULL ORDER BY c.created_at DESC""", (account_id,account_id,account_id)).fetchall()
        result = [_conversation_item(connection,row,account_id) for row in rows]
        return sorted(result, key=lambda item: item["updatedAt"], reverse=True)


def list_messages(account_id: str, conversation_id: str, before: str | None = None, limit: int = 100):
    with _connect() as connection:
        if not _conversation_access(connection,conversation_id,account_id): return None
        cursor = None
        if before:
            cursor = connection.execute(
                "SELECT created_at,id FROM messages WHERE conversation_id=? AND id=?",
                (conversation_id,before),
            ).fetchone()
            if not cursor: return False
        query = """SELECT m.id,m.sender_id,m.body,m.created_at,a.username,a.display_name
            FROM messages m JOIN accounts a ON a.id=m.sender_id
            WHERE m.conversation_id=?"""
        params: list = [conversation_id]
        if cursor:
            query += " AND (m.created_at < ? OR (m.created_at = ? AND m.id < ?))"
            params.extend((cursor["created_at"],cursor["created_at"],cursor["id"]))
        query += " ORDER BY m.created_at DESC,m.id DESC LIMIT ?"
        params.append(limit + 1)
        rows = connection.execute(query,params).fetchall()
        has_more = len(rows) > limit
        rows = rows[:limit]
        items = [
            {"id": row["id"],"senderId": row["sender_id"],"username": row["username"],
             "displayName": row["display_name"],"body": row["body"],"createdAt": row["created_at"]}
            for row in reversed(rows)
        ]
        return {"items": items,"hasMore": has_more}


def send_message(account_id: str, conversation_id: str, body: str):
    with _connect() as connection:
        conversation = _conversation_access(connection,conversation_id,account_id)
        if not conversation: return None
        peer = conversation["account_b"] if conversation["account_a"] == account_id else conversation["account_a"]
        friendship = connection.execute("SELECT 1 FROM friendships WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?))", (account_id,peer,peer,account_id)).fetchone()
        if not friendship: return False
        sender = connection.execute("SELECT username,display_name FROM accounts WHERE id=?", (account_id,)).fetchone()
        mid=str(uuid.uuid4()); now=datetime.now(timezone.utc).isoformat(timespec="microseconds")
        message = {"id":mid,"senderId":account_id,"username":sender["username"],"displayName":sender["display_name"],"body":body.strip(),"createdAt":now}
        connection.execute(
            "INSERT INTO messages (id,conversation_id,sender_id,body,created_at) VALUES (?,?,?,?,?)",
            (mid,conversation_id,account_id,message["body"],now),
        )
        connection.execute("DELETE FROM hidden_conversations WHERE conversation_id=?", (conversation_id,))
        return message


def hide_conversation(account_id: str, conversation_id: str):
    with _connect() as connection:
        if not _conversation_access(connection,conversation_id,account_id): return False
        connection.execute("INSERT OR IGNORE INTO hidden_conversations VALUES (?, ?)", (account_id,conversation_id))
        hidden_count = connection.execute("SELECT COUNT(*) AS total FROM hidden_conversations WHERE conversation_id=?", (conversation_id,)).fetchone()["total"]
        if hidden_count >= 2:
            connection.execute("DELETE FROM conversations WHERE id=?", (conversation_id,))
        return True


initialize()
