const IDENTITY_KEY = "culina:identity";

export function setAccountIdentity(user) {
  try {
    if (user) localStorage.setItem(IDENTITY_KEY, user.id || user.username || "");
    else localStorage.removeItem(IDENTITY_KEY);
  } catch {
    // Identity remains available through the in-memory auth context.
  }
}
