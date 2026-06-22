import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import axiosRetry from "axios-retry";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send cookies (refresh token)
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

// ── Request interceptor: attach Bearer token ───────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Token storage (in-memory, not localStorage for security) ──────────────
let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ── Response interceptor: auto-refresh on 401 ─────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post("/auth/refresh");
        const newToken = data.data?.access_token;
        if (newToken) {
          setAccessToken(newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

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
