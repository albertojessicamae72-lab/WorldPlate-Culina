# Password recovery

New accounts choose a favorite-color or favorite-animal question during
registration. The answer is normalized and stored as a salted PBKDF2 hash; it
is never returned by account APIs. Password recovery uses the username and
matching question/answer, accepts a new password, and revokes existing sessions.
Five failed attempts for a username pause recovery for 15 minutes.

This is a lightweight recovery option, not a substitute for email-based
verification: favorite colors and animals can be guessed or discovered. The UI
warns users not to choose a publicly known answer. For public production use,
add verified email recovery and stronger abuse controls. Accounts created
before recovery questions were added must use another account-owner-supported
reset process because they do not have a recovery answer on file.
