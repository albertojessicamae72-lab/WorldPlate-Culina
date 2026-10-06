const USER_KEY = "localplate:username";
const ANON_KEY = "localplate:anon";
const IDENTITY_KEY = "culina:identity";

function read(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode); identity stays in-memory only */
  }
}

/** The display name the visitor contributes under, if they've set one. */
export function getCurrentUser() {
  return read(USER_KEY);
}

/** Persist a contributor name as this browser's identity. Returns the stored name. */
export function setCurrentUser(name) {
  const value = (name || "").trim();
  if (value) write(USER_KEY, value);
  return value;
}

/** A stable per-browser id, even for visitors who never enter a name. */
function anonId() {
  let id = read(ANON_KEY);
  if (!id) {
    id = `guest-${Math.random().toString(36).slice(2, 10)}`;
    write(ANON_KEY, id);
  }
  return id;
}

/** Identity used for likes and ownership checks: the name if set, else the anon id. */
export function getViewerId() {
  return read(IDENTITY_KEY) || getCurrentUser() || anonId();
}

/**
 * Resolve the owner recorded on a new post. If the contributor typed a name we
 * adopt it as this browser's identity; otherwise fall back to the stable anon id.
 */
export function resolveOwner(contributorName) {
  setCurrentUser(contributorName);
  return read(IDENTITY_KEY) || anonId();
}
