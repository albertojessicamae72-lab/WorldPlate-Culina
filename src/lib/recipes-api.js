import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = typeof body.detail === "string" ? body.detail : null;
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export function useRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: () => request("/api/recipes"),
  });
}

export function useRecipe(recipeId) {
  return useQuery({
    queryKey: ["recipes", recipeId],
    queryFn: () => request(`/api/recipes/${encodeURIComponent(recipeId)}`),
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

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipeId) =>
      request(`/api/recipes/${encodeURIComponent(recipeId)}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useDeleteAdaptation(recipeId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (countryCode) =>
      request(
        `/api/recipes/${encodeURIComponent(recipeId)}/adaptations/${encodeURIComponent(countryCode)}`,
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
    queryFn: () => request(`/api/recipes/${encodeURIComponent(recipeId)}/comments`),
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

export function useRating(recipeId) {
  return useQuery({
    queryKey: ["rating", recipeId],
    queryFn: () => request(`/api/recipes/${encodeURIComponent(recipeId)}/rating`),
    enabled: Boolean(recipeId),
  });
}

export function useRateRecipe(recipeId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stars) =>
      request(`/api/recipes/${encodeURIComponent(recipeId)}/rating`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ stars }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rating", recipeId] });
    },
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
