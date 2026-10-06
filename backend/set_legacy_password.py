"""Let the local app owner upgrade an old passwordless account safely."""

from getpass import getpass

from app.account_store import set_legacy_password


def main():
    username = input("Legacy account username: ").strip()
    password = getpass("New password (8+ characters): ")
    confirmation = getpass("Repeat new password: ")
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")
    if password != confirmation:
        raise SystemExit("Passwords do not match.")
    if not set_legacy_password(username, password):
        raise SystemExit("No passwordless legacy account found for that username.")
    print(f"Password set for @{username}. The account and saved recipes are preserved.")


if __name__ == "__main__":
    main()
