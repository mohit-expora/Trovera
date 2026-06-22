"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { useAuthStore } from "@/store/authStore";
import type { UserProfile } from "@/types/user";
import type { ApiSuccess } from "@/types/api";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, logout, setLoading } = useAuthStore();

  const { data, error, mutate } = useSWR<ApiSuccess<UserProfile>>(
    isAuthenticated ? "/auth/me" : null,
    { revalidateOnFocus: false, revalidateOnMount: false }
  );

  useEffect(() => {
    if (data?.data) {
      // Keep store in sync with server profile
      useAuthStore.setState({ user: data.data });
    }
  }, [data]);

  useEffect(() => {
    if (error?.response?.status === 401) {
      logout();
    }
  }, [error, logout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    refreshUser: mutate,
    logout,
  };
}
