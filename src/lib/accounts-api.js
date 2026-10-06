import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const SESSION_KEY = "culina:local-session";
export function getSessionToken() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null")?.token || ""; }
  catch { return ""; }
}

async function accountRequest(path, options) {
  let response;
  try {
    response = await fetch(`/api/accounts${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(getSessionToken() ? { Authorization: `Bearer ${getSessionToken()}` } : {}), ...options?.headers },
    });
  } catch {
    throw new Error("Couldn't reach the local community server. Start the FastAPI service and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Couldn't complete that account request. Please try again.");
  }
  return data;
}

export const createAccount = (displayName, password, interests = [], recoveryQuestion, recoveryAnswer) => accountRequest("/register", {
  method: "POST",
  body: JSON.stringify({ displayName, password, interests, recoveryQuestion, recoveryAnswer }),
});

export const resetAccountPassword = (username, recoveryQuestion, recoveryAnswer, newPassword) => accountRequest("/recover-password", {
  method: "POST",
  body: JSON.stringify({ username, recoveryQuestion, recoveryAnswer, newPassword }),
});

export const continueWithAccount = (nameOrUsername, password, interests = []) => accountRequest("/continue", {
  method: "POST",
  body: JSON.stringify({ displayName: nameOrUsername, password, interests }),
});

export const findAccount = (username, password) => accountRequest("/login", {
  method: "POST",
  body: JSON.stringify({ username, password }),
});

export const revokeAccountSession = () => accountRequest("/logout", { method: "POST" });

export const saveAccountProfile = (username, profile) => accountRequest(`/${encodeURIComponent(username)}`, {
  method: "PATCH",
  body: JSON.stringify(profile),
});

export function useSearchAccounts(query) {
  const normalized = query.trim();
  return useQuery({
    queryKey: ["accountSearch", normalized],
    queryFn: () => accountRequest(`/search?q=${encodeURIComponent(normalized)}`),
    enabled: normalized.length >= 2,
  });
}

export function usePublicAccount(username) {
  return useQuery({
    queryKey: ["publicAccount", username],
    queryFn: () => accountRequest(`/public/${encodeURIComponent(username)}`),
    enabled: Boolean(username),
  });
}

export function useAccountTips(username) {
  return useQuery({
    queryKey: ["accountTips", username],
    queryFn: () => accountRequest(`/public/${encodeURIComponent(username)}/tips`),
    enabled: Boolean(username),
  });
}

export function useAccountSavedRecipes(username) {
  return useQuery({
    queryKey: ["accountSavedRecipes", username],
    queryFn: async () => (await accountRequest(`/${encodeURIComponent(username)}/saved`)).recipeIds || [],
    enabled: Boolean(username),
  });
}

export function useToggleAccountSavedRecipe(username) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipeId) => accountRequest(`/${encodeURIComponent(username)}/saved/${encodeURIComponent(recipeId)}/toggle`, { method: "POST" }),
    onSuccess: (data) => queryClient.setQueryData(["accountSavedRecipes", username], data.recipeIds || []),
  });
}

export function useAccountMealPlans(username) {
  return useQuery({
    queryKey: ["accountMealPlans", username],
    queryFn: async () => accountRequest(`/${encodeURIComponent(username)}/meal-plans`),
    enabled: Boolean(username),
  });
}

export function useCreateMealPlan(username) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan) => accountRequest(`/${encodeURIComponent(username)}/meal-plans`, {
      method: "POST",
      body: JSON.stringify(plan),
    }),
    onSuccess: (_data, plan) => {
      queryClient.invalidateQueries({ queryKey: ["accountMealPlans", username] });
      queryClient.invalidateQueries({ queryKey: ["mealPlanCount", plan.recipeId, plan.adaptationCountry || ""] });
    },
  });
}

export function useDeleteMealPlan(username) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId) => accountRequest(`/${encodeURIComponent(username)}/meal-plans/${encodeURIComponent(planId)}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountMealPlans", username] });
      queryClient.invalidateQueries({ queryKey: ["mealPlanCount"] });
    },
  });
}

export function useFriends() {
  return useQuery({ queryKey: ["friends"], queryFn: () => accountRequest("/friends") });
}
export function useFriendAction(action) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ username }) => accountRequest(`/friends/${encodeURIComponent(username)}${action === "accept" ? "/accept" : ""}`, { method: action === "remove" ? "DELETE" : "POST" }), onSuccess: () => { client.invalidateQueries({ queryKey: ["friends"] }); client.invalidateQueries({ queryKey: ["conversations"] }); } });
}
export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => accountRequest("/conversations"),
    refetchInterval: () => document.visibilityState === "visible" ? 15000 : false,
    retry: 1,
    refetchOnWindowFocus: true,
  });
}
export function useStartConversation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (username) => accountRequest("/conversations", { method: "POST", body: JSON.stringify({ username }) }), onSuccess: () => client.invalidateQueries({ queryKey: ["conversations"] }) });
}
export function useMessages(conversationId) {
  const latestQuery = useQuery({
    queryKey: ["messages", conversationId, "latest"],
    queryFn: () => accountRequest(`/conversations/${encodeURIComponent(conversationId)}/messages`),
    enabled: Boolean(conversationId),
    refetchInterval: () => document.visibilityState === "visible" ? 8000 : false,
    retry: 1,
    refetchOnWindowFocus: true,
  });
  const historyQuery = useInfiniteQuery({
    queryKey: ["messages", conversationId, "history"],
    queryFn: ({ pageParam }) => accountRequest(
      `/conversations/${encodeURIComponent(conversationId)}/messages?before=${encodeURIComponent(pageParam)}`,
    ),
    initialPageParam: latestQuery.data?.items[0]?.id,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.items[0]?.id : undefined,
    enabled: false,
  });
  return {
    ...latestQuery,
    historyPages: historyQuery.data?.pages || [],
    hasOlderMessages: historyQuery.data ? historyQuery.hasNextPage : latestQuery.data?.hasMore,
    isLoadingOlderMessages: historyQuery.isFetchingNextPage,
    historyError: historyQuery.error,
    loadOlderMessages: () => historyQuery.fetchNextPage(),
  };
}
export function useSendMessage(conversationId) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (body) => accountRequest(`/conversations/${encodeURIComponent(conversationId)}/messages`, { method: "POST", body: JSON.stringify({ body }) }), onSuccess: () => { client.invalidateQueries({ queryKey: ["messages", conversationId, "latest"] }); client.invalidateQueries({ queryKey: ["conversations"] }); } });
}
export function useDeleteConversation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id) => accountRequest(`/conversations/${encodeURIComponent(id)}`, { method: "DELETE" }), onSuccess: () => client.invalidateQueries({ queryKey: ["conversations"] }) });
}
