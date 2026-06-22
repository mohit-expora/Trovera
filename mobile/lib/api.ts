import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/store/authStore";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach token to every request
axiosInstance.interceptors.request.use(async (config) => {
  const token =
    useAuthStore.getState().accessToken ??
    (await SecureStore.getItemAsync("trovera_token"));
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 → clear auth and let the root layout redirect to login
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("trovera_token");
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

function extractData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const api = {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const res = await axiosInstance.get<{ data: T }>(url, { params });
    return extractData(res);
  },

  async getPaginated<T>(
    url: string,
    params?: Record<string, unknown>
  ): Promise<{ data: T[]; meta: { page: number; page_size: number; total: number; total_pages: number } }> {
    const res = await axiosInstance.get<{
      data: T[];
      meta: { page: number; page_size: number; total: number; total_pages: number };
    }>(url, { params });
    return { data: res.data.data, meta: res.data.meta };
  },

  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await axiosInstance.post<{ data: T }>(url, body, config);
    return extractData(res);
  },

  async patch<T>(url: string, body?: unknown): Promise<T> {
    const res = await axiosInstance.patch<{ data: T }>(url, body);
    return extractData(res);
  },

  async delete<T = void>(url: string): Promise<T> {
    const res = await axiosInstance.delete<{ data: T }>(url);
    return extractData(res);
  },
};

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { error?: { message?: string } })?.error?.message ??
      error.message ??
      "Network error"
    );
  }
  return "An unexpected error occurred";
}
