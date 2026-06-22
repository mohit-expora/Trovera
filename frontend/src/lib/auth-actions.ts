"use server";

import { cookies } from "next/headers";

const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

export async function getServerUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function serverFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {}),
      },
      next: { revalidate: 60, ...((options as any)?.next ?? {}) },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data as T) ?? null;
  } catch {
    return null;
  }
}
