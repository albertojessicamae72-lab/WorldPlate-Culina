import unittest

from app.account_store import _PostgresConnection


class PostgresQueryCompatibilityTests(unittest.TestCase):
    def test_case_insensitive_account_lookup_and_placeholders(self):
        statement = _PostgresConnection._prepare(
            "SELECT * FROM accounts WHERE username = ? COLLATE NOCASE"
        )
        self.assertEqual(
            statement,
            "SELECT * FROM accounts WHERE LOWER(username) = LOWER(%s)",
        )

    def test_case_insensitive_search_and_sort(self):
        statement = _PostgresConnection._prepare(
            "SELECT id FROM accounts WHERE display_name LIKE ? COLLATE NOCASE "
            "ORDER BY display_name COLLATE NOCASE LIMIT ?"
        )
        self.assertEqual(
            statement,
            "SELECT id FROM accounts WHERE display_name ILIKE %s "
            "ORDER BY LOWER(display_name) LIMIT %s",
        )

    def test_ignore_conflicts_uses_postgres_syntax(self):
        statement = _PostgresConnection._prepare(
            "INSERT OR IGNORE INTO friendships VALUES (?, ?, 'pending', ?)"
        )
        self.assertEqual(
            statement,
            "INSERT INTO friendships VALUES (%s, %s, 'pending', %s) "
            "ON CONFLICT DO NOTHING",
        )


if __name__ == "__main__":
    unittest.main()
