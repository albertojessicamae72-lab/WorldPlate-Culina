import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app import account_store


class PersistentMessageTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.original_database_path = account_store.DATABASE_PATH
        account_store.DATABASE_PATH = Path(self.temp_dir.name) / "culina.sqlite3"
        account_store.initialize()
        now = datetime.now(timezone.utc).isoformat()
        with account_store._connect() as connection:
            connection.executemany(
                "INSERT INTO accounts (id,username,display_name,created_at) VALUES (?,?,?,?)",
                [("a", "alice", "Alice", now), ("b", "bob", "Bob", now)],
            )
            connection.execute(
                "INSERT INTO friendships (requester_id,addressee_id,status,created_at) VALUES (?,?,?,?)",
                ("a", "b", "accepted", now),
            )
            connection.execute(
                "INSERT INTO conversations (id,account_a,account_b,created_at) VALUES (?,?,?,?)",
                ("conversation", "a", "b", now),
            )

    def tearDown(self):
        account_store.DATABASE_PATH = self.original_database_path
        self.temp_dir.cleanup()

    def test_messages_persist_and_load_in_pages_of_100(self):
        for index in range(205):
            account_store.send_message("a", "conversation", f"message-{index}")

        newest = account_store.list_messages("a", "conversation")
        self.assertEqual(len(newest["items"]), 100)
        self.assertTrue(newest["hasMore"])
        self.assertEqual(newest["items"][0]["body"], "message-105")
        self.assertEqual(newest["items"][-1]["body"], "message-204")

        account_store.initialize()
        older = account_store.list_messages("a", "conversation", newest["items"][0]["id"])
        oldest = account_store.list_messages("a", "conversation", older["items"][0]["id"])
        messages = oldest["items"] + older["items"] + newest["items"]

        self.assertEqual(len(messages), 205)
        self.assertEqual([message["body"] for message in messages], [f"message-{i}" for i in range(205)])
        self.assertFalse(oldest["hasMore"])
        self.assertEqual(account_store.list_conversations("a")[0]["lastMessage"], "message-204")

    def test_old_messages_do_not_expire(self):
        sent = account_store.send_message("a", "conversation", "still here")
        old_timestamp = (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()
        with account_store._connect() as connection:
            connection.execute("UPDATE messages SET created_at=? WHERE id=?", (old_timestamp, sent["id"]))

        account_store.initialize()
        result = account_store.list_messages("a", "conversation")

        self.assertEqual([message["body"] for message in result["items"]], ["still here"])

    def test_messages_are_deleted_only_after_both_users_delete_conversation(self):
        account_store.send_message("a", "conversation", "keep until both delete")

        self.assertTrue(account_store.hide_conversation("a", "conversation"))
        self.assertEqual(len(account_store.list_messages("b", "conversation")["items"]), 1)

        self.assertTrue(account_store.hide_conversation("b", "conversation"))
        self.assertIsNone(account_store.list_messages("a", "conversation"))
        with account_store._connect() as connection:
            count = connection.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
        self.assertEqual(count, 0)


if __name__ == "__main__":
    unittest.main()
