import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  // If Google returned an error (e.g. user denied access)
  if (oauthError) {
    return NextResponse.redirect(`${baseUrl}/en/login?error=oauth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/en/login?error=invalid_callback`);
  }

  // ── CSRF: validate state against stored cookie ───────────────────────────
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${baseUrl}/en/login?error=invalid_state`);
  }

  // Clear the state cookie immediately
  cookieStore.delete("oauth_state");

  // ── Exchange code with backend ───────────────────────────────────────────
  let accessToken: string;

  try {
    const backendResponse = await fetch(`${API_URL}/auth/google/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirect_uri: `${baseUrl}/api/auth/callback`,
      }),
    });

    if (!backendResponse.ok) {
      const body = await backendResponse.json().catch(() => ({}));
      console.error("[OAuth callback] Backend error:", body);
      return NextResponse.redirect(`${baseUrl}/en/login?error=backend_error`);
    }

    const body = await backendResponse.json();
    accessToken = body?.data?.access_token;

    if (!accessToken) {
      console.error("[OAuth callback] No access_token in backend response:", body);
      return NextResponse.redirect(`${baseUrl}/en/login?error=no_token`);
    }
  } catch (err) {
    console.error("[OAuth callback] Network error contacting backend:", err);
    return NextResponse.redirect(`${baseUrl}/en/login?error=network_error`);
  }

  // ── Store token in a short-lived cookie for the client to pick up ─────────
  // The client-side app should read this cookie on mount, call setUser(), then
  // delete the cookie.
  const response = NextResponse.redirect(`${baseUrl}/en/dashboard`);

  response.cookies.set("auth_token", accessToken, {
    httpOnly: false, // must be readable by client-side JS to hydrate the store
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5, // 5 minutes — client picks it up immediately
    path: "/",
  });

  return response;
}
