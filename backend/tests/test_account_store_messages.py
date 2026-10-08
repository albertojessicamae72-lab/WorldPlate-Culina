import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app import account_store
from app.models import LocalTwist, LocalTwistVote
from app.routers.local_twists import _check_tips_enabled
from app.routers.recipes import restore_user_contributions
from app.seed import RECIPES, get_recipe
from fastapi import HTTPException


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
                [
                    ("a", "alice", "Alice", now),
                    ("b", "bob", "Bob", now),
                    ("c", "carol", "Carol", now),
                ],
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
        RECIPES[:] = [
            recipe for recipe in RECIPES if recipe.id != "persisted-recipe"
        ]
        account_store.delete_recipe_contribution("persisted-recipe")
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

    def test_community_tip_settings_are_independent_and_persist(self):
        account_store.set_community_tips_enabled("recipe-1", "", True)
        account_store.set_community_tips_enabled("recipe-1", "PH", False)

        self.assertTrue(account_store.community_tips_enabled("recipe-1"))
        self.assertFalse(account_store.community_tips_enabled("recipe-1", "PH"))
        account_store.initialize()
        self.assertTrue(account_store.community_tips_enabled("recipe-1"))
        self.assertFalse(account_store.community_tips_enabled("recipe-1", "PH"))

    def test_disabled_tips_reject_submissions_and_only_helpful_votes_are_valid(self):
        with self.assertRaises(HTTPException) as raised:
            _check_tips_enabled("recipe-1", "")
        self.assertEqual(raised.exception.status_code, 403)

        account_store.set_community_tips_enabled("recipe-1", "", True)
        _check_tips_enabled("recipe-1", "")
        self.assertEqual(LocalTwistVote(value=1).value, 1)
        with self.assertRaises(ValueError):
            LocalTwistVote(value=-1)

    def test_user_recipe_and_adaptation_contributions_survive_database_reinitialization(self):
        recipe = {
            "id": "persisted-recipe",
            "name": "Persisted Dish",
            "cuisine": "egyptian",
            "owner": "a",
            "country": "EG",
            "originalLanguage": "ar",
            "ingredients": [],
            "preparation": "",
            "adaptations": [],
        }
        adaptation = {
            "id": "persisted-recipe-ph",
            "destinationCountry": "PH",
            "owner": "b",
            "title": "Local version",
        }
        account_store.save_recipe_contribution("persisted-recipe", "a", recipe)
        account_store.save_adaptation_contribution(
            "persisted-recipe", "PH", "b", adaptation
        )

        account_store.initialize()
        restore_user_contributions()
        restored_recipe = get_recipe("persisted-recipe")

        self.assertIsNotNone(restored_recipe)
        self.assertEqual(restored_recipe.name, "Persisted Dish")
        self.assertEqual(
            restored_recipe.adaptations[0].destinationCountry, "PH"
        )
        self.assertEqual(
            account_store.list_adaptation_contributions(),
            [{
                "recipeId": "persisted-recipe",
                "countryCode": "PH",
                "data": adaptation,
            }],
        )

        account_store.delete_recipe_contribution("persisted-recipe")
        self.assertEqual(account_store.list_recipe_contributions(), [])
        self.assertEqual(account_store.list_adaptation_contributions(), [])

    def test_tip_helpful_vote_is_counted_and_toggleable(self):
        tip = account_store.create_local_tip("recipe-1", "PH", "a", "Rest the dish before serving.")

        voted = account_store.vote_local_tip(tip["id"], "b", 1, "recipe-1", "PH")
        self.assertEqual(voted["helpfulVotes"], 1)
        response_tip = LocalTwist(**voted)
        self.assertEqual(response_tip.username, "alice")
        self.assertEqual(response_tip.helpfulVotes, 1)

        self.assertIsNone(
            account_store.vote_local_tip(tip["id"], "a", 1, "recipe-1", "PH")
        )
        removed = account_store.vote_local_tip(tip["id"], "b", 1, "recipe-1", "PH")
        self.assertEqual(removed["helpfulVotes"], 0)

    def test_recipe_and_adaptation_tips_are_separate_and_helpful_tips_rank_first(self):
        recipe_tip = account_store.create_local_tip(
            "recipe-1", "", "a", "Recipe-only tip"
        )
        adaptation_tip = account_store.create_local_tip(
            "recipe-1", "PH", "a", "Adaptation-only tip"
        )
        newest_unvoted = account_store.create_local_tip(
            "recipe-1", "", "a", "A newer recipe tip"
        )
        with account_store._connect() as connection:
            connection.execute(
                "UPDATE local_tips SET created_at='2026-10-08T12:00:00+00:00' WHERE id=?",
                (newest_unvoted["id"],),
            )
        account_store.vote_local_tip(recipe_tip["id"], "b", 1, "recipe-1", "")
        account_store.vote_local_tip(recipe_tip["id"], "c", 1, "recipe-1", "")

        recipe_tips = account_store.list_local_tips("recipe-1", "", "b")
        adaptation_tips = account_store.list_local_tips("recipe-1", "PH", "b")

        self.assertEqual(
            [item["id"] for item in recipe_tips["items"]],
            [recipe_tip["id"], newest_unvoted["id"]],
        )
        self.assertEqual(
            [item["text"] for item in adaptation_tips["items"]],
            ["Adaptation-only tip"],
        )
        self.assertEqual(recipe_tips["items"][0]["helpfulVotes"], 2)
        self.assertFalse(recipe_tips["hasMore"])

    def test_local_tips_page_reports_more_and_keeps_helpful_order(self):
        first_tip = account_store.create_local_tip(
            "recipe-1", "", "a", "First recipe tip"
        )
        second_tip = account_store.create_local_tip(
            "recipe-1", "", "a", "Second recipe tip"
        )
        account_store.vote_local_tip(second_tip["id"], "b", 1, "recipe-1", "")

        first_page = account_store.list_local_tips(
            "recipe-1", "", "c", limit=1, offset=0
        )
        second_page = account_store.list_local_tips(
            "recipe-1", "", "c", limit=1, offset=1
        )

        self.assertEqual(first_page["items"][0]["id"], second_tip["id"])
        self.assertTrue(first_page["hasMore"])
        self.assertEqual(second_page["items"][0]["id"], first_tip["id"])
        self.assertFalse(second_page["hasMore"])

    def test_only_tip_author_can_edit_or_delete_tip(self):
        tip = account_store.create_local_tip("recipe-1", "", "a", "My first cooking tip")

        self.assertIsNone(
            account_store.update_local_tip(
                tip["id"], "recipe-1", "", "b", "Changed by another member"
            )
        )
        self.assertIsNone(
            account_store.update_local_tip(
                tip["id"], "other-recipe", "", "a", "Wrong recipe scope"
            )
        )
        edited = account_store.update_local_tip(
            tip["id"], "recipe-1", "", "a", "My corrected cooking tip"
        )
        self.assertEqual(edited["text"], "My corrected cooking tip")
        self.assertFalse(
            account_store.delete_local_tip(tip["id"], "recipe-1", "", "b")
        )
        self.assertTrue(
            account_store.delete_local_tip(tip["id"], "recipe-1", "", "a")
        )
        self.assertEqual(
            account_store.list_local_tips("recipe-1", "", "b")["items"], []
        )


if __name__ == "__main__":
    unittest.main()
