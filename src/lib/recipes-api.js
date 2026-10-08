import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RECIPES, getRecipe } from "@/data/recipes";
import { getSessionToken } from "@/lib/accounts-api";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function request(url, options) {
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: { ...(getSessionToken() ? { Authorization: `Bearer ${getSessionToken()}` } : {}), ...options?.headers },
    });
  } catch {
    const error = new Error("The community service could not be reached. Please try again later.");
    error.status = 0;
    throw error;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = typeof body.detail === "string" ? body.detail : null;
    const message = detail || (res.status === 404
      ? "The community service is not available yet. Please try again later."
      : `The request could not be completed (${res.status}). Please try again.`);
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return res.status === 204 ? null : res.json();
}

const usePublicFallback = (error) => error?.status === 404 || error?.status === 0;

export function useRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      try {
        return await request("/api/recipes");
      } catch (error) {
        if (usePublicFallback(error)) return RECIPES;
        throw error;
      }
    },
  });
}

export function useRecipe(recipeId) {
  return useQuery({
    queryKey: ["recipes", recipeId],
    queryFn: async () => {
      try {
        return await request(`/api/recipes/${encodeURIComponent(recipeId)}`);
      } catch (error) {
        if (usePublicFallback(error)) return getRecipe(recipeId) || null;
        throw error;
      }
    },
    enabled: Boolean(recipeId),
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      request("/api/recipes", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useCreateAdaptation(recipeId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      request(`/api/recipes/${encodeURIComponent(recipeId)}/adaptations`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

function useSetCommunityTips(path, recipeId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (allowCommunityTips) =>
      request(path, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ allowCommunityTips }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipes", recipeId] });
    },
  });
}

export function useSetRecipeCommunityTips(recipeId) {
  return useSetCommunityTips(
    `/api/recipes/${encodeURIComponent(recipeId)}/community-tips`,
    recipeId,
  );
}

export function useSetAdaptationCommunityTips(recipeId, countryCode) {
  return useSetCommunityTips(
    `/api/recipes/${encodeURIComponent(recipeId)}/adaptations/${encodeURIComponent(countryCode)}/community-tips`,
    recipeId,
  );
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, owner }) =>
      request(
        `/api/recipes/${encodeURIComponent(recipeId)}?owner=${encodeURIComponent(owner)}`,
        { method: "DELETE" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useDeleteAdaptation(recipeId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ countryCode, owner }) =>
      request(
        `/api/recipes/${encodeURIComponent(recipeId)}/adaptations/${encodeURIComponent(countryCode)}?owner=${encodeURIComponent(owner)}`,
        { method: "DELETE" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useComments(recipeId) {
  return useQuery({
    queryKey: ["comments", recipeId],
    queryFn: async () => {
      try {
        return await request(`/api/recipes/${encodeURIComponent(recipeId)}/comments`);
      } catch (error) {
        if (usePublicFallback(error)) return [];
        throw error;
      }
    },
    enabled: Boolean(recipeId),
  });
}

export function useAddComment(recipeId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      request(`/api/recipes/${encodeURIComponent(recipeId)}/comments`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", recipeId] });
    },
  });
}

export function useDeleteComment(recipeId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId) =>
      request(
        `/api/recipes/${encodeURIComponent(recipeId)}/comments/${encodeURIComponent(commentId)}`,
        { method: "DELETE" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", recipeId] });
    },
  });
}

export function useLike(recipeId, user) {
  return useQuery({
    queryKey: ["like", recipeId, user],
    queryFn: async () => {
      try {
        return await request(`/api/recipes/${encodeURIComponent(recipeId)}/like?user=${encodeURIComponent(user)}`);
      } catch (error) {
        if (usePublicFallback(error)) return { liked: false, count: 0 };
        throw error;
      }
    },
    enabled: Boolean(recipeId && user),
  });
}

export function useToggleLike(recipeId, user) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request(`/api/recipes/${encodeURIComponent(recipeId)}/like`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ user }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["like", recipeId, user], data);
      queryClient.invalidateQueries({ queryKey: ["likers", recipeId] });
    },
  });
}

export function useLikers(recipeId, enabled) {
  return useQuery({
    queryKey: ["likers", recipeId],
    queryFn: () => request(`/api/recipes/${encodeURIComponent(recipeId)}/likers`),
    enabled: Boolean(recipeId && enabled),
  });
}

export function useLocalTwists(recipeId, countryCode, accountId) {
  const tipsPath = countryCode
    ? `/adaptations/${encodeURIComponent(countryCode)}/twists`
    : "/tips";
  return useInfiniteQuery({
    queryKey: ["localTwists", recipeId, countryCode, accountId],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      try {
        const params = new URLSearchParams({ offset: String(pageParam), limit: "8" });
        return await request(`/api/recipes/${encodeURIComponent(recipeId)}${tipsPath}?${params}`);
      } catch (error) {
        if (usePublicFallback(error)) return { items: [], hasMore: false };
        throw error;
      }
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore
        ? pages.reduce((total, page) => total + page.items.length, 0)
        : undefined,
    enabled: Boolean(recipeId && accountId),
  });
}

export function useCreateLocalTwist(recipeId, countryCode, accountId) {
  const queryClient = useQueryClient();
  const tipsPath = countryCode
    ? `/adaptations/${encodeURIComponent(countryCode)}/twists`
    : "/tips";
  return useMutation({
    mutationFn: (payload) =>
      request(
        `/api/recipes/${encodeURIComponent(recipeId)}${tipsPath}`,
        {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localTwists", recipeId, countryCode] });
      queryClient.invalidateQueries({ queryKey: ["accountTips"] });
    },
  });
}

export function useUpdateLocalTwist(recipeId, countryCode, accountId) {
  const queryClient = useQueryClient();
  const tipPath = countryCode
    ? `/adaptations/${encodeURIComponent(countryCode)}/twists`
    : "/tips";
  return useMutation({
    mutationFn: ({ twistId, text }) =>
      request(
        `/api/recipes/${encodeURIComponent(recipeId)}${tipPath}/${encodeURIComponent(twistId)}`,
        {
          method: "PATCH",
          headers: JSON_HEADERS,
          body: JSON.stringify({ text }),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localTwists", recipeId, countryCode] });
      queryClient.invalidateQueries({ queryKey: ["accountTips"] });
    },
  });
}

export function useDeleteLocalTwist(recipeId, countryCode, accountId) {
  const queryClient = useQueryClient();
  const tipPath = countryCode
    ? `/adaptations/${encodeURIComponent(countryCode)}/twists`
    : "/tips";
  return useMutation({
    mutationFn: (twistId) =>
      request(
        `/api/recipes/${encodeURIComponent(recipeId)}${tipPath}/${encodeURIComponent(twistId)}`,
        { method: "DELETE" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localTwists", recipeId, countryCode] });
      queryClient.invalidateQueries({ queryKey: ["accountTips"] });
    },
  });
}

export function useVoteLocalTwist(recipeId, countryCode, accountId) {
  const queryClient = useQueryClient();
  const tipsPath = countryCode
    ? `/adaptations/${encodeURIComponent(countryCode)}/twists`
    : "/tips";
  return useMutation({
    mutationFn: ({ twistId, value }) =>
      request(
        `/api/recipes/${encodeURIComponent(recipeId)}${tipsPath}/${encodeURIComponent(twistId)}/vote`,
        {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ value }),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localTwists", recipeId, countryCode] });
      queryClient.invalidateQueries({ queryKey: ["accountTips"] });
    },
  });
}

export function useMealPlanCount(recipeId, adaptationCountry = "") {
  return useQuery({
    queryKey: ["mealPlanCount", recipeId, adaptationCountry],
    queryFn: () => request(`/api/accounts/meal-plan-count/${encodeURIComponent(recipeId)}?adaptationCountry=${encodeURIComponent(adaptationCountry || "")}`),
    enabled: Boolean(recipeId),
  });
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : "Upload failed");
  }
  return (await res.json()).url;
}
