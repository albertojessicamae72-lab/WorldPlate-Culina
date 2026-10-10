import argparse
import os
import sqlite3
import sys
from pathlib import Path

TABLES_IN_FOREIGN_KEY_ORDER = (
    "accounts",
    "saved_recipes",
    "comments",
    "recipe_likes",
    "meal_plans",
    "local_tips",
    "recipe_contributions",
    "adaptation_contributions",
    "community_tip_settings",
    "local_tip_votes",
    "friendships",
    "conversations",
    "hidden_conversations",
    "messages",
    "avatar_retirements",
    "recovery_attempts",
)


def migrate(source_path: Path, dry_run: bool = False) -> None:
    if not source_path.is_file():
        raise FileNotFoundError(f"SQLite database not found: {source_path}")

    source = sqlite3.connect(source_path)
    source.row_factory = sqlite3.Row
    try:
        source_tables = {
            row["name"]
            for row in source.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }

        if dry_run:
            for table in TABLES_IN_FOREIGN_KEY_ORDER:
                if table in source_tables:
                    count = source.execute(
                        f'SELECT COUNT(*) FROM "{table}"'
                    ).fetchone()[0]
                    print(f"{table}: {count} rows available")
            return

        from app import account_store

        imported = {}
        with account_store._connect() as target:
            if "accounts" in source_tables:
                target_accounts = target.execute(
                    "SELECT id, username FROM accounts"
                ).fetchall()
                target_by_id = {row["id"]: row["username"] for row in target_accounts}
                target_by_username = {
                    row["username"].casefold(): row["id"] for row in target_accounts
                }
                for account in source.execute("SELECT id, username FROM accounts"):
                    existing_username = target_by_id.get(account["id"])
                    existing_id = target_by_username.get(account["username"].casefold())
                    if (
                        existing_username is not None
                        and existing_username.casefold() != account["username"].casefold()
                    ) or (existing_id is not None and existing_id != account["id"]):
                        raise RuntimeError(
                            "A source account ID or username conflicts with a different "
                            "account already in PostgreSQL. No records were imported."
                        )

            for table in TABLES_IN_FOREIGN_KEY_ORDER:
                if table not in source_tables:
                    continue

                columns = [
                    row["name"]
                    for row in source.execute(f'PRAGMA table_info("{table}")')
                ]
                if not columns:
                    continue
                column_sql = ", ".join(f'"{column}"' for column in columns)
                placeholders = ", ".join("?" for _ in columns)
                insert_sql = (
                    f'INSERT INTO "{table}" ({column_sql}) VALUES ({placeholders}) '
                    "ON CONFLICT DO NOTHING"
                )
                cursor = source.execute(f'SELECT * FROM "{table}"')
                before = target.execute(
                    f'SELECT COUNT(*) AS total FROM "{table}"'
                ).fetchone()["total"]
                while batch := cursor.fetchmany(500):
                    target.executemany(insert_sql, [tuple(row) for row in batch])
                after = target.execute(
                    f'SELECT COUNT(*) AS total FROM "{table}"'
                ).fetchone()["total"]
                imported[table] = after - before

        for table, count in imported.items():
            print(f"{table}: imported {count} rows")
    finally:
        source.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Copy Culina SQLite records to the PostgreSQL database in DATABASE_URL."
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=Path(__file__).resolve().parent / "data" / "culina.sqlite3",
        help="SQLite file to copy (defaults to backend/data/culina.sqlite3)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only count source records; do not write to PostgreSQL",
    )
    args = parser.parse_args()
    if not args.dry_run and not os.environ.get("DATABASE_URL", "").strip():
        raise SystemExit(
            "Set DATABASE_URL to the Render PostgreSQL connection string before running this script."
        )
    migrate(args.source, dry_run=args.dry_run)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Migration failed: {error}", file=sys.stderr)
        raise
