"use client";

import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import type { AxiosError } from "axios";
import { api } from "./api";

export const swrFetcher = <T = unknown>(url: string): Promise<T> =>
  api.get<T>(url) as Promise<T>;

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        dedupingInterval: 30_000,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        errorRetryCount: 3,
        onErrorRetry(error: AxiosError, key, config, revalidate, { retryCount }) {
          const status = error.response?.status;
          // Don't retry on auth/not-found errors
          if (status === 401 || status === 403 || status === 404) return;
          if (retryCount >= 3) return;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30_000);
          setTimeout(() => revalidate({ retryCount }), delay);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
