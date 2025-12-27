"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/client";
import { queryKeys } from "@/lib/query-keys";

export function useSignIn() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: { login: string; password: string }) => {
      return await apiClient.auth.postApiAuthSignIn(credentials);
    },

    onSuccess: (data) => {
      // Update session cache
      queryClient.setQueryData(queryKeys.auth.session(), data.user);

      // Navigate
      router.push("/home");
      router.refresh();
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      username: string;
      password: string;
      displayName?: string;
      turnstileToken: string;
    }) => {
      return await apiClient.auth.postApiAuthSignUp(data);
    },

    onSuccess: (data) => {
      // Update session cache
      queryClient.setQueryData(queryKeys.auth.session(), data.user);

      // Navigate
      router.push("/home");
      router.refresh();
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      return await apiClient.auth.postApiAuthSignOut();
    },

    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();

      // Navigate to sign-in
      router.push("/sign-in");
    },
  });
}
