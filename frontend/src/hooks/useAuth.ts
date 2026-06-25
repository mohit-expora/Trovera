"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import { useAuthStore } from "@/store/authStore";
import type { UserProfile } from "@/types/user";
import type { ApiSuccess } from "@/types/api";

const LOCALES = ["en", "hi", "es", "fr"];

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, logout, setLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Always call /auth/me on every mount — validates the session cookie and
  // keeps the store in sync with the latest server-side profile (role changes, etc.)
  const { data, error, isLoading: swrLoading, mutate } = useSWR<ApiSuccess<UserProfile>>(
    "/auth/me",
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      shouldRetryOnError: false,
    }
  );

  useEffect(() => {
    if (swrLoading) return;

    if (data?.data) {
      setUser(data.data);
    } else if (error) {
      if (error?.response?.status === 401) {
        logout();
        const segments = pathname?.split("/") ?? [];
        const locale = LOCALES.includes(segments[1]) ? segments[1] : "en";
        router.replace(`/${locale}/login`);
      } else {
        // Network error or 5xx — stop loading but keep existing state
        setLoading(false);
      }
    }
  }, [data, error, swrLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || swrLoading,
    refreshUser: mutate,
    logout,
  };
}
