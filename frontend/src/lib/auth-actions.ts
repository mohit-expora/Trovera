"use server";

import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

function buildCookieHeader(): string {
  const cookieStore = cookies();
  return cookieStore.getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

export async function getServerUser() {
  const cookieHeader = buildCookieHeader();

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Cookie: cookieHeader },
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
  const cookieHeader = buildCookieHeader();

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
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
