import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth is not configured." },
      { status: 500 }
    );
  }

  // Generate a random state value for CSRF protection
  const state = randomUUID();

  // Store state in a short-lived, HttpOnly cookie so the callback can validate it
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/auth/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(googleAuthUrl);
}
