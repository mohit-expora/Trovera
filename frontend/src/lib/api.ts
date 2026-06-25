import axios, { type AxiosError, type AxiosInstance } from "axios";
import axiosRetry from "axios-retry";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send session cookie on every request
  timeout: 30000,
});

// ── Retry configuration ────────────────────────────────────────────────────
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status === 503,
  onRetry: (retryCount, error) => {
    console.warn(`[API] Retry ${retryCount} for ${error.config?.url}`);
  },
});

// ── Typed API helpers ──────────────────────────────────────────────────────
export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }).then((r) => r.data),

  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((r) => r.data),

  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((r) => r.data),

  delete: <T>(url: string) => apiClient.delete<T>(url).then((r) => r.data),

  upload: <T>(url: string, formData: FormData) =>
    apiClient
      .post<T>(url, formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data),
};
