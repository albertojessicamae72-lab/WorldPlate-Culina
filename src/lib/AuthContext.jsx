import { createContext, useContext, useMemo, useState } from "react";
import { setAccountIdentity } from "@/lib/community-profile";
import { continueWithAccount, createAccount, findAccount, getSessionToken, resetAccountPassword, revokeAccountSession } from "@/lib/accounts-api";

const AuthContext = createContext(null);
const SESSION_KEY = "culina:local-session";

function readSession() {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    const user = value ? JSON.parse(value) : null;
    return user?.username && user?.token ? user : null;
  } catch {
    return null;
  }
}

const asUser = (account) => ({ ...account, full_name: account.displayName, name: account.displayName, email: "" });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const setSession = (account, token) => {
    const accountUser = asUser(account);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...accountUser, token }));
      localStorage.setItem("localplate:username", accountUser.displayName);
    } catch {
      // The in-memory session still works for this tab if browser storage is disabled.
    }
    setAccountIdentity(accountUser);
    setUser(accountUser);
    return accountUser;
  };

  const login = async (username, password) => { const result = await findAccount(username, password); return setSession(result.account, result.token); };
  const enter = async (nameOrUsername, password) => { const result = await continueWithAccount(nameOrUsername, password); setSession(result.account, result.token); return { created: result.created }; };
  const register = async (displayName, password, interests, recoveryQuestion, recoveryAnswer) => { const result = await createAccount(displayName, password, interests, recoveryQuestion, recoveryAnswer); return setSession(result.account, result.token); };
  const recoverPassword = (username, question, answer, newPassword) => resetAccountPassword(username, question, answer, newPassword);
  const updateUser = (account) => setSession(account, getSessionToken());

  const logout = async (shouldRedirect = true) => {
    try { await revokeAccountSession(); } catch { /* Clear local session even if server is offline. */ }
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem("culina:identity");
    } catch {
      // The in-memory session will still be cleared.
    }
    setAccountIdentity(null);
    setUser(null);
    if (shouldRedirect && typeof window !== "undefined") window.location.assign("/login");
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authChecked: true,
    authError: null,
    appPublicSettings: null,
    login,
    enter,
    register,
    recoverPassword,
    updateUser,
    logout,
    checkUserAuth: async () => Boolean(user),
    checkAppState: async () => Boolean(user),
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
